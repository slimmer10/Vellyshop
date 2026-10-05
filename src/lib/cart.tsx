"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { CartLine } from "@/lib/types";

const STORAGE_KEY = "vellyshop.cart.v1";
const OWNER_KEY = "vellyshop.cart.owner.v1";
const EMPTY: CartLine[] = [];

export function lineKey(productId: string, size: string | null): string {
  return `${productId}|${size ?? ""}`;
}

/* ------------------------------------------------------------------ store
 *
 * The cart lives in localStorage so it survives a reload, and is read through
 * useSyncExternalStore so the server render and the first client render agree.
 * The parsed value is cached against the raw string: getSnapshot must return
 * the same reference until the data actually changes, or React will loop.
 */

const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedLines: CartLine[] = EMPTY;

function parse(raw: string | null): CartLine[] {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed.filter(
      (line): line is CartLine =>
        typeof line === "object" &&
        line !== null &&
        typeof (line as CartLine).productId === "string" &&
        typeof (line as CartLine).priceKobo === "number" &&
        typeof (line as CartLine).quantity === "number",
    );
  } catch {
    return EMPTY;
  }
}

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null; // Private browsing, or storage is blocked.
  }
}

function getSnapshot(): CartLine[] {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedLines = parse(raw);
  }
  return cachedLines;
}

function getServerSnapshot(): CartLine[] {
  return EMPTY;
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  // Another tab changing the cart fires "storage" here.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Writes the local copy only. Remote changes land here without being pushed
 *  straight back, which would otherwise bounce between devices forever. */
function writeLocal(lines: CartLine[]): void {
  const raw = JSON.stringify(lines);
  cachedRaw = raw;
  cachedLines = lines;
  try {
    window.localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // The cart still works for this visit, it just will not persist.
  }
  for (const listener of listeners) listener();
}

/** A local change by the shopper: save it here, then send it to their account. */
function write(lines: CartLine[]): void {
  writeLocal(lines);
  schedulePush();
}

/* ------------------------------------------------------------------- sync
 *
 * A signed-in shopper's cart also lives in the cart_items table, which is what
 * the mobile app reads, so the same cart follows them between devices. The
 * local copy stays the source for rendering; this section keeps it and the
 * table in step. Guests never touch any of it.
 */

let supabase: SupabaseClient | null = null;
let syncedUserId: string | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pushing = false;

function signature(lines: CartLine[]): string {
  return lines
    .map((l) => `${lineKey(l.productId, l.size)}=${l.quantity}`)
    .sort()
    .join(",");
}

function setOwner(id: string | null): void {
  try {
    if (id) window.localStorage.setItem(OWNER_KEY, id);
    else window.localStorage.removeItem(OWNER_KEY);
  } catch {
    // Not fatal: the next load just treats the cart as a guest cart and merges.
  }
}

function getOwner(): string | null {
  try {
    return window.localStorage.getItem(OWNER_KEY);
  } catch {
    return null;
  }
}

type RemoteRow = {
  product_id: string;
  size: string;
  quantity: number;
  products: {
    slug: string;
    name: string;
    image_url: string;
    price_kobo: number;
  } | null;
};

async function fetchRemote(client: SupabaseClient): Promise<CartLine[] | null> {
  const { data, error } = await client
    .from("cart_items")
    .select(
      "product_id, size, quantity, products(slug, name, image_url, price_kobo)",
    );
  if (error || !data) return null;

  return (data as unknown as RemoteRow[])
    .filter((row) => row.products)
    .map((row) => ({
      productId: row.product_id,
      slug: row.products!.slug,
      name: row.products!.name,
      size: row.size === "" ? null : row.size,
      imageUrl: row.products!.image_url,
      priceKobo: row.products!.price_kobo,
      quantity: row.quantity,
    }))
    .sort(
      (a, b) =>
        a.name.localeCompare(b.name) ||
        (a.size ?? "").localeCompare(b.size ?? ""),
    );
}

async function pushNow(): Promise<void> {
  if (!supabase || !syncedUserId) return;
  pushing = true;
  try {
    await supabase.rpc("replace_cart", {
      p_lines: getSnapshot().map((l) => ({
        product_id: l.productId,
        size: l.size ?? "",
        quantity: l.quantity,
      })),
    });
  } finally {
    pushing = false;
  }
}

function schedulePush(): void {
  if (!syncedUserId) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void pushNow();
  }, 250);
}

/** Pull the account's cart and adopt it if it differs from what is showing. */
async function pullRemote(): Promise<void> {
  // A local edit is waiting to go out: it is newer than anything we would pull.
  if (!supabase || !syncedUserId || pushTimer || pushing) return;
  const remote = await fetchRemote(supabase);
  if (!remote || pushTimer || pushing) return;
  if (signature(remote) !== signature(getSnapshot())) writeLocal(remote);
}

/** First contact with an account on this device. */
async function startSync(
  client: SupabaseClient,
  userId: string,
): Promise<void> {
  supabase = client;
  const remote = await fetchRemote(client);
  if (!remote) return; // Offline or table missing: carry on as a local cart.

  const local = getSnapshot();
  let merged = remote;

  // A cart already tied to this account has been synced before, so the account
  // wins (otherwise something removed on the phone would come back). Anything
  // else is a guest cart, which is merged in so nothing they picked is lost.
  if (getOwner() !== userId && local.length > 0) {
    const byKey = new Map(remote.map((l) => [lineKey(l.productId, l.size), l]));
    for (const line of local) {
      const key = lineKey(line.productId, line.size);
      const existing = byKey.get(key);
      byKey.set(
        key,
        existing
          ? { ...existing, quantity: Math.max(existing.quantity, line.quantity) }
          : line,
      );
    }
    merged = [...byKey.values()];
  }

  syncedUserId = userId;
  setOwner(userId);
  if (signature(merged) !== signature(local)) writeLocal(merged);
  if (signature(merged) !== signature(remote)) await pushNow();
}

/* ---------------------------------------------------------------- context */

type CartContextValue = {
  lines: CartLine[];
  /** False during the server render and the first client render, so the UI
   *  never flashes "your cart is empty" at someone who has things in it. */
  ready: boolean;
  count: number;
  subtotalKobo: number;
  add: (line: CartLine) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  /** Empties the cart everywhere, e.g. after an order is placed. */
  clear: () => void;
  /** Empties only this device's copy, for signing out: the account keeps its cart. */
  clearLocal: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const lines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const add = useCallback((line: CartLine) => {
    const current = getSnapshot();
    const key = lineKey(line.productId, line.size);
    const existing = current.find((l) => lineKey(l.productId, l.size) === key);

    write(
      existing
        ? current.map((l) =>
            lineKey(l.productId, l.size) === key
              ? { ...l, quantity: Math.min(l.quantity + line.quantity, 20) }
              : l,
          )
        : [...current, line],
    );
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    const current = getSnapshot();
    write(
      quantity <= 0
        ? current.filter((l) => lineKey(l.productId, l.size) !== key)
        : current.map((l) =>
            lineKey(l.productId, l.size) === key
              ? { ...l, quantity: Math.min(quantity, 20) }
              : l,
          ),
    );
  }, []);

  const remove = useCallback((key: string) => {
    write(getSnapshot().filter((l) => lineKey(l.productId, l.size) !== key));
  }, []);

  const clear = useCallback(() => write(EMPTY), []);

  const clearLocal = useCallback(() => {
    syncedUserId = null;
    setOwner(null);
    writeLocal(EMPTY);
  }, []);

  useEffect(() => {
    const client = createClient();
    let channel: ReturnType<typeof client.channel> | null = null;
    let pullTimer: ReturnType<typeof setTimeout> | null = null;

    const queuePull = () => {
      if (pullTimer) clearTimeout(pullTimer);
      pullTimer = setTimeout(() => void pullRemote(), 400);
    };

    const stopListening = () => {
      if (channel) void client.removeChannel(channel);
      channel = null;
    };

    const listen = (userId: string) => {
      stopListening();
      channel = client
        .channel(`cart:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "cart_items",
            filter: `user_id=eq.${userId}`,
          },
          queuePull,
        )
        .subscribe();
    };

    const { data: sub } = client.auth.onAuthStateChange((event, session) => {
      const user = session?.user ?? null;
      if (user && user.id !== syncedUserId) {
        // Deferred: awaiting supabase calls inside this callback can deadlock.
        setTimeout(() => {
          void startSync(client, user.id).then(() => listen(user.id));
        }, 0);
      } else if (!user && event === "SIGNED_OUT") {
        stopListening();
        syncedUserId = null;
        setOwner(null);
        writeLocal(EMPTY);
      }
    });

    // Realtime can miss events while the tab sleeps, so catch up on return.
    const onVisible = () => {
      if (document.visibilityState === "visible") queuePull();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      sub.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
      if (pullTimer) clearTimeout(pullTimer);
      stopListening();
    };
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((sum, l) => sum + l.quantity, 0);
    const subtotalKobo = lines.reduce(
      (sum, l) => sum + l.priceKobo * l.quantity,
      0,
    );
    return {
      lines,
      ready,
      count,
      subtotalKobo,
      add,
      setQuantity,
      remove,
      clear,
      clearLocal,
    };
  }, [lines, ready, add, setQuantity, remove, clear, clearLocal]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside a CartProvider");
  return context;
}
