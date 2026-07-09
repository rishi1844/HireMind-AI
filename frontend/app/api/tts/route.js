import { NextResponse } from "next/server";

/**
 * POST /api/tts
 * Body: { text: string }
 * Returns: { audioContent: string (base64 MP3), timepoints: [] }
 *
 * Uses OpenAI TTS (tts-1, shimmer voice) — same OpenAI key as /api/interview.
 * No Google Cloud billing needed!
 *
 * Lip-sync is driven client-side via timer-based word scheduling
 * (same approach as useAvatarLipSync hook).
 */
export async function POST(request) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

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

    // Sanitize — strip markdown that would be spoken literally
    const cleanText = text
      .replace(/[*_`#~]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // Call OpenAI TTS API
    // Model: tts-1 (fast, good quality)
    // Voice: onyx = deep professional male — closest to Google en-US-Neural2-D
    // Alternatives: alloy, echo, fable, nova, shimmer
    const ttsRes = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "tts-1",       // Use "tts-1-hd" for higher quality (slower + costs more)
        input: cleanText,
        voice: "shimmer",     // Professional, clear female voice
        response_format: "mp3",
        speed: 0.95,          // Slightly slower = clearer speech
      }),
    });

    if (!ttsRes.ok) {
      const errBody = await ttsRes.text();
      console.error("[TTS/OpenAI] API error:", errBody);
      return NextResponse.json(
        { error: "OpenAI TTS request failed", details: errBody },
        { status: ttsRes.status }
      );
    }

    // Convert audio stream → base64
    const audioBuffer = await ttsRes.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString("base64");

    // Build timer-based word timepoints for lip-sync
    // OpenAI TTS doesn't return word timestamps, so we estimate from text
    // This mirrors the useAvatarLipSync approach: ~140 wpm at speed 0.95
    const words = cleanText.split(/\s+/).filter(Boolean);
    const MS_PER_WORD = Math.round(60000 / (140 * 0.95)); // ~450ms per word

    const timepoints = words.map((word, i) => ({
      word,
      markName: `w${i}`,
      timeSeconds: parseFloat(((i * MS_PER_WORD) / 1000).toFixed(3)),
    }));

    return NextResponse.json({
      audioContent: base64Audio,
      timepoints,
      words,
      provider: "openai", // for debugging
    });
  } catch (err) {
    console.error("[TTS/OpenAI] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}
