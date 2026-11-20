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
    const prompt = `Look at this skin photo. You are a health educator. Give ONLY JSON, no extra text. Format exactly like this:
{"disease":"Ringworm","confidence":0.82,"what":"one line explanation","symptoms":["symptom1","symptom2"],"spreads":["how it spreads"],"prevention":["prevention1"],"cure":["care1","care2"]}
If you are not sure, still pick closest possible condition from Ringworm, Acne, Eczema, Psoriasis, Fungal Infection, Scabies. Confidence must be 0 to 1.`;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: "image/jpeg", data: base64 } }] }] })
    });
    const data = await response.json();
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    text = text.replace(/```json|```/g, "").trim();
    let parsed;
    try { parsed = JSON.parse(text); } catch(e) {
      parsed = { disease: "Unknown", confidence: 0.6, what: text, symptoms: ["See details"], spreads: ["Consult doctor"], prevention: ["Keep skin clean and dry"], cure: ["See dermatologist for confirmation"] };
    }
    return res.status(200).json(parsed);
  } catch (e) {
    return res.status(500).json({ error: 'AI failed: ' + e.message });
  }
}
