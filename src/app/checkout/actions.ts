"use server";

import { createClient } from "@/lib/supabase/server";
import { sendOrderConfirmation } from "@/lib/mailgun";
import { deliveryFor } from "@/lib/money";
import type { Product } from "@/lib/types";

export type IncomingLine = {
  productId: string;
  size: string | null;
  quantity: number;
};

export type CheckoutDetails = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  note: string;
};

export type PlaceOrderResult =
  | { ok: true; reference: string; emailed: boolean; emailError?: string }
  | { ok: false; error: string; needsAuth?: boolean };

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no I, L, O, 0, 1

function makeReference(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(7));
  let out = "";
  for (const byte of bytes) out += ALPHABET[byte % ALPHABET.length];
  return `VS-${out}`;
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Saves the order and emails the confirmation.
 *
 * Prices are read back from the database rather than taken from the browser,
 * so a tampered cart cannot change what an order costs.
 */
export async function placeOrder(
  details: CheckoutDetails,
  lines: IncomingLine[],
): Promise<PlaceOrderResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      needsAuth: true,
      error: "Please sign in before placing your order.",
    };
  }

  // ------------------------------------------------------------- validation

  const fullName = clean(details.fullName);
  const email = clean(details.email) || (user.email ?? "");
  const phone = clean(details.phone);
  const address = clean(details.address);
  const city = clean(details.city);
  const state = clean(details.state);
  const note = clean(details.note);

  if (fullName.length < 2) return { ok: false, error: "Enter the full name for delivery." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return { ok: false, error: "Enter a valid email address." };
  if (phone.replace(/\D/g, "").length < 10)
    return { ok: false, error: "Enter a phone number we can reach you on." };
  if (address.length < 6) return { ok: false, error: "Enter the delivery address." };
  if (city.length < 2) return { ok: false, error: "Enter the city or town." };
  if (state.length < 2) return { ok: false, error: "Enter the state." };

  if (!Array.isArray(lines) || lines.length === 0)
    return { ok: false, error: "Your cart is empty." };
  if (lines.length > 40) return { ok: false, error: "That is too many lines for one order." };

  for (const line of lines) {
    if (
      typeof line.productId !== "string" ||
      !Number.isInteger(line.quantity) ||
      line.quantity < 1 ||
      line.quantity > 20
    ) {
      return { ok: false, error: "One of the cart lines is not valid. Please reload the cart." };
    }
  }

  // ----------------------------------------------- authoritative pricing

  const productIds = [...new Set(lines.map((l) => l.productId))];
  const { data: productRows, error: productError } = await supabase
    .from("products")
    .select("*")
    .in("id", productIds);

  if (productError)
    return { ok: false, error: `Could not read the catalogue: ${productError.message}` };

  const products = new Map((productRows as Product[] | null ?? []).map((p) => [p.id, p]));

  const priced = lines.map((line) => {
    const product = products.get(line.productId);
    return { line, product };
  });

  const missing = priced.find((entry) => !entry.product);
  if (missing)
    return { ok: false, error: "A piece in your cart is no longer available. Please remove it." };

  const soldOut = priced.find((entry) => entry.product && !entry.product.in_stock);
  if (soldOut)
    return { ok: false, error: `${soldOut.product!.name} has sold out. Please remove it from your cart.` };

  const items = priced.map(({ line, product }) => ({
    product_id: product!.id,
    name: product!.name,
    size: line.size,
    image_url: product!.image_url,
    unit_price_kobo: product!.price_kobo,
    quantity: line.quantity,
  }));

  const subtotalKobo = items.reduce(
    (sum, item) => sum + item.unit_price_kobo * item.quantity,
    0,
  );
  const deliveryKobo = deliveryFor(subtotalKobo);
  const totalKobo = subtotalKobo + deliveryKobo;

  // ---------------------------------------------------------- save the order

  let orderId: string | null = null;
  let reference = "";

  for (let attempt = 0; attempt < 3 && !orderId; attempt += 1) {
    reference = makeReference();
    const { data, error } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        reference,
        email,
        full_name: fullName,
        phone,
        address,
        city,
        state,
        note: note || null,
        subtotal_kobo: subtotalKobo,
        delivery_kobo: deliveryKobo,
        total_kobo: totalKobo,
      })
      .select("id")
      .single();

    if (data) {
      orderId = data.id;
      break;
    }
    // 23505 is a duplicate reference, which is worth one more roll of the dice.
    if (error && error.code !== "23505") {
      return { ok: false, error: `Could not save your order: ${error.message}` };
    }
  }

  if (!orderId)
    return { ok: false, error: "Could not save your order. Please try again." };

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(items.map((item) => ({ ...item, order_id: orderId })));

  if (itemsError)
    return { ok: false, error: `Could not save the order lines: ${itemsError.message}` };

  // ------------------------------------------------------------ confirmation

  const mail = await sendOrderConfirmation({
    to: email,
    reference,
    fullName,
    lines: items.map((item) => ({
      name: item.name,
      size: item.size,
      quantity: item.quantity,
      unit_price_kobo: item.unit_price_kobo,
    })),
    subtotalKobo,
    deliveryKobo,
    totalKobo,
    address,
    city,
    state,
    phone,
  });

  if (mail.ok) {
    await supabase.rpc("mark_order_emailed", { p_order_id: orderId });
    return { ok: true, reference, emailed: true };
  }

  // The order is saved either way; the shop can resend the email by hand.
  console.error("Mailgun send failed", mail.error);
  return { ok: true, reference, emailed: false, emailError: mail.error };
}
