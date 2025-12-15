import { GoogleGenAI, Type } from "@google/genai";
import { School, Citation } from '../types';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Simulates parsing a "file" (raw text) using Gemini to extract structured School data.
 */
export const parseSchoolDocument = async (fileName: string, fileContentMock: string): Promise<Partial<School>> => {
  try {
    const prompt = `
      You are an expert data entry assistant for a study abroad agency.
      I have a document named "${fileName}".
      Here is the raw text content from a partner school's manual:
      """
      ${fileContentMock}
      """

      Please extract the following information into a JSON object:
      - name (School Name)
      - location (City, State/Province)
      - country
      - type (University, High School, or Language School)
      - programs (Array of key program names mentioned)
      - tuitionRange (e.g., "$30k - $40k")
      - requirements (Object with gpa, toefl, ielts, sat fields if found)
      - tags (Array of keywords like STEM, Boarding, Urban, Ranking info)

      If information is missing, use reasonable estimations based on the school name or leave blank/generic.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            location: { type: Type.STRING },
            country: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['University', 'High School', 'Language School'] },
            programs: { type: Type.ARRAY, items: { type: Type.STRING } },
            tuitionRange: { type: Type.STRING },
            requirements: {
              type: Type.OBJECT,
              properties: {
                gpa: { type: Type.STRING },
                toefl: { type: Type.STRING },
                ielts: { type: Type.STRING },
                sat: { type: Type.STRING },
              }
            },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    return JSON.parse(text) as Partial<School>;

  } catch (error) {
    console.error("Gemini Parse Error:", error);
    throw error;
  }
};

interface ChatResponse {
  answer: string;
  sources: Citation[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Chat with the AI Assistant using context from the Knowledge Base.
 * Returns structured data including citations and confidence.
 */
export const chatWithKnowledgeBase = async (
  query: string, 
  contextDocs: string
): Promise<ChatResponse> => {
  try {
    const systemInstruction = `
      You are an advanced "Knowledge Base Assistant" (Q&A Chatbot) for EduConnect, a study abroad agency in Taiwan.
      Your users are junior consultants (avg age 25).
      
      Your Role:
      1. Answer questions about schools, application processes (US/UK/CA/AU), terminology (STEM, ATAS, etc.), and sales scripts.
      2. Use the provided CONTEXT strictly to answer. 
      3. If the answer is found in the CONTEXT, you MUST cite the source ID and Title.
      4. If the answer is NOT in the context, you may use your general knowledge but mark confidence as "LOW" or "MEDIUM" and explicitly state that this is general advice, not from the internal docs.
      5. Tone: Professional, helpful, encouraging. Use Traditional Chinese (Taiwan).
      6. For terminology (ATAS, OPT, etc.), provide clear, beginner-friendly definitions.
    `;

    const prompt = `
      CONTEXT DATABASE:
      ${contextDocs}

      USER QUESTION:
      ${query}
      
      Output JSON with:
      - answer: The response text.
      - sources: Array of objects {id, title, type} used to answer.
      - confidence: "HIGH", "MEDIUM", or "LOW".
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: { type: Type.STRING },
            sources: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['SCHOOL', 'WIKI'] }
                }
              }
            },
            confidence: { type: Type.STRING, enum: ['HIGH', 'MEDIUM', 'LOW'] }
          }
        }
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response");

    return JSON.parse(text) as ChatResponse;
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return {
      answer: "系統暫時無法處理您的請求，請稍後再試。",
      sources: [],
      confidence: 'LOW'
    };
  }
};