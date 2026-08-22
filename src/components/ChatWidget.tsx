import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiMessageCircle, FiSend, FiX } from "react-icons/fi";
import { sendChatMessage, type ChatMessage } from "../lib/chatService";
import { restaurantConfig } from "../data/restaurantConfig";
import { useOrder } from "../context/OrderContext";

interface DisplayMessage extends ChatMessage {
  id: string;
  failed?: boolean;
}

const WELCOME_MESSAGE: DisplayMessage = {
  id: "welcome",
  role: "assistant",
  text: "هلا وغلا 👋 آني أبو علي، مساعدك بمعلم الشاورما. شنو تحب تطلب اليوم؟",
};

export default function ChatWidget() {
  const { totalItems } = useOrder();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      window.setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [isOpen]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    const userMsg: DisplayMessage = { id: crypto.randomUUID(), role: "user", text: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setIsTyping(true);

    const history: ChatMessage[] = nextMessages
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, text: m.text }));

    const result = await sendChatMessage(history);
    setIsTyping(false);

    if (result.reply) {
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", text: result.reply! }]);
      if (!isOpen) setHasUnread(true);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: result.error || "عذراً، ما قدرت أرد هسه. جرب مرة ثانية.",
          failed: true,
        },
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.6, type: "spring", damping: 15 }}
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? "إغلاق المحادثة" : "افتح محادثة مع أبو علي"}
        className={`fixed right-6 z-[80] grid h-14 w-14 place-items-center rounded-full border border-gold-muted/50 bg-red text-ivory shadow-2xl shadow-black/50 transition-transform duration-200 hover:-translate-y-0.5 active:scale-95 sm:h-16 sm:w-16 lg:bottom-6 ${
          totalItems > 0 ? "bottom-24" : "bottom-6"
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <FiX size={24} />
            </motion.span>
          ) : (
            <motion.span key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <FiMessageCircle size={24} />
            </motion.span>
          )}
        </AnimatePresence>

        {hasUnread && !isOpen && (
          <span className="absolute -top-1 -left-1 grid h-4 w-4 place-items-center rounded-full bg-gold text-[10px] font-black text-bg">
            <span className="absolute h-full w-full animate-ping rounded-full bg-gold/70" />
          </span>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="محادثة مع أبو علي"
            className={`fixed inset-x-4 z-[85] flex max-h-[70svh] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-bg-secondary shadow-2xl shadow-black/60 sm:inset-x-auto sm:right-6 sm:w-[380px] lg:bottom-28 ${
              totalItems > 0 ? "bottom-[10.5rem]" : "bottom-24"
            }`}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center gap-3 border-b border-white/[0.08] bg-surface px-4 py-3.5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold text-bg">
                <FiMessageCircle size={18} />
              </div>
              <div className="min-w-0">
                <p className="font-display text-base text-ivory">أبو علي</p>
                <p className="flex items-center gap-1.5 text-xs text-ivory-mute">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> مساعد معلم الشاورما
                </p>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                      msg.role === "user"
                        ? "rounded-br-sm bg-surface text-ivory"
                        : msg.failed
                          ? "rounded-bl-sm border border-red-accent/30 bg-red-deep/10 text-ivory-dim"
                          : "rounded-bl-sm bg-gold/15 text-ivory"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-end">
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-gold/15 px-4 py-3">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="safe-bottom shrink-0 border-t border-white/[0.08] bg-surface p-3">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="اكتب رسالتك..."
                  aria-label="اكتب رسالتك"
                  className="flex-1 rounded-full border border-white/15 bg-bg px-4 py-2.5 text-sm text-ivory placeholder:text-ivory-mute focus:border-gold-muted"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  aria-label="إرسال"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red text-ivory transition disabled:opacity-40"
                >
                  <FiSend size={16} className="-scale-x-100" />
                </button>
              </div>
              {restaurantConfig.whatsapp && (
                <p className="mt-2 text-center text-[11px] text-ivory-mute">
                  لأي استفسار عاجل تواصل معنا مباشرة عبر واتساب
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
