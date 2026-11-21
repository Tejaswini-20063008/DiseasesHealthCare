export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });

  try {
    const { image } = req.body || {};
    if (!image) return res.status(400).json({ error: "No image provided" });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY is not set in Vercel Environment Variables" });

    let mimeType = "image/jpeg";
    let base64 = image;
    if (image.includes(",")) {
      const parts = image.split(",");
      const match = parts[0].match(/:(.*?);/);
      if (match) mimeType = match[1];
      base64 = parts[1];
    }

    const prompt = `You are a medical assistant for educational screening. Look at this skin condition photo and analyze it.
Return ONLY valid JSON matching this exact structure:
{
  "disease": "Disease Name",
  "confidence": 0.85,
  "what": "Simple 1-2 sentence description of what this condition is.",
  "symptoms": ["Symptom 1", "Symptom 2", "Symptom 3"],
  "spreads": ["How it spreads or triggers"],
  "prevention": ["Prevention tip 1", "Prevention tip 2"],
  "cure": ["Consult a doctor for proper diagnosis and prescription.", "Care step 1"]
}
Do not include markdown backticks or any other text outside the JSON.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                { inlineData: { mimeType: mimeType, data: base64 } }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json"
          }
        })
      }
    );

    const data = await response.json();
    if (data.error) {
      return res.status(400).json({ error: data.error.message || "Gemini API error" });
    }

    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!text) {
      return res.status(400).json({ error: "AI could not analyze this image. Please try a clearer photo." });
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) text = jsonMatch[0];

    const parsed = JSON.parse(text);
    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: "Server error: " + err.message });
  }
}
