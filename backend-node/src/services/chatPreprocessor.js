// src/services/chatPreprocessor.js — Vita AI Copilot Preprocessing Layer (Spec v2)
const logger = require('../utils/logger');

// ─── Classification Categories ────────────────────────────────────────────────
const GREETINGS = [
  'hello', 'hi', 'hey', 'good morning', 'good evening', 'good afternoon', 'yo', 'hola', 'hii', 'heyy',
  'namaste', 'salam', 'sup', 'greetings', 'watup', 'whats up'
];

const THANK_YOU = [
  'thanks', 'thank you', 'ty', 'thx', 'thanks buddy', 'appreciate it', 'thank u', 'shukriya'
];

const CONFIRMATION = [
  'ok', 'okay', 'cool', 'sure', 'done', 'great', 'nice', 'fine', 'hmm', 'hmmm', 'alright', 'yep', 'yes'
];

const GOODBYE = [
  'bye', 'see you', 'good night', 'take care', 'catch you later', 'tata', 'goodbye'
];

const APOLOGY = [
  'sorry', 'my mistake', 'oops', 'apologies'
];

const SMALL_TALK = [
  'how are you', 'whats up', "what's up", 'how is it going', 'how do you do', 'what are you doing', 'how r u'
];

const ABOUT_BOT = [
  'who are you', 'tell me about yourself', 'your name', 'whats your name', "what's your name", 'who r u', 'identify yourself'
];

const KEYBOARD_WALKS = ['asdf', 'qwerty', 'zxcv', 'ghjk', 'uiop'];

const STOPWORDS = new Set([
  'how', 'do', 'i', 'to', 'my', 'the', 'a', 'an', 'is', 'are', 'you', 'your', 'can', 'we',
  'our', 'in', 'on', 'at', 'of', 'for', 'with', 'about', 'please', 'would', 'could', 'should',
  'want', 'need', 'what', 'where', 'when', 'which', 'use', 'get', 'will', 'this', 'that'
]);

// ─── Intent/FAQ Knowledge Base (Spec Section 3 & 4) ──────────────────────────
// Each entry: intent_name, trigger_keywords[], sample_phrases[], reply, target_page, nav_action
const INTENT_DATABASE = [
  // ── Platform Overview / Features ───────────────────────────────────────────
  {
    id: 'platform_overview',
    keywords: [
      'features', 'services', 'what can you do', 'capabilities', 'what do you offer',
      'platform features', 'what services', 'offerings', 'list of services',
      'how can you help me', 'how to use', 'help me'
    ],
    sample_phrases: [
      'what services do you offer', 'what can you do', 'what are the features',
      'tell me about your services', 'what do you offer', 'how can you help me',
      'what services your offers'
    ],
    reply: `### 🌐 Vita AI Genixpay Services & Features

I am your personal AI career assistant. Here are the core services you can access on the platform:

- 📊 **[Resume Analyzer](/resume/upload)** — Get your ATS score, strengths, weaknesses, and improvement suggestions.
- 🏗️ **[AI Resume Builder](/resume/builder)** — Edit and export your resume using 10+ ATS-friendly templates with AI assistance.
- 🎙️ **[Interview Prep](/interview)** — Practice mock interviews with real-time AI feedback tailored to target roles.
- ✉️ **[Cover Letter Generator](/cover-letter)** — Generate professional cover letters tailored per company and role.
- 🎯 **[Job Matcher](/resume/match)** — Compare your resume to any job description to find missing keywords and gaps.`,
    target_page: '/dashboard',
    nav_label: 'Go to Dashboard →',
  },

  // ── Upload Resume ──────────────────────────────────────────────────────────
  {
    id: 'upload_resume',
    keywords: [
      'ats score', 'analyse my resume', 'analyze my resume', 'check my resume',
      'strengths weaknesses', 'resume feedback', 'what jobs suit me', 'upload resume',
      'upload my resume', 'resume analysis', 'scan resume', 'review my resume',
      'resume analyzer', 'best fit jobs', 'resume strengths', 'resume weaknesses',
      'improvement suggestions', 'resume suggestions', 'recommended projects',
      'analyser', 'analyze', 'analysed', 'ats analysis', 'applicant tracking'
    ],
    sample_phrases: [
      'analyse my resume', 'check my resume', 'what is my ats score', 'analyze resume',
      'give me resume feedback', 'what jobs suit me', 'strengths and weaknesses of my resume'
    ],
    reply: `### 📊 Upload Resume — ATS Analysis\n\nOur **Upload Resume** tool gives you a complete picture of your resume's strengths:\n\n- 🎯 **ATS Score** (0–100) — how well your resume passes automated screening\n- ✅ **Strengths** — what's working in your resume\n- ⚠️ **Weaknesses** — gaps to fix before applying\n- 💡 **Improvement Suggestions** — specific, actionable edits\n- 🏆 **Best-Fit Job Roles** — roles your resume is best matched for\n- 🛠️ **Recommended Projects** — projects that could boost your profile\n\nUpload your PDF resume and get your full analysis in seconds!`,
    target_page: '/resume/upload',
    nav_label: 'Go to Upload Resume →',
  },

  // ── Resume Builder ─────────────────────────────────────────────────────────
  {
    id: 'resume_builder',
    keywords: [
      'build resume', 'make resume', 'create resume', 'ats friendly resume', 'resume templates',
      'download resume', 'download resume pdf', 'email my resume', 'ai resume', 'improve my resume',
      'resume fonts', 'resume colors', 'resume builder', 'ai draft', 'import resume',
      'build a resume', 'write my resume', 'resume template', 'professional resume',
      'resume design', 'resume format', 'resume maker', 'draft my resume', 'generate resume',
      'export resume', 'export pdf', 'pdf download', 'send resume email',
      'ats friendly', 'ats friendly resumes', 'make an ats friendly'
    ],
    sample_phrases: [
      'build my resume', 'create a resume', 'make an ats friendly resume', 'resume templates',
      'how do i download my resume as pdf', 'email my resume', 'use ai to build resume',
      'import existing resume', 'ai draft resume'
    ],
    reply: `### 🏗️ Resume Builder — AI-Powered Resume Creation\n\nOur **AI Resume Builder** is the most powerful way to create a job-ready resume:\n\n- 📋 **10+ ATS-Friendly Templates** — pick the perfect design for your industry\n- 🤖 **AI-Assisted Building** — let AI write and refine each section\n- ✨ **AI Draft Mode** — answer a few questions and get a fully ATS-optimized resume\n- 📥 **Import & Improve** — upload your existing resume and let AI enhance it\n- 🎨 **Live Preview** — switch templates, fonts, sizes, and colors in real time\n- 📄 **PDF Download** — export a professional, print-ready PDF\n- 📧 **Email Your Resume** — send it directly to recruiters from the platform`,
    target_page: '/resume/builder',
    nav_label: 'Go to Resume Builder →',
  },

  // ── Interview ──────────────────────────────────────────────────────────────
  {
    id: 'interview',
    keywords: [
      'mock interview', 'practice interview', 'interview prep', 'target interview',
      'interview based on job role', 'interview based on jd', 'interview questions',
      'hr interview', 'technical interview', 'behavioral interview', 'interview practice',
      'start interview', 'interview difficulty', 'easy interview', 'hard interview',
      'interview feedback', 'interview session', 'mock round', 'ai interview',
      'job description interview', 'jd interview', 'interview preparation'
    ],
    sample_phrases: [
      'start a mock interview', 'practice interview questions', 'interview prep based on my resume',
      'target interview for job role', 'how does mock interview work', 'interview difficulty levels'
    ],
    reply: `### 🎙️ Interview Prep — Mock & Target Interviews\n\nOur **Interview** module prepares you for any interview scenario:\n\n**Mock Interview (resume-based)**\n- Generated from your resume or manual input (name, skills, description)\n- 3 difficulty levels: **Easy / Medium / Hard**\n- Instant AI feedback on every answer\n\n**Target Interview Mode** 🎯\n- Tailored to a specific **job role, skills set, and job description**\n- Simulates a real interview for that exact position\n- Perfect for prep before applying to a specific company`,
    target_page: '/interview',
    nav_label: 'Go to Interview Prep →',
  },

  // ── Cover Letter ───────────────────────────────────────────────────────────
  {
    id: 'cover_letter',
    keywords: [
      'cover letter', 'write cover letter', 'cover letter for', 'generate cover letter',
      'application letter', 'covering letter', 'job application letter', 'cover letter tone',
      'formal cover letter', 'professional cover letter', 'cover letter company',
      'cover letter role', 'cover letter job description'
    ],
    sample_phrases: [
      'write a cover letter', 'generate cover letter for a job', 'cover letter for google',
      'how to write cover letter', 'cover letter for software engineer'
    ],
    reply: `### ✉️ Cover Letter Generator\n\nOur **Cover Letter** tool creates a personalized, professional cover letter in seconds:\n\n- 🏢 **Tailored per company and job role** — not a generic template\n- 📝 **Based on the job description** — keywords matched automatically\n- 🎭 **Multiple tone options** — Professional, Enthusiastic, Concise, and more\n- ⚡ **Instant generation** — ready to copy or download immediately\n\nJust provide the role, company name, and job description — the AI does the rest!`,
    target_page: '/cover-letter',
    nav_label: 'Go to Cover Letter →',
  },

  // ── Job Matcher ────────────────────────────────────────────────────────────
  {
    id: 'job_matcher',
    keywords: [
      'match my resume to job', 'job description match', 'how well do i fit this job',
      'job matcher', 'resume match', 'match score', 'jd match', 'resume job fit',
      'fit for job', 'jd tailor', 'tailor resume', 'match resume', 'job match',
      'keyword gap', 'resume gap', 'missing keywords', 'job description keywords',
      'resume to job', 'match to jd', 'fit this role', 'how good is my resume for'
    ],
    sample_phrases: [
      'match my resume to this job', 'how well does my resume fit this jd',
      'check job description match', 'find keyword gaps in my resume', 'tailor my resume for job'
    ],
    reply: `### 🎯 Job Matcher — Resume-to-JD Match Score\n\nOur **Job Matcher** tells you exactly how well your resume fits a specific job:\n\n- 📊 **Match Score (0–100)** — objective fit percentage\n- 🔑 **Missing Keywords** — critical terms from the JD not in your resume\n- ✅ **Matching Keywords** — your existing strengths for this role\n- 🛠️ **Improvement Areas** — specific edits to boost your score\n\nPaste a job description, select your resume, and see where you stand!`,
    target_page: '/resume/match',
    nav_label: 'Go to Job Matcher →',
  },

  // ── Pricing ────────────────────────────────────────────────────────────────
  {
    id: 'pricing',
    keywords: [
      'pricing', 'cost', 'plans', 'how much', 'price', 'subscription', 'free plan',
      'premium plan', 'premium', 'paid plan', 'what does it cost', 'monthly plan',
      'annual plan', 'upgrade', 'pro plan', 'free version', 'free tier', 'plan features',
      'how much does', 'what is the price', 'billing'
    ],
    sample_phrases: [
      'what is your pricing', 'how much does vita cost', 'what are the plans',
      'free vs premium', 'is there a free version', 'upgrade to premium'
    ],
    reply: `### 💎 Vita AI Pricing Plans\n\nVita AI offers plans to suit every job seeker:\n\n**🆓 Free Plan (₹0)**\n- Basic resume templates\n- Limited resume uploads & ATS analysis\n- Standard chatbot assistance\n\n**⭐ Premium Plan**\n- **Monthly Premium**: ₹199 / Month\n- **Quarterly Premium**: ₹399 / Quarter\n- Unlimited AI resume generations & PDF downloads\n- Full interview prep with AI feedback\n- Advanced outreach generation (LinkedIn DMs, cold emails)\n- Priority support\n\nUpgrade today to unlock your full career potential!`,
    target_page: '/pricing',
    nav_label: 'View Pricing Plans →',
  },
  
  // ── Dashboard ──────────────────────────────────────────────────────────────
  {
    id: 'dashboard',
    keywords: [
      'dashboard', 'my activity', 'quick actions', 'my history', 'home page',
      'main page', 'activity history', 'recent activity', 'my dashboard', 'overview'
    ],
    sample_phrases: [
      'go to dashboard', 'show my activity', 'quick actions', 'my recent history'
    ],
    reply: `### 🏠 Dashboard\n\nYour **Dashboard** is your career command center:\n\n- 📈 **Activity History** — all your past resume analyses, interview sessions, and cover letters\n- ⚡ **Quick Actions** — jump directly to any platform feature\n- 📊 **Progress Overview** — track your career improvement over time\n\nEverything you need, in one place!`,
    target_page: '/dashboard',
    nav_label: 'Go to Dashboard →',
  },

  // ── History ────────────────────────────────────────────────────────────────
  {
    id: 'history',
    keywords: [
      'history', 'my resumes', 'past resumes', 'interview history', 'past interviews',
      'resume history', 'previous resumes', 'old resumes', 'saved resumes',
      'past analyses', 'previous analyses'
    ],
    sample_phrases: [
      'show my resume history', 'view my past interviews', 'my saved resumes'
    ],
    reply: `### 📂 History\n\nYour **History** page keeps all your past work in one place:\n\n- 📄 **Resume History** — all previously uploaded and built resumes\n- 🎙️ **Interview History** — past mock interview sessions with scores\n- 📊 **Analysis History** — previous ATS scores and reports\n\nAccess and pick up from any past session!`,
    target_page: '/history',
    nav_label: 'Go to History →',
  },

  // ── Profile ────────────────────────────────────────────────────────────────
  {
    id: 'profile',
    keywords: [
      'profile', 'change password', 'update name', 'bio', 'headline', 'account settings',
      'settings', 'my profile', 'edit profile', 'update profile', 'profile settings',
      'change name', 'update bio', 'my account', 'account details', 'forgot password',
      'reset password', 'password'
    ],
    sample_phrases: [
      'how do i change my password', 'update my profile', 'edit my name', 'change headline',
      'account settings', 'forgot my password'
    ],
    reply: `### 👤 Profile & Account Settings\n\nManage your career identity in **Profile**:\n\n- 🔑 **Change Password** — update your account password securely\n- ✏️ **Update Name, Bio & Headline** — shown on your profile and resume\n- 🎯 **Target Role** — help Vita AI personalize recommendations\n- 🛠️ **Key Skills** — used by the AI for better suggestions\n\nKeep your profile updated for the best AI experience!`,
    target_page: '/profile',
    nav_label: 'Go to Profile →',
  },

  // ── Privacy Policy ─────────────────────────────────────────────────────────
  {
    id: 'privacy_policy',
    keywords: [
      'privacy policy', 'data privacy', 'my data', 'privacy', 'data collection',
      'data usage', 'personal data', 'gdpr', 'data protection', 'data sharing',
      'third party data', 'sell my data', 'data stored', 'what data'
    ],
    sample_phrases: [
      'what is your privacy policy', 'how do you use my data', 'do you sell my data',
      'what data do you collect', 'data privacy policy'
    ],
    reply: `### 🔒 Privacy Policy Summary\n\nAt Vita AI, your data privacy is a priority:\n\n- 📋 **Data Collected**: Name, email, resume content, and usage activity\n- 🎯 **Purpose**: To provide AI-powered career services and personalize your experience\n- 🔐 **Security**: Data is encrypted in transit and at rest\n- 🚫 **No Third-Party Sale**: Your personal data is never sold to third parties\n- 🗑️ **Data Deletion**: You can request deletion of your data at any time\n- 🍪 **Cookies**: Used only for authentication and session management\n\nRead the full policy for complete details.`,
    target_page: '/privacy',
    nav_label: 'Read Full Privacy Policy →',
  },

  // ── Terms of Service ───────────────────────────────────────────────────────
  {
    id: 'terms',
    keywords: [
      'terms', 'terms of service', 'terms and conditions', 't&c', 'tos',
      'user agreement', 'service terms', 'usage terms', 'legal'
    ],
    sample_phrases: [
      'what are your terms of service', 'terms and conditions', 'user agreement', 'legal terms'
    ],
    reply: `### 📜 Terms of Service Summary\n\nKey points from the Vita AI Terms of Service:\n\n- ✅ **Eligibility**: Service is available to users 16 years and older\n- 🤖 **AI Content**: AI-generated content is for guidance only — verify before use\n- 🚫 **Prohibited**: Misuse, scraping, or reselling platform content is not allowed\n- 💳 **Subscription**: Premium plans are billed as described on the Pricing page; cancellation stops future billing\n- ⚖️ **Liability**: Vita AI is not liable for hiring decisions made based on platform outputs\n- 📬 **Changes**: Terms may be updated with notice via email or in-app notification\n\nRead the full terms for complete details.`,
    target_page: '/terms',
    nav_label: 'Read Full Terms →',
  },

  // ── Login / Signup ─────────────────────────────────────────────────────────
  {
    id: 'auth',
    keywords: [
      'login', 'log in', 'sign in', 'signin', 'create account', 'sign up', 'signup',
      'register', 'forgot password', 'new account', 'join vita', 'how to register',
      'account creation'
    ],
    sample_phrases: [
      'how do i login', 'create a new account', 'sign up for vita', 'how to register'
    ],
    reply: `### 🔑 Login / Sign Up\n\nReady to get started? Create your free Vita AI account or log in to access all features:\n\n- 🆓 **Free to sign up** — no credit card required\n- ⚡ **Instant access** to resume analysis, builder, and interview prep\n- 🔐 **Secure** — your data is encrypted and protected`,
    target_page: '/auth/login',
    nav_label: 'Log In →',
  },
];

// ─── Logged-Out Static Response Set ──────────────────────────────────────────
// These are served without any OpenAI call for unauthenticated users
const LOGGED_OUT_PLATFORM_OVERVIEW = `### 👋 Welcome to Vita AI!\n\nI'm your **Vita AI Genixpay** — an AI career assistant that helps you:\n\n- 📊 **Analyze your resume** — ATS score, strengths & weaknesses\n- 🏗️ **Build a resume** — 10+ templates, AI-assisted, PDF export\n- 🎙️ **Practice interviews** — mock & target interview modes\n- ✉️ **Generate cover letters** — tailored per job & company\n- 🎯 **Match jobs** — see how well your resume fits any JD\n\n*Log in or sign up to use these features and unlock full chatbot assistance.*`;

/**
 * Returns a static response for logged-out users.
 * Never calls OpenAI.
 */
function getLoggedOutReply(message, intent, matchedIntent) {
  const loginNudge = `\n\n---\n🔐 **[Log In](/auth/login)** or **[Sign Up](/auth/signup)** to use this feature and unlock full AI chatbot assistance.`;

  // Greeting / small talk
  if (['Greeting', 'Thanks', 'Goodbye', 'Confirmation', 'Apology', 'Small Talk', 'About Bot'].includes(intent)) {
    return {
      reply: LOGGED_OUT_PLATFORM_OVERVIEW,
      action: { type: 'navigate', label: 'Log In →', target: '/auth/login' },
    };
  }

  // Spam / meaningless
  if (['Spam', 'Meaningless Text'].includes(intent)) {
    return {
      reply: `Hmm, that doesn't look like a career question. ${LOGGED_OUT_PLATFORM_OVERVIEW}`,
      action: null,
    };
  }

  // Feature-related — answer briefly from FAQ + login nudge
  if (matchedIntent) {
    return {
      reply: `${matchedIntent.reply}${loginNudge}`,
      action: { type: 'navigate', label: 'Log In to Use This →', target: '/auth/login' },
    };
  }

  // Completely unrelated / unknown
  return {
    reply: LOGGED_OUT_PLATFORM_OVERVIEW,
    action: { type: 'navigate', label: 'Log In →', target: '/auth/login' },
  };
}

// ─── Token Saving Estimator ───────────────────────────────────────────────────
function estimateTokensSaved(message, isSystemIncluded = true) {
  const systemSaved = isSystemIncluded ? 1200 : 0;
  const messageTokens = Math.ceil(message.length / 4);
  return systemSaved + messageTokens + 250;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getTokens(text) {
  return text
    .toLowerCase()
    .replace(/[?,.!;:'"]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 0 && !STOPWORDS.has(word));
}

// ─── Classification Helpers ───────────────────────────────────────────────────
function classifySimpleIntent(message) {
  const clean = message.trim().toLowerCase().replace(/[?,.!]/g, '');

  if (clean.length === 0) return 'Meaningless Text';
  if (/^[0-9]+$/i.test(clean)) return 'Spam';
  if (/^[^a-zA-Z0-9\s]+$/.test(clean)) return 'Spam';
  if (/(.)\\1{4,}/.test(clean)) return 'Spam';
  if (KEYBOARD_WALKS.some((w) => clean.includes(w))) return 'Spam';

  const cleanTokens = getTokens(clean);

  if (GREETINGS.includes(clean) || cleanTokens.some((w) => GREETINGS.includes(w))) return 'Greeting';
  if (THANK_YOU.includes(clean) || THANK_YOU.some((ty) => clean.includes(ty))) return 'Thanks';
  if (CONFIRMATION.includes(clean) || CONFIRMATION.includes(cleanTokens[0])) return 'Confirmation';
  if (GOODBYE.includes(clean) || GOODBYE.some((bye) => clean.includes(bye))) return 'Goodbye';
  if (APOLOGY.includes(clean) || APOLOGY.some((ap) => clean.includes(ap))) return 'Apology';
  if (ABOUT_BOT.some((talk) => clean.includes(talk))) return 'About Bot';
  if (SMALL_TALK.some((talk) => clean.includes(talk))) return 'Small Talk';

  return 'Unknown';
}

// ─── Intent Matcher ───────────────────────────────────────────────────────────
function matchIntent(message) {
  const lowerMsg = message.toLowerCase();
  const queryTokens = getTokens(message);
  if (queryTokens.length === 0) return null;

  let bestMatch = null;
  let highestScore = 0;

  for (const intent of INTENT_DATABASE) {
    let score = 0;

    // 1. Keyword Hits
    // We check if any keyword is a substring of the message.
    // To reward longer, more specific keyword matches over shorter ones,
    // we find the longest matched keyword.
    let longestKeywordLength = 0;
    let bestKw = null;
    for (const kw of intent.keywords) {
      if (lowerMsg.includes(kw)) {
        if (kw.length > longestKeywordLength) {
          longestKeywordLength = kw.length;
          bestKw = kw;
        }
      }
    }

    if (bestKw) {
      const kwTokens = getTokens(bestKw);
      // Calculate fraction of query covered by keyword
      const queryCoverage = Math.min(kwTokens.length / queryTokens.length, 1.0);
      score += queryCoverage * 0.7;
    }

    // 2. Sample Phrases (Max overlap, not sum)
    let maxPhraseScore = 0;
    for (const phrase of intent.sample_phrases) {
      const phraseTokens = getTokens(phrase);
      const overlap = queryTokens.filter(t =>
        phraseTokens.includes(t) ||
        phraseTokens.some(pt => t.startsWith(pt) || pt.startsWith(t))
      );
      if (phraseTokens.length > 0) {
        const pScore = (overlap.length / phraseTokens.length) * 0.3;
        if (pScore > maxPhraseScore) {
          maxPhraseScore = pScore;
        }
      }
    }
    score += maxPhraseScore;

    const finalScore = Math.min(score, 1.0);
    if (finalScore > highestScore) {
      highestScore = finalScore;
      bestMatch = intent;
    }
  }

  // Threshold: 0.15
  if (highestScore >= 0.15 && bestMatch) {
    return { intent: bestMatch, score: highestScore };
  }

  return null;
}

// ─── Rule Engine Replies (greetings, etc.) ───────────────────────────────────
function getRuleEngineReply(intent, userName) {
  const helloMsg = userName ? `Hello ${userName}! 👋` : 'Hello there! 👋';
  switch (intent) {
    case 'Greeting':
      return `${helloMsg} I'm your **Vita AI Genixpay** — your personal AI career assistant.\n\nI can help you **analyze your resume**, **build an ATS-friendly resume**, **practice mock interviews**, **generate cover letters**, **match your resume to jobs**, and much more.\n\nWhat would you like to work on today?`;
    case 'Goodbye':
      return "Goodbye! 👋 If you need help with your resume, interview prep, or job applications later, I'll be right here. Good luck out there!";
    case 'Thanks':
      return "You're very welcome! 🚀 Let me know if there's anything else I can help you with on your career journey.";
    case 'Apology':
      return "No worries at all! Let's keep building your career pathway together. What would you like to work on?";
    case 'Confirmation':
      return 'Perfect! What would you like to tackle next — resume analysis, interview practice, cover letter, or job matching?';
    case 'Small Talk':
      return "I'm doing great, fully powered up and ready to help! 💪 What's on your career agenda today?";
    case 'About Bot':
      return "I am **Vita AI Genixpay**, your personal AI career assistant! 🤖 I can help you **analyze your resume**, **build an ATS-friendly resume**, **practice mock interviews**, **generate cover letters**, **match your resume to jobs**, and much more.\n\nWhat would you like to work on today?";
    case 'Spam':
    case 'Meaningless Text':
      return "Hmm, that looks like a random input. Let's focus on your career goals! Ask me about resume tips, interview prep, job matching, or cover letter writing. 🚀";
    default:
      return null;
  }
}

// ─── Service Recommendation Banners (for OpenAI fallback responses) ───────────
const SERVICE_RECOMMENDATIONS = {
  'ATS Help': `\n\n---\n💡 **Try [Resume Analyzer →](/resume/upload)** — Get your ATS score, keyword gaps, and formatting tips instantly!`,
  'Resume Builder Help': `\n\n---\n✏️ **Open [AI Resume Builder →](/resume/builder)** — Edit, rewrite, and export your resume with AI assistance.`,
  'Mock Interview': `\n\n---\n🎙️ **Start [Mock Interview →](/interview)** — Practice with our AI HR recruiter tailored to your target role.`,
  'JD Matching': `\n\n---\n🎯 **Try [Job Matcher →](/resume/match)** — Paste any JD and see your resume match % with actionable tips.`,
  'Cover Letter': `\n\n---\n✉️ **Try [Cover Letter Generator →](/cover-letter)** — Generate a tailored cover letter in seconds.`,
  'Platform Help': `\n\n---\n📤 **Visit [Resume Upload →](/resume/upload)** — Upload your PDF resume and let Vita analyze it in seconds.`,
  'Career Question': `\n\n---\n🗺️ **Update [Your Profile →](/profile)** — Add your target role and skills for personalized career roadmaps.`,
  'Salary Question': `\n\n---\n💰 **Use Salary Mode** — Click the 📊 Salary icon below to get real salary benchmarks and negotiation scripts for any role.`,
};

// ─── Main Preprocessing Entry Point ──────────────────────────────────────────
async function processMessage(payload) {
  const { message, mode, userContext, isAuthenticated } = payload;

  if (!message || message.trim() === '') {
    return {
      reply: 'Please type a message so I can assist you!',
      mode: mode || 'chat',
      classification: 'Meaningless Text',
      matchedFaq: null,
      action: null,
      openaiCalled: false,
      tokensSaved: 0,
    };
  }

  const simpleIntent = classifySimpleIntent(message);
  logger.info(`[Preprocessor] Simple intent: "${simpleIntent}" | auth: ${!!isAuthenticated} | msg: "${message.slice(0, 40)}"`);

  // ── Step 1: Simple intent (greetings, spam, small talk) ──────────────────
  if (['Spam', 'Meaningless Text', 'Greeting', 'Goodbye', 'Thanks', 'Apology', 'Confirmation', 'Small Talk', 'About Bot'].includes(simpleIntent)) {
    // Logged-out: serve static response
    if (!isAuthenticated) {
      const loggedOutReply = getLoggedOutReply(message, simpleIntent, null);
      return {
        reply: loggedOutReply.reply,
        action: loggedOutReply.action,
        mode: mode || 'chat',
        classification: simpleIntent,
        matchedFaq: null,
        openaiCalled: false,
        tokensSaved: estimateTokensSaved(message, true),
      };
    }

    const reply = getRuleEngineReply(simpleIntent, userContext?.userName);
    if (reply) {
      logger.info(`[Preprocessor] Rule engine resolved. Saved: ~${estimateTokensSaved(message)} tokens`);
      return {
        reply,
        action: null,
        mode: mode || 'chat',
        classification: simpleIntent,
        matchedFaq: null,
        openaiCalled: false,
        tokensSaved: estimateTokensSaved(message, true),
      };
    }
  }

  // ── Step 2: Intent/FAQ Matcher ────────────────────────────────────────────
  const intentMatch = matchIntent(message);
  if (intentMatch) {
    const { intent, score } = intentMatch;
    const saved = estimateTokensSaved(message, true);
    logger.info(`[Preprocessor] Intent matched: "${intent.id}" (score: ${score.toFixed(2)}). Saved: ~${saved} tokens`);

    // Logged-out: brief answer + login nudge, navigate to login
    if (!isAuthenticated) {
      const loggedOutReply = getLoggedOutReply(message, simpleIntent, intent);
      return {
        reply: loggedOutReply.reply,
        action: loggedOutReply.action,
        mode: mode || 'chat',
        classification: `Intent:${intent.id}`,
        matchedFaq: intent.id,
        openaiCalled: false,
        tokensSaved: saved,
      };
    }

    // Logged-in: full reply + navigate action to the feature page
    return {
      reply: intent.reply,
      action: {
        type: 'navigate',
        label: intent.nav_label,
        target: intent.target_page,
      },
      mode: mode || 'chat',
      classification: `Intent:${intent.id}`,
      matchedFaq: intent.id,
      openaiCalled: false,
      tokensSaved: saved,
    };
  }

  // ── Step 3: Logged-out unknown query — static response, no OpenAI ─────────
  if (!isAuthenticated) {
    const loggedOutReply = getLoggedOutReply(message, simpleIntent, null);
    return {
      reply: loggedOutReply.reply,
      action: loggedOutReply.action,
      mode: mode || 'chat',
      classification: 'Unknown (logged-out)',
      matchedFaq: null,
      openaiCalled: false,
      tokensSaved: estimateTokensSaved(message, true),
    };
  }

  // ── Step 4: Fallback to OpenAI (authenticated users only) ─────────────────
  logger.info(`[Preprocessor] No local match. Escalating to OpenAI.`);

  // Determine a service recommendation banner to append after the LLM reply
  let classificationForRec = 'Unknown';
  const lowerMsg = message.toLowerCase();
  if (lowerMsg.includes('ats') || lowerMsg.includes('score') || lowerMsg.includes('analyze')) classificationForRec = 'ATS Help';
  else if (lowerMsg.includes('build') || lowerMsg.includes('template') || lowerMsg.includes('pdf') || lowerMsg.includes('export')) classificationForRec = 'Resume Builder Help';
  else if (lowerMsg.includes('interview') || lowerMsg.includes('mock')) classificationForRec = 'Mock Interview';
  else if (lowerMsg.includes('jd') || lowerMsg.includes('job description') || lowerMsg.includes('match')) classificationForRec = 'JD Matching';
  else if (lowerMsg.includes('cover letter')) classificationForRec = 'Cover Letter';
  else if (lowerMsg.includes('salary') || lowerMsg.includes('negotiate') || lowerMsg.includes('pay')) classificationForRec = 'Salary Question';
  else if (lowerMsg.includes('career') || lowerMsg.includes('roadmap') || lowerMsg.includes('skills')) classificationForRec = 'Career Question';

  const serviceRec = SERVICE_RECOMMENDATIONS[classificationForRec] || null;

  return {
    openaiCalled: true,
    classification: classificationForRec,
    matchedFaq: null,
    action: null,
    tokensSaved: 0,
    serviceRecommendation: serviceRec,
  };
}

module.exports = {
  processMessage,
  classifySimpleIntent,
  matchIntent,
  getLoggedOutReply,
};
