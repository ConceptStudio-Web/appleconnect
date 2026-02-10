// Apple Connect App
(function () {
  const YEAR = document.getElementById('year');
  if (YEAR) YEAR.textContent = new Date().getFullYear();

  // Dynamically set header offset so content isn't hidden under fixed header
  function updateHeaderOffset() {
    try {
      const header = document.querySelector('.site-header');
      if (!header) return;
      const h = header.offsetHeight || 64;
      document.documentElement.style.setProperty('--header-offset', `${h}px`);
    } catch (_) { }
  }

  // Paynow Configuration
  const PAYNOW_CONFIG = {
    apiUrl: 'https://script.google.com/macros/s/AKfycbwmo1fLm_PDgjZjKumbmL7-FsYLBWtEsKixaLYcri971unFzx24tOB3365dAKBJQUSL/exec',
    apiToken: 'AppleConnect2024',  // Must match the token in your backend script
    enabled: true  // Set to false to disable Paynow integration
  };

  function openWhatsAppShop(name) {
    if (!name) return;
    const number = '263777306848';
    const header = 'Hy, i would like to purchace the following items :';
    const text = encodeURIComponent([header, '', `(${name})`].join('\n'));
    const url = `https://wa.me/${number}?text=${text}`;
    window.open(url, '_blank');
  }

  function openWhatsAppCart() {
    const number = '263777306848';
    const items = Array.isArray(state.cart) ? state.cart : [];
    if (!items.length) return;
    const header = items.length > 1
      ? 'Hy, I would like to purchase these items :'
      : 'Hy, I would like to purchase this item :';
    const lines = [header, ''];
    items.forEach((ci, idx) => {
      const prod = (state.products || []).find(p => p.id === ci.id) || null;
      if (prod) ensureProductId(prod);
      const name = (prod?.model || ci.name || '').trim();
      const isShop = (ci?.category === 'game') || (prod && ['game', 'controller', 'console'].includes(String(prod.category || '').toLowerCase())) || String(ci?.id || '').startsWith('shop-');
      if (items.length > 1) lines.push(`Item ${idx + 1}`);
      const qty = Math.max(1, parseInt(ci?.qty, 10) || 1);
      if (isShop) {
        // Game shop products: only display (Product Name)
        lines.push(`(${name}) - Quantity (${qty})`);
      } else {
        const color = prod ? productColor(prod) : '';
        const price = typeof ci.price === 'number' ? currency('USD', ci.price) : (typeof prod?.price === 'number' ? currency(prod.currency, prod.price) : '');
        const pid = prod?.productId || '';
        lines.push(`${name} - ${color} - ${price} - ${pid} - Quantity (${qty})`);
      }
      if (items.length > 1) lines.push('');
    });
    const text = encodeURIComponent(lines.join('\n'));
    const url = `https://wa.me/${number}?text=${text}`;
    window.open(url, '_blank');
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateHeaderOffset, { once: true });
  } else { updateHeaderOffset(); }
  window.addEventListener('resize', () => { updateHeaderOffset(); }, { passive: true });

  // Toggle nav
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      updateHeaderOffset();
    });
  }

  // ---- Scroll Reveal ----
  let revealObserver = null;
  function setupRevealObserver() {
    if (revealObserver) return revealObserver;
    const opts = { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.12 };
    revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          obs.unobserve(entry.target);
        }
      });
    }, opts);
    return revealObserver;
  }
  function observeReveals(scope) {
    const obs = setupRevealObserver();
    (scope || document).querySelectorAll('.reveal').forEach(el => {
      if (!el.classList.contains('revealed')) obs.observe(el);
    });
  }
  function tagForReveal(scope) {
    const root = scope || document;
    const selectors = [
      '.hero-banner-inner',
      '.split-card',
      '.section',
      '.section .section-head',
      '.apple-card',
      '.card',
      '.site-footer .footer-inner'
    ];
    root.querySelectorAll(selectors.join(',')).forEach(el => el.classList.add('reveal'));
    observeReveals(root);
  }
  // Initial tagging on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => tagForReveal(document), { once: true });
  } else { tagForReveal(document); }

  // Filters
  const storageFilter = document.getElementById('storageFilter');
  const conditionFilter = document.getElementById('conditionFilter');
  const modelFilter = document.getElementById('modelFilter');
  const clearFilters = document.getElementById('clearFilters');
  const accessoriesTypeFilter = document.getElementById('accessoriesTypeFilter');
  const pageCategory = document.body?.dataset?.category || '';

  const state = { products: [], filtered: [], cart: [] };

  // Randomized color per product (stable per id)
  function productColor(p) {
    const colors = ['Black', 'White', 'Midnight', 'Starlight', 'Blue', 'Green', 'Red', 'Purple', 'Space Gray', 'Silver'];
    const id = (p?.id || String(Math.random())).toString();
    let hash = 0; for (let i = 0; i < id.length; i++) { hash = ((hash << 5) - hash) + id.charCodeAt(i); hash |= 0; }
    const idx = Math.abs(hash) % colors.length;
    return colors[idx];
  }

  // Stable randomized Product ID (AAA-000) derived from existing id
  function ensureProductId(p) {
    if (!p) return p;
    if (p.productId && /^[A-Z]{3}-\d{3}$/.test(p.productId)) return p;
    const base = String(p.id || p.model || Math.random());
    // Simple hash
    let h = 0; for (let i = 0; i < base.length; i++) { h = ((h << 5) - h) + base.charCodeAt(i); h |= 0; }
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const a = letters[Math.abs(h) % 26];
    const b = letters[Math.abs((h >> 3)) % 26];
    const c = letters[Math.abs((h >> 6)) % 26];
    const num = String(Math.abs(h)).padStart(3, '0').slice(0, 3);
    p.productId = `${a}${b}${c}-${num}`;
    return p;
  }

  // Persist cart across pages
  function saveCart() {
    try { localStorage.setItem('ac_cart', JSON.stringify(state.cart)); } catch (_) { }
  }
  function loadCart() {
    try {
      const raw = localStorage.getItem('ac_cart');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) state.cart = parsed;
      }
    } catch (_) { }
  }
  loadCart();
  // Immediately reflect persisted cart in the badge on every page load
  try { updateCartBadge(); } catch (_) { }
  // Also update once DOM is guaranteed ready, to handle any timing inconsistencies
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      try { ensureCartUI(); updateCartBadge(); } catch (_) { }
    }, { once: true });
  } else {
    try { ensureCartUI(); updateCartBadge(); } catch (_) { }
  }

  // Final safety: after all resources load
  window.addEventListener('load', () => {
    try { ensureCartUI(); updateCartBadge(); } catch (_) { }
  }, { once: true });

  // Built-in fallback data for offline/file:// usage
  const fallbackProducts = [
    {
      id: 'ip17p-boxed-hs-1',
      category: 'iphone',
      model: 'iPhone 17 Pro',
      condition: 'New',
      truetone: true,
      faceId: true,
      batteryHealth: '100%',
      storage: '256GB',
      price: 1599,
      currency: 'USD',
      tags: ['new_stock'],
      badge: 'Pro',
      image: 'assets/iphone_17pro__0s6piftg70ym_large_2x.jpg',
      warranty: '1 year',
      branch: 'Haddon & Sly'
    },
    {
      id: 'ip15p-1tb-boxed-1',
      category: 'iphone',
      model: 'iPhone 15 Pro',
      condition: 'Brand New',
      truetone: true,
      faceId: true,
      batteryHealth: '100%',
      storage: '1TB',
      price: 1899,
      currency: 'USD',
      tags: ['new_stock'],
      badge: 'Pro',
      image: 'assets/iphone-card-40-17pro-202509.jpg'
    },
    {
      id: 'ip17-byo-97-1',
      category: 'iphone',
      model: 'iPhone 17',
      condition: 'Used',
      truetone: false,
      faceId: true,
      batteryHealth: '97%',
      storage: '512GB',
      price: 800,
      currency: 'USD',
      tags: ['new_stock'],
      badge: '',
      image: 'assets/iphone_17__ck7zzemcw37m_large_2x.jpg',
      warranty: '6 Months',
      branch: 'Bulawayo Center'
    },
    {
      id: 'ip16e-used-fair-1',
      category: 'iphone',
      model: 'iPhone 16e',
      condition: 'Used (Fair)',
      truetone: true,
      faceId: false,
      batteryHealth: '98%',
      storage: '256GB',
      price: 600,
      currency: 'USD',
      tags: ['new_stock'],
      badge: '',
      image: 'assets/iphone_16e__dar81seif0cy_large_2x.jpg',
      warranty: '1 year',
      branch: 'Haddon & Sly'
    }
  ];

  function currency(zwdOrUsd, value) {
    // Display with USD by default; adapt if you need ZWL.
    try {
      return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: zwdOrUsd || 'USD', maximumFractionDigits: 0 }).format(value);
    } catch {
      return `$${value}`;
    }
  }

  async function loadProducts() {
    // Prefer external data file; try products.json then products-full.json; fall back gracefully
    async function tryLoad(url) {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }

    // Prioritize window.PRODUCTS (from data/products.js) as it contains the complete dataset with promo flags
    if (Array.isArray(window.PRODUCTS) && window.PRODUCTS.length > 0) {
      state.products = window.PRODUCTS.map(ensureProductId);
    } else {
      try {
        let data = await tryLoad('data/products.json');
        if (!data.length || data.length < 6) {
          try {
            data = await tryLoad('data/products-full.json');
          } catch (e2) {
            // ignore; will fall back below
          }
        }
        if (!data || !data.length) throw new Error('Empty dataset');
        state.products = data.map(ensureProductId);
      } catch (err) {
        console.warn('Failed to load products JSON, using fallback dataset.', err);
        state.products = fallbackProducts.map(ensureProductId);
      }
    }
    // Apply query filter from URL if present
    const urlQ = new URLSearchParams(location.search).get('q')?.trim().toLowerCase() || '';
    // Page-level category filter (for iphones.html, ipads.html, etc.). For searches (?q), use full catalog
    const base = urlQ
      ? state.products
      : ((pageCategory && pageCategory !== 'home')
        ? state.products.filter(p => p.category === pageCategory)
        : state.products);
    // Ensure every product has a badge
    const badgePool = ['New', 'In Stock', 'Deal', 'Clearance', 'Hot', 'Pro'];
    base.forEach(p => { ensureProductId(p); if (!p.badge) p.badge = badgePool[Math.floor(Math.random() * badgePool.length)]; });
    if (urlQ) {
      state.filtered = base.filter(p => {
        const name = (p.model || p.name || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        const brand = (p.brand || '').toLowerCase();
        const pid = String(p.productId || '').toLowerCase();
        return name.includes(urlQ) || cat.includes(urlQ) || brand.includes(urlQ) || (pid && pid.includes(urlQ));
      });
      initFilters();
      renderAll();
    } else {
      // Use the unified filtering logic for standard page loads
      // Use the unified filtering logic for standard page loads
      // Small delay to ensure DOM is ready for IntersectionObserver
      // Small delay to ensure DOM is ready for IntersectionObserver
      setTimeout(() => {
        requestAnimationFrame(() => {
          initFilters();
          applyFilters();
          // Force re-check of reveal elements
          tagForReveal(document);
        });
      }, 100);
    }
  }

  function initFilters() {
    // Determine the base set of products for the current category
    const base = (pageCategory && pageCategory !== 'home')
      ? state.products.filter(p => p.category === pageCategory)
      : state.products;

    if (storageFilter) {
      const storages = [...new Set(base.map(p => p.storage).filter(Boolean))].sort((a, b) => parseInt(a) - parseInt(b));
      const current = storageFilter.value;
      storageFilter.innerHTML = '<option value="">Any</option>' + storages.map(s => `<option ${s === current ? 'selected' : ''}>${s}</option>`).join('');
    }

    if (modelFilter) {
      const models = [...new Set(base.map(p => p.model).filter(Boolean))].sort();
      const current = modelFilter.value;
      modelFilter.innerHTML = '<option value="">All</option>' + models.map(m => `<option ${m === current ? 'selected' : ''}>${m}</option>`).join('');
    }

    // Condition filter is often semi-static but let's ensure it matches reality if needed
    // For now we keep the semantic buckets but we could also dynamic generate if the user wants.
  }

  function applyFilters() {
    const storage = storageFilter?.value || '';
    const condition = conditionFilter?.value || '';
    const model = modelFilter?.value || '';
    const accessoriesType = accessoriesTypeFilter?.value || '';

    const base = (pageCategory && pageCategory !== 'home')
      ? state.products.filter(p => p.category === pageCategory)
      : state.products;

    function matchesCondition(pCond, selected) {
      if (!selected) return true;
      const c = (pCond || '').toLowerCase();
      switch (selected) {
        case 'boxed': return c.includes('boxed');
        case 'brand_new': return c.includes('brand new') || c.includes('new');
        case 'used_new': return c.includes('like new') || c.includes('excellent') || c.includes('used (new)');
        case 'used_good': return c.includes('good');
        case 'used_fair': return c.includes('fair');
        default: return c === selected.toLowerCase();
      }
    }

    function matchesAccessoryType(p, selected) {
      if (!selected) return true;
      if (p.category !== 'accessory') return false;
      const t = (p.type || '').toLowerCase();
      const s = selected.toLowerCase();
      // Map filter values to data types
      if (s === 'airpods') return t.includes('airpods') || t.includes('audio') || t.includes('headphone');
      if (s === 'pencil') return t.includes('pencil') || t.includes('keyboard');
      if (s === 'covers') return t.includes('case') || t.includes('protection') || t.includes('cover');
      if (s === 'chargers') return t.includes('power') || t.includes('cable') || t.includes('adapter') || t.includes('charger');
      if (s === 'watch') return t.includes('watch') || t.includes('band');
      return t.includes(s);
    }

    state.filtered = base.filter(p => {
      const storageOk = !storage || p.storage === storage;
      const conditionOk = matchesCondition(p.condition, condition);
      const modelOk = !model || p.model === model;
      const accessoriesTypeOk = matchesAccessoryType(p, accessoriesType);
      return storageOk && conditionOk && modelOk && accessoriesTypeOk;
    });

    updateResultsCount(state.filtered.length);
    renderAll();
  }

  function updateResultsCount(count) {
    let el = document.getElementById('filterResultsCount');
    if (!el && (storageFilter || conditionFilter || modelFilter)) {
      const parent = (storageFilter || conditionFilter || modelFilter).closest('.filters');
      if (parent) {
        el = document.createElement('div');
        el.id = 'filterResultsCount';
        el.className = 'results-count';
        parent.appendChild(el);
      }
    }
    if (el) {
      el.textContent = `${count} ${count === 1 ? 'product' : 'products'} found`;
      el.style.opacity = '1';
    }
  }

  storageFilter?.addEventListener('change', applyFilters);
  conditionFilter?.addEventListener('change', applyFilters);
  modelFilter?.addEventListener('change', applyFilters);
  accessoriesTypeFilter?.addEventListener('change', applyFilters);
  clearFilters?.addEventListener('click', () => {
    if (storageFilter) storageFilter.value = '';
    if (conditionFilter) conditionFilter.value = '';
    if (modelFilter) modelFilter.value = '';
    if (accessoriesTypeFilter) accessoriesTypeFilter.value = '';
    applyFilters();
  });

  function makeCard(p, options = { showCart: true }) {
    const img = p.image || '';
    const hasPrice = typeof p.price === 'number' && isFinite(p.price);
    const priceText = hasPrice ? `${currency(p.currency, p.price)}` : '';
    const isPromo = p.promo === true;

    // Subtext parts
    const subParts = [];
    if (p.storage) subParts.push(p.storage);
    if (p.productId) subParts.push(p.productId);
    const sub = subParts.join(' • ');

    const battery = p.batteryHealth || '';
    const color = p.color || productColor(p);
    const branch = p.branch || '';

    const detailsHTML = `
      <div class="details" role="group" aria-label="Product details">
        ${battery ? `<div class="detail-row"><span class="detail-label">Battery Health</span><span class="detail-value">${battery}</span></div>` : ''}
        ${color ? `<div class="detail-row"><span class="detail-label">Color</span><span class="detail-value">${color}</span></div>` : ''}
        ${branch ? `<div class="detail-row"><span class="detail-label">Branch</span><span class="detail-value">${branch}</span></div>` : ''}
      </div>
    `;

    return `
      <article class="apple-card" role="listitem" data-id="${p.id}" data-category="${p.category}" data-price="${hasPrice ? p.price : ''}" data-name="${p.model}">
        <div class="apple-card-media">
          ${img ? `<img alt="${p.model}" src="${img}"/>` : ''}
          ${hasPrice ? `<div class="card-badge price-badge">${priceText}</div>` : ''}
          ${isPromo ? `<div class="card-badge promo-badge-label">On Promo</div>` : ''}
          ${p.condition ? `<div class="card-badge condition-badge-label">${p.condition}</div>` : ''}
        </div>
        <div class="apple-card-body">
          <h3>${p.model}</h3>
          <div class="sub">${sub}</div>
          ${detailsHTML}
          ${hasPrice ? `<div class="price-line-hidden" style="display:none">${priceText}</div>` : ''}
          <div class="apple-card-actions">
            <button class="buy-btn" aria-label="Buy ${p.model}" style="${!options.showCart ? 'width:100%' : ''}">Buy now</button>
            ${options.showCart ? `
            <button class="cart-btn" aria-label="Add ${p.model} to cart">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M6 6h15l-1.5 9h-12z" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/>
                <circle cx="9" cy="20" r="1.5" fill="currentColor"/>
                <circle cx="18" cy="20" r="1.5" fill="currentColor"/>
                <path d="M6 6L5 3H2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
            ` : ''}
          </div>
        </div>
      </article>
    `;
  }

  function renderSection(listId, filterFn) {
    const el = document.getElementById(listId);
    if (!el) return;
    el.innerHTML = '';
    const items = state.filtered.filter(filterFn);
    if (!items.length) {
      el.innerHTML = `<div class="muted">No items found.</div>`;
      // Ensure reveal runs on placeholder too
      tagForReveal(el);
      return;
    }
    el.innerHTML = items.map(p => makeCard(p)).join('');
    // Tag newly rendered items for reveal
    tagForReveal(el);
  }

  function renderAll() {
    renderSection('hot-deals-list', p => p.tags?.includes('hot_deal'));
    renderSection('quick-sales-list', p => p.tags?.includes('quick_sale'));
    renderSection('new-stock-list', p => p.tags?.includes('new_stock'));
    renderSection('accessories-list', p => p.category === 'accessory');
    renderSection('macbooks-list', p => p.category === 'macbook');

    const all = document.getElementById('all-products-list');
    if (all) all.innerHTML = state.filtered.map(p => makeCard(p)).join('');
    // Ensure button handlers remain active for dynamically rendered content
    setupDelegatedActions();
    // Tag newly rendered lists for reveal
    if (all) tagForReveal(all);
    // Show search notice if ?q is present
    try {
      const usp = new URLSearchParams(location.search);
      const qRaw = usp.get('q');
      const prev = document.getElementById('searchNotice');
      if (qRaw && all) {
        const text = `Showing search results for "${qRaw}"`;
        if (prev) {
          prev.textContent = text;
        } else {
          const notice = document.createElement('div');
          notice.id = 'searchNotice';
          notice.style.margin = '6px 0 10px';
          notice.style.color = '#6b7280';
          notice.style.fontSize = '13px';
          notice.textContent = text;
          all.insertAdjacentElement('beforebegin', notice);
        }
      } else if (prev) {
        prev.remove();
      }
    } catch (_) { }
    // If URL has an id query, focus that card
    try {
      const idParam = new URLSearchParams(location.search).get('id');
      if (idParam) {
        const card = document.querySelector(`.apple-card[data-id="${CSS.escape(idParam)}"]`);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          card.classList.add('card-highlight');
          setTimeout(() => card.classList.remove('card-highlight'), 2000);
        }
      }
    } catch (_) { }
  }

  // Simple horizontal scroller controls
  function setupScrollers() {
    document.querySelectorAll('.scroller-controls').forEach(ctrl => {
      const targetId = ctrl.getAttribute('data-for');
      const list = document.getElementById(targetId);
      if (!list) return;
      const prev = ctrl.querySelector('.prev');
      const next = ctrl.querySelector('.next');
      const step = () => Math.max(list.clientWidth * 0.9, 240);
      prev?.addEventListener('click', () => list.scrollBy({ left: -step(), behavior: 'smooth' }));
      next?.addEventListener('click', () => list.scrollBy({ left: step(), behavior: 'smooth' }));
    });
  }

  // Lazy load images if any
  if ('loading' in HTMLImageElement.prototype) {
    document.querySelectorAll('img').forEach(img => img.setAttribute('loading', 'lazy'));
  }

  // Kickoff
  setupScrollers();
  loadProducts();
  (function () {
    try {
      const v = document.getElementById('homeHeroVideo');
      if (!v) return;
      v.removeAttribute('loop');
      const start = () => { try { v.play().catch(() => { }); } catch (_) { } };
      if (v.readyState >= 2) { start(); }
      else { v.addEventListener('loadedmetadata', start, { once: true }); }
      v.addEventListener('ended', () => {
        try {
          v.pause();
          if (!isNaN(v.duration) && isFinite(v.duration)) {
            v.currentTime = Math.max(0, v.duration - 0.001);
          }
        } catch (_) { }
      });
    } catch (_) { }
  })();
  (function () {
    try {
      const vids = Array.from(document.querySelectorAll('video[data-pause-once]'));
      vids.forEach(v => {
        if (v.dataset.pauseOnceBound) return;
        v.dataset.pauseOnceBound = '1';
        v.removeAttribute('loop');
        const start = () => { try { v.play().catch(() => { }); } catch (_) { } };
        if (v.readyState >= 2) { start(); }
        else { v.addEventListener('loadedmetadata', start, { once: true }); }
        v.addEventListener('ended', () => {
          try {
            v.pause();
            if (!isNaN(v.duration) && isFinite(v.duration)) {
              v.currentTime = Math.max(0, v.duration - 0.001);
            }
          } catch (_) { }
        });
      });
    } catch (_) { }
  })();

  // --- Search UI ---
  function injectSearchUI() {
    const header = document.querySelector('.site-header .header-inner');
    const nav = document.querySelector('.site-header nav');
    if (!header || !nav) return;
    // Remove old search icon button if present
    const oldSearchBtn = header.querySelector('.header-actions button[aria-label="Search"]');
    if (oldSearchBtn) oldSearchBtn.remove();
    // Create search container
    const wrap = document.createElement('div');
    wrap.className = 'header-search';
    wrap.innerHTML = `
      <svg class="search-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" fill="none"></circle><path d="M20 20L16.65 16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path></svg>
      <input id="globalSearch" type="search" placeholder="Search products..." aria-label="Search products" />
      <div id="searchResults" class="search-results" role="listbox"></div>
    `;
    nav.insertAdjacentElement('afterend', wrap);
    updateHeaderOffset();

    const input = wrap.querySelector('#globalSearch');
    const results = wrap.querySelector('#searchResults');

    function openResults(items) {
      if (!items.length) {
        results.innerHTML = `<div style="padding:10px; color:#6b7280">No Results Found</div>`;
        results.classList.add('open');
        return;
      }
      const lis = items.slice(0, 8).map(p => {
        const price = (typeof p.price === 'number') ? p.price : '';
        const img = p.image ? `<img class="thumb" src="${p.image}" alt="${p.model || p.name}"/>` : '';
        const name = p.model || p.name || '';
        return `<li data-id="${p.id}" data-category="${p.category}">${img}<span class="result-name">${name}</span>${price !== '' ? `<span class="result-price">${currency(p.currency, p.price)}</span>` : ''}</li>`;
      }).join('');
      results.innerHTML = `<ul>${lis}</ul>`;
      results.classList.add('open');
    }

    // Ensure product data is available from all sources
    async function ensureProductsLoaded() {
      // Always assemble a global catalog, independent of current page/category
      let allProducts = Array.isArray(state.products) ? state.products.slice() : [];

      // Load from JSON files
      try {
        const tryUrls = ['data/products-full.json', 'data/products.json'];
        for (const url of tryUrls) {
          const res = await fetch(url, { cache: 'no-store' });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) { allProducts = allProducts.concat(data); }
            else if (Array.isArray(data?.products)) { allProducts = allProducts.concat(data.products); }
          }
        }
      } catch (e) { /* ignore */ }

      // Add global PRODUCTS (from products.js)
      if (Array.isArray(window?.PRODUCTS)) {
        allProducts = allProducts.concat(window.PRODUCTS);
      }

      // Add gaming products if on gaming page
      if (/(^|\/)gaming\.html(\?|#|$)/.test(location.pathname) || document.querySelector('[data-gaming-page]')) {
        const gameItems = [
          { id: 'game-fc26', model: 'FC 26', category: 'game', price: 45, currency: 'USD', image: 'assets/Games To Play/FC 26.jpg' },
          { id: 'game-nba2k26', model: 'NBA 2K26', category: 'game', price: 50, currency: 'USD', image: 'assets/Games To Play/NBA 2K26.jpg' },
          { id: 'game-cod', model: 'Call Of Duty', category: 'game', price: 55, currency: 'USD', image: 'assets/Games To Play/Call of Duty.jpg' },
          { id: 'game-forza', model: 'Forza Horizon', category: 'game', price: 48, currency: 'USD', image: 'assets/Games To Play/Forza.jpg' },
          { id: 'ctrl-white', model: 'DualSense Controller White', category: 'controller', price: 75, currency: 'USD' },
          { id: 'ctrl-black', model: 'DualSense Controller Midnight Black', category: 'controller', price: 75, currency: 'USD' },
          { id: 'ctrl-station', model: 'DualSense Charging Station', category: 'controller', price: 35, currency: 'USD' }
        ];
        allProducts = allProducts.concat(gameItems);
      }

      // Remove duplicates by id and ensure productId
      const seen = new Set();
      const global = allProducts.map(ensureProductId).filter(p => {
        if (!p?.id) return false;
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });
      // Keep a global catalog available for future searches
      state.products = global;
      return global;
    }

    // Debounced live search
    let t;
    input.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(async () => {
        const raw = input.value.trim();
        const q = raw.toLowerCase();
        if (!q) { results.classList.remove('open'); results.innerHTML = ''; return; }
        const base = await ensureProductsLoaded();
        const matches = (base || []).filter(p => {
          const name = (p.model || p.name || '').toLowerCase();
          const cat = (p.category || '').toLowerCase();
          const brand = (p.brand || '').toLowerCase();
          const pid = String(p.productId || '').toLowerCase();
          return name.includes(q) || cat.includes(q) || brand.includes(q) || (pid && pid.includes(q));
        });
        openResults(matches);
      }, 120);
    });
    results.addEventListener('click', async (e) => {
      const li = e.target.closest('li');
      if (!li) return;
      const id = li.dataset.id;
      const cat = li.dataset.category;
      const route = cat === 'iphone' ? 'iphones.html' : cat === 'ipad' ? 'ipads.html' : cat === 'macbook' ? 'macbooks.html' : cat === 'accessory' ? 'accessories.html' : 'index.html';
      const qs = new URLSearchParams({ id }).toString();
      window.location.href = `${route}?${qs}`;
    });
    // Enter-to-search: pick the best category page based on global matches
    input.addEventListener('keydown', async (ev) => {
      if (ev.key !== 'Enter') return;
      const raw = input.value.trim();
      if (!raw) return;
      const q = raw.toLowerCase();
      const base = await ensureProductsLoaded();
      const matches = (base || []).filter(p => {
        const name = (p.model || p.name || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        const brand = (p.brand || '').toLowerCase();
        const pid = String(p.productId || '').toLowerCase();
        return name.includes(q) || cat.includes(q) || brand.includes(q) || (pid && pid.includes(q));
      });
      const counts = matches.reduce((acc, p) => { const c = (p.category || '').toLowerCase(); acc[c] = (acc[c] || 0) + 1; return acc; }, {});
      function routeFor(cat) {
        switch (cat) {
          case 'iphone': return 'iphones.html';
          case 'ipad': return 'ipads.html';
          case 'macbook': return 'macbooks.html';
          case 'accessory': return 'accessories.html';
          case 'game': return 'gaming.html';
          case 'controller': return 'gaming.html';
          default: return 'index.html';
        }
      }
      const best = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || '';
      const route = routeFor(best);
      const qs = encodeURIComponent(raw);
      window.location.href = `${route}?q=${qs}`;
    });
    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target)) { results.classList.remove('open'); }
    });
  }
  injectSearchUI();
  updateHeaderOffset();
  // Ensure cart UI is initialized even before any add-to-cart
  (function initCartUI() { try { ensureCartUI(); updateCartBadge(); } catch (_) { } })();

  // Make header logo navigate to home
  (function setupBrandLink() {
    const logo = document.querySelector('.brand .logo');
    if (logo) {
      logo.style.cursor = 'pointer';
      logo.addEventListener('click', () => { window.location.href = 'index.html'; });
    }
  })();

  // --- Cart ---
  let cartBadgeEl = null;
  let cartPanelEl = null;
  function ensureCartUI() {
    const cartBtn = document.querySelector('.header-actions button[aria-label="Cart"]');
    if (!cartBtn) return;
    cartBtn.classList.add('cart-icon');
    if (!cartBadgeEl) {
      cartBadgeEl = document.createElement('span');
      cartBadgeEl.className = 'cart-badge';
      cartBadgeEl.textContent = '0';
      cartBtn.appendChild(cartBadgeEl);
    }
    if (!cartPanelEl) {
      cartPanelEl = document.createElement('div');
      cartPanelEl.className = 'cart-panel';
      cartPanelEl.innerHTML = `
        <div class="cart-header">Your Cart <button class="icon-btn" id="closeCart" aria-label="Close cart">✕</button></div>
        <div class="cart-items" id="cartItems"></div>
        <div class="cart-footer">
          <div class="cart-total" id="cartTotal">$0</div>
          <button class="btn btn-primary btn-small" id="checkoutBtn">Checkout</button>
        </div>
      `;
      document.body.appendChild(cartPanelEl);
      document.getElementById('closeCart').addEventListener('click', () => cartPanelEl.classList.remove('open'));
      cartBtn.addEventListener('click', () => {
        renderCart();
        cartPanelEl.classList.toggle('open');
      });
      const checkout = document.getElementById('checkoutBtn');
      if (checkout) {
        checkout.addEventListener('click', () => {
          if (!state.cart.length) return;
          openCheckoutModal();
        });
      }

      function openCheckoutModal() {
        const total = state.cart.reduce((sum, i) => sum + (i.price || 0) * i.qty, 0);

        // Identify the likely pickup branch from cart contents
        const uniqueBranches = [...new Set(state.cart.map(i => i.branch).filter(Boolean))];
        const cartBranch = uniqueBranches.length > 0 ? uniqueBranches[0] : 'Bulawayo Center';

        const overlay = document.createElement('div');
        overlay.className = 'fixed-layer active';
        overlay.id = 'checkout-modal-root';
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.zIndex = '100000';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.85)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.backdropFilter = 'blur(12px)';
        overlay.style.webkitBackdropFilter = 'blur(12px)';

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-reveal-container';
        modalContent.style.maxWidth = '500px';
        modalContent.style.width = '90%';
        modalContent.innerHTML = `
      <div class="checkout-modal" style="background:white; border-radius:32px; position:relative; overflow:hidden;">
        <button id="closeCheckout" 
                style="position:absolute; top:20px; right:20px; background:none; border:none; color:#64748b; font-size:24px; cursor:pointer;"
                aria-label="Close">&times;</button>
        
        <!-- Step 1: Details -->
        <div id="checkoutStep1" class="checkout-step active">
          <h2 style="font-size:24px; font-weight:800; letter-spacing:-0.02em;">Shipping Details</h2>
          <p style="color:var(--text-muted); font-size:14px; margin-bottom:10px;">Please provide your contact information and preferred branch.</p>
          
          <div class="checkout-form-group">
            <label>Full Name</label>
            <input type="text" id="checkoutName" placeholder="e.g. John Doe" required>
          </div>
          <div class="checkout-form-group">
            <label>WhatsApp Number</label>
            <input type="tel" id="checkoutPhone" placeholder="e.g. +263..." required>
          </div>
          <div class="checkout-form-group">
            <label>Pickup Branch</label>
            <select id="checkoutBranch">
              <optgroup label="Auto-selected based on cart">
                <option value="Bulawayo Center" ${cartBranch === 'Bulawayo Center' ? 'selected' : ''}>Bulawayo Center</option>
                <option value="Haddon & Sly" ${cartBranch === 'Haddon & Sly' ? 'selected' : ''}>Haddon & Sly</option>
              </optgroup>
            </select>
          </div>
          
          <div class="checkout-actions">
            <span></span>
            <button class="btn btn-primary" id="toStep2">Next: Payment</button>
          </div>
        </div>

        <!-- Step 2: Payment -->
        <div id="checkoutStep2" class="checkout-step">
          <h2 style="font-size:24px; font-weight:800; letter-spacing:-0.02em;">Payment Method</h2>
          
          <div class="checkout-order-summary">
            <div class="summary-row"><span>Subtotal</span><span>${currency('USD', total)}</span></div>
            <div class="summary-row"><span>Tax</span><span>$0.00</span></div>
            <div class="summary-row total"><span>Total</span><span>${currency('USD', total)}</span></div>
          </div>

          <div class="payment-methods">
            <div class="payment-card selected" data-method="cash">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect><line x1="12" y1="15" x2="12" y2="15"></line></svg>
              <div class="title">Cash at Branch</div>
            </div>
            <div class="payment-card" data-method="paynow">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              <div class="title">Paynow</div>
            </div>
          </div>

          <div id="paynowDetail" style="display:none;">
            <div class="paynow-placeholder">
              <b>Paynow Integration Placeholder</b><br>
              Direct payment processing will be linked here.
            </div>
          </div>

          <div class="checkout-actions">
            <button class="btn btn-secondary" id="backToStep1">Back</button>
            <button class="btn btn-primary" id="completeOrder">Complete Order</button>
          </div>
        </div>

        <!-- Step 3: Success -->
        <div id="checkoutStep3" class="checkout-step" style="text-align:center; padding: 40px 0;">
          <div style="width:80px; height:80px; background:#22c55e; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; margin: 0 auto 20px; font-size:40px;">&check;</div>
          <h2 style="font-size:28px; font-weight:800;">Order Confirmed!</h2>
          <p id="successMsg" style="color:var(--text-muted); font-size:16px; margin: 15px 0 25px;"></p>
          <button class="btn btn-primary" id="finishCheckout">Return to Site</button>
        </div>

      </div>
    `;

        overlay.appendChild(modalContent);
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        // Logic
        const close = () => { overlay.remove(); document.body.style.overflow = ''; };
        document.getElementById('closeCheckout').onclick = close;
        overlay.onclick = (e) => { if (e.target === overlay) close(); };

        let selectedMethod = 'cash';

        document.getElementById('toStep2').onclick = () => {
          const name = document.getElementById('checkoutName').value.trim();
          const phone = document.getElementById('checkoutPhone').value.trim();
          if (!name || !phone) { alert('Please fill in your name and phone number.'); return; }
          document.getElementById('checkoutStep1').classList.remove('active');
          document.getElementById('checkoutStep2').classList.add('active');
        };

        document.getElementById('backToStep1').onclick = () => {
          document.getElementById('checkoutStep2').classList.remove('active');
          document.getElementById('checkoutStep1').classList.add('active');
        };

        const pCards = overlay.querySelectorAll('.payment-card');
        pCards.forEach(card => {
          card.onclick = () => {
            pCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedMethod = card.dataset.method;
            document.getElementById('paynowDetail').style.display = selectedMethod === 'paynow' ? 'block' : 'none';
          };
        });

        document.getElementById('completeOrder').onclick = async () => {
          const name = document.getElementById('checkoutName').value;
          const phone = document.getElementById('checkoutPhone').value;
          const branch = document.getElementById('checkoutBranch').value;

          if (selectedMethod === 'paynow') {
            // Handle Paynow payment
            await processPaynowPayment({ name, phone, branch, total });
          } else {
            // Handle Cash payment (existing logic)
            const successMsg = `Thank you, ${name}. Your order has been placed. Please visit our ${branch} branch to complete your purchase.`;
            document.getElementById('successMsg').textContent = successMsg;
            document.getElementById('checkoutStep2').classList.remove('active');
            document.getElementById('checkoutStep3').classList.add('active');

            // WhatsApp Integration on Completion
            const header = 'New Order (Cash Pickup)';
            const items = state.cart.map(i => `- ${i.name} (${i.qty}) @ ${currency('USD', i.price)}`).join('\n');
            const footer = `Customer: ${name}\nPhone: ${phone}\nBranch: ${branch}\nTotal: ${currency('USD', total)}`;
            const text = encodeURIComponent([header, '', items, '', footer].join('\n'));
            const url = `https://wa.me/263777306848?text=${text}`;

            setTimeout(() => { window.open(url, '_blank'); }, 2000);

            // Clear cart
            state.cart = [];
            saveCart();
            updateCartBadge();
            renderCart();
          }
        };

        document.getElementById('finishCheckout').onclick = close;
      }

      // Paynow Payment Processing
      async function processPaynowPayment({ name, phone, branch, total }) {
        try {
          // Show loading state
          showPaynowLoading();

          // Generate unique reference
          const reference = `AC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

          // Prepare cart data
          const cartItems = state.cart.map(item => ({
            name: item.name,
            price: item.price || 0,
            qty: item.qty || 1
          }));

          // Call backend to initiate payment
          const response = await fetch(PAYNOW_CONFIG.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'initiate',
              token: PAYNOW_CONFIG.apiToken,
              reference: reference,
              email: phone + '@appleconnect.co.zw',  // Construct email from phone
              cart: cartItems,
              total: total,
              customerName: name,
              customerPhone: phone,
              branch: branch
            })
          });

          const result = await response.json();

          if (!result.success) {
            throw new Error(result.error || 'Payment initialization failed');
          }

          // Open Paynow payment page
          const paymentWindow = window.open(result.redirectUrl, '_blank', 'width=800,height=600');

          // Poll for payment status
          const pollUrl = result.pollUrl;
          let attempts = 0;
          const maxAttempts = 60;  // Poll for up to 5 minutes (60 * 5s)

          const checkPayment = async () => {
            try {
              attempts++;

              const statusResponse = await fetch(PAYNOW_CONFIG.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'status',
                  token: PAYNOW_CONFIG.apiToken,
                  pollUrl: pollUrl
                })
              });

              const statusResult = await statusResponse.json();

              if (statusResult.success && statusResult.status) {
                const status = statusResult.status.toLowerCase();

                if (status === 'paid' || status === 'delivered' || status === 'awaiting delivery') {
                  // Payment successful
                  showPaynowSuccess(reference, statusResult.paynowreference);

                  // Clear cart
                  state.cart = [];
                  saveCart();
                  updateCartBadge();
                  renderCart();

                  // Close payment window if still open
                  if (paymentWindow && !paymentWindow.closed) {
                    paymentWindow.close();
                  }

                } else if (status === 'cancelled' || status === 'failed') {
                  // Payment failed
                  throw new Error('Payment was cancelled or failed');
                } else if (attempts < maxAttempts) {
                  // Still pending, check again
                  setTimeout(checkPayment, 5000);  // Check every 5 seconds
                } else {
                  // Timeout
                  throw new Error('Payment verification timed out. Please contact support with reference: ' + reference);
                }
              } else if (attempts < maxAttempts) {
                setTimeout(checkPayment, 5000);
              } else {
                throw new Error('Unable to verify payment status');
              }

            } catch (error) {
              showPaynowError(error.message);
            }
          };

          // Start polling after 5 seconds
          setTimeout(checkPayment, 5000);

        } catch (error) {
          showPaynowError(error.message || 'Payment processing failed');
        }
      }

      function showPaynowLoading() {
        const paynowDetail = document.getElementById('paynowDetail');
        paynowDetail.style.display = 'block';
        paynowDetail.innerHTML = `
          <div style="text-align: center; padding: 20px;">
            <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #1e96c8; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <div style="margin-top: 15px; font-size: 16px; color: #333;">Processing payment...</div>
            <div style="margin-top: 8px; font-size: 14px; color: #666;">Opening Paynow payment page. Please complete your payment.</div>
            <style>
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            </style>
          </div>
        `;
      }

      function showPaynowSuccess(reference, paynowRef) {
        document.getElementById('successMsg').textContent =
          `Payment successful! Your order has been confirmed. Reference: ${reference}`;
        document.getElementById('paynowDetail').style.display = 'none';
        document.getElementById('checkoutStep2').classList.remove('active');
        document.getElementById('checkoutStep3').classList.add('active');
      }

      function showPaynowError(errorMsg) {
        const paynowDetail = document.getElementById('paynowDetail');
        paynowDetail.style.display = 'block';
        paynowDetail.innerHTML = `
          <div style="background: #fee; border: 1px solid #fcc; border-radius: 8px; padding: 15px; margin-top: 10px;">
            <div style="color: #c33; font-weight: 600; margin-bottom: 8px;">Payment Failed</div>
            <div style="color: #666; font-size: 14px;">${errorMsg}</div>
            <div style="margin-top: 12px;">
              <button class="btn btn-secondary btn-small" onclick="location.reload()">Try Again</button>
            </div>
          </div>
        `;
      }

      // Remove handlers
      cartPanelEl.addEventListener('click', (e) => {
        // Prevent outside-click handler from closing the panel
        e.stopPropagation();
        const rm = e.target.closest('.remove-item');
        const inc = e.target.closest('.qty-inc');
        const dec = e.target.closest('.qty-dec');
        if (rm) {
          const id = rm.getAttribute('data-id');
          removeFromCart(id);
          // keep panel open explicitly
          cartPanelEl.classList.add('open');
          return;
        }
        if (inc) {
          const id = inc.getAttribute('data-id');
          updateCartItemQty(id, +1);
          cartPanelEl.classList.add('open');
          return;
        }
        if (dec) {
          const id = dec.getAttribute('data-id');
          updateCartItemQty(id, -1);
          cartPanelEl.classList.add('open');
          return;
        }
      });
      // Also prevent closing when clicking anywhere inside the panel
      cartPanelEl.addEventListener('mousedown', (e) => e.stopPropagation());
      document.addEventListener('click', (e) => {
        if (cartPanelEl.classList.contains('open') && !cartPanelEl.contains(e.target) && !cartBtn.contains(e.target)) {
          cartPanelEl.classList.remove('open');
        }
      });
    }
  }

  function addToCart(product, qty = 1) {
    if (!product) return;
    const existing = state.cart.find(i => i.id === product.id);
    if (existing) {
      existing.qty += qty;
    } else {
      state.cart.push({
        id: product.id,
        name: product.model || product.name,
        price: product.price || 0,
        image: product.image || '',
        branch: product.branch || '',
        qty
      });
    }
    updateCartBadge();
    showToast(`${product.model || product.name} added to cart`);
    saveCart();
  }

  function removeFromCart(id) {
    if (!id) return;
    const idx = state.cart.findIndex(i => i.id === id);
    if (idx !== -1) {
      state.cart.splice(idx, 1);
      renderCart();
      updateCartBadge();
      try { cartPanelEl?.classList?.add('open'); } catch (_) { }
      saveCart();
    }
  }

  function updateCartBadge() {
    ensureCartUI();
    if (!cartBadgeEl) return;
    const count = state.cart.reduce((sum, i) => sum + i.qty, 0);
    cartBadgeEl.textContent = String(count);
    cartBadgeEl.classList.toggle('show', count > 0);
  }

  function renderCart() {
    ensureCartUI();
    const itemsEl = document.getElementById('cartItems');
    const totalEl = document.getElementById('cartTotal');
    if (!itemsEl || !totalEl) return;
    if (!state.cart.length) {
      itemsEl.innerHTML = '<div style="padding:12px; color:#6b7280">Your cart is empty.</div>';
      totalEl.textContent = currency('USD', 0);
      return;
    }
    const rows = state.cart.map(i => {
      return `<div class="cart-item">
        <img src="${i.image}" alt="${i.name}" />
        <div>
          <div class="name">${i.name}</div>
          <div class="sub">Quantity</div>
        </div>
        <div style="display:grid; gap:6px; align-items:center; justify-items:end;">
          <div>${currency('USD', (i.price || 0) * i.qty)}</div>
          <div class="qty-controls" role="group" aria-label="Adjust quantity">
            <button class="icon-btn qty-dec" data-id="${i.id}" aria-label="Decrease quantity">−</button>
            <span class="qty-val" aria-live="polite">${i.qty}</span>
            <button class="icon-btn qty-inc" data-id="${i.id}" aria-label="Increase quantity">+</button>
          </div>
          <button class="icon-btn remove-item" data-id="${i.id}" aria-label="Remove ${i.name}">✕</button>
        </div>
      </div>`;
    }).join('');
    itemsEl.innerHTML = rows;
    const total = state.cart.reduce((sum, i) => sum + (i.price || 0) * i.qty, 0);
    totalEl.textContent = currency('USD', total);
  }

  function updateCartItemQty(id, delta) {
    if (!id || !delta) return;
    const item = state.cart.find(x => x.id === id);
    if (!item) return;
    item.qty = Math.max(1, (item.qty || 1) + delta);
    renderCart();
    updateCartBadge();
    saveCart();
  }

  function setupDelegatedActions() {
    ensureCartUI();
    document.body.removeEventListener('click', delegatedHandler, true);
    document.body.addEventListener('click', delegatedHandler, true);
  }
  function delegatedHandler(e) {
    const preview = e.target.closest('.preview-btn');
    if (preview) {
      const article = preview.closest('.apple-card');
      const id = article?.dataset?.id;
      const product = (state.products || []).find(p => p.id === id) || (state.filtered || []).find(p => p.id === id);
      openPreview(product);
      return;
    }
    const buyBtn = e.target.closest('.buy-btn');
    if (buyBtn) {
      const article = buyBtn.closest('.apple-card');
      const id = article?.dataset?.id;
      let product = (state.products || []).find(p => p.id === id) || (state.filtered || []).find(p => p.id === id);
      // Shop card fallback: send name-only message per spec
      if (!product && article) {
        const name = article.querySelector('h3')?.textContent?.trim();
        if (name) { openWhatsAppShop(name); return; }
      }
      openWhatsApp(product);
      return;
    }
    const cartBtn = e.target.closest('.cart-btn');
    if (cartBtn) {
      const article = cartBtn.closest('.apple-card');
      const id = article?.dataset?.id;
      let product = (state.products || []).find(p => p.id === id) || (state.filtered || []).find(p => p.id === id);
      // Shop card fallback: build product from data attributes
      if (!product && article) {
        const name = article.querySelector('h3')?.textContent?.trim();
        const priceText = article.querySelector('.price-line')?.textContent || '';
        const priceMatch = priceText.replace(/[^0-9.]/g, '');
        const price = parseFloat(priceMatch || '0');
        const img = article.querySelector('.apple-card-media img')?.getAttribute('src') || '';
        product = { id: id || `shop-${Date.now()}`, name, model: name, price: isFinite(price) ? price : 0, currency: 'USD', image: img, category: 'game' };
      }
      addToCart(product, 1);
      return;
    }
  }

  function openWhatsApp(product) {
    if (!product) return;
    const number = '27640823961';
    ensureProductId(product);
    const name = product.model || product.name || '';
    const color = productColor(product) || '';
    const price = typeof product.price === 'number' ? currency(product.currency, product.price) : '';
    const pid = product.productId || '';
    const header = 'Hy, I would like to purchase this item :';
    const detail = `${name} - ${color} - ${price} - ${pid}`;
    const text = encodeURIComponent([header, '', detail].join('\n'));
    const url = `https://wa.me/${number}?text=${text}`;
    window.open(url, '_blank');
  }

  function toAbsoluteUrl(path) {
    try {
      const u = new URL(path, window.location.origin);
      return u.href;
    } catch { return path; }
  }

  // Preview modal
  let previewOverlay = null;
  function ensurePreviewModal() {
    if (previewOverlay) return previewOverlay;
    const ov = document.createElement('div');
    ov.className = 'modal-overlay';
    ov.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-label="Product preview">
        <button class="modal-close" aria-label="Close preview">✕</button>
        <div class="modal-body">
          <div class="modal-media"></div>
        </div>
      </div>`;
    document.body.appendChild(ov);
    ov.addEventListener('click', (e) => { if (e.target === ov) closePreview(); });
    ov.querySelector('.modal-close').addEventListener('click', closePreview);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePreview(); });
    previewOverlay = ov;
    return ov;
  }
  function openPreview(product) {
    const ov = ensurePreviewModal();
    const media = ov.querySelector('.modal-media');
    const imgs = Array.isArray(product?.images) && product.images.length ? product.images : [product?.image].filter(Boolean);
    media.innerHTML = imgs.map(src => `<img src="${src}" alt="${product?.model || product?.name || 'Preview'}"/>`).join('');
    ov.classList.add('open');
    document.documentElement.style.overflow = 'hidden';
  }
  function closePreview() {
    if (!previewOverlay) return;
    previewOverlay.classList.remove('open');
    document.documentElement.style.overflow = '';
  }

  // --- Toasts ---
  let toastWrap = null;
  function ensureToastWrap() {
    if (toastWrap) return toastWrap;
    toastWrap = document.createElement('div');
    toastWrap.className = 'toast-wrap';
    document.body.appendChild(toastWrap);
    return toastWrap;
  }
  function showToast(message, timeout = 2000) {
    const wrap = ensureToastWrap();
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<span class="ok"></span><span>${message}</span>`;
    wrap.appendChild(el);
    setTimeout(() => { el.remove(); }, timeout);
  }

  // --- Gaming page logic ---
  (function setupGamingPage() {
    const isGaming = /(^|\/)gaming\.html(\?|#|$)/.test(location.pathname) || document.querySelector('[data-gaming-page]');
    if (!isGaming) return;

    // Containers
    const availableEl = document.getElementById('gaming-available');
    const stationsEl = document.getElementById('gaming-stations');
    const saleEl = document.getElementById('gaming-for-sale');
    const bookEl = document.getElementById('gaming-book');

    // Sample data
    const availableGames = ['FC 26', 'NBA 2K26', 'Call Of Duty', 'Forza Horizon'];
    const saleGames = ['FC 26', 'NBA 2K26', 'Call Of Duty', 'Forza Horizon', 'Gran Turismo 7', 'God of War Ragnarök'];
    const controllers = ['DualSense Controller White', 'DualSense Controller Midnight Black', 'DualSense Charging Station'];

    // Stations via Google Sheets (Apps Script JSONP)
    const STATIONS_API_URL = 'https://script.google.com/macros/s/AKfycbz6wS_T9YP994-LvUgUobGLLMR1l1o6OowMNjk3sdCo-A4WeUySS4Fz3UkdWI17RWYSIg/exec';
    const STATIONS_API_TOKEN = 'Apple Connect';
    let stationsData = [];

    function fetchStations() {
      return new Promise((resolve) => {
        try {
          const CALLBACK = 'ACStations';
          const s = document.createElement('script');
          const url = `${STATIONS_API_URL}?action=stations&token=${encodeURIComponent(STATIONS_API_TOKEN)}&callback=${CALLBACK}&_ts=${Date.now()}`;
          // Cleanup any previous handler
          try { delete window[CALLBACK]; } catch (_) { }
          window[CALLBACK] = (payload) => {
            try { delete window[CALLBACK]; } catch (_) { }
            try { s.remove(); } catch (_) { }
            const arr = Array.isArray(payload?.stations) ? payload.stations : [];
            if (!arr.length) { try { console.warn('Stations payload empty or invalid', payload); } catch (_) { } }
            stationsData = arr;
            resolve(arr);
          };
          s.src = url;
          s.async = true;
          s.onerror = () => { try { delete window[CALLBACK]; } catch (_) { }; try { s.remove(); } catch (_) { }; resolve([]); };
          document.body.appendChild(s);
        } catch (_) { resolve([]); }
      });
    }

    function remainingMinutes(st) {
      try {
        if (!st) return 0;
        if (String(st.status || '').toLowerCase() !== 'busy') return 0;
        // Prefer explicit minutesLeft if provided by API
        const ml = st.minutesLeft;
        if (typeof ml === 'number' && isFinite(ml)) return Math.max(0, Math.round(ml));
        // Fallback to endTimeISO or endTime fields
        const ref = st.endTimeISO || st.endTime || st.end_time || null;
        let end = null;
        if (ref) {
          const d = new Date(ref);
          if (!isNaN(d.getTime())) end = d;
        }
        if (!end && typeof st.endTimeMs === 'number') {
          const d2 = new Date(st.endTimeMs);
          if (!isNaN(d2.getTime())) end = d2;
        }
        if (!end) return 0;
        const diff = end.getTime() - Date.now();
        return Math.max(0, Math.round(diff / 60000));
      } catch (_) { return 0; }
    }

    function renderAvailable() {
      if (!availableEl) return;
      const imgMap = {
        'FC 26': 'assets/Games To Play/FC 26.jpg',
        'NBA 2K26': 'assets/Games To Play/NBA 2K26.jpg',
        'Call Of Duty': 'assets/Games To Play/Call of Duty.jpg',
        'Forza Horizon': 'assets/Games To Play/Forza.jpg'
      };
      availableEl.innerHTML = `<div class="apple-cards grid small">${availableGames.map(name => {
        const src = imgMap[name];
        const media = src ? `<div class=\"apple-card-media\"><img src=\"${src}\" alt=\"${name}\"/></div>` : '';
        return `
          <article class=\"apple-card\"> 
            ${media}
            <div class=\"apple-card-body\"><h3>${name}</h3><div class=\"sub\">$2 per hour • PS5 • Bulawayo Center</div></div>
          </article>`;
      }).join('')}</div>`;
      tagForReveal(availableEl);
    }

    function fmtTime(min) {
      if (!min || min <= 0) return '0 min';
      const h = Math.floor(min / 60);
      const m = min % 60;
      if (h && m) return `${h} hr ${m} min`;
      if (h) return `${h} hr${h > 1 ? 's' : ''}`;
      return `${m} min`;
    }

    function gamingIconSvg() {
      return '<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 7h12a3 3 0 0 1 3 3v4.5a2.5 2.5 0 0 1-4.35 1.67l-.82-.92a2.5 2.5 0 0 0-1.85-.83H9.02a2.5 2.5 0 0 0-1.85.83l-.82.92A2.5 2.5 0 0 1 2 14.5V10a3 3 0 0 1 3-3zm2 2v2H6v2h2v2h2v-2h2v-2h-2V9H8zm8.75 1.5a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zm-2.5-1a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/></svg>';
    }

    function renderStations() {
      if (!stationsEl) return;
      const list = Array.isArray(stationsData) ? stationsData : [];
      stationsEl.innerHTML = list.length ? `
        <div class="cards grid grid-6 tiny" role="list">
          ${list.map((st, idx) => {
        const isBusyStatus = String(st.status || '').toLowerCase() === 'busy';
        const rem = remainingMinutes(st);
        const busy = isBusyStatus; // show Busy even if no endTime yet
        const title = st.name || `Station ${idx + 1}`;
        return `
            <div class="card" role="listitem">
              ${busy ? '<span class="corner-badge">Booked</span>' : ''}
              <div class="card-media"><img src="assets/Games To Play/HPNG2_AV3.jpeg" alt="${title}" /></div>
              <div class="card-body">
                <div class="card-title"><h3>${title}</h3><span class="card-badge ${busy ? 'warn' : 'success'}">${busy ? 'Busy' : 'Free'}</span></div>
                <div class="sub">Bulawayo Center</div>
                ${busy ? (rem > 0 ? `<div class=\"specs\"><div>Time left</div><div>${fmtTime(rem)}</div></div>` : `<div class=\"specs\"><div>Status</div><div>Busy</div></div>`) : `<div class=\"specs\"><div>Status</div><div>Free</div></div>`}
              </div>
            </div>`;
      }).join('')}
        </div>
      ` : `<div class="muted">No stations found. Check your Google Sheet (Stations tab) and Apps Script response.</div>`;
      tagForReveal(stationsEl);
    }

    function tickStations() {
      fetchStations().then(() => { renderStations(); });
    }

    async function renderForSale() {
      if (!saleEl) return;
      // Render exactly the 5 specified products
      const items = [
        {
          id: 'fc26-disk',
          name: 'FC 26',
          price: 45,
          image: 'assets/Game Shop/FC 26 (Game, Disk).jpg',
          version: 'Game',
          stock: 12,
          branch: 'Bulawayo Center'
        },
        {
          id: 'cod-disk',
          name: 'Call Of Duty',
          price: 55,
          image: 'assets/Game Shop/Call of Duty (Game, Disk).jpg',
          version: 'Game',
          stock: 8,
          branch: 'Bulawayo Center'
        },
        {
          id: 'mk1-disk',
          name: 'Mortal Kombat',
          price: 50,
          image: 'assets/Game Shop/Mortal Kombat 1 (Game, Disk).jpg',
          version: 'Game',
          stock: 6,
          branch: 'Bulawayo Center'
        },
        {
          id: 'nba2k26-disk',
          name: 'NBA 2K26',
          price: 60,
          image: 'assets/Game Shop/NBA 2K26 (Game, Disk).jpg',
          version: 'Game',
          stock: 10,
          branch: 'Bulawayo Center'
        },
        {
          id: 'ps5-console',
          name: 'Playstation 5 Pro',
          price: 799,
          image: 'assets/Game Shop/Playstation 5 Console.jpg',
          version: 'Console',
          stock: 3,
          branch: 'Bulawayo Center'
        },
        {
          id: 'ps5-dualsense',
          name: 'Playstation 5 DualSense',
          price: 90,
          image: 'assets/Game Shop/PS5 DualSense Controller (Controller).jpg',
          version: 'Controller',
          stock: 12,
          branch: 'Bulawayo Center'
        }
      ];
      saleEl.innerHTML = `
        <div class="apple-cards grid small shop" role="list">
          ${items.map(it => `
            <article class="apple-card" role="listitem" data-id="${it.id}" data-category="game">
              ${it.image ? `<div class=\"apple-card-media\"><img src=\"${it.image}\" alt=\"${it.name}\"/></div>` : ''}
              <div class="apple-card-body">
                <h3>${it.name}</h3>
                <div class="sub">${it.version} • ${it.branch}</div>
                ${typeof it.stock === 'number' ? `<div class=\"details\"><div class=\"detail-row\"><span class=\"detail-label\">Stock</span><span class=\"detail-value\">${it.stock}</span></div></div>` : ''}
                <div class="price-line">${currency('USD', it.price)}</div>
                <div class="apple-card-actions">
                  <button class="buy-btn" aria-label="Buy ${it.name}">Buy now</button>
                  <button class="cart-btn" aria-label="Add ${it.name} to cart">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M6 6h15l-1.5 9h-12z" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/>
                      <circle cx="9" cy="20" r="1.5" fill="currentColor"/>
                      <circle cx="18" cy="20" r="1.5" fill="currentColor"/>
                      <path d="M6 6L5 3H2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            </article>
          `).join('')}
        </div>
      `;
      tagForReveal(saleEl);
    }

    function renderBooking() {
      if (!bookEl) return;
      const list = Array.isArray(stationsData) ? stationsData : [];
      const options = list.map((s, idx) => {
        const title = s.name || `Station ${idx + 1}`;
        const isBusyStatus = String(s.status || '').toLowerCase() === 'busy';
        const rem = remainingMinutes(s);
        const suffix = isBusyStatus ? (rem > 0 ? `(Busy, ~${fmtTime(rem)})` : '(Busy)') : '(Free)';
        const val = s.stationId || `S${idx + 1}`;
        return `<option value="${val}">${title} ${suffix}</option>`;
      }).join('');
      const durations = [
        { label: '30 mins', minutes: 30 },
        { label: '1 hr', minutes: 60 },
        { label: '1 hr 30 mins', minutes: 90 },
        { label: '2 hrs', minutes: 120 },
        { label: '2 hrs 30 mins', minutes: 150 },
        { label: '3 hrs', minutes: 180 },
        { label: '3 hrs 30 mins', minutes: 210 },
        { label: '4 hrs', minutes: 240 },
        { label: '4 hrs 30 mins', minutes: 270 },
        { label: '5 hrs', minutes: 300 }
      ];
      const durOpts = durations.map(d => `<option value="${d.minutes}">${d.label}</option>`).join('');
      bookEl.innerHTML = `
        <form id="bookForm" class="booking-new-form">
          <div class="booking-new reveal">
            <div class="booking-head">
              <h3>Book a Station</h3>
              <span class="price-badge">$2 / hour</span>
            </div>
            <div class="booking-fields">
              <div class="field">
                <label for="stationSelect">Station</label>
                <select id="stationSelect">${options}</select>
              </div>
              <div class="field">
                <label for="hoursSelect">Duration</label>
                <select id="hoursSelect">${durOpts}</select>
              </div>
            </div>
            <div class="booking-foot">
              <button class="btn btn-primary btn-small" type="submit">Book</button>
            </div>
          </div>
        </form>
      `;
      tagForReveal(bookEl);
      const form = document.getElementById('bookForm');
      form?.addEventListener('submit', (e) => {
        e.preventDefault();
        const stationSel = document.getElementById('stationSelect');
        const durationSel = document.getElementById('hoursSelect');
        const sid = stationSel.value;
        const stationText = stationSel.options[stationSel.selectedIndex].text.split('(')[0].trim();
        const durationText = durationSel.options[durationSel.selectedIndex].text;
        const number = '27640823961';
        const msg = `Hy, I would like to book ${stationText} for ${durationText}`;
        const url = `https://wa.me/${number}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
      });
    }

    renderAvailable();
    renderForSale();
    fetchStations().then(() => { renderStations(); renderBooking(); });
    setInterval(tickStations, 60000); // poll every minute
  })();

  // --- Promo Preview Section Logic ---
  (function initPromoPreview() {
    const container = document.getElementById('promo-cards-container');
    if (!container) return;

    let promoProducts = [];
    let currentIndex = 0;
    const itemsPerPage = 4;
    let rotationInterval = null;

    function getPromoProducts() {
      return (state.products || []).filter(p => p.promo === true);
    }

    function createPromoCard(p, isBack = false) {
      const img = p.image || '';
      const price = typeof p.price === 'number' ? currency(p.currency, p.price) : '';
      const battery = p.batteryHealth || '';
      const storage = p.storage || '';
      const branch = p.branch || '';

      return `
        <div class="promo-card ${isBack ? 'back' : 'front'}">
          <div class="promo-card-media">
            <div class="promo-badge">${price}</div>
            ${img ? `<img src="${img}" alt="${p.model}" />` : ''}
          </div>
          <div class="promo-card-body">
            <h3>${p.model}</h3>
            <div class="sub" style="font-size: 11px; margin-bottom: 4px;">${branch}</div>
            <div style="font-size: 12px; color: var(--text-muted); display: grid; gap: 4px;">
              <div>Storage: <b>${storage}</b></div>
              <div>Battery: <b>${battery}</b></div>
            </div>
            <div class="promo-card-actions">
              <button class="btn-see-now" onclick="openProductModal('${p.id}')">See More</button>
            </div>
          </div>
        </div>
      `;
    }

    // Modal Logic
    window.openProductModal = function (pid) {
      const p = (state.products || []).find(item => item.id === pid);
      if (!p) return;

      // Create modal overlay
      const overlay = document.createElement('div');
      overlay.className = 'fixed-layer active';
      overlay.id = 'product-modal-root';
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100vw';
      overlay.style.height = '100vh';
      overlay.style.zIndex = '99999';
      overlay.style.backgroundColor = 'rgba(0,0,0,0.85)';
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.padding = '20px';
      overlay.style.backdropFilter = 'blur(12px)';
      overlay.style.webkitBackdropFilter = 'blur(12px)';

      const modalContent = document.createElement('div');
      modalContent.className = 'modal-reveal-container';
      modalContent.style.maxWidth = '420px';
      modalContent.style.width = '100%';
      modalContent.style.maxHeight = '90vh';
      modalContent.style.borderRadius = '32px';
      modalContent.style.animation = 'revealUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both';
      modalContent.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.5)';
      modalContent.style.display = 'flex';
      modalContent.style.flexDirection = 'column';

      // Use the original card maker with hidden cart
      const cardHTML = makeCard(p, { showCart: false });
      modalContent.innerHTML = `
        <div class="modal-scroll-area" style="position:relative; background:#f8fafc; border-radius:32px; overflow-y:auto; overflow-x:hidden; -webkit-overflow-scrolling:touch; max-height:90vh; scrollbar-width: none;">
           <button class="close-trigger" 
                   style="position:absolute; top:12px; right:12px; z-index:100; background:white; border:none; color:black; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:20px; cursor:pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid rgba(0,0,0,0.05); transition: 0.3s;"
                   onmouseover="this.style.boxShadow='0 6px 16px rgba(0,0,0,0.15)'; this.style.transform='scale(1.1)'" 
                   onmouseout="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'; this.style.transform='scale(1)'"
                   aria-label="Close modal">&times;</button>
           <div class="modal-card-inset" style="padding: 30px 20px;">
             <div class="modal-inner-card-fix" style="height:auto;">
               ${cardHTML.replace('class="apple-card"', 'class="apple-card modal-view-card" style="height:auto; box-shadow: 0 10px 30px rgba(0,0,0,0.08); animation: none;"')}
             </div>
           </div>
        </div>
      `;

      overlay.innerHTML = '';
      overlay.appendChild(modalContent);
      document.body.appendChild(overlay);
      document.body.style.overflow = 'hidden';

      const closeModal = () => {
        overlay.remove();
        document.body.style.overflow = '';
      };

      // Close on background click
      overlay.onclick = (e) => {
        if (e.target === overlay) closeModal();
      };

      // Ensure the close button in the HTML content calls this local function too
      // But since we used inline onclick in HTML string, let's just make it simpler:
      overlay.querySelector('.close-trigger').onclick = closeModal;
    };

    function renderPromoInitial() {
      promoProducts = getPromoProducts();
      if (!promoProducts.length) {
        container.innerHTML = '<div class="muted">No promo items at the moment.</div>';
        return;
      }

      const displayItems = promoProducts.slice(0, itemsPerPage);
      container.innerHTML = displayItems.map(p => `
        <div class="promo-card-wrapper">
          ${createPromoCard(p)}
          <div class="promo-card back"></div> <!-- Placeholder for flip -->
        </div>
      `).join('');

      tagForReveal(container);

      if (promoProducts.length > itemsPerPage) {
        startRotation();
      }
    }

    function rotatePromo() {
      const wrappers = container.querySelectorAll('.promo-card-wrapper');
      currentIndex = (currentIndex + itemsPerPage) % promoProducts.length;
      const nextItems = [];

      for (let i = 0; i < itemsPerPage; i++) {
        nextItems.push(promoProducts[(currentIndex + i) % promoProducts.length]);
      }

      wrappers.forEach((wrapper, idx) => {
        const nextProduct = nextItems[idx];
        if (!nextProduct) return;

        // Injected the next product into the "back" card
        const backCard = wrapper.querySelector('.promo-card.back');
        if (backCard) {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = createPromoCard(nextProduct, true);
          const newBack = tempDiv.firstElementChild;
          wrapper.replaceChild(newBack, backCard);
        }

        // Trigger flip
        wrapper.classList.add('flipping');

        // After animation, swap front and back and reset
        setTimeout(() => {
          const front = wrapper.querySelector('.promo-card:not(.back)');
          const back = wrapper.querySelector('.promo-card.back');

          if (front && back) {
            // New "front" is the one that was just flipped to (the back one)
            back.classList.remove('back');
            front.classList.add('back');
            wrapper.classList.remove('flipping');
            // Ensure the new "back" is empty/ready for next rotation
            front.innerHTML = '';
          }
        }, 600);
      });
    }

    function startRotation() {
      if (rotationInterval) clearInterval(rotationInterval);
      rotationInterval = setInterval(rotatePromo, 10000);
    }

    // Wait for products to be loaded
    const checkLoaded = setInterval(() => {
      if (state.products && state.products.length > 0) {
        clearInterval(checkLoaded);
        renderPromoInitial();
      }
    }, 500);
  })();
})();
