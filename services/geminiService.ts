import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';

// Initialize client only if key exists (handled gracefully in UI if not)
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateDinoFact = async (): Promise<string> => {
  if (!ai) {
    return "Ask your parents to set the API Key to learn cool dino facts!";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Tell me a very short, fun, and simple fact about dinosaurs for a 4-year-old boy. Keep it under 20 words. Be enthusiastic!",
      config: {
        thinkingConfig: { thinkingBudget: 0 }, // Fast response
      }
    });

    return response.text || "Dinosaurs are awesome!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Dinosaurs roared really loud! ROAR!";
  }
};
