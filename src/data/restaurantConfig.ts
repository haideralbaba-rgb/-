/**
 * ============================================================
 * RESTAURANT CONFIGURATION — SINGLE SOURCE OF TRUTH
 * ============================================================
 * كل معلومة حقيقية عن المطعم تُدار من هنا فقط.
 * لا تكتب أي رقم هاتف / رابط / عنوان مباشرة داخل المكوّنات.
 *
 * ⚠️ الحقول الفارغة ("") أو المصفوفات الفارغة ([]) تعني أن
 * البيانات الحقيقية لم تُسلَّم بعد. الواجهة مصممة لتتعامل مع
 * هذه الحالة بعرض رسائل بديلة بدل اختلاق معلومات غير مؤكدة.
 *
 * عند توفر البيانات الحقيقية (رقم واتساب، عنوان، ساعات دوام...)
 * كل ما عليك فعله هو تعبئتها هنا وسينعكس ذلك على الموقع بالكامل.
 * ============================================================
 */

export interface Branch {
  name: string;
  address: string;
  hours: string;
  mapsUrl: string;
  phone: string;
}

export interface Review {
  name: string;
  rating: number;
  text: string;
}

export const restaurantConfig = {
  restaurantName: "Moallim Shawarma",
  arabicName: "معلم الشاورما",
  shortName: "المعلم",
  tagline: "الشاورما، هيچي لازم تكون.",

  // ---- التواصل (اتركها فارغة إن لم تكن مؤكدة) ----
  phone: "",
  whatsapp: "", // مثال متوقع: "9647xxxxxxxxx" — بدون + أو صفر بداية
  instagram: "",
  facebook: "",
  tiktok: "",

  // ---- الموقع والدوام ----
  address: "",
  googleMapsUrl: "",
  openingHours: "",

  // ---- خدمات الطلب ----
  pickupAvailable: true,
  deliveryAvailable: true,
  deliveryAreas: [] as string[],
  deliveryFee: "",
  estimatedDeliveryTime: "",

  // ---- فروع متعددة (اتركها فارغة إن كان فرع واحد فقط) ----
  branches: [] as Branch[],

  // ---- التقييمات (لا تُعرض إلا إذا كانت حقيقية) ----
  hasReviews: false,
  reviews: [] as Review[],

  // ---- الوسائط ----
  logo: "/images/logo-mascot.svg",
  heroBackground: "/images/hero-poster.jpg",
} as const;

export type RestaurantConfig = typeof restaurantConfig;
