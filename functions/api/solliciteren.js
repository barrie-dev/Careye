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

const allowedTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);
const maxFileSize = 8 * 1024 * 1024;

function bytesToBase64(bytes) {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export async function onRequestPost({ request, env }) {
  try {
    const data = await request.formData();
    if (clean(data.get('website'), 200)) return json({ message: 'Bedankt. Uw sollicitatie is ontvangen.' });

    const firstName = clean(data.get('first_name'), 100);
    const lastName = clean(data.get('last_name'), 100);
    const email = clean(data.get('email'), 180);
    const phone = clean(data.get('phone'), 80);
    const job = clean(data.get('job'), 180) || 'Spontane sollicitatie';
    const motivation = clean(data.get('motivation'), 8000);
    const cv = data.get('cv');

    if (!firstName || !lastName || !email || !phone || !(cv instanceof File) || !cv.name || cv.size === 0) {
      return json({ error: 'Vul alle verplichte velden in en voeg uw cv toe.' }, 400);
    }
    if (cv.size > maxFileSize) return json({ error: 'Uw cv is groter dan 8 MB.' }, 400);
    if (!allowedTypes.has(cv.type)) return json({ error: 'Gebruik een cv in PDF, DOC of DOCX-formaat.' }, 400);

    const fileBytes = new Uint8Array(await cv.arrayBuffer());
    const fullName = `${firstName} ${lastName}`;
    const to = env.HR_EMAIL || 'hr@betonwerkencareye.be';
    await sendEmail(env, {
      from: fromAddress(env),
      to: [to],
      reply_to: email,
      subject: `Sollicitatie ${job} | ${fullName}`,
      text: [`Vacature: ${job}`, `Voornaam: ${firstName}`, `Familienaam: ${lastName}`, `E-mail: ${email}`, `Telefoon: ${phone}`, '', 'Motivatie:', motivation || 'Niet ingevuld'].join('\n'),
      html: `<h2>Nieuwe sollicitatie</h2><p><strong>Vacature:</strong> ${escapeHtml(job)}<br><strong>Voornaam:</strong> ${escapeHtml(firstName)}<br><strong>Familienaam:</strong> ${escapeHtml(lastName)}<br><strong>E-mail:</strong> ${escapeHtml(email)}<br><strong>Telefoon:</strong> ${escapeHtml(phone)}</p><h3>Motivatie</h3><p>${escapeHtml(motivation || 'Niet ingevuld').replaceAll('\n', '<br>')}</p>`,
      attachments: [{ filename: clean(cv.name, 180), content: bytesToBase64(fileBytes) }]
    });
    return json({ message: 'Bedankt. Uw sollicitatie en cv werden goed verstuurd naar HR.' });
  } catch (error) {
    console.error(error);
    return json({ error: 'De sollicitatie kon niet worden verstuurd. Probeer het later opnieuw of mail naar hr@betonwerkencareye.be.' }, 500);
  }
}

export function onRequestGet() {
  return json({ error: 'Methode niet toegestaan.' }, 405);
}
