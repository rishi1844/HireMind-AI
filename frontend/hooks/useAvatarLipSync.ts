"use client";
import { useState, useCallback, useRef } from "react";

// Oculus Viseme names — RPM avatar ke morph targets
export type VisemeName =
  | "viseme_sil"
  | "viseme_PP"
  | "viseme_FF"
  | "viseme_TH"
  | "viseme_DD"
  | "viseme_kk"
  | "viseme_CH"
  | "viseme_SS"
  | "viseme_nn"
  | "viseme_RR"
  | "viseme_aa"
  | "viseme_E"
  | "viseme_I"
  | "viseme_O"
  | "viseme_U";

// Character → Viseme mapping (English + Hindi phonemes)
const CHAR_TO_VISEME: Record<string, VisemeName> = {
  a: "viseme_aa", e: "viseme_E", i: "viseme_I", o: "viseme_O", u: "viseme_U",
  p: "viseme_PP", b: "viseme_PP", m: "viseme_PP",
  f: "viseme_FF", v: "viseme_FF",
  t: "viseme_TH", d: "viseme_DD",
  s: "viseme_SS", z: "viseme_SS",
  n: "viseme_nn", l: "viseme_nn",
  r: "viseme_RR",
  k: "viseme_kk", g: "viseme_kk", c: "viseme_kk", q: "viseme_kk", x: "viseme_kk",
  h: "viseme_CH", j: "viseme_CH",
  w: "viseme_U", y: "viseme_I",
  // Hindi Devanagari vowels
  "अ": "viseme_aa", "आ": "viseme_aa", "इ": "viseme_I", "ई": "viseme_I",
  "उ": "viseme_U", "ऊ": "viseme_U", "ए": "viseme_E", "ओ": "viseme_O",
  "क": "viseme_kk", "ग": "viseme_kk",
  "म": "viseme_PP", "ब": "viseme_PP", "प": "viseme_PP",
  "न": "viseme_nn", "ल": "viseme_nn",
  "र": "viseme_RR",
  "स": "viseme_SS", "श": "viseme_SS",
};

function getVisemeForWord(word: string): VisemeName {
  if (!word || word.length === 0) return "viseme_sil";
  const ch = word[0];
  const lower = ch.toLowerCase();

  // Digraph check
  if (word.length >= 2) {
    const d2 = word.substring(0, 2).toLowerCase();
    if (d2 === "th") return "viseme_TH";
    if (d2 === "sh" || d2 === "ch") return "viseme_CH";
    if (d2 === "wh") return "viseme_U";
  }

  return CHAR_TO_VISEME[ch] ?? CHAR_TO_VISEME[lower] ?? "viseme_aa";
}

export interface AvatarLipSyncReturn {
  isSpeaking: boolean;
  activeViseme: VisemeName;
  triggerSpeak: (text: string) => void;
  stopSpeaking: () => void;
}

export function useAvatarLipSync(): AvatarLipSyncReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeViseme, setActiveViseme] = useState<VisemeName>("viseme_sil");

  // Refs to hold all pending timers — saare timers ek jagah manage karo
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const boundaryFired = useRef(false); // track if onboundary events fired

  const clearAll = () => {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    clearAll();
    setIsSpeaking(false);
    setActiveViseme("viseme_sil");
  }, []);

  const triggerSpeak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    clearAll();
    boundaryFired.current = false;
    setIsSpeaking(false);
    setActiveViseme("viseme_sil");

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hi-IN";
    utterance.rate = 0.85;
    utterance.pitch = 1.05;
    utterance.volume = 1.0;

    // ── Voice selection: Hindi preferred → English fallback ──────────────
    const applyVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;

      const hindi = voices.find((v) => v.lang === "hi-IN" || v.lang.startsWith("hi"));
      const englishFemale = voices.find((v) =>
        v.lang.startsWith("en") &&
        (v.name.includes("Zira") || v.name.includes("Samantha") ||
         v.name.includes("Google UK English Female") ||
         v.name.toLowerCase().includes("female"))
      );
      const englishAny = voices.find((v) => v.lang.startsWith("en"));

      if (hindi) {
        utterance.voice = hindi;
      } else if (englishFemale) {
        utterance.voice = englishFemale;
        utterance.lang = "en-US";
      } else if (englishAny) {
        utterance.voice = englishAny;
        utterance.lang = "en-US";
      }
    };
    applyVoice();
    if (!window.speechSynthesis.getVoices().length) {
      window.speechSynthesis.onvoiceschanged = applyVoice;
    }

    // ── Timer-based lip sync: scheduled per word regardless of browser ───
    // Yeh Chrome ke onboundary events ke bina bhi kaam karta hai
    const words = text.trim().split(/\s+/).filter(Boolean);
    // Average: ~140 wpm @ rate 0.85 → ~430ms per word
    const MS_PER_WORD = Math.round((60000 / 140) / utterance.rate);

    const scheduleTimerLipSync = (startDelay: number) => {
      words.forEach((word, idx) => {
        const onset = startDelay + idx * MS_PER_WORD;
        const viseme = getVisemeForWord(word);

        const t1 = setTimeout(() => setActiveViseme(viseme), onset);
        const t2 = setTimeout(() => setActiveViseme("viseme_sil"), onset + MS_PER_WORD * 0.65);
        timerRefs.current.push(t1, t2);
      });
    };

    // ── Speech events ────────────────────────────────────────────────────
    utterance.onstart = () => {
      setIsSpeaking(true);
      // Start timer-based sync immediately (fallback — works everywhere)
      scheduleTimerLipSync(0);
    };

    // onboundary fires in Chrome/Edge — overrides the timer sync with precise timing
    utterance.onboundary = (event) => {
      if (event.name !== "word") return;
      if (!boundaryFired.current) {
        // Boundary events ARE working — clear timer sync to avoid double animation
        boundaryFired.current = true;
        clearAll();
        setIsSpeaking(true);
      }
      const word = text.substring(event.charIndex, event.charIndex + (event.charLength ?? 4));
      setActiveViseme(getVisemeForWord(word));

      const t = setTimeout(() => setActiveViseme("viseme_sil"), 130);
      timerRefs.current.push(t);
    };

    utterance.onend = () => {
      clearAll();
      setIsSpeaking(false);
      setActiveViseme("viseme_sil");
    };

    utterance.onerror = () => {
      clearAll();
      setIsSpeaking(false);
      setActiveViseme("viseme_sil");
    };

    // Small delay — browser voice list load hone ka time deta hai
    const startTimer = setTimeout(() => {
      applyVoice();
      window.speechSynthesis.speak(utterance);
    }, 180);
    timerRefs.current.push(startTimer);
  }, []);

  return { isSpeaking, activeViseme, triggerSpeak, stopSpeaking };
}
