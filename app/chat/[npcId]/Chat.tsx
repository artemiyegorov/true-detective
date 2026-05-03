"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { portraitVariantFor, portraitPath } from "@/lib/portrait";
import type { NpcId } from "@/lib/npc";
import {
  discoverEvidence,
  getChatHistory,
  getState,
  meetNpc,
  recordNpcReveal,
  saveChatHistory,
  unlockLocation,
} from "@/lib/player-state";

// Evidence the detective can physically present in an interview. Things
// that read as "facts the detective should ask about" (phone calls,
// witness statements, divorce filings, affair rumours) are excluded —
// those should come up in dialogue, not as a paperclip. Lab/police-
// procedure unlocks like ev_dna_match_tom are presentable because the
// detective hands the report to the suspect.
const PRESENTABLE_EVIDENCE: ReadonlySet<string> = new Set([
  "ev_footprint_44",
  "ev_partial_footprint_size_11",
  "ev_margaret_note",
  "ev_bar_receipt",
  "ev_bank_statements",
  "ev_tom_old_key",
  "ev_security_camera_glimpse",
  "ev_dna_match_tom",
  "ev_dna_match_daniel",
  "ev_paperweight_recovered",
]);

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
  relevantEvidenceIds,
}: {
  npcId: NpcId;
  npcName: string;
  evidenceList: Array<{ id: string; name: string }>;
  /** evidence IDs that narratively apply to THIS NPC — picker is scoped
      to this set so other suspects' clues don't leak in. */
  relevantEvidenceIds: string[];
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [mood, setMood] = useState<string>(INITIAL_MOODS[npcId] ?? "calm");
  const [evidencePresented, setEvidencePresented] = useState<string[]>([]);
  const [showEvidencePicker, setShowEvidencePicker] = useState(false);
  const [unlockToast, setUnlockToast] = useState<string | null>(null);
  // Per design, the default view is chat-mode: transcript visible and the
  // portrait sits in a compact band on top. The player can collapse the
  // transcript to swap into voice-first / full-bleed-portrait mode.
  const [transcriptOpen, setTranscriptOpen] = useState(true);
  // Mute is a UI preference (not a case-state thing), so it lives in
  // localStorage and persists across NPCs / navigations / Reset.
  const [muted, setMuted] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    setMuted(window.localStorage.getItem("td.chat.muted") === "1");
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("td.chat.muted", muted ? "1" : "0");
  }, [muted]);
  const [npcSpeaking, setNpcSpeaking] = useState(false);
  const [typed, setTyped] = useState("");
  const [holding, setHolding] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [discoveredIds, setDiscoveredIds] = useState<string[]>([]);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  // We track transcribing state via setTranscribing (no read needed yet —
  // the spinner UX is gated elsewhere via liveTranscript text).
  const [, setTranscribing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const liveCaptionRef = useRef<HTMLParagraphElement | null>(null);
  const recognitionRef = useRef<unknown>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  // Detected once on mount: does this browser ship Web Speech API?
  // Falls back to MediaRecorder + /api/stt (ElevenLabs Scribe) if not.
  const useWebSpeechRef = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    useWebSpeechRef.current = !!SR;
  }, []);

  // Watch player-state for discovered evidence — re-renders when the
  // player picks up new evidence elsewhere.
  useEffect(() => {
    const sync = () => setDiscoveredIds(getState().discoveredEvidence);
    sync();
    window.addEventListener("td-state-change", sync);
    return () => window.removeEventListener("td-state-change", sync);
  }, []);

  // Filtered evidence list for the paperclip picker:
  //   1) the player has actually discovered it
  //   2) it's something the detective can *physically* present
  //   3) it's narratively relevant to THIS NPC (no Tom-only clues offered
  //      while interrogating Daniel, etc.)
  // Already-presented items stay in the list but get dimmed/disabled.
  const relevantSet = new Set(relevantEvidenceIds);
  const presentableEvidence = evidenceList.filter(
    e =>
      discoveredIds.includes(e.id) &&
      PRESENTABLE_EVIDENCE.has(e.id) &&
      relevantSet.has(e.id),
  );

  // Note: we DO NOT call meetNpc here on mount. Just opening the chat
  // page should not unlock anything tied to this NPC — locks fire when
  // the NPC actually says something in dialogue (state.revealed_info
  // markers handled below). meetNpc fires on the first reply instead.

  // Lock the body while the chat is mounted so iOS Safari doesn't
  // rubber-band the page underneath the fixed chat container.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Hydrate the transcript from persisted state on mount. We track
  // hydration with a ref so the autosave effect below doesn't immediately
  // clobber prior history with the empty initial messages array.
  const hydratedRef = useRef(false);
  useEffect(() => {
    const prior = getChatHistory(npcId) as Msg[];
    if (prior.length) {
      setMessages(prior);
      // Restore mood from the most recent assistant turn so the portrait
      // variant matches where we left off.
      const lastAssistant = [...prior].reverse().find(m => m.role === "assistant");
      if (lastAssistant?.mood) setMood(lastAssistant.mood);
    }
    hydratedRef.current = true;
  }, [npcId]);

  // Autosave the transcript whenever it changes — survives navigation,
  // cleared by resetPlayerState (Reset button on /board).
  useEffect(() => {
    if (!hydratedRef.current) return;
    saveChatHistory(npcId, messages);
  }, [npcId, messages]);

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

  // Live caption auto-scroll: as the typewriter advances, keep the
  // right-most characters in view so long replies marquee horizontally
  // (a news-ticker effect) instead of wrapping into multiple lines.
  // Only matters in collapsed mode where the band is single-line.
  useEffect(() => {
    const el = liveCaptionRef.current;
    if (!el) return;
    el.scrollLeft = el.scrollWidth;
  }, [typed]);

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

      // Evidence the NPC produced in dialogue (e.g. Kevin pulling Sarah's
      // bar receipt). Added to discoveredEvidence so it shows up in the
      // casebook + fires a notification toast.
      const evUnlocks = (dialogue.unlocked_evidence as string[] | undefined) ?? [];
      for (const id of evUnlocks) discoverEvidence(id);

      const revealed = (dialogue.state?.revealed_info as string[] | undefined) ?? [];
      if (revealed.length) recordNpcReveal(npcId, revealed);

      // Mark "met" only after a real exchange — not on chat-page mount.
      // This way, opening Sarah's chat without saying anything doesn't
      // count as meeting her. The first NPC reply is the threshold.
      meetNpc(npcId);

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

  // === Hold-to-speak ===
  // Two backends:
  //   • Web Speech API (Chrome/Safari) — instant, free, on-device.
  //   • MediaRecorder → /api/stt (ElevenLabs Scribe) for Firefox / others.
  //
  // The picker is a feature-detect on mount (`useWebSpeechRef`).
  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;
    setVoiceError(null);
    setLiveTranscript("");
    setNpcSpeaking(false);
    if (audioRef.current) audioRef.current.pause();

    if (useWebSpeechRef.current) {
      const SR = (window as unknown as {
        SpeechRecognition?: new () => unknown;
        webkitSpeechRecognition?: new () => unknown;
      }).SpeechRecognition || (window as unknown as {
        webkitSpeechRecognition?: new () => unknown;
      }).webkitSpeechRecognition;
      if (!SR) return;
      const recognition = new (SR as new () => {
        lang: string; continuous: boolean; interimResults: boolean;
        onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
        onerror: (e: { error?: string; message?: string }) => void;
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
      recognition.onerror = e => {
        const code = e?.error ?? "unknown";
        // Codes that fire during the normal lifecycle (tapped without
        // holding long enough, recognition cancelled by a second start,
        // brief network blip) — don't surface as errors. They aren't
        // actionable for the player and create noise.
        if (code === "no-speech" || code === "aborted" || code === "network") {
          // eslint-disable-next-line no-console
          console.debug("[chat/voice] silent", code);
          return;
        }
        const msg =
          code === "not-allowed" || code === "service-not-allowed"
            ? "Mic permission denied. Allow microphone access for voice input."
            : code === "audio-capture"
            ? "No microphone detected."
            : `Voice error: ${code}`;
        setVoiceError(msg);
        // eslint-disable-next-line no-console
        console.warn("[chat/voice]", code, e?.message);
      };
      recognition.onend = () => { /* handled in stopListening */ };
      try {
        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("[chat/voice] start failed", err);
      }
      return;
    }

    // MediaRecorder fallback path (Firefox & friends).
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Pick a mime that the browser will actually produce. Firefox emits
        // audio/ogg; Chrome emits audio/webm. We let MediaRecorder choose.
        const mr = new MediaRecorder(stream);
        audioChunksRef.current = [];
        mr.ondataavailable = e => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        mr.start();
        mediaRecorderRef.current = mr;
      } catch (err) {
        const e = err as Error;
        const msg = /denied|not allowed/i.test(e?.message ?? "")
          ? "Mic permission denied. Allow microphone access for voice input."
          : /not found|no devices/i.test(e?.message ?? "")
          ? "No microphone detected."
          : `Voice error: ${e?.message ?? "unknown"}`;
        setVoiceError(msg);
        // eslint-disable-next-line no-console
        console.warn("[chat/voice] mr start failed", err);
      }
    })();
  }, []);

  const stopListening = useCallback(() => {
    if (useWebSpeechRef.current) {
      const rec = recognitionRef.current as { stop?: () => void } | null;
      if (rec?.stop) rec.stop();
      recognitionRef.current = null;
      setLiveTranscript(t => {
        const trimmed = t.trim();
        if (trimmed) send(trimmed);
        return t;
      });
      return;
    }

    // MediaRecorder fallback: stop, bundle chunks, ship to /api/stt.
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    mediaRecorderRef.current = null;
    mr.onstop = async () => {
      mr.stream.getTracks().forEach(t => t.stop());
      const chunks = audioChunksRef.current;
      audioChunksRef.current = [];
      if (!chunks.length) return;
      const blob = new Blob(chunks, { type: chunks[0].type || "audio/webm" });
      if (blob.size < 800) return;
      setTranscribing(true);
      setLiveTranscript("Transcribing…");
      try {
        const fd = new FormData();
        fd.append("audio", blob, "speech.webm");
        const res = await fetch("/api/stt", { method: "POST", body: fd });
        const data = (await res.json()) as { text?: string; error?: string };
        if (!res.ok || data.error) {
          setVoiceError(data.error ?? `STT ${res.status}`);
          setLiveTranscript("");
          return;
        }
        const text = (data.text ?? "").trim();
        setLiveTranscript(text);
        if (text) send(text);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("[chat/voice] stt failed", err);
        setVoiceError("Voice transcription failed.");
        setLiveTranscript("");
      } finally {
        setTranscribing(false);
      }
    };
    try {
      mr.stop();
    } catch {
      /* already stopped */
    }
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
      // On phones the chat owns the whole viewport. On tablet+ we wrap the
      // interrogation in a centered max-w-2xl "screen" with the surrounding
      // viewport falling back to --bg, so the page reads as a contained
      // recording on a desk rather than a full-bleed video.
      // `100dvh` is the dynamic viewport height — it shrinks when iOS
      // Safari's URL bar is visible, which `100vh` does NOT (mobile
      // Safari treats `100vh` as the larger "no-URL-bar" measurement,
      // pushing the talk pad below the fold). Fallback to `100vh` for
      // older browsers via the height shorthand.
      // The chat is pinned to the viewport — no body scrolling, no
      // pull-to-refresh, no rubber-banding. fixed inset-0 on mobile,
      // contained-scroll desktop card. h-screen / 100dvh is the
      // height fallback chain for browsers without dvh.
      className="fixed inset-0 mx-auto sm:relative sm:w-auto sm:h-screen sm:max-w-2xl sm:border sm:border-[rgba(232,225,211,0.12)] sm:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.7)] overflow-hidden"
      style={{
        background: "var(--bg)",
        color: "var(--fg)",
        height: "100dvh",
        // Stop iOS rubber-band & nested scroll containers from leaking
        // into the chat container.
        overscrollBehavior: "contain",
      }}
    >
      {/* Portrait — full-bleed when collapsed, top band when transcript
          open. Heights are in dvh so iOS Safari's collapsing URL bar
          doesn't push the bottom controls off-screen. */}
      <div
        className="absolute inset-x-0 top-0 z-[1]"
        style={{
          height: transcriptOpen ? "44dvh" : "100dvh",
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

      {/* Top gradient veil so portrait stays legible behind chrome */}
      <div
        className="absolute top-0 inset-x-0 z-[15] pointer-events-none"
        style={{
          height: 90,
          background:
            "linear-gradient(180deg, rgba(8,6,4,0.85) 0%, rgba(8,6,4,0.55) 60%, transparent 100%)",
        }}
      />

      {/* Back link — anchored to the chat sheet (absolute, not fixed) so on
          desktop it sticks to the centered card's corner rather than the
          viewport edge. */}
      <a
        href="/board"
        className="absolute z-[60] font-elite uppercase"
        style={{
          top: 14,
          left: 14,
          fontSize: 10,
          letterSpacing: "0.32em",
          color: "var(--fg)",
          padding: "8px 12px",
          background: "rgba(8,6,4,0.55)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          border: "1px solid rgba(232,225,211,0.12)",
          textDecoration: "none",
          lineHeight: 1,
        }}
      >
        ← BOARD
      </a>

      {/* Top bar: REC · mute (right-aligned). Back link is in fixed BackLink. */}
      <div
        className="absolute top-0 right-0 z-20 flex items-center"
        style={{ padding: "20px 18px 14px", gap: 14 }}
      >
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

      {/* Subtitle band (only when transcript collapsed) — sits flush above
          the grab handle so there's no empty gap. */}
      {!transcriptOpen && (
        <div
          className="absolute inset-x-0 z-[6]"
          style={{
            bottom: 96,
            padding: "60px 22px 10px",
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
                ref={liveCaptionRef}
                className="italic m-0 flex-1 min-w-0"
                style={{
                  fontSize: 15,
                  lineHeight: 1.4,
                  color: "#f0e8d8",
                  textShadow: "0 1px 8px rgba(0,0,0,0.9)",
                  // Single-line ticker. The full text scrolls left as
                  // the typewriter advances (see effect tied to `typed`).
                  // No clamp — long replies stream sideways like news
                  // captions instead of wrapping into multiple lines.
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  // Soft fade on both edges so characters don't hard-cut.
                  WebkitMaskImage:
                    "linear-gradient(90deg, transparent 0%, #000 6%, #000 94%, transparent 100%)",
                  maskImage:
                    "linear-gradient(90deg, transparent 0%, #000 6%, #000 94%, transparent 100%)",
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

      {/* Pull-up grab handle, visible when transcript is collapsed. Sits
          flush against the talk pad so there's no empty gap. Tap or drag
          opens the chat sheet. */}
      {!transcriptOpen && (
        <button
          onClick={() => setTranscriptOpen(true)}
          aria-label="Open chat"
          className="absolute inset-x-0 z-[9] cursor-pointer flex items-center justify-center border-0"
          style={{
            bottom: 78,
            height: 18,
            padding: 0,
            color: "var(--fg)",
            // Match the talk pad's near-opaque background so the handle
            // blends into it — no see-through "hole" between the LISTENING
            // band and the talk pad.
            background: "rgba(8,6,4,0.92)",
          }}
        >
          <span
            style={{
              width: 44,
              height: 3,
              background: "rgba(232,225,211,0.55)",
              borderRadius: 2,
            }}
          />
        </button>
      )}

      {/* Transcript sheet — only mounted when open. dvh keeps the top
          edge aligned with the portrait band on iOS Safari (where 44vh
          sat too high because the URL bar shrank the viewport). */}
      {transcriptOpen && (
        <div
          className="absolute inset-x-0 z-[9] flex flex-col"
          style={{
            bottom: 78,
            top: "44dvh",
            background: "rgba(8,6,4,0.96)",
            borderTop: "1px solid rgba(232,225,211,0.18)",
            borderBottom: "1px solid rgba(232,225,211,0.1)",
          }}
        >
          <button
            onClick={() => setTranscriptOpen(false)}
            aria-label="Collapse transcript"
            className="bg-transparent border-0 cursor-pointer flex items-center justify-center"
            style={{ height: 24, flexShrink: 0, padding: 0, color: "var(--fg)" }}
          >
            <span style={{ width: 36, height: 3, background: "rgba(232,225,211,0.4)" }} />
          </button>
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
        </div>
      )}

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
                // 16px is the iOS Safari threshold below which the
                // browser auto-zooms into the input on focus (and never
                // zooms back out). Keep at 16 to suppress that behavior.
                fontSize: 16,
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
              onContextMenu={e => e.preventDefault()}
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
                // iOS Safari long-press fires a context menu (Copy /
                // Look Up) and selects nearby text. Suppress all of it
                // so press = record, release = send, no UI noise.
                WebkitUserSelect: "none",
                userSelect: "none",
                WebkitTouchCallout: "none",
                WebkitTapHighlightColor: "transparent",
                touchAction: "manipulation",
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
              onContextMenu={e => e.preventDefault()}
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
                // Press = record, release = send. iOS otherwise pops a
                // context menu / selection bubble on long-press; nuke it.
                WebkitUserSelect: "none",
                userSelect: "none",
                WebkitTouchCallout: "none",
                WebkitTapHighlightColor: "transparent",
                touchAction: "manipulation",
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
          {presentableEvidence.length === 0 && (
            <p
              className="italic"
              style={{ fontSize: 12, color: "rgba(232,225,211,0.45)", padding: "6px 4px" }}
            >
              Nothing to show yet — collect physical evidence at the scene first.
            </p>
          )}
          <div className="grid grid-cols-1 gap-1">
            {presentableEvidence.map(ev => (
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

      {/* Unlock toast — kept for legacy/in-chat feedback in addition to the
          global Notifications stack. */}
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

      {/* Voice-input error banner — surfaces mic permission denied,
          unsupported browser, etc. so the player isn't left wondering why
          hold-to-speak didn't capture anything. */}
      {voiceError && (
        <div
          className="absolute z-40 font-elite uppercase"
          style={{
            top: 80,
            left: 18,
            padding: "8px 12px",
            border: "1px solid rgba(168,57,46,0.5)",
            background: "rgba(8,6,4,0.92)",
            color: "var(--accent)",
            fontSize: 10,
            letterSpacing: "0.24em",
            maxWidth: "70vw",
          }}
          onClick={() => setVoiceError(null)}
        >
          {voiceError}
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
