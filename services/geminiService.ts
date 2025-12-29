
import { GoogleGenAI, Type } from "@google/genai";
import { School, Citation, TranscriptResult } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Utility to clean potential markdown code blocks or unescaped characters 
 * from the AI response before parsing as JSON.
 */
const cleanJSON = (text: string): string => {
  let cleaned = text.trim();
  // Remove markdown code blocks if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?|```$/g, '').trim();
  }
  return cleaned;
};

export const parseTranscript = async (imageParts: { inlineData: { data: string, mimeType: string } }[]): Promise<TranscriptResult> => {
  try {
    const prompt = `
      You are an expert transcript analyst for a study abroad agency in Taiwan.
      Task: Extract all courses, credits, and grades from the provided transcript images.
      
      CRITICAL RULES:
      1. Keep the course "name" in its ORIGINAL language (e.g., Traditional Chinese). Do NOT translate to English.
      2. You MUST return at least an empty array for "courses" if no data is found.
      3. Conversion Mapping (Strictly follow this Step Formula):
         - Score 80-100 (or A): 4.0
         - Score 70-79 (or B): 3.0
         - Score 60-69 (or C): 2.0
         - Score 59 and below (or F/D): 0.0
      
      EXCLUSION RULES (CRITICAL):
      Identify these keywords in the grade or remarks. These courses should be listed in "courses" but EXCLUDED from "overallGpa4", "overallPercentage", and "totalCredits" calculation:
      - 抵免 (Often marked as "抵")
      - 退選 (Often marked as "退" or "W")
      - 停修 (Often marked as "停")
      - Pass (Often marked as "P")
      - Physical Education (體育)
      
      Return a JSON object with:
      - studentName, university, courses
      - overallGpa4: Weighted average [Sum(credits * gpa4) / Sum(credits)] for qualified courses.
      - overallPercentage: Weighted average [Sum(credits * percentage) / Sum(credits)] for qualified courses.
      - totalCredits: Sum of credits for qualified courses only.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [...imageParts, { text: prompt }] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            studentName: { type: Type.STRING },
            university: { type: Type.STRING },
            courses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  credits: { type: Type.NUMBER },
                  originalGrade: { type: Type.STRING },
                  gpa4: { type: Type.NUMBER },
                  percentage: { type: Type.NUMBER }
                },
                required: ['name', 'credits', 'originalGrade', 'gpa4', 'percentage']
              }
            },
            overallGpa4: { type: Type.NUMBER },
            overallPercentage: { type: Type.NUMBER },
            totalCredits: { type: Type.NUMBER }
          },
          required: ['courses', 'overallGpa4', 'overallPercentage', 'totalCredits']
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    try {
      const parsed = JSON.parse(cleanJSON(text));
      return {
        studentName: parsed.studentName || "未知學生",
        university: parsed.university || "未知學校",
        courses: Array.isArray(parsed.courses) ? parsed.courses : [],
        overallGpa4: typeof parsed.overallGpa4 === 'number' ? parsed.overallGpa4 : 0,
        overallPercentage: typeof parsed.overallPercentage === 'number' ? parsed.overallPercentage : 0,
        totalCredits: typeof parsed.totalCredits === 'number' ? parsed.totalCredits : 0
      };
    } catch (parseError) {
      console.error("JSON Parsing Error Details:", text);
      throw new Error(`Failed to parse transcript JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }
  } catch (error) {
    console.error("Transcript Parse Error:", error);
    throw error;
  }
};

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
      - name, location, country, type, programs, department, qsRanking, usNewsRanking, tuitionRange, requirements, tags, description
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
    
    return JSON.parse(cleanJSON(text)) as Partial<School>;

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

export const chatWithKnowledgeBase = async (
  query: string, 
  contextDocs: string
): Promise<ChatResponse> => {
  try {
    const systemInstruction = `你現在是 "FangYang Nexus AI"。根據 CONTEXT 回答問題。語氣專業、簡潔、使用繁體中文。`;
    const prompt = `CONTEXT: ${contextDocs}\nQUESTION: ${query}`;

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

    return JSON.parse(cleanJSON(response.text)) as ChatResponse;
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return { answer: "系統錯誤。", sources: [], confidence: 'LOW' };
  }
};

interface AnalysisResponse {
  dreamIds: string[];
  matchIds: string[];
  safetyIds: string[];
  reasoning: string;
}

export const analyzeSchoolPlacement = async (
  formData: { gpa: string; testScores: string; major: string; preferences: string },
  schools: School[],
  schoolCount: number
): Promise<{ dream: School[]; match: School[]; safety: School[]; reasoning: string }> => {
  try {
    const schoolsContext = schools.map(s => 
      `[ID: ${s.id}] Name: ${s.name}, Rankings: QS ${s.qsRanking || 'N/A'}, Req: ${JSON.stringify(s.requirements)}`
    ).join('\n');

    const prompt = `Student GPA: ${formData.gpa}, Major: ${formData.major}. Select ${schoolCount} schools from database. Categorize into Dream, Match, Safety.`;

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

    const analysis = JSON.parse(cleanJSON(response.text)) as AnalysisResponse;
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
