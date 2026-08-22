// ============================================================
// إعدادات مشتركة لوكيل الذكاء الاصطناعي "أبو علي"
// يعمل مع Google Gemini API
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

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * يرسل محادثة كاملة إلى Google Gemini ويعيد نص الرد.
 * @param {{role: 'user'|'assistant', text: string}[]} history
 * @returns {Promise<{ text?: string, error?: string, status?: number }>}
 */
export async function callGemini(history) {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    return {
      error: "لم يتم إعداد مفتاح API على الخادم (API_KEY مفقود).",
      status: 500,
    };
  }

  const contents = history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [
      {
        text: m.text,
      },
    ],
  }));

  try {
    const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: SYSTEM_PROMPT,
            },
          ],
        },

        contents,

        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 400,
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const message =
        data?.error?.message ||
        data?.message ||
        "فشل الاتصال بخدمة Gemini.";

      return {
        error: message,
        status: res.status,
      };
    }

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim();

    if (!text) {
      return {
        error: "لم يصل رد من خدمة Gemini.",
        status: 502,
      };
    }

    return {
      text,
    };
  } catch (err) {
    return {
      error: "تعذر الوصول إلى خدمة الذكاء الاصطناعي.",
      status: 502,
    };
  }
}
