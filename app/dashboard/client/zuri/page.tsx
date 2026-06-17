"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const QUICK_ACTIONS = [
  {
    label: "Start Blueprint",
    desc: "Assess your business intelligence",
    href: "/dashboard/client/blueprint/assess",
    icon: "◇",
    color: "#c8ff00",
  },
  {
    label: "My Twin",
    desc: "View your AI digital twin",
    href: "/dashboard/client/twin",
    icon: "◆",
    color: "#00d4ff",
  },
  {
    label: "Essence Board",
    desc: "Today's intelligence brief",
    href: "/dashboard/client",
    icon: "✦",
    color: "#a78bfa",
  },
  {
    label: "Vault",
    desc: "Documents & knowledge",
    href: "/dashboard/client/vault",
    icon: "▤",
    color: "#fb923c",
  },
  {
    label: "Edit Profile",
    desc: "Update your intake & design",
    href: "/intake",
    icon: "⊙",
    color: "#f472b6",
  },
  {
    label: "Pricing",
    desc: "Upgrade your plan",
    href: "/pricing",
    icon: "⊕",
    color: "#34d399",
  },
];

const SUGGESTED_PROMPTS = [
  "Help me start my intelligence blueprint",
  "What does my essence board say today?",
  "Show me my twin's latest scores",
  "How do I upgrade my plan?",
  "What's the OmniGrid ecosystem?",
];

export default function ZuriChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "I'm Zuri — your personal intelligence concierge.\n\nI can help you start your Blueprint assessment, check your Essence Board, review your Twin, manage your Vault, or answer any questions about your ecosystem.\n\nWhat would you like to do?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [isLoading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const updated = [...messages, userMessage];
    setMessages(updated);
    setInput("");
    setIsLoading(true);

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/zuri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated.map((m) => ({ role: m.role, content: m.content })),
          context: "User is on their dashboard Zuri page. They can start a blueprint, check their twin, essence board, vault, or manage their account.",
        }),
      });

      if (!res.ok) throw new Error("Failed to reach Zuri");

      const data = await res.json();
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: data.reply };
        return copy;
      });
    } catch {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          content:
            "I'm having trouble connecting. Please try again or check your network.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSuggested(prompt: string) {
    setInput(prompt);
    // Auto-submit after a short delay
    setTimeout(() => {
      const form = document.querySelector("form");
      form?.requestSubmit();
    }, 100);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Quick Action Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 px-6 pt-6 pb-4">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="glass rounded-sm p-4 border border-white/[0.06] hover:border-white/20 hover:bg-white/[0.03] transition-all group"
          >
            <div
              className="text-lg mb-1.5"
              style={{ color: action.color }}
            >
              {action.icon}
            </div>
            <div className="text-xs font-medium text-white/70 group-hover:text-white transition-colors">
              {action.label}
            </div>
            <div className="text-[10px] text-white/30 mt-0.5">{action.desc}</div>
          </Link>
        ))}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-6">
        <div className="max-w-2xl mx-auto space-y-5">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                  msg.role === "user"
                    ? "bg-[#c8ff00] text-black"
                    : "bg-white/[0.04] text-white/80 border border-white/[0.06]"
                }`}
              >
                {msg.content || (
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-pulse" />
                    <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                    <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
                  </span>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Suggested prompts */}
      {messages.length <= 2 && (
        <div className="px-6 pb-3">
          <div className="max-w-2xl mx-auto flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSuggested(prompt)}
                className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-white/40 hover:text-white/60 hover:border-white/20 transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-white/5 px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isLoading ? "Zuri is thinking..." : "Ask Zuri anything..."}
              disabled={isLoading}
              className="flex-1 bg-white/[0.04] border border-white/10 rounded-sm px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors disabled:opacity-40"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-5 py-3 bg-[#c8ff00] text-black text-sm font-bold rounded-sm hover:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
