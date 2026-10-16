// ---------------------------------------------------------------
// Settings. Fill these in during setup; the site works without them.
// ---------------------------------------------------------------
const SETTINGS = {
  email: 'wyn-consultancy@gmail.com',
  // Cal.com booking link, e.g. 'https://cal.com/wyn/intro'. Empty = show email fallback.
  calLink: '',
  // Form service URLs (e.g. Formspree). Empty = forms open a pre-filled email instead.
  contactEndpoint: '',
  newsletterEndpoint: '',
};

// Mobile menu
const header = document.querySelector('.site-header');
const toggle = document.querySelector('.menu-toggle');
if (toggle) {
  toggle.addEventListener('click', () => {
    const open = header.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
  });
}

function mailto(subject, body) {
  window.location.href = `mailto:${SETTINGS.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

async function post(endpoint, form, note, success) {
  try {
    const res = await fetch(endpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) });
    if (!res.ok) throw new Error();
    form.reset();
    note.textContent = success;
  } catch {
    note.textContent = `Something went wrong. Please email ${SETTINGS.email}.`;
  }
}

// Newsletter sign-up (footer of every page)
document.querySelectorAll('form[data-form="newsletter"]').forEach((form) => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const note = form.parentElement.querySelector('.note');
    if (!SETTINGS.newsletterEndpoint) {
      mailto('Newsletter sign-up', `Please add ${form.email.value.trim()} to the WYN newsletter.`);
      return;
    }
    post(SETTINGS.newsletterEndpoint, form, note, 'Thank you! You’re on the list.');
  });
});

// Contact form
const contact = document.querySelector('form[data-form="contact"]');
if (contact) {
  contact.addEventListener('submit', (e) => {
    e.preventDefault();
    const note = contact.querySelector('.note');
    if (!SETTINGS.contactEndpoint) {
      const f = contact.elements;
      mailto(`Enquiry: ${f.interest.value}`,
        `Name: ${f.name.value}\nCompany: ${f.company.value}\nInterested in: ${f.interest.value}\n\n${f.message.value}`);
      return;
    }
    post(SETTINGS.contactEndpoint, contact, note, 'Thanks, your message is in. We’ll be in touch soon.');
  });
}

// Booking calendar on the contact page
const booking = document.querySelector('[data-booking]');
if (booking && SETTINGS.calLink) {
  booking.innerHTML = `<iframe src="${SETTINGS.calLink}?embed=true&theme=light" title="Book an intro call" loading="lazy"></iframe>`;
}

// Any "Book a call" link goes straight to the calendar once it exists
if (SETTINGS.calLink) {
  document.querySelectorAll('a[data-book]').forEach((a) => {
    a.href = SETTINGS.calLink;
    a.target = '_blank';
    a.rel = 'noopener';
  });
}

// Header turns translucent once the page scrolls
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 24);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// Scroll reveals, for lists only: items settle into place as they enter the viewport,
// staggered slightly. Skipped entirely for reduced motion.
if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  const targets = document.querySelectorAll([
    '.panel-card', '.svc-card', '.steps li', '.features > div', '.news-card', '.offer',
  ].join(','));

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('in');
      io.unobserve(el);
      // Once settled, hand the element back to its normal hover transitions
      const settle = (e) => {
        if (e.target !== el) return;
        el.removeEventListener('transitionend', settle);
        el.classList.remove('reveal', 'in');
        el.style.removeProperty('--i');
      };
      el.addEventListener('transitionend', settle);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  const set = new Set(targets);
  targets.forEach((el) => {
    const siblings = [...el.parentElement.children].filter((c) => set.has(c));
    el.style.setProperty('--i', Math.min(siblings.indexOf(el), 5));
    el.classList.add('reveal');
    io.observe(el);
  });
}

// Page transitions. Internal links fade the current page out briefly before navigating;
// the next page fades in (see the inline script in each page's <head>).
const root = document.documentElement;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

if (root.classList.contains('wyn-enter')) setTimeout(() => root.classList.remove('wyn-enter'), 1200);

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]');
  if (!a || reduceMotion.matches) return;
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  if (a.target && a.target !== '_self') return;
  if (a.hasAttribute('download')) return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin) return;
  if (url.pathname === location.pathname && url.search === location.search) return; // same page or #anchor

  e.preventDefault();
  try { sessionStorage.setItem('wyn-nav', '1'); } catch {}
  root.classList.remove('wyn-enter');
  root.classList.add('wyn-leave');
  setTimeout(() => { location.href = url.href; }, 280);
});

// Coming back with the browser's back button can restore a faded-out page
window.addEventListener('pageshow', (e) => {
  if (e.persisted) root.classList.remove('wyn-leave', 'wyn-enter');
});
