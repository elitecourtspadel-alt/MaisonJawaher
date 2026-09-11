// ============================================================================
// Admin page logic — add/edit/delete products, live-updating list
// ============================================================================

const categorySelect = document.getElementById('fieldCategory');
CATEGORIES.forEach((c) => {
  const opt = document.createElement('option');
  opt.value = c.value;
  opt.textContent = c.label;
  categorySelect.appendChild(opt);
});

const filterTabs = document.getElementById('filterTabs');
CATEGORIES.forEach((c) => {
  const btn = document.createElement('button');
  btn.className = 'filter-tab';
  btn.dataset.filter = c.value;
  btn.textContent = c.label;
  filterTabs.appendChild(btn);
});

const form = document.getElementById('productForm');
const formTitle = document.getElementById('formTitle');
const formStatus = document.getElementById('formStatus');
const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const productIdField = document.getElementById('productId');
const imageField = document.getElementById('fieldImage');
const imagePreview = document.getElementById('imagePreview');
const imagePreviewImg = document.getElementById('imagePreviewImg');
const productList = document.getElementById('productList');
const productCount = document.getElementById('productCount');
const emptyState = document.getElementById('emptyState');
const connectionWarning = document.getElementById('connectionWarning');

let allProducts = [];
let activeFilter = 'all';

imageField.addEventListener('input', () => {
  const url = imageField.value.trim();
  if (url) {
    imagePreviewImg.src = url;
    imagePreview.hidden = false;
  } else {
    imagePreview.hidden = true;
  }
});

function resetForm() {
  form.reset();
  productIdField.value = '';
  formTitle.textContent = 'Add a Product';
  submitBtn.textContent = 'Add Product';
  cancelEditBtn.hidden = true;
  imagePreview.hidden = true;
  formStatus.textContent = '';
  formStatus.className = 'form-status';
}

cancelEditBtn.addEventListener('click', resetForm);

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const product = {
    name: document.getElementById('fieldName').value.trim(),
    category: categorySelect.value,
    price: Number(document.getElementById('fieldPrice').value) || 0,
    currency: 'MAD',
    imageUrl: imageField.value.trim(),
    description: document.getElementById('fieldDescription').value.trim(),
    featured: document.getElementById('fieldFeatured').checked,
    inStock: document.getElementById('fieldInStock').checked,
  };

  const id = productIdField.value;
  submitBtn.disabled = true;

  try {
    if (id) {
      await updateProduct(id, product);
      formStatus.textContent = 'Product updated.';
    } else {
      await addProduct(product);
      formStatus.textContent = 'Product added.';
    }
    formStatus.className = 'form-status';
    resetForm();
  } catch (err) {
    formStatus.textContent = 'Something went wrong saving this — check firebase-config.js and your connection.';
    formStatus.className = 'form-status error';
    console.error(err);
  } finally {
    submitBtn.disabled = false;
  }
});

function startEdit(product) {
  productIdField.value = product.id;
  document.getElementById('fieldName').value = product.name || '';
  categorySelect.value = product.category || 'rings';
  document.getElementById('fieldPrice').value = product.price || '';
  imageField.value = product.imageUrl || '';
  document.getElementById('fieldDescription').value = product.description || '';
  document.getElementById('fieldFeatured').checked = !!product.featured;
  document.getElementById('fieldInStock').checked = product.inStock !== false;

  if (product.imageUrl) {
    imagePreviewImg.src = product.imageUrl;
    imagePreview.hidden = false;
  } else {
    imagePreview.hidden = true;
  }

  formTitle.textContent = `Editing "${product.name}"`;
  submitBtn.textContent = 'Save Changes';
  cancelEditBtn.hidden = false;
  formStatus.textContent = '';
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function removeProduct(product) {
  if (!confirm(`Remove "${product.name}"? This can't be undone.`)) return;
  try {
    await deleteProduct(product.id);
  } catch (err) {
    alert("Couldn't delete this product — check your connection and try again.");
    console.error(err);
  }
}

function renderList() {
  const filtered = activeFilter === 'all'
    ? allProducts
    : allProducts.filter((p) => p.category === activeFilter);

  productCount.textContent = String(allProducts.length);
  emptyState.hidden = filtered.length > 0;
  productList.innerHTML = '';

  filtered.forEach((product) => {
    const row = document.createElement('div');
    row.className = 'admin-product-row';

    const thumb = document.createElement('div');
    thumb.className = 'row-thumb';
    if (product.imageUrl) {
      const img = document.createElement('img');
      img.src = product.imageUrl;
      img.alt = product.name || '';
      thumb.appendChild(img);
    } else {
      thumb.innerHTML = placeholderArtSvg();
    }

    const info = document.createElement('div');
    info.className = 'row-info';
    const badges = [
      `<span class="row-badge">${categoryLabel(product.category)}</span>`,
      product.featured ? '<span class="row-badge on">New In</span>' : '',
      product.inStock === false ? '<span class="row-badge out">Out of stock</span>' : '',
    ].filter(Boolean).join('');
    info.innerHTML = `
      <p class="row-name">${escapeHtml(product.name || 'Untitled')}</p>
      <div class="row-meta">${badges}</div>
    `;

    const price = document.createElement('div');
    price.className = 'row-price';
    price.textContent = formatPrice(product.price, product.currency);

    const actions = document.createElement('div');
    actions.className = 'row-actions';
    const editBtn = document.createElement('button');
    editBtn.className = 'row-btn';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => startEdit(product));
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'row-btn danger';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => removeProduct(product));
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    row.appendChild(thumb);
    row.appendChild(info);
    row.appendChild(price);
    row.appendChild(actions);
    productList.appendChild(row);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

filterTabs.addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-tab');
  if (!btn) return;
  activeFilter = btn.dataset.filter;
  filterTabs.querySelectorAll('.filter-tab').forEach((t) => t.classList.remove('active'));
  btn.classList.add('active');
  renderList();
});

if (!isDbReady()) {
  connectionWarning.hidden = false;
}

subscribeToProducts((products) => {
  allProducts = products;
  renderList();
});
