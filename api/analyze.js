export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST' });
  try {
    const { image } = req.body || {};
    if (!image) return res.status(400).json({ error: 'No image' });
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'No API Key in Vercel' });
    const base64 = image.includes(',') ? image.split(',')[1] : image;

    const prompt = `Look at this skin photo and tell what skin disease it is. You decide yourself based on what you see in the photo. Do not guess. Be accurate.

Return ONLY this JSON:
{"disease":"","confidence":0,"what":"","symptoms":[],"spreads":[],"prevention":[],"cure":[]}
Fill all fields in simple Telugu-English. In "what" explain what it is. In "cure" last point always add "doctor ni kaluvu".`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: "image/jpeg", data: base64 } }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 }
      })
    });
    const data = await response.json();
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    let match = text.match(/\{[\s\S]*\}/);
    if (match) text = match[0];
    let parsed = JSON.parse(text);
    return res.status(200).json(parsed);
  } catch (e) {
    return res.status(500).json({ error: 'AI failed: ' + e.message });
  }
}
