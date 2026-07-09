import axios from "axios";

const DEFAULT_DEV_BACKEND_ORIGIN = "https://vita.genixpay.com";

function getBackendOrigin() {
  const rawValue =
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    process.env.BACKEND_URL?.trim() ||
    (process.env.NODE_ENV === "development" ? DEFAULT_DEV_BACKEND_ORIGIN : "");

  if (!rawValue) {
    throw new Error("NEXT_PUBLIC_API_URL or BACKEND_URL is not defined");
  }

  const normalizedValue = rawValue.replace(/\/+$/, "");
  return normalizedValue.endsWith("/api") ? normalizedValue.slice(0, -4) : normalizedValue;
}

const backendOrigin = getBackendOrigin();

const api = axios.create({
  baseURL: `${backendOrigin}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

export function resolveAssetUrl(assetPath?: string) {
  if (!assetPath) {
    return "";
  }

  if (
    assetPath.startsWith("http://") ||
    assetPath.startsWith("https://") ||
    assetPath.startsWith("data:") ||
    assetPath.startsWith("blob:")
  ) {
    return assetPath;
  }

  return `${backendOrigin}${assetPath.startsWith("/") ? assetPath : `/${assetPath}`}`;
}

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

// ─── Centralized error message mapping (Feature 1.3) ─────────────────────────
function friendlyMessage(error: any): string {
  const status: number = error.response?.status;
  const serverMsg: string = error.response?.data?.message || error.response?.data?.error || "";

  // Server-side specific messages (return as-is if descriptive enough)
  if (serverMsg) {
    const lower = serverMsg.toLowerCase();
    if (lower.includes("rate limit") || lower.includes("too many")) return serverMsg;
    if (lower.includes("email already")) return "This email is already registered. Try logging in instead.";
    if (lower.includes("invalid email or password")) return "Incorrect email or password. Please try again.";
    if (lower.includes("verify your email")) return "Please verify your email before logging in.";
    if (lower.includes("otp has expired")) return "Your verification code has expired. Please request a new one.";
    if (lower.includes("invalid") && lower.includes("otp")) return "Invalid verification code. Double-check and try again.";
    if (lower.includes("not found")) return "The requested resource was not found.";
    if (lower.includes("unauthorized")) return "You don't have permission to do that.";
  }

  // HTTP status fallbacks
  switch (status) {
    case 400: return serverMsg || "Invalid request. Please check your input and try again.";
    case 401: return "Session expired. Please log in again.";
    case 403: return "Access denied. You don't have permission.";
    case 404: return "Resource not found.";
    case 409: return serverMsg || "A conflict occurred. This resource may already exist.";
    case 422: return "Validation failed. Please check your input.";
    case 429: return serverMsg || "Too many requests. Please slow down and try again.";
    case 500: return "Server error. Our team has been notified. Please try again shortly.";
    case 502:
    case 503:
    case 504: return "Service temporarily unavailable. Please try again in a moment.";
    default: return serverMsg || error.message || "Something went wrong. Please try again.";
  }
}

// ─── JWT Auto-Refresh Interceptor (Phase 2.3) ────────────────────────────────
let _isRefreshing = false;
let _refreshQueue: Array<(token: string) => void> = [];

function processRefreshQueue(newToken: string) {
  _refreshQueue.forEach((cb) => cb(newToken));
  _refreshQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Attach friendly message to error for UI components
    error.friendlyMessage = friendlyMessage(error);

    if (typeof window !== "undefined") {
      const status = error.response?.status;
      const requestUrl = String(error.config?.url || "");
      const isRefreshRequest = requestUrl.includes("/auth/refresh");
      const authRequestPrefixes = [
        "/auth/login",
        "/auth/register",
        "/auth/signup",
        "/auth/verify-otp",
        "/auth/resend-otp",
        "/auth/forgot-password",
        "/auth/send-mobile-otp",
        "/auth/reset-password",
        "/auth/social-login",
        "/auth/refresh",
      ];
      const isAuthRequest = authRequestPrefixes.some((prefix) => requestUrl.startsWith(prefix));

      if (status === 401 && !isAuthRequest && !error.config?._retry) {
        // Try to refresh the access token
        const storedRefreshToken = localStorage.getItem("refreshToken");

        if (storedRefreshToken && !isRefreshRequest) {
          if (_isRefreshing) {
            // Queue this request until refresh completes
            return new Promise((resolve) => {
              _refreshQueue.push((newToken: string) => {
                error.config.headers.Authorization = `Bearer ${newToken}`;
                resolve(api(error.config));
              });
            });
          }

          error.config._retry = true;
          _isRefreshing = true;

          try {
            const { data } = await api.post("/auth/refresh", { refreshToken: storedRefreshToken });
            const newToken: string = data.token;
            const newRefreshToken: string | null = data.refreshToken ?? null;

            localStorage.setItem("token", newToken);
            if (newRefreshToken) localStorage.setItem("refreshToken", newRefreshToken);
            if (typeof window !== "undefined") {
              document.cookie = `token=${encodeURIComponent(newToken)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
            }

            api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
            error.config.headers.Authorization = `Bearer ${newToken}`;

            processRefreshQueue(newToken);
            return api(error.config);
          } catch {
            // Refresh failed — clear session and redirect
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("refreshToken");
            if (typeof window !== "undefined") {
              document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
            }
            window.location.href = "/auth/login";
          } finally {
            _isRefreshing = false;
          }
        } else {
          // No refresh token — clear and redirect
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          if (typeof window !== "undefined") {
            document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
          }
          window.location.href = "/auth/login";
        }
      }

      if (status === 403 && !isAuthRequest) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("refreshToken");
        if (typeof window !== "undefined") {
          document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        }
        window.location.href = "/auth/login";
      }
    }

    return Promise.reject(error);
  }
);


// Helper export so components can use: toast.error(getApiError(error))
export function getApiError(error: any): string {
  return error?.friendlyMessage ?? error?.response?.data?.message ?? error?.message ?? "Something went wrong.";
}

async function postWithFallback<T>(primaryUrl: string, fallbackUrl: string, data: T) {
  try {
    return await api.post(primaryUrl, data);
  } catch (error: any) {
    const status = error.response?.status;
    if (status === 404 || status === 405) {
      return api.post(fallbackUrl, data);
    }
    throw error;
  }
}

export const authService = {
  register: (data: { name: string; email: string; password: string; mobile?: string }) =>
    postWithFallback("/auth/register", "/auth/signup", data),
  login: (data: { email: string; password: string }) => api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
  updateProfile: (data: {
    name: string;
    mobile?: string;
    headline?: string;
    bio?: string;
    profilePicture?: string;
  }) => api.put("/auth/profile", data),
  verifyOtp: (data: { email: string; otp: string }) => api.post("/auth/verify-otp", data),
  resendEmailOtp: (data: { email: string }) => api.post("/auth/resend-otp", data),
  forgotPassword: (data: { email: string }) => api.post("/auth/forgot-password", data),
  resetPassword: (data: { email: string; otp: string; password: string }) =>
    api.post("/auth/reset-password", data),
  socialLogin: (data: {
    provider: "google" | "linkedin";
    token?: string;
    code?: string;
    redirectUri?: string;
  }) => api.post("/auth/social-login", data),
  /** Phase 2.3 — Manually exchange a refresh token for a new access token */
  refresh: (refreshToken: string) => api.post("/auth/refresh", { refreshToken }),
  /** Change password for logged-in local account users */
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post("/auth/change-password", data),
  /** Permanently delete the logged-in user's account and all data */
  deleteAccount: (data: { password?: string }) => api.delete("/auth/account", { data }),
};


export const resumeService = {
  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post("/upload-resume", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  analyze: (resumeId: number, aiModel: "gemini" | "gpt" = "gpt", force = false) =>
    api.post(`/analyze`, { resumeId, aiModel, force }),

  getAnalysis: (analysisId: number) => api.get(`/analysis/${analysisId}`),
  getHistory: () => api.get("/history"),
  deleteResume: (resumeId: number) => api.delete(`/history/${resumeId}`),
  getResumeText: (resumeId: number) => api.get(`/resume/${resumeId}/text`),
  matchJd: (resumeId: number, jobDescription: string) =>
    api.post("/job-match/analyze", { resumeId, jobDescription }),
  regenerateSuggestion: (data: {
    originalText: string;
    issueType?: string;
    section?: string;
    resumeContext?: string;
  }) => api.post<{ improvedText: string }>("/resume/regenerate-suggestion", data),
};


export const interviewService = {
  generateQuestions: (data: {
    resumeId?: number | null;
    name?: string;
    skills?: string;
    description?: string;
    difficulty?: "easy" | "medium" | "hard";
    count?: number;
    aiModel?: "gemini" | "gpt";
    previousQuestions?: string[];
  }) => api.post("/generate-questions", data),
  generateTargetedQuestions: (data: {
    jobTitle: string;
    companyName: string;
    jobDescription: string;
    resumeId?: number | null;
    resumeText?: string | null;
    count?: number;
    aiModel?: "gemini" | "gpt";
  }) => api.post("/generate-targeted-questions", data),
  evaluateAnswer: (data: {
    question: string;
    answer: string;
    resumeContext?: string;
    aiModel?: "gemini" | "gpt";
  }) => api.post("/evaluate-answer", data),
  evaluateTargetedAnswer: (data: {
    question: string;
    answer: string;
    jobTitle: string;
    companyName: string;
    jobDescription: string;
    resumeId?: number | null;
    resumeText?: string | null;
    aiModel?: "gemini" | "gpt";
  }) => api.post("/evaluate-targeted-answer", data),
  evaluateTargetedSession: (data: {
    jobTitle: string;
    companyName: string;
    jobDescription: string;
    resumeId?: number | null;
    resumeText?: string | null;
    qaList: Array<{ question: string; answer: string; skipped: boolean }>;
    aiModel?: "gemini" | "gpt";
  }) => api.post("/evaluate-targeted-session", data),
  saveSession: (data: {
    resumeId?: number;
    sessionTitle: string;
    qaList: any[];
  }) => api.post("/interview/save-session", data),
  getHistory: () => api.get("/interview/history"),
  getSession: (id: number) => api.get(`/interview/session/${id}`),
  deleteSession: (id: number) => api.delete(`/interview/session/${id}`),
  getLiveKitToken: (data: { roomName: string; participantName: string }) =>
    api.post("/interview/livekit-token", data),
};

export const resumeBuilderService = {
  create: (data: {
    title: string;
    templateId: string;
    resumeData: Record<string, unknown>;
  }) => api.post("/resume-builder", data),
  update: (id: number, data: { title: string; templateId: string; resumeData: Record<string, unknown> }) =>
    api.put(`/resume-builder/${id}`, data),
  getAll: () => api.get("/resume-builder"),
  getById: (id: number) => api.get(`/resume-builder/${id}`),
  delete: (id: number) => api.delete(`/resume-builder/${id}`),
  uploadProfileImage: (file: File) => {
    const form = new FormData();
    form.append("file", file);

    return api.post<{ imageUrl: string }>("/resume-builder/profile-image", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  extractResume: (file: File) => {
    const form = new FormData();
    form.append("file", file);

    return api.post<any>("/resume-builder/extract-resume", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  trackDownload: (id: number) =>
    api.post<{ success: boolean; message: string }>(`/resume-builder/${id}/track-download`),
  generateField: (data: {
    fieldType: string;
    aiModel?: "gemini" | "gpt";
    name?: string;
    skills?: string;
    targetRole?: string;
    experienceInput?: string;
    company?: string;
    role?: string;
    duration?: string;
    projectTitle?: string;
    techStack?: string;
    existingDescription?: string;
    /** User-provided brief/context that personalises AI generation */
    hint?: string;
  }) => api.post("/resume-builder/ai/generate-field", data),

  /** Returns the full URL for DOCX download (used with fetch + Authorization header) */
  exportDocxUrl: (id: number, templateId?: string) =>
    templateId
      ? `${backendOrigin}/api/resume-builder/${id}/export/docx?templateId=${encodeURIComponent(templateId)}`
      : `${backendOrigin}/api/resume-builder/${id}/export/docx`,

  /** Returns the full URL for server-side PDF download */
  exportPdfUrl: (id: number) => `${backendOrigin}/api/resume-builder/${id}/export/pdf`,

  /** Send resume via email */
  sendEmail: (id: number, data: { recipientEmail: string; format: "PDF" | "DOCX"; templateId?: string }) =>
    api.post(`/resume-builder/${id}/export/email`, data),

  /** Phase 3.3 — Get real-time AI tips for the current builder step */
  getTips: (data: { step: string; resumeData?: Record<string, unknown> }) =>
    api.post<{ tips: string[]; step: string }>("/resume-builder/ai/tips", data),
};


// ─── Cover Letter Generator (Phase 3.1) ──────────────────────────────────────
export const coverLetterService = {
  generate: (data: {
    resumeId?: number;
    jobTitle: string;
    companyName: string;
    jobDescription: string;
    tone?: "professional" | "enthusiastic" | "concise";
  }) => api.post("/cover-letter/generate", data),
};

// ─── Job Description Matcher (Phase 3.2) ─────────────────────────────────────
export const jobMatchService = {
  match: (data: {
    resumeId: number;
    jobDescription: string;
  }) => api.post("/job-match/analyze", data),
};

// ─── Usage Summary (Phase 4.1) ───────────────────────────────────────────────
export const usageService = {
  getSummary: () => api.get<{
    plan: string;
    features: Record<string, { used: number | null; limit: number | null; unlimited: boolean }>;
  }>("/usage/summary"),
};

// ─── AI Career Copilot Chatbot (Phase 5.0) ───────────────────────────────────
export const chatbotService = {
  sendMessage: (data: {
    message: string;
    mode?: 'chat' | 'jd-tailor' | 'mock-interview' | 'outreach' | 'salary' | 'auto-fix';
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    userContext?: {
      userName?: string;
      resumeText?: string;
      resumeTitle?: string;
      atsScore?: number | null;
      targetRole?: string;
      skills?: string;
    };
    modePayload?: {
      action?: string;
      outreachType?: 'linkedin' | 'email' | 'pitch';
      section?: string;
      currentContent?: string;
      company?: string;
      recruiter?: string;
      targetRole?: string;
      question?: string;
      questionType?: string;
    };
  }) => api.post<{
    success: boolean;
    reply: string;
    mode: string;
    action?: { type: string; label?: string; section?: string; content: string } | null;
    matchScore?: number | null;
    interviewState?: {
      questions: Array<{ q: string; type: string }>;
      currentIndex: number;
      answers: string[];
    } | null;
    evaluation?: {
      score: string;
      strengths: string;
      improvements: string;
      modelAnswer: string;
    } | null;
  }>('/chatbot/message', data),
};

export default api;


// This is api.ts