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
const removeImageBtn = document.getElementById('removeImageBtn');
const fileInput = document.getElementById('fieldImageFile');
const uploadFilename = document.getElementById('uploadFilename');
const uploadProgress = document.getElementById('uploadProgress');
const uploadProgressFill = document.getElementById('uploadProgressFill');
const toggleUrlField = document.getElementById('toggleUrlField');
const productList = document.getElementById('productList');
const productCount = document.getElementById('productCount');
const emptyState = document.getElementById('emptyState');
const connectionWarning = document.getElementById('connectionWarning');

let allProducts = [];
let activeFilter = 'all';
let isUploading = false;

function isStorageReady() {
  return typeof storage !== 'undefined' && !!storage;
}

function updateImagePreview() {
  const url = imageField.value.trim();
  if (url) {
    imagePreviewImg.src = url;
    imagePreview.hidden = false;
  } else {
    imagePreview.hidden = true;
  }
}

imageField.addEventListener('input', updateImagePreview);

toggleUrlField.addEventListener('click', () => {
  const showing = !imageField.hidden;
  imageField.hidden = showing;
  toggleUrlField.textContent = showing ? 'or paste an image URL instead' : 'hide URL field';
  if (!showing) imageField.focus();
});

removeImageBtn.addEventListener('click', () => {
  imageField.value = '';
  fileInput.value = '';
  uploadFilename.textContent = 'No file chosen';
  updateImagePreview();
});

fileInput.addEventListener('change', async () => {
  const file = fileInput.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    formStatus.textContent = 'Please choose an image file.';
    formStatus.className = 'form-status error';
    fileInput.value = '';
    return;
  }
  const maxSizeMB = 5;
  if (file.size > maxSizeMB * 1024 * 1024) {
    formStatus.textContent = `That image is too large — please use one under ${maxSizeMB}MB.`;
    formStatus.className = 'form-status error';
    fileInput.value = '';
    return;
  }
  if (!isStorageReady()) {
    formStatus.textContent = 'Firebase Storage is not configured yet — see SETUP.md.';
    formStatus.className = 'form-status error';
    fileInput.value = '';
    return;
  }

  uploadFilename.textContent = file.name;
  uploadProgress.hidden = false;
  uploadProgressFill.style.width = '0%';
  formStatus.textContent = 'Uploading photo…';
  formStatus.className = 'form-status';
  isUploading = true;
  submitBtn.disabled = true;

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `maison_jawaher/products/${Date.now()}_${safeName}`;
  const uploadTask = storage.ref(path).put(file);

  uploadTask.on(
    'state_changed',
    (snapshot) => {
      const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
      uploadProgressFill.style.width = pct + '%';
    },
    (err) => {
      console.error(err);
      formStatus.textContent = "Upload failed — check your connection and try again.";
      formStatus.className = 'form-status error';
      uploadProgress.hidden = true;
      uploadFilename.textContent = 'No file chosen';
      fileInput.value = '';
      isUploading = false;
      submitBtn.disabled = false;
    },
    async () => {
      const url = await uploadTask.snapshot.ref.getDownloadURL();
      imageField.value = url;
      updateImagePreview();
      formStatus.textContent = 'Photo uploaded.';
      formStatus.className = 'form-status';
      uploadProgress.hidden = true;
      isUploading = false;
      submitBtn.disabled = false;
    }
  );
});

function resetForm() {
  form.reset();
  productIdField.value = '';
  formTitle.textContent = 'Add a Product';
  submitBtn.textContent = 'Add Product';
  cancelEditBtn.hidden = true;
  imagePreview.hidden = true;
  uploadFilename.textContent = 'No file chosen';
  uploadProgress.hidden = true;
  imageField.hidden = true;
  toggleUrlField.textContent = 'or paste an image URL instead';
  formStatus.textContent = '';
  formStatus.className = 'form-status';
}

cancelEditBtn.addEventListener('click', resetForm);

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (isUploading) {
    formStatus.textContent = 'Hang on — the photo is still uploading.';
    formStatus.className = 'form-status error';
    return;
  }

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
  fileInput.value = '';
  uploadFilename.textContent = 'No file chosen';
  uploadProgress.hidden = true;
  document.getElementById('fieldDescription').value = product.description || '';
  document.getElementById('fieldFeatured').checked = !!product.featured;
  document.getElementById('fieldInStock').checked = product.inStock !== false;

  updateImagePreview();

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

// ============================================================================
// Auth — sign in required before the product form/list is shown or fetched
// ============================================================================

const loginScreen = document.getElementById('loginScreen');
const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const loginStatus = document.getElementById('loginStatus');
const adminContent = document.getElementById('adminContent');
const logoutBtn = document.getElementById('logoutBtn');

let unsubscribeProducts = null;

function friendlyAuthError(err) {
  const code = err && err.code;
  if (code === 'auth/invalid-email') return 'That email address looks invalid.';
  if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
    return 'Incorrect email or password.';
  }
  if (code === 'auth/too-many-requests') return 'Too many attempts — wait a bit and try again.';
  return "Couldn't sign in — check your connection and try again.";
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!isDbReady() || typeof auth === 'undefined' || !auth) {
      loginStatus.textContent = 'Firebase is not configured yet — see SETUP.md.';
      loginStatus.className = 'form-status error';
      return;
    }
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    loginBtn.disabled = true;
    loginStatus.textContent = '';
    loginStatus.className = 'form-status';
    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (err) {
      loginStatus.textContent = friendlyAuthError(err);
      loginStatus.className = 'form-status error';
      console.error(err);
    } finally {
      loginBtn.disabled = false;
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    if (typeof auth !== 'undefined' && auth) auth.signOut();
  });
}

if (typeof auth === 'undefined' || !auth) {
  connectionWarning.hidden = false;
} else {
  auth.onAuthStateChanged((user) => {
    if (user) {
      loginScreen.hidden = true;
      adminContent.hidden = false;
      logoutBtn.hidden = false;
      if (!unsubscribeProducts) {
        unsubscribeProducts = subscribeToProducts((products) => {
          allProducts = products;
          renderList();
        });
      }
    } else {
      loginScreen.hidden = false;
      adminContent.hidden = true;
      logoutBtn.hidden = true;
      if (unsubscribeProducts) {
        unsubscribeProducts();
        unsubscribeProducts = null;
      }
    }
  });
}
