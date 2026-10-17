// ---------------------------------------------------------------
// Settings. Fill these in during setup; the site works without them.
// ---------------------------------------------------------------
const SETTINGS = {
  email: 'wynconsultancy@gmail.com',
  // Cal.com booking link. Empty = show email fallback.
  calLink: 'https://cal.com/wyn-consultancy-5wpu62/intro',
  // Form service URLs (e.g. Formspree). Empty = forms open a pre-filled email instead.
  contactEndpoint: 'https://formspree.io/f/xqpewjgv',
  newsletterEndpoint: 'https://formspree.io/f/xyeklvlg',
  // Substack publication. Set = the footer sign-up opens Substack's subscribe page with the email filled in.
  substackUrl: 'https://wynconsultancy.substack.com',
  // Tracking. Each only loads after the visitor accepts cookies. Empty = off, and no banner.
  ga4Id: 'G-KZLNQTWZ6S',        // Google Analytics 4 measurement ID, e.g. 'G-ABC123XYZ'
  metaPixelId: '1665031928662954',  // Meta Pixel / dataset ID, e.g. '123456789012345'
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

async function post(endpoint, form, note, success, subject) {
  const button = form.querySelector('button[type="submit"]');
  const data = new FormData(form);
  data.append('_subject', subject);
  data.append('page', location.pathname);
  if (button) button.disabled = true;
  note.textContent = 'Sending…';
  try {
    const res = await fetch(endpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: data });
    if (!res.ok) throw new Error();
    form.reset();
    note.textContent = success;
  } catch {
    note.textContent = `Sorry, that didn't send. Please email ${SETTINGS.email} and we'll reply within two working days.`;
  } finally {
    if (button) button.disabled = false;
  }
}

// Newsletter sign-up (footer of every page)
document.querySelectorAll('form[data-form="newsletter"]').forEach((form) => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const note = form.parentElement.querySelector('.note');
    if (SETTINGS.substackUrl) {
      window.open(`${SETTINGS.substackUrl}/subscribe?email=${encodeURIComponent(form.email.value.trim())}`, '_blank', 'noopener');
      note.textContent = 'Almost done: confirm on the Substack page that just opened.';
      return;
    }
    if (!SETTINGS.newsletterEndpoint) {
      mailto('Newsletter sign-up', `Please add ${form.email.value.trim()} to the WYN newsletter.`);
      return;
    }
    post(SETTINGS.newsletterEndpoint, form, note, 'Thank you! You’re on the list.', 'New newsletter sign-up (wyn-consultancy.com)');
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
    post(SETTINGS.contactEndpoint, contact, note, 'Thanks, your message is in. We’ll be in touch soon.', `New enquiry: ${contact.elements.interest.value}`);
  });
}

// Guide downloads: details go to WYN (via the contact form service), then the download opens
document.querySelectorAll('form[data-form="guide"]').forEach((form) => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const note = form.querySelector('.note');
    const ready = form.parentElement.querySelector('.guide-ready');
    const button = form.querySelector('button[type="submit"]');
    const data = new FormData(form);
    data.append('_subject', `Guide download: ${form.dataset.guide}`);
    data.append('page', location.pathname);
    button.disabled = true; note.textContent = 'Preparing your guide…';
    try {
      const res = await fetch(SETTINGS.contactEndpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: data });
      if (!res.ok) throw new Error();
      form.hidden = true; ready.hidden = false; ready.querySelector('a')?.focus();
    } catch {
      button.disabled = false;
      note.textContent = `Sorry, that didn't go through. Please try again, or email ${SETTINGS.email} and we'll send it over.`;
    }
  });
});

// Booking calendar on the contact page (Cal.com's official inline embed)
const booking = document.querySelector('[data-booking]');
if (booking && SETTINGS.calLink) {
  booking.classList.add('booking--live');
  booking.innerHTML = `
    <h2>Book an intro call</h2>
    <p>Free, 20 minutes, on video. Pick a time that works for you.</p>
    <div id="cal-inline"></div>
    <p class="small-print">Calendar not loading? <a href="${SETTINGS.calLink}" target="_blank" rel="noopener">Open it on Cal.com</a>.</p>`;

  // Loader snippet from Cal.com's embed docs
  (function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if (typeof namespace === "string") { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ["initNamespace", namespace]); } else p(cal, ar); return; } p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");

  Cal("init", "intro", { origin: "https://app.cal.com" });
  Cal.ns.intro("inline", {
    elementOrSelector: "#cal-inline",
    calLink: new URL(SETTINGS.calLink).pathname.slice(1),
    config: { layout: "month_view", theme: "light" },
  });
  Cal.ns.intro("ui", { theme: "light", layout: "month_view", cssVarsPerTheme: { light: { "cal-brand": "#7f0201" } } });
  Cal.ns.intro("on", { action: "bookingSuccessful", callback: () => trackLead('intro-call') });
}

// Header turns translucent once the page scrolls
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 24);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// Scroll reveals, for lists only: items settle into place as they enter the viewport,
// staggered slightly. Skipped entirely for reduced motion.
if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  const targets = document.querySelectorAll([
    '.panel-card', '.svc-card', '.srow', '.steps li', '.features > div', '.news-card', '.offer',
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

// ---------------------------------------------------------------
// Cookie consent (UK GDPR / PECR).
// Nothing non-essential loads until the visitor says yes. "Accept" and "Reject"
// carry equal weight, and the choice can be changed any time from the footer.
// The banner only appears once a tracking ID is set in SETTINGS.
// ---------------------------------------------------------------
const CONSENT_KEY = 'wyn-consent-v1';
const tracking = { analytics: !!SETTINGS.ga4Id, marketing: !!SETTINGS.metaPixelId };

function readConsent() {
  try { return JSON.parse(localStorage.getItem(CONSENT_KEY)); } catch { return null; }
}
function saveConsent(c) {
  try { localStorage.setItem(CONSENT_KEY, JSON.stringify({ ...c, date: new Date().toISOString() })); } catch {}
}

function loadScript(src) {
  const s = document.createElement('script');
  s.async = true;
  s.src = src;
  document.head.append(s);
}

function loadAnalytics() {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { dataLayer.push(arguments); };
  gtag('js', new Date());
  gtag('config', SETTINGS.ga4Id, { anonymize_ip: true });
  loadScript(`https://www.googletagmanager.com/gtag/js?id=${SETTINGS.ga4Id}`);
}

function loadMetaPixel() {
  if (window.fbq) return;
  const fbq = window.fbq = function () { fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments); };
  if (!window._fbq) window._fbq = fbq;
  fbq.push = fbq; fbq.loaded = true; fbq.version = '2.0'; fbq.queue = [];
  loadScript('https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', SETTINGS.metaPixelId);
  fbq('track', 'PageView');
}

function applyConsent(c) {
  if (c.analytics && tracking.analytics) loadAnalytics();
  if (c.marketing && tracking.marketing) loadMetaPixel();
}

// Conversion events, only sent if the matching tool was allowed to load
function trackLead(kind) {
  if (window.gtag) gtag('event', 'generate_lead', { method: kind });
  if (window.fbq) fbq('track', 'Lead', { content_name: kind });
}
document.addEventListener('submit', (e) => {
  const kind = e.target.dataset && e.target.dataset.form;
  if (kind) trackLead(kind);
});

function showBanner(open = false) {
  document.querySelector('.cookie-banner')?.remove();
  const current = readConsent() || { analytics: false, marketing: false };
  const el = document.createElement('div');
  el.className = 'cookie-banner';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-labelledby', 'cookie-title');
  el.innerHTML = `
    <h2 id="cookie-title">Cookies</h2>
    <p>We'd like to use cookies to understand how people use this site and to measure our ads. Nothing is set unless you say yes. <a href="/privacy/">Privacy and cookies</a></p>
    <form class="cookie-options" ${open ? '' : 'hidden'}>
      ${tracking.analytics ? `<label><input type="checkbox" name="analytics" ${current.analytics ? 'checked' : ''}> <span><strong>Analytics</strong> Google Analytics: which pages are visited and how people find us.</span></label>` : ''}
      ${tracking.marketing ? `<label><input type="checkbox" name="marketing" ${current.marketing ? 'checked' : ''}> <span><strong>Marketing</strong> Meta Pixel: measures and improves our ads on Instagram and Facebook.</span></label>` : ''}
    </form>
    <div class="cookie-actions">
      <button type="button" class="btn btn--solid" data-c="accept">Accept all</button>
      <button type="button" class="btn btn--solid" data-c="reject">Reject all</button>
      <button type="button" class="cookie-manage" data-c="${open ? 'save' : 'manage'}">${open ? 'Save choices' : 'Choose'}</button>
    </div>`;
  document.body.append(el);

  const close = (c) => {
    const changedToOff = (current.analytics && !c.analytics) || (current.marketing && !c.marketing);
    saveConsent(c);
    el.remove();
    if (changedToOff) location.reload(); // stop scripts that were already running
    else applyConsent(c);
  };
  el.addEventListener('click', (e) => {
    const action = e.target.closest('[data-c]')?.dataset.c;
    if (action === 'accept') close({ analytics: true, marketing: true });
    if (action === 'reject') close({ analytics: false, marketing: false });
    if (action === 'manage') showBanner(true);
    if (action === 'save') {
      const f = el.querySelector('.cookie-options');
      close({ analytics: !!f.analytics?.checked, marketing: !!f.marketing?.checked });
    }
  });
}

if (tracking.analytics || tracking.marketing) {
  const c = readConsent();
  if (c) applyConsent(c); else showBanner();
  document.querySelectorAll('[data-cookie-settings]').forEach((b) => {
    b.hidden = false;
    b.addEventListener('click', () => showBanner(true));
  });
}
