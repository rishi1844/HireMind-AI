"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

// ── Constants ─────────────────────────────────────────────────────────────────
const VIDEO_URL = "/video/female-ai.mp4";
const IDLE_LIMIT = 1.0; // The timestamp in seconds where the mouth starts moving/speaking

// ── Loading overlay ──────────────────────────────────────────────────────────
function LoadingOverlay() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 rounded-2xl">
      {/* Animated logo/spinner */}
      <div className="relative mb-6">
        <div className="h-20 w-20 rounded-full border-2 border-cyan-500/20 border-t-cyan-500 animate-spin" />
        <div
          className="absolute inset-0 h-20 w-20 rounded-full border-2 border-violet-500/10 border-b-violet-500 animate-spin"
          style={{ animationDirection: "reverse", animationDuration: "1.8s" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-cyan-400 text-lg font-bold">AI</span>
        </div>
      </div>

      <p className="text-sm font-semibold text-white mb-1">
        Loading Recruiter Video…
      </p>
      <p className="text-xs text-slate-500">
        Initializing Zoom interview interface
      </p>
    </div>
  );
}

// ── AvatarViewer (Video Recruiter with Speech Loop-Sync) ─────────────────────────
const AvatarViewer = forwardRef(function AvatarViewer(
  { onReady, onSpeakStart, onSpeakEnd, audioContext, className = "" },
  ref
) {
  const videoRef = useRef(null);
  const localAudioRef = useRef(null);  // Local fallback AudioContext
  const audioRef = audioContext ? { current: audioContext } : localAudioRef;
  const activeSourceRef = useRef(null); // Keep reference to active AudioBufferSourceNode
  const [status, setStatusState] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const statusRef = useRef("loading");
  const setStatus = (newStatus) => {
    statusRef.current = newStatus;
    setStatusState(newStatus);
  };

  // Refs for parent callbacks to prevent recreation loops from re-running effects
  const onReadyRef = useRef(onReady);
  const onSpeakStartRef = useRef(onSpeakStart);
  const onSpeakEndRef = useRef(onSpeakEnd);

  useEffect(() => {
    onReadyRef.current = onReady;
    onSpeakStartRef.current = onSpeakStart;
    onSpeakEndRef.current = onSpeakEnd;
  }); // Keep refs in sync with incoming props without re-triggering effects

  // ── Time Update Sync: Looping logic ─────────────────────────────────────────
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    const currentStatus = statusRef.current;

    if (currentStatus === "speaking") {
      // Speaking: Loop the speaking part of the video [IDLE_LIMIT, video.duration]
      if (video.currentTime >= video.duration - 0.1) {
        video.currentTime = IDLE_LIMIT;
      }
    } else {
      // Idle / thinking / listening:
      // If the video plays beyond IDLE_LIMIT when not speaking, immediately reset it to 0.0 and pause it!
      // This prevents any browser autoplays or accidental plays during idle periods.
      if (video.currentTime >= IDLE_LIMIT) {
        video.currentTime = 0.0;
        video.pause();
      }
    }
  };


  // ── Imperative API ───────────────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    /** Resumes AudioContext — call from within a user-gesture handler */
    async resumeAudio() {
      const ctx = audioRef.current;
      if (ctx && ctx.state === "suspended") {
        console.log("[AvatarViewer] Resuming AudioContext…");
        await ctx.resume();
      }
    },

    /**
     * startSpeaking()
     * Seeks the video to the speaking segment and starts playing it immediately.
     * Fire this BEFORE the TTS network fetch so the avatar begins moving with
     * zero perceived delay. Resolves once the video is confirmed playing.
     */
    async startSpeaking() {
      // Kill any in-flight audio from a previous question
      if (activeSourceRef.current) {
        try { activeSourceRef.current.stop(); } catch (_) {}
        activeSourceRef.current = null;
      }

      const video = videoRef.current;
      if (!video) return;

      // Pause during seek so idle frames don't leak through
      video.pause();

      // Resume AudioContext if the browser suspended it after inactivity
      const ctx = audioRef.current;
      if (ctx && ctx.state === "suspended") {
        try { await ctx.resume(); } catch (_) {}
      }

      // ⚠️  Mark as "speaking" BEFORE setting currentTime.
      // video.currentTime fires a timeupdate event synchronously, BEFORE the seeked event.
      // If statusRef is still "ready" when that timeupdate fires, handleTimeUpdate will
      // see currentTime >= IDLE_LIMIT and immediately reset to 0 — wiping our seek.
      setStatus("speaking");
      onSpeakStartRef.current?.();

      // Now seek — handleTimeUpdate will see "speaking" and use the loop path, not reset
      await new Promise((resolve) => {
        const onSeeked = () => {
          video.removeEventListener("seeked", onSeeked);
          resolve();
        };
        video.addEventListener("seeked", onSeeked);
        video.currentTime = IDLE_LIMIT;
        // Safety: some browsers delay seeked on very short seeks
        setTimeout(resolve, 150);
      });

      video.play().catch((e) => console.warn("[AvatarViewer] Video play blocked:", e));
    },

    /**
     * attachAudio(audioBase64)
     * Decodes a base64-encoded MP3 and starts playing it over the already-running
     * speaking video loop. Returns a Promise that resolves when audio finishes.
     * Must be called after startSpeaking() so the AudioContext is already live.
     */
    async attachAudio(audioBase64) {
      if (!audioBase64) return;

      const ctx = audioRef.current;
      if (!ctx) {
        console.warn("[AvatarViewer] attachAudio: AudioContext not ready");
        return;
      }

      // Resume if suspended (e.g. first user interaction flow)
      if (ctx.state === "suspended") {
        try { await ctx.resume(); } catch (_) {}
      }

      // Decode base64 → Uint8Array
      const binary = atob(audioBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      let audioBuffer;
      try {
        audioBuffer = await new Promise((resolve, reject) => {
          ctx.decodeAudioData(
            bytes.buffer.slice(0),
            (buf) => resolve(buf),
            (err) => {
              console.error("[AvatarViewer] decodeAudioData error:", err);
              reject(err);
            }
          );
        });
      } catch (err) {
        console.warn("[AvatarViewer] attachAudio decode failed — audio silent:", err);
        return;
      }

      // Create and start the audio source — video is already looping
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      activeSourceRef.current = source;

      source.start(0);

      // Await audio completion
      await new Promise((resolve) => {
        source.onended = () => {
          if (activeSourceRef.current === source) activeSourceRef.current = null;
          resolve();
        };
        // Safety timeout: audio duration + 500ms grace
        setTimeout(() => {
          if (activeSourceRef.current === source) activeSourceRef.current = null;
          resolve();
        }, (audioBuffer.duration + 0.5) * 1000);
      });
    },

    /**
     * speak(text, audioBase64, timepoints)
     * Starts video and audio at the EXACT same moment for perfect A/V sync.
     * Seek and audio decoding run in parallel (Promise.all) to minimise latency.
     * Cleanup (fade + idle) is handled by the caller's finally block via idle().
     */
    async speak(text, audioBase64, timepoints) {
      // Kill any in-flight audio
      if (activeSourceRef.current) {
        try { activeSourceRef.current.stop(); } catch (_) {}
        activeSourceRef.current = null;
      }

      const video = videoRef.current;
      if (video) video.pause();

      const ctx = audioRef.current;
      if (ctx && ctx.state === "suspended") {
        try { await ctx.resume(); } catch (_) {}
      }

      // Mark speaking BEFORE the seek so handleTimeUpdate won't reset currentTime
      setStatus("speaking");

      // ── Run video seek AND audio decode IN PARALLEL ────────────────────────
      // This eliminates the sequential gap where video plays but audio hasn't
      // been decoded yet. Both operations run concurrently; we start playback
      // only once BOTH are ready — guaranteeing frame-perfect A/V sync.
      let audioBuffer = null;
      await Promise.all([
        // ① Seek video to speaking start
        video
          ? new Promise((resolve) => {
              const onSeeked = () => { video.removeEventListener("seeked", onSeeked); resolve(); };
              video.addEventListener("seeked", onSeeked);
              video.currentTime = IDLE_LIMIT;
              setTimeout(resolve, 150); // safety timeout
            })
          : Promise.resolve(),

        // ② Decode MP3 → AudioBuffer while the seek is in flight
        audioBase64 && ctx
          ? (async () => {
              try {
                const binary = atob(audioBase64);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
                
                audioBuffer = await Promise.race([
                  new Promise((resolve, reject) => {
                    ctx.decodeAudioData(
                      bytes.buffer.slice(0),
                      (buf) => resolve(buf),
                      (err) => { console.error("[AvatarViewer] decodeAudioData error:", err); reject(err); }
                    );
                  }),
                  new Promise((_, reject) => setTimeout(() => reject(new Error("Decode timeout")), 1200))
                ]);
              } catch (e) {
                console.warn("[AvatarViewer] Audio decode failed or timed out:", e);
              }
            })()
          : Promise.resolve(),
      ]);

      onSpeakStartRef.current?.();

      // ── Fire video.play() and source.start(0) in the same synchronous tick ──
      if (video) {
        video.play().catch((e) => console.warn("[AvatarViewer] Video play blocked:", e));
      }

      if (audioBuffer && ctx) {
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        activeSourceRef.current = source;
        source.start(0); // starts in same tick as video.play()

        const durationMs = audioBuffer.duration * 1000;
        const minDurationMs = 2800; // Keep avatar speaking for at least 2.8s for smooth visual transition
        const waitMs = Math.max(durationMs, minDurationMs);

        await new Promise((resolve) => {
          let ended = false;
          source.onended = () => {
            ended = true;
            // Delay resolving just enough to hit the 2.8s visual threshold
            setTimeout(resolve, Math.max(0, minDurationMs - durationMs));
          };
          setTimeout(() => {
            if (!ended) {
              if (activeSourceRef.current === source) activeSourceRef.current = null;
              resolve();
            }
          }, waitMs + 500);
        });
      } else {
        // No audio provided or decoding failed — keep video looping for estimated duration
        const durationSec = (text.length * 50) / 1000;
        await new Promise((r) => setTimeout(r, Math.max(durationSec, 2.8) * 1000));
      }
    },

    /** Thinking state — freeze on the idle frame */
    think() {
      if (activeSourceRef.current) {
        try { activeSourceRef.current.stop(); } catch (_) {}
        activeSourceRef.current = null;
      }
      setStatus("thinking");
      const video = videoRef.current;
      if (video) {
        video.pause();
        video.currentTime = 0.0;
      }
    },

    /**
     * idle() — Smooth transition back to the idle poster frame.
     * When coming from "speaking": fades opacity to 0.45, waits 2 animation frames
     * so the browser PAINTS the dimmed frame before video.pause() locks it, then
     * resets currentTime=0 and fades back in. Eliminates the "abrupt freeze" glitch.
     */
    async idle() {
      const wasSpeaking = statusRef.current === "speaking";

      if (wasSpeaking) {
        setIsTransitioning(true);
        // Two rAF passes ensure the 0.45 opacity reaches the GPU compositing layer
        // before we call pause(), so the frozen frame is never visible at full opacity.
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      }

      // Stop audio if still running (e.g. attachAudio safety timeout race)
      if (activeSourceRef.current) {
        try { activeSourceRef.current.stop(); } catch (_) {}
        activeSourceRef.current = null;
      }

      const video = videoRef.current;
      if (video) {
        video.pause();
        video.currentTime = 0.0;
      }
      setStatus("ready");

      if (wasSpeaking) {
        // Fade opacity back to 1.0 after the video has reset to frame 0
        setTimeout(() => setIsTransitioning(false), 200);
        onSpeakEndRef.current?.();
      }
    },

    /** stop() — Immediately halts audio + video (mute / skip button). */
    stop() {
      const wasSpeaking = statusRef.current === "speaking";
      if (activeSourceRef.current) {
        try { activeSourceRef.current.stop(); } catch (_) {}
        activeSourceRef.current = null;
      }
      setStatus("ready");
      const video = videoRef.current;
      if (video) {
        video.pause();
        video.currentTime = 0.0;
      }
      if (wasSpeaking) {
        // Brief fade so the freeze isn't a hard cut
        setIsTransitioning(true);
        setTimeout(() => setIsTransitioning(false), 150);
        onSpeakEndRef.current?.();
      }
    },

    get isSpeaking() { return statusRef.current === "speaking"; },
    get status()     { return statusRef.current; },
  }));

  // ── Init & Robust Video Event Listeners ───────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Eagerly instantiate AudioContext on mount if not provided as prop
    if (!audioContext && !localAudioRef.current) {
      localAudioRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }

    const video = videoRef.current;
    if (!video) return;

    const onLoaded = () => {
      console.log("[AvatarViewer] Video successfully loaded (readyState:", video.readyState, ")");
      if (statusRef.current === "loading") {
        setStatus("ready");
      }
      onReadyRef.current?.();
    };

    const onError = (e) => {
      console.error("[AvatarViewer] Video loading error:", e);
      setErrorMsg("Failed to load recruiter video");
      setStatus("error");
    };

    // Cached media race condition guard
    if (video.readyState >= 2) {
      onLoaded();
    } else {
      video.addEventListener("loadeddata", onLoaded);
      video.addEventListener("canplay", onLoaded);
      video.addEventListener("error", onError);
    }

    return () => {
      video.removeEventListener("loadeddata", onLoaded);
      video.removeEventListener("canplay", onLoaded);
      video.removeEventListener("error", onError);
    };
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* HTML5 Loop Video */}
      <video
        ref={videoRef}
        src={VIDEO_URL}
        muted
        preload="auto"
        playsInline
        onTimeUpdate={handleTimeUpdate}
        className="w-full h-full object-cover rounded-2xl transition-opacity duration-200"
        style={{ 
          display: status === "error" ? "none" : "block",
          opacity: isTransitioning ? 0.45 : 1.0
        }}
      />

      {/* Loading overlay */}
      {status === "loading" && (
        <LoadingOverlay />
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 rounded-2xl p-6 text-center">
          <div className="h-14 w-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
            <svg className="h-7 w-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-red-400 mb-1">Video Failed to Load</p>
          <p className="text-xs text-slate-500 max-w-xs leading-relaxed">{errorMsg}</p>
          <p className="text-[10px] text-slate-600 mt-3">
            Please verify that /public/video/female-ai.mp4 exists in the project public folder.
          </p>
        </div>
      )}

      {/* Speak / Think badge */}
      {(status === "speaking" || status === "thinking") && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
          <div
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium backdrop-blur-md border ${
              status === "speaking"
                ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
                : "bg-violet-500/10 border-violet-500/30 text-violet-300"
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                  status === "speaking" ? "bg-cyan-400" : "bg-violet-400"
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  status === "speaking" ? "bg-cyan-400" : "bg-violet-400"
                }`}
              />
            </span>
            {status === "speaking" ? "Speaking…" : "Thinking…"}
          </div>
        </div>
      )}
    </div>
  );
});

export default AvatarViewer;
