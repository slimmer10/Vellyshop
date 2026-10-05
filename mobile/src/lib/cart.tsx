import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { CartLine } from "@/lib/types";

/*
 * The cart is the same cart_items table the website writes to, so what is added
 * on one device appears on the other. A signed-in shopper's lines come from and
 * go to Supabase (with Realtime pushing changes in). A guest's lines are kept on
 * the phone and merged into the account when they sign in, as on the web.
 */

const GUEST_KEY = "vellyshop.cart.guest.v1";

export function lineKey(productId: string, size: string | null): string {
  return `${productId}|${size ?? ""}`;
}

function signature(lines: CartLine[]): string {
  return lines
    .map((l) => `${lineKey(l.productId, l.size)}=${l.quantity}`)
    .sort()
    .join(",");
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

async function fetchRemote(): Promise<CartLine[] | null> {
  const { data, error } = await supabase
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

async function readGuest(): Promise<CartLine[]> {
  try {
    const raw = await AsyncStorage.getItem(GUEST_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as CartLine[]) : [];
  } catch {
    return [];
  }
}

type CartValue = {
  lines: CartLine[];
  ready: boolean;
  count: number;
  subtotalKobo: number;
  add: (line: CartLine) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  /** Empties the cart everywhere, e.g. after an order is placed. */
  clear: () => void;
};

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, ready: authReady } = useAuth();
  const userId = user?.id ?? null;

  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  const linesRef = useRef<CartLine[]>([]);
  const userIdRef = useRef<string | null>(null);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pushing = useRef(false);

  const show = useCallback((next: CartLine[]) => {
    linesRef.current = next;
    setLines(next);
  }, []);

  const pushNow = useCallback(async () => {
    if (!userIdRef.current) return;
    pushing.current = true;
    try {
      await supabase.rpc("replace_cart", {
        p_lines: linesRef.current.map((l) => ({
          product_id: l.productId,
          size: l.size ?? "",
          quantity: l.quantity,
        })),
      });
    } finally {
      pushing.current = false;
    }
  }, []);

  /** A change made on this phone: show it now, then save it. */
  const change = useCallback(
    (next: CartLine[]) => {
      show(next);
      if (userIdRef.current) {
        if (pushTimer.current) clearTimeout(pushTimer.current);
        pushTimer.current = setTimeout(() => {
          pushTimer.current = null;
          void pushNow();
        }, 250);
      } else {
        void AsyncStorage.setItem(GUEST_KEY, JSON.stringify(next)).catch(() => {});
      }
    },
    [show, pushNow],
  );

  const pull = useCallback(async () => {
    // A local edit is waiting to go out, so it is newer than anything we'd pull.
    if (!userIdRef.current || pushTimer.current || pushing.current) return;
    const remote = await fetchRemote();
    if (!remote || pushTimer.current || pushing.current) return;
    if (signature(remote) !== signature(linesRef.current)) show(remote);
  }, [show]);

  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let pullTimer: ReturnType<typeof setTimeout> | null = null;
    userIdRef.current = userId;

    const queuePull = () => {
      if (pullTimer) clearTimeout(pullTimer);
      pullTimer = setTimeout(() => void pull(), 400);
    };

    async function start() {
      if (!userId) {
        const guest = await readGuest();
        if (!cancelled) {
          show(guest);
          setReady(true);
        }
        return;
      }

      const remote = (await fetchRemote()) ?? [];
      const guest = await readGuest();
      if (cancelled) return;

      // Anything picked as a guest joins the account's cart.
      let merged = remote;
      if (guest.length > 0) {
        const byKey = new Map(remote.map((l) => [lineKey(l.productId, l.size), l]));
        for (const line of guest) {
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

      show(merged);
      setReady(true);
      if (guest.length > 0) {
        await AsyncStorage.removeItem(GUEST_KEY).catch(() => {});
        if (signature(merged) !== signature(remote)) await pushNow();
      }

      channel = supabase
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
    }

    void start();

    // Realtime can miss events while the app is in the background.
    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active") queuePull();
    });

    return () => {
      cancelled = true;
      appState.remove();
      if (pullTimer) clearTimeout(pullTimer);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [authReady, userId, pull, pushNow, show]);

  const add = useCallback(
    (line: CartLine) => {
      const current = linesRef.current;
      const key = lineKey(line.productId, line.size);
      const existing = current.find((l) => lineKey(l.productId, l.size) === key);
      change(
        existing
          ? current.map((l) =>
              lineKey(l.productId, l.size) === key
                ? { ...l, quantity: Math.min(l.quantity + line.quantity, 20) }
                : l,
            )
          : [...current, line],
      );
    },
    [change],
  );

  const setQuantity = useCallback(
    (key: string, quantity: number) => {
      const current = linesRef.current;
      change(
        quantity <= 0
          ? current.filter((l) => lineKey(l.productId, l.size) !== key)
          : current.map((l) =>
              lineKey(l.productId, l.size) === key
                ? { ...l, quantity: Math.min(quantity, 20) }
                : l,
            ),
      );
    },
    [change],
  );

  const remove = useCallback(
    (key: string) =>
      change(linesRef.current.filter((l) => lineKey(l.productId, l.size) !== key)),
    [change],
  );

  const clear = useCallback(() => change([]), [change]);

  const value = useMemo<CartValue>(
    () => ({
      lines,
      ready,
      count: lines.reduce((sum, l) => sum + l.quantity, 0),
      subtotalKobo: lines.reduce((sum, l) => sum + l.priceKobo * l.quantity, 0),
      add,
      setQuantity,
      remove,
      clear,
    }),
    [lines, ready, add, setQuantity, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside a CartProvider");
  return context;
}
