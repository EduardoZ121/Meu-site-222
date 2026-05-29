import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, RotateCcw } from "lucide-react";
import { useI18n } from "../lib/i18n";
import { api, formatApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { isLocalAuthToken, supportFallbackReply } from "../lib/supportClientFallback";
import { SUPPORT_EMAIL } from "../lib/siteConfig";
import { toast } from "sonner";

const STORAGE_KEY = "rp_support_chat_v3";

function loadStored() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function saveStored(messages) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
  } catch {
    /* ignore */
  }
}

function firstNameFromUser(user) {
  const raw = String(user?.name || "").trim();
  if (raw.length > 1) return raw.split(/\s+/)[0];
  const email = String(user?.email || "").split("@")[0] || "";
  if (email.length >= 2 && !email.startsWith("google")) {
    return email.charAt(0).toUpperCase() + email.slice(1).replace(/[._0-9]+/g, " ").trim().split(/\s+/)[0];
  }
  return "";
}

function toApiMessages(messages) {
  return messages.filter((m) => {
    if (m.role !== "user" && m.role !== "assistant") return false;
    if (m.localWelcome) return false;
    return Boolean(String(m.content || "").trim());
  });
}

function renderMessageContent(text) {
  const parts = String(text || "").split(/(\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s)\]]+)/g);
  return parts.map((part, i) => {
    const md = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (md) {
      return (
        <a
          key={i}
          href={md[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#C4B5FD] underline underline-offset-2 hover:text-[#E9D5FF]"
        >
          {md[1]}
        </a>
      );
    }
    if (/^https?:\/\//.test(part)) {
      return (
        <a
          key={i}
          href={part.replace(/[.,;:!?)]+$/, "")}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#A855F7] underline underline-offset-2 break-all"
        >
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function SupportChat({ open, onClose }) {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const location = useLocation();

  const buildWelcome = useCallback(() => {
    const name = firstNameFromUser(user);
    return {
      role: "assistant",
      content: t("support_welcome_personal", { name: name ? `, ${name}` : "" }),
      localWelcome: true,
    };
  }, [t, user]);

  const [messages, setMessages] = useState(() => {
    const stored = loadStored();
    if (stored?.length) return stored;
    const name = firstNameFromUser(user);
    return [{
      role: "assistant",
      content: t("support_welcome_personal", { name: name ? `, ${name}` : "" }),
      localWelcome: true,
    }];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [typingIdx, setTypingIdx] = useState(0);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  useEffect(() => {
    saveStored(messages);
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!loading) return undefined;
    const id = setInterval(() => setTypingIdx((i) => (i + 1) % 3), 2200);
    return () => clearInterval(id);
  }, [loading]);

  const typingLabels = [t("support_typing_1"), t("support_typing_2"), t("support_typing_3")];

  const resetChat = () => {
    setMessages([buildWelcome()]);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  const send = useCallback(
    async (text) => {
      const trimmed = String(text || "").trim();
      if (!trimmed || loading) return;

      const userMsg = { role: "user", content: trimmed };
      const withUser = [...messagesRef.current, userMsg];
      setMessages(withUser);
      setInput("");
      setLoading(true);

      const useLocalFallback = isLocalAuthToken();
      try {
        let reply;
        if (useLocalFallback) {
          reply = supportFallbackReply({ lang: lang || "pt", user, userText: trimmed });
        } else {
          const { data } = await api.post(
            "/support/chat",
            {
              messages: toApiMessages(withUser),
              lang: lang || "en",
              page: location.pathname,
            },
            { timeout: 32000 },
          );
          reply = String(data?.reply || "").trim();
          if (!reply) throw new Error(t("support_error"));
        }

        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      } catch (err) {
        const fallback = supportFallbackReply({ lang: lang || "pt", user, userText: trimmed });
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              fallback
              || `${formatApiError(err, t("support_error"))}\n\n${t("support_contact_hint", { email: SUPPORT_EMAIL })}`,
          },
        ]);
        if (err?.response?.status === 503) toast.error(t("support_unavailable"));
      } finally {
        setLoading(false);
      }
    },
    [loading, lang, t, location.pathname, user],
  );

  const quickPrompts = [
    t("support_q_casual_1"),
    t("support_q_casual_2"),
    t("support_q_casual_3"),
    t("support_q_credits"),
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            data-testid="support-chat-overlay"
          />
          <motion.aside
            className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-[420px] flex-col border-l border-[#9333EA]/25 bg-[#0B0B0C]"
            style={{ height: "100dvh", maxHeight: "100dvh" }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            data-testid="support-chat-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/[0.08] bg-gradient-to-r from-[#7C3AED]/25 to-transparent">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#9333EA] text-white font-semibold text-sm">
                S
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[#0B0B0C]" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-white">{t("support_agent_name")}</h2>
                <p className="text-[11px] text-emerald-400/90">{t("support_agent_status")}</p>
              </div>
              <button
                type="button"
                onClick={resetChat}
                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.08]"
                title={t("support_reset")}
                data-testid="support-chat-reset"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/[0.08]"
                data-testid="support-chat-close"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <div
              ref={scrollRef}
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 space-y-4"
            >
              {messages.map((m, i) => (
                <div
                  key={`${i}-${m.role}-${String(m.content).slice(0, 20)}`}
                  className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  data-testid={m.role === "user" ? "support-msg-user" : "support-msg-assistant"}
                >
                  {m.role === "assistant" && (
                    <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#9333EA] flex items-center justify-center text-[10px] font-bold text-white mt-0.5">
                      S
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                      m.role === "user"
                        ? "bg-[#7C3AED] text-white rounded-br-sm"
                        : "bg-[#1a1a22] border border-[#2E2E30] text-[#EDEBE8] rounded-bl-sm"
                    }`}
                  >
                    {renderMessageContent(m.content)}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-2 items-start">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#9333EA] flex items-center justify-center text-[10px] font-bold text-white">
                    S
                  </div>
                  <div className="rounded-2xl rounded-bl-sm bg-[#1a1a22] border border-[#2E2E30] px-3 py-2 flex items-center gap-2">
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7] animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7] animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7] animate-bounce [animation-delay:300ms]" />
                    </span>
                    <span className="text-xs text-[#8A8A8E]">{typingLabels[typingIdx]}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="shrink-0 px-4 pb-2 flex flex-wrap gap-1.5">
              {quickPrompts.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  disabled={loading}
                  className="text-[10px] px-2.5 py-1 rounded-full border border-[#9333EA]/35 text-[#D8B4FE] hover:bg-[#7C3AED]/20 transition-colors disabled:opacity-40"
                >
                  {q}
                </button>
              ))}
            </div>

            <form
              className="shrink-0 p-4 pt-2 border-t border-white/[0.08] pb-[max(1rem,env(safe-area-inset-bottom))]"
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t("support_placeholder")}
                  disabled={loading}
                  className="flex-1 min-w-0 rounded-xl border border-[#2E2E30] bg-[#13131A] px-3 py-2.5 text-base text-white placeholder:text-[#555] focus:outline-none focus:border-[#7C3AED]/50 touch-manipulation"
                  data-testid="support-chat-input"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="h-11 w-11 shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white disabled:opacity-40"
                  data-testid="support-chat-send"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
