import { supabase, supabaseConfigured } from "./supabase";
import type { CartItem } from "../context/OrderContext";
import type { Order } from "./database.types";

// ============================================================
// CUSTOMER
// ============================================================

export interface Customer {
  id: string;
  name: string;
  phone: string;
  created_at: string;
}

// ============================================================
// CREATE ORDER INPUT
// ============================================================

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

// ============================================================
// CREATE ORDER RESULT
// ============================================================

export interface CreateOrderResult {
  success: boolean;
  order?: Order;
  orderNumber?: string;
  error?: string;
}

// ============================================================
// GENERATE ORDER NUMBER
// ============================================================

function generateOrderNumber() {
  const now = Date.now().toString().slice(-6);
  return `MS-${now}`;
}

// ============================================================
// GET OR CREATE CUSTOMER
// ============================================================

export async function getOrCreateCustomer(
  name: string,
  phone: string
): Promise<{ customer: Customer | null; error?: string }> {
  if (!supabaseConfigured) {
    return {
      customer: null,
      error: "النظام غير مُهيّأ حالياً",
    };
  }

  try {
    // ----------------------------------------------------------
    // البحث عن الزبون بواسطة رقم الهاتف
    // ----------------------------------------------------------

    const { data: existingCustomer, error: searchError } =
      await supabase
        .from("customers")
        .select("*")
        .eq("phone", phone)
        .maybeSingle();

    if (searchError) {
      console.error("Customer search error:", searchError);

      return {
        customer: null,
        error: "ما گدرنا نبحث عن بيانات الزبون",
      };
    }

    // ----------------------------------------------------------
    // الزبون موجود مسبقاً
    // ----------------------------------------------------------

    if (existingCustomer) {
      // إذا الاسم تغير، نحدثه
      if (name && existingCustomer.name !== name) {
        const {
          data: updatedCustomer,
          error: updateError,
        } = await supabase
          .from("customers")
          .update({ name })
          .eq("id", existingCustomer.id)
          .select()
          .single();

        if (!updateError && updatedCustomer) {
          return {
            customer: updatedCustomer as Customer,
          };
        }
      }

      return {
        customer: existingCustomer as Customer,
      };
    }

    // ----------------------------------------------------------
    // الزبون جديد
    // ----------------------------------------------------------

    const {
      data: newCustomer,
      error: createError,
    } = await supabase
      .from("customers")
      .insert({
        name,
        phone,
      })
      .select()
      .single();

    if (createError || !newCustomer) {
      console.error("Customer create error:", createError);

      return {
        customer: null,
        error:
          createError?.message ||
          "ما گدرنا نسجل الزبون",
      };
    }

    return {
      customer: newCustomer as Customer,
    };
  } catch (error) {
    console.error("Customer error:", error);

    return {
      customer: null,
      error: "حدث خطأ أثناء حفظ بيانات الزبون",
    };
  }
}

// ============================================================
// CREATE ORDER
// ============================================================

export async function createOrder(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  // ----------------------------------------------------------
  // التحقق من العميل
  // ----------------------------------------------------------

  if (!input.customerId) {
    return {
      success: false,
      error: "بيانات الزبون ناقصة",
    };
  }

  // ----------------------------------------------------------
  // التحقق من السلة
  // ----------------------------------------------------------

  if (!input.items || input.items.length === 0) {
    return {
      success: false,
      error: "السلة فارغة",
    };
  }

  // ----------------------------------------------------------
  // التحقق من Supabase
  // ----------------------------------------------------------

  if (!supabaseConfigured) {
    return {
      success: false,
      error: "النظام غير مُهيّأ حالياً",
    };
  }

  try {
    // ========================================================
    // 1. إنشاء رقم الطلب
    // ========================================================

    const orderNumber = generateOrderNumber();

    // ========================================================
    // 2. إنشاء الطلب الرئيسي
    // ========================================================

    const {
      data: order,
      error: orderError,
    } = await supabase
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

        formatted_address:
          input.formattedAddress ?? null,

        phone: input.phone,

        customer_name:
          input.customerName ?? null,

        notes: input.notes ?? null,

        payment_method:
          input.paymentMethod ?? "cash",
      } as never)
      .select()
      .single();

    // ========================================================
    // فشل إنشاء الطلب
    // ========================================================

    if (orderError || !order) {
      console.error(
        "Create order error:",
        orderError
      );

      return {
        success: false,
        error:
          orderError?.message ||
          "ما گدرنا ننشئ الطلب",
      };
    }

    const typedOrder = order as Order;

    // ========================================================
    // 3. تجهيز تفاصيل الطلب
    // ========================================================

    const orderItems = input.items.map((item) => ({
      order_id: typedOrder.id,

      product_id: item.id,

      product_name: item.name,

      quantity: item.quantity,

      unit_price: item.price,

      total: item.price * item.quantity,

      extras: [],
    }));

    // ========================================================
    // 4. حفظ تفاصيل الطلب
    // ========================================================

    const {
      error: itemsError,
    } = await supabase
      .from("order_items")
      .insert(orderItems as never);

    // ========================================================
    // فشل حفظ التفاصيل
    // ========================================================

    if (itemsError) {
      console.error(
        "Create order items error:",
        itemsError
      );

      // حذف الطلب الأساسي حتى لا يبقى طلب ناقص
      await supabase
        .from("orders")
        .delete()
        .eq("id", typedOrder.id);

      return {
        success: false,
        error: "ما گدرنا نحفظ تفاصيل الطلب",
      };
    }

    // ========================================================
    // 5. الطلب تم بنجاح
    // ========================================================

    return {
      success: true,

      order: typedOrder,

      orderNumber:
        typedOrder.order_number,
    };
  } catch (error) {
    console.error(
      "Unexpected order error:",
      error
    );

    return {
      success: false,
      error:
        "حدث خطأ غير متوقع أثناء إنشاء الطلب",
    };
  }
}

// ============================================================
// GET LOCAL ORDERS
// ============================================================

export function getLocalOrders(): (
  Order & { items?: unknown[] }
)[] {
  try {
    return JSON.parse(
      localStorage.getItem("ms_orders") || "[]"
    );
  } catch {
    return [];
  }
}
