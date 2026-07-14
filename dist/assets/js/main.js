
const header = document.querySelector('.site-header');
const toggle = document.querySelector('.menu-toggle');
const menu = document.querySelector('.nav-menu');

function setSticky() {
  if (!header) return;
  header.classList.toggle('is-sticky', window.scrollY > 90);
}
setSticky();
window.addEventListener('scroll', setSticky, { passive: true });

if (toggle && menu) {
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    menu.classList.toggle('open', !open);
    document.body.classList.toggle('menu-open', !open);
  });
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    toggle.setAttribute('aria-expanded', 'false');
    menu.classList.remove('open');
    document.body.classList.remove('menu-open');
  }));
}

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: .12 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

const filters = document.querySelectorAll('.filter-btn');
const projects = document.querySelectorAll('[data-project-category]');
filters.forEach(button => button.addEventListener('click', () => {
  filters.forEach(btn => btn.classList.remove('active'));
  button.classList.add('active');
  const filter = button.dataset.filter;
  projects.forEach(card => {
    card.hidden = filter !== 'all' && card.dataset.projectCategory !== filter;
  });
}));

document.querySelectorAll('[data-async-form]').forEach(form => {
  const feedback = form.querySelector('[data-form-feedback]');
  const submit = form.querySelector('button[type="submit"]');
  const defaultLabel = submit?.textContent || 'Versturen';

  const showFeedback = (message, type) => {
    if (!feedback) return;
    feedback.textContent = message;
    feedback.className = `form-feedback show ${type}`;
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const file = form.querySelector('input[type="file"]')?.files?.[0];
    const maxSize = Number(form.querySelector('input[type="file"]')?.dataset.maxSize || 0);
    if (file && maxSize && file.size > maxSize) {
      showFeedback('Het geselecteerde bestand is groter dan 8 MB.', 'error');
      return;
    }

    submit?.setAttribute('disabled', '');
    if (submit) submit.textContent = 'Bezig met versturen';
    showFeedback('Uw gegevens worden veilig verstuurd.', 'pending');

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'De verzending is niet gelukt. Probeer het later opnieuw.');
      form.reset();
      showFeedback(result.message || 'Bedankt. Uw gegevens zijn goed ontvangen.', 'success');
    } catch (error) {
      showFeedback(error.message || 'De verzending is niet gelukt. Probeer het later opnieuw.', 'error');
    } finally {
      submit?.removeAttribute('disabled');
      if (submit) submit.textContent = defaultLabel;
    }
  });
});

document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

if (toggle && menu) {
  const closeMenu = () => {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Menu openen');
    menu.classList.remove('open');
    document.body.classList.remove('menu-open');
  };

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-label', isOpen ? 'Menu sluiten' : 'Menu openen');
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1020) closeMenu();
  });
}


document.querySelectorAll('.brand, .footer-brand').forEach(brand => {
  const images = [...brand.querySelectorAll('img')];
  const fallback = brand.querySelector('.brand-fallback');
  if (!images.length || !fallback) return;

  let failed = 0;
  images.forEach(image => image.addEventListener('error', () => {
    failed += 1;
    if (failed === images.length) {
      images.forEach(item => { item.hidden = true; });
      fallback.hidden = false;
    }
  }));
});

// Project spotlight polishing effect
const polishSurfaces = document.querySelectorAll('[data-polish-surface]');
polishSurfaces.forEach(surface => {
  const updatePolishPosition = event => {
    const rect = surface.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
    surface.style.setProperty('--polish-x', `${x}px`);
    surface.style.setProperty('--polish-y', `${y}px`);
    surface.classList.add('is-polishing');
  };

  surface.addEventListener('pointerenter', updatePolishPosition);
  surface.addEventListener('pointermove', updatePolishPosition);
  surface.addEventListener('pointerleave', () => surface.classList.remove('is-polishing'));
});

// Custom concrete power trowel cursor for precise pointer devices
const supportsCustomCursor = window.matchMedia('(pointer: fine) and (hover: hover)').matches;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (supportsCustomCursor && !reducedMotion) {
  document.documentElement.classList.add('has-careye-cursor');

  const cursor = document.createElement('div');
  cursor.className = 'careye-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML = `
    <div class="careye-cursor-inner">
      <svg viewBox="0 0 64 64" focusable="false">
        <circle class="cursor-plate" cx="25" cy="36" r="18"></circle>
        <g class="cursor-blades">
          <path d="M25 36 41 32"></path>
          <path d="M25 36 29 52"></path>
          <path d="M25 36 9 40"></path>
          <path d="M25 36 21 20"></path>
        </g>
        <rect class="cursor-motor" x="20" y="30" width="10" height="11" rx="2"></rect>
        <path d="M29 30 46 12h8"></path>
        <path d="M46 12v10"></path>
        <path class="cursor-handle-grip" d="M52 12h7"></path>
      </svg>
    </div>`;
  document.body.appendChild(cursor);

  let pointerX = -100;
  let pointerY = -100;
  let frameRequested = false;

  const renderCursor = () => {
    cursor.style.left = `${pointerX}px`;
    cursor.style.top = `${pointerY}px`;
    frameRequested = false;
  };

  document.addEventListener('pointermove', event => {
    if (event.pointerType && event.pointerType !== 'mouse') return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    cursor.classList.add('is-visible');

    const target = event.target instanceof Element ? event.target : null;
    cursor.classList.toggle('is-action', Boolean(target?.closest('a, button, input, textarea, select, label')));
    cursor.classList.toggle('is-polishing', Boolean(target?.closest('[data-polish-surface]')));

    if (!frameRequested) {
      frameRequested = true;
      requestAnimationFrame(renderCursor);
    }
  }, { passive: true });

  document.addEventListener('pointerout', event => {
    if (!event.relatedTarget) cursor.classList.remove('is-visible');
  });

  window.addEventListener('blur', () => cursor.classList.remove('is-visible'));
}
