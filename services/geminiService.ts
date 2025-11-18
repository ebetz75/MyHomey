import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GeminiAnalysisResult, CATEGORIES, ROOMS } from '../types';

const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeItemImage = async (base64Image: string): Promise<GeminiAnalysisResult> => {
  const ai = getClient();

  // Clean base64 string if it has the data prefix
  const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: "A short, clear name for the item identified in the image.",
      },
      category: {
        type: Type.STRING,
        description: "The best fitting category.",
        enum: CATEGORIES
      },
      room: {
        type: Type.STRING,
        description: "Infer the most likely room this item belongs in.",
        enum: ROOMS
      },
      estimatedValue: {
        type: Type.NUMBER,
        description: "An estimated current resale value in USD.",
      },
      description: {
        type: Type.STRING,
        description: "A concise description including brand, color, and material.",
      },
      conveyance: {
        type: Type.STRING,
        description: "Determine if this item typically 'Stays' with a house when sold (Fixture) or leaves with the owner (Personal). E.g. Fridge/Stove usually Fixture, Sofa is Personal.",
        enum: ['Personal', 'Fixture', 'Negotiable']
      },
      serialNumber: {
        type: Type.STRING,
        description: "If a serial number label is clearly visible in the text, extract it. Otherwise null.",
        nullable: true
      },
      modelNumber: {
        type: Type.STRING,
        description: "If a model number label is clearly visible in the text, extract it. Otherwise null.",
        nullable: true
      }
    },
    required: ["name", "category", "room", "estimatedValue", "description", "conveyance"],
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64,
            },
          },
          {
            text: "Analyze this image for a home inventory ledger used for insurance and real estate. Identify the item. If it is a major appliance or system, look for text that might be a serial or model number. Decide if this item usually stays with the home (Fixture) or moves with the owner (Personal).",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as GeminiAnalysisResult;
    }
    throw new Error("No response text from Gemini");
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    throw error;
  }
};
