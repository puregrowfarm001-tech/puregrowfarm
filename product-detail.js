const SUPABASE_URL = 'https://prukoxvmwuzaacctjxph.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_3xW-grMnyyVpoFdRy5sgLg_kQoUMHyd';

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const PRODUCT_GALLERY_IMAGES = {
  1: ["mushroom/Screenshot 2025-10-24 154001.png", "mushroom/fresh2.jpg", "mushroom/fresh3.jpg"],
  2: ["mushroom/oyst dry.webp", "mushroom/dry2.jpg", "mushroom/dry3.png"],
  3: ["mushroom/oyster powder.png", "mushroom/powder2.jpg", "mushroom/powder3.jpg"],
  4: ["mushroom/methikhakhra2.png"],
  5: ["mushroom/adadpapad2.png"],
  6: ["mushroom/bulk.png"]
};

const BASE_PRODUCTS = [
  { 
    id: 1, 
    name: "Fresh Green Oyster Mushroom", 
    price: 180, 
    delivery: 50, 
    unit: "1kg", 
    image: "mushroom/Screenshot 2025-10-24 154001.png", 
    detail: `Fresh Green Oyster Mushrooms are naturally nutritious and delicious. They are a good source of plant-based protein and dietary fibre. They contain B-complex vitamins and essential minerals like potassium, phosphorus, and iron. Naturally low in fat and calories, they are ideal for healthy meals and daily cooking.</br>

Key Nutrients: Protein, Dietary Fibre, Vitamin B2, Vitamin B3, Potassium, Phosphorus and Iron.`, 
    type: "green", 
    stock: 100 
  },
  { 
    id: 2, 
    name: "Dried Oyster Mushroom", 
    price: 800, 
    delivery: 40, 
    unit: "1kg pack", 
    image: "mushroom/oyst dry.webp", 
    detail: `Dried Oyster Mushrooms are carefully processed from fresh mushrooms to reduce moisture and improve storage life. They provide concentrated mushroom flavour and nutrients. They contain plant-based protein, dietary fibre, B-complex vitamins, and essential minerals. Ideal for soups, curries, noodles, and other recipes.</br>

Key Nutrients: Protein, Dietary Fibre, Vitamin B-complex, Potassium, Phosphorus and Iron.`, 
    type: "dry", 
    stock: 50 
  },
  { 
    id: 3, 
    name: "Oyster Mushroom Powder", 
    price: 130, 
    delivery: 30, 
    unit: "100gm pack", 
    image: "mushroom/oyster powder.png", 
    detail: `Oyster Mushroom Powder is prepared from dried oyster mushrooms and finely ground for easy use. It adds natural mushroom flavour to everyday food preparations. It contains protein, dietary fibre, vitamins, and minerals. Perfect for soups, curries, sauces, snacks, and healthy recipes.</br>

Key Nutrients: Protein, Dietary Fibre, B-complex Vitamins, Potassium, Phosphorus and Iron.`, 
    type: "powder", 
    stock: 80 
  },
  { 
    id: 4, 
    name: "Methi Mushroom Khakhra", 
    price: 70, 
    delivery: 20, 
    unit: "200gm pack", 
    image: "mushroom/methikhakhra2.png", 
    detail: `Methi Mushroom Khakhra is a crispy and flavourful snack combining traditional fenugreek with oyster mushroom powder. It provides carbohydrates for energy along with dietary fibre and plant-based protein. It also contains nutrients from fenugreek and mushrooms. Enjoy it as a tasty snack with tea or meals.</br>

Key Nutrients: Carbohydrates, Protein, Dietary Fibre, Iron and Calcium.`, 
    type: "khakhra", 
    stock: 120 
  },
  { 
    id: 5, 
    name: "Adad Mushroom Papad", 
    price: 120, 
    delivery: 25, 
    unit: "1 pack", 
    image: "mushroom/adadpapad2.png", 
    detail: `Adad Mushroom Papad is prepared using traditional urad dal (adad) and oyster mushroom powder. It offers a delicious taste with a crispy texture when roasted or fried. Urad dal provides plant-based protein and dietary fibre. It also contains carbohydrates, iron, and other essential minerals.</br>

<b>Key Nutrients: </b>Plant-Based Protein, Carbohydrates, Dietary Fibre, Iron, Potassium and Phosphorus.`, 
    type: "papad", 
    stock: 90 
  },
  { 
    id: 6, 
    name: "Bulk and Wholesale Supply", 
    price: 0, 
    delivery: 0, 
    unit: "Custom", 
    bulk: true, 
    image: "mushroom/bulk.png", 
    detail: `PURE GROW FARM provides quality mushroom products for restaurants, retailers, wholesalers, and food businesses. Our product range includes fresh oyster mushrooms, dried mushrooms, and mushroom powder. Each product offers different nutritional properties depending on its form. Bulk quantities and customised supply options are available.</br>

<b>Key Nutrients:</b> Protein, Dietary Fibre, B-complex Vitamins, Potassium, Phosphorus and Iron (depending on product).`, 
    stock: 99999 
  }
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

  const baseProd = BASE_PRODUCTS.find(p => p.id === prodId) || BASE_PRODUCTS[0];
  const cachedProd = localProducts.find(p => p.id === prodId) || {};

  // Price, delivery aur stock cloud/cache se aayega, lekin detail hamesha naye BASE_PRODUCTS se aayegi
  const product = {
    ...baseProd,
    ...cachedProd,
    detail: baseProd.detail
  };
  const gallery = PRODUCT_GALLERY_IMAGES[product.id] || [product.image];

  const container = document.getElementById("productDetailContainer");
  if (!container) {
    hidePgfLoader();
    return;
  }

  const isBulk = product.bulk || product.id === 6;
  const isFresh = product.id === 1 || product.type === 'green';
  const isDirectWhatsApp = isBulk || isFresh;

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

        <!-- Fresh mushroom me price box hide rahega -->
        ${isFresh ? `
          <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:10px 14px; border-radius:10px; color:#15803d; font-size:14px; font-weight:bold; width:fit-content;">
            🌱 Fresh Daily Harvest (Price on WhatsApp Inquiry)
          </div>
        ` : (isBulk ? `
          <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:10px 14px; border-radius:10px; color:#15803d; font-size:14px; font-weight:bold; width:fit-content;">
            📦 Wholesale Custom Quotation
          </div>
        ` : `
          <div class="price-box">
            <span class="price-main">₹${product.price}</span>
            <span class="muted" style="font-size: 13px;">per ${product.unit}</span>
          </div>

          <div class="delivery-pill">
            🚚 Delivery Charge: ${product.delivery > 0 ? `₹${product.delivery}` : 'FREE Delivery'}
          </div>
        `)}

        <!-- Fresh aur Bulk dono me Stock Status hide rahega -->
        ${!isDirectWhatsApp ? `
          <div style="margin: 6px 0; font-size: 13px;">
            <strong>Live Farm Stock:</strong> 
            <span style="color: ${product.stock > 0 ? '#15803d' : '#dc2626'}; font-weight: bold;">
              ${product.stock > 0 ? `🟢 In Stock (${product.stock} available)` : '🔴 Out of Stock'}
            </span>
          </div>
        ` : ''}

        <div style="border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); padding: 14px 0;">
          <h4 style="margin: 0 0 6px 0;">Description & Nutrients:</h4>
          <p style="margin: 0; color: #334155; line-height: 1.6; font-size: 14px;">${product.detail}</p>
        </div>

        <div class="cta-row">
          ${isDirectWhatsApp ? `
            <!-- WhatsApp Order button with Loader -->
            <button type="button" class="btn" style="background:#25d366; font-size:15px; padding:12px 24px;" 
              onclick="handleWhatsAppOrderClick('https://wa.me/919067891039?text=${encodeURIComponent(
                isBulk
                  ? 'Hello Pure Grow Farm, I want to inquire about Bulk & Wholesale Supply.'
                  : 'Hello Pure Grow Farm, I want to order Fresh Green Oyster Mushroom. Please let me know the current price and availability.'
              )}')">
              💬 Direct WhatsApp Order / Inquiry
            </button>
          ` : `
            <div style="display: flex; align-items: center; gap: 6px; background: #f1f5f9; padding: 4px 8px; border-radius: 8px; border: 1px solid #cbd5e1;">
              <span style="font-size: 13px; font-weight: bold; margin-right: 4px;">Qty:</span>
              <button type="button" class="btn" style="min-height: 32px; width: 32px; padding: 0; font-size: 16px; background: #64748b;" onclick="decrementDetailQty()">-</button>
              <input type="number" id="detailQtyInput" value="1" min="1" max="${product.stock || 10}" readonly style="width: 48px; text-align: center; font-weight: bold; padding: 4px; border: 1px solid #cbd5e1; background: #fff; border-radius: 6px;">
              <button type="button" class="btn" style="min-height: 32px; width: 32px; padding: 0; font-size: 16px; background: #16a34a;" onclick="incrementDetailQty(${product.stock || 99})">+</button>
            </div>

            <!-- 1) Add To Basket Button -->
            <button type="button" class="btn" style="padding:12px 22px; font-size:14px;" onclick="addDetailProductToBasket(${product.id})">
              🛒 Add to Selection Basket
            </button>

            <!-- 2) Direct Buy Button -->
            <button type="button" class="btn" style="background:#0284c7; padding:12px 22px; font-size:14px; font-weight:800;" onclick="directBuyOnMainStore(${product.id})">
              ⚡ Buy on Main Store (Direct Checkout)
            </button>
          `}

          <!-- 3) Exit Button with Loader -->
          <button type="button" class="exit-btn" style="padding:12px 20px; font-size:14px; border:none; cursor:pointer;" onclick="exitToMainWebsite()">
            🚪 Exit to Main Website
          </button>
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

// 1) Add to Selection Basket Button Handler
function addDetailProductToBasket(prodId) {
  const qtyInput = document.getElementById("detailQtyInput");
  const qty = parseInt(qtyInput ? qtyInput.value : "1", 10) || 1;

  // PGF Global Loader Active karein
  showPgfLoader("Adding product to your basket...");

  const currentCart = JSON.parse(localStorage.getItem('pgf_pending_cart_add') || '[]');
  currentCart.push({ id: prodId, qty: qty });
  localStorage.setItem('pgf_pending_cart_add', JSON.stringify(currentCart));

  // 600ms ka smooth delay taaki customer ko loader ring aur blur clearly dikhe
  setTimeout(() => {
    window.location.href = "index.html#cartBasketSidebar";
  }, 600);
}

// 2) Buy on Main Store (Direct Checkout) Handler
function directBuyOnMainStore(prodId) {
  const qtyInput = document.getElementById("detailQtyInput");
  const qty = parseInt(qtyInput ? qtyInput.value : "1", 10) || 1;

  // PGF Global Loader Active karein
  showPgfLoader("Redirecting to Direct Checkout...");

  const currentCart = JSON.parse(localStorage.getItem('pgf_pending_cart_add') || '[]');
  currentCart.push({ id: prodId, qty: qty });
  localStorage.setItem('pgf_pending_cart_add', JSON.stringify(currentCart));
  localStorage.setItem('pgf_only_basket_mode', 'true');

  setTimeout(() => {
    window.location.href = "index.html";
  }, 600);
}

// 3) Exit to Main Website Button Handler
// Exit Button Handler - Products Section me scroll karega
function exitToMainWebsite() {
  showPgfLoader("Returning to Products Catalog...");
  setTimeout(() => {
    window.location.href = "index.html#products";
  }, 500);
}

// 4) Direct WhatsApp Button Handler (Fresh Mushroom & Bulk)
function handleWhatsAppOrderClick(url) {
  showPgfLoader("Connecting to WhatsApp...");
  setTimeout(() => {
    hidePgfLoader();
    window.open(url, '_blank');
  }, 500);
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

// Auto-slide timer variable
let galleryInterval = null;
let currentImageIndex = 0;
let activeGalleryImages = [];

function startGalleryAutoSlide(images) {
  // Purana timer chal raha ho to clear karein
  if (galleryInterval) clearInterval(galleryInterval);
  activeGalleryImages = images;
  
  // Agar product ke pass 1 se zyada photos hain tabhi 3 sec me change hoga
  if (!images || images.length <= 1) return;

  galleryInterval = setInterval(() => {
    currentImageIndex = (currentImageIndex + 1) % activeGalleryImages.length;
    const nextSrc = activeGalleryImages[currentImageIndex];
    
    const thumbs = document.querySelectorAll(".thumb-btn");
    const targetThumb = thumbs[currentImageIndex];
    
    switchDetailPhoto(nextSrc, targetThumb, false);
  }, 3000); // 3000ms = 3 Seconds
}

function switchDetailPhoto(src, btn, userClicked = true) {
  const bigImg = document.getElementById("flipBigImg");
  if (bigImg) {
    bigImg.style.opacity = "0.2";
    setTimeout(() => {
      bigImg.src = src;
      bigImg.style.opacity = "1";
    }, 150);
  }

  document.querySelectorAll(".thumb-btn").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");

  // Agar user ne manually thumbnail par click kiya ho, to index update karein
  if (userClicked && activeGalleryImages.length) {
    const idx = activeGalleryImages.indexOf(src);
    if (idx !== -1) currentImageIndex = idx;
    
    // User click ke baad timer reset karein taaki turant change na ho
    startGalleryAutoSlide(activeGalleryImages);
  }
}