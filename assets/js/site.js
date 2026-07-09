
document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

const menuBtn = document.getElementById('menuBtn');
const mainNav = document.getElementById('mainNav');
if (menuBtn && mainNav) {
  menuBtn.addEventListener('click', () => mainNav.classList.toggle('open'));
}

const dropdowns = [...document.querySelectorAll('.nav-dropdown')];
function closeDropdowns(except = null) {
  dropdowns.forEach(drop => {
    if (drop !== except) {
      drop.classList.remove('open');
      const trigger = drop.querySelector('.services-main-link');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    }
  });
}

dropdowns.forEach(drop => {
  const trigger = drop.querySelector('.services-main-link');
  const panel = drop.querySelector('.dropdown-panel');
  if (!trigger || !panel) return;

  trigger.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    const willOpen = !drop.classList.contains('open');
    closeDropdowns(drop);
    drop.classList.toggle('open', willOpen);
    trigger.setAttribute('aria-expanded', String(willOpen));
  });

  panel.addEventListener('click', event => event.stopPropagation());
});

document.addEventListener('click', () => closeDropdowns());
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeDropdowns();
});

const consultForm = document.getElementById('consultForm');
if (consultForm) {
  consultForm.addEventListener('submit', async event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(consultForm).entries());
    const message = document.getElementById('formMessage');
    try {
      const response = await fetch('/api/consult', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Yuborilmadi');
      if (message) message.textContent = 'So‘rovingiz yuborildi. Tez orada siz bilan bog‘lanamiz.';
      consultForm.reset();
    } catch (error) {
      if (message) message.textContent = 'Yuborishda muammo yuz berdi. Iltimos, telefon orqali bog‘laning.';
    }
  });
}


// Section and card animations. Content stays visible when JavaScript is disabled.
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const selectors = [
    '.hero-copy', '.hero-visual', '.page-hero .shell', '.section-head',
    '.metric', '.service-card', '.process-step', '.solution-points', '.image-frame',
    '.price-card', '.home-member-card', '.team-card', '.news-card',
    '.map-card', '.contact-form', '.service-text-panel', '.service-visual-small',
    '.service-process-grid article', '.deliver-card', '.legal-card', '.service-cta'
  ];
  const elements = [...document.querySelectorAll(selectors.join(','))];
  if (!elements.length) return;

  elements.forEach((element, index) => {
    element.classList.add('reveal');
    const localIndex = [...(element.parentElement?.children || [])].indexOf(element);
    element.style.setProperty('--reveal-delay', `${Math.min(Math.max(localIndex, 0) * 75, 300)}ms`);
  });

  document.querySelectorAll('.hero-copy').forEach(el => el.classList.add('reveal-left'));
  document.querySelectorAll('.hero-visual,.service-visual-small').forEach(el => el.classList.add('reveal-right'));

  if (reduceMotion || !('IntersectionObserver' in window)) {
    elements.forEach(element => element.classList.add('reveal-visible'));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });

  requestAnimationFrame(() => elements.forEach(element => observer.observe(element)));
})();
