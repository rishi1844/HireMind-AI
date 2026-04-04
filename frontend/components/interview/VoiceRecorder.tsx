"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, RotateCcw } from "lucide-react";

interface VoiceRecorderProps {
  isListening: boolean;
  transcript: string;
  onStart: () => void;
  onStop: () => void;
  onClear: () => void;
  error?: string | null;
}

export function VoiceRecorder({
  isListening,
  transcript,
  onStart,
  onStop,
  onClear,
  error,
}: VoiceRecorderProps) {
  return (
    <div className="glass-card rounded-2xl p-5 border border-white/6 space-y-4">
      {/* Wave bars */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-center gap-1.5 py-3"
          >
            {Array.from({ length: 7 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-1.5 bg-violet-400 rounded-full"
                animate={{ height: [8, 28, 8] }}
                transition={{
                  repeat: Infinity,
                  duration: 0.6,
                  delay: i * 0.08,
                  ease: "easeInOut",
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transcript display */}
      <div className="min-h-[100px] flex items-start">
        {transcript ? (
          <p className="text-slate-200 text-sm leading-relaxed">{transcript}</p>
        ) : (
          <p className="text-slate-500 text-sm italic m-auto text-center w-full">
            {isListening ? "Listening… speak now" : "Press the mic button to start speaking"}
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={isListening ? onStop : onStart}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all
            ${isListening
              ? "bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30"
              : "bg-violet-500/20 border border-violet-500/40 text-violet-300 hover:bg-violet-500/30"
            }`}
        >
          {isListening ? (
            <><MicOff className="w-4 h-4" /> Stop</>
          ) : (
            <><Mic className="w-4 h-4" /> {transcript ? "Continue" : "Start"}</>
          )}
        </motion.button>

        {transcript && (
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10
                       text-slate-400 hover:text-white hover:bg-white/5 text-sm transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Clear
          </button>
        )}

        {isListening && (
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="ml-auto text-xs text-rose-400 font-medium flex items-center gap-1.5"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            LIVE
          </motion.span>
        )}
      </div>

      {error && (
        <p className="text-rose-400 text-xs px-1">{error}</p>
      )}
    </div>
  );
}
