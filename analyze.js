export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const { image } = req.body;
    const base64 = image.split(',')[1] || image;
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [
          { text: "You are a skin disease screening assistant for education only. Look at this skin photo. Identify ANY skin disease you see, do not limit to a list. Return ONLY JSON like {\"disease\":\"Acne\",\"confidence\":85,\"what\":\"...\",\"causes\":\"...\",\"precautions\":\"...\",\"preventions\":\"...\"}. Advise to see doctor." },
          { inline_data: { mime_type: "image/jpeg", data: base64 } }
        ]}]
      })
    });
    const data = await r.json();
    const text = data.candidates[0].content.parts[0].text.replace(/```json|```/g,'').trim();
    return res.status(200).json(JSON.parse(text));
  } catch(e){ return res.status(500).json({ error: e.message }); }
}
