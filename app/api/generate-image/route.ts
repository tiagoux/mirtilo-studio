import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const { prompt, aspectRatio, resolution } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Map resolution to size hints in the prompt
    const resMap: Record<string, string> = {
      "1K": "1024px",
      "2K": "2048px",
      "4K": "4096px",
    };
    const resHint = resMap[resolution] || "1024px";

    const enhancedPrompt = `${prompt}. Aspect ratio: ${aspectRatio}. High resolution: ${resHint}.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation", // gemini-3-pro-image-preview when available
      contents: [{ role: "user", parts: [{ text: enhancedPrompt }] }],
      config: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    });

    // Parse the response to find image data
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      return NextResponse.json(
        { error: "No response from model" },
        { status: 500 }
      );
    }

    const parts = candidates[0].content?.parts;
    if (!parts) {
      return NextResponse.json(
        { error: "No content in response" },
        { status: 500 }
      );
    }

    // Find the inline image data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imagePart = parts.find((part: any) => part.inlineData);
    if (!imagePart || !imagePart.inlineData) {
      return NextResponse.json(
        { error: "No image generated. Try a different prompt." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      imageData: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType || "image/png",
    });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Image generation error:", error);
    const message =
      error?.message || "Failed to generate image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
