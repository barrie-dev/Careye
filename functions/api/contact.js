const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8' }
});

const clean = (value, max = 4000) => String(value || '').trim().slice(0, max);
const escapeHtml = value => clean(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

async function sendEmail(env, payload) {
  if (!env.RESEND_API_KEY) throw new Error('RESEND_API_KEY ontbreekt in Cloudflare.');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend kon de e-mail niet versturen: ${detail}`);
  }
  return response.json();
}

const fromAddress = env => env.FROM_EMAIL || 'Website Careye <website@betonwerkencareye.be>';

export async function onRequestPost({ request, env }) {
  try {
    const data = await request.formData();
    if (clean(data.get('website'), 200)) return json({ message: 'Bedankt. Uw aanvraag is ontvangen.' });

    const firstName = clean(data.get('first_name'), 100);
    const lastName = clean(data.get('last_name'), 100);
    const email = clean(data.get('email'), 180);
    const phone = clean(data.get('phone'), 80);
    const project = clean(data.get('project'), 180);
    const subject = clean(data.get('subject'), 180) || 'Aanvraag via website';
    const message = clean(data.get('message'), 8000);

    if (!firstName || !lastName || !email || !message) {
      return json({ error: 'Vul alle verplichte velden in.' }, 400);
    }

    const fullName = `${firstName} ${lastName}`;
    const to = env.INFO_EMAIL || 'info@betonwerkencareye.be';
    await sendEmail(env, {
      from: fromAddress(env),
      to: [to],
      reply_to: email,
      subject: `${subject} | ${fullName}`,
      text: [`Voornaam: ${firstName}`, `Familienaam: ${lastName}`, `E-mail: ${email}`, `Telefoon: ${phone}`, `Type aanvraag: ${project}`, '', message].join('\n'),
      html: `<h2>Nieuwe websiteaanvraag</h2><p><strong>Voornaam:</strong> ${escapeHtml(firstName)}<br><strong>Familienaam:</strong> ${escapeHtml(lastName)}<br><strong>E-mail:</strong> ${escapeHtml(email)}<br><strong>Telefoon:</strong> ${escapeHtml(phone)}<br><strong>Type aanvraag:</strong> ${escapeHtml(project)}</p><h3>Bericht</h3><p>${escapeHtml(message).replaceAll('\n', '<br>')}</p>`
    });
    return json({ message: 'Bedankt. Uw aanvraag werd goed verstuurd.' });
  } catch (error) {
    console.error(error);
    return json({ error: 'De aanvraag kon niet worden verstuurd. Probeer het later opnieuw of mail naar info@betonwerkencareye.be.' }, 500);
  }
}

export function onRequestGet() {
  return json({ error: 'Methode niet toegestaan.' }, 405);
}
