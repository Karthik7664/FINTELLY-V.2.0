
import { GoogleGenAI, Type } from "@google/genai";
import { UserData, AnalysisResult, BankScheme, LoanType } from '../types';

/**
 * Diagnostic tool for users to check their API status in the browser console.
 */
(window as any).fintellyStatus = async () => {
  const key = process.env.API_KEY;
  console.log("%c Fintelly Diagnostic Tool ", "background: #4f46e5; color: white; font-weight: bold; padding: 4px; border-radius: 4px;");
  console.log("API Key present:", !!key);
  if (!key) {
    console.warn("No API key found. Please check environment variables.");
    return;
  }
  
  console.log("Testing connection to Gemini (gemini-3-flash-preview)...");
  const ai = new GoogleGenAI({ apiKey: key });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "ping",
      config: { thinkingConfig: { thinkingBudget: 0 } }
    });
    console.log("Connection Success! Response:", response.text);
  } catch (e: any) {
    console.error("Connection Failed:", e.message);
  }
};

/**
 * SEMI-AUTOMATED SCRAPING AGENT
 * Uses Google Search grounding to find the latest interest rates.
 */
export const fetchLatestBankRates = async (bankName: string, loanType: LoanType): Promise<Partial<BankScheme> | null> => {
  const key = process.env.API_KEY;
  if (!key) return null;

  const ai = new GoogleGenAI({ apiKey: key });
  const query = `Latest ${loanType} interest rates for ${bankName} in India as of today. Include processing fees and max tenure.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            interestRate: { type: Type.NUMBER, description: "The current annual interest rate percentage" },
            processingFee: { type: Type.STRING, description: "The processing fee description" },
            maxTenure: { type: Type.NUMBER, description: "Maximum repayment period in years" },
            officialUrl: { type: Type.STRING, description: "Direct link to the loan scheme page" }
          },
          required: ["interestRate", "processingFee", "maxTenure"]
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return {
        ...data,
        lastUpdated: new Date().toISOString(),
        isLive: true
      };
    }
  } catch (error) {
    console.error("Scraping failed for", bankName, error);
  }
  return null;
};

export const getGeminiResponse = async (history: {role: string, content: string}[], systemPrompt: string) => {
  const key = process.env.API_KEY;
  if (!key) return "API Key missing. Please configure your environment.";

  const ai = new GoogleGenAI({ apiKey: key });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: history.map(h => ({ 
        role: h.role === 'bot' ? 'model' : 'user', 
        parts: [{ text: h.content }] 
      })),
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text || "No response text received.";
  } catch (error: any) {
    console.error("[Gemini Chat Error]:", error.message);
    return "Service temporarily unavailable. Please proceed with manual review.";
  }
};

export const generateAnalysisExplanation = async (data: UserData, result: AnalysisResult): Promise<string> => {
  const key = process.env.API_KEY;
  const localFallback = `The credit profile for ${data.name} shows an approval probability of ${result.approvalProbability}%. With a FOIR of ${result.foir.toFixed(1)}% and a CIBIL score of ${data.cibilScore}, the risk classification is ${result.riskLevel}. Institutional placement with primary lenders is recommended.`;

  if (!key) return localFallback;

  const ai = new GoogleGenAI({ apiKey: key });
  
  const prompt = `
    Act as a Senior Banking Underwriter. Provide a formal, plain-text credit assessment for ${data.name || 'the applicant'}:
    
    - Assess creditworthiness based on the CIBIL score of ${data.cibilScore}.
    - Evaluate repayment capacity relative to the ${result.foir.toFixed(1)}% Fixed Obligation to Income Ratio (FOIR).
    - Conclude with a risk classification of ${result.riskLevel} and a professional underwriter recommendation.
    
    Details: Facility Sum ₹${data.loanAmount?.toLocaleString('en-IN')}, Tenure ${data.loanTenure} years.
    Approval Confidence: ${result.approvalProbability}%.
    
    STRICT RULES:
    1. DO NOT mention "AI", "models", "agents", "bots", or "automated systems".
    2. DO NOT use markdown characters like **bold**, *italics*, or #.
    3. NO SYMBOLS OR BULLET POINTS.
    4. MUST BE ONE CONTINUOUS PLAIN TEXT PARAGRAPH.
    5. Tone: Institutional, senior banking executive, strictly professional.
    6. Max 80 words.
  `;

  try {
    const timeoutPromise = new Promise<string>((_, reject) => 
      setTimeout(() => reject(new Error("Timeout")), 8000)
    );

    const apiPromise = (async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: { thinkingConfig: { thinkingBudget: 0 } }
      });
      return response.text?.trim() || localFallback;
    })();

    return await Promise.race([apiPromise, timeoutPromise]);
  } catch (error: any) {
    console.warn("[Underwriter Fallback]:", error.message);
    return localFallback;
  }
};
