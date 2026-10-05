import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";
import {
  placeOrderFor,
  type CheckoutDetails,
  type IncomingLine,
} from "@/lib/checkout";

/**
 * Checkout for the mobile app. The website uses the placeOrder server action,
 * which reads the auth cookie; a phone has no cookie, so it sends its Supabase
 * access token as a bearer token instead. Both end up in the same placeOrderFor,
 * so prices, validation, the confirmation email and row-level security behave
 * identically.
 */
export async function POST(request: NextRequest) {
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!token) {
    return Response.json(
      { ok: false, needsAuth: true, error: "Please sign in before placing your order." },
      { status: 401 },
    );
  }

  // Row-level security sees the caller, because their token rides on every query.
  const supabase = createClient(SUPABASE_URL(), SUPABASE_ANON_KEY(), {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser(token);

  let body: { details?: CheckoutDetails; lines?: IncomingLine[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "That request was not valid." }, { status: 400 });
  }

  if (!body.details || !body.lines) {
    return Response.json({ ok: false, error: "That request was not valid." }, { status: 400 });
  }

  const result = await placeOrderFor(supabase, user, body.details, body.lines);
  return Response.json(result, { status: result.ok ? 200 : result.needsAuth ? 401 : 400 });
}
