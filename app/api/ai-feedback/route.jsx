import OpenAI from "openai";
import { FEEDBACK_PROMPT } from "@/services/Constants";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { conversation } = await req.json();

    // Convert conversation object to a clean JSON string
    const convoString = JSON.stringify(conversation, null, 2);

    // Build final prompt
    const FINAL_PROMPT = FEEDBACK_PROMPT.replace("{{conversation}}", convoString);

    // Initialize OpenRouter client
    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    // Call FREE model (DeepSeek free removed)
    const completion = await openai.chat.completions.create({
      model: "mistralai/mistral-7b-instruct:free",  // ✅ FREE + stable
      messages: [
        { role: "user", content: FINAL_PROMPT }
      ],
    });

    // Extract AI response
    let content = completion?.choices?.[0]?.message?.content || "";

    // Clean unwanted DeepSeek-like thinking blocks (safe for all models)
    content = content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    return NextResponse.json({ content });
  } catch (e) {
    console.error("Feedback API Error:", e);
    return NextResponse.json({ error: true, details: e });
  }
}
