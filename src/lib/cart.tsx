"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { CartLine } from "@/lib/types";

const STORAGE_KEY = "vellyshop.cart.v1";
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

function write(lines: CartLine[]): void {
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
  clear: () => void;
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
    };
  }, [lines, ready, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside a CartProvider");
  return context;
}
