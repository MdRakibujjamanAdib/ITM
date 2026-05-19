import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    const fileMimeType = mimeType || 'image/jpeg';
    console.log('Received image, mime:', fileMimeType, 'base64 length:', imageBase64.length);

    const response = await genai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: [
        {
          role: 'user',
          parts: [
            { text: "Analyze this image containing notes. 1. Extract the text accurately. 2. Identify if there are any graphs, charts, diagrams, or illustrations. 3. If there is a diagram, provide a highly detailed visual description (diagramDescription) of it so it can be recreated by an AI image generator later." },
            { inlineData: { data: imageBase64, mimeType: fileMimeType } }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT' as any,
          properties: {
            text: { type: 'STRING' as any, description: "The extracted text from the notes" },
            hasDiagram: { type: 'BOOLEAN' as any, description: "True if there is any graph, chart, diagram, or drawing" },
            diagramDescription: { type: 'STRING' as any, description: "A detailed description of the diagram if hasDiagram is true, else empty string" },
          },
          required: ["text", "hasDiagram", "diagramDescription"]
        }
      }
    });

    const jsonStr = response.text || "{}";
    const parsed = JSON.parse(jsonStr);
    res.json(parsed);
  } catch (error: any) {
    console.error('OCR Error:', error);
    res.status(500).json({ error: 'Failed to process image', details: error?.message || String(error) });
  }
}
