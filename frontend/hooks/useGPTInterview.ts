"use client";

/**
 * useGPTInterview.ts
 *
 * Manages the full conversational interview loop:
 *   1. Sends user answer → POST /api/interview → gets Alex's reply
 *   2. Sends reply text → POST /api/tts → gets base64 audio + timepoints
 *   3. Drives AvatarViewer ref to speak with lip-sync
 *
 * Usage:
 *   const { status, messages, currentQuestion, transcript, sendAnswer,
 *           startInterview, resetInterview, exchangeCount } = useGPTInterview(avatarRef);
 */

import { useCallback, useRef, useState } from "react";

export type InterviewStatus =
  | "idle"
  | "starting"
  | "thinking"
  | "speaking"
  | "listening"
  | "complete";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface UseGPTInterviewReturn {
  status: InterviewStatus;
  messages: ChatMessage[];
  currentQuestion: string;
  transcript: string;
  exchangeCount: number;
  error: string | null;
  startInterview: () => Promise<void>;
  sendAnswer: (userText: string) => Promise<void>;
  resetInterview: () => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useGPTInterview(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  avatarRef: React.RefObject<any>
): UseGPTInterviewReturn {
  const [status, setStatus] = useState<InterviewStatus>("idle");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [transcript, setTranscript] = useState("");
  const [exchangeCount, setExchangeCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Keep a stable ref to messages for async callbacks
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;

  // ── Internal: call GPT, get reply ────────────────────────────────────────
  const askAlex = useCallback(
    async (history: ChatMessage[], count: number): Promise<string> => {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, exchangeCount: count }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // Show hint if key is not configured
        const msg = data.hint || data.error || `Interview API error (${res.status})`;
        throw new Error(msg);
      }
      const data = await res.json();
      return data.reply as string;
    },
    []
  );

  // ── Internal: call TTS, get audio + timepoints ───────────────────────────
  const synthesize = useCallback(
    async (text: string): Promise<{ audioContent: string; timepoints: unknown[] } | null> => {
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    },
    []
  );

  // ── Internal: have avatar speak a reply ─────────────────────────────────
  const avatarSpeak = useCallback(
    async (text: string) => {
      if (!avatarRef.current) return;

      setStatus("speaking");
      avatarRef.current.think?.(); // Show thinking anim while TTS loads

      const ttsResult = await synthesize(text);

      if (ttsResult?.audioContent) {
        await avatarRef.current.speak(
          text,
          ttsResult.audioContent,
          ttsResult.timepoints || []
        );
      } else {
        // TTS failed — fallback: speak without audio (TalkingHead built-in)
        await avatarRef.current.speak(text, null, []);
      }

      setStatus("listening");
    },
    [avatarRef, synthesize]
  );

  // ── Start a brand-new interview session ──────────────────────────────────
  const startInterview = useCallback(async () => {
    setStatus("starting");
    setMessages([]);
    setCurrentQuestion("");
    setTranscript("");
    setExchangeCount(0);
    setError(null);
    messagesRef.current = [];

    try {
      avatarRef.current?.think?.();
      setStatus("thinking");

      // First turn — no user message, Alex opens the interview
      const reply = await askAlex([], 0);

      const assistantMsg: ChatMessage = { role: "assistant", content: reply };
      setMessages([assistantMsg]);
      setCurrentQuestion(reply);

      await avatarSpeak(reply);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start interview";
      setError(msg);
      setStatus("idle");
    }
  }, [avatarRef, askAlex, avatarSpeak]);

  // ── Send candidate's answer, get next question ───────────────────────────
  const sendAnswer = useCallback(
    async (userText: string) => {
      if (!userText.trim()) return;
      if (status === "thinking" || status === "speaking") return;

      setError(null);
      setTranscript(userText);

      const userMsg: ChatMessage = { role: "user", content: userText };
      const newCount = exchangeCount + 1;
      const updatedHistory = [...messagesRef.current, userMsg];

      setMessages(updatedHistory);
      setExchangeCount(newCount);
      setStatus("thinking");
      avatarRef.current?.think?.();

      try {
        const reply = await askAlex(updatedHistory, newCount);

        const assistantMsg: ChatMessage = { role: "assistant", content: reply };
        const finalHistory = [...updatedHistory, assistantMsg];
        setMessages(finalHistory);
        setCurrentQuestion(reply);

        // After 8 exchanges, mark as complete after Alex speaks feedback
        if (newCount >= 8) {
          await avatarSpeak(reply);
          setStatus("complete");
        } else {
          await avatarSpeak(reply);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to get response";
        setError(msg);
        setStatus("listening");
      }
    },
    [status, exchangeCount, avatarRef, askAlex, avatarSpeak]
  );

  // ── Reset everything ─────────────────────────────────────────────────────
  const resetInterview = useCallback(() => {
    avatarRef.current?.idle?.();
    setStatus("idle");
    setMessages([]);
    setCurrentQuestion("");
    setTranscript("");
    setExchangeCount(0);
    setError(null);
    messagesRef.current = [];
  }, [avatarRef]);

  return {
    status,
    messages,
    currentQuestion,
    transcript,
    exchangeCount,
    error,
    startInterview,
    sendAnswer,
    resetInterview,
  };
}
