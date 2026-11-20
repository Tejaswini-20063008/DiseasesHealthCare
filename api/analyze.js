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

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [
          { text: "You are a health educator. Look at this skin photo and give educational screening only, not a final diagnosis. Tell possible condition, why it happens, home care, prevention, and when to see doctor. Add disclaimer to see doctor. Reply in simple English." },
          { inline_data: { mime_type: "image/jpeg", data: base64 } }
        ]}]
      })
    });
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || data?.error?.message || "AI could not analyze. Please try again.";
    return res.status(200).json({ result: text, analysis: text, text: text });
  } catch (e) {
    return res.status(500).json({ error: 'AI failed: ' + e.message });
  }
}
