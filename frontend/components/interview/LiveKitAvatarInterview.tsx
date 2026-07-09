"use client";

/**
 * TalkingHeadInterview.tsx
 *
 * Full-screen 3D AI Interview UI — replaces the Beyond Presence / LiveKit component.
 *
 * Layout:
 *   Left 60%: 3D TalkingHead avatar on dark background
 *   Right 40%: Current question, live transcript, hold-to-speak mic, progress
 *
 * No LiveKit, no Python — pure browser: TalkingHead.js + GPT-4o + Web Speech API
 */

import React, {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  PhoneOff,
  Sparkles,
  RotateCcw,
  MessageSquare,
  ChevronRight,
  CheckCircle,
  Volume2,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useGPTInterview } from "@/hooks/useGPTInterview";

/**
 * AvatarViewer is imported with React.lazy() — this is the ONLY correct way
 * to do a code-split import of a forwardRef component and still pass refs.
 * next/dynamic wraps the component in LoadableComponent which does NOT forward refs.
 * This file is already loaded inside a dynamic(..., { ssr: false }) boundary in
 * InterviewPageClient.tsx, so plain lazy() is safe here.
 */
// eslint-disable-next-line
const AvatarViewer = lazy(() => import("./AvatarViewer")) as React.LazyExoticComponent<
  React.ForwardRefExoticComponent<{
    onReady?: () => void;
    onSpeakStart?: () => void;
    onSpeakEnd?: () => void;
    className?: string;
    // eslint-disable-next-line
  } & React.RefAttributes<any>>
>;

// ── Sub-components ────────────────────────────────────────────────────────────

function AvatarLoadingPlaceholder() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl bg-slate-950">
      {/* Shimmer avatar silhouette */}
      <div className="relative mb-5 flex flex-col items-center gap-3 opacity-40">
        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 animate-pulse" />
        <div className="h-3 w-32 rounded-full bg-slate-700 animate-pulse" />
        <div className="h-2 w-20 rounded-full bg-slate-800 animate-pulse" />
      </div>
      {/* Dual spinner */}
      <div className="relative mb-4">
        <div className="h-10 w-10 rounded-full border-2 border-cyan-500/20 border-t-cyan-500 animate-spin" />
        <div
          className="absolute inset-0 h-10 w-10 rounded-full border-2 border-violet-500/10 border-b-violet-500 animate-spin"
          style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
        />
      </div>
      <p className="text-sm font-medium text-slate-300">Starting 3D Avatar…</p>
      <p className="text-xs text-slate-500 mt-1">Loading Three.js engine</p>
    </div>
  );
}

// Wave bars — mic activity visualiser
function WaveBars({ active }: { active: boolean }) {
  const heights = [0.4, 0.7, 1.0, 0.8, 1.0, 0.65, 0.4];
  return (
    <div className="flex items-end gap-[3px] h-5">
      {heights.map((h, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full"
          style={{ background: active ? "#22d3ee" : "#334155" }}
          animate={{
            height: active ? `${h * 20}px` : "3px",
            opacity: active ? 0.9 : 0.3,
          }}
          transition={{
            duration: 0.2,
            delay: i * 0.04,
            ease: "easeInOut",
            repeat: active ? Infinity : 0,
            repeatType: "reverse",
          }}
        />
      ))}
    </div>
  );
}

// Progress dots
function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i < current
              ? "h-2 w-2 bg-cyan-400"
              : i === current
              ? "h-2.5 w-2.5 bg-cyan-400 ring-2 ring-cyan-400/30"
              : "h-2 w-2 bg-white/10"
          }`}
        />
      ))}
    </div>
  );
}

// ── Web Speech API mic hook ───────────────────────────────────────────────────
function useHoldToSpeak(
  onTranscript: (text: string) => void,
  disabled: boolean
) {
  const [isListening, setIsListening] = useState(false);
  const [liveText, setLiveText] = useState("");
  // eslint-disable-next-line
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    if (disabled) return;
    if (typeof window === "undefined") return;

    // eslint-disable-next-line
    const SpeechRecognitionClass: any =
      (window as any).SpeechRecognition ??
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      toast.error("Speech recognition not supported in this browser");
      return;
    }

    // eslint-disable-next-line
    const rec: any = new SpeechRecognitionClass();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    // eslint-disable-next-line
    rec.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      setLiveText(final || interim);
    };

    rec.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
    setLiveText("");
  }, [disabled]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);

    if (liveText.trim()) {
      onTranscript(liveText.trim());
    }
    setLiveText("");
  }, [liveText, onTranscript]);

  return { isListening, liveText, startListening, stopListening };
}

// ── Props ─────────────────────────────────────────────────────────────────────
export interface TalkingHeadInterviewProps {
  /** Called when the user exits the interview */
  onLeave: () => void;
  /** Optional candidate name to personalise the session */
  candidateName?: string;
}

// ── Main Component ────────────────────────────────────────────────────────────
export function TalkingHeadInterview({
  onLeave,
  candidateName,
}: TalkingHeadInterviewProps) {
  const avatarRef = useRef<{
    resumeAudio: () => Promise<void>;
    speak: (text: string, audio: string | null, tp: unknown[]) => Promise<void>;
    think: () => void;
    idle: () => void;
    isSpeaking: boolean;
    status: string;
  }>(null);

  const [avatarReady, setAvatarReady] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);

  const {
    status,
    currentQuestion,
    transcript,
    exchangeCount,
    error,
    startInterview,
    sendAnswer,
    resetInterview,
  } = useGPTInterview(avatarRef);

  const micDisabled = status === "thinking" || status === "speaking" || status === "starting";
  const totalQuestions = 8;

  // Handle mic transcript submission
  const handleTranscript = useCallback(
    async (text: string) => {
      await sendAnswer(text);
    },
    [sendAnswer]
  );

  const { isListening, liveText, startListening, stopListening } =
    useHoldToSpeak(handleTranscript, micDisabled);

  // Start interview from button click (user gesture)
  const handleStartInterview = useCallback(async () => {
    try {
      if (avatarRef.current?.resumeAudio) {
        await avatarRef.current.resumeAudio();
      }
      setInterviewStarted(true);
      await startInterview();
    } catch (err) {
      console.error("[TalkingHeadInterview] Start error:", err);
      toast.error("Failed to start audio. Please try again.");
    }
  }, [startInterview]);

  // Wrapped reset to clean UI state
  const handleReset = useCallback(() => {
    resetInterview();
    setInterviewStarted(false);
  }, [resetInterview]);

  // Show toast on error
  useEffect(() => {
    if (error) {
      toast.error(error, { duration: 4000 });
    }
  }, [error]);

  // ── Complete / Feedback Screen ────────────────────────────────────────────
  if (status === "complete") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[500px] rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-slate-900/80 to-slate-950/90 p-10 text-center backdrop-blur-xl"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 ring-2 ring-emerald-500/30"
        >
          <CheckCircle className="h-10 w-10 text-emerald-400" />
        </motion.div>

        <h2 className="text-2xl font-display font-bold text-white">
          Interview Complete!
        </h2>
        <p className="mt-2 text-slate-400 max-w-sm">
          Great job! Alex has given you his final feedback above. Your session
          has finished with {totalQuestions} questions.
        </p>

        {/* Last message = feedback */}
        {currentQuestion && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-left max-w-lg w-full">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">
              Alex&apos;s Feedback
            </p>
            <p className="text-sm text-slate-200 leading-relaxed">{currentQuestion}</p>
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/10 transition-all"
          >
            <RotateCcw className="h-4 w-4" />
            Practice Again
          </button>
          <button
            onClick={onLeave}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:scale-[1.02] transition-all"
          >
            <ChevronRight className="h-4 w-4" />
            Done
          </button>
        </div>
      </motion.div>
    );
  }

  // ── Main Interview Layout ─────────────────────────────────────────────────
  return (
    <div className="flex flex-col lg:flex-row gap-0 w-full min-h-[600px] rounded-3xl border border-white/8 overflow-hidden shadow-2xl bg-slate-950">
      {/* ── LEFT: 3D Avatar Panel (60%) ─────────────────────────────────────── */}
      <div className="relative flex-[3] min-h-[380px] lg:min-h-[600px] bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center overflow-hidden">
        {/* Background ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-[0.06]"
            style={{
              background:
                "radial-gradient(circle, #22d3ee 0%, #7c3aed 60%, transparent 100%)",
            }}
          />
        </div>

        {/* Top badge */}
        <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
          <div className="flex items-center gap-1.5 rounded-full bg-black/60 px-3.5 py-1.5 text-xs font-semibold text-slate-300 border border-white/5 backdrop-blur-md">
            <Sparkles className="h-3 w-3 text-cyan-400" />
            AI Interviewer — Alex
          </div>
          {status !== "idle" && status !== "starting" && (
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border backdrop-blur-md
              ${
                status === "speaking"
                  ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
                  : status === "thinking"
                  ? "bg-violet-500/10 border-violet-500/30 text-violet-300"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              }`}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                    status === "speaking"
                      ? "bg-cyan-400"
                      : status === "thinking"
                      ? "bg-violet-400"
                      : "bg-emerald-400"
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                    status === "speaking"
                      ? "bg-cyan-400"
                      : status === "thinking"
                      ? "bg-violet-400"
                      : "bg-emerald-400"
                  }`}
                />
              </span>
              {status === "speaking"
                ? "Speaking"
                : status === "thinking"
                ? "Thinking"
                : "Listening"}
            </div>
          )}
        </div>

        {/* Avatar canvas */}
        <div className="w-full h-full flex items-center justify-center" style={{ minHeight: 400 }}>
          <Suspense fallback={<AvatarLoadingPlaceholder />}>
            <AvatarViewer
              ref={avatarRef}
              onReady={() => {
                console.log("[TalkingHeadInterview] Avatar ready");
                setAvatarReady(true);
              }}
              onSpeakStart={() => {}}
              onSpeakEnd={() => {}}
              className="w-full h-full max-h-[600px]"
            />
          </Suspense>
        </div>

        {/* User gesture start overlay */}
        {avatarReady && !interviewStarted && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-sm rounded-[2rem] border border-white/10 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl"
            >
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/10 ring-2 ring-cyan-500/20">
                <Sparkles className="h-7 w-7 text-cyan-400" />
              </div>
              <h4 className="text-lg font-display font-bold text-white">Alex is Ready</h4>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                The AI interviewer is fully loaded. Click below to initialize audio and start the 8-round interview session.
              </p>
              <button
                onClick={handleStartInterview}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:scale-[1.02] hover:from-cyan-500 hover:to-violet-500 transition-all cursor-pointer"
              >
                Start Interview
                <ChevronRight className="h-4 w-4" />
              </button>
            </motion.div>
          </div>
        )}

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
      </div>

      {/* ── RIGHT: Interview Panel (40%) ─────────────────────────────────────── */}
      <div className="flex-[2] flex flex-col justify-between bg-slate-900/60 backdrop-blur-xl border-l border-white/5 p-6 min-h-[400px]">
        {/* Header */}
        <div className="space-y-1 mb-4">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
              <MessageSquare className="h-3 w-3" />
              Mock Interview
            </div>
            {candidateName && (
              <span className="text-xs text-slate-500">{candidateName}</span>
            )}
          </div>
          <h3 className="text-lg font-display font-bold text-white">
            Live AI Interview Session
          </h3>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">Progress</span>
            <span className="text-xs font-medium text-slate-300">
              {Math.min(exchangeCount, totalQuestions)} / {totalQuestions}
            </span>
          </div>
          <ProgressDots total={totalQuestions} current={exchangeCount} />
        </div>

        {/* Current Question */}
        <div className="flex-1 mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400/70 mb-2">
            Alex&apos;s Question
          </p>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="rounded-2xl border border-white/8 bg-white/[0.03] p-4"
            >
              {status === "starting" || (status === "thinking" && !currentQuestion) ? (
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="h-2 w-2 rounded-full bg-violet-400"
                        animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 0.8, delay: i * 0.2, repeat: Infinity }}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-slate-500">Alex is preparing…</p>
                </div>
              ) : currentQuestion ? (
                <p className="text-sm leading-relaxed text-slate-100">
                  {currentQuestion}
                </p>
              ) : (
                <p className="text-sm text-slate-500 italic">
                  Waiting for Alex to speak…
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Live Transcript */}
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Your Answer
          </p>
          <div className="min-h-[72px] rounded-xl border border-white/5 bg-white/[0.02] p-3">
            {isListening ? (
              <div>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {liveText || (
                    <span className="text-slate-500 italic">Listening…</span>
                  )}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <WaveBars active={true} />
                  <span className="text-[10px] text-cyan-400">Recording</span>
                </div>
              </div>
            ) : transcript ? (
              <p className="text-sm text-slate-300 leading-relaxed">{transcript}</p>
            ) : (
              <p className="text-sm text-slate-600 italic">
                {micDisabled
                  ? "Wait for Alex to finish…"
                  : "Hold the mic button and speak your answer"}
              </p>
            )}
          </div>
        </div>

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2"
            >
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-300">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls */}
        <div className="flex items-center gap-3 mt-auto">
          {/* Hold-to-Speak Mic Button */}
          <motion.button
            onPointerDown={startListening}
            onPointerUp={stopListening}
            onPointerLeave={stopListening}
            disabled={micDisabled}
            whileHover={!micDisabled ? { scale: 1.05 } : {}}
            whileTap={!micDisabled ? { scale: 0.95 } : {}}
            className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full transition-all
              ${micDisabled
                ? "bg-slate-800/60 border border-white/5 text-slate-600 cursor-not-allowed"
                : isListening
                ? "bg-red-500/20 border-2 border-red-500/60 text-red-400 shadow-lg shadow-red-500/20"
                : "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 cursor-pointer"
              }`}
            aria-label={isListening ? "Release to send" : "Hold to speak"}
          >
            {isListening && (
              <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
            )}
            {micDisabled ? (
              <MicOff className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </motion.button>

          {/* Hint text */}
          <div className="flex-1">
            <p className="text-xs font-medium text-slate-300">
              {isListening
                ? "Release to send your answer"
                : micDisabled
                ? status === "thinking"
                  ? "Alex is thinking…"
                  : "Alex is speaking…"
                : "Hold to speak"}
            </p>
            <p className="text-[10px] text-slate-600 mt-0.5">
              {micDisabled ? "Mic disabled while AI responds" : "Web Speech API — no upload needed"}
            </p>
          </div>

          {/* Volume indicator */}
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-white/[0.03] border border-white/5">
            <Volume2 className={`h-4 w-4 ${status === "speaking" ? "text-cyan-400" : "text-slate-600"}`} />
          </div>
        </div>

        {/* End session button */}
        <button
          onClick={onLeave}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-600/5 hover:bg-red-600/15 text-red-400 py-2.5 text-sm font-semibold transition-all"
        >
          <PhoneOff className="h-4 w-4" />
          End Interview
        </button>
      </div>
    </div>
  );
}
