// ============ Navbar scroll state ============
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

// ============ Mobile menu ============
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', isOpen);
  navToggle.innerHTML = isOpen ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
});
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', false);
    navToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
  });
});

// ============ Active section indicator ============
const sections = document.querySelectorAll('section[id], header[id]');
const navItems = document.querySelectorAll('.nav-link');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      navItems.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
      });
    }
  });
}, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

sections.forEach(sec => sectionObserver.observe(sec));

// ============ Scroll reveal ============
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
revealEls.forEach(el => revealObserver.observe(el));

// ============ Lightbox for certificates (supports galleries) ============
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');
const lightboxCounter = document.getElementById('lightboxCounter');

let galleryImages = [];
let galleryIndex = 0;

function renderLightbox(){
  if (!galleryImages.length) return;
  lightboxImg.src = galleryImages[galleryIndex];
  // restart the zoom-in animation on every change
  lightboxImg.style.animation = 'none';
  void lightboxImg.offsetWidth;
  lightboxImg.style.animation = '';

  const multi = galleryImages.length > 1;
  lightboxPrev.classList.toggle('show', multi);
  lightboxNext.classList.toggle('show', multi);
  lightboxCounter.classList.toggle('show', multi);
  if (multi) lightboxCounter.textContent = `${galleryIndex + 1} / ${galleryImages.length}`;
}

function stepGallery(dir){
  if (galleryImages.length < 2) return;
  galleryIndex = (galleryIndex + dir + galleryImages.length) % galleryImages.length;
  renderLightbox();
}

document.querySelectorAll('[data-lightbox]').forEach(btn => {
  btn.addEventListener('click', () => {
    const gallery = btn.getAttribute('data-gallery');
    if (gallery) {
      try { galleryImages = JSON.parse(gallery); }
      catch (err) { galleryImages = [btn.getAttribute('data-lightbox')]; }
    } else {
      galleryImages = [btn.getAttribute('data-lightbox')];
    }
    galleryIndex = 0;
    renderLightbox();
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
});

function closeLightbox(){
  lightbox.classList.remove('open');
  lightboxImg.src = '';
  galleryImages = [];
  document.body.style.overflow = '';
}

lightboxClose.addEventListener('click', closeLightbox);
lightboxPrev.addEventListener('click', (e) => { e.stopPropagation(); stepGallery(-1); });
lightboxNext.addEventListener('click', (e) => { e.stopPropagation(); stepGallery(1); });
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') stepGallery(-1);
  if (e.key === 'ArrowRight') stepGallery(1);
});

// ============ Toast ============
const toast = document.getElementById('toast');
let toastTimer;
function showToast(message){
  clearTimeout(toastTimer);
  toast.innerHTML = `<i class="fa-solid fa-check"></i> ${message}`;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

// ============ Copy email buttons ============
// These are dedicated "copy" buttons only. Every mailto: link on the page
// now behaves the normal way — it opens the visitor's mail app.
document.querySelectorAll('.copy-email').forEach(el => {
  el.addEventListener('click', async () => {
    const email = el.getAttribute('data-email');
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
    } catch (err) {
      // Clipboard API blocked (e.g. opened via file://) — fall back to the
      // old execCommand trick so the button still does something useful.
      const tmp = document.createElement('textarea');
      tmp.value = email;
      tmp.style.position = 'fixed';
      tmp.style.opacity = '0';
      document.body.appendChild(tmp);
      tmp.select();
      try { document.execCommand('copy'); } catch (e2) { /* give up silently */ }
      document.body.removeChild(tmp);
    }
    showToast(`Email copied: ${email}`);
    el.classList.add('copied');
    setTimeout(() => el.classList.remove('copied'), 1600);
  });
});

// ============ Contact form — real delivery ============
//
//  HOW THIS WORKS
//  --------------
//  The site is static (no server), so the form posts to FormSubmit, a free
//  relay that forwards submissions to CONTACT_EMAIL. No account needed.
//
//  ONE-TIME ACTIVATION (required, do this once after publishing):
//    1. Upload the site somewhere with a real https:// address
//       (GitHub Pages, Netlify, Vercel — all free).
//    2. Open the live site and send yourself a test message through the form.
//    3. FormSubmit emails you an activation link — click it.
//    4. From then on every submission lands in your inbox automatically.
//
//  Note: activation only works from a real domain. Opening index.html
//  directly from your computer (file://) will fall back to the mail app.
//
//  WANT A DIFFERENT PROVIDER?
//  Swap ENDPOINT for one of these and nothing else changes:
//    Web3Forms : 'https://api.web3forms.com/submit'   (add access_key to the payload)
//    Formspree : 'https://formspree.io/f/YOUR_FORM_ID'
//
const CONTACT_EMAIL = 'nadamohamadmaklouf@gmail.com';
const ENDPOINT = `https://formsubmit.co/ajax/${CONTACT_EMAIL}`;

const contactForm = document.getElementById('contactForm');
const formStatus = document.getElementById('formStatus');
const submitBtn = document.getElementById('formSubmit');

function setStatus(text, kind){
  if (!formStatus) return;
  formStatus.textContent = text;
  formStatus.className = `form-status show ${kind || ''}`;
}

function mailtoFallback({ name, email, subject, message }){
  const body = `${message}\n\n— ${name} (${email})`;
  window.location.href =
    `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject || 'Portfolio contact')}&body=${encodeURIComponent(body)}`;
}

if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      subject: document.getElementById('subject').value.trim(),
      message: document.getElementById('message').value.trim()
    };

    submitBtn.classList.add('sending');
    setStatus('Sending…', '');

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          subject: data.subject,
          message: data.message,
          _subject: `Portfolio message: ${data.subject || 'no subject'}`,
          _template: 'table',
          _captcha: 'false'
        })
      });

      const out = await res.json().catch(() => ({}));
      if (!res.ok || out.success === 'false' || out.success === false) {
        throw new Error(out.message || `Request failed (${res.status})`);
      }

      submitBtn.classList.remove('sending');
      submitBtn.classList.add('done');
      submitBtn.querySelector('.btn-label').innerHTML = '<i class="fa-solid fa-check"></i> Message sent';
      setStatus(`Thanks ${data.name || ''}! Your message is on its way — I'll reply to ${data.email}.`.trim(), 'ok');
      showToast('Message sent successfully');
      contactForm.reset();

      setTimeout(() => {
        submitBtn.classList.remove('done');
        submitBtn.querySelector('.btn-label').innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send Message';
      }, 4000);

    } catch (err) {
      // Offline, blocked, or opened from file:// — hand the visitor
      // over to their own mail app instead of losing the message.
      submitBtn.classList.remove('sending');
      setStatus("Couldn't send from here — opening your email app instead.", 'err');
      mailtoFallback(data);
    }
  });
}

// ============ Theme toggle (dark / light) ============
// The initial theme is applied by a tiny inline script in <head> so the page
// never flashes the wrong colours. This part handles the button and remembers
// the choice in localStorage.
const themeToggle = document.getElementById('themeToggle');
const htmlEl = document.documentElement;

function applyTheme(theme, save){
  htmlEl.setAttribute('data-theme', theme);
  if (themeToggle) {
    const next = theme === 'dark' ? 'light' : 'dark';
    themeToggle.setAttribute('aria-label', `Switch to ${next} mode`);
    themeToggle.setAttribute('title', `Switch to ${next} mode`);
  }
  if (save) {
    try { localStorage.setItem('theme', theme); } catch (err) { /* storage blocked: ignore */ }
  }
  window.dispatchEvent(new Event('themechange'));
}

if (themeToggle) {
  applyTheme(htmlEl.getAttribute('data-theme') === 'light' ? 'light' : 'dark', false);
  themeToggle.addEventListener('click', () => {
    const next = htmlEl.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    htmlEl.classList.add('theme-anim');
    themeToggle.classList.remove('spin');
    void themeToggle.offsetWidth;
    themeToggle.classList.add('spin');
    applyTheme(next, true);
    setTimeout(() => htmlEl.classList.remove('theme-anim'), 500);
  });
}
