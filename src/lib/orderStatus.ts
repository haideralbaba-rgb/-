import type { OrderStatus } from "./database.types";

export const ORDER_STATUS_META: Record<OrderStatus, { label: string; tone: "neutral" | "info" | "success" | "danger" }> = {
  pending: { label: "بانتظار المطعم", tone: "info" },
  confirmed: { label: "تم تأكيد الطلب", tone: "info" },
  preparing: { label: "قيد التحضير", tone: "info" },
  ready: { label: "جاهز للاستلام", tone: "success" },
  out_for_delivery: { label: "بالطريق إليك", tone: "success" },
  delivered: { label: "تم التسليم", tone: "success" },
  cancelled: { label: "ملغي", tone: "danger" },
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
];

export function canCancelOrder(status: OrderStatus) {
  return status === "pending" || status === "confirmed";
}
