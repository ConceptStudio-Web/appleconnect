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
    } catch (_) {}
  }

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
      const prod = (state.products||[]).find(p => p.id === ci.id) || null;
      if (prod) ensureProductId(prod);
      const name = (prod?.model || ci.name || '').trim();
      const isShop = (ci?.category === 'game') || (prod && ['game','controller','console'].includes(String(prod.category||'').toLowerCase())) || String(ci?.id||'').startsWith('shop-');
      if (items.length > 1) lines.push(`Item ${idx+1}`);
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
    const colors = ['Black','White','Midnight','Starlight','Blue','Green','Red','Purple','Space Gray','Silver'];
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
    const num = String(Math.abs(h)).padStart(3, '0').slice(0,3);
    p.productId = `${a}${b}${c}-${num}`;
    return p;
  }

  // Persist cart across pages
  function saveCart() {
    try { localStorage.setItem('ac_cart', JSON.stringify(state.cart)); } catch(_) {}
  }
  function loadCart() {
    try {
      const raw = localStorage.getItem('ac_cart');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) state.cart = parsed;
      }
    } catch(_) {}
  }
  loadCart();
  // Immediately reflect persisted cart in the badge on every page load
  try { updateCartBadge(); } catch(_) {}
  // Also update once DOM is guaranteed ready, to handle any timing inconsistencies
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      try { ensureCartUI(); updateCartBadge(); } catch(_) {}
    }, { once: true });
  } else {
    try { ensureCartUI(); updateCartBadge(); } catch(_) {}
  }

  // Final safety: after all resources load
  window.addEventListener('load', () => {
    try { ensureCartUI(); updateCartBadge(); } catch(_) {}
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
      // Allow overriding via window.PRODUCTS if a script provides it
      const override = Array.isArray(window.PRODUCTS) ? window.PRODUCTS : null;
      state.products = (override && override.length ? override : fallbackProducts).map(ensureProductId);
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
        const name = (p.model||p.name||'').toLowerCase();
        const cat = (p.category||'').toLowerCase();
        const brand = (p.brand||'').toLowerCase();
        const pid = String(p.productId||'').toLowerCase();
        return name.includes(urlQ) || cat.includes(urlQ) || brand.includes(urlQ) || (pid && pid.includes(urlQ));
      });
    } else {
      state.filtered = base;
    }
    renderAll();
  }

  function applyFilters() {
    const storage = storageFilter?.value || '';
    const condition = conditionFilter?.value || '';
    const model = modelFilter?.value || '';
    const accessoriesType = accessoriesTypeFilter?.value || '';

    // Base dataset limited to this page's category (except Home)
    const base = (pageCategory && pageCategory !== 'home')
      ? state.products.filter(p => p.category === pageCategory)
      : state.products;

    function matchesCondition(pCond, selected) {
      if (!selected) return true;
      const c = (pCond || '').toLowerCase();
      switch (selected) {
        case 'boxed': return c.includes('boxed');
        case 'used_new': return c.includes('like new') || c.includes('excellent') || c.includes('used (new)');
        case 'used_good': return c.includes('good');
        case 'used_fair': return c.includes('fair');
        default: return c === selected.toLowerCase();
      }
    }

    state.filtered = base.filter(p => {
      const storageOk = !storage || p.storage === storage;
      const conditionOk = matchesCondition(p.condition, condition);
      const modelOk = !model || p.model === model;
      const accessoriesTypeOk = !accessoriesType || (p.category === 'accessory' && p.type === accessoriesType);
      return storageOk && conditionOk && modelOk && accessoriesTypeOk;
    });
    renderAll();
  }

  storageFilter?.addEventListener('change', applyFilters);
  conditionFilter?.addEventListener('change', applyFilters);
  modelFilter?.addEventListener('change', applyFilters);
  accessoriesTypeFilter?.addEventListener('change', applyFilters);
  clearFilters?.addEventListener('click', () => {
    if (storageFilter) storageFilter.value = '';
    if (conditionFilter) conditionFilter.value = '';
    if (modelFilter) modelFilter.value = '';
    applyFilters();
  });

  function makeCard(p) {
    const img = p.image || '';
    const label = (p.tags && p.tags.includes('new_stock')) ? 'New' : (p.badge || '');
    const subParts = [];
    if (p.condition) subParts.push(p.condition);
    if (p.storage) subParts.push(p.storage);
    if (p.productId) subParts.push(p.productId);
    const sub = subParts.join(' • ');
    const hasPrice = typeof p.price === 'number' && isFinite(p.price);
    const priceLine = hasPrice ? `${currency(p.currency, p.price)}` : '';
    const condition = p.condition || '';
    const randColor = productColor(p);
    const faceId = (p.faceId === true || p.faceId === 'Yes') ? 'Yes' : (p.faceId === false ? 'No' : (p.faceId || '')); 
    const trueTone = (p.truetone === true || p.truetone === 'Yes') ? 'Yes' : (p.truetone === false ? 'No' : (p.truetone || ''));
    const battery = p.batteryHealth || '';
    const warranty = p.warranty || '';
    const branch = p.branch || '';
    const showDetails = condition || faceId || trueTone || battery || warranty || branch || randColor || p.storage;
    const detailsHTML = showDetails ? `
      <div class="details" role="group" aria-label="Product details">
        ${condition ? `<div class="detail-row"><span class="detail-label">Condition</span><span class="detail-value">${condition}</span></div>` : ''}
        ${p.storage ? `<div class="detail-row"><span class="detail-label">Storage</span><span class="detail-value">${p.storage}</span></div>` : ''}
        ${faceId ? `<div class="detail-row"><span class="detail-label">Face ID</span><span class="detail-value">${faceId}</span></div>` : ''}
        ${trueTone ? `<div class="detail-row"><span class="detail-label">True Tone</span><span class="detail-value">${trueTone}</span></div>` : ''}
        ${battery ? `<div class="detail-row"><span class="detail-label">Battery Health</span><span class="detail-value">${battery}</span></div>` : ''}
        ${warranty ? `<div class="detail-row"><span class="detail-label">Warranty</span><span class="detail-value">${warranty}</span></div>` : ''}
        ${branch ? `<div class="detail-row"><span class="detail-label">Branch</span><span class="detail-value">${branch}</span></div>` : ''}
        ${randColor ? `<div class="detail-row"><span class="detail-label">Color</span><span class="detail-value">${randColor}</span></div>` : ''}
      </div>
    ` : '';
    return `
      <article class="apple-card" role="listitem" data-id="${p.id}" data-category="${p.category}" data-price="${hasPrice ? p.price : ''}" data-name="${p.model}">
        <div class="apple-card-media">${img ? `<img alt="${p.model}" src="${img}"/>` : ''}</div>
        <div class="apple-card-body">
          ${label ? `<div class="pill">${label}</div>` : ''}
          <h3>${p.model}</h3>
          <div class="sub">${sub}</div>
          ${detailsHTML}
          ${hasPrice ? `<div class="price-line">${priceLine}</div>` : ''}
          <div class="apple-card-actions">
            <button class="preview-btn" aria-label="Preview ${p.model}">Preview</button>
            <button class="buy-btn" aria-label="Buy ${p.model}">Buy now</button>
            <button class="cart-btn" aria-label="Add ${p.model} to cart">
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
    el.innerHTML = items.map(makeCard).join('');
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
    if (all) all.innerHTML = state.filtered.map(makeCard).join('');
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
    } catch(_) {}
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
    } catch(_) {}
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
  (function(){
    try {
      const v = document.getElementById('homeHeroVideo');
      if (!v) return;
      v.removeAttribute('loop');
      const start = () => { try { v.play().catch(()=>{}); } catch(_) {} };
      if (v.readyState >= 2) { start(); }
      else { v.addEventListener('loadedmetadata', start, { once: true }); }
      v.addEventListener('ended', () => {
        try {
          v.pause();
          if (!isNaN(v.duration) && isFinite(v.duration)) {
            v.currentTime = Math.max(0, v.duration - 0.001);
          }
        } catch(_) {}
      });
    } catch(_) {}
  })();
  (function(){
    try {
      const vids = Array.from(document.querySelectorAll('video[data-pause-once]'));
      vids.forEach(v => {
        if (v.dataset.pauseOnceBound) return;
        v.dataset.pauseOnceBound = '1';
        v.removeAttribute('loop');
        const start = () => { try { v.play().catch(()=>{}); } catch(_) {} };
        if (v.readyState >= 2) { start(); }
        else { v.addEventListener('loadedmetadata', start, { once: true }); }
        v.addEventListener('ended', () => {
          try {
            v.pause();
            if (!isNaN(v.duration) && isFinite(v.duration)) {
              v.currentTime = Math.max(0, v.duration - 0.001);
            }
          } catch(_) {}
        });
      });
    } catch(_) {}
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
        const img = p.image ? `<img class="thumb" src="${p.image}" alt="${p.model||p.name}"/>` : '';
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
        const matches = (base||[]).filter(p => {
          const name = (p.model||p.name||'').toLowerCase();
          const cat = (p.category||'').toLowerCase();
          const brand = (p.brand||'').toLowerCase();
          const pid = String(p.productId||'').toLowerCase();
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
      const matches = (base||[]).filter(p => {
        const name = (p.model||p.name||'').toLowerCase();
        const cat = (p.category||'').toLowerCase();
        const brand = (p.brand||'').toLowerCase();
        const pid = String(p.productId||'').toLowerCase();
        return name.includes(q) || cat.includes(q) || brand.includes(q) || (pid && pid.includes(q));
      });
      const counts = matches.reduce((acc, p) => { const c=(p.category||'').toLowerCase(); acc[c]=(acc[c]||0)+1; return acc; }, {});
      function routeFor(cat){
        switch(cat){
          case 'iphone': return 'iphones.html';
          case 'ipad': return 'ipads.html';
          case 'macbook': return 'macbooks.html';
          case 'accessory': return 'accessories.html';
          case 'game': return 'gaming.html';
          case 'controller': return 'gaming.html';
          default: return 'index.html';
        }
      }
      const best = Object.keys(counts).sort((a,b)=>counts[b]-counts[a])[0] || '';
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
  (function initCartUI(){ try { ensureCartUI(); updateCartBadge(); } catch(_) {} })();

  // Make header logo navigate to home
  (function setupBrandLink(){
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
          try { openWhatsAppCart(); } catch(_) {}
        });
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
    if (existing) existing.qty += qty; else state.cart.push({ id: product.id, name: product.model, price: product.price || 0, image: product.image || '', qty });
    updateCartBadge();
    showToast(`${product.model} added to cart`);
    saveCart();
  }

  function removeFromCart(id) {
    if (!id) return;
    const idx = state.cart.findIndex(i => i.id === id);
    if (idx !== -1) {
      state.cart.splice(idx, 1);
      renderCart();
      updateCartBadge();
      try { cartPanelEl?.classList?.add('open'); } catch(_) {}
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
          <div>${currency('USD', (i.price||0) * i.qty)}</div>
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
    const total = state.cart.reduce((sum, i) => sum + (i.price||0) * i.qty, 0);
    totalEl.textContent = currency('USD', total);
  }

  function updateCartItemQty(id, delta) {
    if (!id || !delta) return;
    const item = state.cart.find(x => x.id === id);
    if (!item) return;
    item.qty = Math.max(1, (item.qty||1) + delta);
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
        const priceMatch = priceText.replace(/[^0-9.]/g,'');
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
    const number = '263777306848';
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
    media.innerHTML = imgs.map(src => `<img src="${src}" alt="${product?.model||product?.name||'Preview'}"/>`).join('');
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
          try { delete window[CALLBACK]; } catch(_) {}
          window[CALLBACK] = (payload) => {
            try { delete window[CALLBACK]; } catch(_) {}
            try { s.remove(); } catch(_) {}
            const arr = Array.isArray(payload?.stations) ? payload.stations : [];
            if (!arr.length) { try { console.warn('Stations payload empty or invalid', payload); } catch(_) {} }
            stationsData = arr;
            resolve(arr);
          };
          s.src = url;
          s.async = true;
          s.onerror = () => { try { delete window[CALLBACK]; } catch(_) {} ; try { s.remove(); } catch(_) {} ; resolve([]); };
          document.body.appendChild(s);
        } catch(_) { resolve([]); }
      });
    }

    function remainingMinutes(st) {
      try {
        if (!st) return 0;
        if (String(st.status||'').toLowerCase() !== 'busy') return 0;
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
      } catch(_) { return 0; }
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
      if (h) return `${h} hr${h>1?'s':''}`;
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
            const isBusyStatus = String(st.status||'').toLowerCase() === 'busy';
            const rem = remainingMinutes(st);
            const busy = isBusyStatus; // show Busy even if no endTime yet
            const title = st.name || `Station ${idx+1}`;
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
          price: 75,
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
        const title = s.name || `Station ${idx+1}`;
        const isBusyStatus = String(s.status||'').toLowerCase() === 'busy';
        const rem = remainingMinutes(s);
        const suffix = isBusyStatus ? (rem > 0 ? `(Busy, ~${fmtTime(rem)})` : '(Busy)') : '(Free)';
        const val = s.stationId || `S${idx+1}`;
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
        const number = '263777306848';
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
})();
