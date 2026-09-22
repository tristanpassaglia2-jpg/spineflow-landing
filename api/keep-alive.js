// Ping liviano a Supabase para evitar que el proyecto Free se pause por inactividad.
// Vercel Cron lo ejecuta automáticamente cada 5 días (configurado en vercel.json).

export default async function handler(req, res) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return res.status(500).json({ error: 'Missing env vars' });
  }

  try {
    const r = await fetch(`${url}/rest/v1/profiles?select=id&limit=1`, {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    return res.status(200).json({ ok: true, status: r.status, ts: new Date().toISOString() });
  } catch (err) {
    return res.status(500).json({ error: String(err.message) });
  }
}
