import { supabase, supabaseConfigured } from "./supabase";
import type { CartItem } from "../context/OrderContext";
import type { Order } from "./database.types";

export interface CreateOrderInput {
  customerId: string;
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
  if (!supabaseConfigured) return { success: false, error: "النظام غير مُهيّأ حالياً" };

  try {
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: input.customerId,
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
        status: "pending",
      } as never)
      .select()
      .single();

    if (orderError || !order) {
      console.error("Create order error:", orderError);
      return { success: false, error: orderError?.message || "ما گدرنا ننشئ الطلب" };
    }

    const typedOrder = order as Order;
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
      console.error("Create order items error:", itemsError);
      await supabase.from("orders").delete().eq("id", typedOrder.id);
      return { success: false, error: "ما گدرنا نحفظ تفاصيل الطلب" };
    }

    return { success: true, order: typedOrder, orderNumber: typedOrder.order_number };
  } catch (error) {
    console.error("Unexpected order error:", error);
    return { success: false, error: "حدث خطأ غير متوقع" };
  }
}

const CANCELLABLE_STATUSES = new Set(["pending", "confirmed"]);

export async function cancelOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
  if (!supabaseConfigured) return { success: false, error: "النظام غير مُهيّأ حالياً" };

  const { data: order, error: readError } = await supabase
    .from("orders")
    .select("id,status")
    .eq("id", orderId)
    .single();

  if (readError || !order) return { success: false, error: "ما لقينا الطلب" };
  if (!CANCELLABLE_STATUSES.has(order.status)) {
    return { success: false, error: "الطلب دخل التحضير وما عاد نكدر نلغيه من الموقع" };
  }

  const { error } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId)
    .in("status", ["pending", "confirmed"]);

  if (error) {
    console.error("Cancel order error:", error);
    return { success: false, error: "ما گدرنا نلغي الطلب، حاول مرة ثانية" };
  }

  return { success: true };
}
