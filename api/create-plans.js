module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Solo GET' });
  }

  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    const html = '<html><body style="font-family:sans-serif;padding:2rem;"><h1 style="color:red;">Error</h1><p>MP_ACCESS_TOKEN no configurado en Vercel.</p></body></html>';
    res.setHeader('Content-Type', 'text/html');
    return res.status(500).send(html);
  }

  try {
    const searchRes = await fetch('https://api.mercadopago.com/preapproval_plan/search', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const searchData = await searchRes.json();
    if (searchData.results && searchData.results.length > 0) {
      const html = '<html><body style="font-family:sans-serif;padding:2rem;"><h1>Ya existen planes</h1>' +
        searchData.results.map(p =>
          '<div style="border:1px solid #ccc;padding:1rem;margin:1rem 0;border-radius:8px;">' +
          '<h3>' + p.reason + '</h3>' +
          '<p><strong>Plan ID:</strong> <code>' + p.id + '</code></p>' +
          '<p><strong>URL checkout:</strong> <a href="' + p.init_point + '">' + p.init_point + '</a></p>' +
          '<p><strong>Monto:</strong> $' + p.auto_recurring.transaction_amount + ' cada ' + p.auto_recurring.frequency + ' mes(es)</p>' +
          '<p><strong>Estado:</strong> ' + p.status + '</p></div>'
        ).join('') + '</body></html>';
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);
    }
  } catch (e) { /* seguimos */ }

  const planes = [
    { reason: 'SpineFlow Mensual', auto_recurring: { frequency: 1, frequency_type: 'months', transaction_amount: 9800, currency_id: 'ARS' }, back_url: 'https://spineflow.com/planes' },
    { reason: 'SpineFlow Trimestral', auto_recurring: { frequency: 3, frequency_type: 'months', transaction_amount: 23900, currency_id: 'ARS' }, back_url: 'https://spineflow.com/planes' },
    { reason: 'SpineFlow Anual', auto_recurring: { frequency: 12, frequency_type: 'months', transaction_amount: 69800, currency_id: 'ARS' }, back_url: 'https://spineflow.com/planes' }
  ];

  const resultados = [];
  for (const plan of planes) {
    try {
      const response = await fetch('https://api.mercadopago.com/preapproval_plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify(plan)
      });
      const data = await response.json();
      resultados.push({ nombre: plan.reason, id: data.id, init_point: data.init_point, status: data.status, monto: plan.auto_recurring.transaction_amount, error: data.message || null });
    } catch (err) {
      resultados.push({ nombre: plan.reason, error: err.message });
    }
  }

  const html = '<html><head><title>SpineFlow Planes</title></head><body style="font-family:sans-serif;padding:2rem;max-width:800px;margin:0 auto;">' +
    '<h1>Resultado</h1><p>Guarda esta info (captura). Despues borra este archivo del repo.</p><hr>' +
    resultados.map(r =>
      '<div style="border:2px solid ' + (r.id ? '#22c55e' : '#ef4444') + ';padding:1.5rem;margin:1rem 0;border-radius:12px;background:' + (r.id ? '#f0fdf4' : '#fef2f2') + ';">' +
      '<h2>' + r.nombre + ' — $' + r.monto + ' ARS</h2>' +
      (r.id
        ? '<p>Plan ID: <code>' + r.id + '</code></p><p>URL checkout: <a href="' + r.init_point + '" target="_blank">' + r.init_point + '</a></p><p>Estado: ' + r.status + '</p>'
        : '<p style="color:red;">Error: ' + r.error + '</p>') +
      '</div>'
    ).join('') +
    '<hr><p style="color:gray;">Este archivo es de uso unico. Borralo del repo despues.</p></body></html>';

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
};
