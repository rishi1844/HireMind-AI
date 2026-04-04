export interface User {
  id: number;
  name: string;
  email: string;
  mobile?: string;
  profilePicture?: string;
  headline?: string;
  bio?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  id: number;
  name: string;
  email: string;
  mobile?: string;
  profilePicture?: string;
  headline?: string;
  bio?: string;
}

export interface ResumeResponse {
  id: number;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  hasAnalysis: boolean;
}

export interface QuickPracticeItem {
  question: string;
  sampleAnswer: string;
}

export interface AnalysisResponse {
  id: number;
  resumeId: number;
  fileName: string;
  atsScore: number;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  jobRoles: string[];
  projectSuggestions: string[];
  quickPractice: QuickPracticeItem[];
  analyzedAt: string;
}

export interface HistoryItem {
  resumeId: number;
  fileName: string;
  uploadedAt: string;
  analysisId?: number;
  atsScore?: number;
  analyzedAt?: string;
}

export type QuestionType = "TECHNICAL" | "PROJECT" | "HR";
export type InputMode = "text" | "voice";

export interface Question {
  question: string;
  type: QuestionType;
}

export interface QuestionsResponse {
  questions: Question[];
}

export interface EvaluationResponse {
  score: number;
  strengths: string;
  weaknesses: string;
  improvedAnswer: string;
}

export interface QAItem {
  question: string;
  questionType: string;
  answer: string;
  inputMode: InputMode;
  score?: number;
  strengths?: string;
  weaknesses?: string;
  improvedAnswer?: string;
  skipped?: boolean;
  orderIndex?: number;
}

export interface SessionResponse {
  id: number;
  sessionTitle: string;
  overallScore: number;
  questionsAnswered: number;
  questionsAsked?: number;
  createdAt: string;
  resumeId?: number;
  resumeFileName?: string;
  qaList?: QAItem[];
}

export interface ApiError {
  status: number;
  message: string;
  timestamp: string;
}
