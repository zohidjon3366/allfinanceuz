
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

const currentLang = document.body.dataset.lang || document.documentElement.lang || 'uz';
const uiMessages={uz:{sent:'So‘rovingiz yuborildi. Tez orada siz bilan bog‘lanamiz.',error:'Yuborishda muammo yuz berdi. Iltimos, telefon orqali bog‘laning.',currency:'so‘m / oy'},ru:{sent:'Заявка отправлена. Мы скоро свяжемся с вами.',error:'Не удалось отправить заявку. Пожалуйста, свяжитесь с нами по телефону.',currency:'сум / месяц'},en:{sent:'Your request has been sent. We will contact you shortly.',error:'The request could not be sent. Please contact us by phone.',currency:'UZS / month'},zh:{sent:'您的申请已提交，我们将尽快与您联系。',error:'申请提交失败，请通过电话联系我们。',currency:'乌兹别克斯坦苏姆/月'}};
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
      if (message) message.textContent = (uiMessages[currentLang]||uiMessages.uz).sent;
      consultForm.reset();
    } catch (error) {
      if (message) message.textContent = (uiMessages[currentLang]||uiMessages.uz).error;
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

const calcBtn=document.getElementById('calcBtn');if(calcBtn){calcBtn.addEventListener('click',()=>{const type=document.getElementById('taxType')?.value||'turnover';const employees=Number(document.getElementById('employees')?.value||0);const invoices=Number(document.getElementById('invoices')?.value||0);const bankOps=Number(document.getElementById('bankOps')?.value||0);const ie=document.getElementById('importExport')?.checked;let price=type==='vat'||type==='profit'?3500000:1500000;price+=Math.max(0,employees-5)*90000+Math.max(0,invoices-30)*18000+Math.max(0,bankOps-50)*9000;if(ie)price+=1200000;price=Math.ceil(price/100000)*100000;const locale=currentLang==='ru'?'ru-RU':currentLang==='en'?'en-US':currentLang==='zh'?'zh-CN':'uz-UZ';const label=currentLang==='en'?`UZS ${price.toLocaleString(locale)} / month`:currentLang==='zh'?`${price.toLocaleString(locale)} 乌兹别克斯坦苏姆/月`:`${price.toLocaleString(locale)} ${(uiMessages[currentLang]||uiMessages.uz).currency}`;const el=document.getElementById('calcPrice');if(el)el.textContent=label;});}


// Preserve article/query context while changing language.
document.querySelectorAll('[data-lang-link]').forEach(link=>{
  const original=link.getAttribute('href');
  if(!original) return;
  if(location.pathname.endsWith('maqola.html') && location.search){
    link.setAttribute('href', original + location.search);
  }
});
