import express from "express";
import multer from "multer";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = process.env.PORT || 3000;

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL;

const WEBSITE_ORIGIN =
  "https://tejaswini-20063008.github.io";

if (!API_KEY || !MODEL) {
  console.error("Missing Gemini environment variables.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

app.use(helmet());

app.use(cors({
  origin: WEBSITE_ORIGIN
}));

app.use(rateLimit({
  windowMs: 60 * 1000,
  limit: 10
}));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];
    cb(null, allowed.includes(file.mimetype));
  }
});

app.get("/", (req, res) => {
  res.json({ status: "HygieneCare backend running" });
});

app.post("/api/scan", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Please upload a JPG, PNG or WEBP image."
      });
    }

    const prompt = `
You are providing educational skin-health information,
not a medical diagnosis.

Examine the supplied skin image cautiously.

Do not claim to diagnose ringworm, acne, eczema,
psoriasis, dermatitis or any fungal infection.

Explain:
1. What visible features can and cannot be observed.
2. Why an image alone cannot establish the cause.
3. General, gentle skin-care precautions.
4. When to seek advice from a qualified healthcare professional.

If the image is unclear or unsuitable, say:
"Unable to assess this image."

Do not invent certainty, probabilities, or accuracy scores.
Do not prescribe medication.
`;

    const result = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          inlineData: {
            mimeType: req.file.mimetype,
            data: req.file.buffer.toString("base64")
          }
        },
        { text: prompt }
      ]
    });

    res.json({
      mode: "AI educational assistance",
      result: result.text || "Unable to assess this image."
    });

  } catch (error) {
    console.error("Scan request failed:", error.message);

    res.status(500).json({
      error: "Image analysis is temporarily unavailable."
    });
  }
});
if (require.main === module) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`HygieneCare server running on port ${PORT}`);
  });
}

module.exports = app;
