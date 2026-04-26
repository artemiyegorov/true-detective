"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { portraitVariantFor, portraitPath } from "@/lib/portrait";
import type { NpcId } from "@/lib/npc";
import { meetNpc, recordNpcReveal, unlockLocation } from "@/lib/player-state";

type Msg = {
  role: "user" | "assistant";
  content: string;
  voiceText?: string;
  mood?: string;
  evidenceId?: string;
  t?: string;
};

const INITIAL_MOODS: Partial<Record<NpcId, string>> = {
  tom: "warm",
  sarah: "calm",
  david: "grieving",
  daniel: "nervous",
  martin: "sad",
  tyler: "numb",
  kevin: "helpful",
  eleanor: "confused",
};

const NPC_ROLE: Partial<Record<NpcId, string>> = {
  tom: "family friend",
  sarah: "business partner",
  david: "husband",
  daniel: "neighbour",
  martin: "baker",
  tyler: "son",
  kevin: "bartender",
  eleanor: "neighbour",
};

function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function Chat({
  npcId,
  npcName,
  evidenceList,
}: {
  npcId: NpcId;
  npcName: string;
  evidenceList: Array<{ id: string; name: string }>;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [mood, setMood] = useState<string>(INITIAL_MOODS[npcId] ?? "calm");
  const [evidencePresented, setEvidencePresented] = useState<string[]>([]);
  const [showEvidencePicker, setShowEvidencePicker] = useState(false);
  const [unlockToast, setUnlockToast] = useState<string | null>(null);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [npcSpeaking, setNpcSpeaking] = useState(false);
  const [typed, setTyped] = useState("");
  const [holding, setHolding] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<unknown>(null);

  // Track "I've met them" once.
  useEffect(() => {
    meetNpc(npcId);
  }, [npcId]);

  // Auto-scroll transcript to the bottom on new messages while open.
  useEffect(() => {
    if (transcriptOpen) {
      transcriptRef.current?.scrollTo({
        top: transcriptRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, pending, transcriptOpen]);

  const lastNpc = [...messages].reverse().find(m => m.role === "assistant");

  // Subtitle typewriter — types out the latest NPC line so the on-screen
  // subtitle reads as if they're saying it now.
  useEffect(() => {
    if (!lastNpc?.content) return;
    const full = lastNpc.content;
    setTyped("");
    setNpcSpeaking(true);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setTyped(full.slice(0, i));
      if (i >= full.length) {
        clearInterval(id);
        setTimeout(() => setNpcSpeaking(false), 400);
      }
    }, 32);
    return () => clearInterval(id);
  }, [lastNpc?.content]);

  // Re-mute or fully stop audio when toggled on.
  useEffect(() => {
    if (!audioRef.current) return;
    if (muted) {
      audioRef.current.pause();
      audioRef.current.muted = true;
    } else {
      audioRef.current.muted = false;
    }
  }, [muted]);

  // Send message (voice or text) → /api/dialogue → /api/tts.
  const send = useCallback(async (playerText: string, newEvidenceId?: string) => {
    if (!playerText.trim() && !newEvidenceId) return;
    setPending(true);
    setShowEvidencePicker(false);

    const userMsg: Msg = {
      role: "user",
      content: playerText.trim() || "(presents evidence in silence)",
      evidenceId: newEvidenceId,
      t: nowHHMM(),
    };
    const newHistory: Msg[] = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setLiveTranscript("");

    try {
      const dialogueRes = await fetch("/api/dialogue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          npcId,
          messages: newHistory.map(m => ({ role: m.role, content: m.content })),
          evidencePresented,
          newEvidenceId,
        }),
      });
      const dialogue = await dialogueRes.json();
      if (!dialogueRes.ok) {
        setMessages([...newHistory, { role: "assistant", content: `[error: ${dialogue.error || "unknown"}]`, t: nowHHMM() }]);
        setPending(false);
        return;
      }

      const newMood = dialogue.state?.mood ?? mood;
      setMood(newMood);
      const updatedEvidence = newEvidenceId
        ? [...evidencePresented, newEvidenceId]
        : evidencePresented;
      setEvidencePresented(updatedEvidence);

      setMessages([
        ...newHistory,
        {
          role: "assistant",
          content: dialogue.voice_text_clean,
          voiceText: dialogue.voice_text,
          mood: newMood,
          t: nowHHMM(),
        },
      ]);

      const unlocks = (dialogue.unlocked_locations as string[] | undefined) ?? [];
      if (unlocks.length) {
        unlocks.forEach(unlockLocation);
        setUnlockToast(unlocks.join(", "));
        setTimeout(() => setUnlockToast(null), 4000);
      }

      const revealed = (dialogue.state?.revealed_info as string[] | undefined) ?? [];
      if (revealed.length) recordNpcReveal(npcId, revealed);

      // TTS — skip the call entirely when the user has muted audio.
      // Saves an ElevenLabs request per turn while muted.
      if (!muted) {
        try {
          const ttsRes = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              npcId,
              voiceText: dialogue.voice_text,
              mood: newMood,
            }),
          });
          if (ttsRes.ok && audioRef.current) {
            const blob = await ttsRes.blob();
            const url = URL.createObjectURL(blob);
            audioRef.current.src = url;
            audioRef.current.muted = false;
            audioRef.current.play().catch(() => undefined);
          }
        } catch {
          /* voice failure is non-fatal */
        }
      }
    } finally {
      setPending(false);
    }
  }, [evidencePresented, messages, mood, npcId, muted]);

  // === Hold-to-speak — Web Speech API ===
  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;
    const SR = (window as unknown as {
      SpeechRecognition?: new () => unknown;
      webkitSpeechRecognition?: new () => unknown;
    }).SpeechRecognition || (window as unknown as {
      webkitSpeechRecognition?: new () => unknown;
    }).webkitSpeechRecognition;
    if (!SR) return; // browser doesn't support — UX falls back to keyboard

    setLiveTranscript("");
    setNpcSpeaking(false);
    if (audioRef.current) audioRef.current.pause();

    const recognition = new (SR as new () => {
      lang: string; continuous: boolean; interimResults: boolean;
      onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
      onerror: (e: unknown) => void;
      onend: () => void;
      start: () => void; stop: () => void;
    })();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = e => {
      let combined = "";
      for (let i = 0; i < e.results.length; i++) {
        combined += e.results[i][0].transcript;
      }
      setLiveTranscript(combined);
    };
    recognition.onerror = () => { /* ignore */ };
    recognition.onend = () => { /* handled in stopListening */ };
    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch {
      /* already started — ignore */
    }
  }, []);

  const stopListening = useCallback(() => {
    const rec = recognitionRef.current as { stop?: () => void } | null;
    if (rec?.stop) rec.stop();
    recognitionRef.current = null;
    // Snapshot transcript and send.
    setLiveTranscript(t => {
      const trimmed = t.trim();
      if (trimmed) send(trimmed);
      return t;
    });
  }, [send]);

  function onHoldStart() {
    setHolding(true);
    startListening();
  }
  function onHoldEnd() {
    setHolding(false);
    stopListening();
  }

  const variant = portraitVariantFor(npcId, mood);
  const portraitSrc = portraitPath(npcId, variant);
  const role = NPC_ROLE[npcId] ?? "";

  return (
    <div
      className="relative min-h-screen overflow-hidden noir-grain"
      style={{ background: "var(--bg)", color: "var(--fg)" }}
    >
      {/* Portrait — full-bleed when collapsed, top band when transcript open */}
      <div
        className="absolute inset-x-0 top-0 z-[1]"
        style={{
          height: transcriptOpen ? "44vh" : "100%",
          transition: "height 0.3s ease",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={portraitSrc}
          alt={npcName}
          className="absolute inset-0 w-full h-full object-cover object-top"
          draggable={false}
        />
        {/* warm rim light */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 70% at 80% 30%, rgba(200,160,90,0.18) 0%, transparent 60%)",
          }}
        />
        {/* film grain stripes */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.06,
            backgroundImage:
              "repeating-linear-gradient(135deg, rgba(232,225,211,0.5) 0 1px, transparent 1px 14px)",
          }}
        />
        {/* breathing glow when speaking */}
        {npcSpeaking && !muted && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 50% 35% at 50% 38%, rgba(168,57,46,0.18) 0%, transparent 60%)",
              animation: "recpulse 2.8s ease-in-out infinite",
            }}
          />
        )}
        {/* heavy vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ boxShadow: "inset 0 0 180px rgba(0,0,0,0.95)" }}
        />
        {/* fade into transcript */}
        {transcriptOpen && (
          <div
            className="absolute left-0 right-0 bottom-0 h-[60px] pointer-events-none"
            style={{ background: "linear-gradient(0deg, #0a0806 0%, transparent 100%)" }}
          />
        )}
      </div>

      {/* Top bar: ← board · REC · mute */}
      <div
        className="absolute top-0 inset-x-0 z-20 flex items-center justify-between"
        style={{
          padding: "20px 18px 14px",
          background:
            "linear-gradient(180deg, rgba(8,6,4,0.85) 0%, rgba(8,6,4,0.55) 60%, transparent 100%)",
        }}
      >
        <Link
          href="/board"
          className="font-elite uppercase"
          style={{
            color: "var(--fg)",
            fontSize: 10,
            letterSpacing: "0.3em",
            opacity: 0.85,
            padding: "4px 0",
          }}
        >
          ← BOARD
        </Link>

        <div
          className="font-elite uppercase flex items-center gap-1.5"
          style={{
            fontSize: 9,
            letterSpacing: "0.32em",
            color: "rgba(232,225,211,0.7)",
          }}
        >
          <span
            className="rounded-full"
            style={{
              width: 7,
              height: 7,
              background: "var(--accent)",
              boxShadow: "0 0 6px var(--accent)",
              animation: "recpulse 1.4s ease-in-out infinite",
            }}
          />
          REC · {nowHHMM()}
        </div>

        <button
          onClick={() => setMuted(m => !m)}
          aria-label={muted ? "Unmute" : "Mute"}
          className="bg-transparent border-0 p-1 flex"
          style={{ color: muted ? "var(--accent)" : "rgba(232,225,211,0.85)" }}
        >
          {muted ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 7v4h2l3 3V4L5 7H3z" fill="currentColor" />
              <path d="M12 6l4 6M16 6l-4 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 7v4h2l3 3V4L5 7H3z" fill="currentColor" />
              <path
                d="M12 6.5c1.2.9 1.2 4.1 0 5M14 5c2 1.5 2 6.5 0 8"
                stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Subtitle band (only when transcript collapsed) */}
      {!transcriptOpen && (
        <div
          className="absolute inset-x-0 z-[6]"
          style={{
            bottom: 110,
            padding: "60px 22px 22px",
            background:
              "linear-gradient(0deg, rgba(8,6,4,0.92) 0%, rgba(8,6,4,0.7) 60%, transparent 100%)",
          }}
        >
          <div
            className="font-elite uppercase"
            style={{
              fontSize: 9,
              letterSpacing: "0.32em",
              color: "rgba(232,225,211,0.55)",
            }}
          >
            {npcName}{role ? ` · ${role}` : ""}
          </div>
          <div
            className="font-fell uppercase"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "rgba(232,225,211,0.55)",
              letterSpacing: "0.04em",
              marginTop: 4,
            }}
          >
            {pending ? "thinking…" : holding ? "listening…" : npcSpeaking ? "speaking…" : "listening"}
          </div>

          {(holding || liveTranscript) && (
            <p
              className="italic"
              style={{
                marginTop: 12,
                fontSize: 15,
                lineHeight: 1.4,
                color: "var(--accent)",
                textShadow: "0 1px 8px rgba(0,0,0,0.9)",
              }}
            >
              <span
                className="font-elite uppercase"
                style={{ fontSize: 8.5, letterSpacing: "0.32em", marginRight: 8, opacity: 0.7 }}
              >
                you
              </span>
              {liveTranscript || "…"}
            </p>
          )}

          {!holding && lastNpc && (
            <div className="mt-3 flex items-baseline gap-2 min-w-0">
              <span
                className="font-elite uppercase shrink-0"
                style={{
                  fontSize: 8.5,
                  letterSpacing: "0.32em",
                  color: "rgba(232,225,211,0.5)",
                }}
              >
                ● live
              </span>
              <p
                className="italic m-0 flex-1 min-w-0"
                style={{
                  fontSize: 15,
                  lineHeight: 1.4,
                  color: "#f0e8d8",
                  textShadow: "0 1px 8px rgba(0,0,0,0.9)",
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical" as const,
                }}
              >
                “{typed}
                {npcSpeaking && (
                  <span
                    className="inline-block align-middle"
                    style={{
                      width: 2,
                      height: "0.95em",
                      marginLeft: 1,
                      background: "var(--accent)",
                      animation: "subcursor 0.7s steps(2) infinite",
                    }}
                  />
                )}”
              </p>
            </div>
          )}
        </div>
      )}

      {/* Transcript sheet */}
      <div
        className="absolute inset-x-0 z-[9] flex flex-col"
        style={{
          bottom: transcriptOpen ? 78 : 72,
          top: transcriptOpen ? "44vh" : "auto",
          height: transcriptOpen ? "auto" : 24,
          background: "rgba(8,6,4,0.96)",
          borderTop: "1px solid rgba(232,225,211,0.18)",
          borderBottom: transcriptOpen ? "1px solid rgba(232,225,211,0.1)" : "none",
          transition: "bottom 0.28s ease, top 0.28s ease, height 0.28s ease",
        }}
      >
        <button
          onClick={() => setTranscriptOpen(o => !o)}
          aria-label={transcriptOpen ? "Collapse transcript" : "Expand transcript"}
          className="bg-transparent border-0 cursor-pointer flex items-center justify-center"
          style={{ height: 24, flexShrink: 0, padding: 0, color: "var(--fg)" }}
        >
          <span style={{ width: 36, height: 3, background: "rgba(232,225,211,0.4)" }} />
        </button>
        {transcriptOpen && (
          <div
            ref={transcriptRef}
            className="flex-1 overflow-y-auto"
            style={{ padding: "14px 22px 32px" }}
          >
            {messages.length === 0 && (
              <p className="italic" style={{ color: "rgba(232,225,211,0.45)", fontSize: 14 }}>
                Press and hold the speak button to start the interview.
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ marginBottom: 18 }}>
                <div
                  className="font-elite uppercase"
                  style={{
                    fontSize: 8.5,
                    letterSpacing: "0.28em",
                    color: m.role === "assistant" ? "rgba(232,225,211,0.55)" : "rgba(168,57,46,0.75)",
                    marginBottom: 4,
                  }}
                >
                  {m.role === "assistant" ? npcName.split(" ")[0].toUpperCase() : "YOU"}{m.t ? ` · ${m.t}` : ""}
                </div>
                {m.evidenceId && (
                  <div
                    className="font-elite uppercase"
                    style={{
                      fontSize: 8,
                      letterSpacing: "0.22em",
                      color: "var(--accent)",
                      marginBottom: 4,
                    }}
                  >
                    📎 presented · {m.evidenceId}
                  </div>
                )}
                <div
                  style={{
                    fontSize: 15,
                    lineHeight: 1.5,
                    color: m.role === "assistant" ? "var(--fg)" : "rgba(232,225,211,0.7)",
                    fontStyle: m.role === "user" ? "italic" : "normal",
                    paddingLeft: m.role === "user" ? 14 : 0,
                    borderLeft: m.role === "user" ? "1px solid rgba(168,57,46,0.6)" : "none",
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {pending && (
              <div className="italic" style={{ color: "rgba(232,225,211,0.45)", fontSize: 14 }}>
                {npcName.split(" ")[0]} is thinking…
              </div>
            )}
          </div>
        )}
      </div>

      {/* Talk pad — bottom, always visible */}
      <div
        className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between gap-2"
        style={{
          padding: "14px 22px 24px 18px",
          background: "rgba(8,6,4,0.92)",
          borderTop: "1px solid rgba(232,225,211,0.1)",
        }}
      >
        {/* paperclip */}
        <button
          aria-label="Present evidence"
          onClick={() => setShowEvidencePicker(s => !s)}
          disabled={pending}
          style={{
            width: 40,
            height: 40,
            background: "rgba(232,225,211,0.05)",
            border: "1px solid rgba(232,225,211,0.12)",
            color: "rgba(232,225,211,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
            <path
              d="M11 5v8a4 4 0 01-8 0V4a3 3 0 016 0v8a2 2 0 01-4 0V6"
              stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none"
            />
          </svg>
        </button>

        {transcriptOpen ? (
          <>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder={`Ask ${npcName.split(" ")[0]} something…`}
              className="font-ui italic"
              style={{
                flex: 1,
                background: "rgba(232,225,211,0.05)",
                border: "1px solid rgba(232,225,211,0.18)",
                paddingLeft: 12,
                paddingRight: 4,
                height: 40,
                fontSize: 14,
                color: "var(--fg)",
                outline: "none",
              }}
            />
            <button
              aria-label="Voice"
              onMouseDown={onHoldStart}
              onMouseUp={onHoldEnd}
              onTouchStart={onHoldStart}
              onTouchEnd={onHoldEnd}
              style={{
                width: 40,
                height: 40,
                flexShrink: 0,
                background: holding ? "var(--accent)" : "rgba(232,225,211,0.05)",
                border: `1px solid ${holding ? "var(--accent)" : "rgba(232,225,211,0.18)"}`,
                color: holding ? "#fff" : "rgba(232,225,211,0.85)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MicGlyph />
            </button>
            <button
              aria-label="Send"
              disabled={pending}
              onClick={() => send(input)}
              style={{
                width: 40,
                height: 40,
                flexShrink: 0,
                padding: 0,
                background: "var(--fg)",
                color: "var(--bg)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M2 7h10M8 3l4 4-4 4"
                  stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            </button>
          </>
        ) : (
          <>
            <button
              onMouseDown={onHoldStart}
              onMouseUp={onHoldEnd}
              onTouchStart={onHoldStart}
              onTouchEnd={onHoldEnd}
              disabled={pending}
              className="font-elite uppercase"
              style={{
                flex: 1,
                height: 40,
                position: "relative",
                overflow: "hidden",
                background: holding ? "var(--accent)" : "transparent",
                border: `1px solid ${holding ? "var(--accent)" : "rgba(232,225,211,0.35)"}`,
                color: holding ? "#fff" : "var(--fg)",
                fontSize: 11,
                letterSpacing: "0.32em",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
              }}
            >
              <MicGlyph />
              <span>{holding ? "Listening…" : "Hold to speak"}</span>
              {holding && <Waveform />}
            </button>
            <button
              aria-label="Type instead"
              onClick={() => setTranscriptOpen(true)}
              style={{
                width: 44,
                height: 44,
                background: "rgba(232,225,211,0.05)",
                border: "1px solid rgba(232,225,211,0.12)",
                color: "rgba(232,225,211,0.7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
                <rect x="1" y="2" width="18" height="10" stroke="currentColor" strokeWidth="1.2" fill="none" />
                {[4, 8, 12, 16].map(x => (
                  <line key={x} x1={x} y1="6" x2={x + 1} y2="6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                ))}
                <line x1="6" y1="9" x2="14" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Evidence picker (popover) */}
      {showEvidencePicker && (
        <div
          className="absolute inset-x-0 z-30"
          style={{
            bottom: 78,
            background: "rgba(8,6,4,0.96)",
            borderTop: "1px solid rgba(232,225,211,0.18)",
            padding: "12px 18px",
            maxHeight: "40vh",
            overflowY: "auto",
          }}
        >
          <p
            className="font-elite uppercase"
            style={{
              fontSize: 9,
              letterSpacing: "0.32em",
              color: "rgba(232,225,211,0.55)",
              marginBottom: 8,
            }}
          >
            Present evidence
          </p>
          <div className="grid grid-cols-1 gap-1">
            {evidenceList.map(ev => (
              <button
                key={ev.id}
                disabled={pending || evidencePresented.includes(ev.id)}
                onClick={() => send(input, ev.id)}
                className="text-left"
                style={{
                  fontSize: 12,
                  padding: "8px 10px",
                  background: "rgba(232,225,211,0.04)",
                  border: "1px solid rgba(232,225,211,0.1)",
                  color: "var(--fg)",
                  opacity: evidencePresented.includes(ev.id) ? 0.4 : 1,
                }}
              >
                {ev.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Unlock toast */}
      {unlockToast && (
        <div
          className="absolute z-40 font-elite uppercase"
          style={{
            top: 80,
            right: 18,
            padding: "8px 12px",
            border: "1px solid rgba(168,57,46,0.6)",
            background: "rgba(8,6,4,0.85)",
            color: "var(--accent)",
            fontSize: 10,
            letterSpacing: "0.28em",
          }}
        >
          🗺 Location unlocked: {unlockToast}
        </div>
      )}

      <audio ref={audioRef} hidden />

      <style jsx global>{`
        @keyframes recpulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        @keyframes wave {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
        @keyframes subcursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function MicGlyph() {
  return (
    <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
      <rect x="4.5" y="1" width="5" height="9" rx="2.5" fill="currentColor" />
      <path
        d="M2 8a5 5 0 0010 0M7 13v2"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none"
      />
    </svg>
  );
}

function Waveform() {
  return (
    <div className="flex items-center gap-[3px] ml-1">
      {[0, 1, 2, 3, 4, 5, 6].map(i => (
        <div
          key={i}
          style={{
            width: 2,
            height: 14,
            background: "currentColor",
            animation: "wave 0.7s ease-in-out infinite",
            animationDelay: `${i * 0.08}s`,
            transformOrigin: "center",
          }}
        />
      ))}
    </div>
  );
}
