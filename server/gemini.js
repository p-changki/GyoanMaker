/* eslint-disable @typescript-eslint/no-require-imports */
const { GoogleGenAI } = require("@google/genai");
const { SYSTEM_INSTRUCTION } = require("./prompt");

const MODEL_NAME = "gemini-3.1-pro-preview";

function createGeminiClient(apiKey = process.env.GOOGLE_CLOUD_API_KEY) {
  if (!apiKey) {
    throw new Error("MISSING_GOOGLE_CLOUD_API_KEY");
  }

  return new GoogleGenAI({ apiKey });
}

function extractText(response) {
  if (typeof response?.text === "string") {
    return response.text;
  }

  const parts = response?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    return parts
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

async function generateOnePassage(ai, passage) {
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    },
    contents: passage,
  });

  return extractText(response).trim();
}

module.exports = {
  MODEL_NAME,
  createGeminiClient,
  generateOnePassage,
};
