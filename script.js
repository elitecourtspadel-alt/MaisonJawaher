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

// "New In This Season" — pulled live from Firebase (see products.js / firebase-config.js)
const newInGrid = document.getElementById('newInGrid');
const newInEmpty = document.getElementById('newInEmpty');

if (newInGrid && typeof subscribeToProducts === 'function') {
  subscribeToProducts((products) => {
    const featured = products.filter((p) => p.featured).slice(0, 6);
    newInGrid.innerHTML = '';

    if (featured.length === 0) {
      newInEmpty.hidden = false;
      return;
    }
    newInEmpty.hidden = true;

    featured.forEach((product) => {
      const card = document.createElement('article');
      card.className = 'product-card';

      const art = document.createElement('div');
      art.className = 'product-art';
      if (product.imageUrl) {
        const img = document.createElement('img');
        img.src = product.imageUrl;
        img.alt = product.name || '';
        img.loading = 'lazy';
        img.style.width = '100%';
        img.style.height = '140px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '4px';
        art.appendChild(img);
      } else {
        art.innerHTML = placeholderArtSvg();
      }

      const name = document.createElement('h3');
      name.className = 'product-name';
      name.textContent = product.name || 'Untitled';

      const price = document.createElement('p');
      price.className = 'product-price';
      price.textContent = formatPrice(product.price, product.currency);

      card.appendChild(art);
      card.appendChild(name);
      card.appendChild(price);
      newInGrid.appendChild(card);
    });
  });
}

