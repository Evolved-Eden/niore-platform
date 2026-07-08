"use client";

import { useState, useRef, useEffect } from "react";

type Agent = {
  id: string;
  agent_id: string;
  name: string;
  tagline?: string;
  slug?: string;
  icon?: string;
};

type Message = {
  role: "user" | "assistant";
  content: string;
};

const SUGGESTED_PROMPTS = [
  "What's the current system status?",
  "Show me recent deployments",
  "List all registered agents",
  "Check user activity",
  "Run a system diagnostic",
];

const QUICK_AGENTS = [
  { id: "zuri", name: "Zuri", tagline: "Core intelligence" },
];

export default function AdminChatPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>("zuri");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "I'm Zuri — your admin intelligence concierge.\n\nI can help you monitor deployments, manage users, check system status, and oversee the ecosystem.\n\nSelect an agent above and start chatting.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch available agents
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/agents");
        if (res.ok) {
          const data = await res.json();
          const fetched = (data.agents || []).map((a: any) => ({
            id: a.id || a.agent_id,
            agent_id: a.agent_id,
            name: a.name,
            tagline: a.tagline || "",
            slug: a.slug || a.agent_id?.toLowerCase(),
            icon: a.icon || "◇",
          }));
          setAgents(fetched);
        }
      } catch {
        // Non-critical — use default Zuri
      } finally {
        setAgentsLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [isLoading]);

  const selectedAgentName =
    agents.find((a) => a.agent_id === selectedAgent)?.name ??
    (selectedAgent === "zuri" ? "Zuri" : selectedAgent);

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
          context: `User is an admin. Selected agent: ${selectedAgentName}. User has access to all system management features.`,
        }),
      });

      if (!res.ok) throw new Error("Failed to reach agent");

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
    setTimeout(() => {
      const form = document.querySelector("form");
      form?.requestSubmit();
    }, 100);
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Agent Selector */}
      <div className="px-6 pt-6 pb-3 flex items-center gap-3">
        <label className="text-xs text-white/30 tracking-widest uppercase shrink-0">
          Agent
        </label>
        <select
          value={selectedAgent}
          onChange={(e) => {
            setSelectedAgent(e.target.value);
            setMessages([
              {
                role: "assistant",
                content: `Switched to ${agents.find((a) => a.agent_id === e.target.value)?.name || e.target.value}. How can I help?`,
              },
            ]);
          }}
          disabled={agentsLoading}
          className="flex-1 max-w-xs px-3 py-2 bg-white/[0.04] border border-white/10 rounded-sm text-sm text-white/70 focus:outline-none focus:border-[#c8ff00]/40 transition-all appearance-none disabled:opacity-40"
        >
          <option value="zuri" className="bg-[#080810]">
            Zuri (Core Intelligence)
          </option>
          {agents.map((agent) => (
            <option
              key={agent.id}
              value={agent.agent_id}
              className="bg-[#080810]"
            >
              {agent.name}
              {agent.tagline ? ` — ${agent.tagline}` : ""}
            </option>
          ))}
          {agents.length === 0 && !agentsLoading && (
            <option value="" disabled className="bg-[#080810]">
              No agents found
            </option>
          )}
        </select>
        {agentsLoading && (
          <div className="w-3 h-3 border-2 border-[#c8ff00] border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3 px-6 pb-4">
        {[
          { label: "Deployments", value: "—", color: "#00d4ff" },
          { label: "Users", value: "—", color: "#a78bfa" },
          { label: "Agents", value: agents.length || "—", color: "#c8ff00" },
          { label: "Status", value: "Online", color: "#34d399" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="glass rounded-sm p-3 border border-white/[0.06]"
          >
            <div
              className="text-lg font-bold"
              style={{ color: stat.color }}
            >
              {stat.value}
            </div>
            <div className="text-[10px] text-white/30 tracking-wider uppercase mt-0.5">
              {stat.label}
            </div>
          </div>
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
                    <span
                      className="w-1.5 h-1.5 bg-white/30 rounded-full animate-pulse"
                      style={{ animationDelay: "0.2s" }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-white/30 rounded-full animate-pulse"
                      style={{ animationDelay: "0.4s" }}
                    />
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
              placeholder={
                isLoading
                  ? `${selectedAgentName} is thinking...`
                  : `Ask ${selectedAgentName} anything...`
              }
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
