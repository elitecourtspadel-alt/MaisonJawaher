// ============================================================================
// PRODUCTS — shared data layer over Firebase Realtime Database
// Used by admin.html, shop.html, and index.html
// ============================================================================

const PRODUCTS_PATH = 'maison_jawaher/products';

const CATEGORIES = [
  { value: 'rings', label: 'Rings' },
  { value: 'necklaces', label: 'Necklaces' },
  { value: 'earrings', label: 'Earrings' },
  { value: 'bracelets', label: 'Bracelets' },
];

function categoryLabel(value) {
  const match = CATEGORIES.find((c) => c.value === value);
  return match ? match.label : value;
}

function formatPrice(price, currency) {
  const num = Number(price) || 0;
  return `${num.toLocaleString()} ${currency || 'MAD'}`;
}

function isDbReady() {
  return typeof db !== 'undefined' && !!db;
}

/** Subscribe to live product updates. Returns an unsubscribe function. */
function subscribeToProducts(callback) {
  if (!isDbReady()) {
    console.error('Firebase is not configured yet — see SETUP.md.');
    callback([]);
    return () => {};
  }
  const ref = db.ref(PRODUCTS_PATH);
  const handler = (snapshot) => {
    const val = snapshot.val() || {};
    const products = Object.entries(val).map(([id, data]) => ({ id, ...data }));
    products.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    callback(products);
  };
  ref.on('value', handler, (err) => {
    console.error('Firebase read failed:', err);
    callback([]);
  });
  return () => ref.off('value', handler);
}

/** One-time fetch (promise-based), for pages that don't need live updates. */
function fetchProductsOnce() {
  if (!isDbReady()) return Promise.resolve([]);
  return db.ref(PRODUCTS_PATH).once('value').then((snapshot) => {
    const val = snapshot.val() || {};
    const products = Object.entries(val).map(([id, data]) => ({ id, ...data }));
    products.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return products;
  });
}

function addProduct(product) {
  if (!isDbReady()) return Promise.reject(new Error('Firebase is not configured yet — see SETUP.md.'));
  const ref = db.ref(PRODUCTS_PATH).push();
  return ref.set({ ...product, createdAt: firebase.database.ServerValue.TIMESTAMP });
}

function updateProduct(id, product) {
  if (!isDbReady()) return Promise.reject(new Error('Firebase is not configured yet — see SETUP.md.'));
  return db.ref(`${PRODUCTS_PATH}/${id}`).update(product);
}

function deleteProduct(id) {
  if (!isDbReady()) return Promise.reject(new Error('Firebase is not configured yet — see SETUP.md.'));
  return db.ref(`${PRODUCTS_PATH}/${id}`).remove();
}

/** Small inline SVG shown when a product has no image yet. */
function placeholderArtSvg() {
  return `<svg viewBox="0 0 100 100" width="48" height="48" aria-hidden="true">
    <circle cx="50" cy="55" r="20" fill="none" stroke="currentColor" stroke-width="1.3"/>
    <circle cx="50" cy="30" r="4" fill="none" stroke="currentColor" stroke-width="1.3"/>
  </svg>`;
}
