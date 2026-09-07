/**
 * SHOWOFFFF - Interactive Storefront Application Logic
 */

(function () {
  'use strict';

  // =========================================================================
  // STATE MANAGEMENT
  // =========================================================================
  const STATE = {
    cart: JSON.parse(localStorage.getItem('showoff_cart') || '[]'),
    wishlist: JSON.parse(localStorage.getItem('showoff_wishlist') || '[]'),
    activeCategory: 'All',
    sortBy: 'featured',
    searchQuery: '',
    visibleProductsCount: 12,
    appliedCoupon: null,
    freeShippingThreshold: 1499,
    selectedQuickViewProduct: null,
    selectedQuickViewSize: null
  };

  // Coupons
  const COUPONS = {
    'EXTRA15': { type: 'percent', value: 15, label: '15% OFF (Orders > ₹1999)', minSpend: 1999 },
    'EXTRA10': { type: 'percent', value: 10, label: '10% OFF (Orders > ₹999)', minSpend: 999 },
    'FLASH50': { type: 'percent', value: 50, label: '50% OFF Flash Sale', minSpend: 0 },
    'SHOWOFF10': { type: 'percent', value: 10, label: '10% OFF', minSpend: 0 }
  };

  // =========================================================================
  // DOM CACHE
  // =========================================================================
  const DOM = {
    // Timers
    marqueeTimer: document.getElementById('marquee-countdown'),
    heroTimerHours: document.getElementById('hero-timer-hours'),
    heroTimerMins: document.getElementById('hero-timer-mins'),
    heroTimerSecs: document.getElementById('hero-timer-secs'),

    // Sections & Grids
    collectionGrid: document.getElementById('asymmetric-collection-grid'),
    hotDropsGrid: document.getElementById('hot-drops-grid'),
    bestsellersGrid: document.getElementById('bestsellers-tiles-grid'),
    storiesGrid: document.getElementById('stories-carousel-grid'),
    shopAllGrid: document.getElementById('shop-all-grid'),
    catalogCounter: document.getElementById('catalog-counter'),
    btnLoadMore: document.getElementById('btn-load-more'),
    loadMoreContainer: document.getElementById('load-more-wrap'),

    // Filtering & Sorting
    filterBtns: document.querySelectorAll('.filter-btn'),
    navPillBtns: document.querySelectorAll('.nav-pill-btn'),
    sortSelect: document.getElementById('sort-select'),

    // Gender Switcher
    btnToggleHer: document.getElementById('btn-toggle-her'),
    btnToggleHim: document.getElementById('btn-toggle-him'),

    // Drawers & Modals
    backdrop: document.getElementById('app-backdrop'),
    cartDrawer: document.getElementById('cart-drawer'),
    cartCloseBtn: document.getElementById('cart-close-btn'),
    cartItemsList: document.getElementById('cart-items-list'),
    cartEmptyState: document.getElementById('cart-empty-state'),
    cartSubtotal: document.getElementById('cart-subtotal'),
    cartDiscountRow: document.getElementById('cart-discount-row'),
    cartDiscountVal: document.getElementById('cart-discount-val'),
    cartTotal: document.getElementById('cart-total'),
    shippingBarFill: document.getElementById('shipping-bar-fill'),
    shippingProgressText: document.getElementById('shipping-progress-text'),
    promoInput: document.getElementById('promo-input'),
    btnApplyPromo: document.getElementById('btn-apply-promo'),
    btnCheckout: document.getElementById('btn-checkout'),

    // Wishlist Drawer
    wishlistDrawer: document.getElementById('wishlist-drawer'),
    wishlistCloseBtn: document.getElementById('wishlist-close-btn'),
    wishlistItemsList: document.getElementById('wishlist-items-list'),
    wishlistEmptyState: document.getElementById('wishlist-empty-state'),

    // Mobile Menu
    mobileNavDrawer: document.getElementById('mobile-nav-drawer'),
    mobileNavCloseBtn: document.getElementById('mobile-nav-close-btn'),
    hamburgerBtn: document.getElementById('hamburger-btn'),

    // Search Modal
    searchModal: document.getElementById('search-modal'),
    searchModalInput: document.getElementById('search-modal-input'),
    searchModalCloseBtn: document.getElementById('search-modal-close-btn'),
    searchResultsGrid: document.getElementById('search-results-grid'),

    // Quick View Modal
    quickViewModal: document.getElementById('quick-view-modal'),
    quickViewCloseBtn: document.getElementById('quick-view-close-btn'),
    quickViewImg: document.getElementById('modal-main-img'),
    quickViewThumbs: document.getElementById('modal-thumbs-row'),
    quickViewTitle: document.getElementById('modal-title'),
    quickViewSalePrice: document.getElementById('modal-sale-price'),
    quickViewRegPrice: document.getElementById('modal-reg-price'),
    quickViewDiscount: document.getElementById('modal-discount'),
    quickViewSizes: document.getElementById('modal-sizes-list'),
    quickViewDesc: document.getElementById('modal-desc'),
    quickViewAddToCartBtn: document.getElementById('modal-add-atc-btn'),

    // Story Video Modal
    storyModal: document.getElementById('story-modal'),
    storyModalCloseBtn: document.getElementById('story-modal-close-btn'),
    storyVideoPlayer: document.getElementById('story-video-player'),
    storyModalAvatar: document.getElementById('story-modal-avatar'),
    storyModalCreator: document.getElementById('story-modal-creator'),
    storyModalCaption: document.getElementById('story-modal-caption'),
    storyModalProdName: document.getElementById('story-modal-prod-name'),
    storyModalProdPrice: document.getElementById('story-modal-prod-price'),
    btnStoryBuy: document.getElementById('btn-story-buy'),

    // Badges & Triggers
    cartCountBadges: document.querySelectorAll('.cart-count-badge'),
    wishlistCountBadges: document.querySelectorAll('.wishlist-count-badge'),
    cartTriggers: document.querySelectorAll('.cart-open-trigger'),
    wishlistTriggers: document.querySelectorAll('.wishlist-open-trigger'),
    searchTriggers: document.querySelectorAll('.search-open-trigger'),
    couponCopyTriggers: document.querySelectorAll('.copy-coupon-trigger'),

    // SEO Toggle
    seoToggleBtn: document.getElementById('seo-toggle-btn'),
    seoExtraText: document.getElementById('seo-extra-text'),

    // Hero Slider Carousel
    heroSliderViewport: document.getElementById('hero-slider-viewport'),
    heroSlidesTrack: document.getElementById('hero-slides-track'),
    heroSliderPrev: document.getElementById('hero-slider-prev'),
    heroSliderNext: document.getElementById('hero-slider-next'),
    heroSliderDots: document.querySelectorAll('.hero-dot'),

    // Newsletter & Toast
    newsletterForm: document.getElementById('newsletter-form'),
    newsletterEmail: document.getElementById('newsletter-email'),
    toastContainer: document.getElementById('toast-container'),
    chatBubble: document.getElementById('floating-chat-bubble'),
    btnAccount: document.getElementById('btn-account')
  };

  // =========================================================================
  // 1. HERO BANNER SLIDER CONTROLLER
  // =========================================================================
  function initHeroSlider() {
    if (!DOM.heroSlidesTrack) return;

    let currentSlide = 0;
    const slides = DOM.heroSlidesTrack.querySelectorAll('.hero-slide-item');
    const totalSlides = slides.length;
    let autoPlayTimer = null;
    let touchStartX = 0;
    let touchEndX = 0;

    if (totalSlides <= 1) return;

    function goToSlide(index) {
      currentSlide = (index + totalSlides) % totalSlides;
      DOM.heroSlidesTrack.style.transform = `translateX(-${currentSlide * 100}%)`;

      slides.forEach((slide, idx) => {
        if (idx === currentSlide) slide.classList.add('is-active');
        else slide.classList.remove('is-active');
      });

      if (DOM.heroSliderDots) {
        DOM.heroSliderDots.forEach((dot, idx) => {
          if (idx === currentSlide) dot.classList.add('is-active');
          else dot.classList.remove('is-active');
        });
      }
    }

    function startAutoPlay() {
      stopAutoPlay();
      autoPlayTimer = setInterval(() => {
        goToSlide(currentSlide + 1);
      }, 5000);
    }

    function stopAutoPlay() {
      if (autoPlayTimer) {
        clearInterval(autoPlayTimer);
        autoPlayTimer = null;
      }
    }

    if (DOM.heroSliderPrev) {
      DOM.heroSliderPrev.addEventListener('click', (e) => {
        e.preventDefault();
        goToSlide(currentSlide - 1);
        startAutoPlay();
      });
    }

    if (DOM.heroSliderNext) {
      DOM.heroSliderNext.addEventListener('click', (e) => {
        e.preventDefault();
        goToSlide(currentSlide + 1);
        startAutoPlay();
      });
    }

    if (DOM.heroSliderDots) {
      DOM.heroSliderDots.forEach((dot, idx) => {
        dot.addEventListener('click', () => {
          goToSlide(idx);
          startAutoPlay();
        });
      });
    }

    // Pause on hover
    if (DOM.heroSliderViewport) {
      DOM.heroSliderViewport.addEventListener('mouseenter', stopAutoPlay);
      DOM.heroSliderViewport.addEventListener('mouseleave', startAutoPlay);

      // Touch gestures for mobile swipe
      DOM.heroSliderViewport.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        stopAutoPlay();
      }, { passive: true });

      DOM.heroSliderViewport.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
        startAutoPlay();
      }, { passive: true });
    }

    function handleSwipe() {
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 40) {
        if (diff > 0) {
          goToSlide(currentSlide + 1); // Swipe left
        } else {
          goToSlide(currentSlide - 1); // Swipe right
        }
      }
    }

    startAutoPlay();
  }

  // =========================================================================
  // 1B. COUNTDOWN TIMER
  // =========================================================================
  function initCountdownTimer() {
    function getRemainingTime() {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();

      const totalSecondsPassedToday = (hours * 3600) + (minutes * 60) + seconds;
      const twelveHoursInSec = 12 * 3600;

      let secondsLeft = twelveHoursInSec - (totalSecondsPassedToday % twelveHoursInSec);
      if (secondsLeft <= 0) secondsLeft = twelveHoursInSec;

      const h = Math.floor(secondsLeft / 3600);
      const m = Math.floor((secondsLeft % 3600) / 60);
      const s = secondsLeft % 60;

      return {
        h: String(h).padStart(2, '0'),
        m: String(m).padStart(2, '0'),
        s: String(s).padStart(2, '0'),
        formatted: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      };
    }

    function updateTimers() {
      const time = getRemainingTime();
      if (DOM.marqueeTimer) DOM.marqueeTimer.textContent = time.formatted;
      if (DOM.heroTimerHours) DOM.heroTimerHours.textContent = time.h;
      if (DOM.heroTimerMins) DOM.heroTimerMins.textContent = time.m;
      if (DOM.heroTimerSecs) DOM.heroTimerSecs.textContent = time.s;
    }

    updateTimers();
    setInterval(updateTimers, 1000);
  }

  // =========================================================================
  // 2. PRODUCT CARD GENERATOR
  // =========================================================================
  function createProductCardHTML(product) {
    const isWishlisted = STATE.wishlist.some(item => item.id === product.id);
    const badgesHtml = (product.badges || [product.badge || 'NEW']).map(b => {
      let bClass = 'badge-new';
      if (b.toLowerCase().includes('bestseller')) bClass = 'badge-bestseller';
      return `<span class="card-badge ${bClass}">${b}</span>`;
    }).join('');

    const sizesHtml = (product.sizes || ['S', 'M', 'L']).map(size => `
      <button class="quick-size-chip" data-product-id="${product.id}" data-size="${size}" title="Quick Add ${size}">
        ${size}
      </button>
    `).join('');

    const swatchesHtml = (product.colors || ['#1B2E4B', '#333333']).map(c => `
      <span class="color-swatch-dot" style="background-color: ${c};"></span>
    `).join('');

    const primaryImg = (product.images && product.images[0]) ? product.images[0] : 'https://showoffff.in/cdn/shop/files/Deskto.webp';
    const secondaryImg = (product.images && product.images[1]) ? product.images[1] : primaryImg;

    return `
      <div class="product-card" data-product-id="${product.id}">
        <div class="card-media">
          <div class="card-badges-wrap">
            ${badgesHtml}
            <span class="card-badge badge-discount-tag">${product.discount || '64% OFF'}</span>
          </div>

          <button class="card-wishlist-btn ${isWishlisted ? 'is-active' : ''}" data-product-id="${product.id}" aria-label="Add to wishlist">
            <svg viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>

          <a href="product.html?id=${product.id}" style="display:block; width:100%; height:100%;">
            <img src="${primaryImg}" alt="${product.title}" class="card-img-primary" loading="lazy" />
            <img src="${secondaryImg}" alt="${product.title}" class="card-img-hover" loading="lazy" />
          </a>

          <div class="card-quick-actions">
            <div class="quick-size-list">
              ${sizesHtml}
            </div>
            <button class="quick-add-btn-full btn-open-quickview" data-product-id="${product.id}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              Quick View
            </button>
          </div>
        </div>

        <div class="card-content">
          <a href="product.html?id=${product.id}" style="text-decoration:none; color:inherit;">
            <h3 class="card-title" title="${product.title}">${product.title}</h3>
          </a>
          
          <div class="card-prices-row">
            <span class="price-sale">${product.salePrice}</span>
            <span class="price-regular">${product.regPrice}</span>
            <span class="price-discount-percent">${product.discount || '64% OFF'}</span>
          </div>

          <div class="card-swatches-row">
            ${swatchesHtml}
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // 3. RENDER ALL HOMEPAGE SECTIONS
  // =========================================================================
  function renderHomepageSections() {
    // 1. Render Collections Grid
    if (DOM.collectionGrid && PRODUCTS_DATA.collections) {
      DOM.collectionGrid.innerHTML = PRODUCTS_DATA.collections.map(col => `
        <div class="collection-card ${col.isTall ? 'collection-card-tall' : 'collection-card-standard'}" data-link="${col.link}">
          <img src="${col.image}" alt="${col.title}" class="collection-card-img" onerror="this.src='${col.fallbackImage}'" loading="lazy" />
          <div class="collection-card-overlay">
            <h3 class="collection-card-title">${col.title}</h3>
            <span class="collection-card-sub">${col.subtitle}</span>
          </div>
        </div>
      `).join('');
    }

    // 2. Render Hot Drops
    if (DOM.hotDropsGrid && PRODUCTS_DATA.hotDrops) {
      DOM.hotDropsGrid.innerHTML = PRODUCTS_DATA.hotDrops.map(createProductCardHTML).join('');
    }

    // 3. Render Bestsellers 4-Tile Grid
    if (DOM.bestsellersGrid && PRODUCTS_DATA.bestsellerTiles) {
      DOM.bestsellersGrid.innerHTML = PRODUCTS_DATA.bestsellerTiles.map(tile => `
        <a href="${tile.link}" class="bestseller-tile-card">
          <div class="tile-media-box">
            <img src="${tile.image}" alt="${tile.title}" class="tile-img" onerror="this.src='${tile.fallbackImage}'" loading="lazy" />
          </div>
          <div class="tile-footer-label">
            <span class="tile-title">${tile.title}</span>
            <span class="tile-arrow">➔</span>
          </div>
        </a>
      `).join('');
    }

    // 4. Render Fashion Stories (Reels)
    if (DOM.storiesGrid && PRODUCTS_DATA.fashionStories) {
      DOM.storiesGrid.innerHTML = PRODUCTS_DATA.fashionStories.map(story => `
        <div class="story-reel-card btn-open-story" data-story-id="${story.id}">
          <img src="${story.thumbnail}" alt="${story.caption}" class="story-thumb-img" loading="lazy" />
          <div class="story-card-overlay">
            <div class="story-creator-row">
              <img src="${story.avatar}" alt="${story.creator}" class="story-avatar-img" />
              <span class="story-creator-handle">${story.creator}</span>
            </div>

            <div class="story-play-badge">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="#ffffff"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            </div>

            <p class="story-card-caption">${story.caption}</p>
          </div>
        </div>
      `).join('');
    }

    // 5. Render Shop All Grid
    renderShopAllSection();
  }

  function getFilteredShopAllProducts() {
    const pageGender = document.body.getAttribute('data-page-gender');
    let items = [];

    if (pageGender === 'Men') {
      items = [...(PRODUCTS_DATA.menProducts || [])];
    } else if (pageGender === 'Curve') {
      items = [...(PRODUCTS_DATA.curveProducts || [])];
    } else if (pageGender === 'Top') {
      items = [...(PRODUCTS_DATA.hotDrops || [])];
    } else if (pageGender === 'Bestseller') {
      items = [
        ...(PRODUCTS_DATA.womenProducts || []),
        ...(PRODUCTS_DATA.menProducts || [])
      ].filter(p => (p.badges && p.badges.includes('Bestseller')) || p.rating >= 4.8);
    } else {
      items = [...(PRODUCTS_DATA.womenProducts || PRODUCTS_DATA.shopAllWomen || [])];
    }

    if (STATE.activeCategory !== 'All') {
      items = items.filter(item => item.category.toLowerCase() === STATE.activeCategory.toLowerCase());
    }

    if (STATE.searchQuery.trim() !== '') {
      const q = STATE.searchQuery.toLowerCase().trim();
      items = items.filter(item =>
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    }

    if (STATE.sortBy === 'price-low') {
      items.sort((a, b) => a.saleNum - b.saleNum);
    } else if (STATE.sortBy === 'price-high') {
      items.sort((a, b) => b.saleNum - a.saleNum);
    } else if (STATE.sortBy === 'discount') {
      items.sort((a, b) => (b.regNum - b.saleNum) - (a.regNum - a.saleNum));
    } else if (STATE.sortBy === 'rating') {
      items.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
    }

    return items;
  }

  function renderShopAllSection() {
    if (!DOM.shopAllGrid) return;

    const filtered = getFilteredShopAllProducts();
    const visible = filtered.slice(0, STATE.visibleProductsCount);

    if (DOM.catalogCounter) {
      DOM.catalogCounter.textContent = `Showing ${visible.length} of ${filtered.length} Products`;
    }

    if (visible.length === 0) {
      DOM.shopAllGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px;">
          <h4 style="font-size: 16px; font-weight: 700; margin-bottom: 6px;">No products found</h4>
          <p style="color: #6b7280; font-size: 13px;">Try choosing another category or clearing filters.</p>
        </div>
      `;
      if (DOM.loadMoreContainer) DOM.loadMoreContainer.style.display = 'none';
      return;
    }

    DOM.shopAllGrid.innerHTML = visible.map(createProductCardHTML).join('');

    if (DOM.loadMoreContainer) {
      DOM.loadMoreContainer.style.display = (STATE.visibleProductsCount >= filtered.length) ? 'none' : 'block';
    }
  }

  function findProductById(id) {
    if (PRODUCTS_DATA.findProductById) {
      return PRODUCTS_DATA.findProductById(id);
    }
    const all = [
      ...(PRODUCTS_DATA.hotDrops || []),
      ...(PRODUCTS_DATA.womenProducts || []),
      ...(PRODUCTS_DATA.menProducts || []),
      ...(PRODUCTS_DATA.curveProducts || [])
    ];
    return all.find(p => p.id === id);
  }

  // =========================================================================
  // 4. CART SYSTEM
  // =========================================================================
  function saveCart() {
    localStorage.setItem('showoff_cart', JSON.stringify(STATE.cart));
    updateCartUI();
  }

  function updateCartUI() {
    const totalCount = STATE.cart.reduce((sum, item) => sum + item.quantity, 0);

    DOM.cartCountBadges.forEach(badge => {
      badge.textContent = totalCount;
    });

    if (!DOM.cartItemsList) return;

    if (STATE.cart.length === 0) {
      DOM.cartItemsList.innerHTML = '';
      if (DOM.cartEmptyState) DOM.cartEmptyState.style.display = 'block';
      if (DOM.cartSubtotal) DOM.cartSubtotal.textContent = '₹0.00';
      if (DOM.cartTotal) DOM.cartTotal.textContent = '₹0.00';
      if (DOM.cartDiscountRow) DOM.cartDiscountRow.style.display = 'none';
      if (DOM.shippingBarFill) DOM.shippingBarFill.style.width = '0%';
      if (DOM.shippingProgressText) {
        DOM.shippingProgressText.innerHTML = `Add <strong>₹${STATE.freeShippingThreshold}</strong> more for <strong>FREE SHIPPING</strong>`;
      }
      return;
    }

    if (DOM.cartEmptyState) DOM.cartEmptyState.style.display = 'none';

    const rawSubtotal = STATE.cart.reduce((sum, item) => sum + (item.priceNum * item.quantity), 0);
    let discountAmount = 0;

    if (STATE.appliedCoupon) {
      const coupon = COUPONS[STATE.appliedCoupon];
      if (coupon) {
        if (coupon.type === 'percent') {
          discountAmount = (rawSubtotal * coupon.value) / 100;
        } else if (coupon.type === 'flat') {
          discountAmount = coupon.value;
        }
      }
    }

    const finalTotal = Math.max(0, rawSubtotal - discountAmount);

    // Free shipping progress
    const diff = STATE.freeShippingThreshold - rawSubtotal;
    if (diff <= 0) {
      DOM.shippingBarFill.style.width = '100%';
      DOM.shippingProgressText.innerHTML = `🎉 You unlocked <strong>FREE SHIPPING!</strong>`;
    } else {
      const pct = Math.min(100, Math.round((rawSubtotal / STATE.freeShippingThreshold) * 100));
      DOM.shippingBarFill.style.width = `${pct}%`;
      DOM.shippingProgressText.innerHTML = `Add <strong>₹${Math.round(diff)}</strong> more for <strong>FREE SHIPPING</strong>`;
    }

    DOM.cartItemsList.innerHTML = STATE.cart.map(item => `
      <div class="cart-item-row" data-cart-id="${item.cartItemId}">
        <img src="${item.image}" alt="${item.title}" class="cart-item-img" />
        <div class="cart-item-info">
          <h4 class="cart-item-title">${item.title}</h4>
          <span class="cart-item-size">Size: <strong>${item.size}</strong></span>
          <div class="cart-item-prices">
            <span class="cart-item-sale">₹${item.priceNum.toLocaleString('en-IN')}.00</span>
            <span class="cart-item-compare">₹${item.compareNum.toLocaleString('en-IN')}.00</span>
          </div>
          <div class="cart-item-controls">
            <div class="qty-control-box">
              <button class="qty-btn btn-cart-minus" data-cart-id="${item.cartItemId}">−</button>
              <span class="qty-display">${item.quantity}</span>
              <button class="qty-btn btn-cart-plus" data-cart-id="${item.cartItemId}">+</button>
            </div>
            <button class="cart-item-remove btn-cart-remove" data-cart-id="${item.cartItemId}">Remove</button>
          </div>
        </div>
      </div>
    `).join('');

    if (DOM.cartSubtotal) DOM.cartSubtotal.textContent = `₹${rawSubtotal.toLocaleString('en-IN')}.00`;

    if (discountAmount > 0 && DOM.cartDiscountRow && DOM.cartDiscountVal) {
      DOM.cartDiscountRow.style.display = 'flex';
      DOM.cartDiscountVal.textContent = `-₹${Math.round(discountAmount).toLocaleString('en-IN')}.00 (${COUPONS[STATE.appliedCoupon].label})`;
    } else if (DOM.cartDiscountRow) {
      DOM.cartDiscountRow.style.display = 'none';
    }

    if (DOM.cartTotal) DOM.cartTotal.textContent = `₹${finalTotal.toLocaleString('en-IN')}.00`;
  }

  function addToCart(product, size = 'M', quantity = 1) {
    const cartItemId = `${product.id}_${size}`;
    const existing = STATE.cart.find(i => i.cartItemId === cartItemId);

    if (existing) {
      existing.quantity += quantity;
    } else {
      STATE.cart.push({
        cartItemId,
        productId: product.id,
        title: product.title,
        size: size,
        priceNum: product.saleNum || 999,
        compareNum: product.regNum || 2499,
        image: (product.images && product.images[0]) ? product.images[0] : '',
        quantity: quantity
      });
    }

    saveCart();
    if (window.showoffAnalytics && typeof window.showoffAnalytics.trackAddToCart === 'function') {
      window.showoffAnalytics.trackAddToCart(product, quantity, size);
      window.showoffAnalytics.syncCartFromStorage();
    }
    showToast(`Added "${product.title}" (${size}) to Bag! 🛍️`, 'success');
    openCartDrawer();
  }

  function updateCartItemQuantity(cartItemId, delta) {
    const itemIndex = STATE.cart.findIndex(i => i.cartItemId === cartItemId);
    if (itemIndex === -1) return;

    STATE.cart[itemIndex].quantity += delta;
    if (STATE.cart[itemIndex].quantity <= 0) {
      const removedItem = STATE.cart[itemIndex];
      STATE.cart.splice(itemIndex, 1);
      if (window.showoffAnalytics && typeof window.showoffAnalytics.trackRemoveFromCart === 'function') {
        window.showoffAnalytics.trackRemoveFromCart(removedItem);
      }
    }
    saveCart();
    if (window.showoffAnalytics && typeof window.showoffAnalytics.syncCartFromStorage === 'function') {
      window.showoffAnalytics.syncCartFromStorage();
    }
  }

  function removeCartItem(cartItemId) {
    const removedItem = STATE.cart.find(i => i.cartItemId === cartItemId);
    STATE.cart = STATE.cart.filter(i => i.cartItemId !== cartItemId);
    saveCart();
    if (window.showoffAnalytics && typeof window.showoffAnalytics.trackRemoveFromCart === 'function' && removedItem) {
      window.showoffAnalytics.trackRemoveFromCart(removedItem);
    }
    if (window.showoffAnalytics && typeof window.showoffAnalytics.syncCartFromStorage === 'function') {
      window.showoffAnalytics.syncCartFromStorage();
    }
    showToast('Item removed from cart');
  }

  // =========================================================================
  // 5. WISHLIST SYSTEM
  // =========================================================================
  function saveWishlist() {
    localStorage.setItem('showoff_wishlist', JSON.stringify(STATE.wishlist));
    updateWishlistUI();
  }

  function updateWishlistUI() {
    DOM.wishlistCountBadges.forEach(badge => {
      badge.textContent = STATE.wishlist.length;
    });

    document.querySelectorAll('.card-wishlist-btn').forEach(btn => {
      const pId = btn.getAttribute('data-product-id');
      if (STATE.wishlist.some(item => item.id === pId)) {
        btn.classList.add('is-active');
      } else {
        btn.classList.remove('is-active');
      }
    });

    if (!DOM.wishlistItemsList) return;

    if (STATE.wishlist.length === 0) {
      DOM.wishlistItemsList.innerHTML = '';
      if (DOM.wishlistEmptyState) DOM.wishlistEmptyState.style.display = 'block';
      return;
    }

    if (DOM.wishlistEmptyState) DOM.wishlistEmptyState.style.display = 'none';

    DOM.wishlistItemsList.innerHTML = STATE.wishlist.map(item => `
      <div class="cart-item-row" data-product-id="${item.id}">
        <img src="${item.images ? item.images[0] : ''}" alt="${item.title}" class="cart-item-img" />
        <div class="cart-item-info">
          <h4 class="cart-item-title">${item.title}</h4>
          <div class="cart-item-prices">
            <span class="cart-item-sale">${item.salePrice}</span>
            <span class="cart-item-compare">${item.regPrice}</span>
          </div>
          <div class="cart-item-controls">
            <button class="quick-add-btn-full btn-wishlist-move-to-cart" data-product-id="${item.id}" style="padding: 4px 10px; font-size: 11px;">
              Move to Bag
            </button>
            <button class="cart-item-remove btn-wishlist-remove" data-product-id="${item.id}">Remove</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  function toggleWishlist(product) {
    const idx = STATE.wishlist.findIndex(i => i.id === product.id);
    if (idx > -1) {
      const removed = STATE.wishlist.splice(idx, 1)[0];
      if (window.showoffAnalytics && typeof window.showoffAnalytics.trackRemoveFromWishlist === 'function') {
        window.showoffAnalytics.trackRemoveFromWishlist(removed || product);
      }
      showToast('Removed from Wishlist');
    } else {
      STATE.wishlist.push(product);
      if (window.showoffAnalytics && typeof window.showoffAnalytics.trackAddToWishlist === 'function') {
        window.showoffAnalytics.trackAddToWishlist(product);
      }
      showToast(`Added "${product.title}" to Wishlist ❤️`, 'success');
    }
    saveWishlist();
  }

  // =========================================================================
  // 6. MODALS & DRAWERS
  // =========================================================================
  function openCartDrawer() {
    closeAllModals();
    if (DOM.cartDrawer) DOM.cartDrawer.classList.add('is-open');
    if (DOM.backdrop) DOM.backdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function openWishlistDrawer() {
    closeAllModals();
    if (DOM.wishlistDrawer) DOM.wishlistDrawer.classList.add('is-open');
    if (DOM.backdrop) DOM.backdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function openMobileNav() {
    closeAllModals();
    if (DOM.mobileNavDrawer) DOM.mobileNavDrawer.classList.add('is-open');
    if (DOM.backdrop) DOM.backdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function openSearchModal() {
    closeAllModals();
    if (DOM.searchModal) {
      DOM.searchModal.classList.add('is-open');
      if (DOM.searchModalInput) {
        DOM.searchModalInput.value = '';
        setTimeout(() => DOM.searchModalInput.focus(), 100);
      }
      renderSearchModalResults('');
    }
    if (DOM.backdrop) DOM.backdrop.classList.add('is-open');
  }

  function openQuickViewModal(product) {
    closeAllModals();
    STATE.selectedQuickViewProduct = product;
    STATE.selectedQuickViewSize = product.sizes ? product.sizes[0] : 'M';

    if (DOM.quickViewTitle) DOM.quickViewTitle.textContent = product.title;
    if (DOM.quickViewSalePrice) DOM.quickViewSalePrice.textContent = product.salePrice;
    if (DOM.quickViewRegPrice) DOM.quickViewRegPrice.textContent = product.regPrice;
    if (DOM.quickViewDiscount) DOM.quickViewDiscount.textContent = product.discount || '64% OFF';
    if (DOM.quickViewDesc) DOM.quickViewDesc.textContent = product.description || '';

    const imgs = product.images || [];
    if (DOM.quickViewImg) DOM.quickViewImg.src = imgs[0] || '';
    if (DOM.quickViewThumbs) {
      DOM.quickViewThumbs.innerHTML = imgs.slice(0, 4).map((src, i) => `
        <img src="${src}" class="modal-thumb ${i === 0 ? 'is-active' : ''}" data-index="${i}" alt="Thumbnail" />
      `).join('');
    }

    if (DOM.quickViewSizes) {
      DOM.quickViewSizes.innerHTML = (product.sizes || ['S', 'M', 'L']).map((size, i) => `
        <button class="modal-size-btn ${i === 0 ? 'is-selected' : ''}" data-size="${size}">${size}</button>
      `).join('');
    }

    if (DOM.quickViewModal) DOM.quickViewModal.classList.add('is-open');
    if (DOM.backdrop) DOM.backdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function openStoryModal(story) {
    closeAllModals();
    if (!DOM.storyModal) return;

    if (DOM.storyModalAvatar) DOM.storyModalAvatar.src = story.avatar;
    if (DOM.storyModalCreator) DOM.storyModalCreator.textContent = story.creator;
    if (DOM.storyModalCaption) DOM.storyModalCaption.textContent = story.caption;
    if (DOM.storyModalProdName) DOM.storyModalProdName.textContent = story.productName;
    if (DOM.storyModalProdPrice) DOM.storyModalProdPrice.textContent = story.productPrice;

    if (DOM.storyVideoPlayer) {
      DOM.storyVideoPlayer.src = story.videoUrl;
      DOM.storyVideoPlayer.play().catch(() => {});
    }

    DOM.storyModal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeAllModals() {
    if (DOM.cartDrawer) DOM.cartDrawer.classList.remove('is-open');
    if (DOM.wishlistDrawer) DOM.wishlistDrawer.classList.remove('is-open');
    if (DOM.mobileNavDrawer) DOM.mobileNavDrawer.classList.remove('is-open');
    if (DOM.searchModal) DOM.searchModal.classList.remove('is-open');
    if (DOM.quickViewModal) DOM.quickViewModal.classList.remove('is-open');
    if (DOM.storyModal) {
      DOM.storyModal.classList.remove('is-open');
      if (DOM.storyVideoPlayer) {
        DOM.storyVideoPlayer.pause();
        DOM.storyVideoPlayer.src = '';
      }
    }
    if (DOM.backdrop) DOM.backdrop.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function renderSearchModalResults(query) {
    if (!DOM.searchResultsGrid) return;
    const all = PRODUCTS_DATA.shopAllWomen || [];
    let matches = all;

    if (query.trim() !== '') {
      const q = query.toLowerCase().trim();
      matches = all.filter(p => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    } else {
      matches = all.slice(0, 6);
    }

    if (matches.length === 0) {
      DOM.searchResultsGrid.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #6b7280;">
          No styles found for "${query}"
        </div>
      `;
      return;
    }

    DOM.searchResultsGrid.innerHTML = matches.slice(0, 8).map(p => `
      <div class="search-result-item btn-open-quickview" data-product-id="${p.id}" style="cursor: pointer;">
        <img src="${p.images ? p.images[0] : ''}" alt="${p.title}" class="search-result-thumb" />
        <div>
          <h5 class="search-result-title">${p.title}</h5>
          <span class="search-result-price">${p.salePrice}</span>
        </div>
      </div>
    `).join('');
  }

  // =========================================================================
  // 7. TOAST NOTIFICATIONS
  // =========================================================================
  function showToast(message, type = 'normal') {
    if (!DOM.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast-message ${type === 'success' ? 'success' : ''}`;
    toast.textContent = message;
    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2600);
  }

  // =========================================================================
  // 8. EVENT LISTENERS
  // =========================================================================
  function initEventListeners() {
    // Header Scroll Shadow
    window.addEventListener('scroll', () => {
      const header = document.getElementById('site-header');
      if (header) {
        if (window.scrollY > 20) header.classList.add('is-scrolled');
        else header.classList.remove('is-scrolled');
      }
    });

    // Backdrop & Close
    if (DOM.backdrop) DOM.backdrop.addEventListener('click', closeAllModals);
    if (DOM.cartCloseBtn) DOM.cartCloseBtn.addEventListener('click', closeAllModals);
    if (DOM.wishlistCloseBtn) DOM.wishlistCloseBtn.addEventListener('click', closeAllModals);
    if (DOM.mobileNavCloseBtn) DOM.mobileNavCloseBtn.addEventListener('click', closeAllModals);
    if (DOM.searchModalCloseBtn) DOM.searchModalCloseBtn.addEventListener('click', closeAllModals);
    if (DOM.quickViewCloseBtn) DOM.quickViewCloseBtn.addEventListener('click', closeAllModals);
    if (DOM.storyModalCloseBtn) DOM.storyModalCloseBtn.addEventListener('click', closeAllModals);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAllModals();
    });

    // Drawers Open Triggers
    DOM.cartTriggers.forEach(btn => btn.addEventListener('click', (e) => {
      e.preventDefault();
      openCartDrawer();
    }));

    DOM.wishlistTriggers.forEach(btn => btn.addEventListener('click', (e) => {
      e.preventDefault();
      openWishlistDrawer();
    }));

    DOM.searchTriggers.forEach(btn => btn.addEventListener('click', (e) => {
      e.preventDefault();
      openSearchModal();
    }));

    if (DOM.hamburgerBtn) DOM.hamburgerBtn.addEventListener('click', openMobileNav);

    // Coupon Click to Copy
    DOM.couponCopyTriggers.forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.getAttribute('data-code');
        if (code) {
          navigator.clipboard.writeText(code).catch(() => {});
          STATE.appliedCoupon = code;
          saveCart();
          showToast(`Coupon "${code}" applied to Bag! 🎉`, 'success');
        }
      });
    });

    // Apply Coupon Input
    if (DOM.btnApplyPromo) {
      DOM.btnApplyPromo.addEventListener('click', () => {
        const code = (DOM.promoInput.value || '').trim().toUpperCase();
        if (COUPONS[code]) {
          STATE.appliedCoupon = code;
          saveCart();
          showToast(`Coupon "${code}" applied! 🎉`, 'success');
        } else {
          showToast('Invalid promo code. Try EXTRA15 or EXTRA10');
        }
      });
    }

    // Category Nav Pills (Top Sub-Nav)
    DOM.navPillBtns.forEach(pill => {
      pill.addEventListener('click', () => {
        DOM.navPillBtns.forEach(p => p.classList.remove('is-active'));
        pill.classList.add('is-active');
        const cat = pill.getAttribute('data-cat');
        showToast(`Filtered for ${pill.textContent} 🔥`, 'success');
        const shopSection = document.getElementById('shop-all');
        if (shopSection) shopSection.scrollIntoView({ behavior: 'smooth' });
      });
    });

    // Gender Switcher in Hero
    if (DOM.btnToggleHer && DOM.btnToggleHim) {
      DOM.btnToggleHer.addEventListener('click', () => {
        DOM.btnToggleHer.classList.add('is-selected');
        DOM.btnToggleHim.classList.remove('is-selected');
        showToast('Browsing styles For Her ✨', 'success');
      });
      DOM.btnToggleHim.addEventListener('click', () => {
        DOM.btnToggleHim.classList.add('is-selected');
        DOM.btnToggleHer.classList.remove('is-selected');
        showToast('Browsing styles For Him ⚡', 'success');
      });
    }

    // Category Filter Pills (Catalog Section)
    DOM.filterBtns.forEach(pill => {
      pill.addEventListener('click', () => {
        DOM.filterBtns.forEach(p => p.classList.remove('is-active'));
        pill.classList.add('is-active');
        STATE.activeCategory = pill.getAttribute('data-category');
        STATE.visibleProductsCount = 12;
        renderShopAllSection();
      });
    });

    // Sort Select
    if (DOM.sortSelect) {
      DOM.sortSelect.addEventListener('change', (e) => {
        STATE.sortBy = e.target.value;
        renderShopAllSection();
      });
    }

    // Search Input in Modal
    if (DOM.searchModalInput) {
      DOM.searchModalInput.addEventListener('input', (e) => {
        renderSearchModalResults(e.target.value);
      });
    }

    // Load More
    if (DOM.btnLoadMore) {
      DOM.btnLoadMore.addEventListener('click', () => {
        STATE.visibleProductsCount += 8;
        renderShopAllSection();
      });
    }

    // SEO Toggle
    if (DOM.seoToggleBtn && DOM.seoExtraText) {
      DOM.seoToggleBtn.addEventListener('click', () => {
        DOM.seoExtraText.classList.toggle('is-open');
        DOM.seoToggleBtn.textContent = DOM.seoExtraText.classList.contains('is-open') ? 'Read Less' : 'Read More';
      });
    }

    // Newsletter Submit
    if (DOM.newsletterForm) {
      DOM.newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = DOM.newsletterEmail.value;
        if (email) {
          showToast(`Subscribed! Welcome to the Drop List 🎉`, 'success');
          DOM.newsletterEmail.value = '';
        }
      });
    }

    // Checkout Simulation
    if (DOM.btnCheckout) {
      DOM.btnCheckout.addEventListener('click', () => {
        if (STATE.cart.length === 0) {
          showToast('Your bag is empty!');
          return;
        }
        showToast('Redirecting to Secure Checkout...', 'success');
      });
    }

    // Support Chat Bubble
    if (DOM.chatBubble) {
      DOM.chatBubble.addEventListener('click', () => {
        showToast('Support agent Priya is online! How can we help you?', 'success');
      });
    }

    // Account Button
    if (DOM.btnAccount) {
      DOM.btnAccount.addEventListener('click', () => {
        showToast('Welcome back! Logged in as VIP Member ✨');
      });
    }

    // Delegated Global Click Handlers
    document.addEventListener('click', (e) => {
      // 1. Quick size chip on card
      const sizeChip = e.target.closest('.quick-size-chip');
      if (sizeChip) {
        e.preventDefault();
        e.stopPropagation();
        const pId = sizeChip.getAttribute('data-product-id');
        const size = sizeChip.getAttribute('data-size');
        const product = findProductById(pId);
        if (product) addToCart(product, size, 1);
        return;
      }

      // 2. Wishlist heart button on card
      const wishlistBtn = e.target.closest('.card-wishlist-btn');
      if (wishlistBtn) {
        e.preventDefault();
        e.stopPropagation();
        const pId = wishlistBtn.getAttribute('data-product-id');
        const product = findProductById(pId);
        if (product) toggleWishlist(product);
        return;
      }

      // 3. Quick View trigger
      const quickViewBtn = e.target.closest('.btn-open-quickview');
      if (quickViewBtn) {
        e.preventDefault();
        const pId = quickViewBtn.getAttribute('data-product-id');
        const product = findProductById(pId);
        if (product) openQuickViewModal(product);
        return;
      }

      // 4. Story card trigger
      const storyBtn = e.target.closest('.btn-open-story');
      if (storyBtn) {
        e.preventDefault();
        const sId = storyBtn.getAttribute('data-story-id');
        const story = (PRODUCTS_DATA.fashionStories || []).find(s => s.id === sId);
        if (story) openStoryModal(story);
        return;
      }

      // 5. Cart Quantity Plus
      const cartPlus = e.target.closest('.btn-cart-plus');
      if (cartPlus) {
        const cId = cartPlus.getAttribute('data-cart-id');
        updateCartItemQuantity(cId, 1);
        return;
      }

      // 6. Cart Quantity Minus
      const cartMinus = e.target.closest('.btn-cart-minus');
      if (cartMinus) {
        const cId = cartMinus.getAttribute('data-cart-id');
        updateCartItemQuantity(cId, -1);
        return;
      }

      // 7. Cart Remove Button
      const cartRemove = e.target.closest('.btn-cart-remove');
      if (cartRemove) {
        const cId = cartRemove.getAttribute('data-cart-id');
        removeCartItem(cId);
        return;
      }

      // 8. Wishlist Move to Bag
      const wlMove = e.target.closest('.btn-wishlist-move-to-cart');
      if (wlMove) {
        const pId = wlMove.getAttribute('data-product-id');
        const product = findProductById(pId);
        if (product) {
          addToCart(product, 'M', 1);
          STATE.wishlist = STATE.wishlist.filter(i => i.id !== pId);
          saveWishlist();
        }
        return;
      }

      // 9. Wishlist Remove
      const wlRemove = e.target.closest('.btn-wishlist-remove');
      if (wlRemove) {
        const pId = wlRemove.getAttribute('data-product-id');
        STATE.wishlist = STATE.wishlist.filter(i => i.id !== pId);
        saveWishlist();
        showToast('Removed from Wishlist');
        return;
      }

      // 10. Quick view thumbnail select
      const modalThumb = e.target.closest('.modal-thumb');
      if (modalThumb && STATE.selectedQuickViewProduct) {
        document.querySelectorAll('.modal-thumb').forEach(t => t.classList.remove('is-active'));
        modalThumb.classList.add('is-active');
        const idx = parseInt(modalThumb.getAttribute('data-index') || '0', 10);
        if (DOM.quickViewImg && STATE.selectedQuickViewProduct.images) {
          DOM.quickViewImg.src = STATE.selectedQuickViewProduct.images[idx] || '';
        }
        return;
      }

      // 11. Quick view size button select
      const modalSizeBtn = e.target.closest('.modal-size-btn');
      if (modalSizeBtn) {
        document.querySelectorAll('.modal-size-btn').forEach(b => b.classList.remove('is-selected'));
        modalSizeBtn.classList.add('is-selected');
        STATE.selectedQuickViewSize = modalSizeBtn.getAttribute('data-size');
        return;
      }

      // 12. Quick view Add to Bag button
      if (e.target === DOM.quickViewAddToCartBtn && STATE.selectedQuickViewProduct) {
        addToCart(STATE.selectedQuickViewProduct, STATE.selectedQuickViewSize || 'M', 1);
        closeAllModals();
        return;
      }

      // 13. Story Modal "Shop Look"
      if (e.target === DOM.btnStoryBuy) {
        const firstProd = PRODUCTS_DATA.hotDrops ? PRODUCTS_DATA.hotDrops[0] : null;
        if (firstProd) {
          addToCart(firstProd, 'M', 1);
          closeAllModals();
        }
        return;
      }

      // 14. Continue shopping in cart empty state
      if (e.target.getAttribute('data-dismiss-cart')) {
        closeAllModals();
        return;
      }
    });
  }

  // =========================================================================
  // 15. KWIKPASS LOGIN MODAL & USER SESSION MANAGEMENT
  // =========================================================================

  function getUserSession() {
    try {
      const localUser = localStorage.getItem('showoff_user');
      const sessionActive = sessionStorage.getItem('showoff_session_active');
      if (localUser && sessionActive === 'true') {
        return JSON.parse(localUser);
      }
      if (localUser) {
        sessionStorage.setItem('showoff_session_active', 'true');
        return JSON.parse(localUser);
      }
    } catch (e) {
      console.error('Error reading user session:', e);
    }
    return null;
  }

  function renderKwikpassModalDom() {
    if (document.getElementById('kwikpass-modal-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'kwikpass-modal-overlay';
    overlay.className = 'kwikpass-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    overlay.innerHTML = `
      <div class="kwikpass-modal-card">
        <button type="button" class="kwikpass-close-btn" id="kwikpass-close-btn" aria-label="Close modal">✕</button>
        
        <!-- Left Brand Panel -->
        <div class="kwikpass-left-panel">
          <div class="kwikpass-header-brand">
            <span class="kwikpass-brand-title">SHOWOFFFF</span>
            <span class="kwikpass-powered-badge">Powered by <strong style="color:#ffffff;">Kwik</strong><span class="kp-bolt">⚡</span><strong style="color:#ffffff;">Pass</strong></span>
          </div>
          
          <h2 class="kwikpass-headline">Get FLAT 10% OFF on your first order.</h2>
          
          <div class="kwikpass-features-grid">
            <div class="kwikpass-feature-card">
              <span class="kwikpass-feature-icon">🌟</span>
              <span class="kwikpass-feature-title">Customer-first</span>
              <span class="kwikpass-feature-desc">Putting you in the center</span>
            </div>
            <div class="kwikpass-feature-card">
              <span class="kwikpass-feature-icon">🌟</span>
              <span class="kwikpass-feature-title">Transparent</span>
              <span class="kwikpass-feature-desc">Honest from the inside out</span>
            </div>
            <div class="kwikpass-feature-card">
              <span class="kwikpass-feature-icon">🌟</span>
              <span class="kwikpass-feature-title">Innovative</span>
              <span class="kwikpass-feature-desc">Getting the absolute best for you</span>
            </div>
          </div>
        </div>
        
        <!-- Right Form Card -->
        <div class="kwikpass-right-card">
          <!-- Step 1: Mobile Phone -->
          <div id="kp-step-phone" class="kwikpass-form-step">
            <div class="kwikpass-input-group">
              <div class="kwikpass-country-code">
                <span>🇮🇳</span>
                <span>+91</span>
              </div>
              <input type="tel" id="kp-mobile-input" class="kwikpass-mobile-input" placeholder="Enter Mobile Number" maxlength="10" inputmode="numeric" />
            </div>
            
            <label class="kwikpass-checkbox-row">
              <input type="checkbox" id="kp-notify-checkbox" checked />
              <span>Notify me with offers &amp; updates</span>
            </label>
            
            <button type="button" id="kp-btn-submit" class="kwikpass-submit-btn">Submit</button>
            
            <p class="kwikpass-disclaimer">
              I accept that I have read &amp; understood your <a href="shipping-policy.html">Privacy Policy</a> and <a href="shipping-policy.html">T&amp;Cs</a>.
            </p>
          </div>
          
          <!-- Step 2: OTP Verification -->
          <div id="kp-step-otp" class="kwikpass-form-step" style="display: none;">
            <div class="kwikpass-otp-header">
              <h4>Enter Verification Code</h4>
              <p id="kp-otp-subtext">OTP sent to +91 </p>
            </div>
            
            <div class="kwikpass-otp-inputs">
              <input type="text" maxlength="1" class="kwikpass-otp-digit" value="1" />
              <input type="text" maxlength="1" class="kwikpass-otp-digit" value="2" />
              <input type="text" maxlength="1" class="kwikpass-otp-digit" value="3" />
              <input type="text" maxlength="1" class="kwikpass-otp-digit" value="4" />
            </div>
            
            <button type="button" id="kp-btn-verify-otp" class="kwikpass-submit-btn">Verify &amp; Login</button>
            
            <button type="button" id="kp-btn-back-phone" style="background:none; border:none; color:#034ba9; font-size:12px; font-weight:700; cursor:pointer; text-decoration:underline;">Change Mobile Number</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Event listeners inside modal
    const closeBtn = overlay.querySelector('#kwikpass-close-btn');
    const submitBtn = overlay.querySelector('#kp-btn-submit');
    const verifyBtn = overlay.querySelector('#kp-btn-verify-otp');
    const backBtn = overlay.querySelector('#kp-btn-back-phone');
    const phoneInput = overlay.querySelector('#kp-mobile-input');

    if (closeBtn) closeBtn.addEventListener('click', closeKwikpassModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeKwikpassModal();
    });

    if (phoneInput) {
      phoneInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handlePhoneSubmit();
      });
    }

    if (submitBtn) submitBtn.addEventListener('click', handlePhoneSubmit);
    if (verifyBtn) verifyBtn.addEventListener('click', handleOtpVerify);
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        document.getElementById('kp-step-otp').style.display = 'none';
        document.getElementById('kp-step-phone').style.display = 'flex';
        document.getElementById('kp-mobile-input').focus();
      });
    }

    // Auto-advance OTP digits
    const digits = overlay.querySelectorAll('.kwikpass-otp-digit');
    digits.forEach((d, idx) => {
      d.addEventListener('input', () => {
        if (d.value.length === 1 && idx < digits.length - 1) {
          digits[idx + 1].focus();
        }
      });
      d.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && d.value === '' && idx > 0) {
          digits[idx - 1].focus();
        } else if (e.key === 'Enter') {
          handleOtpVerify();
        }
      });
    });
  }

  let tempLoginPhone = '';

  function handlePhoneSubmit() {
    const input = document.getElementById('kp-mobile-input');
    if (!input) return;
    const val = input.value.trim().replace(/[^0-9]/g, '');

    if (val.length < 10) {
      showToast('Please enter a valid 10-digit mobile number');
      input.focus();
      return;
    }

    tempLoginPhone = val;
    const subtext = document.getElementById('kp-otp-subtext');
    if (subtext) subtext.textContent = `OTP sent to +91 ${val.slice(0, 5)} ${val.slice(5)}`;

    document.getElementById('kp-step-phone').style.display = 'none';
    document.getElementById('kp-step-otp').style.display = 'flex';

    const firstDigit = document.querySelector('.kwikpass-otp-digit');
    if (firstDigit) firstDigit.focus();
  }

  function handleOtpVerify() {
    const phone = tempLoginPhone || '9876543210';
    const user = {
      phone: `+91 ${phone}`,
      phoneRaw: phone,
      name: `Customer (${phone.slice(-4)})`,
      isLoggedIn: true,
      loggedInAt: new Date().toISOString()
    };

    localStorage.setItem('showoff_user', JSON.stringify(user));
    sessionStorage.setItem('showoff_session_active', 'true');

    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'login',
        user: {
          phone: user.phone,
          isLoggedIn: true
        },
        MCP: {
          user: {
            id: user.phone,
            attributes: {
              phone: user.phone,
              isLoggedIn: true
            }
          }
        }
      });
    }

    closeKwikpassModal();
    updateUserSessionUI();
    showToast(`Welcome! Logged in as +91 ${phone} 🎉`);
  }

  function openKwikpassModal() {
    renderKwikpassModalDom();
    const overlay = document.getElementById('kwikpass-modal-overlay');
    if (!overlay) return;

    // Reset view to Step 1
    const stepPhone = document.getElementById('kp-step-phone');
    const stepOtp = document.getElementById('kp-step-otp');
    if (stepPhone) stepPhone.style.display = 'flex';
    if (stepOtp) stepOtp.style.display = 'none';

    const phoneInput = document.getElementById('kp-mobile-input');
    if (phoneInput) {
      phoneInput.value = '';
      setTimeout(() => phoneInput.focus(), 100);
    }

    overlay.classList.add('is-open');
  }

  function closeKwikpassModal() {
    const overlay = document.getElementById('kwikpass-modal-overlay');
    if (overlay) overlay.classList.remove('is-open');
  }

  function logoutUser() {
    localStorage.removeItem('showoff_user');
    sessionStorage.removeItem('showoff_session_active');

    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'logout',
        user: {
          isLoggedIn: false
        },
        MCP: {
          user: {
            id: 'anonymous',
            attributes: {
              isLoggedIn: false
            }
          }
        }
      });
    }

    updateUserSessionUI();
    showToast('Logged out successfully.');
  }

  function updateUserSessionUI() {
    const user = getUserSession();
    const accountBtns = document.querySelectorAll('#btn-account, .user-btn');

    accountBtns.forEach(btn => {
      // Don't modify the search button which might also have user-btn class
      if (btn.classList.contains('search-open-trigger')) return;

      let parentWrap = btn.parentElement;
      if (!parentWrap || !parentWrap.classList.contains('user-account-wrapper')) {
        const wrap = document.createElement('div');
        wrap.className = 'user-account-wrapper';
        if (btn.parentNode) {
          btn.parentNode.insertBefore(wrap, btn);
          wrap.appendChild(btn);
          parentWrap = wrap;
        }
      }

      // Existing dropdown check
      let dropdown = parentWrap ? parentWrap.querySelector('.user-account-dropdown') : null;

      if (user && user.isLoggedIn) {
        btn.classList.add('is-logged-in');
        btn.setAttribute('aria-label', `Account: ${user.phone}`);
        btn.innerHTML = `
          <div class="user-avatar-badge" title="${user.phone}">
            ${user.phone.slice(-2)}
          </div>
        `;

        if (!dropdown && parentWrap) {
          dropdown = document.createElement('div');
          dropdown.className = 'user-account-dropdown';
          parentWrap.appendChild(dropdown);
        }

        if (dropdown) {
          dropdown.innerHTML = `
            <div class="user-dropdown-header">
              <div class="user-dropdown-name">👋 Hi, ${user.name}</div>
              <div class="user-dropdown-phone">${user.phone}</div>
            </div>
            <a href="track-order.html" class="user-dropdown-item">
              <span>📦</span> Track My Orders
            </a>
            <a href="wishlist.html" class="user-dropdown-item">
              <span>❤️</span> My Wishlist
            </a>
            <a href="cart.html" class="user-dropdown-item">
              <span>🛍️</span> My Bag
            </a>
            <div class="user-dropdown-item is-logout" id="btn-dropdown-logout">
              <span>🚪</span> Logout
            </div>
          `;

          const logoutBtn = dropdown.querySelector('#btn-dropdown-logout');
          if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              dropdown.classList.remove('is-open');
              logoutUser();
            });
          }
        }

      } else {
        btn.classList.remove('is-logged-in');
        btn.setAttribute('aria-label', 'Login or Sign Up');
        btn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        `;
        if (dropdown) dropdown.remove();
      }
    });
  }

  function initUserSession() {
    renderKwikpassModalDom();
    updateUserSessionUI();

    // Toggle dropdown on click when logged in, or open modal when logged out
    document.addEventListener('click', (e) => {
      const accountBtn = e.target.closest('#btn-account, .user-btn:not(.search-open-trigger)');
      const user = getUserSession();

      if (accountBtn) {
        e.preventDefault();
        e.stopPropagation();

        if (user && user.isLoggedIn) {
          const wrap = accountBtn.closest('.user-account-wrapper');
          const dropdown = wrap ? wrap.querySelector('.user-account-dropdown') : null;
          if (dropdown) {
            dropdown.classList.toggle('is-open');
          }
        } else {
          openKwikpassModal();
        }
        return;
      }

      // Close dropdown when clicking outside
      if (!e.target.closest('.user-account-wrapper')) {
        document.querySelectorAll('.user-account-dropdown.is-open').forEach(d => d.classList.remove('is-open'));
      }
    });
  }

  // =========================================================================
  // INITIALIZATION
  // =========================================================================
  function init() {
    initHeroSlider();
    initCountdownTimer();
    renderHomepageSections();
    updateCartUI();
    updateWishlistUI();
    initUserSession();
    initEventListeners();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose global methods for external triggers
  window.showoffAuth = {
    openLoginModal: openKwikpassModal,
    closeLoginModal: closeKwikpassModal,
    logout: logoutUser,
    getUser: getUserSession
  };

})();
