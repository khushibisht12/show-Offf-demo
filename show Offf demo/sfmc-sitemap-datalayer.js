/**
 * SHOWOFFFF - Website DataLayer & Analytics Engine
 * 
 * Manages window.dataLayer state, ecommerce event dispatching,
 * and exposes window.showoffAnalytics for site interactions.
 */

(function () {
  "use strict";

  // Ensure window.dataLayer is initialized immediately
  window.dataLayer = window.dataLayer || [];

  // =========================================================================
  // UTILITY & CATALOG HELPERS
  // =========================================================================

  function parsePrice(value) {
    if (typeof value === "number") return value;
    if (!value) return 0;
    var cleaned = String(value).replace(/[^0-9.]/g, "");
    var num = parseFloat(cleaned);
    return Number.isFinite(num) ? num : 0;
  }

  function getFileName() {
    var path = (window.location.pathname || "").toLowerCase();
    var bits = path.split("/");
    var fileName = bits[bits.length - 1] || "";

    if (!fileName) return "index.html";

    if (fileName.indexOf(".html") === -1) {
      var routeMap = {
        index: "index.html",
        product: "product.html",
        cart: "cart.html",
        contact: "contact.html",
        wishlist: "wishlist.html",
        "track-order": "track-order.html",
        women: "women.html",
        men: "men.html",
        curve: "curve.html",
        top: "top.html",
        bestsellers: "bestsellers.html",
        about: "about.html",
        returns: "returns.html",
        faqs: "faqs.html",
        "shipping-policy": "shipping-policy.html"
      };
      return routeMap[fileName] || (fileName + ".html");
    }

    return fileName;
  }

  function getAllProducts() {
    if (!window.PRODUCTS_DATA) return [];
    if (typeof window.PRODUCTS_DATA.getAllProducts === "function") {
      return window.PRODUCTS_DATA.getAllProducts();
    }
    return []
      .concat(window.PRODUCTS_DATA.hotDrops || [])
      .concat(window.PRODUCTS_DATA.womenProducts || [])
      .concat(window.PRODUCTS_DATA.menProducts || [])
      .concat(window.PRODUCTS_DATA.curveProducts || []);
  }

  function getProductById(id) {
    if (!id) return null;
    if (window.PRODUCTS_DATA && typeof window.PRODUCTS_DATA.findProductById === "function") {
      return window.PRODUCTS_DATA.findProductById(id);
    }
    var all = getAllProducts();
    for (var i = 0; i < all.length; i++) {
      if (all[i].id === id) return all[i];
    }
    return null;
  }

  function getCurrentPdpProduct() {
    try {
      var params = new URLSearchParams(window.location.search);
      var productId = params.get("id");
      if (productId) {
        var p = getProductById(productId);
        if (p) return p;
      }
    } catch (e) {
      // URLSearchParams fallback
    }

    var defaultProd = getProductById("prod_drop_1");
    if (defaultProd) return defaultProd;

    var all = getAllProducts();
    return all.length ? all[0] : null;
  }

  function getCartFromStorage() {
    try {
      var raw = localStorage.getItem("showoff_cart") || "[]";
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }

  function getCategoryFromPage() {
    var fileName = getFileName();
    var map = {
      "women.html": "Women",
      "men.html": "Men",
      "curve.html": "Curve",
      "top.html": "Top",
      "bestsellers.html": "Bestseller"
    };
    return map[fileName] || (document.body ? document.body.getAttribute("data-page-gender") : null);
  }

  function getCategoryDisplayName(category) {
    var names = {
      Women: "For Her",
      Men: "For Him",
      Curve: "Curve",
      Top: "Top Picks",
      Bestseller: "Best Seller"
    };
    return names[category] || category || "Category";
  }

  function detectPageTypeFromDom(fileName) {
    if (fileName === "index.html" || fileName === "") return "Home";
    if (fileName === "product.html") return "Product";
    if (fileName === "cart.html") return "Cart";
    if (fileName === "contact.html") return "Contact";
    if (fileName === "wishlist.html") return "Wishlist";
    if (fileName === "track-order.html") return "TrackOrder";
    if (fileName === "about.html" || fileName === "returns.html" || fileName === "shipping-policy.html" || fileName === "faqs.html") return "Content";
    if (getCategoryFromPage()) return "Category";

    if (typeof document !== "undefined") {
      if (document.getElementById("pdp-title") || document.getElementById("btn-pdp-add-bag")) return "Product";
      if (document.getElementById("full-cart-items") || document.getElementById("btn-place-order")) return "Cart";
      if (document.getElementById("contact-form")) return "Contact";
      if (document.getElementById("page-wishlist-grid")) return "Wishlist";
      if (document.getElementById("track-form")) return "TrackOrder";
      if (document.getElementById("shop-all-grid") || document.querySelector(".catalog-section")) return "Category";
      if (document.getElementById("hero-slider-viewport") || document.getElementById("hot-drops-grid")) return "Home";
    }

    return "Default";
  }

  function toMcpItemFromCartItem(cartItem) {
    var product = getProductById(cartItem.productId || cartItem.id);
    var pId = cartItem.productId || cartItem.id || "";
    var title = cartItem.title || (product && product.title) || "";
    var price = parsePrice(cartItem.priceNum || (product && (product.saleNum || product.salePrice)) || 0);
    var image = cartItem.image || (product && product.images && product.images[0]) || "";
    var origin = (typeof window !== "undefined" && window.location.origin) ? window.location.origin : "";

    return {
      item_id: pId,
      item_name: title,
      item_sku: pId,
      quantity: parseInt(cartItem.quantity, 10) || 1,
      price: price,
      size: cartItem.size || "M",
      color: (product && product.colors ? product.colors[0] : ""),
      imageUrl: image,
      url: pId ? (origin + "/product.html?id=" + pId) : "",
      category: (product && product.category) || ""
    };
  }

  function formatEcommerceItems(items) {
    return items.map(function (item, index) {
      return {
        item_id: item.item_id || item.id || "",
        item_name: item.item_name || item.title || item.name || "",
        item_category: item.category || "",
        item_variant: item.size || "",
        price: parsePrice(item.price || item.priceNum || item.saleNum || 0),
        quantity: parseInt(item.quantity, 10) || 1,
        index: index + 1
      };
    });
  }

  function getUserFromStorage() {
    try {
      var raw = localStorage.getItem("showoff_user");
      if (raw) {
        var u = JSON.parse(raw);
        if (u && u.isLoggedIn) {
          return {
            id: u.phone,
            attributes: {
              phone: u.phone,
              name: u.name,
              isLoggedIn: true
            }
          };
        }
      }
    } catch (e) {}
    return {
      id: "anonymous",
      attributes: {
        isLoggedIn: false
      }
    };
  }

  // =========================================================================
  // BASE MCP STATE BUILDER
  // =========================================================================

  function buildBaseMcp() {
    var fileName = getFileName();
    var cart = getCartFromStorage();
    var detectedPageType = detectPageTypeFromDom(fileName);
    var origin = (typeof window !== "undefined" && window.location.origin) ? window.location.origin : "";
    var href = (typeof window !== "undefined" && window.location.href) ? window.location.href : "";

    var mcp = {
      currency: "INR",
      items: cart.map(toMcpItemFromCartItem),
      pageName: detectedPageType,
      pageType: detectedPageType,
      user: getUserFromStorage()
    };

    if (detectedPageType === "Home") {
      mcp.pageName = "Home";
      mcp.pageType = "Home";
      return mcp;
    }

    if (detectedPageType === "Product") {
      var product = getCurrentPdpProduct();
      if (product && product.id) {
        var price = parsePrice(product.saleNum || product.salePrice);
        var imgUrl = (product.images && product.images[0]) ? product.images[0] : "";
        if (imgUrl && imgUrl.indexOf("http") !== 0 && origin) {
          imgUrl = origin + (imgUrl.charAt(0) === "/" ? "" : "/") + imgUrl;
        }

        mcp.pageName = "Product";
        mcp.pageType = "Product";
        mcp.Item = {
          id: product.id,
          sku: product.id,
          name: product.title,
          description: product.description || "",
          imageUrl: imgUrl,
          url: href,
          price: price,
          availability: "in_stock",
          category: product.category || "",
          color: product.colors || [],
          size: product.sizes || []
        };
      }
      return mcp;
    }

    if (detectedPageType === "Category") {
      var category = getCategoryFromPage() || "Category";
      mcp.pageName = "Category";
      mcp.pageType = "Category";
      mcp.itemListId = category;
      mcp.itemListName = getCategoryDisplayName(category);
      return mcp;
    }

    if (detectedPageType === "Cart") {
      mcp.pageName = "Cart";
      mcp.pageType = "Cart";
      return mcp;
    }

    if (detectedPageType === "Wishlist") {
      mcp.pageName = "Wishlist";
      mcp.pageType = "Wishlist";
      return mcp;
    }

    if (detectedPageType === "Contact") {
      mcp.pageName = "Contact";
      mcp.pageType = "Contact";
      return mcp;
    }

    if (detectedPageType === "TrackOrder") {
      mcp.pageName = "TrackOrder";
      mcp.pageType = "TrackOrder";
      return mcp;
    }

    if (detectedPageType === "Content") {
      var nameMap = {
        "about.html": "AboutUs",
        "returns.html": "ReturnsPolicy",
        "shipping-policy.html": "ShippingPolicy",
        "faqs.html": "FAQs"
      };
      mcp.pageName = nameMap[fileName] || "Content";
      mcp.pageType = "Content";
      return mcp;
    }

    mcp.pageName = "Default";
    mcp.pageType = "Default";
    return mcp;
  }

  // =========================================================================
  // DATALAYER QUERY HELPERS
  // =========================================================================

  function getDataLayerValue(path) {
    if (!Array.isArray(window.dataLayer)) return null;

    for (var i = window.dataLayer.length - 1; i >= 0; i--) {
      var obj = window.dataLayer[i];
      if (!obj || typeof obj !== "object") continue;

      var current = obj;
      var found = true;

      for (var j = 0; j < path.length; j++) {
        if (current && current[path[j]] !== undefined) {
          current = current[path[j]];
        } else {
          found = false;
          break;
        }
      }

      if (found && current !== null && current !== undefined) {
        return current;
      }
    }

    return null;
  }

  function waitForDataLayerValue(path, timeout, interval) {
    var maxTimeout = timeout || 3000;
    var pollInterval = interval || 80;

    return new Promise(function (resolve) {
      var start = Date.now();

      function check() {
        var value = getDataLayerValue(path);
        if (value !== null && value !== undefined) {
          resolve(value);
          return;
        }

        if (Date.now() - start >= maxTimeout) {
          resolve(null);
          return;
        }

        setTimeout(check, pollInterval);
      }

      check();
    });
  }

  // =========================================================================
  // EVENT TRACKING METHODS
  // =========================================================================

  function pushMcpState(eventName, extraMcp, extraEcommerce) {
    var baseMcp = buildBaseMcp();
    var mergedMcp = Object.assign({}, baseMcp, extraMcp || {});

    var payload = {
      event: eventName || "mcp_state",
      MCP: mergedMcp
    };

    if (extraEcommerce) {
      payload.ecommerce = extraEcommerce;
    }

    window.dataLayer.push(payload);
    return mergedMcp;
  }

  function syncCartFromStorage() {
    var cart = getCartFromStorage();
    var mcpItems = cart.map(toMcpItemFromCartItem);
    var subtotal = cart.reduce(function (sum, item) {
      return sum + (parsePrice(item.priceNum || item.price || 0) * (parseInt(item.quantity, 10) || 1));
    }, 0);

    pushMcpState("cart_sync", {
      items: mcpItems
    }, {
      currency: "INR",
      value: subtotal,
      items: formatEcommerceItems(mcpItems)
    });
  }

  function trackAddToCart(product, quantity, size) {
    if (!product || !product.id) return;

    var qty = parseInt(quantity, 10) || 1;
    var selectedSize = size || "M";
    var price = parsePrice(product.saleNum || product.price || product.salePrice || product.priceNum);
    var origin = (typeof window !== "undefined" && window.location.origin) ? window.location.origin : "";

    var lineItem = {
      item_id: product.id,
      item_name: product.title || product.name || "",
      item_sku: product.id,
      quantity: qty,
      price: price,
      size: selectedSize,
      color: (product.colors && product.colors[0]) || "",
      imageUrl: (product.images && product.images[0]) || product.image || "",
      url: origin + "/product.html?id=" + product.id,
      category: product.category || ""
    };

    var currentCart = getCartFromStorage().map(toMcpItemFromCartItem);

    pushMcpState("add_to_cart", {
      items: currentCart,
      addToCartItem: lineItem
    }, {
      currency: "INR",
      value: price * qty,
      items: [{
        item_id: lineItem.item_id,
        item_name: lineItem.item_name,
        item_category: lineItem.category,
        item_variant: lineItem.size,
        price: lineItem.price,
        quantity: lineItem.quantity
      }]
    });
  }

  function trackRemoveFromCart(product, quantity, size) {
    if (!product) return;

    var pId = product.productId || product.id || "";
    var qty = parseInt(quantity || product.quantity, 10) || 1;
    var selectedSize = size || product.size || "M";
    var price = parsePrice(product.priceNum || product.saleNum || product.price || 0);

    var currentCart = getCartFromStorage().map(toMcpItemFromCartItem);

    pushMcpState("remove_from_cart", {
      items: currentCart,
      removeFromCartItem: {
        item_id: pId,
        item_name: product.title || product.name || "",
        quantity: qty,
        price: price,
        size: selectedSize
      }
    }, {
      currency: "INR",
      value: price * qty,
      items: [{
        item_id: pId,
        item_name: product.title || product.name || "",
        item_variant: selectedSize,
        price: price,
        quantity: qty
      }]
    });
  }

  function trackViewItem(product) {
    if (!product || !product.id) return;

    var price = parsePrice(product.saleNum || product.price || product.salePrice);
    pushMcpState("view_item", null, {
      currency: "INR",
      value: price,
      items: [{
        item_id: product.id,
        item_name: product.title || product.name || "",
        item_category: product.category || "",
        price: price
      }]
    });
  }

  function trackViewItemList(category, items) {
    var formattedItems = (items || []).slice(0, 12).map(function (item, index) {
      return {
        item_id: item.id || "",
        item_name: item.title || item.name || "",
        item_category: item.category || category || "",
        price: parsePrice(item.saleNum || item.price || item.salePrice),
        index: index + 1
      };
    });

    pushMcpState("view_item_list", {
      itemListId: category || "Category",
      itemListName: getCategoryDisplayName(category || "Category")
    }, {
      item_list_id: category || "Category",
      item_list_name: getCategoryDisplayName(category || "Category"),
      items: formattedItems
    });
  }

  function trackAddToWishlist(product) {
    if (!product || !product.id) return;
    var price = parsePrice(product.saleNum || product.price || product.salePrice);

    pushMcpState("add_to_wishlist", {
      wishlistItem: {
        item_id: product.id,
        item_name: product.title || "",
        price: price
      }
    }, {
      currency: "INR",
      value: price,
      items: [{
        item_id: product.id,
        item_name: product.title || "",
        price: price
      }]
    });
  }

  function trackRemoveFromWishlist(product) {
    if (!product || !product.id) return;
    var price = parsePrice(product.saleNum || product.price || product.salePrice);

    pushMcpState("remove_from_wishlist", {
      wishlistItem: {
        item_id: product.id,
        item_name: product.title || "",
        price: price
      }
    }, {
      currency: "INR",
      value: price,
      items: [{
        item_id: product.id,
        item_name: product.title || "",
        price: price
      }]
    });
  }

  function trackCheckoutStarted(details) {
    var cart = getCartFromStorage();
    var mcpItems = cart.map(toMcpItemFromCartItem);
    var subtotal = cart.reduce(function (sum, item) {
      return sum + (parsePrice(item.priceNum || item.price || 0) * (parseInt(item.quantity, 10) || 1));
    }, 0);

    pushMcpState("begin_checkout", {
      checkout: {
        firstName: (details && details.firstName) || "",
        phone: (details && details.phone) || "",
        addressLine1: (details && details.addressLine1) || "",
        city: (details && details.city) || "",
        stateProvince: (details && details.stateProvince) || "",
        postalCode: (details && details.postalCode) || ""
      }
    }, {
      currency: "INR",
      value: subtotal,
      items: formatEcommerceItems(mcpItems)
    });
  }

  function trackPurchase(orderId, orderDetails, cartItems) {
    var items = (cartItems && cartItems.length) ? cartItems : getCartFromStorage();
    var mcpItems = items.map(toMcpItemFromCartItem);
    var total = items.reduce(function (sum, item) {
      return sum + (parsePrice(item.priceNum || item.price || 0) * (parseInt(item.quantity, 10) || 1));
    }, 0);

    pushMcpState("purchase", {
      orderId: orderId,
      order: {
        id: orderId,
        total: total,
        currency: "INR",
        items: mcpItems,
        customer: orderDetails || {}
      }
    }, {
      transaction_id: orderId,
      value: total,
      currency: "INR",
      shipping: 0,
      items: formatEcommerceItems(mcpItems)
    });
  }

  function trackContactSubmit(details) {
    pushMcpState("contact_submit", {
      contact: {
        fullName: (details && details.fullName) || "",
        email: (details && details.email) || "",
        phone: (details && details.phone) || "",
        subject: (details && details.subject) || ""
      }
    });
  }

  function trackOrderSearch(orderId) {
    pushMcpState("track_order_search", {
      searchTerm: orderId || ""
    });
  }

  function trackUserLogin(user) {
    var phone = (user && user.phone) || "";
    pushMcpState("login", {
      user: {
        id: phone,
        attributes: {
          phone: phone,
          isLoggedIn: true
        }
      }
    });
  }

  function trackUserLogout() {
    pushMcpState("logout", {
      user: {
        id: "anonymous",
        attributes: {
          isLoggedIn: false
        }
      }
    });
  }

  // =========================================================================
  // PUBLIC API EXPOSURE
  // =========================================================================

  window.showoffAnalytics = {
    pushMcpState: pushMcpState,
    syncCartFromStorage: syncCartFromStorage,
    trackAddToCart: trackAddToCart,
    trackRemoveFromCart: trackRemoveFromCart,
    trackViewItem: trackViewItem,
    trackViewItemList: trackViewItemList,
    trackAddToWishlist: trackAddToWishlist,
    trackRemoveFromWishlist: trackRemoveFromWishlist,
    trackCheckoutStarted: trackCheckoutStarted,
    trackPurchase: trackPurchase,
    trackContactSubmit: trackContactSubmit,
    trackOrderSearch: trackOrderSearch,
    trackUserLogin: trackUserLogin,
    trackUserLogout: trackUserLogout,
    getDataLayerValue: getDataLayerValue,
    waitForDataLayerValue: waitForDataLayerValue,
    getProductById: getProductById,
    getAllProducts: getAllProducts,
    getFileName: getFileName,
    detectPageTypeFromDom: detectPageTypeFromDom
  };

  // =========================================================================
  // INITIAL PAGE VIEW EXECUTION (SINGLE CONSOLIDATED PUSH)
  // =========================================================================

  function initPageView() {
    var baseMcp = buildBaseMcp();
    var extraEcommerce = null;

    if (baseMcp.pageType === "Product" && baseMcp.Item) {
      extraEcommerce = {
        currency: baseMcp.currency || "INR",
        value: baseMcp.Item.price || 0,
        items: [{
          item_id: baseMcp.Item.id,
          item_name: baseMcp.Item.name,
          item_category: baseMcp.Item.category,
          price: baseMcp.Item.price
        }]
      };
    } else if (baseMcp.pageType === "Category") {
      var cat = baseMcp.itemListId;
      var catProducts = getAllProducts().filter(function (p) {
        return (p.gender === cat) || (p.category === cat);
      }).slice(0, 12);

      extraEcommerce = {
        item_list_id: cat,
        item_list_name: baseMcp.itemListName,
        items: catProducts.map(function (p, idx) {
          return {
            item_id: p.id,
            item_name: p.title,
            item_category: p.category || cat,
            price: parsePrice(p.saleNum || p.salePrice),
            index: idx + 1
          };
        })
      };
    }

    pushMcpState("page_view", null, extraEcommerce);
  }

  // Execute single consolidated push on page load
  initPageView();

  console.log("SHOWOFFFF DataLayer initialized successfully. Current state:", window.dataLayer);
})();
