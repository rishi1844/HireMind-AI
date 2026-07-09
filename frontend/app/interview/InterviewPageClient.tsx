"use client";

import { AnimatePresence, motion } from "framer-motion";
import React, { Suspense, useEffect, useMemo, useState, useRef, useCallback, lazy } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ArrowRight,
  CheckCircle,
  ChevronRight,
  FileText,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  Plus,
  Send,
  SkipForward,
  Sparkles,
  Star,
  UploadCloud,
  Volume2,
  VolumeX,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { AppShell } from "@/components/layout/AppShell";
import { ResumeDropzone } from "@/components/resume/ResumeDropzone";
import { useSpeechToText } from "@/hooks/useSpeech";
import { useAuthStore } from "@/lib/store";
import { getScoreColor } from "@/lib/utils";
import { interviewService, resumeService } from "@/services/api";
import { CustomResumeDropdown } from "@/components/ui/CustomResumeDropdown";

const AvatarViewer = lazy(() => import("@/components/interview/AvatarViewer")) as React.LazyExoticComponent<
  React.ForwardRefExoticComponent<{
    onReady?: () => void;
    onSpeakStart?: () => void;
    onSpeakEnd?: () => void;
    audioContext?: AudioContext | null;
    className?: string;
    // eslint-disable-next-line
  } & React.RefAttributes<any>>
>;

// TalkingHead 3D AI Interview — replaces Beyond Presence LiveKit component
const TalkingHeadInterview = dynamic(
  () =>
    import("@/components/interview/LiveKitAvatarInterview").then(
      (m) => m.TalkingHeadInterview
    ),
  { ssr: false, loading: () => <AvatarPlaceholder /> }
);

// Shown while AvatarInterviewer JS chunk loads
function AvatarPlaceholder() {
  return (
    <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-3xl border border-white/8 bg-gradient-to-b from-slate-900/80 to-slate-950">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-500" />
      <p className="mt-3 text-xs text-slate-500">Loading interviewer…</p>
    </div>
  );
}

type Phase = "setup" | "interview" | "complete" | "live_avatar";
type InputMode = "text" | "voice";
type SetupMode = "resume" | "manual" | null;
type Difficulty = "easy" | "medium" | "hard";

interface InterviewQuestion {
  question: string;
  type: string;
}

interface InterviewEvaluation {
  score: number;
  strengths: string;
  weaknesses: string;
  improvedAnswer: string;
}

interface InterviewQA {
  question: string;
  type: string;
  answer: string;
  inputMode: InputMode;
  score?: number;
  strengths?: string;
  weaknesses?: string;
  improvedAnswer?: string;
  skipped?: boolean;
}

interface SavedResume {
  resumeId: string;
  fileName: string;
  filePath: string | null;
  uploadedAt: string | null;
  analysisId?: string;
  atsScore?: number;
  analyzedAt?: string | null;
}

interface TargetedSummaryReport {
  overallScore: number;
  strengths: string;
  weaknesses: string;
  skillsToBrushUp: string[];
}

function InterviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();

  const initialResumeIdParam = searchParams.get("resumeId");
  const initialResumeId = initialResumeIdParam ? Number(initialResumeIdParam) : undefined;

  // Mode: Mock Interview (default) or Targeted Interview (new)
  const [interviewMode, setInterviewMode] = useState<"mock" | "targeted">("mock");

  // Targeted Interview Form State
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [targetedResumeMode, setTargetedResumeMode] = useState<"saved" | "paste">("saved");
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [selectedSavedResumeId, setSelectedSavedResumeId] = useState<number | undefined>(undefined);
  const [manualResumeText, setManualResumeText] = useState("");
  const [summaryReport, setSummaryReport] = useState<TargetedSummaryReport | null>(null);

  // Existing Mock Interview State
  const [phase, setPhase] = useState<Phase>("setup");
  const [setupMode, setSetupMode] = useState<SetupMode>(initialResumeId ? "resume" : null);
  const [activeResumeId, setActiveResumeId] = useState<number | undefined>(initialResumeId);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [qaList, setQaList] = useState<InterviewQA[]>([]);
  const [currentEval, setCurrentEval] = useState<InterviewEvaluation | null>(null);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [manualForm, setManualForm] = useState({
    name: "",
    skills: "",
    description: "",
  });
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const aiModel = "gpt" as const;

  const { isListening, transcript, startListening, stopListening, resetTranscript, setTranscript } = useSpeechToText();

  // Custom state & refs for AvatarViewer video & voice recruitment
  const avatarViewerRef = useRef<any>(null);
  const [avatarReady, setAvatarReady] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const currentSpeakingTextRef = useRef<string | null>(null);
  // Shared AudioContext to prevent first question browser autoplay policy block
  const audioContextRef = useRef<AudioContext | null>(null);
  // Latency-covering pulse/wave overlay state (first question only)
  const [isFirstQuestionBuffering, setIsFirstQuestionBuffering] = useState(false);

  // Helper to initialize and resume AudioContext on user interaction
  const initAudio = useCallback(() => {
    if (typeof window !== "undefined" && !audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioCtx();
    }
    if (audioContextRef.current && audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume().catch((e) => console.warn("AudioContext resume failed:", e));
    }
  }, []);

  // TTS pre-fetch cache: text → base64 audio (populated before triggerSpeak fires)
  const ttsCacheRef = useRef<Map<string, string>>(new Map());
  // In-flight TTS fetches: text → Promise so multiple callers share the same request
  const ttsPendingRef = useRef<Map<string, Promise<string | null>>>(new Map());

  const handleAvatarReady = useCallback(() => {
    console.log("[InterviewPageClient] Avatar video ready");
    setAvatarReady(true);
  }, []);

  // Helper to fetch TTS audio content with retry attempts to maximize GPT voice usage
  const fetchTTSWithRetry = useCallback(async (text: string, retries = 2): Promise<string | null> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout per attempt

        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data?.audioContent) {
            return data.audioContent;
          }
        }
      } catch (e) {
        console.warn(`[fetchTTS] Attempt ${attempt} failed:`, e);
      }
      if (attempt < retries) {
        // Wait 300ms before retrying
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }
    return null;
  }, []);

  const triggerSpeak = useCallback(async (text: string) => {
    if (isMuted) return;
    if (!avatarViewerRef.current) return;

    // Prevent duplicate triggers of the exact same text
    if (currentSpeakingTextRef.current === text) {
      console.log("[triggerSpeak] Already speaking or preparing this question:", text);
      return;
    }

    const startTime = Date.now(); // Record start time to enforce minimum overlay duration
    currentSpeakingTextRef.current = text;
    setIsSpeaking(true);

    try {
      // ── Resolve audio from cache, in-flight prefetch, or a fresh fetch ──────
      let audioContent: string | null = ttsCacheRef.current.get(text) ?? null;

      if (!audioContent) {
        let pending = ttsPendingRef.current.get(text);
        if (!pending) {
          // Safety: prefetch missed — start a fresh request now with retry
          pending = fetchTTSWithRetry(text, 2).then((audio) => {
            if (audio) ttsCacheRef.current.set(text, audio);
            ttsPendingRef.current.delete(text);
            return audio;
          });
          ttsPendingRef.current.set(text, pending);
        }
        audioContent = await pending;
      }

      if (currentSpeakingTextRef.current !== text) return;

      // Enforce a minimum 1.5 seconds loading animation on the first question for premium transition feel
      if (currentIdx === 0) {
        const elapsed = Date.now() - startTime;
        const minBufferTime = 1500;
        if (elapsed < minBufferTime) {
          await new Promise((resolve) => setTimeout(resolve, minBufferTime - elapsed));
        }
      }

      // Audio is ready to play — hide the buffering/loading animation for first question
      setIsFirstQuestionBuffering(false);

      // Start video + audio (speak() handles estimated visual fallback loop if audioContent is null)
      await avatarViewerRef.current.speak(text, audioContent, []);

    } catch (err) {
      console.warn("[triggerSpeak] Error:", err);
    } finally {
      if (currentSpeakingTextRef.current === text) {
        currentSpeakingTextRef.current = null; // Clear active text ref on finish!
        setIsSpeaking(false);
        avatarViewerRef.current?.idle?.();
      }
    }
  }, [currentIdx, isMuted, fetchTTSWithRetry]);

  const stopSpeaking = useCallback(() => {
    currentSpeakingTextRef.current = null;
    setIsSpeaking(false);
    if (avatarViewerRef.current) {
      avatarViewerRef.current.stop();
    }
    // Cancel browser native voice playback if active
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const toggleMute = useCallback(() => {
    initAudio();
    setIsMuted((prev) => {
      const nextMuted = !prev;
      if (nextMuted) {
        stopSpeaking();
      } else {
        const q = questions[currentIdx]?.question;
        if (q) {
          setTimeout(() => {
            triggerSpeak(q);
          }, 100);
        }
      }
      return nextMuted;
    });
  }, [questions, currentIdx, stopSpeaking, triggerSpeak, initAudio]);

  // Reset avatarReady state when returning to setup or complete screens
  useEffect(() => {
    if (phase === "setup" || phase === "complete") {
      setAvatarReady(false);
    }
  }, [phase]);

  // Pre-fetch TTS audio as soon as a question appears — BEFORE the 50ms triggerSpeak timer.
  // This runs in parallel with React rendering so audio is ready (or nearly ready) when
  // triggerSpeak fires. Also pre-warms the NEXT question's audio during the answer window.
  useEffect(() => {
    if (phase !== "interview" || !avatarReady) return;

    const prefetch = (text: string) => {
      if (!text || ttsCacheRef.current.has(text) || ttsPendingRef.current.has(text)) return;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s prefetch timeout

      const p = fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          clearTimeout(timeoutId);
          const audio: string | null = data?.audioContent ?? null;
          if (audio) ttsCacheRef.current.set(text, audio);
          ttsPendingRef.current.delete(text);
          return audio;
        })
        .catch(() => {
          clearTimeout(timeoutId);
          ttsPendingRef.current.delete(text);
          return null;
        });
      ttsPendingRef.current.set(text, p);
    };

    // Current question — starts fetching immediately (no delay)
    const currentQ = questions[currentIdx]?.question;
    if (currentQ) prefetch(currentQ);

    // Next question — pre-warm during the user's answer window so Q(n+1) has zero delay
    const nextQ = questions[currentIdx + 1]?.question;
    if (nextQ) prefetch(nextQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentIdx, questions, avatarReady]);

  // Auto-speak new question when interview phase starts, question changes, or avatar becomes ready
  useEffect(() => {
    if (phase === "interview" && avatarReady && questions[currentIdx]?.question) {
      const timer = setTimeout(() => {
        triggerSpeak(questions[currentIdx].question);
      }, 50);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentIdx, questions, avatarReady]);

  // Clean up speaking states on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      // Ensure AudioContext is fully closed/released to prevent any sound leaking
      if (audioContextRef.current) {
        audioContextRef.current.close().catch((e) => console.warn("Failed to close AudioContext on unmount:", e));
        audioContextRef.current = null;
      }
    };
  }, [stopSpeaking]);

  // Load Saved Resumes for Targeted Setup Tab
  useEffect(() => {
    if (isAuthenticated) {
      setLoadingResumes(true);
      resumeService.getHistory()
        .then((response) => {
          const list = (response.data || []) as SavedResume[];
          setSavedResumes(list);
          if (list.length > 0) {
            setSelectedSavedResumeId(Number(list[0].resumeId));
          }
        })
        .catch(() => {
          toast.error("Failed to load saved resumes.");
        })
        .finally(() => {
          setLoadingResumes(false);
        });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!manualForm.name && user?.name) {
      setManualForm((current) => ({
        ...current,
        name: user.name,
      }));
    }
  }, [manualForm.name, user?.name]);

  useEffect(() => {
    if (transcript) {
      setAnswer(transcript.trim());
    }
  }, [transcript]);

  const currentQuestion = questions[currentIdx];

  const answeredItems = useMemo(() => qaList.filter((item) => !item.skipped && item.score !== undefined), [qaList]);
  const averageScore = answeredItems.length
    ? answeredItems.reduce((total, item) => total + (item.score || 0), 0) / answeredItems.length
    : 0;

  // Unauthenticated preview state
  if (!isAuthenticated) {
    const previewFeatures = [
      {
        icon: FileText,
        color: "cyan",
        title: "Resume-Based Interviews",
        desc: "Upload your PDF and get questions tailored to your actual experience, projects, and skills.",
      },
      {
        icon: MessageSquare,
        color: "violet",
        title: "Manual Profile Interviews",
        desc: "Enter your name, skills, and role — the AI generates a complete tailored mock interview.",
      },
      {
        icon: Mic,
        color: "emerald",
        title: "Voice & Text Answers",
        desc: "Answer using your microphone or keyboard. Real-time transcription supported.",
      },
      {
        icon: Star,
        color: "amber",
        title: "Scored Feedback",
        desc: "Every answer gets a 1–10 score with strengths, weaknesses, and a model answer.",
      },
    ];

    return (
      <div className="mx-auto max-w-3xl space-y-8 py-4">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.22em] text-cyan-400/80">AI Interview Studio</p>
          <h1 className="mb-2 text-3xl font-display font-bold text-white md:text-4xl">
            Practice Smarter,{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">Get Hired Faster</span>
          </h1>
          <p className="max-w-xl text-slate-400">
            AI-generated interview questions tailored to your resume. Scored answers with model responses after every question.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.06 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { value: "8", label: "Questions / Session" },
            { value: "AI", label: "Scored Feedback" },
            { value: "∞", label: "Practice Sessions" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/8 bg-white/[0.03] py-4 text-center backdrop-blur-xl">
              <p className="text-xl font-display font-bold text-cyan-300 md:text-2xl">{stat.value}</p>
              <p className="mt-0.5 text-xs text-slate-500">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Hero CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="group relative overflow-hidden rounded-[2rem] border border-dashed border-cyan-500/30 bg-cyan-500/5 px-8 py-12 text-center transition-all hover:border-cyan-500/50 hover:bg-cyan-500/8"
        >
          <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.06), rgba(139,92,246,0.04))" }}
          />
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-500/12 ring-1 ring-cyan-500/20">
            <Mic className="h-8 w-8 text-cyan-400" />
          </div>
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-400/70">Get Started</p>
          <h2 className="mt-2 text-2xl font-display font-bold text-white md:text-3xl">Login to Start Your Interview</h2>
          <p className="mx-auto mt-2.5 max-w-sm text-sm text-slate-400">
            Sign in to practice with AI-generated questions and get detailed scored feedback on every answer.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-violet-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] hover:from-cyan-600 hover:to-violet-500"
            >
              <ArrowRight className="h-4 w-4" />
              Login to Start
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-7 py-3 text-sm font-semibold text-slate-200 transition-all hover:bg-white/10"
            >
              Sign Up Free
            </Link>
          </div>
        </motion.div>

        {/* Feature preview */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.16 }}
        >
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">What you get</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {previewFeatures.map((feature) => (
              <div
                key={feature.title}
                className={`group/card flex items-start gap-3 rounded-2xl border p-5 transition-all hover:-translate-y-0.5 ${feature.color === "cyan"
                  ? "border-cyan-500/15 bg-cyan-500/5 hover:border-cyan-500/30"
                  : feature.color === "violet"
                    ? "border-violet-500/15 bg-violet-500/5 hover:border-violet-500/30"
                    : feature.color === "emerald"
                      ? "border-emerald-500/15 bg-emerald-500/5 hover:border-emerald-500/30"
                      : "border-amber-500/15 bg-amber-500/5 hover:border-amber-500/30"
                  }`}
              >
                <feature.icon
                  className={`mt-0.5 h-5 w-5 shrink-0 ${feature.color === "cyan" ? "text-cyan-400" : feature.color === "violet" ? "text-violet-400" : feature.color === "emerald" ? "text-emerald-400" : "text-amber-400"
                    }`}
                />
                <div>
                  <p className="text-sm font-semibold text-white">{feature.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  const resetStepState = () => {
    setAnswer("");
    resetTranscript();
    setCurrentEval(null);
    if (isListening) {
      stopListening();
    }
    stopSpeaking();
  };

  const evaluateAndCompleteTargetedSession = async () => {
    setLoading(true);
    try {
      const payload = {
        jobTitle: jobTitle.trim(),
        companyName: companyName.trim(),
        jobDescription: jobDescription.trim(),
        resumeId: targetedResumeMode === "saved" ? selectedSavedResumeId : null,
        resumeText: targetedResumeMode === "paste" ? manualResumeText.trim() : null,
        qaList: qaList.map((item) => ({
          question: item.question,
          answer: item.answer,
          skipped: !!item.skipped,
        })),
        aiModel,
      };
      const { data } = await interviewService.evaluateTargetedSession(payload);
      setSummaryReport(data);
      setPhase("complete");
    } catch (error: any) {
      toast.error("Failed to generate overall session evaluation summary. Using averages.");
      setSummaryReport({
        overallScore: averageScore,
        strengths: "Evaluated successfully based on individual answers.",
        weaknesses: "Review individual answer feedback for detail.",
        skillsToBrushUp: [jobTitle || "Core Skills"],
      });
      setPhase("complete");
    } finally {
      setLoading(false);
    }
  };

  const moveToNextQuestion = () => {
    if (currentIdx + 1 >= questions.length) {
      resetStepState();
      if (interviewMode === "targeted") {
        evaluateAndCompleteTargetedSession();
      } else {
        setPhase("complete");
      }
      return;
    }

    resetStepState();
    setCurrentIdx((index) => index + 1);
  };

  const buildManualPayload = () => ({
    name: manualForm.name.trim() || user?.name || undefined,
    skills: manualForm.skills.trim() || undefined,
    description: [
      manualForm.description.trim(),
      `Interview difficulty: ${difficulty} — ${difficulty === "easy" ? "basic conceptual questions" : difficulty === "hard" ? "advanced system design and problem-solving" : "standard interview depth"}.`,
    ].filter(Boolean).join(" "),
  });

  const buildEvaluationContext = () =>
    [
      activeResumeId && setupMode === "resume" ? `Resume ID: ${activeResumeId}` : "",
      manualForm.name.trim() ? `Candidate name: ${manualForm.name.trim()}` : user?.name ? `Candidate name: ${user.name}` : "",
      manualForm.skills.trim() ? `Skills: ${manualForm.skills.trim()}` : "",
      manualForm.description.trim() ? `Description: ${manualForm.description.trim()}` : "",
      setupMode === "resume" ? "Interview mode: Resume-based interview" : "",
      setupMode === "manual" ? "Interview mode: Manual-input interview" : "",
    ]
      .filter(Boolean)
      .join("\n");

  const generateQuestions = async (count: number, append = false) => {
    const previousQuestions = append ? questions.map((q) => q.question) : [];

    const payload =
      setupMode === "resume"
        ? {
          resumeId: activeResumeId,
          name: user?.name || manualForm.name.trim() || undefined,
          difficulty,
          count,
          aiModel,
          previousQuestions,
        }
        : {
          ...buildManualPayload(),
          difficulty,
          count,
          aiModel,
          previousQuestions,
        };

    setLoading(true);
    try {
      const { data } = await interviewService.generateQuestions(payload);

      if (append) {
        const startIndex = questions.length;
        setQuestions((current) => [...current, ...data.questions]);
        setCurrentIdx(startIndex);
        setPhase("interview");
        resetStepState();
        toast.success(`${data.questions.length} more questions added`);
      } else {
        setQuestions(data.questions);
        setCurrentIdx(0);
        setQaList([]);
        resetStepState();
        setIsFirstQuestionBuffering(true); // Re-enable first-question buffering overlay after resetStepState
        setPhase("interview");
        toast.success("Questions ready. Start when you are ready.");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to generate interview questions");
    } finally {
      setLoading(false);
    }
  };

  const prepareResumeInterview = async () => {
    if (activeResumeId) {
      await generateQuestions(8);
      return;
    }

    if (!resumeFile) {
      toast.error("Upload a resume to start a resume-based interview");
      return;
    }

    setLoading(true);
    try {
      const { data: resume } = await resumeService.upload(resumeFile);
      setActiveResumeId(resume.id);

      try {
        await resumeService.analyze(resume.id);
      } catch {
        toast("Resume uploaded. Starting interview without full analysis.");
      }

      const { data } = await interviewService.generateQuestions({
        resumeId: resume.id,
        name: user?.name || undefined,
        difficulty,
        count: 8,
        aiModel,
        previousQuestions: [],
      });

      setQuestions(data.questions);
      setCurrentIdx(0);
      setQaList([]);
      resetStepState();
      setIsFirstQuestionBuffering(true); // Re-enable first-question buffering overlay after resetStepState
      setPhase("interview");
      toast.success("Resume interview is ready.");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to prepare resume interview");
    } finally {
      setLoading(false);
    }
  };

  const startTargetedInterview = async () => {
    setLoading(true);
    try {
      const payload = {
        jobTitle: jobTitle.trim(),
        companyName: companyName.trim(),
        jobDescription: jobDescription.trim(),
        resumeId: targetedResumeMode === "saved" ? selectedSavedResumeId : null,
        resumeText: targetedResumeMode === "paste" ? manualResumeText.trim() : null,
        count: 8,
        aiModel,
      };
      const { data } = await interviewService.generateTargetedQuestions(payload);

      setQuestions(data.questions);
      setCurrentIdx(0);
      setQaList([]);
      resetStepState();
      setIsFirstQuestionBuffering(true); // Re-enable first-question buffering overlay after resetStepState
      setPhase("interview");
      toast.success("Targeted job-specific interview is ready.");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to generate targeted interview questions");
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = async () => {
    initAudio();
    setIsFirstQuestionBuffering(true);
    if (interviewMode === "targeted") {
      await startTargetedInterview();
      return;
    }

    if (!setupMode) {
      toast.error("Choose an interview mode to continue");
      return;
    }

    if (setupMode === "resume") {
      await prepareResumeInterview();
      return;
    }

    if (!manualForm.name.trim() && !manualForm.skills.trim() && !manualForm.description.trim() && !user?.name) {
      toast.error("Add at least one manual detail to generate questions");
      return;
    }

    await generateQuestions(8);
  };

  const handleSubmitAnswer = async () => {
    if (!currentQuestion) {
      return;
    }

    if (!answer.trim()) {
      toast.error("Please provide an answer or skip the question");
      return;
    }

    setEvaluating(true);
    setCurrentEval(null);
    if (isListening) {
      stopListening();
    }

    try {
      let data;
      if (interviewMode === "targeted") {
        const payload = {
          question: currentQuestion.question,
          answer: answer.trim(),
          jobTitle: jobTitle.trim(),
          companyName: companyName.trim(),
          jobDescription: jobDescription.trim(),
          resumeId: targetedResumeMode === "saved" ? selectedSavedResumeId : null,
          resumeText: targetedResumeMode === "paste" ? manualResumeText.trim() : null,
          aiModel,
        };
        const response = await interviewService.evaluateTargetedAnswer(payload);
        data = response.data;
      } else {
        const response = await interviewService.evaluateAnswer({
          question: currentQuestion.question,
          answer: answer.trim(),
          resumeContext: buildEvaluationContext(),
          aiModel,
        });
        data = response.data;
      }

      setCurrentEval(data);
      setQaList((current) => [
        ...current,
        {
          question: currentQuestion.question,
          type: currentQuestion.type,
          answer: answer.trim(),
          inputMode,
          score: data.score,
          strengths: data.strengths,
          weaknesses: data.weaknesses,
          improvedAnswer: data.improvedAnswer,
        },
      ]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Evaluation failed. Please try again.");
    } finally {
      setEvaluating(false);
    }
  };

  const handleSkipQuestion = () => {
    if (!currentQuestion) {
      return;
    }

    setQaList((current) => [
      ...current,
      {
        question: currentQuestion.question,
        type: currentQuestion.type,
        answer: "",
        inputMode,
        skipped: true,
      },
    ]);
    toast.success("Question skipped");
    moveToNextQuestion();
  };

  const buildSessionTitle = () => {
    if (interviewMode === "targeted") {
      return `${jobTitle} · ${companyName}`;
    }
    const displayName = manualForm.name.trim() || user?.name || "Candidate";
    const suffix = new Date().toLocaleDateString();

    if (setupMode === "resume") {
      return `${displayName} resume interview - ${suffix}`;
    }

    return `${displayName} manual interview - ${suffix}`;
  };

  const handleSaveSession = async () => {
    setSaving(true);
    try {
      await interviewService.saveSession({
        resumeId: (interviewMode === "targeted" && targetedResumeMode === "saved") ? selectedSavedResumeId : (setupMode === "resume" ? activeResumeId : undefined),
        sessionTitle: buildSessionTitle(),
        qaList: qaList.map((item, index) => ({
          question: item.question,
          questionType: item.type,
          answer: item.answer,
          inputMode: item.inputMode,
          score: item.score,
          strengths: item.strengths,
          weaknesses: item.weaknesses,
          improvedAnswer: item.improvedAnswer,
          skipped: item.skipped,
          orderIndex: index,
        })),
      });
      toast.success("Interview session saved");
      router.push("/interview/history");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save interview session");
    } finally {
      setSaving(false);
    }
  };

  const handleStartOver = () => {
    setPhase("setup");
    setSetupMode(initialResumeId ? "resume" : null);
    setQuestions([]);
    setCurrentIdx(0);
    setQaList([]);
    setResumeFile(null);
    setActiveResumeId(initialResumeId);
    setSummaryReport(null);
    setManualForm({
      name: user?.name || "",
      skills: "",
      description: "",
    });
    setJobTitle("");
    setCompanyName("");
    setJobDescription("");
    setManualResumeText("");
    resetStepState();
  };

  const handlePracticeAgain = async () => {
    initAudio();
    setIsFirstQuestionBuffering(true);
    setPhase("setup");
    setQuestions([]);
    setCurrentIdx(0);
    setQaList([]);
    setSummaryReport(null);
    resetStepState();
    await startTargetedInterview();
  };

  const handleTryDifferentJob = () => {
    setPhase("setup");
    setQuestions([]);
    setCurrentIdx(0);
    setQaList([]);
    setSummaryReport(null);
    setJobTitle("");
    setCompanyName("");
    setJobDescription("");
    setManualResumeText("");
    resetStepState();
  };

  const typeStyles: Record<string, string> = {
    TECHNICAL: "border-cyan-500/25 bg-cyan-500/10 text-cyan-300",
    PROJECT: "border-violet-500/25 bg-violet-500/10 text-violet-300",
    HR: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  };

  const jdMinLength = 50;
  const isJdTooShort = jobDescription.length > 0 && jobDescription.length < jdMinLength;

  const isTargetedFormValid =
    jobTitle.trim().length > 0 &&
    companyName.trim().length > 0 &&
    jobDescription.trim().length >= jdMinLength &&
    (targetedResumeMode === "saved"
      ? selectedSavedResumeId !== undefined
      : manualResumeText.trim().length > 0);

  if (phase === "live_avatar") {
    return (
      <TalkingHeadInterview
        candidateName={user?.name || undefined}
        onLeave={() => setPhase("setup")}
      />
    );
  }

  if (phase === "setup") {
    return (
      <div className="mx-auto max-w-4xl space-y-6 py-4">
        {/* Page Title Header */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="flex flex-col gap-4">
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.22em] text-cyan-400/80">AI Interview Studio</p>
            <h2 className="mb-2 text-3xl font-display font-bold text-white">
              Smart <span className="text-gradient">Interview</span> Session
            </h2>
            <p className="max-w-2xl text-slate-400">
              Prepare for your next step. Switch between general mock practice and job-specific targeted interviews.
            </p>
          </div>

          {/* Navigation Tabs (Feature Select) */}
          <div className="flex border-b border-white/10 pb-1 mt-2">
            <button
              onClick={() => setInterviewMode("mock")}
              className={`mr-8 pb-3 text-sm font-semibold transition-all relative ${interviewMode === "mock"
                ? "text-cyan-400 font-bold"
                : "text-slate-400 hover:text-slate-200"
                }`}
            >
              Mock Interview
              {interviewMode === "mock" && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400"
                />
              )}
            </button>
            <button
              onClick={() => setInterviewMode("targeted")}
              className={`pb-3 text-sm font-semibold transition-all relative ${interviewMode === "targeted"
                ? "text-cyan-400 font-bold"
                : "text-slate-400 hover:text-slate-200"
                }`}
            >
              Targeted Interview
              {interviewMode === "targeted" && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400"
                />
              )}
            </button>
          </div>
        </motion.div>

        {interviewMode === "mock" ? (
          <>
            <div className="grid gap-5 lg:grid-cols-2">
              <motion.button
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSetupMode("resume")}
                className={cnSetupCard(setupMode === "resume")}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cyan-500/12 text-cyan-300 ring-1 ring-cyan-500/20">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-display font-semibold text-white">Resume-Based Interview</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Upload a resume and generate questions from your actual experience and project context.
                    </p>
                  </div>
                </div>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 }}
                onClick={() => setSetupMode("manual")}
                className={cnSetupCard(setupMode === "manual")}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-500/12 text-violet-300 ring-1 ring-violet-500/20">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-display font-semibold text-white">Manual Input Interview</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Add only your name, skills, and a short description. The model uses that combined input to tailor the interview.
                    </p>
                  </div>
                </div>
              </motion.button>
            </div>

            <AnimatePresence mode="wait">
              {setupMode === "resume" && (
                <motion.div
                  key="resume-mode"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-[1.75rem] border border-white/8 p-6 glass-card"
                >
                  <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-cyan-300/80">Resume mode</p>
                      <h3 className="text-2xl font-display font-semibold text-white">Prepare your resume context</h3>
                    </div>
                    {activeResumeId && (
                      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
                        Resume ready
                      </span>
                    )}
                  </div>

                  {activeResumeId ? (
                    <div className="rounded-[1.5rem] border border-cyan-500/15 bg-cyan-500/5 p-5">
                      <p className="text-sm font-medium text-white">A resume is already linked to this interview session.</p>
                      <p className="mt-2 text-sm text-slate-400">
                        Start immediately, or switch to a different file if you want a fresh resume-based interview.
                      </p>
                      <button
                        onClick={() => {
                          setActiveResumeId(undefined);
                          setResumeFile(null);
                        }}
                        className="mt-4 rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                      >
                        Use a different resume
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <ResumeDropzone
                        onFileSelect={(file) => {
                          setResumeFile(file);
                          setActiveResumeId(undefined);
                        }}
                        isUploading={loading}
                        uploadedFile={resumeFile}
                        onRemove={() => setResumeFile(null)}
                      />

                      <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-4">
                        <p className="text-sm text-slate-300">
                          Upload your PDF once. The app will create resume-aware interview questions and preserve the session in history.
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {setupMode === "manual" && (
                <motion.div
                  key="manual-mode"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-[1.75rem] border border-white/8 p-6 glass-card"
                >
                  <div className="mb-6">
                    <p className="text-sm uppercase tracking-[0.2em] text-violet-300/80">Manual mode</p>
                    <h3 className="text-2xl font-display font-semibold text-white">Simple candidate input</h3>
                    <p className="mt-2 text-sm text-slate-400">
                      Keep it compact. These three fields are enough to generate a tailored mock interview.
                    </p>
                  </div>

                  <div className="grid gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">Name</label>
                      <input
                        value={manualForm.name}
                        onChange={(event) => setManualForm((current) => ({ ...current, name: event.target.value }))}
                        placeholder="Your full name"
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-violet-500/60 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">Skills</label>
                      <input
                        value={manualForm.skills}
                        onChange={(event) => setManualForm((current) => ({ ...current, skills: event.target.value }))}
                        placeholder="React, Spring Boot, MySQL, REST APIs"
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-violet-500/60 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">Description</label>
                      <textarea
                        rows={4}
                        value={manualForm.description}
                        onChange={(event) => setManualForm((current) => ({ ...current, description: event.target.value }))}
                        placeholder="Describe your experience, target role, projects, or the kind of interview you want."
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-violet-500/60 focus:outline-none"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Difficulty Selector */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="rounded-[1.75rem] border border-white/8 p-5 glass-card"
            >
              <p className="mb-3 text-sm font-medium text-slate-300">Interview Difficulty</p>
              <div className="grid grid-cols-3 gap-2">
                {(["easy", "medium", "hard"] as Difficulty[]).map((d) => {
                  const colors = {
                    easy: { active: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300", idle: "border-white/10 text-slate-400 hover:border-emerald-500/20 hover:text-emerald-300" },
                    medium: { active: "border-amber-500/40 bg-amber-500/15 text-amber-300", idle: "border-white/10 text-slate-400 hover:border-amber-500/20 hover:text-amber-300" },
                    hard: { active: "border-rose-500/40 bg-rose-500/15 text-rose-300", idle: "border-white/10 text-slate-400 hover:border-rose-500/20 hover:text-rose-300" },
                  };
                  return (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`rounded-2xl border py-2.5 text-sm font-medium capitalize transition-all ${difficulty === d ? colors[d].active : colors[d].idle}`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {difficulty === "easy" && "Basic conceptual questions — great for freshers and beginners."}
                {difficulty === "medium" && "Standard interview depth — balanced theory and application."}
                {difficulty === "hard" && "Advanced system design, problem-solving, and senior-level questions."}
              </p>
            </motion.div>

            {/* 3D AI Avatar Interview Option */}
            {/* <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-[1.75rem] border border-cyan-500/20 bg-cyan-500/5 p-5 glass-card flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-white flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                  3D AI Avatar Interview (Beta)
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Practice with Alex — a talking 3D AI interviewer with voice, lip-sync, and GPT-4o brain.
                </p>
              </div>
              <button
                onClick={() => setPhase("live_avatar")}
                className="shrink-0 ml-4 flex items-center gap-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-4 py-2 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/20 transition-all"
              >
                Try Now
                <ChevronRight className="h-3 w-3" />
              </button>
            </motion.div> */}

            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              onClick={handleStartInterview}
              disabled={loading || !setupMode}
              className="flex w-full items-center justify-center gap-3 rounded-[1.75rem] bg-gradient-to-r from-violet-600 to-cyan-600 py-4 text-lg font-semibold text-white transition-all hover:scale-[1.01] hover:from-violet-500 hover:to-cyan-500 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : setupMode === "resume" ? (
                <>
                  <UploadCloud className="h-5 w-5" />
                  Start Resume-Based Interview with Vita AI
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Start Manual Interview with Vita AI
                </>
              )}
            </motion.button>
          </>
        ) : (
          /* Targeted Job Interview Setup Form */
          <>
            <motion.div
              key="targeted-setup"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-[1.75rem] border border-white/8 p-6 glass-card space-y-5"
            >
              <div className="mb-2">
                <p className="text-sm uppercase tracking-[0.2em] text-cyan-300/80">Targeted Mode</p>
                <h3 className="text-2xl font-display font-semibold text-white">Configure Your Target Job</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Get interview questions tailored specifically to this job, your background and also analyse how many experience candidate has or the job required. No generic questions — only what this company would actually ask you.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Job Title / Role <span className="text-rose-400">*</span></label>
                  <input
                    value={jobTitle}
                    onChange={(event) => setJobTitle(event.target.value)}
                    placeholder="e.g. Senior Frontend Developer"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/60 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Company Name <span className="text-rose-400">*</span></label>
                  <input
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                    placeholder="e.g. Google, Infosys, Startup Name"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/60 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Job Description <span className="text-rose-400">*</span></label>
                <textarea
                  rows={5}
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                  placeholder="Paste the job description here — requirements, responsibilities, tech stack etc."
                  className={`w-full rounded-2xl border bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none ${isJdTooShort ? "border-rose-500/50 focus:border-rose-500" : "border-white/10 focus:border-cyan-500/60"
                    }`}
                  required
                />
                {isJdTooShort && (
                  <p className="mt-1.5 text-xs text-rose-400">
                    Job description must be at least 50 characters (currently {jobDescription.length} characters).
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-300">Your Resume <span className="text-rose-400">*</span></label>

                {/* Resume Options Switcher */}
                <div className="flex rounded-2xl bg-white/5 p-1 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setTargetedResumeMode("saved")}
                    className={`flex-1 py-2 text-center text-xs font-semibold rounded-xl transition-all ${targetedResumeMode === "saved"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      : "text-slate-400 hover:text-slate-200"
                      }`}
                  >
                    Use My Saved Resume
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetedResumeMode("paste")}
                    className={`flex-1 py-2 text-center text-xs font-semibold rounded-xl transition-all ${targetedResumeMode === "paste"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      : "text-slate-400 hover:text-slate-200"
                      }`}
                  >
                    Paste Resume Text
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {targetedResumeMode === "saved" ? (
                    <motion.div
                      key="saved-resume"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="space-y-2"
                    >
                      {loadingResumes ? (
                        <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
                          <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                          <span>Loading your resumes...</span>
                        </div>
                      ) : savedResumes.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-slate-500">
                          No saved resumes found. Try pasting your resume text instead, or upload a resume in the Mock Interview section first.
                        </div>
                      ) : (
                        <CustomResumeDropdown
                          value={selectedSavedResumeId || ""}
                          onChange={(val) => setSelectedSavedResumeId(val ? Number(val) : undefined)}
                          resumes={savedResumes.map((resume) => ({
                            resumeId: resume.resumeId,
                            fileName: `${resume.fileName}${resume.atsScore ? ` (ATS: ${resume.atsScore})` : ""}`
                          }))}
                          placeholder="Select a resume"
                        />
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="pasted-resume"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                    >
                      <textarea
                        rows={6}
                        value={manualResumeText}
                        onChange={(e) => setManualResumeText(e.target.value)}
                        placeholder="Paste your resume content here"
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/60 focus:outline-none"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              onClick={handleStartInterview}
              disabled={loading || !isTargetedFormValid}
              className="flex w-full items-center justify-center gap-3 rounded-[1.75rem] bg-gradient-to-r from-violet-600 to-cyan-600 py-4 text-lg font-semibold text-white transition-all hover:scale-[1.01] hover:from-violet-500 hover:to-cyan-500 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Start Targeted Interview
                </>
              )}
            </motion.button>
          </>
        )}
      </div>
    );
  }

  /* End of Interview View */
  if (phase === "complete") {
    const answeredCount = qaList.filter((item) => !item.skipped && item.answer.trim()).length;
    const skippedCount = qaList.filter((item) => item.skipped).length;

    if (interviewMode === "targeted" && summaryReport) {
      return (
        <div className="mx-auto max-w-4xl space-y-6 py-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-[2rem] border border-violet-500/20 p-8 text-center glass-card glow-violet"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
              <CheckCircle className="h-8 w-8 text-emerald-400" />
            </div>

            <h2 className="mb-2 text-3xl font-display font-bold text-white">Targeted Interview Complete</h2>
            <p className="mb-1 text-slate-300 font-medium">For {jobTitle} at {companyName}</p>
            <p className="mb-6 text-slate-400">Review your final AI summary report and practice outcomes.</p>

            <div className="mb-6 inline-flex items-baseline gap-1 rounded-2xl border border-white/10 px-8 py-4 glass">
              <span className="text-5xl font-display font-bold" style={{ color: getScoreColor(summaryReport.overallScore * 10) }}>
                {summaryReport.overallScore.toFixed(1)}
              </span>
              <span className="text-lg text-slate-400">/ 10</span>
            </div>

            {/* Detailed Summary Report Card */}
            <div className="mb-6 text-left grid gap-4">
              <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/80">Strengths Identified</p>
                <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">{summaryReport.strengths}</p>
              </div>

              <div className="rounded-2xl border border-rose-500/15 bg-rose-500/5 p-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-rose-300/80">Areas to Improve</p>
                <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">{summaryReport.weaknesses}</p>
              </div>

              <div className="rounded-2xl border border-cyan-500/15 bg-cyan-500/5 p-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300/80">Top 3 Skills to Brush Up</p>
                <div className="flex flex-wrap gap-2">
                  {summaryReport.skillsToBrushUp.map((skill, idx) => (
                    <span key={idx} className="rounded-full bg-cyan-500/20 border border-cyan-500/30 px-3 py-1 text-xs text-cyan-200 font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-3 gap-3">
              {[
                { label: "Answered", value: answeredCount },
                { label: "Skipped", value: skippedCount },
                { label: "Questions", value: qaList.length },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/8 px-4 py-3 glass">
                  <p className="text-2xl font-display font-bold text-white">{item.value}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={handleSaveSession}
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:from-violet-500 hover:to-cyan-500 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Save Session
              </button>

              <button
                onClick={handlePracticeAgain}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-6 py-3 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Practice Again
              </button>

              <button
                onClick={handleTryDifferentJob}
                className="rounded-2xl border border-white/10 px-6 py-3 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                Try Different Job
              </button>

              <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center justify-center gap-2 rounded-2xl border border-cyan-500/25 bg-cyan-500/8 px-6 py-3 text-sm font-medium text-cyan-300 transition-all hover:border-cyan-500/40 hover:bg-cyan-500/15"
              >
                <ArrowRight className="h-4 w-4" />
                Go to Dashboard
              </button>
            </div>
          </motion.div>

          <div className="space-y-4">
            {qaList.map((item, index) => (
              <motion.div
                key={`${item.question}-${index}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="rounded-[1.5rem] border border-white/8 p-5 glass-card"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs ${typeStyles[item.type] || typeStyles.TECHNICAL}`}>
                      {item.type}
                    </span>
                    {item.skipped && (
                      <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
                        Skipped
                      </span>
                    )}
                  </div>
                  {!item.skipped && item.score !== undefined && (
                    <span className="text-lg font-display font-bold" style={{ color: getScoreColor(item.score * 10) }}>
                      {item.score}/10
                    </span>
                  )}
                </div>

                <p className="mb-2 text-base font-medium text-white">{item.question}</p>
                <p className="text-sm leading-relaxed text-slate-400">
                  {item.skipped ? "No answer submitted for this question." : item.answer}
                </p>

                {!item.skipped && item.improvedAnswer && (
                  <div className="mt-4 rounded-2xl border border-violet-500/15 bg-violet-500/5 p-4">
                    <p className="mb-1 text-xs uppercase tracking-[0.18em] text-violet-300/80">Model answer</p>
                    <p className="text-sm leading-relaxed text-slate-300">{item.improvedAnswer}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-4xl space-y-6 py-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-[2rem] border border-violet-500/20 p-8 text-center glass-card glow-violet"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
            <CheckCircle className="h-8 w-8 text-emerald-400" />
          </div>

          <h2 className="mb-2 text-3xl font-display font-bold text-white">Interview Complete</h2>
          <p className="mb-6 text-slate-400">Review your summary, save the session, or ask for more questions.</p>

          <div className="mb-6 inline-flex items-baseline gap-1 rounded-2xl border border-white/10 px-8 py-4 glass">
            <span className="text-5xl font-display font-bold" style={{ color: getScoreColor(averageScore * 10) }}>
              {averageScore.toFixed(1)}
            </span>
            <span className="text-lg text-slate-400">/ 10</span>
          </div>

          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Answered", value: answeredCount },
              { label: "Skipped", value: skippedCount },
              { label: "Questions", value: qaList.length },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/8 px-4 py-3 glass">
                <p className="text-2xl font-display font-bold text-white">{item.value}</p>
                <p className="mt-0.5 text-xs text-slate-500">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={handleSaveSession}
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:from-violet-500 hover:to-cyan-500 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Save Session
            </button>

            <button
              onClick={() => generateQuestions(5, true)}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-6 py-3 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              More Questions
            </button>

            <button
              onClick={handleStartOver}
              className="rounded-2xl border border-white/10 px-6 py-3 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              Start Over
            </button>

            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center justify-center gap-2 rounded-2xl border border-cyan-500/25 bg-cyan-500/8 px-6 py-3 text-sm font-medium text-cyan-300 transition-all hover:border-cyan-500/40 hover:bg-cyan-500/15"
            >
              <ArrowRight className="h-4 w-4" />
              Go to Dashboard
            </button>
          </div>
        </motion.div>

        <div className="space-y-4">
          {qaList.map((item, index) => (
            <motion.div
              key={`${item.question}-${index}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="rounded-[1.5rem] border border-white/8 p-5 glass-card"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs ${typeStyles[item.type] || typeStyles.TECHNICAL}`}>
                    {item.type}
                  </span>
                  {item.skipped && (
                    <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
                      Skipped
                    </span>
                  )}
                </div>
                {!item.skipped && item.score !== undefined && (
                  <span className="text-lg font-display font-bold" style={{ color: getScoreColor(item.score * 10) }}>
                    {item.score}/10
                  </span>
                )}
              </div>

              <p className="mb-2 text-base font-medium text-white">{item.question}</p>
              <p className="text-sm leading-relaxed text-slate-400">
                {item.skipped ? "No answer submitted for this question." : item.answer}
              </p>

              {!item.skipped && item.improvedAnswer && (
                <div className="mt-4 rounded-2xl border border-violet-500/15 bg-violet-500/5 p-4">
                  <p className="mb-1 text-xs uppercase tracking-[0.18em] text-violet-300/80">Model answer</p>
                  <p className="text-sm leading-relaxed text-slate-300">{item.improvedAnswer}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
      </div>
    );
  }

  const progress = questions.length ? (currentIdx / questions.length) * 100 : 0;

  return (
    <div className="mx-auto max-w-6xl">
      {/* Role and Company card for Targeted Interviews (always visible) */}
      {interviewMode === "targeted" && (
        <div className="mb-4 inline-flex items-center gap-2 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-300">
          <Sparkles className="h-4 w-4" />
          <span>{jobTitle} · {companyName}</span>
        </div>
      )}

      {/* ── Progress bar (full width, above split) ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-5">
        <div className="mb-2 flex items-center justify-between text-sm text-slate-400">
          <span>Question {currentIdx + 1} of {questions.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </motion.div>

      {/* ── Split layout: Avatar | Question+Answer ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[380px_1fr]">

        {/* ── LEFT: Video Recruiter ── */}
        <div className="lg:sticky lg:top-6 h-[340px] w-full lg:h-[520px] rounded-2xl border border-white/8 overflow-hidden bg-slate-900 relative">
          <Suspense fallback={<AvatarPlaceholder />}>
            <AvatarViewer
              ref={avatarViewerRef}
              onReady={handleAvatarReady}
              audioContext={audioContextRef.current}
              className="w-full h-full"
            />
          </Suspense>

          {/* Latency-covering Sound-Wave Animation (First Question only) */}
          {isFirstQuestionBuffering && currentIdx === 0 && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-[4px] rounded-2xl">
              <div className="flex items-end gap-1.5 mb-5 h-10">
                {[1, 2, 3, 4, 5, 6, 7].map((bar) => (
                  <div
                    key={bar}
                    className="w-1.5 rounded-full bg-gradient-to-t from-cyan-500 to-cyan-300"
                    style={{
                      height: `${Math.sin(bar) * 4 + 14}px`,
                      animationName: "voice-wave",
                      animationDuration: "1.0s",
                      animationTimingFunction: "ease-in-out",
                      animationIterationCount: "infinite",
                      animationDelay: `${bar * 0.12}s`,
                      transformOrigin: "bottom",
                    }}
                  />
                ))}
              </div>
              <p className="text-xs font-semibold text-cyan-300 tracking-wider animate-pulse">
                Initializing Recruiter Voice…
              </p>
            </div>
          )}
        </div>

        {/* ── RIGHT: Question + Answer area ── */}
        <div className="space-y-5">

          <AnimatePresence mode="wait">
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              className="rounded-[1.75rem] border border-white/8 p-6 glass-card"
            >
              <div className="mb-4 flex items-center gap-2">
                <span className={`rounded-full border px-3 py-1 text-xs ${typeStyles[currentQuestion.type] || typeStyles.TECHNICAL}`}>
                  {currentQuestion.type}
                </span>
                <button
                  onClick={toggleMute}
                  className={cnSpeakerButton(!isMuted && isSpeaking)}
                  title={isMuted ? "Unmute recruiter" : "Mute recruiter"}
                >
                  {isMuted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4 text-cyan-400" />}
                </button>
              </div>
              <p className="text-lg font-medium leading-relaxed text-white">{currentQuestion.question}</p>
            </motion.div>
          </AnimatePresence>

          {!currentEval && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-slate-400">Answer mode:</span>
                {(["text", "voice"] as InputMode[]).map((mode) => (
                  <button key={mode} onClick={() => setInputMode(mode)} className={cnModeToggle(inputMode === mode)}>
                    {mode === "voice" ? <Mic className="h-3.5 w-3.5" /> : <MessageSquare className="h-3.5 w-3.5" />}
                    <span className="capitalize">{mode}</span>
                  </button>
                ))}
              </div>

              {inputMode === "text" ? (
                <textarea
                  rows={6}
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4 text-sm leading-relaxed text-white placeholder:text-slate-500 focus:border-cyan-500/60 focus:outline-none"
                />
              ) : (
                <div className="rounded-[1.5rem] border border-white/8 p-5 glass-card">
                  {isListening && (
                    <div className="mb-4 flex items-center justify-center gap-1.5 py-2">
                      {[1, 2, 3, 4, 5].map((item) => (
                        <div key={item} className="voice-bar h-6 w-1.5 rounded-full bg-violet-400" />
                      ))}
                    </div>
                  )}

                  {answer ? (
                    <p className="min-h-[84px] text-sm leading-relaxed text-slate-300">{answer}</p>
                  ) : (
                    <p className="flex min-h-[84px] items-center justify-center text-center text-sm text-slate-500">
                      Start speaking and your answer will appear here.
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <button onClick={isListening ? stopListening : startListening} className={cnVoiceButton(isListening)}>
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      {isListening ? "Stop" : "Start Speaking"}
                    </button>

                    {answer && (
                      <button
                        onClick={() => {
                          setAnswer("");
                          resetTranscript();
                          setTranscript("");
                        }}
                        className="rounded-2xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={handleSubmitAnswer}
                  disabled={evaluating || !answer.trim()}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 py-3.5 font-semibold text-white transition-all hover:from-violet-500 hover:to-cyan-500 disabled:opacity-50"
                >
                  {evaluating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Submit Answer
                </button>

                <button
                  onClick={handleSkipQuestion}
                  disabled={evaluating}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 py-3.5 text-slate-300 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50"
                >
                  <SkipForward className="h-4 w-4" />
                  Skip Question
                </button>
              </div>
            </motion.div>
          )}

          {currentEval && (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="rounded-[1.75rem] border border-white/8 p-5 glass-card">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="font-display text-lg font-semibold text-white">AI Feedback</h4>
                  <span className="text-2xl font-display font-bold" style={{ color: getScoreColor(currentEval.score * 10) }}>
                    {currentEval.score}/10
                  </span>
                </div>

                <div className="mb-4 h-2 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${currentEval.score * 10}%` }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: getScoreColor(currentEval.score * 10) }}
                  />
                </div>

                <div className="grid gap-3">
                  <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-4">
                    <p className="mb-1 text-xs uppercase tracking-[0.18em] text-emerald-300/80">Strengths</p>
                    <p className="text-sm leading-relaxed text-slate-300">{currentEval.strengths}</p>
                  </div>

                  <div className="rounded-2xl border border-rose-500/15 bg-rose-500/5 p-4">
                    <p className="mb-1 text-xs uppercase tracking-[0.18em] text-rose-300/80">Areas to improve</p>
                    <p className="text-sm leading-relaxed text-slate-300">{currentEval.weaknesses}</p>
                  </div>

                  <div className="rounded-2xl border border-violet-500/15 bg-violet-500/5 p-4">
                    <p className="mb-1 text-xs uppercase tracking-[0.18em] text-violet-300/80">Model answer</p>
                    <p className="text-sm leading-relaxed text-slate-300">{currentEval.improvedAnswer}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setQaList((cur) => cur.slice(0, -1));
                    setAnswer("");
                    resetTranscript();
                    setCurrentEval(null);
                  }}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-3.5 text-sm font-medium text-amber-300 transition-all hover:bg-amber-500/20"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Retry
                </button>

                <button
                  onClick={moveToNextQuestion}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 py-3.5 font-semibold text-white transition-all hover:from-violet-500 hover:to-cyan-500"
                >
                  {currentIdx + 1 < questions.length ? (
                    <>Next Question <ChevronRight className="h-4 w-4" /></>
                  ) : (
                    <>View Results <CheckCircle className="h-4 w-4" /></>
                  )}
                </button>
              </div>

            </motion.div>
          )}

        </div>{/* END right column */}
      </div>{/* END grid */}
    </div>
  );
}

export default function InterviewPageClient() {
  return (
    <AppShell title="Interview" requireAuth={false}>
      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
          </div>
        }
      >
        <InterviewContent />
      </Suspense>
    </AppShell>
  );
}

function cnSetupCard(active: boolean) {
  return active
    ? "w-full rounded-3xl border border-violet-500/25 bg-gradient-to-br from-violet-600/15 to-cyan-600/10 p-6 text-left shadow-lg shadow-violet-500/5 transition-all"
    : "w-full rounded-3xl border border-white/8 bg-white/5 p-6 text-left transition-all hover:border-cyan-400/20 hover:bg-white/8";
}

function cnModeToggle(active: boolean) {
  return active
    ? "flex items-center gap-2 rounded-2xl border border-violet-500/25 bg-violet-500/10 px-3 py-2 text-sm text-violet-200"
    : "flex items-center gap-2 rounded-2xl border border-white/10 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white";
}

function cnSpeakerButton(active: boolean) {
  return active
    ? "ml-auto flex h-9 w-9 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300"
    : "ml-auto flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 text-slate-400 transition-colors hover:bg-white/5 hover:text-cyan-300";
}

function cnVoiceButton(active: boolean) {
  return active
    ? "flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-2.5 text-sm text-rose-300"
    : "flex items-center gap-2 rounded-2xl border border-violet-500/30 bg-violet-500/10 px-5 py-2.5 text-sm text-violet-200";
}
