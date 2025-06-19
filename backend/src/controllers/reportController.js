const supabase = require('../services/supabaseService');
const { verifyImageWithGemini } = require('../services/geminiService');

exports.createReport = async (req, res) => {
  const { disaster_id, content, image_url } = req.body;
  const user_id = req.user?.userId || 'unknown';
  const { data, error } = await supabase
    .from('reports')
    .insert([{ disaster_id, user_id, content, image_url, verification_status: 'pending' }])
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });

  // 2. Auto-trigger Gemini image verification if image_url is present
  if (image_url) {
    try {
      const geminiResult = await verifyImageWithGemini(image_url);
      const mainText = geminiResult?.candidates?.[0]?.content?.parts?.[0]?.text || "Uncertain (AI analysis failed)";
      await supabase
        .from('reports')
        .update({ verification_status: mainText })
        .eq('id', data.id);
      data.verification_status = mainText;
    } catch (e) {
      // Optionally handle verification errors
    }
  }
  res.status(201).json(data);
};

exports.getReportsByDisaster = async (req, res) => {
  const { disaster_id } = req.params;
  const { data, error } = await supabase
    .from('reports')
    .select('*, users(username)')
    .eq('disaster_id', disaster_id);

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

exports.updateReport = async (req, res) => {
  const { id } = req.params;
  const fields = { ...req.body };
  const { data, error } = await supabase
    .from('reports')
    .update(fields)
    .eq('id', id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

exports.deleteReport = async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('reports')
    .delete()
    .eq('id', id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Report deleted' });
};