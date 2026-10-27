/* Browser-only interactions. No backend, tracking, payments or network requests. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const products = window.JSP_PRODUCTS || [];
  const findProduct = id => products.find(product => product.id === id);
  const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const arrow = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  let toastTimer;
  function toast(message) {
    const box = $('#toast');
    if (!box) return;
    box.textContent = message;
    box.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => box.classList.remove('visible'), 3800);
  }
  function read(key, fallback, kind = 'localStorage') {
    try { const raw = window[kind].getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch { return fallback; }
  }
  function write(key, value, kind = 'localStorage') {
    try { window[kind].setItem(key, JSON.stringify(value)); return true; }
    catch { toast('Browser storage is unavailable. Allow storage to save your changes.'); return false; }
  }
  function remove(key, kind = 'localStorage') {
    try { window[kind].removeItem(key); return true; }
    catch { toast('Browser storage is unavailable.'); return false; }
  }
  function getList() {
    const saved = read('jsp.enquiry.v1', []);
    return Array.isArray(saved) ? [...new Set(saved.filter(id => typeof id === 'string' && findProduct(id)))].slice(0, products.length) : [];
  }
  function getProfiles() {
    const saved = read('jsp.profiles.v1', []);
    return Array.isArray(saved) ? saved.filter(p => p && typeof p.email === 'string' && typeof p.name === 'string' && typeof p.hash === 'string' && typeof p.salt === 'string') : [];
  }
  function getSession() {
    const session = read('jsp.session.v1', null, 'sessionStorage') || read('jsp.session.v1', null);
    if (!session || typeof session.email !== 'string' || !(session.expires > Date.now())) return null;
    return getProfiles().find(p => p.email === session.email) || null;
  }
  function updateState() {
    const list = getList();
    $$('.list-count').forEach(el => { el.textContent = String(list.length); });
    $$('[data-add]').forEach(button => {
      const saved = list.includes(button.dataset.add);
      button.setAttribute('aria-pressed', String(saved));
      button.textContent = saved ? 'Added to list ✓' : (button.classList.contains('button') ? 'Add to enquiry list +' : 'Add to list +');
    });
    const session = getSession();
    $$('[data-account-label]').forEach(el => { el.textContent = session ? 'My account' : 'Login'; });
    const counter = $('#profile-list-count');
    if (counter) counter.textContent = String(list.length);
    refreshContactSelection();
  }
  function toggleProduct(id) {
    const product = findProduct(id);
    if (!product) return;
    const list = getList();
    const exists = list.includes(id);
    if (!write('jsp.enquiry.v1', exists ? list.filter(item => item !== id) : [...list, id])) return;
    updateState();
    if ($('#enquiry-dialog')?.open) renderList();
    toast(exists ? `${product.name} removed.` : `${product.name} added to your enquiry list.`);
  }
  function card(product) {
    return `<article class="product-card"><button class="product-image" data-detail="${product.id}" aria-label="View ${escapeHTML(product.name)}"><span class="product-tag">${escapeHTML(product.tag)}</span><img src="assets/images/${product.image}" alt="J.S.P ${escapeHTML(product.name)}, model ${product.id}" width="350" height="400" loading="lazy"></button><div class="product-info"><span class="product-model">${product.id} SERIES</span><h3 class="product-name"><button data-detail="${product.id}">${escapeHTML(product.name)}</button></h3><div class="product-card-bottom"><span>Price on enquiry</span><button class="add-button" data-add="${product.id}" aria-pressed="false">Add to list +</button></div></div></article>`;
  }
  function showDialog(dialog) {
    if (dialog && !dialog.open) dialog.showModal();
  }
  function openProduct(id) {
    const p = findProduct(id);
    if (!p) return;
    $('#product-details').innerHTML = `<div class="product-detail-grid"><div class="detail-image"><img src="assets/images/${p.image}" alt="J.S.P ${escapeHTML(p.name)}" width="350" height="400"></div><div class="detail-copy"><span class="eyebrow">J.S.P · ${p.id} SERIES</span><h2 id="product-title">${escapeHTML(p.name)}</h2><p>${escapeHTML(p.description)}</p><div class="detail-spec">${escapeHTML(p.spec)}</div><p>Ask J.S.P to confirm the current configuration, price and availability.</p><button class="button button-dark" data-add="${p.id}" aria-pressed="false">Add to enquiry list +</button><a class="source-link" href="https://www.jspgardentools.in/${p.source}" target="_blank" rel="noopener noreferrer">View official product catalogue ↗</a></div></div>`;
    updateState();
    showDialog($('#product-dialog'));
  }
  function renderList() {
    const list = getList();
    const target = $('#enquiry-items');
    if (!target) return;
    target.innerHTML = list.length ? list.map(id => {
      const p = findProduct(id);
      return `<div class="enquiry-item"><img src="assets/images/${p.image}" alt="${escapeHTML(p.name)}" width="65" height="75"><div><h3>${escapeHTML(p.name)}</h3><p>${p.id} series · Price on enquiry</p></div><button class="remove-item icon-button" data-remove="${p.id}" aria-label="Remove ${escapeHTML(p.name)}">×</button></div>`;
    }).join('') : `<div class="list-empty"><h3>A little room to grow.</h3><p>Your list is empty. Explore the collection and add a few tools.</p><a class="button button-dark" href="products.html">Browse products ${arrow}</a></div>`;
    $('#list-actions').hidden = !list.length;
  }
  function downloadText(filename, text) {
    const url = URL.createObjectURL(new Blob([text], {type: 'text/plain;charset=utf-8'}));
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function listText() {
    return getList().map((id, i) => { const p = findProduct(id); return `${i + 1}. ${p.name} — Model ${p.id}\n   ${p.spec}`; }).join('\n');
  }
  function refreshContactSelection() {
    const target = $('#contact-selection');
    if (!target) return;
    const list = getList();
    target.hidden = !list.length;
    target.textContent = '';
    if (list.length) {
      target.append(`${list.length} selected product${list.length === 1 ? '' : 's'} will be included. `);
      const button = document.createElement('button'); button.type = 'button'; button.className = 'enquiry-trigger'; button.textContent = 'Review list'; target.append(button);
    }
    // An edited selection invalidates a previously prepared draft.
    const preview = $('#enquiry-preview');
    if (preview) preview.hidden = true;
  }
  // Shared navigation, product controls and accessible native dialogs.
  const menuButton = $('.menu-toggle');
  menuButton?.addEventListener('click', () => {
    const expanded = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!expanded));
    menuButton.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
    $('#mobile-menu').hidden = expanded;
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
      menuButton.click(); menuButton.focus();
    }
  });
  document.addEventListener('click', event => {
    const detail = event.target.closest('[data-detail]');
    if (detail) openProduct(detail.dataset.detail);
    const add = event.target.closest('[data-add]');
    if (add) toggleProduct(add.dataset.add);
    const removeButton = event.target.closest('[data-remove]');
    if (removeButton) toggleProduct(removeButton.dataset.remove);
    if (event.target.closest('.enquiry-trigger')) { renderList(); showDialog($('#enquiry-dialog')); }
    const close = event.target.closest('[data-close-dialog]');
    if (close) close.closest('dialog').close();
  });
  $$('dialog').forEach(dialog => dialog.addEventListener('click', event => {
    const box = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close();
  }));
  $('#download-list')?.addEventListener('click', () => downloadText('JSP_Product_Enquiry_List.txt', `J.S.P LAWN MOWERS & GARDEN TOOLS\nPRODUCT ENQUIRY LIST\n\n${listText()}\n\nPlease contact J.S.P to confirm specifications, pricing and availability.\nTrade enquiries: +91 99150 66720\nEmail: jsp.ludhiana@gmail.com\n`));
  const featured = $('#featured-products');
  if (featured) featured.innerHTML = ['0054-B', '0072', '0073', '0097'].map(id => card(findProduct(id))).join('');
  // Catalogue search, category filtering and alphabetical sorting.
  const grid = $('#products-grid');
  if (grid) {
    const params = new URLSearchParams(location.search);
    const allowed = ['all','mowers','cutting','handtools','accessories'];
    let category = allowed.includes(params.get('category')) ? params.get('category') : 'all';
    const search = $('#product-search');
    const sort = $('#product-sort');
    search.value = (params.get('q') || '').slice(0, 150);
    if (['az', 'za'].includes(params.get('sort'))) sort.value = params.get('sort');
    function renderProducts() {
      const query = search.value.trim().toLowerCase();
      let visible = products.filter(p => (category === 'all' || p.category === category) && `${p.name} ${p.id} ${p.tag} ${p.spec}`.toLowerCase().includes(query));
      if (sort.value === 'az') visible.sort((a, b) => a.name.localeCompare(b.name));
      if (sort.value === 'za') visible.sort((a, b) => b.name.localeCompare(a.name));
      grid.innerHTML = visible.map(card).join('');
      $('#results-count').textContent = `Showing ${visible.length} of ${products.length} products`;
      $('#no-results').hidden = visible.length > 0;
      $$('[data-category]').forEach(button => {
        const active = button.dataset.category === category;
        button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active));
      });
      const url = new URL(location.href);
      category === 'all' ? url.searchParams.delete('category') : url.searchParams.set('category', category);
      query ? url.searchParams.set('q', query) : url.searchParams.delete('q');
      sort.value === 'featured' ? url.searchParams.delete('sort') : url.searchParams.set('sort', sort.value);
      try { history.replaceState(null, '', url); } catch { /* file:// preview can limit history changes. */ }
      updateState();
    }
    search.addEventListener('input', renderProducts);
    sort.addEventListener('change', renderProducts);
    $$('[data-category]').forEach(button => button.addEventListener('click', () => { category = button.dataset.category; renderProducts(); }));
    $('#reset-filters').addEventListener('click', () => { category = 'all'; search.value = ''; sort.value = 'featured'; renderProducts(); });
    renderProducts();
  }
  // Prepare, review and download an enquiry. Never sends a message itself.
  const contact = $('#contact-form');
  let enquiryDraft = '';
  if (contact) {
    const session = getSession();
    if (session) { $('#contact-name').value = session.name; $('#contact-email').value = session.email; }
    if (getList().length) $('#contact-interest').value = 'My selected products';
    contact.addEventListener('input', () => { $('#enquiry-preview').hidden = true; });
    contact.addEventListener('change', () => { $('#enquiry-preview').hidden = true; });
    contact.addEventListener('submit', event => {
      event.preventDefault();
      if (!contact.reportValidity()) return;
      const name = $('#contact-name').value.trim();
      const message = $('#contact-message').value.trim();
      if (name.length < 2 || message.length < 3) { toast('Please add your name and a short message.'); return; }
      const interest = $('#contact-interest').value;
      enquiryDraft = `Hello J.S.P team,\n\nI would like to enquire about ${interest.toLowerCase()}.\n\n${message}\n\n${getList().length ? `Selected products:\n${listText()}\n\n` : ''}Name: ${name}\nEmail: ${$('#contact-email').value.trim()}${$('#contact-phone').value.trim() ? `\nPhone: ${$('#contact-phone').value.trim()}` : ''}\n\nPlease confirm current specifications, pricing and availability.\nThank you.`;
      $('#enquiry-text').textContent = enquiryDraft;
      $('#email-draft').href = `mailto:jsp.ludhiana@gmail.com?subject=${encodeURIComponent('Product enquiry: ' + interest)}&body=${encodeURIComponent(enquiryDraft)}`;
      $('#enquiry-preview').hidden = false;
      $('#enquiry-preview').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center'});
    });
    $('#download-enquiry').addEventListener('click', () => { if (enquiryDraft) downloadText('JSP_Enquiry_Draft.txt', enquiryDraft); });
  }
  window.addEventListener('storage', () => { updateState(); if ($('#enquiry-dialog')?.open) renderList(); });
  window.JSP = {read, write, remove, toast, getList, getProfiles, getSession, updateState, showDialog};
  updateState();
})();
