import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  image?: string; // base64 string
}

export async function* sendMessageStream(message: string, history: Message[], image?: string) {
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: "You are Helix AI, a sophisticated, helpful, and highly intelligent AI assistant. Your tone is professional yet approachable, clear, and insightful. You excel at complex reasoning, creative writing, and technical explanations. Use Markdown for formatting. IMPORTANT: Use relevant emojis naturally throughout your responses to make them more engaging and friendly. Keep responses concise but thorough. You can see and analyze images if the user provides them.",
    },
    history: history.map(msg => {
      const parts: any[] = [{ text: msg.text }];
      if (msg.image) {
        parts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: msg.image.split(',')[1]
          }
        });
      }
      return {
        role: msg.role,
        parts
      };
    })
  });

  const parts: any[] = [{ text: message }];
  if (image) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: image.split(',')[1]
      }
    });
  }

  const result = await chat.sendMessageStream({ message: parts });
  
  for await (const chunk of result) {
    const c = chunk as GenerateContentResponse;
    yield c.text || "";
  }
}
