"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { VisemeName } from "@/hooks/useAvatarLipSync";

// ── LED-style mouth shapes — centered at X=100 (same as face center) ─────────
const MOUTH: Record<string, string> = {
  sil: "M 78,103 C 90,102 110,102 122,103 C 110,104 90,104 78,103 Z",
  PP: "M 78,103 C 90,101 110,101 122,103 C 110,105 90,105 78,103 Z",
  FF: "M 79,102 C 91,99  109,99  121,102 C 109,106 91,106 79,102 Z",
  TH: "M 79,101 C 91,98  109,98  121,101 C 109,107 91,107 79,101 Z",
  DD: "M 79,101 C 91,97  109,97  121,101 C 109,108 91,108 79,101 Z",
  kk: "M 80,100 C 92,95  108,95  120,100 C 108,110 92,110 80,100 Z",
  CH: "M 80,100 C 92,94  108,94  120,100 C 108,111 92,111 80,100 Z",
  SS: "M 79,101 C 91,98  109,98  121,101 C 109,107 91,107 79,101 Z",
  nn: "M 79,102 C 91,99  109,99  121,102 C 109,106 91,106 79,102 Z",
  RR: "M 79,101 C 91,97  109,97  121,101 C 109,108 91,108 79,101 Z",
  aa: "M 80,99  C 92,92  108,92  120,99  C 108,113 92,113 80,99  Z",
  E: "M 75,101 C 89,96  111,96  125,101 C 111,112 89,112 75,101 Z",
  I: "M 76,101 C 90,97  110,97  124,101 C 110,111 90,111 76,101 Z",
  O: "M 83,98  C 93,91  107,91  117,98  C 107,114 93,114 83,98  Z",
  U: "M 85,99  C 94,93  106,93  115,99  C 106,112 94,112 85,99  Z",
};

const OPEN = new Set(["viseme_aa", "viseme_E", "viseme_I", "viseme_O", "viseme_U", "viseme_kk", "viseme_CH", "viseme_DD"]);

function getMouth(v: VisemeName) {
  return MOUTH[v.replace("viseme_", "")] ?? MOUTH.sil;
}

// ── Robot SVG ─────────────────────────────────────────────────────────────────
function RobotSVG({ isSpeaking, activeViseme }: { isSpeaking: boolean; activeViseme: VisemeName }) {
  const [blink, setBlink] = useState(false);
  const blinkRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const go = () => {
      blinkRef.current = setTimeout(() => {
        setBlink(true);
        setTimeout(() => { setBlink(false); go(); }, 110);
      }, 3000 + Math.random() * 3000);
    };
    go();
    return () => { if (blinkRef.current) clearTimeout(blinkRef.current); };
  }, []);

  const mouth = getMouth(activeViseme);
  const isOpen = OPEN.has(activeViseme);
  const eyeSY = blink ? 0.04 : 1;

  return (
    <motion.svg viewBox="0 0 200 230" className="w-full h-full"
      animate={{ y: isSpeaking ? [0, -3, 0] : [0, -1.5, 0] }}
      transition={{ duration: isSpeaking ? 0.7 : 4, repeat: Infinity, ease: "easeInOut" }}>
      <defs>
        {/* Robot body white */}
        <linearGradient id="rb" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#e8f0ff" />
          <stop offset="50%" stopColor="#d0ddf5" />
          <stop offset="100%" stopColor="#b8cae8" />
        </linearGradient>
        {/* Blue accent */}
        <linearGradient id="ba" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4a9ff5" />
          <stop offset="100%" stopColor="#2270e0" />
        </linearGradient>
        {/* Screen black */}
        <linearGradient id="sc" x1="0%" y1="0%" x2="30%" y2="100%">
          <stop offset="0%" stopColor="#080e20" />
          <stop offset="100%" stopColor="#04080f" />
        </linearGradient>
        {/* Metal side panels */}
        <linearGradient id="ml" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#c0ccde" />
          <stop offset="50%" stopColor="#e8eeff" />
          <stop offset="100%" stopColor="#a8b8d0" />
        </linearGradient>
        {/* Torso */}
        <linearGradient id="tr" x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor="#dce8ff" />
          <stop offset="100%" stopColor="#b0c4e8" />
        </linearGradient>
        {/* Cyan glow filter */}
        <filter id="cg" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        {/* Eye glow */}
        <filter id="eg" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        {/* Mouth glow */}
        <filter id="mg" x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* ── ANTENNAS ─────────────────────────────────────────────────── */}
      <line x1="78" y1="40" x2="68" y2="12" stroke="#4a9ff5" strokeWidth="3.5" strokeLinecap="round" />
      <motion.circle cx="68" cy="9" r="6" fill="#22d3ee"
        animate={{ opacity: isSpeaking ? [0.7, 1, 0.7] : [0.5, 0.8, 0.5], r: isSpeaking ? [6, 7, 6] : [5, 6, 5] }}
        transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        filter="url(#cg)" />
      <line x1="122" y1="40" x2="132" y2="12" stroke="#4a9ff5" strokeWidth="3.5" strokeLinecap="round" />
      <motion.circle cx="132" cy="9" r="6" fill="#22d3ee"
        animate={{ opacity: isSpeaking ? [1, 0.7, 1] : [0.8, 0.5, 0.8], r: isSpeaking ? [7, 6, 7] : [6, 5, 6] }}
        transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        filter="url(#cg)" />

      {/* ── ROBOT HEAD ───────────────────────────────────────────────── */}
      {/* Head shadow */}
      <rect x="49" y="43" width="102" height="90" rx="22" fill="#0a1428" fillOpacity="0.25" />
      {/* Main head */}
      <rect x="47" y="40" width="106" height="90" rx="22" fill="url(#rb)" />
      {/* Head top highlight */}
      <rect x="55" y="42" width="80" height="20" rx="12" fill="white" fillOpacity="0.4" />

      {/* Side ear panels */}
      <rect x="32" y="56" width="16" height="42" rx="8" fill="url(#ml)" />
      <rect x="152" y="56" width="16" height="42" rx="8" fill="url(#ml)" />
      {/* Blue ear accents */}
      <rect x="34" y="70" width="12" height="16" rx="4" fill="url(#ba)" />
      <rect x="154" y="70" width="12" height="16" rx="4" fill="url(#ba)" />
      {/* Blue accent stripe on head */}
      <rect x="47" y="115" width="106" height="15" rx="0" fill="url(#ba)" />
      <rect x="47" y="115" width="106" height="15" rx="0" fill="url(#ba)" />

      {/* ── FACE SCREEN ──────────────────────────────────────────────── */}
      <rect x="58" y="50" width="84" height="68" rx="12" fill="url(#sc)" />
      {/* Screen inner glow edge */}
      <rect x="58" y="50" width="84" height="68" rx="12" fill="none"
        stroke="#22d3ee" strokeWidth="1" strokeOpacity={isSpeaking ? "0.6" : "0.25"} />
      {/* Screen scanlines */}
      {[60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110].map(y => (
        <line key={y} x1="59" y1={y} x2="141" y2={y} stroke="#22d3ee" strokeWidth="0.3" strokeOpacity="0.06" />
      ))}

      {/* ── EYES (LED oval) ──────────────────────────────────────────── */}
      {/* Eye glow backdrop */}
      {([82, 118] as number[]).map(cx => (
        <motion.ellipse key={cx} cx={cx} cy={76} rx={13} ry={15}
          fill="#22d3ee" fillOpacity="0.15"
          animate={{ fillOpacity: isSpeaking ? [0.15, 0.3, 0.15] : 0.12 }}
          transition={{ duration: 0.8, repeat: Infinity }} />
      ))}
      {/* Eye main */}
      {([82, 118] as number[]).map(cx => (
        <motion.ellipse key={cx} cx={cx} cy={76} rx={11} ry={13}
          fill="#22d3ee"
          animate={{ scaleY: eyeSY, opacity: isSpeaking ? [0.85, 1, 0.85] : 0.9 }}
          style={{ transformOrigin: `${cx}px 76px` }}
          transition={{ duration: eyeSY === 0.04 ? 0.1 : 0.9, repeat: Infinity }}
          filter="url(#eg)" />
      ))}
      {/* Eye inner dark pupil */}
      {([82, 118] as number[]).map(cx => (
        <motion.ellipse key={cx} cx={cx} cy={78} rx={5} ry={6}
          fill="#0a1830"
          animate={{ scaleY: eyeSY }}
          style={{ transformOrigin: `${cx}px 78px` }}
          transition={{ duration: 0.1 }} />
      ))}
      {/* Eye glint */}
      {([[85, 72], [121, 72]] as number[][]).map(([cx, cy]) => (
        <motion.circle key={cx} cx={cx} cy={cy} r={2.5}
          fill="white" fillOpacity={0.7}
          animate={{ scaleY: eyeSY, opacity: blink ? 0 : 0.7 }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
          transition={{ duration: 0.1 }} />
      ))}

      {/* ── MOUTH (LED display animated) ─────────────────────────────── */}
      {/* Inner mouth glow when open — centered at X=100 */}
      <motion.ellipse cx="100" cy="103" rx="20" ry="10"
        fill="#001810"
        animate={{ ry: isOpen ? 10 : 2, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.08 }} />

      {/* Mouth glow backdrop — centered */}
      <motion.path d={mouth} fill="#22d3ee" fillOpacity="0.2"
        animate={{ d: mouth }}
        transition={{ duration: 0.08 }} />

      {/* Main mouth LED */}
      <motion.path d={mouth} fill="#22d3ee"
        animate={{ d: mouth, fillOpacity: isSpeaking ? [0.85, 1, 0.85] : 0.8 }}
        transition={{ duration: 0.08, ease: "easeOut", opacity: { duration: 0.5, repeat: Infinity } }}
        filter="url(#mg)" />

      {/* ── NECK ─────────────────────────────────────────────────────── */}
      <rect x="84" y="130" width="32" height="16" rx="6" fill="url(#ml)" />
      <rect x="88" y="132" width="24" height="12" rx="4" fill="url(#ba)" fillOpacity="0.4" />

      {/* ── TORSO ────────────────────────────────────────────────────── */}
      <rect x="44" y="146" width="112" height="72" rx="18" fill="url(#tr)" />
      {/* Torso highlight */}
      <rect x="52" y="148" width="80" height="18" rx="10" fill="white" fillOpacity="0.3" />
      {/* Blue chest panel */}
      <rect x="68" y="162" width="64" height="42" rx="12" fill="url(#ba)" fillOpacity="0.85" />
      <rect x="72" y="166" width="56" height="34" rx="9" fill="#0a1830" fillOpacity="0.6" />
      {/* Chest LED indicators */}
      {isSpeaking ? (
        <>
          {[80, 90, 100, 110, 120].map((cx, i) => (
            <motion.circle key={cx} cx={cx} cy={183} r={3}
              fill="#22d3ee"
              animate={{ opacity: [0.4, 1, 0.4], r: [2.5, 3.5, 2.5] }}
              transition={{ duration: 0.4, delay: i * 0.08, repeat: Infinity }}
              filter="url(#cg)" />
          ))}
        </>
      ) : (
        <>
          {[80, 90, 100, 110, 120].map(cx => (
            <circle key={cx} cx={cx} cy={183} r={2.5} fill="#22d3ee" fillOpacity="0.3" />
          ))}
        </>
      )}
      {/* Blue torso stripes */}
      <rect x="44" y="200" width="112" height="10" rx="5" fill="url(#ba)" fillOpacity="0.6" />

      {/* ── ARMS ─────────────────────────────────────────────────────── */}
      {/* Left arm */}
      <rect x="20" y="150" width="22" height="55" rx="11" fill="url(#tr)" />
      <rect x="20" y="150" width="22" height="20" rx="11" fill="url(#ba)" fillOpacity="0.5" />
      <rect x="20" y="195" width="22" height="12" rx="6" fill="url(#ba)" fillOpacity="0.5" />
      {/* Right arm */}
      <rect x="158" y="150" width="22" height="55" rx="11" fill="url(#tr)" />
      <rect x="158" y="150" width="22" height="20" rx="11" fill="url(#ba)" fillOpacity="0.5" />
      <rect x="158" y="195" width="22" height="12" rx="6" fill="url(#ba)" fillOpacity="0.5" />

      {/* Microphone removed */}
    </motion.svg>
  );
}

// ── Wave bars ─────────────────────────────────────────────────────────────────
function WaveBars({ active }: { active: boolean }) {
  return (
    <div className="flex items-end gap-[3px] h-5">
      {[0.4, 0.75, 1.0, 0.8, 1.0, 0.7, 0.4].map((h, i) => (
        <motion.div key={i} className="w-[3px] rounded-full"
          style={{ background: active ? "#22d3ee" : "#1e293b" }}
          animate={{ height: active ? `${h * 20}px` : "3px", opacity: active ? 0.9 : 0.3 }}
          transition={{
            duration: 0.2, delay: i * 0.05, ease: "easeInOut",
            repeat: active ? Infinity : 0, repeatType: "reverse"
          }} />
      ))}
    </div>
  );
}

// ── Public component ───────────────────────────────────────────────────────────
export interface AvatarInterviewerProps {
  isSpeaking: boolean;
  activeViseme: VisemeName;
  onManualSpeak?: () => void;
  className?: string;
}

export function AvatarInterviewer({ isSpeaking, activeViseme, onManualSpeak, className = "" }: AvatarInterviewerProps) {
  return (
    <div className={`flex flex-col items-center gap-4 bg-transparent ${className}`}>
      {/* Robot avatar */}
      <motion.div className="relative w-full max-w-[260px]"
        style={{ aspectRatio: "200/230" }}
        animate={{
          filter: isSpeaking
            ? "drop-shadow(0 0 24px rgba(34,211,238,0.4))"
            : "drop-shadow(0 0 8px rgba(34,211,238,0.1))"
        }}
        transition={{ duration: 0.6 }}>
        <RobotSVG isSpeaking={isSpeaking} activeViseme={activeViseme} />
      </motion.div>

      {/* Status bar */}
      <div className="flex items-center justify-between w-full max-w-[260px] rounded-full border border-white/10 bg-black/40 px-5 py-2.5 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            {isSpeaking && <span className="absolute h-full w-full animate-ping rounded-full bg-cyan-400 opacity-70" />}
            <span className="relative h-2 w-2 rounded-full transition-colors duration-500"
              style={{ backgroundColor: isSpeaking ? "#22d3ee" : "#334155" }} />
          </span>
          <motion.span className="text-xs font-medium"
            animate={{ color: isSpeaking ? "#a5f3fc" : "#94a3b8" }}
            transition={{ duration: 0.4 }}>
            {isSpeaking ? "Speaking…" : "Vita AI Bot • Ready"}
          </motion.span>
        </div>
        <div className="flex items-center gap-2.5">
          <WaveBars active={isSpeaking} />
          {onManualSpeak && !isSpeaking && (
            <button onClick={onManualSpeak}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-slate-500 hover:border-cyan-500/40 hover:bg-cyan-500/10 hover:text-cyan-400 transition-all">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}