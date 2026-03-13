
import { GoogleGenAI, Modality, Chat, GenerateContentResponse, Type } from "@google/genai";
import { SupportedLanguage, DiagnosisResult, NutrientAnalysisResult, InputAnalysisResult, MarketDataResponse, WeatherData, PestIdentificationResult, FarmMappingResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const checkOffline = () => {
  if (!navigator.onLine) {
    throw new Error("You are currently offline. Please check your internet connection and try again.");
  }
};

/**
 * Uses Google Maps Grounding to find details about the farm location.
 */
export const mapFarmLocation = async (lat: number, lng: number, language: SupportedLanguage): Promise<FarmMappingResult> => {
  try {
    checkOffline();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Describe the geographic features and soil type typical for a farm located at latitude ${lat}, longitude ${lng}. 
      Mention if the area is known for specific crops. Respond in ${language}.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: { latitude: lat, longitude: lng }
          }
        }
      }
    });

    const text = response.text || "Information not found.";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const links = groundingChunks
      .filter(chunk => chunk.maps)
      .map(chunk => ({
        title: chunk.maps?.title || "View on Maps",
        uri: chunk.maps?.uri || ""
      }));

    return {
      locationDescription: text,
      areaEstimate: "Calculated by user",
      landSuitability: "High context mapping active",
      links
    };
  } catch (error) {
    console.error("Maps grounding failed:", error);
    return {
      locationDescription: "Could not retrieve detailed maps data. Please check connection.",
      areaEstimate: "N/A",
      landSuitability: "Unknown",
      links: []
    };
  }
};

/**
 * Identifies a pest from an image and provides local advice.
 */
export const identifyPest = async (
  base64Image: string,
  language: SupportedLanguage
): Promise<PestIdentificationResult> => {
  try {
    checkOffline();
    const prompt = `
      Analyze the provided image of a pest (insect, bug, or animal) affecting a farm.
      Identify the pest and provide practical, low-cost, local advice for farmers.
      Return ONLY a valid JSON object in ${language}.

      JSON Structure:
      {
        "pestName": "Name",
        "type": "e.g. Stem Borer",
        "threatLevel": "Low" | "Medium" | "High",
        "description": "Short explanation of the pest's behavior",
        "localRemedies": ["Natural remedy 1", "Local method 2"],
        "preventiveMeasures": ["Step 1", "Step 2"]
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: prompt }
        ]
      }
    });

    const text = response.text || "{}";
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText) as PestIdentificationResult;
  } catch (error) {
    throw new Error("Pest identification failed.");
  }
};

/**
 * Fetches real-time weather using Google Search grounding based on GPS coordinates.
 */
export const fetchWeather = async (lat: number, lng: number, language: SupportedLanguage): Promise<WeatherData> => {
  try {
    checkOffline();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide current weather for GPS (${lat}, ${lng}). 
      Include: Temp (Celsius), Sky Condition, Humidity, and a 1-sentence agronomic advice. Translate to ${language}.
      
      Response Format:
      Location: [City/Area Name]
      Temp: [Number]°C
      Condition: [Short text]
      Humidity: [Number]%
      Forecast: [Farming advice]`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || "";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter(chunk => chunk.web)
      .map(chunk => ({
        title: chunk.web?.title || "Weather Source",
        uri: chunk.web?.uri || ""
      }));

    const locationMatch = text.match(/Location:\s*(.*)/i);
    const tempMatch = text.match(/Temp:\s*([\d°C]+)/i);
    const condMatch = text.match(/Condition:\s*(.*)/i);
    const humMatch = text.match(/Humidity:\s*([\d%]+)/i);
    const foreMatch = text.match(/Forecast:\s*(.*)/i);

    return {
      locationName: locationMatch ? locationMatch[1].trim() : "Nearby Farm",
      temp: tempMatch ? tempMatch[1].trim() : "26°C",
      condition: condMatch ? condMatch[1].trim() : "Cloudy",
      humidity: humMatch ? humMatch[1].trim() : "65%",
      forecast: foreMatch ? foreMatch[1].trim() : "Check soil moisture before irrigation.",
      sources
    };
  } catch (error) {
    return {
      locationName: "Region Area",
      temp: "--°C",
      condition: "Update required",
      humidity: "--%",
      forecast: "Connect to network for local advice.",
      sources: []
    };
  }
};

export const fetchMarketPrices = async (location: string = "Nigeria"): Promise<MarketDataResponse> => {
  try {
    checkOffline();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide the latest market prices for major crops in ${location}.`,
      config: { tools: [{ googleSearch: {} }] }
    });
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks.filter(chunk => chunk.web).map(chunk => ({ title: chunk.web?.title || "Market", uri: chunk.web?.uri || "" }));
    const crops = ["Maize", "Rice", "Cassava", "Yam"];
    const prices = crops.map(crop => ({ crop, price: "Check Live", trend: 'up' as any, location }));
    return { prices, sources };
  } catch (error) { return { prices: [], sources: [] }; }
};

export const getDailyTip = async (language: SupportedLanguage): Promise<string> => {
  try {
    checkOffline();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Short agronomy tip in ${language}.`,
    });
    return response.text || "Plant early.";
  } catch (e) { return "Check crops."; }
};

export const analyzeCropImage = async (base64Image: string, language: SupportedLanguage): Promise<DiagnosisResult> => {
  checkOffline();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ inlineData: { mimeType: 'image/jpeg', data: base64Image } }, { text: `Analyze crop. JSON in ${language}.` }] }
  });
  return JSON.parse(response.text?.replace(/```json|```/g, '').trim() || "{}");
};

export const analyzeNutrientDeficiency = async (
  base64: string, 
  crop: string, 
  age: string, 
  language: SupportedLanguage
): Promise<NutrientAnalysisResult> => {
  checkOffline();
  const prompt = `
    Perform a nutrient analysis on the provided crop image.
    Crop Metadata:
    - Name: ${crop || "Unknown"}
    - Growth Stage: ${age || "Unknown"}

    Identify potential deficiencies (Nitrogen, Phosphorus, Potassium, etc.) and visual symptoms.
    Provide 3 tiered options for the farmer:
    A: Organic/Local (No/Low cost)
    B: Low Cost (Common regional fertilizers)
    C: Best Practice (High yield approach)

    Return ONLY a valid JSON object in ${language}.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { 
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64 } }, 
        { text: prompt } 
      ] 
    }
  });

  const text = response.text || "{}";
  const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleanText) as NutrientAnalysisResult;
};

export const analyzeFarmInput = async (base64: string, language: SupportedLanguage): Promise<InputAnalysisResult> => {
  checkOffline();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ inlineData: { mimeType: 'image/jpeg', data: base64 } }, { text: `Input analysis. JSON in ${language}.` }] }
  });
  return JSON.parse(response.text?.replace(/```json|```/g, '').trim() || "{}");
};

export const generateSpeech = async (text: string, language: SupportedLanguage): Promise<AudioBuffer | null> => {
  try {
    checkOffline();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } }
    });
    const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64) return null;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    return await decodeAudioData(decode(base64), ctx, 24000, 1);
  } catch (e) { return null; }
};

export const createChatSession = (l: SupportedLanguage, c?: string, h?: any[]): Chat => {
  checkOffline();
  return ai.chats.create({ model: 'gemini-3-flash-preview', history: h, config: { systemInstruction: `Noma advisor in ${l}. ${c}` } });
};
export const sendChatMessage = async (chat: Chat, m: string): Promise<string> => {
  checkOffline();
  return (await chat.sendMessage({ message: m })).text || "";
};

function decode(b: string) {
  const s = atob(b);
  const bt = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) bt[i] = s.charCodeAt(i);
  return bt;
}
async function decodeAudioData(d: Uint8Array, ctx: AudioContext, r: number, c: number) {
  const i16 = new Int16Array(d.buffer);
  const b = ctx.createBuffer(c, i16.length, r);
  const cd = b.getChannelData(0);
  for (let i = 0; i < i16.length; i++) cd[i] = i16[i] / 32768.0;
  return b;
}
