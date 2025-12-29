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
      model: 'gemini-3-flash-preview',
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
      你現在是 "FangYang Nexus AI"，是專門為留學顧問設計的高級助手。
      
      你的任務與規則：
      1. 根據提供的 CONTEXT 資料庫回答關於學校、申請流程、專有名詞、銷售話術及內部公告的問題。
      2. 必須嚴格遵守 CONTEXT 內容。如果資料庫中沒有相關資訊，請誠實告知，不要胡編亂造。
      3. **重要安全規則**：嚴禁在 "answer" 欄位的文字中顯示任何資料庫 ID 字串（如 iUDRH2zWo...）。
      4. **引用規範**：若回答引用了資料庫內容，請將對應的 ID 和標題放入 JSON 回傳結構中的 "sources" 陣列中，絕對不要寫在對話文字內。
      5. 語氣：專業、熱情、簡潔且具建設性。使用繁體中文（台灣習慣）。
    `;

    const prompt = `
      CONTEXT DATABASE:
      ${contextDocs}

      USER QUESTION:
      ${query}
      
      Output JSON with:
      - answer: 你的回答文字。嚴禁包含任何 ID 字串或 "(ID: ...)"。
      - sources: 被引用的資料來源物件陣列 [{id, title, type}]。
      - confidence: "HIGH", "MEDIUM", or "LOW"。
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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
                  type: { type: Type.STRING, enum: ['SCHOOL', 'WIKI', 'ANNOUNCEMENT'] }
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

interface AnalysisResponse {
  dreamIds: string[];
  matchIds: string[];
  safetyIds: string[];
  reasoning: string;
}

/**
 * Uses gemini-3-pro-preview for complex reasoning task of matching student data to school database.
 */
export const analyzeSchoolPlacement = async (
  formData: { gpa: string; testScores: string; major: string; preferences: string },
  schools: School[],
  schoolCount: number
): Promise<{ dream: School[]; match: School[]; safety: School[]; reasoning: string }> => {
  try {
    const schoolsContext = schools.map(s => 
      `[ID: ${s.id}] Name: ${s.name}, Rankings: QS ${s.qsRanking || 'N/A'} / US News ${s.usNewsRanking || 'N/A'}, Req: ${JSON.stringify(s.requirements)}, Description: ${s.description}`
    ).join('\n');

    const prompt = `
      You are an expert study abroad consultant at "FangYang Nexus".
      Your task is to analyze a student's profile and recommend schools from our database.

      STUDENT PROFILE:
      - GPA: ${formData.gpa}
      - Test Scores: ${formData.testScores}
      - Target Major: ${formData.major}
      - Preferences: ${formData.preferences}

      SCHOOL DATABASE:
      ${schoolsContext}

      GOAL:
      Select exactly ${schoolCount} schools from the database and categorize them into:
      - Dream (衝刺): Schools slightly above the student's profile or high ranking.
      - Match (合適): Schools that match the student's profile well.
      - Safety (保底): Schools where the student has a very high chance of admission.

      Return a JSON object with:
      - dreamIds: Array of school IDs selected.
      - matchIds: Array of school IDs selected.
      - safetyIds: Array of school IDs selected.
      - reasoning: A detailed explanation in Traditional Chinese (Taiwan). 
      
      Security Notice: Do not display school IDs in the reasoning text.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
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

    const text = response.text;
    if (!text) throw new Error("Empty analysis response");

    const analysis = JSON.parse(text) as AnalysisResponse;
    const findSchool = (id: string) => schools.find(s => s.id === id);
    
    return {
      dream: (analysis.dreamIds || []).map(id => findSchool(id)).filter((s): s is School => !!s),
      match: (analysis.matchIds || []).map(id => findSchool(id)).filter((s): s is School => !!s),
      safety: (analysis.safetyIds || []).map(id => findSchool(id)).filter((s): s is School => !!s),
      reasoning: analysis.reasoning
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};