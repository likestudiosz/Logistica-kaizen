
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Order, Driver } from "../types";

export const getLogisticsInsights = async (orders: Order[], drivers: Driver[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Analyze the following fleet status and provide a brief optimization report (max 3 bullet points):
        Orders: ${JSON.stringify(orders)}
        Drivers: ${JSON.stringify(drivers)}
        Focus on geographic efficiency and driver load.
      `,
      config: {
        tools: [{ googleMaps: {} }],
        // Providing a default center for the grounding context (São Paulo)
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: -23.5505,
              longitude: -46.6333
            }
          }
        }
      }
    });
    
    return {
      text: response.text || "Nenhum insight disponível no momento.",
      groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (err) {
    console.error("Gemini Error:", err);
    return { text: "Não foi possível gerar insights no momento.", groundingChunks: [] };
  }
};

export const getDeliveryEstimate = async (status: string, destination: string, currentLoc?: { lat: number, lng: number }) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const contents = `The order is ${status} going to ${destination}. ${currentLoc ? `The driver is currently at ${currentLoc.lat}, ${currentLoc.lng}.` : ''} 
    Provide a friendly short update for the customer about the delivery status and the surrounding area if relevant.`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: currentLoc ? {
              latitude: currentLoc.lat,
              longitude: currentLoc.lng
            } : {
              latitude: -23.5505,
              longitude: -46.6333
            }
          }
        }
      },
    });
    
    return {
      text: response.text || "Seu pedido está sendo processado com cuidado.",
      groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (err) {
    console.error("Estimate Error:", err);
    return { text: "Seu pedido está sendo processado com cuidado.", groundingChunks: [] };
  }
};
