"use server";

import { createClient } from "@/lib/supabase/server";
import {
  placeOrderFor,
  type CheckoutDetails,
  type IncomingLine,
  type PlaceOrderResult,
} from "@/lib/checkout";

/** Website checkout: identifies the shopper from the auth cookie. */
export async function placeOrder(
  details: CheckoutDetails,
  lines: IncomingLine[],
): Promise<PlaceOrderResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return placeOrderFor(supabase, user, details, lines);
}
