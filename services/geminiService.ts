import { GoogleGenAI, Type } from "@google/genai";
import { ISMElement, SSIMValue } from "../types";

// Helper to get client safely
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateFactors = async (topic: string): Promise<ISMElement[]> => {
  const ai = getClient();
  const prompt = `Generate a list of 5 to 10 key factors/barriers/elements for Interpretive Structural Modelling (ISM) regarding the topic: "${topic}". 
  Return purely a JSON array of objects with 'name' and 'description'.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
          },
          required: ['name', 'description'],
        },
      },
    },
  });

  const raw = JSON.parse(response.text || "[]");
  return raw.map((item: any, idx: number) => ({
    id: `factor-${Date.now()}-${idx}`,
    name: item.name,
    description: item.description
  }));
};

/**
 * Suggests an SSIM relationship (V, A, X, O) between two elements.
 */
export const suggestRelationship = async (topic: string, elemA: ISMElement, elemB: ISMElement): Promise<SSIMValue> => {
  const ai = getClient();
  const prompt = `Context: ${topic}.
  We are building an ISM model.
  Element A: ${elemA.name} (${elemA.description || ''})
  Element B: ${elemB.name} (${elemB.description || ''})

  Determine the contextual influence relationship between A and B.
  Rules:
  - If A directly leads to/causes/influences B, return 'V'.
  - If B directly leads to/causes/influences A, return 'A'.
  - If they strongly influence each other, return 'X'.
  - If they are unrelated, return 'O'.

  Return a JSON object with a single field 'relation'.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            relation: { type: Type.STRING, enum: ['V', 'A', 'X', 'O'] }
          }
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    return (data.relation as SSIMValue) || SSIMValue.O;
  } catch (e) {
    console.error("Gemini suggestion failed", e);
    return SSIMValue.O;
  }
};
