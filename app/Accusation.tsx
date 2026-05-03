"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  getAccusation,
  hasAccused,
  submitAccusation,
  type AccusationRecord,
  type VerdictResult,
} from "@/lib/player-state";
import type { AccusationGroundTruth } from "@/lib/case";
import { evaluateAccusation } from "@/lib/verdict";
import { buildShareImage, shareOrCopy } from "@/lib/share-image";

// Full-screen accusation flow:
//   warning → case → verdict.
// Mounted from PersonModal via the ACCUSE button. Once submitted, the
// case is closed irreversibly (only Reset clears it). On subsequent /board
// loads we render the verdict overlay directly via <VerdictOverlay /> —
// see board page wiring.

type Step = "warning" | "case" | "verdict";

type Phase = "black" | "rising" | "typing" | "done";

const COURTROOM_SRC = "/onboarding/onboarding_04_consequence.png";

const MIN_CASE_CHARS = 100;

export default function Accusation({
  accusedNpcId,
  accusedName,
  accusedRole,
  accusedPortrait,
  groundTruth,
  caseTitle,
  onClose,
}: {
  accusedNpcId: string;
  accusedName: string;
  accusedRole: string;
  accusedPortrait: string | null;
  groundTruth: AccusationGroundTruth;
  caseTitle: string;
  onClose: () => void;
}) {
  // Capture once at mount: if the player already filed in this session,
  // jump straight to the finished verdict. We pin it to a useState
  // initializer so that submitting in this same mount doesn't flip the
  // value (which would cause the cinematic-timeline effect below to bail).
  const [priorOnMount] = useState(() => getAccusation());
  const initialStep: Step = priorOnMount ? "verdict" : "warning";
  const [step, setStep] = useState<Step>(initialStep);
  const [caseText, setCaseText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<VerdictResult | null>(priorOnMount?.result ?? null);
  const [phase, setPhase] = useState<Phase>(priorOnMount ? "done" : "black");
  const [typed, setTyped] = useState(priorOnMount ? priorOnMount.result.narration : "");

  // === Verdict cinematic timeline ===
  // black 1s → rising (fade-in) 700ms → typing → done
  useEffect(() => {
    if (step !== "verdict" || !result || priorOnMount) return;
    setPhase("black");
    const t1 = setTimeout(() => setPhase("rising"), 1000);
    const t2 = setTimeout(() => setPhase("typing"), 1700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [step, result, priorOnMount]);

  // Typewriter, advances ~28ms/char, slower around line breaks.
  useEffect(() => {
    if (phase !== "typing" || !result) return;
    const full = result.narration;
    setTyped("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setTyped(full.slice(0, i));
      if (i >= full.length) {
        clearInterval(id);
        setTimeout(() => setPhase("done"), 800);
      }
    }, 30);
    return () => clearInterval(id);
  }, [phase, result]);

  function onSubmit() {
    if (caseText.trim().length < MIN_CASE_CHARS || submitting || hasAccused()) return;
    setSubmitting(true);
    const verdict = evaluateAccusation({
      accusedNpcId,
      accusedName,
      caseText,
      truth: groundTruth,
    });
    const record: AccusationRecord = {
      accusedNpcId,
      accusedName,
      caseText,
      submittedAt: Date.now(),
      result: verdict,
    };
    submitAccusation(record);
    setResult(verdict);
    setStep("verdict");
    setSubmitting(false);
  }

  return (
    <div
      className="fixed inset-0 z-[120] overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.94)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
    >
      <AnimatePresence mode="wait">
        {step === "warning" && (
          <motion.div
            key="warning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-full flex items-center justify-center"
            style={{ padding: "60px 22px" }}
          >
            <WarningPanel
              accusedName={accusedName}
              onCancel={onClose}
              onProceed={() => setStep("case")}
            />
          </motion.div>
        )}
        {step === "case" && (
          <motion.div
            key="case"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-full flex items-start justify-center"
            style={{ padding: "40px 22px 80px" }}
          >
            <CasePanel
              accusedName={accusedName}
              accusedRole={accusedRole}
              accusedPortrait={accusedPortrait}
              caseText={caseText}
              setCaseText={setCaseText}
              submitting={submitting}
              onBack={() => setStep("warning")}
              onSubmit={onSubmit}
            />
          </motion.div>
        )}
        {step === "verdict" && result && (
          <motion.div
            key="verdict"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-full"
          >
            <VerdictPanel
              result={result}
              phase={phase}
              typedNarration={typed}
              caseTitle={caseTitle}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// === Warning ===

function WarningPanel({
  accusedName,
  onCancel,
  onProceed,
}: {
  accusedName: string;
  onCancel: () => void;
  onProceed: () => void;
}) {
  return (
    <div
      className="relative w-full sm:max-w-xl"
      style={{
        background: "var(--bg)",
        border: "1px solid rgba(168,57,46,0.45)",
        padding: "32px 28px 28px",
      }}
    >
      <div
        className="font-elite uppercase"
        style={{
          fontSize: 9,
          letterSpacing: "0.32em",
          color: "var(--accent)",
          marginBottom: 14,
        }}
      >
        Formal accusation
      </div>
      <h1
        className="font-fell"
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: "var(--fg)",
          letterSpacing: "0.005em",
          lineHeight: 1.15,
          margin: 0,
        }}
      >
        You are about to accuse {accusedName}.
      </h1>
      <div style={{ width: 32, height: 1, background: "var(--accent)", margin: "16px 0 18px" }} />
      <p
        style={{ fontSize: 14.5, lineHeight: 1.55, color: "rgba(232,225,211,0.8)", margin: 0 }}
      >
        This action is irreversible. You will not be able to investigate further or change your mind.
      </p>
      <ul style={{ marginTop: 18, paddingLeft: 0, listStyle: "none" }}>
        {[
          "You have only ONE accusation. Use it wisely.",
          "A wrong accusation sends an innocent person to prison.",
          "A weak case will be dismissed and the real killer walks free.",
        ].map(line => (
          <li
            key={line}
            style={{
              fontSize: 13.5,
              lineHeight: 1.5,
              color: "rgba(232,225,211,0.75)",
              marginTop: 10,
              paddingLeft: 16,
              borderLeft: "1px solid rgba(168,57,46,0.45)",
            }}
          >
            {line}
          </li>
        ))}
      </ul>
      <p
        className="font-fell"
        style={{
          fontSize: 18,
          color: "var(--fg)",
          margin: "26px 0 18px",
          letterSpacing: "0.005em",
        }}
      >
        Are you sure?
      </p>
      <div className="flex flex-wrap" style={{ gap: 10 }}>
        <button
          type="button"
          onClick={onCancel}
          className="font-elite uppercase"
          style={{
            flex: "1 1 160px",
            padding: "14px 20px",
            background: "transparent",
            border: "1px solid rgba(232,225,211,0.35)",
            color: "var(--fg)",
            fontSize: 11,
            letterSpacing: "0.32em",
          }}
        >
          Not yet
        </button>
        <button
          type="button"
          onClick={onProceed}
          className="font-elite uppercase"
          style={{
            flex: "1 1 160px",
            padding: "14px 20px",
            background: "var(--accent)",
            border: "1px solid var(--accent)",
            color: "#fff",
            fontSize: 11,
            letterSpacing: "0.32em",
            fontWeight: 600,
          }}
        >
          Proceed
        </button>
      </div>
    </div>
  );
}

// === Case (state your case) ===

function CasePanel({
  accusedName,
  accusedRole,
  accusedPortrait,
  caseText,
  setCaseText,
  submitting,
  onBack,
  onSubmit,
}: {
  accusedName: string;
  accusedRole: string;
  accusedPortrait: string | null;
  caseText: string;
  setCaseText: (v: string) => void;
  submitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const recognitionRef = useRef<unknown>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const useWebSpeechRef = useRef(false);
  const [holding, setHolding] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    useWebSpeechRef.current = !!SR;
  }, []);

  const startVoice = useCallback(() => {
    setVoiceError(null);
    setHolding(true);
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
        onerror: (e: { error?: string }) => void;
        onend: () => void;
        start: () => void; stop: () => void;
      })();
      recognition.lang = "en-US";
      recognition.continuous = true;
      recognition.interimResults = true;
      const baseline = caseText;
      recognition.onresult = e => {
        let combined = "";
        for (let i = 0; i < e.results.length; i++) {
          combined += e.results[i][0].transcript;
        }
        setCaseText(baseline ? `${baseline} ${combined}`.trim() : combined);
      };
      recognition.onerror = e => {
        if (e.error === "no-speech") return;
        setVoiceError(`Voice error: ${e.error ?? "unknown"}`);
      };
      recognition.onend = () => undefined;
      try {
        recognition.start();
        recognitionRef.current = recognition;
      } catch {
        /* already running */
      }
      return;
    }
    // MediaRecorder fallback (Firefox).
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mr = new MediaRecorder(stream);
        audioChunksRef.current = [];
        mr.ondataavailable = e => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        mr.start();
        mediaRecorderRef.current = mr;
      } catch (err) {
        setVoiceError(`Mic unavailable: ${(err as Error).message}`);
        setHolding(false);
      }
    })();
  }, [caseText, setCaseText]);

  const stopVoice = useCallback(() => {
    setHolding(false);
    if (useWebSpeechRef.current) {
      const rec = recognitionRef.current as { stop?: () => void } | null;
      if (rec?.stop) rec.stop();
      recognitionRef.current = null;
      return;
    }
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
      try {
        const fd = new FormData();
        fd.append("audio", blob, "speech.webm");
        const res = await fetch("/api/stt", { method: "POST", body: fd });
        const data = (await res.json()) as { text?: string; error?: string };
        if (res.ok && data.text) {
          setCaseText(caseText ? `${caseText} ${data.text}`.trim() : data.text);
        } else if (data.error) {
          setVoiceError(data.error);
        }
      } finally {
        setTranscribing(false);
      }
    };
    try { mr.stop(); } catch { /* already stopped */ }
  }, [caseText, setCaseText]);

  const charCount = caseText.trim().length;
  const canSubmit = charCount >= MIN_CASE_CHARS && !submitting;

  return (
    <div className="relative w-full sm:max-w-2xl">
      <div
        className="font-elite uppercase"
        style={{ fontSize: 10, letterSpacing: "0.32em", color: "rgba(232,225,211,0.55)" }}
      >
        Step 2 / 2 · Formal accusation
      </div>
      <h1
        className="font-fell"
        style={{
          fontSize: 30,
          fontWeight: 700,
          color: "var(--fg)",
          letterSpacing: "0.005em",
          lineHeight: 1.1,
          margin: "8px 0 0",
        }}
      >
        State your case
      </h1>
      <p
        style={{
          fontSize: 14,
          color: "rgba(232,225,211,0.65)",
          margin: "10px 0 0",
          fontStyle: "italic",
        }}
      >
        Who, when, where, why. Name the evidence and the motive.
      </p>

      {/* Accused card */}
      <div
        className="flex items-center"
        style={{
          marginTop: 22,
          gap: 14,
          padding: "12px 14px",
          background: "rgba(168,57,46,0.08)",
          border: "1px solid rgba(168,57,46,0.4)",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            background: "rgba(232,225,211,0.05)",
            border: "1px solid rgba(232,225,211,0.18)",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {accusedPortrait && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={accusedPortrait}
              alt={accusedName}
              className="w-full h-full object-cover object-top"
            />
          )}
        </div>
        <div className="flex flex-col" style={{ minWidth: 0 }}>
          <div
            className="font-elite uppercase"
            style={{ fontSize: 9, letterSpacing: "0.32em", color: "var(--accent)" }}
          >
            Accused
          </div>
          <div
            className="font-fell"
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "var(--fg)",
              marginTop: 2,
              letterSpacing: "0.005em",
            }}
          >
            {accusedName}
          </div>
          {accusedRole && (
            <div
              className="italic"
              style={{ fontSize: 12.5, color: "rgba(232,225,211,0.65)", marginTop: 2 }}
            >
              {accusedRole}
            </div>
          )}
        </div>
      </div>

      {/* Textarea + voice */}
      <div
        className="relative"
        style={{
          marginTop: 18,
          background: "rgba(232,225,211,0.04)",
          border: "1px solid rgba(232,225,211,0.18)",
        }}
      >
        <textarea
          value={caseText}
          onChange={e => setCaseText(e.target.value)}
          rows={9}
          placeholder={`On the night of [date], ${accusedName} entered [location] through [how]. They did it because... The evidence shows...`}
          className="font-ui"
          style={{
            width: "100%",
            background: "transparent",
            color: "var(--fg)",
            border: "none",
            outline: "none",
            resize: "vertical",
            padding: "16px 56px 16px 16px",
            // 16px stops iOS Safari from zooming into the textarea on
            // focus (anything below 16 triggers auto-zoom).
            fontSize: 16,
            lineHeight: 1.55,
            minHeight: 220,
          }}
        />
        <button
          type="button"
          aria-label={holding ? "Stop voice" : "Hold to speak"}
          onMouseDown={startVoice}
          onMouseUp={stopVoice}
          onTouchStart={startVoice}
          onTouchEnd={stopVoice}
          onContextMenu={e => e.preventDefault()}
          disabled={transcribing}
          className="absolute flex items-center justify-center"
          style={{
            top: 12,
            right: 12,
            width: 38,
            height: 38,
            background: holding ? "var(--accent)" : "rgba(8,6,4,0.55)",
            border: `1px solid ${holding ? "var(--accent)" : "rgba(232,225,211,0.18)"}`,
            color: holding ? "#fff" : "rgba(232,225,211,0.85)",
            WebkitUserSelect: "none",
            userSelect: "none",
            WebkitTouchCallout: "none",
            WebkitTapHighlightColor: "transparent",
            touchAction: "manipulation",
          }}
        >
          <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
            <rect x="4.5" y="1" width="5" height="9" rx="2.5" fill="currentColor" />
            <path
              d="M2 8a5 5 0 0010 0M7 13v2"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </button>
      </div>

      <div
        className="flex items-center justify-between"
        style={{ marginTop: 8, fontSize: 11 }}
      >
        <span
          className="font-elite uppercase"
          style={{
            letterSpacing: "0.24em",
            color: charCount >= MIN_CASE_CHARS ? "var(--accent)" : "rgba(232,225,211,0.45)",
          }}
        >
          {charCount} / {MIN_CASE_CHARS} chars
        </span>
        {transcribing && (
          <span
            className="italic"
            style={{ color: "rgba(232,225,211,0.55)", fontSize: 12 }}
          >
            Transcribing…
          </span>
        )}
      </div>

      {voiceError && (
        <p
          className="font-elite uppercase"
          style={{
            marginTop: 8,
            fontSize: 10,
            letterSpacing: "0.24em",
            color: "var(--accent)",
          }}
        >
          {voiceError}
        </p>
      )}

      {/* Buttons row */}
      <div className="flex items-stretch flex-wrap" style={{ marginTop: 22, gap: 10 }}>
        <button
          type="button"
          onClick={onBack}
          className="font-elite uppercase"
          style={{
            padding: "14px 20px",
            background: "transparent",
            border: "1px solid rgba(232,225,211,0.35)",
            color: "var(--fg)",
            fontSize: 11,
            letterSpacing: "0.32em",
            flex: "0 0 auto",
          }}
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="font-elite uppercase"
          style={{
            flex: 1,
            minWidth: 200,
            padding: "16px 22px",
            background: canSubmit ? "var(--accent)" : "rgba(168,57,46,0.25)",
            border: `1px solid ${canSubmit ? "var(--accent)" : "rgba(168,57,46,0.4)"}`,
            color: canSubmit ? "#fff" : "rgba(232,225,211,0.5)",
            fontSize: 12,
            letterSpacing: "0.32em",
            fontWeight: 700,
            cursor: canSubmit ? "pointer" : "not-allowed",
          }}
        >
          Submit Formal Accusation
        </button>
      </div>
    </div>
  );
}

// === Verdict ===

function VerdictPanel({
  result,
  phase,
  typedNarration,
  caseTitle,
}: {
  result: VerdictResult;
  phase: Phase;
  typedNarration: string;
  caseTitle: string;
}) {
  const tierColor =
    result.tier === "truth" ? "#7fb27c"
    : result.tier === "thin_truth" ? "#9bb78c"
    : result.tier === "defensible_wrong" ? "#c9a548"
    : "var(--accent)";

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Black slate is always present; image fades in over it */}
      <div className="absolute inset-0" style={{ background: "#000" }} />

      <AnimatePresence>
        {(phase === "rising" || phase === "typing" || phase === "done") && (
          <motion.img
            key="courtroom"
            src={COURTROOM_SRC}
            alt=""
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === "done" ? 0.45 : 0.7 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
        )}
      </AnimatePresence>

      {/* Vignette + bottom gradient for legibility */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.85) 100%), linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.85) 100%)",
        }}
      />

      <div
        className="relative z-[1] min-h-screen flex flex-col items-center"
        style={{ padding: "min(8vh, 80px) 22px 60px" }}
      >
        {(phase === "typing" || phase === "done") && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full sm:max-w-2xl"
          >
            <div
              className="font-elite uppercase"
              style={{
                fontSize: 10,
                letterSpacing: "0.4em",
                color: "rgba(232,225,211,0.55)",
                marginBottom: 12,
              }}
            >
              Verdict · {caseTitle}
            </div>
            <p
              className="font-fell"
              style={{
                fontSize: 22,
                lineHeight: 1.45,
                color: "var(--fg)",
                whiteSpace: "pre-wrap",
                letterSpacing: "0.005em",
                margin: 0,
              }}
            >
              {typedNarration}
              {phase === "typing" && (
                <span
                  className="inline-block align-middle"
                  style={{
                    width: 2,
                    height: "0.95em",
                    marginLeft: 2,
                    background: "var(--accent)",
                    animation: "td-cursor 0.75s steps(2) infinite",
                  }}
                />
              )}
            </p>
          </motion.div>
        )}

        {phase === "done" && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full sm:max-w-xl"
            style={{ marginTop: 36 }}
          >
            <OutcomeCard
              result={result}
              tierColor={tierColor}
              caseTitle={caseTitle}
            />
          </motion.div>
        )}
      </div>

      <style jsx global>{`
        @keyframes td-cursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function OutcomeCard({
  result,
  tierColor,
  caseTitle,
}: {
  result: VerdictResult;
  tierColor: string;
  caseTitle: string;
}) {
  const [shareState, setShareState] = useState<"idle" | "preparing" | "shared" | "copied" | "downloaded" | "error">("idle");

  async function handleShare() {
    setShareState("preparing");
    try {
      const blob = await buildShareImage({
        outcomeHeadline: result.outcomeHeadline,
        outcomeRating: result.outcomeRating,
        stars: result.stars,
        caseTitle,
        gameUrl: typeof window !== "undefined" ? window.location.host : "blackfile.app",
      });
      const out = await shareOrCopy(blob, {
        title: "Blackfile — Case File 247",
        text: `My verdict on the Margaret Cole case: ${result.outcomeHeadline}.`,
        url: typeof window !== "undefined" ? window.location.origin : "",
      });
      setShareState(out);
    } catch {
      setShareState("error");
    }
  }

  return (
    <div
      className="relative"
      style={{
        background: "rgba(8,6,4,0.92)",
        border: `1px solid ${tierColor}`,
        padding: "28px 26px 24px",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <div
        className="font-elite uppercase"
        style={{ fontSize: 9, letterSpacing: "0.4em", color: tierColor, marginBottom: 6 }}
      >
        Final ruling
      </div>
      <h2
        className="font-fell"
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: "var(--fg)",
          letterSpacing: "0.005em",
          lineHeight: 1.15,
          margin: 0,
        }}
      >
        {result.outcomeHeadline}
      </h2>
      <div
        style={{
          marginTop: 10,
          fontSize: 24,
          color: tierColor,
          letterSpacing: "0.1em",
        }}
      >
        {"★".repeat(result.stars)}
        <span style={{ color: "rgba(232,225,211,0.25)" }}>{"★".repeat(5 - result.stars)}</span>
      </div>
      <p
        style={{
          fontSize: 14,
          lineHeight: 1.5,
          color: "rgba(232,225,211,0.7)",
          margin: "12px 0 0",
          fontStyle: "italic",
        }}
      >
        {result.outcomeRating}
      </p>

      <div className="flex flex-wrap" style={{ marginTop: 22, gap: 10 }}>
        <button
          type="button"
          onClick={handleShare}
          disabled={shareState === "preparing"}
          className="font-elite uppercase"
          style={{
            flex: "1 1 200px",
            padding: "14px 20px",
            background: "transparent",
            border: `1px solid ${tierColor}`,
            color: tierColor,
            fontSize: 11,
            letterSpacing: "0.32em",
          }}
        >
          {shareState === "preparing"
            ? "Preparing image…"
            : shareState === "shared"
            ? "✓ Shared"
            : shareState === "copied"
            ? "✓ Copied + saved"
            : shareState === "downloaded"
            ? "✓ Saved + copied"
            : shareState === "error"
            ? "Share failed — try again"
            : "Share Result"}
        </button>
        <button
          type="button"
          disabled
          className="font-elite uppercase"
          style={{
            flex: "1 1 200px",
            padding: "14px 20px",
            background: "transparent",
            border: "1px solid rgba(232,225,211,0.2)",
            color: "rgba(232,225,211,0.35)",
            fontSize: 11,
            letterSpacing: "0.32em",
            cursor: "not-allowed",
          }}
        >
          New Case · soon
        </button>
      </div>

      <Link
        href="/"
        className="font-elite uppercase block text-center"
        style={{
          marginTop: 14,
          fontSize: 10,
          letterSpacing: "0.32em",
          color: "rgba(232,225,211,0.45)",
          textDecoration: "none",
        }}
      >
        ← back to cases
      </Link>
    </div>
  );
}
