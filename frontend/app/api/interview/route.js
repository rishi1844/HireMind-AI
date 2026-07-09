import { NextResponse } from "next/server";

/**
 * POST /api/interview
 * Body: { messages: OpenAI-format message array, exchangeCount?: number }
 * Returns: { reply: string }
 *
 * GPT-4o powers "Alex", a professional HR interviewer AI.
 * Keeps responses concise (≤3 sentences) for natural avatar speech.
 */

const SYSTEM_PROMPT = `You are Alex, a warm and professional HR interviewer conducting a mock job interview.

Rules you must follow:
1. Ask EXACTLY one interview question per response — never more.
2. Keep every response under 3 sentences maximum.
3. Be encouraging and professional. Start with a brief positive acknowledgment of the candidate's previous answer (if any), then ask your next question.
4. Progress naturally through interview stages: opening/intro → behavioral → technical/skills → situational → closing.
5. After the candidate has answered 8 questions total, switch to feedback mode: give a concise 2-3 sentence summary of their overall performance, highlight one key strength and one area to improve, then say goodbye warmly.
6. Never break character. Never reveal you are an AI model unless directly asked.
7. Do NOT use markdown, bullet points, or headers in your response — plain conversational text only.`;

export async function POST(request) {
  try {
    const { messages = [], exchangeCount = 0 } = await request.json();

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === "your_openai_api_key_here" || !apiKey.startsWith("sk-")) {
      return NextResponse.json(
        {
          error: "OPENAI_API_KEY not configured",
          hint: "Add your OpenAI key to frontend/.env.local: OPENAI_API_KEY=sk-proj-...",
        },
        { status: 500 }
      );
    }

    // Build the full message array with system prompt
    const openAiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages,
    ];

    // If this is the very first message (no user messages yet), prime with an opening
    const hasUserMessage = messages.some((m) => m.role === "user");
    if (!hasUserMessage) {
      openAiMessages.push({
        role: "user",
        content:
          "Please start the interview with a warm introduction and your first question.",
      });
    }

    const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: openAiMessages,
        max_tokens: 200,
        temperature: 0.75,
        presence_penalty: 0.3,
      }),
    });

    if (!openAiRes.ok) {
      const errBody = await openAiRes.text();
      console.error("[Interview] OpenAI API error:", errBody);

      // Fallback to gpt-3.5-turbo if 4o quota is exceeded
      if (openAiRes.status === 429 || openAiRes.status === 503) {
        const fallbackRes = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "gpt-3.5-turbo",
              messages: openAiMessages,
              max_tokens: 200,
              temperature: 0.75,
            }),
          }
        );
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          const reply =
            fallbackData.choices?.[0]?.message?.content?.trim() ?? "";
          return NextResponse.json({ reply });
        }
      }

      return NextResponse.json(
        { error: "OpenAI request failed", details: errBody },
        { status: openAiRes.status }
      );
    }

    const data = await openAiRes.json();
    const reply = data.choices?.[0]?.message?.content?.trim() ?? "";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[Interview] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}
