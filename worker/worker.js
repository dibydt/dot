// Cloudflare Worker: validates the request form and emails it via Brevo.
// Secrets: BREVO_API_KEY. Vars: ALLOWED_ORIGIN, TO_EMAIL, FROM_EMAIL, FROM_NAME.

const NEEDS = [
  'Technical SEO audit',
  'Web security test',
  'QA testing',
  'Performance check',
  'More than one'
];

const esc = (v) =>
  String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const clean = (v, max) => String(v || '').trim().slice(0, max);

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin'
    };
    const reply = (status, body) =>
      new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return reply(405, { error: 'method' });
    if (origin !== env.ALLOWED_ORIGIN) return reply(403, { error: 'origin' });

    let d;
    try { d = await request.json(); } catch { return reply(400, { error: 'json' }); }

    // Honeypot: pretend success so bots move on
    if (d['bot-field']) return reply(200, { ok: true });

    const name = clean(d.name, 80);
    const email = clean(d.email, 120);
    const site = clean(d.site, 200);
    const need = clean(d.need, 40);
    const details = clean(d.details, 1500);

    let siteOk = false;
    try { siteOk = /^https?:$/.test(new URL(site).protocol); } catch {}

    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !siteOk ||
        !NEEDS.includes(need) || d.authorised !== true) {
      return reply(400, { error: 'invalid' });
    }

    const html = `
      <h2>New tester request</h2>
      <p><b>Name:</b> ${esc(name)}<br>
         <b>Email:</b> ${esc(email)}<br>
         <b>Site:</b> ${esc(site)}<br>
         <b>Need:</b> ${esc(need)}<br>
         <b>Authorised to test:</b> yes</p>
      <p><b>Details:</b><br>${esc(details).replace(/\n/g, '<br>') || '(none)'}</p>`;

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { name: env.FROM_NAME, email: env.FROM_EMAIL },
        to: [{ email: env.TO_EMAIL }],
        replyTo: { email, name },
        subject: `DOT tester request: ${need}`,
        htmlContent: html
      })
    });

    if (!res.ok) return reply(502, { error: 'mail' });
    return reply(200, { ok: true });
  }
};
