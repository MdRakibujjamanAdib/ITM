import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { description } = req.body;
    if (!description) return res.status(400).json({ error: 'Description required' });

    const response = await genai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: [
        { parts: [{ text: "Recreate this diagram cleanly as a digital illustration, professional and legible. Detailed description: " + description }] }
      ],
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      }
    });

    let base64Image = null;
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        base64Image = part.inlineData.data;
        break;
      }
    }

    if (base64Image) {
      res.json({ imageUrl: `data:image/png;base64,${base64Image}` });
    } else {
      res.status(500).json({ error: 'Failed to generate image' });
    }
  } catch (error: any) {
    console.error('Generate Image Error:', error);
    res.status(500).json({ error: 'Failed to generate image', details: error?.message || String(error) });
  }
}
