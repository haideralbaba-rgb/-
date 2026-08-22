import { supabase, supabaseConfigured } from "./supabase";
import type { CartItem } from "../context/OrderContext";
import type { Order } from "./database.types";

export interface CreateOrderInput {
  userId: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  fulfillment: "delivery" | "pickup";
  latitude?: number | null;
  longitude?: number | null;
  formattedAddress?: string | null;
  phone: string;
  customerName?: string | null;
  notes?: string | null;
}

export interface CreateOrderResult {
  success: boolean;
  order?: Order;
  orderNumber?: string;
  error?: string;
}

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  if (!supabaseConfigured) {
    // Fallback: generate local order when Supabase isn't configured
    const localOrder: Order = {
      id: crypto.randomUUID(),
      order_number: `MS-${String(Date.now()).slice(-6)}`,
      user_id: input.userId,
      status: "pending",
      subtotal: input.subtotal,
      delivery_fee: input.deliveryFee,
      total: input.total,
      fulfillment: input.fulfillment,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      formatted_address: input.formattedAddress ?? null,
      phone: input.phone,
      customer_name: input.customerName ?? null,
      notes: input.notes ?? null,
      payment_method: "cash",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Store locally
    const stored = JSON.parse(localStorage.getItem("ms_orders") || "[]");
    stored.unshift({
      ...localOrder,
      items: input.items.map((i) => ({
        product_id: i.id,
        product_name: i.name,
        quantity: i.quantity,
        unit_price: i.price,
        total: i.price * i.quantity,
      })),
    });
    localStorage.setItem("ms_orders", JSON.stringify(stored));

    return { success: true, order: localOrder, orderNumber: localOrder.order_number };
  }

  try {
    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: input.userId,
        subtotal: input.subtotal,
        delivery_fee: input.deliveryFee,
        total: input.total,
        fulfillment: input.fulfillment,
        latitude: input.latitude,
        longitude: input.longitude,
        formatted_address: input.formattedAddress,
        phone: input.phone,
        customer_name: input.customerName,
        notes: input.notes,
        payment_method: "cash",
      } as never)
      .select()
      .single();

    if (orderError || !order) {
      return { success: false, error: orderError?.message || "ما گدرنا ننشئ الطلب" };
    }

    const typedOrder = order as Order;

    // Create order items (snapshot prices)
    const orderItems = input.items.map((item) => ({
      order_id: typedOrder.id,
      product_id: item.id,
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      total: item.price * item.quantity,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems as never);

    if (itemsError) {
      return { success: false, error: "ما گدرنا نحفظ تفاصيل الطلب" };
    }

    return { success: true, order: typedOrder, orderNumber: typedOrder.order_number };
  } catch (e) {
    return { success: false, error: "حدث خطأ غير متوقع" };
  }
}

export function getLocalOrders(): (Order & { items?: unknown[] })[] {
  try {
    return JSON.parse(localStorage.getItem("ms_orders") || "[]");
  } catch {
    return [];
  }
}
