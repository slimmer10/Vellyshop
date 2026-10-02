export type Product = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  price_kobo: number;
  image_url: string;
  category: string;
  sizes: string[];
  colour: string | null;
  in_stock: boolean;
};

export type OrderItem = {
  id: string;
  product_id: string | null;
  name: string;
  size: string | null;
  image_url: string | null;
  unit_price_kobo: number;
  quantity: number;
};

export type Order = {
  id: string;
  reference: string;
  email: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  note: string | null;
  subtotal_kobo: number;
  delivery_kobo: number;
  total_kobo: number;
  status: string;
  email_sent: boolean;
  created_at: string;
  order_items: OrderItem[];
};

/** A line in the browser cart. Prices here are for display only; the server
 *  re-reads the real price from the database before charging anything. */
export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  size: string | null;
  imageUrl: string;
  priceKobo: number;
  quantity: number;
};
