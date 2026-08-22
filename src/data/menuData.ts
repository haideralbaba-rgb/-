export interface MenuVariant {
  id: string;
  label: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  desc?: string;
  price: number;
  variants?: MenuVariant[];
  tag?: string;
  popular?: boolean;
  image?: string;
  available?: boolean;
}

export interface MenuCategory {
  id: string;
  title: string;
  label: string;
  subtitle: string;
  items: MenuItem[];
}

let _uid = 0;
const uid = (base: string) => `${base}-${++_uid}`;

function makeItems(
  raw: {
    name: string;
    sandwich?: number;
    meal?: number;
    price?: number;
    tag?: string;
    popular?: boolean;
    desc?: string;
  }[]
): MenuItem[] {
  return raw.map((r) => {
    const id = uid(
      r.name
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\u0600-\u06FFa-zA-Z0-9-]/g, "")
    );
    if (r.sandwich && r.meal) {
      return {
        id,
        name: r.name,
        desc: r.desc,
        price: r.meal,
        tag: r.tag,
        popular: r.popular,
        variants: [
          { id: `${id}-sandwich`, label: "ساندويش", price: r.sandwich },
          { id: `${id}-meal`, label: "وجبة", price: r.meal },
        ],
      };
    }
    return {
      id,
      name: r.name,
      desc: r.desc,
      price: r.price ?? r.meal ?? r.sandwich ?? 0,
      tag: r.tag,
      popular: r.popular,
    };
  });
}

export const featuredDishes = [
  {
    id: "shawarma-lahm",
    name: "شاورما لحم المعلم",
    tagline: "قطع لحم منتخبة، تتبيلة بيتنا، وشي بطيء على النار",
    price: 5000,
    image: "/images/shawarma-meat.jpg",
    badge: "الأكثر طلباً",
    size: "large" as const,
  },
  {
    id: "burger-moallim",
    name: "برغر المعلم",
    tagline: "طبقتين لحم مشوي وجبن ذايب بين خبز طازة",
    price: 10500,
    image: "/images/burger-deluxe.jpg",
    badge: "توقيع المطعم",
    size: "large" as const,
  },
  {
    id: "shawarma-dajaj",
    name: "شاورما دجاج فرط اكسترا",
    tagline: "دجاج طري بتتبيلة بيتنا الخاصة",
    price: 8000,
    image: "/images/shawarma-chicken.jpg",
    badge: "",
    size: "medium" as const,
  },
  {
    id: "broasted",
    name: "بروستد كرسبي",
    tagline: "قرمشة ذهبية من برا، وطراوة من جوا",
    price: 7500,
    image: "/images/broasted-chicken.jpg",
    badge: "",
    size: "medium" as const,
  },
];

export const menuData: MenuCategory[] = [
  {
    id: "burgers",
    title: "برغر المعلم",
    label: "BURGERS",
    subtitle: "لحم بلدي وجبن ذايب بين طبقات مقرمشة",
    items: makeItems([
      { name: "برغر كلاسيك لحم", sandwich: 5500, meal: 7000 },
      { name: "تشيز برغر لحم", sandwich: 6000, meal: 7500 },
      { name: "برغر شاورما لحم", sandwich: 6000, meal: 7500 },
      { name: "شيكاغو برغر مدخن", sandwich: 6500, meal: 8000 },
      { name: "تشيز برغر ماشروم", sandwich: 6500, meal: 8000 },
      { name: "برغر ماغنوم", sandwich: 7000, meal: 8500 },
      { name: "فرينش فرايز برغر", sandwich: 7000, meal: 8500 },
      { name: "برغر ماستر", sandwich: 8000, meal: 9500 },
      { name: "برغر المعلم", sandwich: 9000, meal: 10500, popular: true },
      { name: "برغر شاورما دجاج", sandwich: 5000, meal: 6500 },
      { name: "برغر كلاسيك دجاج", sandwich: 4000, meal: 5500 },
      { name: "برغر دجاج فليمر", sandwich: 5000, meal: 6500 },
      { name: "برغر دجاج تندر", sandwich: 6000, meal: 7500 },
      { name: "برغر زنجر دجاج", sandwich: 5500, meal: 7000 },
      { name: "برغر كرانشي كرسبي", sandwich: 6500, meal: 8000 },
    ]),
  },
  {
    id: "shawarma-meat",
    title: "شاورما لحم",
    label: "BEEF SHAWARMA",
    subtitle: "لحم مشوي على الطريقة العراقية الأصيلة",
    items: makeItems([
      { name: "صاج شاورما لحم", price: 5000, popular: true },
      { name: "وجبة صاج عربي لحم", price: 6500 },
      { name: "صمون فرنسي لحم", price: 6000 },
      { name: "صاج اكسترا لحم بالجبن", price: 8000 },
      { name: "شاورما لحم فرط اكسترا", price: 12500 },
      { name: "ربع كيلو شاورما لحم", price: 10000 },
      { name: "نصف كيلو شاورما لحم", price: 19000 },
      { name: "كيلو شاورما لحم", price: 35000, tag: "للعائلة" },
      { name: "صينية المعلم لحم", price: 17000, desc: "أربع صاجية لحم مقطعة، صلصة، فنكر، مخلل" },
    ]),
  },
  {
    id: "shawarma-chicken",
    title: "شاورما دجاج",
    label: "CHICKEN SHAWARMA",
    subtitle: "دجاج طازة كل يوم بتتبيلة بيتنا الخاصة",
    items: makeItems([
      { name: "صاج شاورما دجاج", price: 3500, popular: true },
      { name: "صاج شاورما دجاج بالجبن", price: 5000 },
      { name: "صمون فرنسي دجاج", price: 5000 },
      { name: "وجبة صاج عربي دجاج", price: 5000 },
      { name: "وجبة سوبر عربي دجاج", price: 8500, tag: "جديد" },
      { name: "وجبة دجاج اكسترا جبن", price: 7500 },
      { name: "وجبة بانيه دجاج", price: 7500 },
      { name: "شاورما دجاج فرط اكسترا", price: 8000 },
      { name: "ربع كيلو شاورما دجاج", price: 7500 },
      { name: "نص كيلو شاورما دجاج", price: 14000 },
      { name: "كيلو شاورما دجاج", price: 25000, tag: "للعائلة" },
      { name: "صينية المعلم دجاج", price: 13500 },
    ]),
  },
  {
    id: "sandwiches",
    title: "ساندويشات المعلم",
    label: "SANDWICHES",
    subtitle: "خلطات جديدة بلمسة عالمية",
    items: makeItems([
      { name: "صاح كباب", sandwich: 6000, meal: 7000, tag: "جديد" },
      { name: "فاهيتا دجاج", sandwich: 5500, meal: 7000 },
      { name: "مكسيكانو دجاج", sandwich: 5500, meal: 7000 },
      { name: "فرانسيسكو دجاج", sandwich: 5500, meal: 7000 },
      { name: "المعلم", sandwich: 6000, meal: 7500 },
      { name: "كرسبي - سبايسي", sandwich: 5000, meal: 7500 },
      { name: "فاهيتا لحم", sandwich: 6000, meal: 7500 },
      { name: "فلادلفيا لحم", sandwich: 7000, meal: 8500 },
    ]),
  },
  {
    id: "specials",
    title: "ريزو، مندي وفتة",
    label: "RICE & SPECIALS",
    subtitle: "أكلات تراثية بطعم عصري",
    items: makeItems([
      { name: "ريزو كلاسيك", price: 5500 },
      { name: "ريزو بالجبن", price: 6500 },
      { name: "مندي شاورما دجاج", price: 6500 },
      { name: "مندي شاورما لحم", price: 8000 },
      { name: "فتة شاورما دجاج", price: 6500 },
      { name: "فتة شاورما لحم", price: 7500 },
    ]),
  },
  {
    id: "sides",
    title: "مقبلات ومشروبات",
    label: "SIDES",
    subtitle: "لتكمل نكهة وجبتك",
    items: makeItems([
      { name: "حمص باللحم", price: 6000 },
      { name: "اصابع موزريلا", price: 5000 },
      { name: "مقبلات كبير", price: 5000 },
      { name: "مقبلات وسط", price: 3500 },
      { name: "مقبلات صغيرة", price: 2000 },
      { name: "حلقات بصل", price: 4000 },
      { name: "فنكر بالجبن", price: 3500 },
      { name: "فنكر", price: 2000 },
    ]),
  },
];

export const allPopularItems: MenuItem[] = menuData.flatMap((c) => c.items.filter((i) => i.popular));
