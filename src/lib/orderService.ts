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

  paymentMethod?: "cash" | "online";
}

export interface CreateOrderResult {
  success: boolean;
  order?: Order;
  orderNumber?: string;
  error?: string;
}

function generateOrderNumber() {
  const now = Date.now().toString().slice(-6);
  return `MS-${now}`;
}

export async function createOrder(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  if (!input.customerId) {
    return {
      success: false,
      error: "بيانات الزبون ناقصة",
    };
  }

  if (!input.items || input.items.length === 0) {
    return {
      success: false,
      error: "السلة فارغة",
    };
  }

  if (!supabaseConfigured) {
    return {
      success: false,
      error: "النظام غير مُهيّأ حالياً",
    };
  }

  try {
    // ============================================================
    // 1. إنشاء رقم الطلب
    // ============================================================

    const orderNumber = generateOrderNumber();

    // ============================================================
    // 2. إنشاء الطلب
    // ============================================================

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,

        customer_id: input.customerId,

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

        payment_method: input.paymentMethod ?? "cash",
      } as never)
      .select()
      .single();

    if (orderError || !order) {
      console.error("Create order error:", orderError);

      return {
        success: false,
        error:
          orderError?.message ||
          "ما گدرنا ننشئ الطلب",
      };
    }

    const typedOrder = order as Order;

    // ============================================================
    // 3. تجهيز عناصر الطلب
    // ============================================================

    const orderItems = input.items.map((item) => ({
      order_id: typedOrder.id,

      product_id: item.id,

      product_name: item.name,

      quantity: item.quantity,

      unit_price: item.price,

      total: item.price * item.quantity,

      // حاليًا ما زلنا نجهز النظام للإضافات
      // لاحقًا نضع Extras الحقيقية هنا
      extras: [],
    }));

    // ============================================================
    // 4. حفظ عناصر الطلب
    // ============================================================

    const {
      error: itemsError,
    } = await supabase
      .from("order_items")
      .insert(orderItems as never);

    if (itemsError) {
      console.error(
        "Create order items error:",
        itemsError
      );

      // إذا فشل حفظ العناصر، نحذف الطلب الأساسي
      await supabase
        .from("orders")
        .delete()
        .eq("id", typedOrder.id);

      return {
        success: false,
        error: "ما گدرنا نحفظ تفاصيل الطلب",
      };
    }

    // ============================================================
    // 5. نجاح
    // ============================================================

    return {
      success: true,
      order: typedOrder,
      orderNumber: typedOrder.order_number,
    };
  } catch (error) {
    console.error("Unexpected order error:", error);

    return {
      success: false,
      error: "حدث خطأ غير متوقع أثناء إنشاء الطلب",
    };
  }
}
