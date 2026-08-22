// ============================================================
// إعدادات مشتركة لوكيل الذكاء الاصطناعي "أبو علي"
// يُستخدم هذا الملف من قبل كل من:
//   - api/chat.js          (Vercel Serverless Function)
//   - server/index.js      (Express server للاستضافة الذاتية)
// ============================================================

export const SYSTEM_PROMPT = `أنت "أبو علي"، الوكيل الذكي لمطعم "معلم الشاورما" في كربلاء المقدسة (مول الحارث).
تتحدث باللهجة العراقية الدارجة الودودة (عيوني، حبيبي، على راسي). ردودك سريعة وقصيرة.

- المنيو الأساسي:
شاورما دجاج (صمون 5,000 / صاج 6,000)
شاورما لحم (صمون 7,000 / صاج 8,000)
بروست (3 قطع 12,000 / 5 قطع 18,000)
برجر كلاسيك 7,000
بطاطا 3,000 / مشروبات 1,500.
التوصيل: 3,000 دينار. (الحد الأدنى للتوصيل 10,000).

- هدفك:
1. الرد على استفسارات الزبائن حول المنيو.
2. اقتراح إضافات ذكية (Upselling) مثل البطاطا أو المشروب أو الصوص.
3. أخذ الطلب بشكل كامل (النوع، الإضافات، توصيل أم في المول، العنوان، التأكيد والمجموع).
4. امتصاص غضب الزبون المشتكي بالاعتذار واقتراح تعويض.
5. لا تخترع أسعاراً، لا تتحدث بالفصحى، ولا تطل في الإجابة.`;

const GEMINI_MODEL = "gemini-1.5-flash";

export async function callYandexGPT(history) {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    return { error: "لم يتم إعداد مفتاح API على الخادم (API_KEY مفقود).", status: 500 };
  }

  const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const contents = [
    {
      role: "user",
      parts: [{ text: `[تعليمات النظام الأساسية - التزم بها تماماً]:\n${SYSTEM_PROMPT}` }]
    },
    ...history.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text }],
    })),
  ];

  try {
    const res = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 400,
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const message = data?.error?.message || "فشل الاتصال بخدمة الذكاء الاصطناعي.";
      return { error: message, status: res.status };
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return { error: "لم يصل رد من الخدمة.", status: 502 };
    }

    return { text };
  } catch (err) {
    return { error: "تعذر الوصول إلى خدمة الذكاء الاصطناعي.", status: 502 };
  }
}

  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return { error: "لم يتم إعداد مفتاح API على الخادم (API_KEY مفقود).", status: 500 };
  }

  if (!apiKey) {
    return { error: "لم يتم إعداد مفتاح API على الخادم (API_KEY مفقود).", status: 500 };
  }
  if (!folderId) {
    return {
      error: "لم يتم إعداد YANDEX_FOLDER_ID على الخادم. راجع ملف .env وأضف معرّف المجلد من Yandex Cloud.",
      status: 500,
    };
  }

  const messages = [
    { role: "system", text: SYSTEM_PROMPT },
    ...history.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", text: m.text })),
  ];

  try {
    const res = await fetch(YANDEX_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Api-Key ${apiKey}`,
        "x-folder-id": folderId,
      },
      body: JSON.stringify({
        modelUri: `gpt://${folderId}/${model}`,
        completionOptions: {
          stream: false,
          temperature: 0.6,
          maxTokens: "400",
        },
        messages,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const message = data?.error?.message || data?.message || "فشل الاتصال بخدمة الذكاء الاصطناعي.";
      return { error: message, status: res.status };
    }

    const text = data?.result?.alternatives?.[0]?.message?.text;
    if (!text) {
      return { error: "لم يصل رد من الخدمة.", status: 502 };
    }

    return { text };
  } catch (err) {
    return { error: "تعذر الوصول إلى خدمة الذكاء الاصطناعي.", status: 502 };
  }
}

