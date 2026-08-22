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

function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(100 + Math.random() * 900);

  return `MS-${timestamp}${random}`;
}

export async function createOrder(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  if (!supabaseConfigured) {
    const orderNumber = generateOrderNumber();

    const localOrder: Order = {
      id: crypto.randomUUID(),
      order_number: orderNumber,
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

    const stored = JSON.parse(
      localStorage.getItem("ms_orders") || "[]"
    );

    stored.unshift({
      ...localOrder,
      items: input.items.map((item) => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total: item.price * item.quantity,
      })),
    });

    localStorage.setItem("ms_orders", JSON.stringify(stored));

    return {
      success: true,
      order: localOrder,
      orderNumber,
    };
  }

  try {
    /*
     * 1. البحث عن customer الموجود
     *    إذا لم يكن موجوداً ننشئ واحداً.
     */

    let customerId: string | null = null;

    if (input.userId) {
      const { data: existingCustomer, error: customerLookupError } =
        await supabase
          .from("customers")
          .select("id")
          .eq("id", input.userId)
          .maybeSingle();

      if (!customerLookupError && existingCustomer) {
        customerId = existingCustomer.id;
      }
    }

    /*
     * إذا لم نجد customer باستخدام userId،
     * نحاول البحث بواسطة الهاتف.
     */

    if (!customerId && input.phone) {
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id")
        .eq("phone", input.phone)
        .maybeSingle();

      if (existingCustomer) {
        customerId = existingCustomer.id;
      }
    }

    /*
     * إذا لم يكن موجوداً، ننشئ customer جديد.
     */

    if (!customerId) {
      const { data: newCustomer, error: customerError } = await supabase
        .from("customers")
        .insert({
          name: input.customerName || "زبون",
          phone: input.phone || null,
        } as never)
        .select("id")
        .single();

      if (customerError || !newCustomer) {
        return {
          success: false,
          error:
            customerError?.message ||
            "ما گدرنا ننشئ بيانات الزبون",
        };
      }

      customerId = newCustomer.id;
    }

    /*
     * 2. إنشاء رقم الطلب
     */

    const orderNumber = generateOrderNumber();

    /*
     * 3. إنشاء الطلب
     */

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_id: customerId,
        status: "pending",
        subtotal: input.subtotal,
        delivery_fee: input.deliveryFee,
        total: input.total,
        fulfillment: input.fulfillment,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        formatted_address: input.formattedAddress ?? null,
        phone: input.phone || null,
        customer_name: input.customerName || null,
        notes: input.notes || null,
        payment_method: "cash",
      } as never)
      .select()
      .single();

    if (orderError || !order) {
      return {
        success: false,
        error:
          orderError?.message ||
          "ما گدرنا ننشئ الطلب",
      };
    }

    const typedOrder = order as Order;

    /*
     * 4. حفظ تفاصيل المنتجات داخل order_items
     */

    const orderItems = input.items.map((item) => ({
      order_id: typedOrder.id,
      product_id: item.id,
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      total: item.price * item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems as never);

    if (itemsError) {
      /*
       * الطلب الأساسي انحفظ لكن تفاصيل المنتجات فشلت.
       * نرجع الخطأ حتى نعرف المشكلة.
       */

      return {
        success: false,
        error:
          itemsError.message ||
          "ما گدرنا نحفظ تفاصيل الطلب",
      };
    }

    /*
     * 5. نجاح كامل
     */

    return {
      success: true,
      order: typedOrder,
      orderNumber: typedOrder.order_number,
    };
  } catch (error) {
    console.error("createOrder error:", error);

    return {
      success: false,
      error: "حدث خطأ غير متوقع أثناء إنشاء الطلب",
    };
  }
}

export function getLocalOrders(): (Order & {
  items?: unknown[];
})[] {
  try {
    return JSON.parse(
      localStorage.getItem("ms_orders") || "[]"
    );
  } catch {
    return [];
  }
}
