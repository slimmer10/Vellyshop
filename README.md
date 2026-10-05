# Vellyshop

A small online clothing shop: browse the rail, add pieces to a cart, sign in with
Google, check out, and get a confirmation email. Orders are kept against your
account, so you can close the browser, come back later, sign in again and the
whole history is still there.

Built with Next.js (App Router), Supabase for the database and authentication,
Mailgun for the confirmation email, and Netlify for hosting.

---

## What is in here

| Path | What it does |
| --- | --- |
| `src/app/page.tsx` | The shop front and product grid |
| `src/app/product/[slug]/page.tsx` | One product, with size and quantity |
| `src/app/cart/page.tsx` | The cart, kept in `localStorage` |
| `src/app/checkout/` | Delivery form and the `placeOrder` server action |
| `src/app/orders/page.tsx` | Order history for the signed-in user |
| `src/app/login/page.tsx` | Google sign-in |
| `src/app/auth/callback/route.ts` | Where Google sends people back to |
| `src/lib/mailgun.ts` | Builds and sends the confirmation email |
| `src/proxy.ts` | Refreshes the auth cookie on every request |
| `supabase/schema.sql` | Tables, row-level security, one helper function |
| `supabase/seed.sql` | The nine starting products |

---

## Setting it up

You need four things: a Supabase project, a Google OAuth client, a Mailgun
sending domain, and a `.env.local` file tying them together.

### 1. Install and create the env file

```bash
npm install
cp .env.example .env.local
```

Leave `.env.local` open — the next three steps fill it in.

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **Project Settings → API** and copy the **Project URL** and the
   **anon / publishable** key into `.env.local`:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

   The service-role key is not used anywhere in this project and should not be
   put in the env file.

3. Open **SQL Editor → New query**, paste the whole of `supabase/schema.sql`,
   and run it.
4. Do the same with `supabase/seed.sql`. That stocks the nine products.

Both files are safe to run more than once.

### 3. Google sign-in

In the [Google Cloud Console](https://console.cloud.google.com):

1. Create a project, then go to **APIs & Services → OAuth consent screen**.
   Pick **External**, give it a name and a support email, and add your own
   Google address under **Test users** while the app is unpublished.
2. Go to **Credentials → Create credentials → OAuth client ID**, type
   **Web application**.
3. Under **Authorised redirect URIs** add exactly one entry — the Supabase
   callback, *not* this site:

   ```
   https://your-ref.supabase.co/auth/v1/callback
   ```

4. Copy the **Client ID** and **Client secret**.

Back in Supabase, go to **Authentication → Providers → Google**, switch it on,
paste the client ID and secret, and save.

Still in Supabase, under **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:3000` while developing, the Netlify URL once
  deployed.
- **Redirect URLs**: add both
  `http://localhost:3000/auth/callback` and
  `https://your-site.netlify.app/auth/callback`.

If sign-in bounces back to the login page with an error, it is almost always a
URL missing from one of those two lists.

### 4. Mailgun

1. Sign up at [mailgun.com](https://www.mailgun.com). A sandbox domain is enough
   to get this working.
2. On a sandbox domain you must add each recipient under **Authorised
   Recipients** and have them click the verification link, or Mailgun will
   refuse to deliver. Add the address you plan to test with.
3. Copy the domain and your **private API key** into `.env.local`:

   ```
   MAILGUN_API_KEY=...
   MAILGUN_DOMAIN=sandbox....mailgun.org
   MAILGUN_FROM=Vellyshop <orders@sandbox....mailgun.org>
   MAILGUN_BASE_URL=https://api.mailgun.net
   ```

   If the Mailgun account was created in the EU region, change the base URL to
   `https://api.eu.mailgun.net`. Getting this wrong gives a 401.

### 5. Run it

```bash
npm run dev
```

Open <http://localhost:3000>.

---

## Checking it actually works

Worth walking through before handing it in:

1. Add two different pieces to the cart, in different sizes.
2. Reload the page. The cart count should be unchanged.
3. Go to checkout. It should send you to sign in, and bring you back to
   checkout with the cart intact.
4. Place the order. You land on **Your orders** with a reference like `VS-7K3MQXZ`.
5. Check the inbox for the confirmation email.
6. Log out, close the browser completely, reopen it, sign in again, open
   **Orders**. The order is still listed.

---

## Deploying to Netlify

1. Push this repository to GitHub.
2. In Netlify, **Add new site → Import an existing project**, and pick the repo.
   `netlify.toml` already sets the build command and the Next.js plugin.
3. Under **Site configuration → Environment variables**, add every variable from
   `.env.local`, and set `NEXT_PUBLIC_SITE_URL` to the deployed URL.
4. Deploy, then go back and add the deployed `/auth/callback` URL to the
   Supabase redirect list as described above.

---

## Mobile app

`mobile/` is an Expo (React Native) counterpart to the shop. It talks to the
same Supabase project, signs in with the same Google accounts, and calls the
deployed site's `/api/checkout` to place orders, so the web and the phone share
products, accounts, carts and orders.

**Cart sync.** A signed-in user's cart lives in the `cart_items` table (see
`supabase/schema.sql`). Both clients write it through the `replace_cart`
function and listen for changes over Supabase Realtime, so adding something on
the website shows up on the phone within a second or two, and the reverse.
Guests keep a local cart that is merged into the account when they sign in.

**One-off setup**

1. Re-run `supabase/schema.sql` in the SQL Editor (adds `cart_items`).
2. In Supabase -> Authentication -> URL Configuration -> Redirect URLs add
   `vellyshop://auth/callback`.
3. Deploy the web app so `/api/checkout` exists on Netlify.
4. `cd mobile && cp .env.example .env` and fill in the same Supabase URL and
   anon key as the web app.

**Run it**

```bash
cd mobile
npm install
npx expo start            # development; needs a development build, see below
```

**Installable Android app (APK with the Vellyshop icon)**

```bash
cd mobile
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build -p android --profile preview
```

When the build finishes EAS prints a link and a QR code. Open it on the phone,
download the APK and install it (allow installs from the browser if asked). The
app then sits in the app drawer as **Vellyshop**.

The Supabase URL and anon key are read from `mobile/.env` locally. For the cloud
build run `npx eas-cli@latest env:create --environment preview` once for
`EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (plain text
visibility is fine; the anon key is designed to be public).

---

## Notes on how it is built

**Sessions survive a closed browser.** The Supabase session is stored in an
httpOnly cookie rather than `localStorage`, and `src/proxy.ts` refreshes it on
every request. That is what makes "close the page, come back, sign in, see your
orders" work.

**Prices are not trusted from the browser.** The cart in `localStorage` holds a
price so it can show a subtotal, but `placeOrder` throws that away and reads the
real price out of the database before saving anything. Editing the cart in
devtools changes nothing about what gets recorded.

**Orders cannot be edited from the browser.** Row-level security lets a signed-in
user read and create their own orders and nothing else. There is deliberately no
update policy. The one exception is the `email_sent` flag, which goes through
`mark_order_emailed`, a security-definer function that can only touch that single
column on an order the caller owns.

**A failed email does not lose an order.** If Mailgun is down, the order is still
saved and the confirmation page says plainly that the email did not go out,
rather than claiming it did.

**The product photographs are placeholders** from Unsplash so the shop is
browsable immediately. Replace every `image_url` in `supabase/seed.sql` with real
photographs of the stock before this is shown to customers, and add the new image
host to `images.remotePatterns` in `next.config.ts`.

**There is no card payment.** Checkout records the order and sends the
confirmation; payment is settled with the shop directly. Adding a payment
provider would sit between validation and the order insert in
`src/app/checkout/actions.ts`.
