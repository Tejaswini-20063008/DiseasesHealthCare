export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST' });

  try {
    const { image } = req.body || {};
    if (!image) return res.status(400).json({ error: 'No image provided' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'No GEMINI_API_KEY in Vercel environment variables' });

    const base64 = image.includes(',') ? image.split(',')[1] : image;
    const prompt = `Look at this skin photo and identify the skin disease. Return ONLY valid JSON:
{"disease":"","confidence":0.85,"what":"","symptoms":[],"spreads":[],"prevention":[],"cure":[]}
Keep explanation simple. In "cure" always advise consulting a doctor.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/jpeg", data: base64 } }
          ]
        }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 }
      })
    });

    const data = await response.json();
    if (data.error) {
      return res.status(400).json({ error: data.error.message || 'Gemini error' });
    }

    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    let match = text.match(/\{[\s\S]*\}/);
    if (match) text = match[0];
    let parsed = JSON.parse(text);

    return res.status(200).json(parsed);
  } catch (e) {
    return res.status(500).json({ error: 'AI failed: ' + e.message });
  }
}
