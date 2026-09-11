// ============================================================================
// Shop page logic — render all products, filter by category (via tabs or URL)
// ============================================================================

const shopTabs = document.getElementById('shopTabs');
const shopGrid = document.getElementById('shopGrid');
const shopEmpty = document.getElementById('shopEmpty');
const shopTitle = document.getElementById('shopTitle');

CATEGORIES.forEach((c) => {
  const btn = document.createElement('button');
  btn.className = 'filter-tab';
  btn.dataset.filter = c.value;
  btn.textContent = c.label;
  shopTabs.appendChild(btn);
});

const params = new URLSearchParams(window.location.search);
let activeFilter = params.get('category') || 'all';

function setActiveTab() {
  const tabs = shopTabs.querySelectorAll('.filter-tab');
  let matched = false;
  tabs.forEach((t) => {
    const isActive = t.dataset.filter === activeFilter;
    t.classList.toggle('active', isActive);
    if (isActive) matched = true;
  });
  if (!matched) {
    activeFilter = 'all';
    tabs.forEach((t) => t.classList.toggle('active', t.dataset.filter === 'all'));
  }
  shopTitle.textContent = activeFilter === 'all' ? 'All Pieces' : categoryLabel(activeFilter);
}
setActiveTab();

let allProducts = [];

function renderShop() {
  const filtered = activeFilter === 'all'
    ? allProducts
    : allProducts.filter((p) => p.category === activeFilter);

  shopEmpty.hidden = filtered.length > 0;
  shopGrid.innerHTML = '';

  filtered.forEach((product) => {
    const card = document.createElement('article');
    card.className = 'shop-product';

    const media = document.createElement('div');
    media.className = 'shop-product-media';
    if (product.imageUrl) {
      const img = document.createElement('img');
      img.src = product.imageUrl;
      img.alt = product.name || '';
      img.loading = 'lazy';
      media.appendChild(img);
    } else {
      media.innerHTML = placeholderArtSvg();
    }
    if (product.inStock === false) {
      const badge = document.createElement('span');
      badge.className = 'shop-product-badge out';
      badge.textContent = 'Sold out';
      media.appendChild(badge);
    } else if (product.featured) {
      const badge = document.createElement('span');
      badge.className = 'shop-product-badge';
      badge.textContent = 'New in';
      media.appendChild(badge);
    }

    const name = document.createElement('h3');
    name.className = 'shop-product-name';
    name.textContent = product.name || 'Untitled';

    const price = document.createElement('p');
    price.className = 'shop-product-price';
    price.textContent = formatPrice(product.price, product.currency);

    card.appendChild(media);
    card.appendChild(name);
    card.appendChild(price);
    shopGrid.appendChild(card);
  });
}

shopTabs.addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-tab');
  if (!btn) return;
  activeFilter = btn.dataset.filter;
  const url = new URL(window.location);
  if (activeFilter === 'all') url.searchParams.delete('category');
  else url.searchParams.set('category', activeFilter);
  window.history.replaceState({}, '', url);
  setActiveTab();
  renderShop();
});

subscribeToProducts((products) => {
  allProducts = products;
  renderShop();
});
