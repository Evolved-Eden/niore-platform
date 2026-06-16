"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────
type Consultation = {
  id: string;
  client_id: string;
  scheduled_at: string;
  duration_min: number;
  status: string;
  consultation_type: string;
  notes: string | null;
  meeting_link: string | null;
  zuri_followup: boolean;
  created_at: string;
  updated_at: string;
};

type ConsultationType = "standard" | "essence_review" | "agent_setup" | "strategy";

const CONSULTATION_TYPES: { value: ConsultationType; label: string; desc: string }[] = [
  { value: "standard", label: "Standard", desc: "General consultation & Q&A" },
  { value: "essence_review", label: "Essence Review", desc: "Deep-dive into your intelligence profile" },
  { value: "agent_setup", label: "Agent Setup", desc: "Deploy & configure AI agents" },
  { value: "strategy", label: "Strategy", desc: "High-level business intelligence strategy" },
];

const TYPE_LABELS: Record<string, string> = {
  standard: "Standard",
  essence_review: "Essence Review",
  agent_setup: "Agent Setup",
  strategy: "Strategy",
};

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  scheduled: { label: "Scheduled", color: "bg-[#c8ff00] text-black" },
  completed: { label: "Completed", color: "bg-white/10 text-white/50" },
  cancelled: { label: "Cancelled", color: "bg-red-500/20 text-red-400" },
  rescheduled: { label: "Rescheduled", color: "bg-amber-500/20 text-amber-400" },
};

// ── Helpers ───────────────────────────────────────────────────────
function getNext14BusinessDays(): Date[] {
  const days: Date[] = [];
  let d = new Date();
  d.setHours(0, 0, 0, 0);
  while (days.length < 14) {
    d = new Date(d.getTime() + 86400000);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) days.push(new Date(d));
  }
  return days;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" });
}

function toGoogleCalUrl(c: Consultation): string {
  const start = new Date(c.scheduled_at);
  const end = new Date(start.getTime() + c.duration_min * 60000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Evolved Eden Consultation: ${TYPE_LABELS[c.consultation_type] ?? c.consultation_type}`,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: `Consultation with Evolved Eden Concierge.\nType: ${TYPE_LABELS[c.consultation_type] ?? c.consultation_type}\nMeeting Link: ${c.meeting_link ?? "TBD"}\n${c.notes ? `Notes: ${c.notes}` : ""}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// ── Component ─────────────────────────────────────────────────────
export default function ConsultingPage() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isEligible, setIsEligible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Booking form state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [consultationType, setConsultationType] = useState<ConsultationType>("standard");
  const [notes, setNotes] = useState("");
  const [zuriFollowup, setZuriFollowup] = useState(true);
  const [booking, setBooking] = useState(false);

  // Connection state
  const [discordConnected, setDiscordConnected] = useState(false);
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [connectingDiscord, setConnectingDiscord] = useState(false);
  const [connectingWhatsApp, setConnectingWhatsApp] = useState(false);

  // Enhanced connection inputs
  const [discordUserId, setDiscordUserId] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');

  // Notification preferences
  const [discordBriefings, setDiscordBriefings] = useState(true);
  const [whatsappReminders, setWhatsappReminders] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(false);

  // Confirmation modal
  const [confirmBooking, setConfirmBooking] = useState<Consultation | null>(null);

  // ── Data fetching ────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [consRes, clientRes] = await Promise.all([
        fetch("/api/client/consultations"),
        fetch("/api/client"),
      ]);
      if (!consRes.ok) throw new Error("Failed to load consultations");
      const consData = await consRes.json();
      setConsultations(consData.consultations ?? []);

      if (clientRes.ok) {
        const clientData = await clientRes.json();
        setIsEligible(clientData.client?.consultation_eligible ?? true);
        setDiscordConnected(clientData.client?.zuri_discord_connected ?? false);
        setWhatsappConnected(clientData.client?.zuri_whatsapp_connected ?? false);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Date picker helpers ──────────────────────────────────────
  const businessDays = getNext14BusinessDays();

  const timeSlots = (() => {
    const slots: string[] = [];
    for (let h = 9; h < 17; h++) {
      slots.push(`${h.toString().padStart(2, "0")}:00`);
      slots.push(`${h.toString().padStart(2, "0")}:30`);
    }
    return slots;
  })();

  // ── Book consultation ────────────────────────────────────────
  async function handleBook() {
    if (!selectedDate || !selectedTime) return;
    const [h, m] = selectedTime.split(":").map(Number);
    const scheduled = new Date(selectedDate);
    scheduled.setHours(h, m, 0, 0);
    setBooking(true);
    try {
      const res = await fetch("/api/client/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduled_at: scheduled.toISOString(),
          duration_min: 30,
          consultation_type: consultationType,
          notes: notes || null,
          zuri_followup: zuriFollowup,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error ?? "Failed to book consultation");
      }
      const data = await res.json();
      setConfirmBooking(data.consultation);
      // Reset form
      setSelectedDate(null);
      setSelectedTime("");
      setNotes("");
      setConsultationType("standard");
      // Refresh list
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBooking(false);
    }
  }

  // ── Cancel consultation ──────────────────────────────────────
  async function handleCancel(id: string) {
    if (!confirm("Cancel this consultation?")) return;
    try {
      const res = await fetch("/api/client/consultations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to cancel");
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  }

  // ── Zuri Connect / Disconnect ────────────────────────────────
  async function handleConnectDiscord() {
    if (discordConnected) {
      // ── Disconnect ──
      setConnectingDiscord(true);
      try {
        const res = await fetch("/api/client/zuri-connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platform: "discord", platform_id: null }),
        });
        if (!res.ok) throw new Error("Failed to disconnect Discord");
        setDiscordConnected(false);
        setDiscordUserId("");
      } catch (err: any) {
        setError(err.message);
      } finally {
        setConnectingDiscord(false);
      }
    } else {
      // ── Connect ──
      if (!discordUserId.trim()) {
        setError("Please enter your Discord User ID");
        return;
      }
      setConnectingDiscord(true);
      try {
        const res = await fetch("/api/client/zuri-connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platform: "discord", platform_id: discordUserId.trim() }),
        });
        if (!res.ok) throw new Error("Failed to connect Discord");
        setDiscordConnected(true);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setConnectingDiscord(false);
      }
    }
  }

  async function handleConnectWhatsApp() {
    if (whatsappConnected) {
      // ── Disconnect ──
      setConnectingWhatsApp(true);
      try {
        const res = await fetch("/api/client/zuri-connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platform: "whatsapp", platform_id: null }),
        });
        if (!res.ok) throw new Error("Failed to disconnect WhatsApp");
        setWhatsappConnected(false);
        setWhatsappNumber("");
      } catch (err: any) {
        setError(err.message);
      } finally {
        setConnectingWhatsApp(false);
      }
    } else {
      // ── Connect ──
      if (!whatsappNumber.trim()) {
        setError("Please enter your WhatsApp number");
        return;
      }
      setConnectingWhatsApp(true);
      try {
        const res = await fetch("/api/client/zuri-connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platform: "whatsapp", platform_id: whatsappNumber.trim() }),
        });
        if (!res.ok) throw new Error("Failed to connect WhatsApp");
        setWhatsappConnected(true);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setConnectingWhatsApp(false);
      }
    }
  }

  // ── Derived data ─────────────────────────────────────────────
  const now = new Date();
  const upcoming = consultations.filter(
    (c) => new Date(c.scheduled_at) >= now && c.status === "scheduled"
  );
  const past = consultations.filter(
    (c) => new Date(c.scheduled_at) < now || c.status !== "scheduled"
  );

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto animate-fade-in pb-12">
      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-display text-2xl font-bold tracking-tight">
            <span className="text-[#c8ff00]">Evolved Eden Concierge</span>
          </h1>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-medium tracking-wider uppercase ${
              isEligible
                ? "bg-[#c8ff00]/10 text-[#c8ff00] border border-[#c8ff00]/20"
                : "bg-white/5 text-white/30 border border-white/10"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isEligible ? "bg-[#c8ff00] animate-pulse-slow" : "bg-white/20"
              }`}
            />
            {isEligible ? "Consultation Eligible" : "Not Eligible"}
          </span>
        </div>
        <p className="text-white/30 text-sm">
          Direct human intelligence when you need it. All plans include an optional 30-minute
          consultation.
        </p>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-sm bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
          <button
            onClick={() => setError("")}
            className="ml-3 text-red-300 hover:text-white underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Left Column (3/5) ─────────────────────────────── */}
        <div className="lg:col-span-3 space-y-6">
          {/* A. Book a Consultation */}
          <div className="glass rounded-sm p-6 border border-white/[0.06]">
            <h2 className="font-display text-base font-semibold tracking-tight mb-1">
              Book a Consultation
            </h2>
            <p className="text-white/30 text-xs mb-5">
              Select a date and time for your 30-minute session
            </p>

            {!isEligible ? (
              <div className="py-8 text-center">
                <div className="text-3xl mb-3 opacity-30">⊙</div>
                <p className="text-white/40 text-sm">
                  You are not eligible for consultations at this time. Contact support for more
                  information.
                </p>
              </div>
            ) : (
              <>
                {/* Date picker */}
                <div className="mb-5">
                  <div className="text-xs text-white/40 mb-2 tracking-wider">Select Date</div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {businessDays.map((d, i) => {
                      const selected =
                        selectedDate && d.toDateString() === selectedDate.toDateString();
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            setSelectedDate(d);
                            setSelectedTime("");
                          }}
                          className={`p-2 text-xs rounded-sm border transition-all ${
                            selected
                              ? "border-[#c8ff00] bg-[#c8ff00]/10 text-[#c8ff00]"
                              : "border-white/[0.06] hover:border-[#c8ff00]/40 text-white/60 hover:text-white"
                          }`}
                        >
                          <div className="text-[10px] opacity-50">
                            {d.toLocaleDateString("en-US", { weekday: "short" })}
                          </div>
                          <div className="font-medium">{d.getDate()}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time slots */}
                {selectedDate && (
                  <div className="mb-5 animate-fade-in">
                    <div className="text-xs text-white/40 mb-2 tracking-wider">
                      Select Time <span className="text-white/20">(EST)</span>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                      {timeSlots.map((t) => {
                        const [h, m] = t.split(":").map(Number);
                        const slotDate = new Date(selectedDate);
                        slotDate.setHours(h, m, 0, 0);
                        const isPast = slotDate < now;
                        return (
                          <button
                            key={t}
                            disabled={isPast}
                            onClick={() => setSelectedTime(t)}
                            className={`p-2 text-xs rounded-sm border transition-all ${
                              isPast
                                ? "border-white/[0.03] text-white/15 cursor-not-allowed"
                                : selectedTime === t
                                  ? "border-[#c8ff00] bg-[#c8ff00]/10 text-[#c8ff00]"
                                  : "border-white/[0.06] hover:border-[#c8ff00]/40 text-white/60 hover:text-white"
                            }`}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Consultation type */}
                <div className="mb-5">
                  <div className="text-xs text-white/40 mb-2 tracking-wider">Consultation Type</div>
                  <div className="grid grid-cols-2 gap-2">
                    {CONSULTATION_TYPES.map((ct) => (
                      <button
                        key={ct.value}
                        onClick={() => setConsultationType(ct.value)}
                        className={`p-3 rounded-sm border text-left transition-all ${
                          consultationType === ct.value
                            ? "border-[#c8ff00] bg-[#c8ff00]/5"
                            : "border-white/[0.06] hover:border-white/20"
                        }`}
                      >
                        <div
                          className={`text-xs font-medium mb-0.5 ${
                            consultationType === ct.value ? "text-[#c8ff00]" : "text-white/70"
                          }`}
                        >
                          {ct.label}
                        </div>
                        <div className="text-[10px] text-white/30">{ct.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="mb-5">
                  <div className="text-xs text-white/40 mb-2 tracking-wider">
                    Notes <span className="text-white/20">(optional)</span>
                  </div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="What would you like to discuss?"
                    rows={3}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-sm px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors resize-none"
                  />
                </div>

                {/* Zuri follow-up toggle */}
                <div className="mb-5 flex items-center gap-3">
                  <button
                    onClick={() => setZuriFollowup(!zuriFollowup)}
                    className={`relative w-9 h-5 rounded-full transition-all ${
                      zuriFollowup ? "bg-[#c8ff00]" : "bg-white/10"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                        zuriFollowup ? "left-[18px]" : "left-0.5"
                      }`}
                    />
                  </button>
                  <span className="text-xs text-white/50">
                    Notify me via Zuri Discord / WhatsApp
                  </span>
                </div>

                {/* Submit */}
                <button
                  onClick={handleBook}
                  disabled={!selectedDate || !selectedTime || booking}
                  className="w-full px-5 py-3 bg-[#c8ff00] text-black text-sm font-bold rounded-sm hover:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {booking ? "Booking..." : "Book Consultation"}
                </button>
              </>
            )}
          </div>

          {/* B. Upcoming Consultations */}
          <div className="glass rounded-sm p-6 border border-white/[0.06]">
            <h2 className="font-display text-base font-semibold tracking-tight mb-1">
              Upcoming Consultations
            </h2>
            <p className="text-white/30 text-xs mb-5">Your scheduled sessions</p>

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-20 rounded-sm bg-white/[0.03] border border-white/[0.06] animate-pulse"
                  />
                ))}
              </div>
            ) : upcoming.length === 0 ? (
              <div className="py-8 text-center">
                <div className="text-2xl mb-2 opacity-20">◇</div>
                <p className="text-white/30 text-sm">
                  No consultations booked. Book your 30-minute session above.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map((c) => {
                  const badge = STATUS_BADGES[c.status] ?? {
                    label: c.status,
                    color: "bg-white/5 text-white/40",
                  };
                  return (
                    <div
                      key={c.id}
                      className="rounded-sm border border-white/[0.06] p-4 hover:border-white/15 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-white/80">
                            {formatTime(c.scheduled_at)}
                          </div>
                          <div className="text-xs text-white/40 mt-0.5">
                            {new Date(c.scheduled_at).toLocaleDateString("en-US", {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })}{" "}
                            · {c.duration_min} min
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span
                              className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium ${badge.color}`}
                            >
                              {badge.label}
                            </span>
                            <span className="text-[10px] text-white/30">
                              {TYPE_LABELS[c.consultation_type] ?? c.consultation_type}
                            </span>
                          </div>
                          {c.meeting_link && (
                            <a
                              href={c.meeting_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block mt-1.5 text-[11px] text-[#c8ff00]/60 hover:text-[#c8ff00] underline underline-offset-2"
                            >
                              {c.meeting_link}
                            </a>
                          )}
                          {c.notes && (
                            <p className="mt-1.5 text-[11px] text-white/30 italic line-clamp-2">
                              {c.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <a
                            href={toGoogleCalUrl(c)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 text-[10px] rounded-sm border border-white/[0.06] text-white/40 hover:text-white hover:border-white/20 transition-all"
                            title="Add to Calendar"
                          >
                            +Cal
                          </a>
                          <button
                            onClick={() => handleCancel(c.id)}
                            className="px-2.5 py-1.5 text-[10px] rounded-sm border border-red-500/20 text-red-400/60 hover:text-red-400 hover:border-red-500/40 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Past consultations collapsed */}
            {past.length > 0 && (
              <details className="mt-4 group">
                <summary className="text-xs text-white/30 cursor-pointer hover:text-white/50 transition-colors">
                  Past consultations ({past.length})
                </summary>
                <div className="mt-3 space-y-2">
                  {past.map((c) => {
                    const badge = STATUS_BADGES[c.status] ?? {
                      label: c.status,
                      color: "bg-white/5 text-white/40",
                    };
                    return (
                      <div
                        key={c.id}
                        className="rounded-sm border border-white/[0.04] p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-white/50">
                              {new Date(c.scheduled_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}{" "}
                              · {formatTime(c.scheduled_at)}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium ${badge.color}`}
                              >
                                {badge.label}
                              </span>
                              <span className="text-[10px] text-white/20">
                                {TYPE_LABELS[c.consultation_type] ?? c.consultation_type}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>
            )}
          </div>
        </div>

        {/* ── Right Column (2/5) ────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* C. Zuri Bot Connection */}
          <div className="glass rounded-sm p-6 border border-white/[0.06]">
            <h2 className="font-display text-base font-semibold tracking-tight mb-1">
              Zuri Connection
            </h2>
            <p className="text-white/30 text-xs mb-5">
              Connect your Zuri intelligence to platforms you use every day.
            </p>

            {/* Discord */}
            <div className="mb-5 pb-5 border-b border-white/[0.06]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm opacity-70">◆</span>
                  <span className="text-sm text-white/80">Discord</span>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    discordConnected
                      ? "bg-[#c8ff00]/10 text-[#c8ff00] border border-[#c8ff00]/20"
                      : "bg-white/5 text-white/30 border border-white/10"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      discordConnected ? "bg-[#c8ff00]" : "bg-white/20"
                    }`}
                  />
                  {discordConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
              <p className="text-[11px] text-white/30 mb-3">
                Get Zuri&apos;s intelligence directly in your Discord server
              </p>

              {discordConnected ? (
                <div className="mb-3 px-3 py-2 rounded-sm bg-[#c8ff00]/5 border border-[#c8ff00]/10">
                  <div className="text-xs text-[#c8ff00] font-medium">Connected</div>
                  <div className="text-[11px] text-white/40 mt-0.5 font-mono truncate">
                    ID: {discordUserId || "synced"}
                  </div>
                </div>
              ) : (
                <div className="mb-3">
                  <label htmlFor="consult-discord-id" className="block text-[11px] text-white/40 mb-1">
                    Your Discord User ID
                  </label>
                  <input
                    id="consult-discord-id"
                    type="text"
                    value={discordUserId}
                    onChange={(e) => setDiscordUserId(e.target.value)}
                    placeholder="e.g. 123456789012345678"
                    className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors"
                  />
                  <p className="text-[10px] text-white/20 mt-1">
                    Discord Settings &gt; Advanced &gt; Developer Mode &gt; Right-click your name &gt; Copy ID
                  </p>
                </div>
              )}

              <button
                onClick={handleConnectDiscord}
                disabled={connectingDiscord}
                className={`w-full px-4 py-2 text-xs font-bold rounded-sm transition-all ${
                  discordConnected
                    ? "border border-red-500/20 text-red-400/70 hover:text-red-400 hover:border-red-500/40 bg-transparent"
                    : "bg-[#c8ff00] text-black hover:bg-white"
                } disabled:opacity-40`}
              >
                {connectingDiscord
                  ? "Connecting..."
                  : discordConnected
                    ? "Disconnect Discord"
                    : "Connect Discord"}
              </button>
            </div>

            {/* WhatsApp */}
            <div className="mb-5 pb-5 border-b border-white/[0.06]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm opacity-70">▼</span>
                  <span className="text-sm text-white/80">WhatsApp</span>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    whatsappConnected
                      ? "bg-[#c8ff00]/10 text-[#c8ff00] border border-[#c8ff00]/20"
                      : "bg-white/5 text-white/30 border border-white/10"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      whatsappConnected ? "bg-[#c8ff00]" : "bg-white/20"
                    }`}
                  />
                  {whatsappConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
              <p className="text-[11px] text-white/30 mb-3">
                Chat with Zuri on WhatsApp for on-the-go intelligence
              </p>

              {whatsappConnected ? (
                <div className="mb-3 px-3 py-2 rounded-sm bg-[#c8ff00]/5 border border-[#c8ff00]/10">
                  <div className="text-xs text-[#c8ff00] font-medium">Connected</div>
                  <div className="text-[11px] text-white/40 mt-0.5 font-mono truncate">
                    {whatsappNumber || "Number synced"}
                  </div>
                </div>
              ) : (
                <div className="mb-3">
                  <label htmlFor="consult-whatsapp-number" className="block text-[11px] text-white/40 mb-1">
                    Your WhatsApp Number
                  </label>
                  <input
                    id="consult-whatsapp-number"
                    type="text"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors"
                  />
                  <p className="text-[10px] text-white/20 mt-1">
                    Enter your full number with country code
                  </p>
                </div>
              )}

              {/* QR placeholder */}
              {!whatsappConnected && (
                <div className="mb-3 p-4 rounded-sm border border-white/[0.06] bg-white/[0.02] text-center">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-sm bg-white/[0.04] border border-white/[0.06] mb-2">
                    <span className="text-[10px] text-white/20">QR</span>
                  </div>
                  <p className="text-[10px] text-white/20">
                    Scan to connect Zuri on WhatsApp
                  </p>
                </div>
              )}

              <button
                onClick={handleConnectWhatsApp}
                disabled={connectingWhatsApp}
                className={`w-full px-4 py-2 text-xs font-bold rounded-sm transition-all ${
                  whatsappConnected
                    ? "border border-red-500/20 text-red-400/70 hover:text-red-400 hover:border-red-500/40 bg-transparent"
                    : "bg-[#c8ff00] text-black hover:bg-white"
                } disabled:opacity-40`}
              >
                {connectingWhatsApp
                  ? "Connecting..."
                  : whatsappConnected
                    ? "Disconnect WhatsApp"
                    : "Connect WhatsApp"}
              </button>
            </div>

            {/* Notification Preferences */}
            <div>
              <h3 className="text-xs text-white/30 tracking-wider uppercase mb-3">
                Configure Notifications
              </h3>
              <div className="space-y-1">
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-white/60">Receive essence briefings on Discord</span>
                  <button
                    onClick={() => setDiscordBriefings(!discordBriefings)}
                    className={`relative w-8 h-4 rounded-full transition-all ${
                      discordBriefings ? "bg-[#c8ff00]" : "bg-white/10"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${
                        discordBriefings ? "left-[16px]" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-white/60">Receive consultation reminders on WhatsApp</span>
                  <button
                    onClick={() => setWhatsappReminders(!whatsappReminders)}
                    className={`relative w-8 h-4 rounded-full transition-all ${
                      whatsappReminders ? "bg-[#c8ff00]" : "bg-white/10"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${
                        whatsappReminders ? "left-[16px]" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-white/60">Daily intelligence digest</span>
                  <button
                    onClick={() => setDailyDigest(!dailyDigest)}
                    className={`relative w-8 h-4 rounded-full transition-all ${
                      dailyDigest ? "bg-[#c8ff00]" : "bg-white/10"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${
                        dailyDigest ? "left-[16px]" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-white/20 mt-3 italic">
                Notification preferences are saved locally. Full sync coming soon.
              </p>
            </div>
          </div>

          {/* D. Quick Actions */}
          <div className="glass rounded-sm p-6 border border-white/[0.06]">
            <h2 className="font-display text-base font-semibold tracking-tight mb-1">
              Quick Actions
            </h2>
            <p className="text-white/30 text-xs mb-5">Shortcuts to essential tools</p>

            <div className="space-y-2">
              <Link
                href="/dashboard/client/zuri"
                className="flex items-center gap-3 px-4 py-3 rounded-sm border border-white/[0.06] hover:border-[#c8ff00]/30 hover:bg-white/[0.02] transition-all group"
              >
                <span className="text-base" style={{ color: "#c8ff00" }}>
                  ◆
                </span>
                <div>
                  <div className="text-sm text-white/70 group-hover:text-white transition-colors">
                    Open Zuri Chat
                  </div>
                  <div className="text-[10px] text-white/30">Talk to your intelligence concierge</div>
                </div>
              </Link>

              <a
                href="mailto:support@evolvededen.ai"
                className="flex items-center gap-3 px-4 py-3 rounded-sm border border-white/[0.06] hover:border-white/20 hover:bg-white/[0.02] transition-all group"
              >
                <span className="text-base opacity-50">@</span>
                <div>
                  <div className="text-sm text-white/70 group-hover:text-white transition-colors">
                    Email Support
                  </div>
                  <div className="text-[10px] text-white/30">support@evolvededen.ai</div>
                </div>
              </a>

              <Link
                href="#"
                onClick={(e) => e.preventDefault()}
                className="flex items-center gap-3 px-4 py-3 rounded-sm border border-white/[0.06] hover:border-white/20 hover:bg-white/[0.02] transition-all group"
              >
                <span className="text-base opacity-50">?</span>
                <div>
                  <div className="text-sm text-white/70 group-hover:text-white transition-colors">
                    View Knowledge Base
                  </div>
                  <div className="text-[10px] text-white/30">Guides, FAQs & documentation</div>
                </div>
              </Link>

              <button
                onClick={() => {
                  // Auto-fill the booking form for a recurring strategy session
                  setConsultationType("strategy");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-sm border border-[#c8ff00]/10 hover:border-[#c8ff00]/30 hover:bg-[#c8ff00]/[0.02] transition-all group text-left"
              >
                <span className="text-base" style={{ color: "#c8ff00" }}>
                  ↻
                </span>
                <div>
                  <div className="text-sm text-white/70 group-hover:text-white transition-colors">
                    Schedule Recurring
                  </div>
                  <div className="text-[10px] text-white/30">Set up a regular strategy session</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Confirmation Modal ───────────────────────────────── */}
      {confirmBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md glass rounded-sm p-8 border border-white/[0.08] shadow-2xl">
            {/* Close */}
            <button
              onClick={() => setConfirmBooking(null)}
              className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors text-lg"
            >
              ✕
            </button>

            {/* Icon */}
            <div className="w-12 h-12 rounded-full bg-[#c8ff00]/10 border border-[#c8ff00]/20 flex items-center justify-center mb-4 mx-auto">
              <span className="text-xl" style={{ color: "#c8ff00" }}>
                ✓
              </span>
            </div>

            <h3 className="font-display text-lg font-bold text-center mb-1">
              Consultation Confirmed
            </h3>
            <p className="text-white/30 text-xs text-center mb-6">
              Your 30-minute session has been booked
            </p>

            {/* Details */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center py-2 border-b border-white/[0.06]">
                <span className="text-xs text-white/40">Date</span>
                <span className="text-xs text-white/80 font-medium">
                  {new Date(confirmBooking.scheduled_at).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/[0.06]">
                <span className="text-xs text-white/40">Time</span>
                <span className="text-xs text-white/80 font-medium">
                  {formatTime(confirmBooking.scheduled_at)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/[0.06]">
                <span className="text-xs text-white/40">Type</span>
                <span className="text-xs text-white/80 font-medium">
                  {TYPE_LABELS[confirmBooking.consultation_type] ?? confirmBooking.consultation_type}
                </span>
              </div>
              {confirmBooking.meeting_link && (
                <div className="flex justify-between items-center py-2 border-b border-white/[0.06]">
                  <span className="text-xs text-white/40">Meeting Link</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(confirmBooking.meeting_link!);
                    }}
                    className="text-xs text-[#c8ff00]/70 hover:text-[#c8ff00] underline underline-offset-2"
                  >
                    Copy Link
                  </button>
                </div>
              )}
            </div>

            {/* Meeting link display */}
            {confirmBooking.meeting_link && (
              <div className="mb-5 p-3 rounded-sm bg-white/[0.03] border border-white/[0.06] text-center">
                <div className="text-[11px] text-white/50 mb-1">Meeting Link</div>
                <a
                  href={confirmBooking.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#c8ff00]/80 hover:text-[#c8ff00] underline underline-offset-2 break-all"
                >
                  {confirmBooking.meeting_link}
                </a>
              </div>
            )}

            {/* Add to Calendar */}
            <a
              href={toGoogleCalUrl(confirmBooking)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-white/[0.06] border border-white/10 text-white/70 text-xs font-medium rounded-sm hover:bg-white/[0.1] hover:text-white transition-all mb-3"
            >
              <span>📅</span>
              Add to Calendar
            </a>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setConfirmBooking(null);
                  window.location.href = "/dashboard/client";
                }}
                className="flex-1 px-4 py-2.5 border border-white/10 text-white/50 text-xs font-medium rounded-sm hover:text-white hover:border-white/20 transition-all"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => {
                  setConfirmBooking(null);
                  setSelectedDate(null);
                  setSelectedTime("");
                }}
                className="flex-1 px-4 py-2.5 bg-[#c8ff00] text-black text-xs font-bold rounded-sm hover:bg-white transition-all"
              >
                Book Another
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
