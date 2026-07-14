import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'dist');

const readJson = async file => JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));
const esc = value => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');
const attr = esc;
const nl2br = value => esc(value).replaceAll('\n', '<br>');
const pad = n => String(n).padStart(2, '0');
const sortByOrder = items => items.sort((a, b) => Number(a.order ?? 999) - Number(b.order ?? 999));

async function readCollection(folder) {
  const dir = path.join(root, folder);
  const names = (await fs.readdir(dir)).filter(name => name.endsWith('.json'));
  const values = await Promise.all(names.map(async name => ({
    ...(JSON.parse(await fs.readFile(path.join(dir, name), 'utf8'))),
    _filename: name
  })));
  return sortByOrder(values);
}

function image(src, altText, fallback, extra = '') {
  const onerror = fallback ? ` onerror="this.onerror=null;this.src='${attr(fallback)}'"` : '';
  return `<img src="${attr(src)}" alt="${attr(altText)}"${extra}${onerror}>`;
}

function renderHeader(site, active) {
  const nav = [
    ['home', 'index.html', 'Home'],
    ['diensten', 'diensten.html', 'Diensten'],
    ['projecten', 'projecten.html', 'Projecten'],
    ['over-ons', 'over-ons.html', 'Over Careye'],
    ['vacatures', 'vacatures.html', 'Vacatures'],
    ['contact', 'contact.html', 'Contact']
  ];
  return `
<a class="skip-link" href="#main">Ga naar de inhoud</a>
<div class="utility"><div class="container"><span class="utility-note">${esc(site.utility_note)}</span><div class="utility-links"><a href="tel:${attr(site.phone_href)}">${esc(site.phone_display)}</a><a href="mailto:${attr(site.email)}">${esc(site.email)}</a></div></div></div>
<header class="site-header">
  <div class="container nav">
    <a class="brand" href="index.html" aria-label="${attr(site.company_name)}, home">
      <img class="brand-logo brand-logo-light" src="${attr(site.logo_light)}" width="500" height="150" alt="${attr(site.company_name)}">
      <img class="brand-logo brand-logo-dark" src="${attr(site.logo_dark)}" width="490" height="196" alt="" aria-hidden="true">
      <span class="brand-fallback" hidden>${esc(site.company_name)}</span>
    </a>
    <nav class="nav-menu" aria-label="Hoofdnavigatie">${nav.map(([key, href, label]) => `<a class="nav-link${active === key ? ' active' : ''}" href="${href}"${active === key ? ' aria-current="page"' : ''}>${label}</a>`).join('')}<a class="nav-cta" href="contact.html#offerte">Offerte aanvragen</a></nav>
    <button class="menu-toggle" type="button" aria-expanded="false" aria-label="Menu openen"><span></span></button>
  </div>
</header>`;
}

function renderFooter(site) {
  const socials = (site.socials || []).map(item => `<a href="${attr(item.url)}" target="_blank" rel="noreferrer">${esc(item.label)}</a>`).join('');
  const locations = (site.locations || []).map(item => `<a href="${attr(item.maps_url)}" target="_blank" rel="noreferrer"><strong>${esc(item.name)}</strong><span>${esc(item.address_line_1)}<br>${esc(item.address_line_2)}</span></a>`).join('');
  return `<footer class="site-footer">
  <div class="container">
    <div class="footer-cta">
      <div><span class="footer-kicker">${esc(site.footer_kicker)}</span><h2>${esc(site.footer_title)}</h2></div>
      <div class="footer-cta-actions"><a class="btn btn-primary" href="contact.html#offerte">${esc(site.footer_button)}</a><a class="footer-phone" href="tel:${attr(site.phone_href)}"><span>Bel ons</span>${esc(site.phone_display)}</a></div>
    </div>
    <div class="footer-main">
      <div class="footer-company">
        <a class="footer-brand" href="index.html" aria-label="${attr(site.company_name)}, home"><img class="brand-logo brand-logo-light" src="${attr(site.logo_light)}" width="500" height="150" alt="${attr(site.company_name)}" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="brand-fallback" hidden>${esc(site.company_name)}</span></a>
        <p>${esc(site.footer_intro)}</p><div class="footer-socials" aria-label="Sociale media">${socials}</div>
      </div>
      <div class="footer-column"><h2 class="footer-title">Contact</h2><div class="footer-links"><a href="tel:${attr(site.phone_href)}">${esc(site.phone_display)}</a><a href="mailto:${attr(site.email)}">${esc(site.email)}</a><span>BTW ${esc(site.vat)}</span></div></div>
      <div class="footer-column"><h2 class="footer-title">Vestigingen</h2><div class="footer-locations">${locations}</div></div>
      <div class="footer-column"><h2 class="footer-title">Website</h2><div class="footer-links"><a href="diensten.html">Diensten</a><a href="projecten.html">Projecten</a><a href="over-ons.html">Over Careye</a><a href="vacatures.html">Vacatures</a><a href="contact.html">Contact</a></div></div>
    </div>
    <div class="footer-bottom"><span>© <span data-year></span> ${esc(site.legal_name)}</span><div class="footer-legal"><a href="algemene-voorwaarden.html">Algemene voorwaarden</a><a href="privacy.html">Privacy</a><a href="cookies.html">Cookies</a></div></div>
  </div>
</footer>`;
}

function pageHero(page, label, fallback = 'assets/images/hero-fallback.svg') {
  return `<section class="page-hero"><div class="page-hero-media">${image(page.hero_image, page.hero_image_alt, fallback, ' loading="eager"')}</div><div class="container page-hero-inner"><div class="breadcrumb"><a href="index.html">Home</a><span>/</span><span>${esc(label)}</span></div><span class="eyebrow">${esc(page.eyebrow)}</span><h1>${esc(page.title)}</h1><p>${esc(page.intro)}</p></div></section>`;
}

function homeMain(home, site, services, projects, jobs) {
  const homeServices = services.filter(item => item.published !== false && item.show_on_home !== false).slice(0, 4);
  const spotlight = projects.find(item => item.published !== false && item.spotlight) || projects.find(item => item.published !== false);
  const related = projects.filter(item => item.published !== false && item !== spotlight).slice(0, 3);
  const openJobs = jobs.filter(item => item.published !== false).slice(0, 4);
  const heroTitle = home.hero_emphasis && home.hero_title.includes(home.hero_emphasis)
    ? `${esc(home.hero_title.replace(home.hero_emphasis, ''))}<em>${esc(home.hero_emphasis)}</em>`
    : esc(home.hero_title);
  return `<main id="main">
<section class="hero"><div class="hero-media">${image(home.hero_image, home.hero_image_alt, 'assets/images/hero-fallback.svg', ' loading="eager"')}</div><div class="container hero-grid"><div><span class="eyebrow">${esc(home.hero_eyebrow)}</span><h1>${heroTitle}</h1><p class="hero-copy">${esc(home.hero_text)}</p><div class="actions"><a class="btn btn-primary" href="contact.html#offerte">${esc(home.hero_primary_button)}</a><a class="btn btn-ghost" href="projecten.html">${esc(home.hero_secondary_button)}</a></div></div><aside class="hero-panel"><strong>${esc(home.hero_panel_title)}</strong><p>${esc(home.hero_panel_text)}</p><div class="hero-panel-list">${(home.hero_panel_items || []).map(item => `<div class="hero-panel-item"><span class="check" aria-hidden="true"></span>${esc(item)}</div>`).join('')}</div></aside></div><div class="hero-corner" aria-hidden="true"></div></section>
<section class="trust-strip"><div class="container trust-grid">${(home.trust_items || []).map(item => `<div class="trust-item"><strong>${esc(item.title)}</strong><span>${esc(item.text)}</span></div>`).join('')}</div></section>
<section class="section section-white"><div class="container"><div class="section-head reveal"><div><span class="kicker">${esc(home.services_kicker)}</span><h2>${esc(home.services_title)}</h2></div><p>${esc(home.services_text)}</p></div><div class="services-grid">${homeServices.map((item, index) => `<a class="service-card reveal" href="diensten.html#${attr(item.slug)}">${image(item.image, item.image_alt, item.fallback, ' loading="lazy"')}<span class="service-number">${pad(index + 1)}</span><div class="service-card-content"><h3>${esc(item.short_title || item.title)}</h3><p>${esc(item.short_text)}</p><span class="card-link">Ontdek de mogelijkheden</span></div></a>`).join('')}</div></div></section>
<section class="section"><div class="container split"><div class="split-media reveal">${image(home.about_image, home.about_image_alt, 'assets/images/sunset-fallback.svg', ' loading="lazy"')}<div class="split-badge">${esc(home.about_title)}</div></div><div class="split-copy reveal"><span class="kicker">${esc(home.about_kicker)}</span><h2>${esc(home.about_title)}</h2><p>${esc(home.about_text_1)}</p><p>${esc(home.about_text_2)}</p><ul class="feature-list">${(home.about_features || []).map(item => `<li><span class="check" aria-hidden="true"></span>${esc(item)}</li>`).join('')}</ul><div class="actions"><a class="btn btn-dark" href="over-ons.html">Leer Careye kennen</a></div></div></div></section>
${spotlight ? `<section class="section section-dark spotlight-section" aria-labelledby="spotlight-title"><div class="container"><div class="spotlight-heading reveal"><div><span class="kicker">${esc(home.spotlight_kicker)}</span><h2 id="spotlight-title">${esc(home.spotlight_title)}</h2></div><p>${esc(home.spotlight_intro)}</p></div><article class="spotlight-card reveal" data-polish-spotlight><div class="spotlight-visual" data-polish-surface>${image(spotlight.image, spotlight.image_alt, spotlight.fallback, ' class="spotlight-image spotlight-image-base" loading="lazy"')}${image(spotlight.image, '', spotlight.fallback, ' class="spotlight-image spotlight-image-polished" aria-hidden="true" loading="lazy"')}<span class="spotlight-polish-ring" aria-hidden="true"></span><div class="spotlight-instruction" aria-hidden="true"><span class="spotlight-instruction-icon"><svg viewBox="0 0 64 64" focusable="false"><circle cx="27" cy="38" r="17"></circle><g class="spotlight-instruction-blades"><path d="M27 38 42 34"></path><path d="M27 38 31 53"></path><path d="M27 38 12 42"></path><path d="M27 38 23 23"></path></g><rect x="22" y="30" width="10" height="10" rx="2"></rect><path d="M31 31 47 14h8"></path><path d="M47 14v9"></path></svg></span><span>Beweeg over de vloer</span></div></div><div class="spotlight-content"><div class="spotlight-meta"><span>${esc(spotlight.category_label)}</span><span>${esc(spotlight.application)}</span></div><h3>${esc(spotlight.spotlight_heading || spotlight.title)}</h3><p>${esc(spotlight.spotlight_text)}</p><dl class="spotlight-specs"><div><dt>Toepassing</dt><dd>${esc(spotlight.application)}</dd></div><div><dt>Afwerking</dt><dd>${esc(spotlight.finish)}</dd></div><div><dt>Uitvoering</dt><dd>${esc(spotlight.execution)}</dd></div></dl><a class="text-link spotlight-link" href="projecten.html">Bekijk meer realisaties</a></div></article><div class="spotlight-related" aria-label="Meer realisaties">${related.map(item => `<a class="spotlight-related-card reveal" href="projecten.html">${image(item.image, item.image_alt, item.fallback, ' loading="lazy"')}<span class="spotlight-related-copy"><small>${esc(item.category_label)}</small><strong>${esc(item.spotlight_heading || item.title)}</strong></span></a>`).join('')}</div></div></section>` : ''}
<section class="section section-dark" style="padding-top:0"><div class="container"><div class="section-head reveal"><div><span class="kicker">${esc(home.process_kicker)}</span><h2>${esc(home.process_title)}</h2></div><p>${esc(home.process_text)}</p></div><div class="process">${(home.process_steps || []).map(item => `<div class="process-step reveal"><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p></div>`).join('')}</div></div></section>
<section class="section section-yellow cta-band"><div class="cta-ring" aria-hidden="true"></div><div class="container cta-grid"><div class="reveal"><h2>${esc(home.cta_title)}</h2><p>${esc(home.cta_text)}</p></div><div class="cta-actions reveal"><a class="btn btn-dark" href="contact.html#offerte">${esc(home.cta_button)}</a><a href="tel:${attr(site.phone_href)}"><strong>Bel ${esc(site.phone_display)}</strong><br><span>Rechtstreeks contact</span></a></div></div></section>
<section class="section"><div class="container jobs-preview"><div class="reveal"><span class="kicker">${esc(home.jobs_kicker)}</span><h2 class="title">${esc(home.jobs_title)}</h2><p style="color:var(--muted)">${esc(home.jobs_text)}</p><div class="actions"><a class="btn btn-dark" href="vacatures.html">${esc(home.jobs_button)}</a></div></div><div class="jobs-list reveal">${openJobs.map(item => `<a class="job-row" href="vacature-${attr(item.slug)}.html"><div><h3>${esc(item.title)}</h3><span>${esc(item.category)}</span></div><span class="job-arrow" aria-hidden="true"></span></a>`).join('')}</div></div></section>
</main>`;
}

function servicesMain(page, services) {
  const published = services.filter(item => item.published !== false);
  return `<main id="main">${pageHero(page, 'Diensten', 'assets/images/industrial-fallback.svg')}<section class="section section-white"><div class="container">${published.map((item, index) => `<div class="service-detail reveal" id="${attr(item.slug)}"><div class="service-detail-index">${pad(index + 1)} / ${esc(item.index_label)}</div><div><h2>${esc(item.title)}</h2><p>${esc(item.description_1)}</p><p>${esc(item.description_2)}</p><div class="pill-list">${(item.features || []).map(feature => `<span class="pill">${esc(feature)}</span>`).join('')}</div><div class="actions"><a class="btn btn-dark" href="contact.html#offerte">${esc(item.button_label)}</a></div></div></div>`).join('')}</div></section><section class="section section-yellow cta-band"><div class="cta-ring"></div><div class="container cta-grid"><div><h2>${esc(page.cta_title)}</h2><p>${esc(page.cta_text)}</p></div><div class="cta-actions"><a class="btn btn-dark" href="contact.html#offerte">${esc(page.cta_button)}</a></div></div></section></main>`;
}

function projectsMain(page, projects) {
  const published = projects.filter(item => item.published !== false);
  const categories = [...new Map(published.map(item => [item.category, item.category_label])).entries()];
  return `<main id="main">${pageHero(page, 'Projecten', 'assets/images/sunset-fallback.svg')}<section class="section"><div class="container"><div class="gallery-tools"><div><span class="kicker">${esc(page.section_kicker)}</span><h2 class="title" style="font-size:44px">${esc(page.section_title)}</h2></div><div class="filters" aria-label="Projectfilters"><button class="filter-btn active" data-filter="all">Alles</button>${categories.map(([key, label]) => `<button class="filter-btn" data-filter="${attr(key)}">${esc(label)}</button>`).join('')}</div></div><div class="gallery">${published.map(item => `<article class="project-card reveal" data-project-category="${attr(item.category)}">${image(item.image, item.image_alt, item.fallback, ' loading="lazy"')}<div class="project-overlay"><span class="project-tag">${esc(item.category_label)}</span><h3>${esc(item.title)}</h3></div></article>`).join('')}</div></div></section><section class="section section-dark"><div class="container split"><div class="split-copy reveal"><span class="kicker">${esc(page.cta_kicker)}</span><h2>${esc(page.cta_title)}</h2><p>${esc(page.cta_text)}</p><div class="actions"><a class="btn btn-primary" href="contact.html#offerte">${esc(page.cta_button)}</a></div></div><div class="split-media reveal" style="min-height:480px">${image(page.cta_image, page.cta_image_alt, 'assets/images/industrial-fallback.svg', ' loading="lazy"')}</div></div></section></main>`;
}

function aboutMain(page, site) {
  const locations = (site.locations || []).map(item => `<article class="location-card reveal"><h3>${esc(item.name)}</h3><p>${esc(item.address_line_1)}<br>${esc(item.address_line_2)}</p><a class="text-link" href="${attr(item.maps_url)}" target="_blank" rel="noreferrer">Route bekijken</a></article>`).join('');
  return `<main id="main">${pageHero(page, 'Over Careye')}<section class="section"><div class="container split"><div class="split-media reveal">${image(page.story_image, page.story_image_alt, 'assets/images/sunset-fallback.svg', ' loading="lazy"')}<div class="split-badge">Sterk in beton, sterk in opvolging</div></div><div class="split-copy reveal"><span class="kicker">${esc(page.story_kicker)}</span><h2>${esc(page.story_title)}</h2>${(page.story_paragraphs || []).map(text => `<p>${esc(text)}</p>`).join('')}</div></div></section><section class="section section-white"><div class="container"><div class="section-head reveal"><div><span class="kicker">${esc(page.values_kicker)}</span><h2>${esc(page.values_title)}</h2></div><p>${esc(page.values_text)}</p></div><div class="values-grid">${(page.values || []).map((item, index) => `<article class="value-card reveal"><div class="value-icon">${pad(index + 1)}</div><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p></article>`).join('')}</div></div></section><section class="section section-dark"><div class="container"><div class="stats"><div class="stat reveal"><strong>10+</strong><span>jaar ervaring</span></div><div class="stat reveal"><strong>${esc((site.locations || []).length)}</strong><span>vestigingen</span></div><div class="stat reveal"><strong>4</strong><span>kernspecialisaties</span></div></div></div></section><section class="section"><div class="container"><div class="section-head reveal"><div><span class="kicker">${esc(page.locations_kicker)}</span><h2>${esc(page.locations_title)}</h2></div><p>${esc(page.locations_text)}</p></div><div class="locations">${locations}</div></div></section><section class="section section-yellow cta-band"><div class="cta-ring"></div><div class="container cta-grid"><div><h2>${esc(page.cta_title)}</h2></div><div class="cta-actions"><a class="btn btn-dark" href="contact.html">${esc(page.cta_button)}</a><a class="btn btn-outline" href="vacatures.html">Werken bij Careye</a></div></div></section></main>`;
}

function jobUrl(job) {
  return `vacature-${attr(job.slug)}.html`;
}

function jobsMain(page, site, jobs) {
  const published = jobs.filter(item => item.published !== false);
  const cards = published.map(item => `<article class="job-card reveal"><span class="job-type">${esc(item.category)}</span><h2>${esc(item.title)}</h2><div class="job-card-meta"><span>${esc(item.location)}</span><span>${esc(item.employment_type)}</span></div><p>${esc(item.summary)}</p><a class="card-link" href="${jobUrl(item)}">${esc(item.button_label || 'Bekijk de vacature')}</a></article>`).join('');
  const spontaneous = published.find(item => item.slug === 'spontane-sollicitatie');
  return `<main id="main">${pageHero(page, 'Vacatures')}<section class="section"><div class="container"><div class="section-head reveal"><div><span class="kicker">${esc(page.section_kicker)}</span><h2>${esc(page.section_title)}</h2></div><p>${esc(page.section_text)}</p></div><div class="job-grid">${cards}</div></div></section><section class="section section-dark"><div class="container split"><div class="split-copy reveal"><span class="kicker">${esc(page.closing_kicker)}</span><h2>${esc(page.closing_title)}</h2><p>${esc(page.closing_text)}</p><div class="actions"><a class="btn btn-primary" href="${spontaneous ? jobUrl(spontaneous) : 'vacatures.html'}">${esc(page.closing_button)}</a></div></div><div class="split-media reveal" style="min-height:480px">${image(page.hero_image, page.hero_image_alt, 'assets/images/sunset-fallback.svg', ' loading="lazy"')}</div></div></section></main>`;
}

function jobHero(job) {
  return `<section class="page-hero job-hero"><div class="page-hero-media">${image(job.image, job.image_alt, 'assets/images/industrial-fallback.svg', ' loading="eager"')}</div><div class="container page-hero-inner"><div class="breadcrumb"><a href="index.html">Home</a><span>/</span><a href="vacatures.html">Vacatures</a><span>/</span><span>${esc(job.title)}</span></div><span class="eyebrow">${esc(job.eyebrow || 'Vacature')}</span><h1>${esc(job.title)}</h1><p>${esc(job.intro)}</p><div class="job-hero-meta"><span>${esc(job.category)}</span><span>${esc(job.location)}</span><span>${esc(job.employment_type)}</span></div></div></section>`;
}

function jobDetailMain(job, site) {
  const responsibilities = (job.responsibilities || []).map(item => `<li><span class="check" aria-hidden="true"></span>${esc(item)}</li>`).join('');
  const profile = (job.profile || []).map(item => `<li><span class="check" aria-hidden="true"></span>${esc(item)}</li>`).join('');
  const offer = (job.offer || []).map(item => `<li><span class="check" aria-hidden="true"></span>${esc(item)}</li>`).join('');
  return `<main id="main">${jobHero(job)}<section class="section"><div class="container job-detail-grid"><article class="job-content reveal"><section class="job-section"><span class="kicker">De functie</span><h2>${esc(job.responsibilities_title)}</h2><ul class="feature-list job-list">${responsibilities}</ul></section><section class="job-section"><span class="kicker">Uw profiel</span><h2>${esc(job.profile_title)}</h2><ul class="feature-list job-list">${profile}</ul></section><section class="job-section"><span class="kicker">Ons aanbod</span><h2>${esc(job.offer_title)}</h2><ul class="feature-list job-list">${offer}</ul></section></article><aside class="job-sidebar reveal"><div class="job-facts"><span class="job-type">${esc(job.category)}</span><h2>${esc(job.title)}</h2><dl><div><dt>Locatie</dt><dd>${esc(job.location)}</dd></div><div><dt>Contract</dt><dd>${esc(job.employment_type)}</dd></div><div><dt>Contact</dt><dd><a href="mailto:${attr(site.jobs_email)}">${esc(site.jobs_email)}</a></dd></div></dl><a class="btn btn-dark" href="#solliciteer">Solliciteer nu</a><a class="text-link" href="vacatures.html">Bekijk alle vacatures</a></div></aside></div></section><section class="section section-white" id="solliciteer"><div class="container application-grid"><div class="application-intro reveal"><span class="kicker">Solliciteren</span><h2>Stel u kandidaat voor ${esc(job.title)}.</h2><p>${esc(job.closing_text)}</p><p class="application-contact">Uw kandidatuur wordt rechtstreeks verstuurd naar <a href="mailto:${attr(site.jobs_email)}">${esc(site.jobs_email)}</a>.</p></div><div class="form-card reveal"><form class="async-form" action="/api/solliciteren" method="post" enctype="multipart/form-data" data-async-form><input type="hidden" name="job" value="${attr(job.title)}"><div class="honeypot" aria-hidden="true"><label for="website-${attr(job.slug)}">Website</label><input id="website-${attr(job.slug)}" name="website" tabindex="-1" autocomplete="off"></div><div class="form-grid"><div class="field"><label for="first-name-${attr(job.slug)}">Voornaam</label><input id="first-name-${attr(job.slug)}" name="first_name" autocomplete="given-name" required></div><div class="field"><label for="last-name-${attr(job.slug)}">Familienaam</label><input id="last-name-${attr(job.slug)}" name="last_name" autocomplete="family-name" required></div><div class="field"><label for="email-${attr(job.slug)}">E-mail</label><input id="email-${attr(job.slug)}" name="email" type="email" autocomplete="email" required></div><div class="field"><label for="phone-${attr(job.slug)}">Telefoon</label><input id="phone-${attr(job.slug)}" name="phone" type="tel" autocomplete="tel" required></div><div class="field full"><label for="motivation-${attr(job.slug)}">Motivatie</label><textarea id="motivation-${attr(job.slug)}" name="motivation" placeholder="Vertel kort waarom deze functie u aanspreekt."></textarea></div><div class="field full file-field"><label for="cv-${attr(job.slug)}">Cv opladen</label><input id="cv-${attr(job.slug)}" name="cv" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" required data-max-size="8388608"><small>PDF, DOC of DOCX. Maximaal 8 MB.</small></div><div class="field full consent-field"><label><input name="consent" type="checkbox" value="ja" required><span>Ik ga akkoord dat Careye mijn gegevens gebruikt om mijn sollicitatie te behandelen.</span></label></div><div class="field full"><button class="btn btn-dark" type="submit">Verstuur sollicitatie</button></div></div><div class="form-feedback" data-form-feedback role="status" aria-live="polite"></div></form></div></div></section></main>`;
}

function contactMain(page, site, services) {
  const options = services.filter(item => item.published !== false).map(item => `<option>${esc(item.title)}</option>`).join('');
  const locations = (site.locations || []).map(item => `<article class="location-card reveal"><h3>${esc(item.name)}</h3><p>${esc(item.address_line_1)}<br>${esc(item.address_line_2)}</p><a class="text-link" href="${attr(item.maps_url)}" target="_blank" rel="noreferrer">Open in Google Maps</a></article>`).join('');
  return `<main id="main">${pageHero(page, 'Contact', 'assets/images/industrial-fallback.svg')}<section class="section" id="offerte"><div class="container contact-grid"><div class="contact-details reveal"><div><span class="kicker">${esc(page.contact_kicker)}</span><h2 class="title">${esc(page.contact_title)}</h2></div><div class="contact-block"><h3>Contact en offerteaanvragen</h3><a href="mailto:${attr(site.email)}">${esc(site.email)}</a><br><a href="tel:${attr(site.phone_href)}">${esc(site.phone_display)}</a></div><div class="contact-block"><h3>Sollicitaties</h3><p>Solliciteren verloopt via het formulier op de detailpagina van elke vacature.</p><a href="vacatures.html">Bekijk de vacatures</a></div><div class="contact-block"><h3>${esc(page.help_title)}</h3><p>${esc(page.help_text)}</p></div></div><div class="form-card reveal"><h2>${esc(page.form_title)}</h2><form class="async-form" action="/api/contact" method="post" data-async-form><div class="honeypot" aria-hidden="true"><label for="website-contact">Website</label><input id="website-contact" name="website" tabindex="-1" autocomplete="off"></div><div class="form-grid"><div class="field"><label for="first-name">Voornaam</label><input id="first-name" name="first_name" autocomplete="given-name" required></div><div class="field"><label for="last-name">Familienaam</label><input id="last-name" name="last_name" autocomplete="family-name" required></div><div class="field"><label for="email">E-mail</label><input id="email" name="email" type="email" autocomplete="email" required></div><div class="field"><label for="phone">Telefoon</label><input id="phone" name="phone" type="tel" autocomplete="tel"></div><div class="field full"><label for="project">Type aanvraag</label><select id="project" name="project">${options}<option>Algemene vraag</option><option>Andere aanvraag</option></select></div><div class="field full"><label for="subject">Onderwerp</label><input id="subject" name="subject" value="${attr(page.form_subject)}" required></div><div class="field full"><label for="message">Uw bericht</label><textarea id="message" name="message" placeholder="${attr(page.form_placeholder)}" required></textarea></div><div class="field full consent-field"><label><input name="consent" type="checkbox" value="ja" required><span>Ik ga akkoord dat Careye mijn gegevens gebruikt om mijn aanvraag te behandelen.</span></label></div><div class="field full"><button class="btn btn-dark" type="submit">Verstuur aanvraag</button></div></div><p class="form-note">${esc(page.form_intro)}</p><div class="form-feedback" data-form-feedback role="status" aria-live="polite"></div></form></div></div></section><section class="section section-white"><div class="container"><div class="section-head reveal"><div><span class="kicker">${esc(page.locations_kicker)}</span><h2>${esc(page.locations_title)}</h2></div><p>${esc(page.locations_text)}</p></div><div class="locations">${locations}</div></div></section></main>`;
}

function legalMain(page, label) {
  return `<main id="main"><section class="page-hero"><div class="container page-hero-inner"><div class="breadcrumb"><a href="index.html">Home</a><span>/</span><span>${esc(label)}</span></div><span class="eyebrow">${esc(page.eyebrow)}</span><h1>${esc(page.title)}</h1><p>${esc(page.intro)}</p></div></section><section class="section"><div class="container legal-content reveal">${page.body || ''}</div></section></main>`;
}

function adminMain() {
  return `<main id="main"><section class="page-hero"><div class="container page-hero-inner"><div class="breadcrumb"><a href="index.html">Home</a><span>/</span><span>Beheer</span></div><span class="eyebrow">Websitebeheer</span><h1>Pas teksten, projecten en vacatures aan zonder code.</h1><p>De inhoud van deze website wordt beheerd via Pages CMS. Aanpassingen worden opgeslagen in GitHub en daarna automatisch gepubliceerd door Cloudflare Pages.</p></div></section><section class="section"><div class="container"><div class="section-head"><div><span class="kicker">Contentbeheer</span><h2>Open het beveiligde beheerpaneel.</h2></div><p>Meld u aan met het account dat toegang heeft tot de GitHub repository van de website.</p></div><div class="actions"><a class="btn btn-dark" href="https://app.pagescms.org" target="_blank" rel="noreferrer">Open Pages CMS</a></div></div></section></main>`;
}

function compose(template, { site, active, meta, main }) {
  let html = template;
  html = html.replace(/<title>.*?<\/title>/s, `<title>${esc(meta.meta_title)}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${attr(meta.meta_description)}">`);
  html = html.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${attr(meta.meta_title)}">`);
  html = html.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${attr(meta.meta_description)}">`);
  html = html.replace(/<link rel="icon" href="[^"]*"/, `<link rel="icon" href="${attr(site.favicon)}"`);
  html = html.replace(/<a class="skip-link"[\s\S]*?<main id="main">/, `${renderHeader(site, active)}<main id="main">`);
  html = html.replace(/<main id="main">[\s\S]*?<\/main>/, main);
  html = html.replace(/<footer class="site-footer">[\s\S]*?<\/footer>/, renderFooter(site));
  return html;
}

async function copyDir(source, target) {
  await fs.cp(source, target, { recursive: true });
}

async function writePage(filename, active, page, main, templateName = 'template.html') {
  const template = await fs.readFile(path.join(root, 'src/pages', templateName), 'utf8');
  const html = compose(template, { site, active, meta: page, main });
  await fs.writeFile(path.join(out, filename), html);
}

await fs.rm(out, { recursive: true, force: true });
await fs.mkdir(out, { recursive: true });

const site = await readJson('content/site.json');
const home = await readJson('content/pages/home.json');
const diensten = await readJson('content/pages/diensten.json');
const projectenPage = await readJson('content/pages/projecten.json');
const over = await readJson('content/pages/over-ons.json');
const vacatures = await readJson('content/pages/vacatures.json');
const contact = await readJson('content/pages/contact.json');
const voorwaarden = await readJson('content/pages/algemene-voorwaarden.json');
const privacy = await readJson('content/pages/privacy.json');
const cookies = await readJson('content/pages/cookies.json');
const services = await readCollection('content/services');
const projects = await readCollection('content/projects');
const jobs = await readCollection('content/jobs');

await copyDir(path.join(root, 'assets'), path.join(out, 'assets'));
await fs.copyFile(path.join(root, '_headers'), path.join(out, '_headers'));
await fs.copyFile(path.join(root, '_redirects'), path.join(out, '_redirects'));

await writePage('index.html', 'home', home, homeMain(home, site, services, projects, jobs));
await writePage('diensten.html', 'diensten', diensten, servicesMain(diensten, services));
await writePage('projecten.html', 'projecten', projectenPage, projectsMain(projectenPage, projects));
await writePage('over-ons.html', 'over-ons', over, aboutMain(over, site));
await writePage('vacatures.html', 'vacatures', vacatures, jobsMain(vacatures, site, jobs));
for (const job of jobs.filter(item => item.published !== false)) {
  const jobPage = {
    ...job,
    meta_title: `${job.title} | Vacature bij Betonwerken Careye`,
    meta_description: job.summary
  };
  await writePage(`vacature-${job.slug}.html`, 'vacatures', jobPage, jobDetailMain(job, site));
}
await writePage('contact.html', 'contact', contact, contactMain(contact, site, services));
await writePage('algemene-voorwaarden.html', '', voorwaarden, legalMain(voorwaarden, 'Algemene voorwaarden'));
await writePage('privacy.html', '', privacy, legalMain(privacy, 'Privacy'));
await writePage('cookies.html', '', cookies, legalMain(cookies, 'Cookies'));
await writePage('beheer.html', '', { meta_title: 'Websitebeheer | Betonwerken Careye', meta_description: 'Contentbeheer voor de website van Betonwerken Careye.' }, adminMain());

console.log(`Careye website gebouwd in ${out}`);
