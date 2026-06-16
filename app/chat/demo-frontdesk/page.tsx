"use client";

import { useState, useRef, useEffect, useMemo, type FormEvent, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FAQ_CATEGORIES } from "@/lib/faq-data";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const VERTICAL_DEMOS = [
  {
    id: "med_spa",
    title: "Luxury Med Spa",
    emoji: "✦",
    desc: "Client management, bookings, retention, marketing intelligence",
    color: "#f472b6",
  },
  {
    id: "hotel",
    title: "Luxury Hotel",
    emoji: "◆",
    desc: "Guest experience, concierge AI, operations, revenue optimization",
    color: "#00d4ff",
  },
  {
    id: "real_estate",
    title: "Luxury Real Estate",
    emoji: "◇",
    desc: "Lead nurturing, property matching, market intelligence",
    color: "#a78bfa",
  },
  {
    id: "hr",
    title: "Corporate HR",
    emoji: "▤",
    desc: "Talent management, onboarding, employee intelligence",
    color: "#fb923c",
  },
  {
    id: "legal",
    title: "Legal Practice",
    emoji: "⊙",
    desc: "Case management, client intake, document intelligence",
    color: "#34d399",
  },
];

const DEFAULT_GREETING: Message = {
  role: "assistant",
  content:
    "Welcome to Evolved Eden. I'm Zuri — your private intelligence architect.\n\nLet's start simply. What should I call you?",
};

function DemoContent() {
  const searchParams = useSearchParams();

  const name = searchParams.get("name") || "";
  const hdType = searchParams.get("hd_type") || "";
  const hdProfileName = searchParams.get("hd_profile_name") || "";
  const archetypeParam = searchParams.get("archetype") || "";
  const sunGate = searchParams.get("sun_gate") || "";
  const designGate = searchParams.get("design_gate") || "";
  const geneKey = searchParams.get("gene_key") || "";

  const hasIntake = !!(name && hdType);

  const intakeContext = hasIntake
    ? `Name: ${name}\nHuman Design type: ${hdType}\nProfile: ${hdProfileName}\nArchetype: ${archetypeParam}\nSun Gate: ${sunGate}\nDesign Gate: ${designGate}\nGene Key: ${geneKey}`
    : "";

  const [messages, setMessages] = useState<Message[]>([]);
  const [greetingReady, setGreetingReady] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showVerticalPicker, setShowVerticalPicker] = useState(false);
  const [selectedVertical, setSelectedVertical] = useState("");
  const [showPaymentCta, setShowPaymentCta] = useState(false);
  const [showFaqSidebar, setShowFaqSidebar] = useState(false);
  const [faqSearch, setFaqSearch] = useState("");

  // Filtered FAQ for sidebar search
  const filteredFaqCategories = useMemo(() => {
    if (!faqSearch.trim()) return FAQ_CATEGORIES;
    const q = faqSearch.toLowerCase();
    return FAQ_CATEGORIES.map(cat => ({
      ...cat,
      questions: cat.questions.filter(
        item => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q) || item.tags?.some(t => t.includes(q))
      ),
    })).filter(cat => cat.questions.length > 0);
  }, [faqSearch]);

  // FAQ quick-chips based on conversation context
  const faqQuickChips = useMemo(() => {
    const lastMsg = messages.filter(m => m.role === "assistant").slice(-1)[0]?.content || "";
    const chips: { label: string; question: string }[] = [];

    if (lastMsg.toLowerCase().includes("pricing") || lastMsg.toLowerCase().includes("plan")) {
      chips.push({ label: "💰 Pricing", question: "How much does Evolved Eden cost?" });
      chips.push({ label: "📋 Plans", question: "What plans are available?" });
    }
    if (lastMsg.toLowerCase().includes("agent") || lastMsg.toLowerCase().includes("twin")) {
      chips.push({ label: "🤖 AI Twin vs Agent", question: "What's the difference between an AI Twin and an Agent?" });
      chips.push({ label: "📊 Agent limits", question: "How many agents can I have?" });
    }
    if (lastMsg.toLowerCase().includes("blueprint") || lastMsg.toLowerCase().includes("assess")) {
      chips.push({ label: "📝 What's Blueprint?", question: "What is the Blueprint Assessment?" });
      chips.push({ label: "🔄 Retake", question: "Can I retake the Blueprint?" });
    }
    if (lastMsg.toLowerCase().includes("vertical") || lastMsg.toLowerCase().includes("industry") || lastMsg.toLowerCase().includes("demo")) {
      chips.push({ label: "🏢 What verticals?", question: "What verticals do you support?" });
    }
    if (lastMsg.toLowerCase().includes("security") || lastMsg.toLowerCase().includes("data") || lastMsg.toLowerCase().includes("private")) {
      chips.push({ label: "🔒 Is my data secure?", question: "Is my data secure?" });
    }
    if (messages.length <= 1) {
      chips.unshift(
        { label: "❓ What is Evolved Eden?", question: "What is Evolved Eden?" },
        { label: "💡 How to start?", question: "How do I get started?" },
      );
    }

    return chips.slice(0, 4);
  }, [messages]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Init greeting once searchParams is available
  useEffect(() => {
    if (!greetingReady) {
      const greeting: Message = hasIntake
        ? {
            role: "assistant",
            content: `${name} — welcome back. I see your Human Design profile. A ${hdType} with a ${hdProfileName} archetype.\n\nLet me ask you a few quick questions so I can tailor your demo. What's your email address?`,
          }
        : DEFAULT_GREETING;
      setMessages([greeting]);
      setGreetingReady(true);
    }
  }, [hasIntake, name, hdType, hdProfileName, archetypeParam, sunGate, designGate, geneKey, greetingReady]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [isLoading]);

  // Detect when Zuri asks about vertical selection
  const lastAssistantMsg = messages.filter(m => m.role === "assistant").slice(-1)[0]?.content || "";
  useEffect(() => {
    const verticalKeywords = VERTICAL_DEMOS.map(v => v.title.toLowerCase());
    const hasVerticalRef = verticalKeywords.some(k => lastAssistantMsg.toLowerCase().includes(k));
    const userCount = messages.filter(m => m.role === "user").length;
    if (lastAssistantMsg.toLowerCase().includes("pick") || lastAssistantMsg.toLowerCase().includes("choose") || hasVerticalRef) {
      if (userCount >= 3) setShowVerticalPicker(true);
    }
  }, [lastAssistantMsg]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const updated = [...messages, userMessage];
    setMessages(updated);
    setInput("");
    setIsLoading(true);
    setShowVerticalPicker(false);

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat/front-desk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated.map((m) => ({ role: m.role, content: m.content })),
          context: intakeContext || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to chat");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = { role: "assistant", content: accumulated };
            return copy;
          });
        }
      }

      // Show payment CTA when Zuri mentions pricing/plans
      if (accumulated.toLowerCase().includes("pricing") || accumulated.toLowerCase().includes("plan")) {
        setShowPaymentCta(true);
      }
    } catch {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          content: "I'm sorry, I'm having trouble connecting. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function selectVertical(v: string) {
    setSelectedVertical(v);
    setShowVerticalPicker(false);
    // Send the selection to Zuri
    setInput(`I'd like to see the ${VERTICAL_DEMOS.find(d => d.id === v)?.title || v} demo`);
    setTimeout(() => {
      const form = document.querySelector("form");
      form?.requestSubmit();
    }, 100);
  }

  function handleReset() {
    setMessages([]);
    setShowVerticalPicker(false);
    setSelectedVertical("");
    setShowPaymentCta(false);
    setInput("");
    setGreetingReady(false);
  }

  if (!greetingReady) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-[#080810]">
        <div className="w-6 h-6 border-2 border-[#c8ff00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-dvh bg-[#080810]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#c8ff00]/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-[#c8ff00]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-display text-sm font-semibold tracking-wide">
            EVOLVED <span className="text-[#c8ff00]">EDEN</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowFaqSidebar(!showFaqSidebar)}
            className={`text-xs transition-colors ${showFaqSidebar ? 'text-[#c8ff00]' : 'text-white/40 hover:text-white/70'}`}
          >
            FAQ
          </button>
          {hasIntake && (
            <span className="text-xs text-[#c8ff00]/50 hidden sm:block">{archetypeParam} Profile</span>
          )}
          <span className="text-xs text-white/40 hidden sm:block">Demo</span>
          <button onClick={handleReset} className="text-xs text-white/40 hover:text-white/70 transition-colors">
            New
          </button>
        </div>
      </header>

      {/* Intake banner */}
      {hasIntake && (
        <div className="px-6 py-2 bg-[#c8ff00]/[0.03] border-b border-[#c8ff00]/10 flex items-center gap-3 text-xs text-white/40">
          <span className="text-[#c8ff00]">●</span>
          <span className="truncate">{name} &middot; {hdType} &middot; {archetypeParam}</span>
          <Link href="/intake" className="ml-auto text-[#c8ff00]/60 hover:text-[#c8ff00]">Edit</Link>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                msg.role === "user"
                  ? "bg-[#c8ff00] text-black"
                  : "bg-white/[0.04] text-white/80 border border-white/[0.06]"
              }`}>
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

      {/* FAQ Quick-Chips */}
      {faqQuickChips.length > 0 && messages.length > 1 && !showVerticalPicker && !showPaymentCta && (
        <div className="px-6 pb-3">
          <div className="max-w-2xl mx-auto">
            <p className="text-[10px] text-white/20 mb-2 tracking-wider uppercase">Quick Answers</p>
            <div className="flex flex-wrap gap-2">
              {faqQuickChips.map((chip, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(chip.question);
                    setTimeout(() => {
                      const form = document.querySelector("form");
                      form?.requestSubmit();
                    }, 100);
                  }}
                  className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-white/50 hover:border-white/20 hover:text-white hover:bg-white/[0.03] transition-all"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Vertical Selection Cards */}
      {showVerticalPicker && !selectedVertical && (
        <div className="px-6 pb-6">
          <div className="max-w-2xl mx-auto">
            <p className="text-xs text-white/30 mb-3 tracking-wider uppercase">Choose a demo to explore</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {VERTICAL_DEMOS.map((v) => (
                <button
                  key={v.id}
                  onClick={() => selectVertical(v.id)}
                  className="glass rounded-sm p-4 border border-white/[0.06] hover:border-white/20 hover:bg-white/[0.03] transition-all text-left group"
                >
                  <div className="text-lg mb-1" style={{ color: v.color }}>{v.emoji}</div>
                  <div className="text-xs font-semibold text-white/70 group-hover:text-white transition-colors">{v.title}</div>
                  <div className="text-[10px] text-white/30 mt-0.5">{v.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Payment CTA */}
      {showPaymentCta && (
        <div className="px-6 pb-4">
          <div className="max-w-2xl mx-auto">
            <Link
              href="/pricing"
              className="block w-full py-3.5 bg-[#c8ff00] text-black text-sm font-bold text-center rounded-sm hover:bg-white transition-all glow-acid"
            >
              View Plans & Pricing →
            </Link>
            <p className="text-xs text-white/20 text-center mt-2">Your demo data is saved — pick up where you left off anytime</p>
          </div>
        </div>
      )}

      {/* FAQ Sidebar */}
      {showFaqSidebar && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setShowFaqSidebar(false)} />
          {/* Panel */}
          <div className="fixed top-0 right-0 z-50 w-full max-w-sm h-full bg-[#0f1118] border-l border-white/10 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-semibold">Knowledge Base</h2>
                <button onClick={() => setShowFaqSidebar(false)} className="text-white/30 hover:text-white/70 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Search */}
              <input
                type="text"
                value={faqSearch}
                onChange={e => setFaqSearch(e.target.value)}
                placeholder="Search FAQ..."
                className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-sm text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#c8ff00]/50 transition-all mb-6"
              />

              {/* FAQ accordion */}
              {filteredFaqCategories.length === 0 ? (
                <p className="text-xs text-white/30 text-center py-8">No results found</p>
              ) : (
                <div className="space-y-6">
                  {filteredFaqCategories.map(cat => (
                    <div key={cat.id}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm">{cat.icon}</span>
                        <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">{cat.label}</h3>
                      </div>
                      <div className="space-y-1">
                        {cat.questions.map((item, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setInput(item.q);
                              setShowFaqSidebar(false);
                              setTimeout(() => {
                                const form = document.querySelector("form");
                                form?.requestSubmit();
                              }, 100);
                            }}
                            className="w-full text-left px-3 py-2 rounded-sm text-xs text-white/50 hover:text-white hover:bg-white/[0.03] transition-all"
                          >
                            {item.q}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-white/10 text-center">
                <Link
                  href="/chat"
                  className="text-xs text-[#c8ff00]/60 hover:text-[#c8ff00] transition-colors"
                  onClick={() => setShowFaqSidebar(false)}
                >
                  View Full Knowledge Base →
                </Link>
              </div>
            </div>
          </div>
        </>
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
              placeholder={isLoading ? "Zuri is thinking..." : "Tell Zuri about yourself..."}
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

export default function DemoFrontDesk() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-dvh bg-[#080810]">
          <div className="w-6 h-6 border-2 border-[#c8ff00] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <DemoContent />
    </Suspense>
  );
}
