
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
      You are an expert data entry assistant for a study abroad agency "FangYang Nexus".
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
      - department (Specific college or faculty name if mentioned, e.g. "School of Engineering")
      - qsRanking (Number, global ranking if available, else null)
      - usNewsRanking (Number, national ranking if available, else null)
      - tuitionRange (e.g., "$30k - $40k")
      - requirements (Object with gpa, toefl, ielts, sat fields if found)
      - tags (Array of keywords like STEM, Boarding, Urban, Ranking info)
      - description (A short summary in Traditional Chinese)

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
            department: { type: Type.STRING },
            qsRanking: { type: Type.NUMBER },
            usNewsRanking: { type: Type.NUMBER },
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
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            description: { type: Type.STRING }
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
 */
export const chatWithKnowledgeBase = async (
  query: string, 
  contextDocs: string
): Promise<ChatResponse> => {
  try {
    const systemInstruction = `
      You are "FangYang Nexus AI", an advanced assistant for EduConnect study abroad consultants.
      Your users are consultants.
      
      Your Role:
      1. Answer questions about schools, application processes (US/UK/CA/AU), terminology, and sales scripts.
      2. Use the provided CONTEXT strictly to answer. 
      3. If the answer is found in the CONTEXT, you MUST cite the source ID and Title.
      4. Tone: Professional, helpful, encouraging. Use Traditional Chinese (Taiwan).
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

/**
 * Analyze School Placement based on student profile and database.
 */
export const analyzeSchoolPlacement = async (
  studentProfile: { gpa: string; testScores: string; major: string; preferences: string },
  schools: School[],
  schoolCount: number = 3
): Promise<{ dream: School[], match: School[], safety: School[], reasoning: string }> => {
  try {
    const schoolContext = schools.map(s => ({
      id: s.id,
      name: s.name,
      qs: s.qsRanking,
      usnews: s.usNewsRanking,
      reqs: s.requirements,
      programs: s.programs
    }));

    const prompt = `
      Student Profile:
      - GPA: ${studentProfile.gpa}
      - Tests: ${studentProfile.testScores}
      - Target Major: ${studentProfile.major}
      - Prefs: ${studentProfile.preferences}

      Available Schools Database:
      ${JSON.stringify(schoolContext)}

      Task:
      Select EXACTLY ${schoolCount} schools from the database that fit the student.
      Categorize them into 3 lists: Dream (Reach), Match (Target), Safety (Likely).
      
      Rules:
      1. The total number of schools across dreamIds, matchIds, and safetyIds MUST be exactly ${schoolCount}.
      2. Only pick schools that actually exist in the provided database.
      3. Distribute them logically based on the student profile.
      
      Return JSON with:
      - dreamIds: Array of school IDs
      - matchIds: Array of school IDs
      - safetyIds: Array of school IDs
      - reasoning: A brief analysis in Traditional Chinese explaining the strategy.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dreamIds: { type: Type.ARRAY, items: { type: Type.STRING } },
            matchIds: { type: Type.ARRAY, items: { type: Type.STRING } },
            safetyIds: { type: Type.ARRAY, items: { type: Type.STRING } },
            reasoning: { type: Type.STRING }
          }
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    
    return {
      dream: schools.filter(s => result.dreamIds?.includes(s.id)),
      match: schools.filter(s => result.matchIds?.includes(s.id)),
      safety: schools.filter(s => result.safetyIds?.includes(s.id)),
      reasoning: result.reasoning || "無法產生分析報告。"
    };

  } catch (error) {
    console.error("Placement Analysis Error:", error);
    throw error;
  }
}
