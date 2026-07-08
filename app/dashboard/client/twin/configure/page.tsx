"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function TwinConfigurePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [twinId, setTwinId] = useState<string | null>(null);
  const [config, setConfig] = useState({
    name: "",
    personality_summary: "",
    autonomy_level: "guided",
    confidence_threshold: 70,
    memory_enabled: true,
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: twin } = await supabase
        .from("client_twins")
        .select("id, metadata, personality_summary")
        .eq("client_id", user.id)
        .maybeSingle();

      if (twin) {
        setTwinId(twin.id);
        const meta = (twin.metadata as Record<string, any>) || {};
        setConfig({
          name: meta.name || "",
          personality_summary: twin.personality_summary || meta.personality_summary || "",
          autonomy_level: meta.autonomy_level || "guided",
          confidence_threshold: meta.confidence_threshold ?? 70,
          memory_enabled: meta.memory_enabled !== false,
        });
      }
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const meta = {
        name: config.name,
        autonomy_level: config.autonomy_level,
        confidence_threshold: config.confidence_threshold,
        memory_enabled: config.memory_enabled,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("client_twins")
        .update({
          personality_summary: config.personality_summary,
          metadata: meta,
        } as any)
        .eq("id", twinId as string)
        .eq("client_id", user.id);

      if (error) throw error;
      setMessage({ type: "success", text: "Twin configuration saved successfully." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to save twin configuration." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-[#c8ff00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight mb-1">
          Configure <span className="text-[#fb923c]">Twin</span>
        </h1>
        <p className="text-white/30 text-sm">Customize your AI twin&apos;s personality, behavior, and intelligence settings</p>
      </div>

      {message && (
        <div className={`mb-6 px-4 py-3 rounded-sm text-sm border ${
          message.type === "success" ? "bg-[#c8ff00]/10 border-[#c8ff00]/30 text-[#c8ff00]" : "bg-red-900/20 border-red-800/30 text-red-400"
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {/* Name */}
        <div className="glass rounded-sm p-5 border border-white/[0.06]">
          <label className="block text-xs text-white/30 tracking-widest uppercase mb-2">Twin Name</label>
          <input
            type="text"
            value={config.name}
            onChange={(e) => setConfig({ ...config, name: e.target.value })}
            placeholder="My AI Twin"
            className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/10 rounded-sm text-sm text-white/70 focus:outline-none focus:border-[#fb923c]/40 transition-all"
          />
        </div>

        {/* Personality */}
        <div className="glass rounded-sm p-5 border border-white/[0.06]">
          <label className="block text-xs text-white/30 tracking-widest uppercase mb-2">Personality Summary</label>
          <textarea
            value={config.personality_summary}
            onChange={(e) => setConfig({ ...config, personality_summary: e.target.value })}
            rows={4}
            placeholder="Describe your twin's personality, communication style, and core traits..."
            className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/10 rounded-sm text-sm text-white/70 focus:outline-none focus:border-[#fb923c]/40 transition-all resize-none"
          />
          <p className="text-[10px] text-white/20 mt-1">This defines how your twin communicates and makes decisions.</p>
        </div>

        {/* Autonomy Level */}
        <div className="glass rounded-sm p-5 border border-white/[0.06]">
          <label className="block text-xs text-white/30 tracking-widest uppercase mb-2">Autonomy Level</label>
          <select
            value={config.autonomy_level}
            onChange={(e) => setConfig({ ...config, autonomy_level: e.target.value })}
            className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/10 rounded-sm text-sm text-white/70 focus:outline-none focus:border-[#fb923c]/40 transition-all appearance-none"
          >
            <option value="guided" className="bg-[#080810]">Guided — Requires approval for actions</option>
            <option value="semi_autonomous" className="bg-[#080810]">Semi-Autonomous — Acts within defined boundaries</option>
            <option value="autonomous" className="bg-[#080810]">Autonomous — Full decision-making authority</option>
          </select>
        </div>

        {/* Confidence Threshold */}
        <div className="glass rounded-sm p-5 border border-white/[0.06]">
          <label className="block text-xs text-white/30 tracking-widest uppercase mb-2">
            Confidence Threshold: {config.confidence_threshold}%
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={config.confidence_threshold}
            onChange={(e) => setConfig({ ...config, confidence_threshold: parseInt(e.target.value) })}
            className="w-full accent-[#fb923c]"
          />
          <div className="flex justify-between text-[10px] text-white/20 mt-1">
            <span>Conservative</span>
            <span>Aggressive</span>
          </div>
        </div>

        {/* Memory Toggle */}
        <div className="glass rounded-sm p-5 border border-white/[0.06]">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.memory_enabled}
              onChange={(e) => setConfig({ ...config, memory_enabled: e.target.checked })}
              className="accent-[#fb923c]"
            />
            <div>
              <span className="text-sm text-white/70">Enable Memory</span>
              <p className="text-[10px] text-white/30">Allow your twin to remember past conversations and learn from interactions</p>
            </div>
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-5 py-2.5 bg-[#fb923c] text-black text-xs font-bold rounded-sm hover:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              "Save Configuration"
            )}
          </button>
          <button
            onClick={() => router.push("/dashboard/client/twin")}
            className="px-5 py-2.5 border border-white/10 text-white/30 text-xs font-bold rounded-sm hover:text-white/50 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
