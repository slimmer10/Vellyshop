import { formatNaira } from "@/lib/money";

type EmailLine = {
  name: string;
  size: string | null;
  quantity: number;
  unit_price_kobo: number;
};

type ConfirmationInput = {
  to: string;
  reference: string;
  fullName: string;
  lines: EmailLine[];
  subtotalKobo: number;
  deliveryKobo: number;
  totalKobo: number;
  address: string;
  city: string;
  state: string;
  phone: string;
};

const INK = "#1f1a16";
const MUTED = "#7b7169";
const CLAY = "#9c3d2e";
const PAPER = "#faf7f3";
const LINE = "#e7ded4";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHtml(order: ConfirmationInput): string {
  const rows = order.lines
    .map(
      (line) => `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid ${LINE};font:400 15px/1.4 Georgia,'Times New Roman',serif;color:${INK};">
          ${escapeHtml(line.name)}
          ${
            line.size
              ? `<div style="font:400 13px/1.4 Helvetica,Arial,sans-serif;color:${MUTED};padding-top:3px;">Size ${escapeHtml(line.size)}</div>`
              : ""
          }
        </td>
        <td style="padding:14px 0;border-bottom:1px solid ${LINE};font:400 14px/1.4 Helvetica,Arial,sans-serif;color:${MUTED};text-align:center;white-space:nowrap;">
          &times; ${line.quantity}
        </td>
        <td style="padding:14px 0;border-bottom:1px solid ${LINE};font:400 15px/1.4 Helvetica,Arial,sans-serif;color:${INK};text-align:right;white-space:nowrap;">
          ${formatNaira(line.unit_price_kobo * line.quantity)}
        </td>
      </tr>`,
    )
    .join("");

  const totalRow = (label: string, value: string, strong = false) => `
      <tr>
        <td colspan="2" style="padding:${strong ? "14px 0 0" : "10px 0 0"};font:${strong ? "700" : "400"} ${strong ? "16px" : "14px"}/1.4 Helvetica,Arial,sans-serif;color:${strong ? INK : MUTED};">${label}</td>
        <td style="padding:${strong ? "14px 0 0" : "10px 0 0"};font:${strong ? "700" : "400"} ${strong ? "16px" : "14px"}/1.4 Helvetica,Arial,sans-serif;color:${strong ? INK : MUTED};text-align:right;white-space:nowrap;">${value}</td>
      </tr>`;

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${PAPER};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${LINE};border-radius:4px;">

        <tr><td style="padding:34px 34px 0;">
          <div style="font:700 13px/1 Helvetica,Arial,sans-serif;letter-spacing:.22em;text-transform:uppercase;color:${CLAY};">Vellyshop</div>
          <h1 style="margin:22px 0 0;font:400 28px/1.25 Georgia,'Times New Roman',serif;color:${INK};">Thank you, ${escapeHtml(order.fullName.split(" ")[0] || "there")}.</h1>
          <p style="margin:12px 0 0;font:400 15px/1.6 Helvetica,Arial,sans-serif;color:${MUTED};">
            Your order is confirmed. We are packing it now and will be in touch on
            ${escapeHtml(order.phone)} when it leaves us.
          </p>
          <div style="margin:22px 0 0;padding:12px 16px;background:${PAPER};border:1px solid ${LINE};border-radius:3px;font:400 14px/1.4 Helvetica,Arial,sans-serif;color:${MUTED};">
            Order reference
            <span style="display:block;padding-top:4px;font:700 18px/1.2 Helvetica,Arial,sans-serif;color:${INK};letter-spacing:.06em;">${escapeHtml(order.reference)}</span>
          </div>
        </td></tr>

        <tr><td style="padding:28px 34px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${rows}
            ${totalRow("Subtotal", formatNaira(order.subtotalKobo))}
            ${totalRow("Delivery", order.deliveryKobo === 0 ? "Free" : formatNaira(order.deliveryKobo))}
            ${totalRow("Total", formatNaira(order.totalKobo), true)}
          </table>
        </td></tr>

        <tr><td style="padding:28px 34px 0;">
          <div style="font:700 12px/1 Helvetica,Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:${MUTED};">Delivering to</div>
          <p style="margin:10px 0 0;font:400 15px/1.6 Helvetica,Arial,sans-serif;color:${INK};">
            ${escapeHtml(order.fullName)}<br>
            ${escapeHtml(order.address)}<br>
            ${escapeHtml(order.city)}, ${escapeHtml(order.state)}
          </p>
        </td></tr>

        <tr><td style="padding:28px 34px 34px;">
          <p style="margin:0;padding-top:22px;border-top:1px solid ${LINE};font:400 13px/1.6 Helvetica,Arial,sans-serif;color:${MUTED};">
            Sign in at any time to see this order and everything you have bought before.
            Reply to this email if anything looks wrong.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildText(order: ConfirmationInput): string {
  const lines = order.lines
    .map(
      (line) =>
        `  ${line.name}${line.size ? ` (size ${line.size})` : ""} x${line.quantity}  ${formatNaira(line.unit_price_kobo * line.quantity)}`,
    )
    .join("\n");

  return [
    `Thank you, ${order.fullName.split(" ")[0] || "there"}.`,
    "",
    `Your Vellyshop order is confirmed. Reference ${order.reference}.`,
    "",
    lines,
    "",
    `Subtotal  ${formatNaira(order.subtotalKobo)}`,
    `Delivery  ${order.deliveryKobo === 0 ? "Free" : formatNaira(order.deliveryKobo)}`,
    `Total     ${formatNaira(order.totalKobo)}`,
    "",
    "Delivering to",
    `  ${order.fullName}`,
    `  ${order.address}`,
    `  ${order.city}, ${order.state}`,
    `  ${order.phone}`,
    "",
    "Sign in at any time to see this order and everything you have bought before.",
  ].join("\n");
}

/**
 * Sends the order confirmation through Mailgun's HTTP API.
 *
 * Returns an error string rather than throwing: a mail outage should not lose
 * an order that is already saved in the database.
 */
export async function sendOrderConfirmation(
  order: ConfirmationInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const from = process.env.MAILGUN_FROM ?? `Vellyshop <orders@${domain}>`;
  const base = process.env.MAILGUN_BASE_URL ?? "https://api.mailgun.net";

  if (!apiKey || !domain) {
    return {
      ok: false,
      error: "MAILGUN_API_KEY or MAILGUN_DOMAIN is not set.",
    };
  }

  const body = new URLSearchParams({
    from,
    to: order.to,
    subject: `Your Vellyshop order ${order.reference}`,
    text: buildText(order),
    html: buildHtml(order),
    "o:tag": "order-confirmation",
  });

  try {
    const response = await fetch(`${base}/v3/${domain}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (!response.ok) {
      const detail = await response.text();
      return {
        ok: false,
        error: `Mailgun returned ${response.status}: ${detail.slice(0, 300)}`,
      };
    }

    return { ok: true };
  } catch (cause) {
    return {
      ok: false,
      error: cause instanceof Error ? cause.message : "Unknown Mailgun error.",
    };
  }
}
