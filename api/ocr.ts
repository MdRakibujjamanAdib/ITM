import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
};

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse multipart form data manually from the raw body
    const contentType = req.headers['content-type'] || '';
    
    if (!contentType.includes('multipart/form-data')) {
      return res.status(400).json({ error: 'Expected multipart/form-data' });
    }

    const boundary = contentType.split('boundary=')[1];
    if (!boundary) {
      return res.status(400).json({ error: 'No boundary found in content-type' });
    }

    // Read raw body as buffer
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      req.on('data', (chunk: Buffer) => chunks.push(chunk));
      req.on('end', resolve);
      req.on('error', reject);
    });
    const rawBody = Buffer.concat(chunks);

    // Parse multipart data
    const boundaryBuffer = Buffer.from(`--${boundary}`);
    const parts = splitBuffer(rawBody, boundaryBuffer);

    let fileBuffer: Buffer | null = null;
    let mimeType = 'image/jpeg';

    for (const part of parts) {
      const partStr = part.toString('utf-8', 0, Math.min(part.length, 500));
      if (partStr.includes('name="image"')) {
        // Find the double CRLF that separates headers from body
        const headerEnd = findDoubleCRLF(part);
        if (headerEnd !== -1) {
          fileBuffer = part.slice(headerEnd + 4); // Skip \r\n\r\n
          // Remove trailing \r\n
          if (fileBuffer.length > 2 && fileBuffer[fileBuffer.length - 2] === 0x0d && fileBuffer[fileBuffer.length - 1] === 0x0a) {
            fileBuffer = fileBuffer.slice(0, -2);
          }
          // Extract mime type from Content-Type header
          const mimeMatch = partStr.match(/Content-Type:\s*(\S+)/i);
          if (mimeMatch) {
            mimeType = mimeMatch[1];
          }
        }
      }
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    console.log('Received file:', mimeType, fileBuffer.length);

    const base64Data = fileBuffer.toString('base64');

    const response = await genai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: [
        {
          role: 'user',
          parts: [
            { text: "Analyze this image containing notes. 1. Extract the text accurately. 2. Identify if there are any graphs, charts, diagrams, or illustrations. 3. If there is a diagram, provide a highly detailed visual description (diagramDescription) of it so it can be recreated by an AI image generator later." },
            { inlineData: { data: base64Data, mimeType } }
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

function findDoubleCRLF(buf: Buffer): number {
  for (let i = 0; i < buf.length - 3; i++) {
    if (buf[i] === 0x0d && buf[i + 1] === 0x0a && buf[i + 2] === 0x0d && buf[i + 3] === 0x0a) {
      return i;
    }
  }
  return -1;
}

function splitBuffer(buf: Buffer, delimiter: Buffer): Buffer[] {
  const parts: Buffer[] = [];
  let start = 0;
  while (start < buf.length) {
    const idx = buf.indexOf(delimiter, start);
    if (idx === -1) {
      parts.push(buf.slice(start));
      break;
    }
    if (idx > start) {
      parts.push(buf.slice(start, idx));
    }
    start = idx + delimiter.length;
  }
  return parts;
}
