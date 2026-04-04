"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
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
  UploadCloud,
  Volume2,
  VolumeX,
} from "lucide-react";
import toast from "react-hot-toast";
import { AppShell } from "@/components/layout/AppShell";
import { ResumeDropzone } from "@/components/resume/ResumeDropzone";
import { useSpeechToText, useTextToSpeech } from "@/hooks/useSpeech";
import { useAuthStore } from "@/lib/store";
import { getScoreColor } from "@/lib/utils";
import { interviewService, resumeService } from "@/services/api";

type Phase = "setup" | "interview" | "complete";
type InputMode = "text" | "voice";
type SetupMode = "resume" | "manual" | null;

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

function InterviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();

  const initialResumeIdParam = searchParams.get("resumeId");
  const initialResumeId = initialResumeIdParam ? Number(initialResumeIdParam) : undefined;

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

  const { isListening, transcript, startListening, stopListening, resetTranscript, setTranscript } = useSpeechToText();
  const { isSpeaking, speak, stop: stopSpeech } = useTextToSpeech();

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

  const resetStepState = () => {
    setAnswer("");
    resetTranscript();
    setCurrentEval(null);
    if (isListening) {
      stopListening();
    }
    if (isSpeaking) {
      stopSpeech();
    }
  };

  const moveToNextQuestion = () => {
    if (currentIdx + 1 >= questions.length) {
      resetStepState();
      setPhase("complete");
      return;
    }

    resetStepState();
    setCurrentIdx((index) => index + 1);
  };

  const buildManualPayload = () => ({
    name: manualForm.name.trim() || user?.name || undefined,
    skills: manualForm.skills.trim() || undefined,
    description: manualForm.description.trim() || undefined,
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
    const payload =
      setupMode === "resume"
        ? {
            resumeId: activeResumeId,
            name: user?.name || manualForm.name.trim() || undefined,
            count,
          }
        : {
            ...buildManualPayload(),
            count,
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
        count: 8,
      });

      setQuestions(data.questions);
      setCurrentIdx(0);
      setQaList([]);
      resetStepState();
      setPhase("interview");
      toast.success("Resume interview is ready.");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to prepare resume interview");
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = async () => {
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
      const { data } = await interviewService.evaluateAnswer({
        question: currentQuestion.question,
        answer: answer.trim(),
        resumeContext: buildEvaluationContext(),
      });

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
      toast.error(error.response?.data?.message || "Failed to evaluate answer");
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

  const handleSaveSession = async () => {
    setSaving(true);
    try {
      await interviewService.saveSession({
        resumeId: setupMode === "resume" ? activeResumeId : undefined,
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
    setManualForm({
      name: user?.name || "",
      skills: "",
      description: "",
    });
    resetStepState();
  };

  const typeStyles: Record<string, string> = {
    TECHNICAL: "border-cyan-500/25 bg-cyan-500/10 text-cyan-300",
    PROJECT: "border-violet-500/25 bg-violet-500/10 text-violet-300",
    HR: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  };

  if (phase === "setup") {
    return (
      <div className="mx-auto max-w-4xl space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="mb-2 text-3xl font-display font-bold text-white">
            Smart <span className="text-gradient">Interview</span> Session
          </h2>
          <p className="max-w-2xl text-slate-400">
            Choose one clean starting point. Either interview from your resume or generate questions from a compact
            manual profile.
          </p>
        </motion.div>

        <div className="grid gap-5 lg:grid-cols-2">
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setSetupMode("resume")}
            className={cnSetupCard(setupMode === "resume")}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
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
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-lg font-display font-semibold text-white">Manual Input Interview</p>
                <p className="mt-1 text-sm text-slate-400">
                  Add only your name, skills, and a short description. The model uses that combined input to tailor
                  the interview.
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
                      Upload your PDF once. The app will create resume-aware interview questions and preserve the
                      session in history.
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
              Start Resume-Based Interview
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Start Manual Interview
            </>
          )}
        </motion.button>
      </div>
    );
  }

  if (phase === "complete") {
    const answeredCount = qaList.filter((item) => !item.skipped && item.answer.trim()).length;
    const skippedCount = qaList.filter((item) => item.skipped).length;

    return (
      <div className="mx-auto max-w-4xl space-y-6">
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
    <div className="mx-auto max-w-3xl space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="mb-2 flex items-center justify-between text-sm text-slate-400">
          <span>
            Question {currentIdx + 1} of {questions.length}
          </span>
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
              onClick={() => (isSpeaking ? stopSpeech() : speak(currentQuestion.question))}
              className={cnSpeakerButton(isSpeaking)}
            >
              {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
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
              className="w-full rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4 text-sm leading-relaxed text-white placeholder:text-slate-500 focus:border-violet-500/60 focus:outline-none"
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

          <button
            onClick={moveToNextQuestion}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 py-3.5 font-semibold text-white transition-all hover:from-violet-500 hover:to-cyan-500"
          >
            {currentIdx + 1 < questions.length ? (
              <>
                Next Question
                <ChevronRight className="h-4 w-4" />
              </>
            ) : (
              <>
                View Results
                <CheckCircle className="h-4 w-4" />
              </>
            )}
          </button>
        </motion.div>
      )}
    </div>
  );

  function buildSessionTitle() {
    const displayName = manualForm.name.trim() || user?.name || "Candidate";
    const suffix = new Date().toLocaleDateString();

    if (setupMode === "resume") {
      return `${displayName} resume interview - ${suffix}`;
    }

    return `${displayName} manual interview - ${suffix}`;
  }
}

export default function InterviewPage() {
  return (
    <AppShell title="Interview">
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
    ? "rounded-[1.75rem] border border-violet-500/25 bg-gradient-to-br from-violet-600/15 to-cyan-600/10 p-6 text-left shadow-lg shadow-violet-500/5 transition-all"
    : "rounded-[1.75rem] border border-white/8 bg-white/5 p-6 text-left transition-all hover:border-cyan-400/20 hover:bg-white/8";
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
