import axios from "axios";

// ✅ Environment variable (must be set in Vercel)
const API_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not defined");
}

// ✅ Axios instance - /api prefix added
const api = axios.create({
  baseURL: `${API_URL}/api`,  // ✅ /api added here
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Request interceptor (attach JWT token)
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ✅ Response interceptor (handle auth errors)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined") {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/auth/login";
      }
    }
    return Promise.reject(error);
  }
);

// ================= AUTH =================
export const authService = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
  updateProfile: (data: {
    name: string;
    mobile?: string;
    headline?: string;
    bio?: string;
    profilePicture?: string;
  }) => api.put("/auth/profile", data),
};

// ================= RESUME =================
export const resumeService = {
  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post("/upload-resume", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  analyze: (resumeId: number) =>
    api.post(`/analyze?resumeId=${resumeId}`),
  getAnalysis: (analysisId: number) =>
    api.get(`/analysis/${analysisId}`),
  getHistory: () => api.get("/history"),
  deleteResume: (resumeId: number) =>
    api.delete(`/history/${resumeId}`),
};

// ================= INTERVIEW =================
export const interviewService = {
  generateQuestions: (data: {
    resumeId?: number | null;
    name?: string;
    skills?: string;
    description?: string;
    count?: number;
  }) => api.post("/generate-questions", data),
  evaluateAnswer: (data: {
    question: string;
    answer: string;
    resumeContext?: string;
  }) => api.post("/evaluate-answer", data),
  saveSession: (data: {
    resumeId?: number;
    sessionTitle: string;
    qaList: any[];
  }) => api.post("/interview/save-session", data),
  getHistory: () => api.get("/interview/history"),
  getSession: (id: number) =>
    api.get(`/interview/session/${id}`),
  deleteSession: (id: number) =>
    api.delete(`/interview/session/${id}`),
};

// ✅ Export axios instance if needed
export default api;
