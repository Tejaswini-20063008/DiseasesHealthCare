import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } });
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.get("/", (req, res) => {
  res.send("HygieneCare Backend Running!");
});

app.post("/analyze", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.json({ error: "No image" });
    const base64 = req.file.buffer.toString("base64");
    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{
        parts: [
          { text: "You are a skin expert. Analyze this skin photo. Answer ONLY in JSON: {\"disease\":\"eczema\",\"confidence\":92,\"reason\":\"...\",\"cause\":\"...\",\"prevention\":\"...\",\"treatment\":\"...\"} Choose only from: eczema, ringworm, acne, psoriasis, heat rash." },
          { inlineData: { mimeType: req.file.mimetype, data: base64 } }
        ]
      }]
    });
    const text = result.text.replace(/```json|```/g, "").trim();
    res.json(JSON.parse(text));
  } catch (e) {
    console.log(e);
    res.json({ error: "Image analysis is temporarily unavailable" });
  }
});

// Vercel kosam - Listen VADDU! Export CHALU!
export default app;
