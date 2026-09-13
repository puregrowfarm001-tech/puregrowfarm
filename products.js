import { products, setProducts } from './state.js';
import { farmWhatsapp } from './config.js';

export function saveProductsToStorage() {
  localStorage.setItem('pgf_live_products', JSON.stringify(products));
}

export function renderProducts(list = products) {
  if(!document.getElementById("productsList")) return;
  
  const dryProd = products.find(p => p.type === "dry") || { stock: 0 };
  const powderProd = products.find(p => p.type === "powder") || { stock: 0 };
  const khakhraProd = products.find(p => p.type === "khakhra") || { stock: 0 };
  const papadProd = products.find(p => p.type === "papad") || { stock: 0 };

  document.getElementById("productsList").innerHTML = list.map(product => {
    let currentStock = product.stock;
    let isAvailable = false;

    if (product.type === "dry") {
      currentStock = dryProd.stock;
      isAvailable = currentStock >= 1;
    } else if (product.type === "powder") {
      currentStock = powderProd.stock * 10;
      isAvailable = currentStock >= 1;
    } else if (product.type === "khakhra") {
      currentStock = khakhraProd.stock;
      isAvailable = currentStock >= 1;
    } else if (product.type === "papad") {
      currentStock = papadProd.stock;
      isAvailable = currentStock >= 1;
    } else if (product.type === "green" || product.bulk) {
      isAvailable = true;
    }

    const isSpecialInquiry = product.bulk || product.type === "green";

    return `
      <article class="product">
        <img src="${product.image}" alt="${product.name}">
        <h3>${product.name}</h3>
        <p class="muted">${product.detail}</p>
        
        <div style="margin-bottom: 8px;">
          ${isSpecialInquiry ? 
            `<span class="badge" style="background: #e0f2fe; color: #0369a1; font-size:11px;">🌱 Fresh Harvest & Bulk Inquiry</span>` : 
            (isAvailable 
              ? `<span class="badge badge-confirmed" style="font-size:11px;">🟢 Available: ${typeof currentStock === 'number' ? currentStock.toFixed(product.type === 'dry' ? 2 : 0) : currentStock} ${product.unit}</span>` 
              : `<span class="badge" style="background:#fee2e2; color:#991b1b; font-size:11px;">🔴 Out of Stock</span>`
            )
          }
        </div>

        <div style="margin-top:auto;">
          <div class="product-actions">
            <div class="pill">Rs ${product.price} / ${product.unit}</div>
            ${isSpecialInquiry ? 
              `<button type="button" style="background:#25d366; width:100%;" onclick="window.open('https://wa.me/${farmWhatsapp}?text=${encodeURIComponent("Hello Pure Grow Farm, I want to inquire about " + product.name + ". Please share details.")}')">💬 Contact WhatsApp</button>` : 
              `<button type="button" ${isAvailable ? '' : 'disabled style="background:#9ca3af; cursor:not-allowed;"'} onclick="addToCart(${product.id})">
                ${isAvailable ? 'Add Cart' : 'Out of Stock'}
              </button>`
            }
          </div>
        </div>
      </article>
    `;
  }).join("");
}