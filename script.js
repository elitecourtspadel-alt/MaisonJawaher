// Mobile nav toggle
const header = document.getElementById('siteHeader');
const navToggle = document.getElementById('navToggle');

if (navToggle && header) {
  navToggle.addEventListener('click', () => {
    const isOpen = header.classList.toggle('nav-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Close menu when a nav link is tapped
  header.querySelectorAll('.main-nav a').forEach((link) => {
    link.addEventListener('click', () => {
      header.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// Newsletter form — front-end only placeholder.
// Wire this up to your actual email provider (Mailchimp, Klaviyo, etc.) when ready.
const newsletterForm = document.getElementById('newsletterForm');
const formMsg = document.getElementById('formMsg');

if (newsletterForm) {
  newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('newsletterEmail').value.trim();
    if (!email) return;
    formMsg.textContent = `You're on the list, ${email}.`;
    newsletterForm.reset();
  });
}

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
