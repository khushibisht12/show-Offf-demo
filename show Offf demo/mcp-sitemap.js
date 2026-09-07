// /**
//  * ============================================================================
//  * SALESFORCE MARKETING CLOUD PERSONALIZATION (MCP / EVERGAGE) SITEMAP
//  * ============================================================================
//  * 
//  * Instructions:
//  * Copy and paste the entire contents of this file into the Marketing Cloud
//  * Personalization Sitemap Editor / Web Template / Extension configuration.
//  * 
//  * This Sitemap interacts synchronously with the SHOWOFFFF window.dataLayer
//  * and falls back to DOM selectors when needed.
//  * ============================================================================
//  */

// (function () {
//   "use strict";

//   // Helper to safely read from window.dataLayer
//   function getDataLayerValue(path) {
//     if (!window.dataLayer || !Array.isArray(window.dataLayer)) return null;

//     for (var i = window.dataLayer.length - 1; i >= 0; i--) {
//       var obj = window.dataLayer[i];
//       if (!obj || typeof obj !== "object") continue;

//       var current = obj;
//       var found = true;

//       for (var j = 0; j < path.length; j++) {
//         if (current && current[path[j]] !== undefined) {
//           current = current[path[j]];
//         } else {
//           found = false;
//           break;
//         }
//       }

//       if (found && current !== null && current !== undefined) {
//         return current;
//       }
//     }

//     return null;
//   }

//   function parsePrice(value) {
//     if (typeof value === "number") return value;
//     if (!value) return 0;
//     var cleaned = String(value).replace(/[^0-9.]/g, "");
//     var num = parseFloat(cleaned);
//     return Number.isFinite(num) ? num : 0;
//   }

//   function getCartLineItems() {
//     var items = getDataLayerValue(["MCP", "items"]);
//     var currency = getDataLayerValue(["MCP", "currency"]) || "INR";

//     if (Array.isArray(items) && items.length > 0) {
//       return items.map(function (item) {
//         return {
//           catalogObjectType: "Product",
//           catalogObjectId: item.item_id || item.item_sku || item.id,
//           price: parsePrice(item.price),
//           quantity: parseInt(item.quantity, 10) || 1,
//           attributes: {
//             sku: item.item_sku || item.item_id || item.id,
//             name: item.item_name || item.title || "",
//             currency: currency
//           }
//         };
//       }).filter(function (item) {
//         return !!item.catalogObjectId;
//       });
//     }

//     // Fallback to localStorage if dataLayer cart is not yet populated
//     try {
//       var raw = localStorage.getItem("showoff_cart") || "[]";
//       var parsed = JSON.parse(raw);
//       if (Array.isArray(parsed)) {
//         return parsed.map(function (item) {
//           return {
//             catalogObjectType: "Product",
//             catalogObjectId: item.productId || item.cartItemId || item.id,
//             price: parsePrice(item.priceNum || item.saleNum || 0),
//             quantity: parseInt(item.quantity, 10) || 1,
//             attributes: {
//               sku: item.productId || item.cartItemId || item.id,
//               name: item.title || "",
//               currency: currency
//             }
//           };
//         }).filter(function (item) {
//           return !!item.catalogObjectId;
//         });
//       }
//     } catch (e) {
//       // ignore
//     }

//     return [];
//   }

//   // Initialize Salesforce Interactions SDK
//   if (typeof SalesforceInteractions === "undefined") {
//     console.warn("SalesforceInteractions Web SDK is not loaded.");
//     return;
//   }

//   SalesforceInteractions.init({
//     cookieDomain: window.location.hostname || undefined
//   }).then(function () {

//     var sitemapConfig = {
//       global: {
//         contentZones: [
//           { name: "global_header", selector: "header.site-header" },
//           { name: "global_footer", selector: "footer.site-footer" },
//           { name: "global_exit_intent" },
//           { name: "global_survey_feedback" }
//         ]
//       },

//       pageTypeDefault: {
//         name: "default",
//         interaction: {
//           name: "Default Page"
//         }
//       },

//       pageTypes: [
//         // =====================================================================
//         // 1. HOME PAGE
//         // =====================================================================
//         {
//           name: "home",
//           isMatch: function () {
//             var pageType = getDataLayerValue(["MCP", "pageType"]);
//             if (pageType === "Home") return true;

//             var path = (window.location.pathname || "").toLowerCase();
//             return path === "/" || path === "" || path.endsWith("/index.html") || path.endsWith("/index");
//           },
//           interaction: {
//             name: "Home Page"
//           },
//           contentZones: [
//             { name: "home_hero_banner", selector: "#hero-slider-viewport" },
//             { name: "home_hot_drops_recommendation", selector: "#hot-drops-grid" },
//             { name: "home_bestsellers_recommendation", selector: "#bestsellers-tiles-grid" }
//           ]
//         },

//         // =====================================================================
//         // 2. CATEGORY (PLP) PAGE
//         // =====================================================================
//         {
//           name: "category",
//           isMatch: function () {
//             var pageType = getDataLayerValue(["MCP", "pageType"]);
//             if (pageType === "Category") return true;

//             var path = (window.location.pathname || "").toLowerCase();
//             return (
//               path.indexOf("women.html") !== -1 ||
//               path.indexOf("men.html") !== -1 ||
//               path.indexOf("curve.html") !== -1 ||
//               path.indexOf("top.html") !== -1 ||
//               path.indexOf("bestsellers.html") !== -1 ||
//               (document.body && document.body.hasAttribute("data-page-gender")) ||
//               !!document.getElementById("shop-all-grid")
//             );
//           },
//           interaction: {
//             name: SalesforceInteractions.CatalogObjectInteractionName.ViewCatalogObject,
//             catalogObject: {
//               type: "Category",
//               id: function () {
//                 return (
//                   getDataLayerValue(["MCP", "itemListId"]) ||
//                   (document.body && document.body.getAttribute("data-page-gender")) ||
//                   "Category"
//                 );
//               },
//               attributes: {
//                 name: function () {
//                   return (
//                     getDataLayerValue(["MCP", "itemListName"]) ||
//                     getDataLayerValue(["MCP", "itemListId"]) ||
//                     "Category"
//                   );
//                 },
//                 url: SalesforceInteractions.resolvers.fromHref()
//               }
//             }
//           },
//           contentZones: [
//             { name: "category_hero_banner", selector: ".category-hero-banner" },
//             { name: "plp_recommendations", selector: "#shop-all-grid" }
//           ]
//         },

//         // =====================================================================
//         // 3. PRODUCT DETAIL PAGE (PDP)
//         // =====================================================================
//         {
//           name: "pdp",
//           isMatch: function () {
//             var pageType = getDataLayerValue(["MCP", "pageType"]);
//             if (pageType === "Product") return true;

//             var path = (window.location.pathname || "").toLowerCase();
//             return path.indexOf("product.html") !== -1 || !!document.getElementById("pdp-title");
//           },
//           interaction: {
//             name: SalesforceInteractions.CatalogObjectInteractionName.ViewCatalogObject,
//             catalogObject: {
//               type: "Product",
//               id: function () {
//                 var mcpId = getDataLayerValue(["MCP", "Item", "id"]);
//                 if (mcpId) return mcpId;

//                 var params = new URLSearchParams(window.location.search);
//                 var qId = params.get("id");
//                 if (qId) return qId;

//                 return "prod_drop_1";
//               },
//               attributes: {
//                 sku: function () {
//                   return (
//                     getDataLayerValue(["MCP", "Item", "sku"]) ||
//                     getDataLayerValue(["MCP", "Item", "id"]) ||
//                     new URLSearchParams(window.location.search).get("id") ||
//                     "prod_drop_1"
//                   );
//                 },
//                 name: function () {
//                   var mcpName = getDataLayerValue(["MCP", "Item", "name"]);
//                   if (mcpName) return mcpName;

//                   var titleEl = document.getElementById("pdp-title");
//                   return titleEl ? titleEl.textContent.trim() : "";
//                 },
//                 description: function () {
//                   var desc = getDataLayerValue(["MCP", "Item", "description"]);
//                   if (desc) return desc;

//                   var descEl = document.getElementById("pdp-desc-text");
//                   return descEl ? descEl.textContent.trim() : "";
//                 },
//                 imageUrl: function () {
//                   var img = getDataLayerValue(["MCP", "Item", "imageUrl"]);
//                   if (img) {
//                     if (img.indexOf("http") === 0) return img;
//                     return window.location.origin + (img.charAt(0) === "/" ? "" : "/") + img;
//                   }

//                   var mainImg = document.getElementById("pdp-main-image");
//                   if (mainImg && mainImg.src) return mainImg.src;

//                   return window.location.origin + "/assets/placeholder.jpg";
//                 },
//                 url: SalesforceInteractions.resolvers.fromHref(),
//                 currency: function () {
//                   return getDataLayerValue(["MCP", "currency"]) || "INR";
//                 },
//                 price: function () {
//                   var price = getDataLayerValue(["MCP", "Item", "price"]);
//                   if (price !== null && price !== undefined) return parsePrice(price);

//                   var priceEl = document.getElementById("pdp-sale-price");
//                   return priceEl ? parsePrice(priceEl.textContent) : 0;
//                 },
//                 availability: function () {
//                   return getDataLayerValue(["MCP", "Item", "availability"]) || "in_stock";
//                 }
//               },
//               relatedCatalogObjects: {
//                 Category: function () {
//                   var cat = getDataLayerValue(["MCP", "Item", "category"]);
//                   return cat ? [cat] : [];
//                 },
//                 Color: function () {
//                   var col = getDataLayerValue(["MCP", "Item", "color"]);
//                   return Array.isArray(col) ? col : (col ? [col] : []);
//                 },
//                 Size: function () {
//                   var s = getDataLayerValue(["MCP", "Item", "size"]);
//                   return Array.isArray(s) ? s : (s ? [s] : []);
//                 }
//               }
//             }
//           },
//           contentZones: [
//             { name: "pdp_similar_recommendations", selector: "#pdp-similar-grid" }
//           ],
//           listeners: [
//             SalesforceInteractions.listener("click", "#btn-pdp-add-bag", function () {
//               var id = getDataLayerValue(["MCP", "Item", "id"]) || new URLSearchParams(window.location.search).get("id") || "prod_drop_1";
//               var price = parsePrice(getDataLayerValue(["MCP", "Item", "price"])) || 999;
//               var name = getDataLayerValue(["MCP", "Item", "name"]) || (document.getElementById("pdp-title") ? document.getElementById("pdp-title").textContent.trim() : "");
//               var qtyEl = document.getElementById("pdp-qty-num");
//               var qty = qtyEl ? parseInt(qtyEl.textContent, 10) || 1 : 1;

//               SalesforceInteractions.sendEvent({
//                 interaction: {
//                   name: SalesforceInteractions.CartInteractionName.AddToCart,
//                   lineItem: {
//                     catalogObjectType: "Product",
//                     catalogObjectId: id,
//                     quantity: qty,
//                     price: price,
//                     attributes: {
//                       name: name,
//                       sku: id
//                     }
//                   }
//                 }
//               });
//             })
//           ]
//         },

//         // =====================================================================
//         // 4. CART & CHECKOUT PAGE
//         // =====================================================================
//         {
//           name: "cart",
//           isMatch: function () {
//             var pageType = getDataLayerValue(["MCP", "pageType"]);
//             if (pageType === "Cart") return true;

//             var path = (window.location.pathname || "").toLowerCase();
//             return path.indexOf("cart.html") !== -1 || !!document.getElementById("full-cart-layout");
//           },
//           interaction: {
//             name: SalesforceInteractions.CartInteractionName.ReplaceCart,
//             lineItems: getCartLineItems
//           },
//           contentZones: [
//             { name: "cart_recommendations", selector: "#cart-recommendations-grid" }
//           ]
//         },

//         // =====================================================================
//         // 5. WISHLIST PAGE
//         // =====================================================================
//         {
//           name: "wishlist",
//           isMatch: function () {
//             var pageType = getDataLayerValue(["MCP", "pageType"]);
//             if (pageType === "Wishlist") return true;

//             var path = (window.location.pathname || "").toLowerCase();
//             return path.indexOf("wishlist.html") !== -1 || !!document.getElementById("page-wishlist-grid");
//           },
//           interaction: {
//             name: "Viewed Wishlist Page"
//           },
//           contentZones: [
//             { name: "wishlist_grid", selector: "#page-wishlist-grid" }
//           ]
//         },

//         // =====================================================================
//         // 6. CONTACT US PAGE
//         // =====================================================================
//         {
//           name: "contact",
//           isMatch: function () {
//             var pageType = getDataLayerValue(["MCP", "pageType"]);
//             if (pageType === "Contact") return true;

//             var path = (window.location.pathname || "").toLowerCase();
//             return path.indexOf("contact.html") !== -1 || !!document.getElementById("contact-form");
//           },
//           interaction: {
//             name: "Viewed Contact Us Page"
//           },
//           contentZones: [
//             { name: "contact_us_form", selector: "#contact-form" }
//           ],
//           listeners: [
//             SalesforceInteractions.listener("submit", "#contact-form", function () {
//               SalesforceInteractions.sendEvent({
//                 interaction: {
//                   name: "Contact Form Submitted"
//                 }
//               });
//             })
//           ]
//         },

//         // =====================================================================
//         // 7. TRACK ORDER PAGE
//         // =====================================================================
//         {
//           name: "track_order",
//           isMatch: function () {
//             var pageType = getDataLayerValue(["MCP", "pageType"]);
//             if (pageType === "TrackOrder") return true;

//             var path = (window.location.pathname || "").toLowerCase();
//             return path.indexOf("track-order.html") !== -1 || !!document.getElementById("track-form");
//           },
//           interaction: {
//             name: "Viewed Track Order Page"
//           }
//         },

//         // =====================================================================
//         // 8. CONTENT & POLICY PAGES
//         // =====================================================================
//         {
//           name: "content",
//           isMatch: function () {
//             var pageType = getDataLayerValue(["MCP", "pageType"]);
//             if (pageType === "Content") return true;

//             var path = (window.location.pathname || "").toLowerCase();
//             return (
//               path.indexOf("about.html") !== -1 ||
//               path.indexOf("returns.html") !== -1 ||
//               path.indexOf("shipping-policy.html") !== -1 ||
//               path.indexOf("faqs.html") !== -1
//             );
//           },
//           interaction: {
//             name: "Viewed Policy/Content Page"
//           }
//         }
//       ]
//     };

//     // Initialize Sitemap in Salesforce Interactions SDK
//     SalesforceInteractions.initSitemap(sitemapConfig);
//     console.log("Salesforce Marketing Cloud Personalization Sitemap initialized.");
//   }).catch(function (err) {
//     console.warn("SalesforceInteractions Sitemap init failed:", err);
//   });
// })();
