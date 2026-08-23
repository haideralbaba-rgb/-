import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiMessageCircle, FiRefreshCw, FiSend, FiShoppingBag, FiTrash2, FiX, FiChevronLeft } from "react-icons/fi";
import { sendChatMessage, type ChatMessage, type ChatAction } from "../lib/chatService";
import { restaurantConfig } from "../data/restaurantConfig";
import { menuData } from "../data/menuData";
import { useOrder } from "../context/OrderContext";

interface DisplayMessage extends ChatMessage { id: string; failed?: boolean; local?: boolean; }

const WELCOME_MESSAGE: DisplayMessage = {
  id: "welcome",
  role: "assistant",
  text: "هلا وغلا، آني أبو علي. شنو نطلبلك اليوم؟",
};

const QUICK_PROMPTS = ["وريني السلة", "أريد شاورما دجاج", "خليها اثنين", "شنو تنصحني؟"];

export default function ChatWidget() {
  const { items, totalItems, totalPrice, addItem, removeItem, updateQuantity, clearCart, openCart } = useOrder();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [lastFailedText, setLastFailedText] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const menuContext = useMemo(() => menuData.flatMap((category) => category.items.flatMap((item) => {
    if (!item.variants?.length) return [{ id: item.id, name: item.name, price: item.price }];
    return item.variants.map((variant) => ({ id: variant.id, name: item.name, price: variant.price, variant: variant.label }));
  })), []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setHasUnread(false);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 180);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  const executeActions = (actions: ChatAction[]) => {
    for (const action of actions) {
      if (action.type === "clear_cart") { clearCart(); continue; }
      if (action.type === "open_cart") { openCart(); continue; }
      if (!action.itemId) continue;
      if (action.type === "remove_from_cart") { if (items.some((item) => item.id === action.itemId)) removeItem(action.itemId); continue; }
      if (action.type === "set_quantity") { if (items.some((item) => item.id === action.itemId)) updateQuantity(action.itemId, Math.max(0, Number(action.quantity) || 0)); continue; }
      if (action.type === "add_to_cart") {
        const product = menuContext.find((item) => item.id === action.itemId);
        if (product) addItem(product, Math.max(1, Number(action.quantity) || 1));
      }
    }
  };

  const sendText = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;
    const userMsg: DisplayMessage = { id: crypto.randomUUID(), role: "user", text: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLastFailedText(null);
    setIsTyping(true);

    const history: ChatMessage[] = nextMessages.filter((m) => m.id !== "welcome").map((m) => ({ role: m.role, text: m.text }));
    const result = await sendChatMessage(history, items, menuContext);
    setIsTyping(false);

    if (result.reply) {
      executeActions(result.actions || []);
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", text: result.reply!, local: result.local }]);
      if (!isOpen) setHasUnread(true);
      return;
    }

    setLastFailedText(trimmed);
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", text: result.error || "المساعد مشغول هسه، بس السلة محفوظة.", failed: true }]);
  };

  const resetConversation = () => {
    setMessages([WELCOME_MESSAGE]);
    setLastFailedText(null);
    setInput("");
    window.setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendText(input); }
  };

  return (
    <>
      <motion.button initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.6, type: "spring", damping: 15 }} onClick={() => setIsOpen((v) => !v)} aria-label={isOpen ? "إغلاق المحادثة" : "افتح محادثة مع أبو علي"} className={`fixed right-5 z-[80] grid h-14 w-14 place-items-center rounded-full border border-gold/40 bg-gradient-to-br from-red-accent to-red text-ivory shadow-xl shadow-black/50 transition hover:-translate-y-1 active:scale-95 sm:right-6 sm:h-16 sm:w-16 lg:bottom-6 ${totalItems > 0 ? "bottom-24" : "bottom-6"}`}>
        <AnimatePresence mode="wait" initial={false}>{isOpen ? <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><FiX size={23} /></motion.span> : <motion.span key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><FiMessageCircle size={23} /></motion.span>}</AnimatePresence>
        {hasUnread && !isOpen && <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-gold text-[9px] font-black text-bg"><span className="absolute h-full w-full animate-ping rounded-full bg-gold/70" /></span>}
      </motion.button>

      <AnimatePresence>
        {isOpen && <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }} transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }} role="dialog" aria-modal="true" aria-label="محادثة مع أبو علي" className={`fixed inset-x-3 z-[85] flex max-h-[78svh] flex-col overflow-hidden rounded-[1.4rem] border border-white/[.09] bg-bg-secondary shadow-[0_25px_90px_rgba(0,0,0,.65)] sm:inset-x-auto sm:right-5 sm:w-[390px] lg:right-6 lg:bottom-28 ${totalItems > 0 ? "bottom-[10.5rem]" : "bottom-24"}`}>
          <header className="relative shrink-0 overflow-hidden border-b border-white/[.08] bg-gradient-to-br from-surface-hi via-surface to-bg-secondary px-4 py-3.5">
            <div className="absolute -left-8 -top-12 h-32 w-32 rounded-full bg-gold/10 blur-3xl" />
            <div className="relative flex items-center gap-3">
              <div className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl border border-gold/30 bg-gold/10"><img src={restaurantConfig.logo} alt="" className="h-full w-full object-contain p-1.5" /></div>
              <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="font-display text-base text-ivory">أبو علي</p><span className="rounded-full bg-green-500/10 px-1.5 py-0.5 text-[8px] font-bold text-green-400">متاح</span></div><p className="mt-0.5 text-[10px] text-ivory-mute">مساعد الطلبات • يفهم طلبك ويعدّل السلة</p></div>
              <button onClick={resetConversation} className="grid h-8 w-8 place-items-center rounded-lg text-ivory-mute transition hover:bg-white/5 hover:text-ivory" aria-label="محادثة جديدة"><FiRefreshCw size={14}/></button>
              <button onClick={() => setIsOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg text-ivory-mute transition hover:bg-white/5 hover:text-ivory" aria-label="إغلاق"><FiX size={17}/></button>
            </div>
          </header>

          {totalItems > 0 && <button onClick={openCart} className="mx-3 mt-3 flex shrink-0 items-center gap-3 rounded-2xl border border-gold/20 bg-gradient-to-r from-gold/10 to-red/5 p-3 text-right transition hover:border-gold/35">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold text-bg"><FiShoppingBag size={16}/></div>
            <div className="min-w-0 flex-1"><p className="text-xs font-bold text-ivory">طلبك الحالي</p><p className="mt-0.5 text-[10px] text-ivory-mute">{totalItems} قطعة • {totalPrice.toLocaleString("ar-IQ")} د.ع</p></div><FiChevronLeft className="text-gold" size={15}/>
          </button>}

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3.5 py-4">
            {messages.map((msg) => <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}><div className={`relative max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-6 ${msg.role === "user" ? "rounded-br-md border border-white/[.07] bg-surface text-ivory" : msg.failed ? "rounded-bl-md border border-red-accent/25 bg-red-deep/10 text-ivory-dim" : "rounded-bl-md border border-gold/10 bg-gold/[.09] text-ivory"}`}>
              {msg.text}{msg.local && <span className="mr-2 inline-flex rounded-full bg-green-500/10 px-1.5 py-0.5 align-middle text-[8px] font-bold text-green-400">تنفيذ مباشر</span>}
            </div></div>)}
            {isTyping && <div className="flex justify-end"><div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-gold/10 bg-gold/[.09] px-4 py-3"><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold [animation-delay:-.3s]"/><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold [animation-delay:-.15s]"/><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold"/></div></div>}
            {messages.length === 1 && !isTyping && <div className="flex flex-wrap justify-end gap-2 pt-1">{QUICK_PROMPTS.map(prompt=><button key={prompt} onClick={()=>void sendText(prompt)} className="rounded-full border border-white/10 bg-white/[.025] px-3 py-2 text-[10px] text-ivory-dim transition hover:border-gold/30 hover:bg-gold/10 hover:text-gold">{prompt}</button>)}</div>}
          </div>

          <footer className="safe-bottom shrink-0 border-t border-white/[.08] bg-surface/95 p-3 backdrop-blur-xl">
            {lastFailedText && !isTyping && <button onClick={()=>void sendText(lastFailedText)} className="mb-2.5 flex w-full items-center justify-center gap-2 rounded-xl border border-red-accent/20 bg-red-deep/10 px-3 py-2 text-xs text-ivory-dim transition hover:bg-red-deep/20"><FiRefreshCw size={12}/> إعادة المحاولة</button>}
            <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-bg p-1.5 transition focus-within:border-gold/45 focus-within:ring-2 focus-within:ring-gold/5">
              <input ref={inputRef} value={input} onChange={(e)=>setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={isTyping?"أكتب رسالتك، راح أرد عليك...":"اكتب طلبك هنا..."} aria-label="اكتب رسالتك" className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-ivory placeholder:text-ivory-mute outline-none" />
              <button onClick={()=>void sendText(input)} disabled={!input.trim() || isTyping} aria-label="إرسال" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold text-bg shadow-lg shadow-gold/10 transition hover:brightness-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"><FiSend size={16} className="-scale-x-100"/></button>
            </div>
            <div className="mt-2 flex items-center justify-between px-1"><span className="text-[9px] text-ivory-mute">الطلب يبقى محفوظ بالسلة</span>{messages.length>2&&<button onClick={resetConversation} className="flex items-center gap-1 text-[9px] text-ivory-mute hover:text-gold"><FiTrash2 size={10}/> مسح المحادثة</button>}</div>
          </footer>
        </motion.div>}
      </AnimatePresence>
    </>
  );
}
