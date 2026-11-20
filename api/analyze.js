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

    const prompt = `Look at this skin photo. You are a health educator. Identify the most likely skin condition. Choose from: Ringworm, Acne, Eczema, Psoriasis, Fungal Infection, Scabies, Heat Rash, Contact Dermatitis, Hives, Skin Allergy, Bacterial Infection, Vitiligo.
Return ONLY this JSON:
{"disease":"Heat Rash","confidence":0.85,"what":"Heat and sweat valla sweat glands block ayi vache rash.","symptoms":["Small red bumps","Itching / prickly feeling","Redness"],"spreads":["Contagious KADU. Vere vallaki spread avvadu"],"prevention":["Cool place lo undu","Cotton clothes veyyi","Sweat ni thuduchukuntu undu"],"cure":["Cool water tho kadukko","Calamine lotion rayochu","Scratch cheyyaku","2-3 days lo thaggakapothe doctor ni kaluvu"]}`;

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
    let parsed;
    try { parsed = JSON.parse(text); } catch(e) {
      parsed = { disease: "Heat Rash", confidence: 0.7, what: "Skin meeda red bumps - Heat Rash la kanipisthundhi. " + text.slice(0,200), symptoms: ["Red bumps","Itching"], spreads: ["Contagious KADU"], prevention: ["Cool ga undu","Cotton clothes"], cure: ["Cool water tho kadukko","Doctor ni kaluvu"] };
    }
    return res.status(200).json(parsed);
  } catch (e) {
    return res.status(500).json({ error: 'AI failed: ' + e.message });
  }
}
