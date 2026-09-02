// Webhook de Mercado Pago para suscripciones (preapproval).
// Vercel lo publica automáticamente en https://spineflow.org/api/mp-webhook
//
// Variables de entorno requeridas (Vercel dashboard → Settings → Environment Variables):
//   MP_ACCESS_TOKEN               → Access token de producción de la cuenta MP de SpineFlow
//   SUPABASE_URL                  → https://atefklvwshuwrmeasrnq.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY     → service_role key de Supabase (¡NO la anon!)

const MP_API = 'https://api.mercadopago.com';

export default async function handler(req, res) {
  // MP hace un GET de verificación cuando configurás el webhook. Le contestamos OK.
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, service: 'spineflow-mp-webhook' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Vercel ya parsea el JSON del body para funciones serverless
  const body = req.body || {};
  const query = req.query || {};

  // MP puede mandar el tipo por body.type, body.topic o ?topic= en la URL
  const topic = body.type || body.topic || query.type || query.topic;
  const resourceId = body.data?.id || body.id || query.id || query['data.id'];

  // Solo nos interesan las suscripciones (preapproval).
  // Los pagos individuales de la suscripción vienen con topic=payment y los ignoramos.
  if (!topic || (topic !== 'subscription_preapproval' && topic !== 'preapproval')) {
    return res.status(200).json({ received: true, ignored_topic: topic || 'none' });
  }

  if (!resourceId) {
    return res.status(200).json({ received: true, no_resource_id: true });
  }

  try {
    // 1) Consultar el estado real de la suscripción en la API de MP
    const mpRes = await fetch(`${MP_API}/preapproval/${resourceId}`, {
      headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
    });

    if (!mpRes.ok) {
      const errText = await mpRes.text();
      console.error('MP query failed', mpRes.status, errText);
      return res.status(502).json({ error: 'MP query failed', status: mpRes.status });
    }

    const sub = await mpRes.json();

    // external_reference lo mandamos desde planes.html con el user_id de Supabase
    const userId = sub.external_reference;
    if (!userId) {
      return res.status(200).json({ received: true, no_external_reference: true });
    }

    // 2) Mapear plan_id de MP a nombre legible
    const PLAN_MAP = {
      'fb77b0af770b49a39f1e7f4844eb720f': 'mensual',
      '1e8f0e0acf134d01b39499a5196b8ed5': 'trimestral',
      'e72e9cacccee4eb1898b19916a8c0731': 'anual'
    };
    const planName = PLAN_MAP[sub.preapproval_plan_id] || sub.reason || 'unknown';

    // 3) Upsert en Supabase usando el service_role (bypassa RLS)
    const payload = {
      user_id: userId,
      preapproval_id: sub.id,
      plan: planName,
      status: sub.status, // authorized | paused | cancelled | pending
      amount: sub.auto_recurring?.transaction_amount || null,
      currency: sub.auto_recurring?.currency_id || 'ARS',
      started_at: sub.date_created || null,
      expires_at: sub.next_payment_date || null,
      updated_at: new Date().toISOString()
    };

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const upsertRes = await fetch(`${supabaseUrl}/rest/v1/subscriptions?on_conflict=preapproval_id`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify(payload)
    });

    if (!upsertRes.ok) {
      const errText = await upsertRes.text();
      console.error('Supabase upsert failed', upsertRes.status, errText);
      return res.status(500).json({ error: 'Supabase upsert failed', details: errText });
    }

    return res.status(200).json({ ok: true, user_id: userId, status: sub.status, plan: planName });

  } catch (err) {
    console.error('Webhook error', err);
    return res.status(500).json({ error: String(err.message || err) });
  }
}
