"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { portraitVariantFor, portraitPath } from "@/lib/portrait";
import type { NpcId } from "@/lib/npc";
import { meetNpc, unlockLocation } from "@/lib/player-state";

type Msg = {
  role: "user" | "assistant";
  content: string;
  voiceText?: string;
  mood?: string;
  evidenceId?: string;
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    meetNpc(npcId);
  }, [npcId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  async function send(playerText: string, newEvidenceId?: string) {
    if (!playerText.trim() && !newEvidenceId) return;
    setPending(true);
    setShowEvidencePicker(false);

    const userMsg: Msg = {
      role: "user",
      content: playerText.trim() || "(presents evidence in silence)",
      evidenceId: newEvidenceId,
    };
    const newHistory: Msg[] = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");

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
        setMessages([
          ...newHistory,
          { role: "assistant", content: `[error: ${dialogue.error || "unknown"}]` },
        ]);
        setPending(false);
        return;
      }

      const newMood = dialogue.state?.mood ?? mood;
      setMood(newMood);
      const updatedEvidence = newEvidenceId
        ? [...evidencePresented, newEvidenceId]
        : evidencePresented;
      setEvidencePresented(updatedEvidence);

      // Apply server-detected location unlocks to player state.
      const unlocks = (dialogue.unlocked_locations as string[] | undefined) ?? [];
      if (unlocks.length) {
        unlocks.forEach(unlockLocation);
        setUnlockToast(unlocks.join(", "));
        setTimeout(() => setUnlockToast(null), 4000);
      }

      setMessages([
        ...newHistory,
        {
          role: "assistant",
          content: dialogue.voice_text_clean,
          voiceText: dialogue.voice_text,
          mood: newMood,
        },
      ]);

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
        if (ttsRes.ok) {
          const blob = await ttsRes.blob();
          const url = URL.createObjectURL(blob);
          if (audioRef.current) {
            audioRef.current.src = url;
            audioRef.current.play().catch(() => undefined);
          }
        }
      } catch {
        // voice failure is non-fatal
      }
    } finally {
      setPending(false);
    }
  }

  const variant = portraitVariantFor(npcId, mood);
  const portraitSrc = portraitPath(npcId, variant);

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto">
      {/* header */}
      <header className="flex items-center gap-3 p-4 border-b border-neutral-800">
        <Link href="/" className="text-neutral-500 text-sm hover:text-neutral-300">
          ← back
        </Link>
        <div className="flex-1 text-center">
          <h1 className="text-base font-medium">{npcName}</h1>
          <p className="text-xs text-neutral-500">{mood} · {evidencePresented.length} evidence presented</p>
        </div>
        <div className="w-12" />
      </header>

      {/* portrait */}
      <div className="relative bg-neutral-900 flex justify-center py-4">
        <div className="relative w-44 h-64 overflow-hidden rounded-lg ring-1 ring-neutral-800 transition-all">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={variant}
            src={portraitSrc}
            alt={`${npcName} — ${variant}`}
            className="w-full h-full object-cover transition-opacity duration-500"
          />
        </div>
        {unlockToast && (
          <div className="absolute bottom-2 right-3 max-w-[60%] rounded-md bg-emerald-900/80 ring-1 ring-emerald-700 text-emerald-100 text-xs px-3 py-2 shadow-lg">
            🗺 New location unlocked: <span className="font-medium">{unlockToast}</span>
          </div>
        )}
      </div>

      {/* messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-neutral-600 text-sm">
            Start the interview. Press <span className="text-neutral-400">Send</span> with empty
            text to let {npcName} speak first.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-neutral-800 text-neutral-100"
              }`}
            >
              {m.evidenceId && (
                <div className="text-xs opacity-80 italic mb-1">
                  📎 presented: {m.evidenceId}
                </div>
              )}
              <div className="whitespace-pre-wrap">{m.content}</div>
            </div>
          </div>
        ))}
        {pending && (
          <div className="flex justify-start">
            <div className="bg-neutral-800 text-neutral-400 px-3.5 py-2 rounded-2xl text-sm italic">
              {npcName.split(" ")[0]} is thinking…
            </div>
          </div>
        )}
      </div>

      {/* input */}
      <div className="border-t border-neutral-800 p-3 space-y-2">
        {showEvidencePicker && (
          <div className="bg-neutral-900 rounded-lg p-3 max-h-48 overflow-y-auto">
            <p className="text-xs text-neutral-500 mb-2">Present evidence (debug):</p>
            <div className="grid grid-cols-1 gap-1">
              {evidenceList.map(ev => (
                <button
                  key={ev.id}
                  disabled={pending || evidencePresented.includes(ev.id)}
                  onClick={() => send(input, ev.id)}
                  className="text-left text-xs px-2 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="text-neutral-400 mr-2">{ev.id}</span>
                  {ev.name}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => setShowEvidencePicker(s => !s)}
            disabled={pending}
            className="px-3 py-2 text-lg rounded-md bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50"
            title="Present evidence"
          >
            📎
          </button>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            disabled={pending}
            placeholder={`Ask ${npcName.split(" ")[0]} something…`}
            className="flex-1 bg-neutral-900 rounded-md px-3 py-2 text-sm placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-700"
          />
          <button
            onClick={() => send(input)}
            disabled={pending}
            className="px-4 py-2 text-sm rounded-md bg-neutral-100 text-neutral-900 hover:bg-white disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>

      <audio ref={audioRef} hidden />
    </div>
  );
}
