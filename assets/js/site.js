
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
