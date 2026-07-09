'use client';
// frontend/components/chatbot/ChatbotWidget.tsx — Vita AI Copilot (Green Wave Theme)
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore, ChatAction, ChatMode } from '@/lib/chatStore';
import { useAuthStore } from '@/lib/store';
import { chatbotService } from '@/services/api';
import ChatWindow from './ChatWindow';
import InputBar from './InputBar';

// ─── Particle Canvas ───────────────────────────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    type Particle = { x: number; y: number; r: number; vx: number; vy: number; alpha: number; color: string };

    const colors = ['#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#a78bfa', '#38bdf8', '#34d399'];
    const particles: Particle[] = Array.from({ length: 38 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.8 + 0.4,
      vx: (Math.random() - 0.5) * 0.22,
      vy: -Math.random() * 0.25 - 0.1,
      alpha: Math.random() * 0.5 + 0.15,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    let animId: number;
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -4) { p.y = canvas.height + 4; p.x = Math.random() * canvas.width; }
        if (p.x < -4) p.x = canvas.width + 4;
        if (p.x > canvas.width + 4) p.x = -4;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="vita-particle-canvas"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
    />
  );
}

// ─── Full-Width Top Wave Banner ───────────────────────────────────────────────
function WaveBanner() {
  return (
    <svg
      className="vita-wave-banner"
      viewBox="0 0 440 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="wg1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.55" />
          <stop offset="35%" stopColor="#0ea5e9" stopOpacity="0.45" />
          <stop offset="65%" stopColor="#10b981" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id="wg2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="wg3" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.22" />
          <stop offset="60%" stopColor="#7c3aed" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      {/* Wave layer 1 */}
      <path
        d="M0 60 C80 20 160 80 240 40 C320 0 380 55 440 35 L440 0 L0 0 Z"
        fill="url(#wg1)"
      />
      {/* Wave layer 2 */}
      <path
        d="M0 70 C70 40 150 85 230 55 C310 25 390 70 440 50 L440 0 L0 0 Z"
        fill="url(#wg2)"
      />
      {/* Wave layer 3 — subtle shimmer */}
      <path
        d="M0 80 C100 50 200 88 300 60 C370 42 420 75 440 65 L440 0 L0 0 Z"
        fill="url(#wg3)"
      />
    </svg>
  );
}

// ─── Service Cards (2×2 Grid) ─────────────────────────────────────────────────
interface ServiceCard {
  icon: string;
  bg: string;
  title: string;
  desc: string;
  href: string;
  cardFrom: string;
  cardTo: string;
}

const SERVICES: ServiceCard[] = [
  {
    icon: '📊',
    bg: 'linear-gradient(135deg, #10b981, #065f46)',
    title: 'Analyze Resume',
    desc: 'ATS score, keyword gaps & improvement tips',
    href: '/resume/analysis',
    cardFrom: '#10b981',
    cardTo: '#065f46',
  },
  {
    icon: '🎙️',
    bg: 'linear-gradient(135deg, #8b5cf6, #4c1d95)',
    title: 'Mock Interview',
    desc: 'Practice real HR questions with AI feedback',
    href: '/resume/review',
    cardFrom: '#8b5cf6',
    cardTo: '#4c1d95',
  },
  {
    icon: '✉️',
    bg: 'linear-gradient(135deg, #0ea5e9, #0c4a6e)',
    title: 'Cover Letter',
    desc: 'Generate a tailored cover letter instantly',
    href: '/cover-letter',
    cardFrom: '#0ea5e9',
    cardTo: '#0c4a6e',
  },
  {
    icon: '🏗️',
    bg: 'linear-gradient(135deg, #f59e0b, #78350f)',
    title: 'Resume Builder',
    desc: 'Build & export your resume with AI assistance',
    href: '/resume/builder',
    cardFrom: '#f59e0b',
    cardTo: '#78350f',
  },
];

// ─── Logged-Out Client-Side FAQ (mirrors server spec, zero API cost) ───────────
const LOGGED_OUT_INTENTS: Array<{ keywords: string[]; reply: string; navLabel: string; navTarget: string }> = [
  { keywords: ['ats', 'analyze', 'analyse', 'check resume', 'resume feedback', 'ats score'], reply: '**Upload Resume** analyzes your PDF and returns an ATS score, strengths, weaknesses, improvement tips, and best-fit job roles.', navLabel: 'Log In to Try It →', navTarget: '/auth/login' },
  { keywords: ['build resume', 'make resume', 'create resume', 'resume builder', 'template', 'ai draft', 'pdf', 'download'], reply: '**Resume Builder** lets you create a professional resume with 10+ templates, AI assistance, and PDF export.', navLabel: 'Log In to Build →', navTarget: '/auth/login' },
  { keywords: ['mock interview', 'interview prep', 'practice interview', 'interview'], reply: '**Interview Prep** offers mock interviews at easy/medium/hard difficulty and a Target Interview mode tailored to a specific job role and JD.', navLabel: 'Log In to Practice →', navTarget: '/auth/login' },
  { keywords: ['cover letter', 'covering letter'], reply: '**Cover Letter Generator** creates a tailored cover letter for any job role, company, and tone — in seconds.', navLabel: 'Log In to Generate →', navTarget: '/auth/login' },
  { keywords: ['job match', 'jd match', 'job description match', 'fit this job', 'match score'], reply: '**Job Matcher** scores how well your resume fits a specific job description and shows exactly what to improve.', navLabel: 'Log In to Match →', navTarget: '/auth/login' },
  { keywords: ['pricing', 'cost', 'plans', 'how much', 'free', 'premium'], reply: 'Vita AI has a **Free Plan (₹0)** and a **Premium Plan** with **Monthly Premium (₹199 / Month)** and **Quarterly Premium (₹399 / Quarter)**. The Premium Plan includes unlimited AI resume generations, PDF downloads, and full mock interviews.', navLabel: 'View Pricing →', navTarget: '/pricing' },
  { keywords: ['privacy', 'data', 'my data', 'privacy policy'], reply: 'Vita AI collects only what\'s needed to power your career tools. Your data is encrypted and never sold to third parties.', navLabel: 'Read Privacy Policy →', navTarget: '/privacy' },
  { keywords: ['terms', 'terms of service', 'tos'], reply: 'Our Terms of Service cover eligibility, acceptable use, subscription terms, and liability. Read the full document for details.', navLabel: 'Read Terms →', navTarget: '/terms' },
  { keywords: ['login', 'log in', 'sign in', 'sign up', 'signup', 'register', 'create account'], reply: 'Create a free Vita AI account to unlock resume analysis, AI resume building, interview prep, cover letters, and job matching.', navLabel: 'Log In / Sign Up →', navTarget: '/auth/login' },
];

const LOGGED_OUT_PLATFORM_INTRO = `### 👋 Welcome to Vita AI!

I'm your **Vita AI Genixpay** — an AI career assistant.

I can help with:
- 📊 Resume ATS analysis
- 🏗️ AI resume building
- 🎙️ Mock interview practice
- ✉️ Cover letter generation
- 🎯 Job description matching

*Log in or sign up to unlock the full assistant.*`;

function getLoggedOutClientReply(message: string): { reply: string; navLabel: string; navTarget: string } {
  const lower = message.toLowerCase();
  for (const intent of LOGGED_OUT_INTENTS) {
    if (intent.keywords.some((kw) => lower.includes(kw))) {
      return { reply: intent.reply + '\n\n*Log in or sign up to use this feature.*', navLabel: intent.navLabel, navTarget: intent.navTarget };
    }
  }
  return { reply: LOGGED_OUT_PLATFORM_INTRO, navLabel: 'Log In →', navTarget: '/auth/login' };
}

function WelcomeCard({ onService, isLoggedIn }: { onService?: (title: string) => void; isLoggedIn?: boolean }) {
  return (
    <div className="vita-welcome-card">
      <WaveBanner />

      <div className="vita-welcome-content">
        <p className="vita-welcome-greeting">
          <span className="vita-wave">👋</span> Hi there!
        </p>

        <h2 className="vita-welcome-heading">
          <span className="text-white">I&apos;m your </span>
          <span className="text-multicolor">Vita AI Genixpay</span>
        </h2>

        <p className="vita-welcome-sub">
          Your personal <strong>AI Career Assistant.</strong><br />
          {isLoggedIn ? "Here's what I can do for you:" : 'Log in to unlock all AI features.'}
        </p>

        {/* 2×2 Service Grid */}
        <div className="vita-service-grid">
          {SERVICES.map((svc) => (
            <div
              key={svc.title}
              className="vita-service-card"
              style={{ '--card-from': svc.cardFrom, '--card-to': svc.cardTo } as React.CSSProperties}
              onClick={() => onService?.(svc.title)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onService?.(svc.title)}
            >
              <div className="vita-svc-icon" style={{ background: svc.bg }}>
                {svc.icon}
              </div>
              <p className="vita-svc-title">{svc.title}</p>
              <p className="vita-svc-desc">{svc.desc}</p>
              <span className="vita-svc-arrow">→</span>
            </div>
          ))}
        </div>

        {/* 24/7 Banner */}
        <div className="vita-247-banner">
          <span className="vita-247-icon">✨</span>
          <p className="vita-247-text">
            I&apos;m here <span className="highlight-green">24/7</span> to help you land your dream job.{' '}
            Let&apos;s build <span className="highlight-gold">your future</span> — together!
          </p>
          <span className="vita-247-chevron">›</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Widget ───────────────────────────────────────────────────────────────
export default function ChatbotWidget() {
  const {
    isOpen, messages, isLoading, currentMode, userContext,
    toggleChat, closeChat, addMessage, setLoading, setMode,
    setUserContext, clearChat, setInterviewState, interviewState,
  } = useChatStore();

  const { user } = useAuthStore();
  const isLoggedIn = !!user;
  const router = useRouter();
  const [isMinimized, setIsMinimized] = useState(false);

  // ── Dragging Logic ───────────────────────────────────────────────────────────
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0 });
  const dragOffsetStart = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Prevent focus text selection drag behavior
    if (e.cancelable) e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    dragStart.current = { x: clientX, y: clientY };
    dragOffsetStart.current = { x: position.x, y: position.y };
    isDragging.current = false;

    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currentX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const currentY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;

      const dx = currentX - dragStart.current.x;
      const dy = currentY - dragStart.current.y;

      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        isDragging.current = true;
      }

      setPosition({
        x: dragOffsetStart.current.x + dx,
        y: dragOffsetStart.current.y + dy,
      });
    };

    const handleEnd = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: true });
    window.addEventListener('touchend', handleEnd);
  }, [position]);

  useEffect(() => {
    if (user?.name) setUserContext({ userName: user.name });
  }, [user?.name, setUserContext]);

  const sendMessage = useCallback(
    async (message: string) => {
      addMessage({ role: 'user', content: message, action: null });
      setLoading(true);

      // ── Logged-out guard: serve local static reply, never call API ──────
      if (!isLoggedIn) {
        const { reply, navLabel, navTarget } = getLoggedOutClientReply(message);
        setTimeout(() => {
          addMessage({
            role: 'assistant',
            content: reply,
            action: { type: 'navigate', label: navLabel, target: navTarget },
          });
          setLoading(false);
        }, 400); // Small delay so the typing indicator is visible
        return;
      }

      const history = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));

      try {
        const { data } = await chatbotService.sendMessage({
          message,
          mode: 'chat',
          conversationHistory: history,
          userContext: {
            userName: userContext.userName,
            resumeText: userContext.resumeText,
            resumeTitle: userContext.resumeTitle,
            atsScore: userContext.atsScore,
            targetRole: userContext.targetRole,
            skills: userContext.skills,
          },
          modePayload: {},
        });

        addMessage({
          role: 'assistant',
          content: data.reply || 'I had trouble generating a response. Please try again.',
          action: (data.action as import('@/lib/chatStore').ChatAction) || null,
          matchScore: data.matchScore,
        });
      } catch (err: any) {
        addMessage({
          role: 'assistant',
          content: `❌ **Error:** ${err?.response?.data?.message || err?.message || 'Something went wrong.'}`,
          action: null,
        });
      } finally {
        setLoading(false);
      }
    },
    [messages, userContext, addMessage, setLoading, isLoggedIn]
  );

  const handleAction = useCallback(
    (action: ChatAction) => {
      // navigate actions are handled by the <a target="_blank"> link directly — no action needed here
      if (action.type === 'apply-to-resume') {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('chatbot:apply-to-resume', {
            detail: { section: action.section, content: action.content },
          }));
        }
        addMessage({
          role: 'assistant',
          content: `✅ **Applied!** The ${action.section || 'section'} has been updated in your Resume Builder!`,
          action: null,
        });
      }
      if (action.type === 'copy-text') {
        navigator.clipboard.writeText(action.content || '').catch(() => { });
      }
    },
    [addMessage]
  );

  // When a service card is clicked, auto-send a helpful prompt
  const handleServiceClick = useCallback((title: string) => {
    const prompts: Record<string, string> = {
      'Analyze Resume': 'Can you analyze my resume and give me an ATS score with improvement tips?',
      'Mock Interview': 'Start a mock interview session with me. Ask me HR and behavioral questions.',
      'Cover Letter': 'Help me generate a tailored cover letter for a job I am applying to.',
      'Resume Builder': 'How can I use the Resume Builder to create a professional resume?',
    };
    const prompt = prompts[title] || `Tell me about ${title}`;
    sendMessage(prompt);
  }, [sendMessage]);

  const showWelcome = messages.length === 0 && !isLoading;

  return (
    <>
      {/* Floating Trigger (Hidden when open and not minimized) */}
      {(!isOpen || isMinimized) && (
        <button
          id="vita-chatbot-trigger"
          className="vita-trigger"
          onMouseDown={handleStart}
          onTouchStart={handleStart}
          onClick={(e) => {
            if (isDragging.current) {
              e.preventDefault();
              e.stopPropagation();
            } else {
              toggleChat();
            }
          }}
          style={{
            right: `${28 - position.x}px`,
            bottom: `${28 - position.y}px`,
            cursor: 'grab'
          }}
          aria-label="Open Vita AI Genixpay"
        >
          <img src="/chatbot.png" alt="Vita AI" className="vita-trigger-img" />
          <span className="vita-trigger-pulse" />
        </button>
      )}

      {/* Panel */}
      {isOpen && !isMinimized && (
        <div
          className="vita-panel"
          role="dialog"
          aria-label="Vita AI Genixpay"
        >
          {/* Particle Background */}
          <ParticleCanvas />

          {/* Header */}
          <div className="vita-header">
            <div className="vita-header-left">
              <div className="vita-header-avatar">
                <img src="/chatbot.png" alt="Vita AI" />
              </div>
              <div className="vita-header-info">
                <p className="vita-header-name">Vita AI Genixpay</p>
                <p className="vita-header-status">
                  <span className="vita-dot" />
                  {isLoggedIn ? 'AI Career Assistant · Online' : 'Limited Mode · Log in for full access'}
                </p>
              </div>
            </div>
            <div className="vita-header-actions">
              <button className="vita-hdr-btn" onClick={clearChat} title="Reset conversation" aria-label="Reset">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.21" />
                </svg>
              </button>
              <button className="vita-hdr-btn" onClick={() => setIsMinimized(true)} title="Minimize" aria-label="Minimize">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              <button className="vita-hdr-btn" onClick={closeChat} title="Close" aria-label="Close">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="vita-messages-area">
            {showWelcome ? (
              <WelcomeCard onService={handleServiceClick} isLoggedIn={isLoggedIn} />
            ) : (
              <ChatWindow messages={messages} isLoading={isLoading} onActionApply={handleAction} />
            )}
          </div>

          {/* Bottom Input */}
          <InputBar
            onSend={sendMessage}
            isLoading={isLoading}
          />

        </div>
      )}

      {/* Minimized bar */}
      {isOpen && isMinimized && (
        <div
          className="vita-minimized"
          onClick={() => setIsMinimized(false)}
          onMouseDown={handleStart}
          onTouchStart={handleStart}
          style={{
            right: `${28 - position.x}px`,
            bottom: `${108 - position.y}px`,
            cursor: 'grab'
          }}
        >
          <img src="/chatbot.png" alt="Vita" className="vita-mini-img" />
          <span>Vita AI Genixpay</span>
          <span className="vita-dot vita-dot--inline" />
        </div>
      )}
    </>
  );
}
