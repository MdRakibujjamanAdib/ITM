import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const response = await genai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: `Review the following text for spelling and grammar errors. Provide a suggested corrected version, and briefly list the key changes. Format the response with two sections: 'Corrected Text' and 'Changes'.\n\nText to review:\n${text}` }
          ]
        }
      ]
    });

    res.json({ suggestion: response.text || 'No suggestions' });
  } catch (error: any) {
    console.error('Suggest Error:', error);
    res.status(500).json({ error: 'Failed to generate suggestions', details: error?.message || String(error) });
  }
}
