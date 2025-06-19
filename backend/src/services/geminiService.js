const axios = require('axios');

async function extractLocationFromDescription(description) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;
  const prompt = `Extract the location name from this disaster description: "${description}". Only return the location name.`;

  try {
    const response = await axios.post(
      `${url}?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      }
    );
    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return text || null;
  } catch (err) {
    console.error('Gemini extraction error:', err.response?.data || err.message);
    return null;
  }
}

async function verifyImageWithGemini(image_url) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  // Updated model endpoint
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const prompt = `Analyze this image for signs of manipulation or disaster context.`;

  try {
    const imageResponse = await axios.get(image_url, { responseType: 'arraybuffer' });
    const base64Image = Buffer.from(imageResponse.data, 'binary').toString('base64');

    const response = await axios.post(
      url,
      {
        contents: [
          {
            parts: [
              { text: prompt },
              { inline_data: { mime_type: "image/jpeg", data: base64Image } }
            ]
          }
        ]
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (err) {
    console.error('Gemini image verification error:', err.response?.data || err.message);
    throw new Error('Image verification failed');
  }
}

module.exports = { extractLocationFromDescription, verifyImageWithGemini };