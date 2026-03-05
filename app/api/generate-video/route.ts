import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const maxDuration = 300; // 5 minutes max for video generation

export async function POST(req: NextRequest) {
  try {
    const {
      prompt,
      firstFrameBase64,
      firstFrameMimeType,
      lastFrameBase64,
      lastFrameMimeType,
      aspectRatio,
      durationSeconds,
      resolution,
      negativePrompt,
      model,
    } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Build the image objects (Image type: { imageBytes, mimeType })
    const firstFrameImage = firstFrameBase64
      ? {
          imageBytes: firstFrameBase64,
          mimeType: firstFrameMimeType || "image/png",
        }
      : undefined;

    const lastFrameImage = lastFrameBase64
      ? {
          imageBytes: lastFrameBase64,
          mimeType: lastFrameMimeType || "image/png",
        }
      : undefined;

    // Build config
    const config: any = {
      aspectRatio: aspectRatio || "16:9",
      numberOfVideos: 1,
    };

    if (durationSeconds) {
      config.durationSeconds = parseInt(durationSeconds);
    }

    if (negativePrompt) {
      config.negativePrompt = negativePrompt;
    }

    if (lastFrameImage) {
      config.lastFrame = lastFrameImage;
    }

    // Generate video
    let operation;
    if (firstFrameImage) {
      operation = await ai.models.generateVideos({
        model: model || "veo-3.1-generate-preview",
        prompt,
        image: firstFrameImage,
        config,
      });
    } else {
      operation = await ai.models.generateVideos({
        model: model || "veo-3.1-generate-preview",
        prompt,
        config,
      });
    }

    // Poll for completion
    const maxAttempts = 30;
    const pollInterval = 10000; // 10 seconds
    let attempts = 0;

    while (!operation.done && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
      operation = await ai.operations.getVideosOperation({ operation: operation });
      attempts++;
    }

    if (!operation.done) {
      return NextResponse.json(
        { error: "Video generation timed out. Please try again." },
        { status: 504 }
      );
    }

    // Extract video
    const response = operation.response;
    console.log(
      "Video generation response:",
      JSON.stringify(response, null, 2)
    );

    if (
      !response ||
      !response.generatedVideos ||
      response.generatedVideos.length === 0
    ) {
      return NextResponse.json(
        { error: "No video was generated. Try a different prompt." },
        { status: 500 }
      );
    }

    const generatedVideo = response.generatedVideos[0].video;
    console.log(
      "Generated video object keys:",
      generatedVideo ? Object.keys(generatedVideo) : "null"
    );

    // Try videoBytes first, then fall back to URI download
    let videoBase64 = generatedVideo?.videoBytes;

    if (!videoBase64 && generatedVideo?.uri) {
      console.log("Downloading video from URI:", generatedVideo.uri);
      // Append API key for authenticated access
      const separator = generatedVideo.uri.includes("?") ? "&" : "?";
      const authedUri = `${generatedVideo.uri}${separator}key=${process.env.GEMINI_API_KEY}`;
      const videoRes = await fetch(authedUri);
      if (!videoRes.ok) {
        // Try alt header-based auth if query param fails
        console.log("Query param auth failed, trying header auth...");
        const videoRes2 = await fetch(generatedVideo.uri, {
          headers: {
            "x-goog-api-key": process.env.GEMINI_API_KEY!,
          },
        });
        if (!videoRes2.ok) {
          return NextResponse.json(
            { error: `Failed to download video from URI: ${videoRes2.status}` },
            { status: 500 }
          );
        }
        const arrayBuffer = await videoRes2.arrayBuffer();
        videoBase64 = Buffer.from(arrayBuffer).toString("base64");
      } else {
        const arrayBuffer = await videoRes.arrayBuffer();
        videoBase64 = Buffer.from(arrayBuffer).toString("base64");
      }
    }

    if (!videoBase64) {
      return NextResponse.json(
        {
          error: "Video data is empty. Response: " +
            JSON.stringify(generatedVideo),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      videoData: videoBase64,
      mimeType: "video/mp4",
    });
  } catch (error: any) {
    console.error("Video generation error:", error);
    const message =
      error?.message || "Failed to generate video";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
