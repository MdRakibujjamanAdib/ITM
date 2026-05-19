import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import multer from 'multer';

// Memory storage for multer
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/ocr', upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      console.log('Received file:', req.file.mimetype, req.file.size);

      // Convert buffer to base64
      const base64Data = req.file.buffer.toString('base64');
      
      const response = await genai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: [
          {
            role: 'user',
            parts: [
              { text: "Analyze this image containing notes. 1. Extract the text accurately. 2. Identify if there are any graphs, charts, diagrams, or illustrations. 3. If there is a diagram, provide a highly detailed visual description (diagramDescription) of it so it can be recreated by an AI image generator later." },
              { inlineData: { data: base64Data, mimeType: req.file.mimetype } }
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
    } catch (error) {
      console.error('OCR Error:', error);
      res.status(500).json({ error: 'Failed to process image' });
    }
  });

  app.post('/api/generate-image', async (req, res) => {
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
    } catch (error) {
      console.error('Generate Image Error:', error);
      res.status(500).json({ error: 'Failed to generate image' });
    }
  });

  app.post('/api/suggest', async (req, res) => {
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
    } catch (error) {
      console.error('Suggest Error:', error);
      res.status(500).json({ error: 'Failed to generate suggestions' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
