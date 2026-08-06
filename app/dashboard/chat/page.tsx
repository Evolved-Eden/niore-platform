"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSelfClientKey } from "@/lib/client-view";

type Entity = {
  id: string;
  key: string;
  name: string;
  tagline?: string;
  type: "zuri" | "agent" | "swarm" | "twin";
  origin?: string;
};

type Message = {
  role: "user" | "assistant";
  content: string;
};

const SUGGESTED_PROMPTS = [
  "What's the current system status?",
  "Show me recent deployments",
  "Check user activity",
  "Run a system diagnostic",
];

const ENTITY_ICONS: Record<string, string> = {
  zuri: "✦",
  agent: "◇",
  swarm: "◈",
  twin: "◆",
};
const ENTITY_COLORS: Record<string, string> = {
  zuri: "#C6A664",
  agent: "#5E8B84",
  swarm: "#8B7AA8",
  twin: "#B5764A",
};

export default function AdminChatPage() {
  const { prefix: clientPrefix } = useSelfClientKey();
  const [entities, setEntities] = useState<Entity[]>([
    { id: "zuri", key: "zuri", name: "Zuri", tagline: "Core intelligence", type: "zuri" },
  ]);
  const [selectedKey, setSelectedKey] = useState("zuri");
  const [chatMode, setChatMode] = useState<"zuri" | "agent" | "swarm" | "twin">("zuri");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "I'm Zuri — your admin intelligence concierge.\n\nI can help you monitor deployments, manage users, check system status, and oversee the ecosystem.\n\nSelect an entity above and start chatting.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingEntities, setLoadingEntities] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const [agentsRes, swarmsRes] = await Promise.all([
          fetch("/api/agents"),
          fetch("/api/swarms"),
        ]);

        const all: Entity[] = [
          { id: "zuri", key: "zuri", name: "Zuri", tagline: "Core intelligence", type: "zuri" },
        ];

        if (agentsRes.ok) {
          const d = await agentsRes.json();
          for (const a of d.agents || []) {
            all.push({
              id: a.agent_id,
              key: a.agent_id,
              name: a.name,
              tagline: a.tagline || a.origin || "agent",
              type: "agent",
              origin: a.origin,
            });
          }
        }

        if (swarmsRes.ok) {
          const d = await swarmsRes.json();
          for (const s of d.swarms || []) {
            all.push({
              id: s.swarm_key,
              key: s.swarm_key,
              name: s.name,
              tagline: s.deployment_id ? "deployed" : s.template_type || "swarm",
              type: "swarm",
              origin: s.origin,
            });
          }
        }

        // Add twin option
        all.push({
          id: "twin",
          key: "twin",
          name: "My AI Twin",
          tagline: "Your digital intelligence",
          type: "twin",
        });

        setEntities(all);
      } catch {
        // Keep default Zuri only
      } finally {
        setLoadingEntities(false);
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

  const selectedEntity = entities.find((e) => e.key === selectedKey);
  const selectedName = selectedEntity?.name ?? selectedKey;

  function switchEntity(key: string) {
    const entity = entities.find((e) => e.key === key);
    setSelectedKey(key);
    setChatMode(entity?.type ?? "zuri");

    const entityName = entity?.name ?? key;
    const welcome: Record<string, string> = {
      zuri: `Switched to ${entityName}. How can I help you manage the ecosystem?`,
      agent: `Now chatting with **${entityName}**. This is a deployed intelligence agent. What would you like it to do?`,
      swarm: `Now managing **${entityName}**. This is a multi-agent swarm. You can monitor, configure, or direct it.`,
      twin: `Now connected to your **AI Twin**. Your twin reflects your blueprint, essence, and intelligence profile.`,
    };
    setMessages([
      {
        role: "assistant",
        content: welcome[entity?.type ?? "zuri"] ?? `Switched to ${entityName}.`,
      },
    ]);
  }

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
      const context = `User is an admin. Chat mode: ${chatMode}. Selected entity: ${selectedName} (${selectedKey}). User has access to all system management features including agents, swarms, twin, and deployments.`;
      const res = await fetch("/api/zuri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated.map((m) => ({ role: m.role, content: m.content })),
          context,
          // Zuri is the primary/base agent — every other agent routes
          // through her. Send the selected entity so she can route.
          entity: selectedEntity
            ? { id: selectedEntity.id, key: selectedEntity.key, name: selectedEntity.name, type: selectedEntity.type }
            : { id: "zuri", key: "zuri", name: "Zuri", type: "zuri" },
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
        { role: "assistant", content: "I'm having trouble connecting. Please try again or check your network." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSuggested(prompt: string) {
    setInput(prompt);
    setTimeout(() => {
      document.querySelector("form")?.requestSubmit();
    }, 100);
  }

  // Group entities by type for the mode tabs + dropdown
  const modeEntities = entities.filter((e) => e.type === chatMode);

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Mode tabs */}
      <div className="px-6 pt-6 pb-2 flex items-center gap-1 border-b border-white/[0.06]">
        {(["zuri", "agent", "swarm", "twin"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => {
              const first = entities.find((e) => e.type === mode);
              if (first) switchEntity(first.key);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-sm transition-all ${
              chatMode === mode
                ? "text-white bg-white/[0.04] border-b-2 border-[#C6A664]"
                : "text-white/30 hover:text-white/60"
            }`}
          >
            <span style={{ color: ENTITY_COLORS[mode] }}>{ENTITY_ICONS[mode]}</span>
            {mode === "zuri" ? "Zuri" : mode === "agent" ? "Agents" : mode === "swarm" ? "Swarms" : "Twin"}
          </button>
        ))}
      </div>

      {/* Entity selector within mode */}
      <div className="px-6 py-3 flex items-center gap-3">
        <label className="text-xs text-white/30 tracking-widest uppercase shrink-0">
          {chatMode === "zuri" ? "Entity" : chatMode === "agent" ? "Agent" : chatMode === "swarm" ? "Swarm" : "Twin"}
        </label>
        <select
          value={selectedKey}
          onChange={(e) => switchEntity(e.target.value)}
          disabled={loadingEntities}
          className="flex-1 max-w-xs px-3 py-2 bg-white/[0.04] border border-white/10 rounded-sm text-sm text-white/70 focus:outline-none focus:border-[#C6A664]/40 transition-all appearance-none disabled:opacity-40"
        >
          {modeEntities.map((entity) => (
            <option key={entity.key} value={entity.key} className="bg-[#0A0A0B]">
              {entity.name}{entity.tagline ? ` — ${entity.tagline}` : ""}
            </option>
          ))}
          {modeEntities.length === 0 && (
            <option value="" disabled className="bg-[#0A0A0B]">
              No {chatMode === "agent" ? "agents" : chatMode === "swarm" ? "swarms" : "entities"} available
            </option>
          )}
        </select>
        {loadingEntities && (
          <div className="w-3 h-3 border-2 border-[#C6A664] border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* Quick config links */}
      <div className="px-6 pb-3 flex items-center gap-2 flex-wrap">
        {chatMode === "agent" && clientPrefix && (
          <Link
            href={`${clientPrefix}/agents`}
            className="text-[10px] px-2 py-1 rounded-full border border-white/10 text-white/30 hover:text-white/60 hover:border-white/20 transition-all"
          >
            Manage Agents →
          </Link>
        )}
        {chatMode === "swarm" && clientPrefix && (
          <Link
            href={`${clientPrefix}/swarms`}
            className="text-[10px] px-2 py-1 rounded-full border border-white/10 text-white/30 hover:text-white/60 hover:border-white/20 transition-all"
          >
            Manage Swarms →
          </Link>
        )}
        {chatMode === "twin" && clientPrefix && (
          <Link
            href={`${clientPrefix}/twin`}
            className="text-[10px] px-2 py-1 rounded-full border border-white/10 text-white/30 hover:text-white/60 hover:border-white/20 transition-all"
          >
            Configure Twin →
          </Link>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3 px-6 pb-4">
        {[
          { label: "Agents", value: entities.filter((e) => e.type === "agent").length || "—", color: "#5E8B84" },
          { label: "Swarms", value: entities.filter((e) => e.type === "swarm").length || "—", color: "#8B7AA8" },
          { label: "Mode", value: chatMode === "zuri" ? "Zuri" : chatMode === "agent" ? "Agent" : chatMode === "swarm" ? "Swarm" : "Twin", color: "#C6A664" },
          { label: "Status", value: "Online", color: "#5E8B84" },
        ].map((stat) => (
          <div key={stat.label} className="glass rounded-sm p-3 border border-white/[0.06]">
            <div className="text-lg font-bold" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-[10px] text-white/30 tracking-wider uppercase mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-6">
        <div className="max-w-2xl mx-auto space-y-5">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                  msg.role === "user"
                    ? "bg-[#C6A664] text-black"
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
              placeholder={isLoading ? `${selectedName} is thinking...` : `Ask ${selectedName} anything...`}
              disabled={isLoading}
              className="flex-1 bg-white/[0.04] border border-white/10 rounded-sm px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors disabled:opacity-40"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-5 py-3 bg-[#C6A664] text-black text-sm font-bold rounded-sm hover:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
