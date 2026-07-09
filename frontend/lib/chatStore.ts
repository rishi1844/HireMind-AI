// frontend/lib/chatStore.ts — HireMind AI Copilot State Management
import { create } from 'zustand';

export type MessageRole = 'user' | 'assistant';
export type ChatMode =
  | 'chat'
  | 'jd-tailor'
  | 'mock-interview'
  | 'outreach'
  | 'salary'
  | 'auto-fix';

export interface ChatAction {
  type: 'apply-to-resume' | 'copy-text' | 'navigate';
  label?: string;
  section?: string;
  content?: string;   // optional — navigate actions don't need content
  target?: string;    // for navigate actions: the route to push to
}

export interface InterviewState {
  questions: Array<{ q: string; type: string }>;
  currentIndex: number;
  answers: string[];
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  action?: ChatAction | null;
  matchScore?: number | null;
  interviewState?: InterviewState | null;
  evaluation?: {
    score: string;
    strengths: string;
    improvements: string;
    modelAnswer: string;
  } | null;
}

export interface UserContext {
  userName?: string;
  resumeText?: string;
  resumeTitle?: string;
  atsScore?: number | null;
  targetRole?: string;
  skills?: string;
  resumeBuilderData?: Record<string, unknown> | null;
}

interface ChatStore {
  // State
  isOpen: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  currentMode: ChatMode;
  userContext: UserContext;
  interviewState: InterviewState | null;
  pendingAction: ChatAction | null;

  // Actions
  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setLoading: (loading: boolean) => void;
  setMode: (mode: ChatMode) => void;
  setUserContext: (ctx: Partial<UserContext>) => void;
  clearChat: () => void;
  setPendingAction: (action: ChatAction | null) => void;
  setInterviewState: (state: InterviewState | null) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  isOpen: false,
  messages: [],
  isLoading: false,
  currentMode: 'chat',
  userContext: {},
  interviewState: null,
  pendingAction: null,

  toggleChat: () => set((s) => ({ isOpen: !s.isOpen })),
  openChat: () => set({ isOpen: true }),
  closeChat: () => set({ isOpen: false }),

  addMessage: (msg) =>
    set((s) => ({
      messages: [
        ...s.messages,
        {
          ...msg,
          id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          timestamp: new Date(),
        },
      ],
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  setMode: (mode) => set({ currentMode: mode }),

  setUserContext: (ctx) =>
    set((s) => ({ userContext: { ...s.userContext, ...ctx } })),

  clearChat: () => set({ messages: [], interviewState: null, pendingAction: null, currentMode: 'chat' }),

  setPendingAction: (action) => set({ pendingAction: action }),

  setInterviewState: (state) => set({ interviewState: state }),
}));
