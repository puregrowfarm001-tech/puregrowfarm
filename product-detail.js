const SUPABASE_URL = 'https://prukoxvmwuzaacctjxph.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_3xW-grMnyyVpoFdRy5sgLg_kQoUMHyd';

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const PRODUCT_GALLERY_IMAGES = {
  1: ["mushroom/Screenshot 2025-10-24 154001.png", "mushroom/g mushroom.png", "mushroom/7.jpg"],
  2: ["mushroom/oyst dry.webp", "mushroom/8.jpg", "mushroom/9.jpg"],
  3: ["mushroom/oyster powder.png", "mushroom/intership1.png", "mushroom/g mushroom.png"],
  4: ["mushroom/methikhakhra2.png", "mushroom/intership4.jpg", "mushroom/7.jpg"],
  5: ["mushroom/adadpapad2.png", "mushroom/intership3.jpg", "mushroom/8.jpg"],
  6: ["mushroom/bulk.png", "mushroom/g mushroom.png", "mushroom/9.jpg"]
};

const BASE_PRODUCTS = [
  { id: 1, name: "Fresh Green Oyster Mushroom", price: 180, delivery: 50, unit: "1kg", image: "mushroom/Screenshot 2025-10-24 154001.png", detail: "Picked fresh, chilled and delivered within 24-48 hours directly from our Makhiyala climate-controlled mushroom farm.", type: "green", stock: 100 },
  { id: 2, name: "Dried Oyster Mushroom", price: 800, delivery: 40, unit: "1kg pack", image: "mushroom/oyst dry.webp", detail: "Slow-dried to preserve flavor and nutrients. Rehydrates within 10 minutes for soups, curries and gravies.", type: "dry", stock: 50 },
  { id: 3, name: "Oyster Mushroom Powder", price: 130, delivery: 30, unit: "100gm pack", image: "mushroom/oyster powder.png", detail: "Fine mushroom powder for immunity tea, dal mix, soup, health drinks and snacks.", type: "powder", stock: 80 },
  { id: 4, name: "Methi Mushroom Khakhra", price: 70, delivery: 20, unit: "200gm pack", image: "mushroom/methikhakhra2.png", detail: "Crispy roasted Gujarati khakhra enriched with oyster mushroom powder and methi.", type: "khakhra", stock: 120 },
  { id: 5, name: "Adad Mushroom Papad", price: 120, delivery: 25, unit: "1 pack", image: "mushroom/adadpapad2.png", detail: "Traditional urad dal papad enriched with high-protein mushroom nutrition.", type: "papad", stock: 90 },
  { id: 6, name: "Bulk and Wholesale Supply", price: 0, delivery: 0, unit: "Custom", bulk: true, image: "mushroom/bulk.png", detail: "Wholesale supply contracts for restaurants, hotels, distributors and local markets.", stock: 99999 }
];

// PGF Loader Helpers
function showPgfLoader(message = "Processing, please wait...") {
  const loader = document.getElementById("globalPageLoader");
  const msgEl = document.getElementById("globalLoaderText");
  if (loader) {
    if (msgEl) msgEl.textContent = message;
    loader.classList.add("active-loader");
  }
}

function hidePgfLoader() {
  const loader = document.getElementById("globalPageLoader");
  if (loader) {
    loader.classList.remove("active-loader");
  }
}

async function initProductDetailPage() {
  showPgfLoader("Loading product details...");

  const params = new URLSearchParams(window.location.search);
  const prodId = parseInt(params.get("id"), 10) || 1;

  let localProducts = JSON.parse(localStorage.getItem('pgf_live_products')) || BASE_PRODUCTS;

  // Supabase se dynamic price & delivery charge fetch
  try {
    const { data: cloudPrices } = await _supabase.from('pgf_product_pricing').select('*');
    if (cloudPrices && cloudPrices.length) {
      localProducts = localProducts.map(p => {
        const found = cloudPrices.find(cp => cp.id === p.id);
        if (found) {
          return { ...p, price: Number(found.price), delivery: Number(found.delivery || 0) };
        }
        return p;
      });
      localStorage.setItem('pgf_live_products', JSON.stringify(localProducts));
    }
  } catch (err) {
    console.warn("Pricing cloud sync error:", err);
  }

  const product = localProducts.find(p => p.id === prodId) || localProducts[0];
  const gallery = PRODUCT_GALLERY_IMAGES[product.id] || [product.image];

  const container = document.getElementById("productDetailContainer");
  if (!container) {
    hidePgfLoader();
    return;
  }

  container.innerHTML = `
    <div class="flipkart-detail-wrapper">
      <div class="gallery-column">
        <div class="big-img-frame">
          <img id="flipBigImg" src="${gallery[0]}" alt="${product.name}">
        </div>
        <div class="thumbnails-row">
          ${gallery.map((imgSrc, idx) => `
            <button type="button" class="thumb-btn ${idx === 0 ? 'active' : ''}" onclick="switchDetailPhoto('${imgSrc}', this)">
              <img src="${imgSrc}" alt="Thumbnail ${idx + 1}">
            </button>
          `).join("")}
        </div>
      </div>

      <div class="info-column">
        <span class="pill" style="width:fit-content;">${product.type ? product.type.toUpperCase() : 'ORGANIC'}</span>
        <h1 style="margin: 0; font-size: 28px; color: #0f172a;">${product.name}</h1>
        <p class="muted" style="margin: 0; font-size: 14px;">Packaging Unit: <strong>${product.unit}</strong></p>

        <div class="price-box">
          <span class="price-main">₹${product.price}</span>
          <span class="muted" style="font-size: 13px;">per ${product.unit}</span>
        </div>

        <div class="delivery-pill">
          🚚 Delivery Charge: ${product.delivery > 0 ? `₹${product.delivery}` : 'FREE Delivery'}
        </div>

        <div style="margin: 6px 0; font-size: 13px;">
          <strong>Live Farm Stock:</strong> 
          <span style="color: ${product.stock > 0 ? '#15803d' : '#dc2626'}; font-weight: bold;">
            ${product.stock > 0 ? `🟢 In Stock (${product.stock} available)` : '🔴 Out of Stock'}
          </span>
        </div>

        <div style="border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); padding: 14px 0;">
          <h4 style="margin: 0 0 6px 0;">Description & Nutrients:</h4>
          <p style="margin: 0; color: #334155; line-height: 1.6; font-size: 14px;">${product.detail}</p>
        </div>

        <div class="cta-row">
          ${product.bulk ? `
            <a href="https://wa.me/919067891039?text=${encodeURIComponent('Hello Pure Grow Farm, I want to inquire about Bulk Supply for ' + product.name)}" target="_blank" class="btn" style="background:#25d366; font-size:15px; padding:12px 24px;">
              💬 Wholesale WhatsApp Inquiry
            </a>
          ` : `
            // cta-row ke andar quantity selector replace karein:
<div style="display: flex; align-items: center; gap: 6px; background: #f1f5f9; padding: 4px 8px; border-radius: 8px; border: 1px solid #cbd5e1;">
  <span style="font-size: 13px; font-weight: bold; margin-right: 4px;">Qty:</span>
  <button type="button" class="btn" style="min-height: 32px; width: 32px; padding: 0; font-size: 16px; background: #64748b;" onclick="decrementDetailQty()">-</button>
  <input type="number" id="detailQtyInput" value="1" min="1" max="${product.stock || 10}" readonly style="width: 48px; text-align: center; font-weight: bold; padding: 4px; border: 1px solid #cbd5e1; background: #fff; border-radius: 6px;">
  <button type="button" class="btn" style="min-height: 32px; width: 32px; padding: 0; font-size: 16px; background: #16a34a;" onclick="incrementDetailQty(${product.stock || 99})">+</button>
</div>

            <!-- 1) Add To Basket -->
            <button type="button" class="btn" style="padding:12px 22px; font-size:14px;" onclick="addDetailProductToBasket(${product.id})">
              🛒 Add to Selection Basket
            </button>

            <!-- 2) Direct Buy on Main Store (Basket me jayega + Checkout Open hoga) -->
            <button type="button" class="btn" style="background:#0284c7; padding:12px 22px; font-size:14px; font-weight:800;" onclick="directBuyOnMainStore(${product.id})">
              ⚡ Buy on Main Store (Direct Checkout)
            </button>
          `}

          <!-- Exit Button inside Action Row -->
          <a href="index.html" class="exit-btn" style="padding:12px 20px; font-size:14px;">
            🚪 Exit to Main Website
          </a>

        </div>
      </div>
    </div>
  `;

  // Content load hone par loader band
  setTimeout(() => {
    hidePgfLoader();
  }, 350);
}

function switchDetailPhoto(src, btn) {
  const bigImg = document.getElementById("flipBigImg");
  if (bigImg) bigImg.src = src;
  document.querySelectorAll(".thumb-btn").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
}

function addDetailProductToBasket(prodId) {
  const qtyInput = document.getElementById("detailQtyInput");
  const qty = parseInt(qtyInput ? qtyInput.value : "1", 10) || 1;

  showPgfLoader("Adding to basket...");
  const currentCart = JSON.parse(localStorage.getItem('pgf_pending_cart_add') || '[]');
  currentCart.push({ id: prodId, qty: qty });
  localStorage.setItem('pgf_pending_cart_add', JSON.stringify(currentCart));

  setTimeout(() => {
    window.location.href = "index.html#cartBasketSidebar";
  }, 400);
}

// Direct Buy Handler (Sirf Basket & Checkout khulega)
function directBuyOnMainStore(prodId) {
  const qtyInput = document.getElementById("detailQtyInput");
  const qty = parseInt(qtyInput ? qtyInput.value : "1", 10) || 1;

  showPgfLoader("Directing to Selection Basket...");
  
  // Pending cart me product dalein
  const currentCart = JSON.parse(localStorage.getItem('pgf_pending_cart_add') || '[]');
  currentCart.push({ id: prodId, qty: qty });
  localStorage.setItem('pgf_pending_cart_add', JSON.stringify(currentCart));

  // Only Basket mode trigger set karein
  localStorage.setItem('pgf_only_basket_mode', 'true');

  setTimeout(() => {
    window.location.href = "index.html";
  }, 400);
}

document.addEventListener("DOMContentLoaded", initProductDetailPage);

// Detail page par Qty badhane aur ghatane ke functions
function incrementDetailQty(maxStock) {
  const input = document.getElementById("detailQtyInput");
  if (!input) return;
  let val = parseInt(input.value, 10) || 1;
  if (val < maxStock) {
    input.value = val + 1;
  } else {
    alert("⚠️ Is product ka itna hi stock available hai!");
  }
}

function decrementDetailQty() {
  const input = document.getElementById("detailQtyInput");
  if (!input) return;
  let val = parseInt(input.value, 10) || 1;
  if (val > 1) {
    input.value = val - 1;
  }
}