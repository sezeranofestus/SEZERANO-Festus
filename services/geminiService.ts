
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { SystemConfig } from "../types";

let genAIInstance: GoogleGenAI | null = null;

export const getAI = () => {
  if (!genAIInstance) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY_MISSING: Please set VITE_GEMINI_API_KEY in your environment variables.");
    }
    genAIInstance = new GoogleGenAI({ apiKey });
  }
  return genAIInstance;
};

export const models = {
  flash: 'gemini-3-flash-preview',
  pro: 'gemini-3-pro-preview',
  image: 'gemini-2.5-flash-image', // Nano Banana Engine
  proImage: 'gemini-3-pro-image-preview', // Nano Banana Pro Engine
  live: 'gemini-2.5-flash-native-audio-preview-09-2025'
};

async function callWithStability<T>(
  taskKey: string, 
  fn: () => Promise<T>, 
  retries = 2, 
  delay = 1000
): Promise<T> {
  const TIMEOUT_MS = 25000;

  try {
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("STABILITY_TIMEOUT")), TIMEOUT_MS)
    );

    return await Promise.race([fn(), timeout]) as T;
  } catch (error: any) {
    const msg = error.message?.toLowerCase() || '';
    
    // Specific non-retryable errors
    if (msg.includes('permission_denied') || msg.includes('403')) {
      throw new Error("STABILITY_PERMISSION_DENIED");
    }
    if (msg.includes('invalid_argument') || msg.includes('400')) {
      throw new Error("STABILITY_CONFIG_ERROR");
    }

    const isRetryable = msg.includes('timeout') || msg.includes('429') || msg.includes('500') || msg.includes('503') || msg.includes('fetch');

    if (retries > 0 && isRetryable) {
      await new Promise(r => setTimeout(r, delay));
      return callWithStability(taskKey, fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

/**
 * FESTUS AI MULTIMODAL PROTOCOL
 * Enforces creative studio identity and strict response controls.
 */
export async function* streamChat(
  message: string, 
  history: any[] = [], 
  mode: string = 'CHAT', 
  systemConfig: SystemConfig
) {
  const ai = getAI();
  const modelToUse = systemConfig.globalModel === 'pro' ? models.pro : models.flash;
  const taskKey = `chat-${message.slice(0, 30)}`;

  const qualityProtocol = `
    FESTUS AI OPERATIONAL PROTOCOL:
    - IDENTITY: You are FESTUS AI, the Ultra Multi-Platform Intelligence Engine.
    - CONCISE: No introductions. Answer only what is asked in a few understandable lines. Start with simple/short words.
    - STRUCTURE: For complex research, use the mandatory structure: 🔎 SEARCH SUMMARY, 📌 BEST RESULT, 🌐 ALTERNATIVE SOURCES, 🧠 SYNTHESIZED INSIGHT.
    - MEDIA: For songs, images, videos, or documents, follow the specific formatting rules provided in your system instructions.
    - STYLE: Professional, structured, and efficient. No unnecessary emojis.
    - INTEGRITY: Do not alter pre-built features. Respect system architecture.
    - SAFETY: Never hallucinate data. If unsure, state it clearly.
    - MEMORY: Use previous conversation context to provide relevant answers.
  `;

  const config: any = {
    systemInstruction: `${systemConfig.instruction}\n\n${qualityProtocol}`,
    temperature: 0.2,
    topP: 0.95,
  };

  if (systemConfig.responseSpeed === 'precision') {
    config.thinkingConfig = { thinkingBudget: 16000 };
  }
  
  if (mode === 'SEARCH') config.tools = [{ googleSearch: {} }];

  const responseStream = await callWithStability(taskKey, () => ai.models.generateContentStream({
    model: modelToUse,
    contents: [...history, { role: 'user', parts: [{ text: message }] }],
    config,
  }));

  for await (const chunk of (responseStream as any)) {
    if (chunk.text) yield { 
      text: chunk.text, 
      groundingMetadata: chunk.candidates?.[0]?.groundingMetadata,
    };
  }
}

export async function generateImage(
  prompt: string, 
  options: { aspectRatio?: "1:1" | "4:3" | "16:9" | "9:16", imageSize?: "1K" | "2K" | "4K", negativePrompt?: string } = {}
) {
  if (!prompt) throw new Error("Prompt required.");
  const ai = getAI();
  return callWithStability(`gen-${prompt.slice(0, 20)}`, async () => {
    const isPro = options.imageSize === "2K" || options.imageSize === "4K";
    const model = isPro ? models.proImage : models.image;
    
    const imageConfig: any = { 
      aspectRatio: options.aspectRatio || "1:1",
    };
    if (isPro) imageConfig.imageSize = options.imageSize;

    // Enhance logo prompts automatically
    let finalPrompt = prompt;
    if (prompt.toLowerCase().includes('logo')) {
      finalPrompt = `PROFESSIONAL 4K LOGO: ${prompt}, minimalist vector style, clean sharp edges, premium professional typography, balanced composition, branding-ready identity, transparent background, high-end design aesthetics.`;
    } else if (prompt.toLowerCase().includes('art') || prompt.toLowerCase().includes('style')) {
      finalPrompt = `HIGH-DEFINITION ARTISTIC RENDER: ${prompt}, cinematic lighting, 8k resolution, hyper-realistic textures, masterpiece quality, detailed environment.`;
    }

    const fullPrompt = options.negativePrompt ? `${finalPrompt} [NEGATIVE: ${options.negativePrompt}]` : finalPrompt;

    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: fullPrompt }] },
      config: { imageConfig }
    });

    const part = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
    if (part) return `data:image/png;base64,${part.inlineData.data}`;
    throw new Error("Visual synthesis failed.");
  });
}

export async function proEditImage(
  base64Image: string, 
  mimeType: string, 
  instruction: string,
  parameters: any = {}
) {
  const ai = getAI();
  const taskKey = `pro-edit-${instruction.slice(0, 20)}`;

  const editingProtocol = `
    NANO BANANA ENGINE PROTOCOL:
    - Target: Ultra High Fidelity, Edge-Aware, Texture Preservation.
    - Task: ${instruction}
    - Constraints: Maintain realism or requested stylization. Build upon the base image without destructive artifacts.
    - Special Handling:
      * If "Remove Background": Isolate subject perfectly, transparent background.
      * If "Smart Retouch": Enhance lighting, skin tones, and details subtly.
      * If "Style Transfer": Apply artistic style while keeping subject structure.
  `;

  return callWithStability(taskKey, async () => {
    const response = await ai.models.generateContent({
      model: models.image,
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType } },
          { text: editingProtocol }
        ]
      },
      config: {
        imageConfig: { aspectRatio: parameters.aspectRatio || "1:1" }
      }
    });

    const part = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
    if (part) return `data:image/png;base64,${part.inlineData.data}`;
    throw new Error("Transformation failed.");
  });
}

export async function editImage(base64: string, mime: string, prompt: string, options: any = {}) {
  return proEditImage(base64, mime, prompt, options);
}

export async function analyzeImage(prompt: string, base64Image: string, mimeType: string, systemConfig: SystemConfig) {
  const ai = getAI();
  return callWithStability(`vision-${prompt.slice(0, 20)}`, async () => {
    const response = await ai.models.generateContent({
      model: models.flash,
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType } },
          { text: prompt }
        ]
      }
    });
    return response.text;
  });
}
