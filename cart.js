import { cart, products } from './state.js';
import { saveProductsToStorage, renderProducts } from './products.js';
import { farmUpiId, farmName, farmWhatsapp } from './config.js';
import { currentUser } from './state.js';
import { _supabase } from './config.js';
import { pushNotification } from './notifications.js';
import { getTodayIsoString } from './utils.js';

export function updateHeaderCartCounter() {
  const badge = document.getElementById("headerCartCount");
  if (!badge) return;
  const totalCount = [...cart.values()].reduce((sum, item) => sum + item.qty, 0);
  badge.textContent = totalCount;
}

export function addToCart(id) {
  const product = products.find(item => item.id === id);
  if (!product || product.stock <= 0) {
    alert("⚠️ Abhi yeh item stock me uplabdh nahi hai!");
    return;
  }

  const current = cart.get(id);
  const currentQty = current ? current.qty : 0;

  if (currentQty + 1 > product.stock) {
    alert(`⚠️ Stock me sirf ${product.stock} items hi uplabdh hain!`);
    return;
  }

  cart.set(id, { ...product, qty: currentQty + 1 });
  renderCart();
  updateHeaderCartCounter();
}

export function minusCart(id) {
  const item = cart.get(id);
  if (!item) return;
  if (item.qty === 1) cart.delete(id);
  else cart.set(id, { ...item, qty: item.qty - 1 });
  renderCart();
  updateHeaderCartCounter();
}

export function getTotals() {
  const subtotal = [...cart.values()].reduce((sum, item) => sum + (item.price * item.qty), 0);
  const delivery = subtotal > 0 ? (subtotal > 1000 ? 0 : 50) : 0;
  return { subtotal, delivery, total: subtotal + delivery };
}

export function renderCart() {
  const bill = getTotals();
  if(document.getElementById("subtotal")) document.getElementById("subtotal").textContent = `Rs ${bill.subtotal}`;
  if(document.getElementById("delivery")) document.getElementById("delivery").textContent = `Rs ${bill.delivery}`;
  if(document.getElementById("total")) document.getElementById("total").textContent = `Rs ${bill.total}`;

  updateHeaderCartCounter();

  if (!cart.size) { 
    if(document.getElementById("cartItems")) document.getElementById("cartItems").innerHTML = `<p class="muted">Cart selection is empty.</p>`; 
    if(document.getElementById("paymentMode")) document.getElementById("paymentMode").value = "";
    if(document.getElementById("paymentId")) {
      document.getElementById("paymentId").value = "";
      document.getElementById("paymentId").disabled = true;
    }
    if(document.getElementById("confirmOrderBtn")) document.getElementById("confirmOrderBtn").disabled = true;
    return; 
  }
  
  if(document.getElementById("cartItems")) {
    document.getElementById("cartItems").innerHTML = [...cart.values()].map(item => `
      <div class="cart-item">
        <div><strong>${item.name}</strong><br><span class="muted">Rs ${item.price} x ${item.qty}</span></div>
        <div class="qty-actions">
          <button type="button" onclick="minusCart(${item.id})">-</button>
          <button type="button" onclick="addToCart(${item.id})">+</button>
        </div>
      </div>
    `).join("");
  }
  validateOrderForm();
}

export function openProductPayment() {
  const mode = document.getElementById("paymentMode").value;
  const bill = getTotals();
  if(!mode || !cart.size) {
    document.getElementById("paymentId").value = "";
    document.getElementById("paymentId").disabled = true;
    validateOrderForm();
    return;
  }
  
  document.getElementById("productPaymentHelp").style.display = "block";
  document.getElementById("productPaymentHelp").textContent = `Launching UPI Payment app link for Rs ${bill.total}.`;
  
  window.location.href = `upi://pay?pa=${encodeURIComponent(farmUpiId)}&pn=${encodeURIComponent(farmName)}&am=${bill.total}&cu=INR`;
  
  document.getElementById("paymentId").disabled = false;
  validateOrderForm();
}

export function validateOrderForm() {
  const address = document.getElementById("address") ? document.getElementById("address").value.trim() : "";
  const userUpi = document.getElementById("userUpiId") ? document.getElementById("userUpiId").value.trim() : "";
  const mode = document.getElementById("paymentMode") ? document.getElementById("paymentMode").value : "";
  const txnId = document.getElementById("paymentId") ? document.getElementById("paymentId").value.trim() : "";
  
  const isValid = cart.size > 0 && address.length > 4 && userUpi.length >= 5 && userUpi.includes('@') && mode !== "" && txnId.length >= 6;
  if(document.getElementById("confirmOrderBtn")) document.getElementById("confirmOrderBtn").disabled = !isValid;
}

export async function confirmOrder(e) {
  e.preventDefault();
  const bill = getTotals();
  const currentTimestamp = new Date().toLocaleDateString('en-IN') + " " + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const paymentDateStr = new Date().toLocaleDateString('en-IN');
  const generatedOrderId = "PGF-INV-" + Date.now().toString().slice(-5);

  cart.forEach((item, prodId) => {
    const prod = products.find(p => p.id === prodId);
    if (prod && !prod.bulk) {
      prod.stock = Math.max(0, prod.stock - item.qty);
    }
  });
  saveProductsToStorage();
  renderProducts();

  const data = {
    order_id: generatedOrderId,
    name: currentUser.name,
    phone: currentUser.phone,
    email: currentUser.email,
    address: document.getElementById("address").value.trim(),
    user_upi_id: document.getElementById("userUpiId").value.trim(),
    products: [...cart.values()].map(i => `${i.name} [x${i.qty}]`).join(", "),
    subtotal: bill.subtotal,
    delivery: bill.delivery,
    total: bill.total,
    payment_mode: document.getElementById("paymentMode").value,
    txn_id: document.getElementById("paymentId").value.trim(),
    date_logged: currentTimestamp,
    payment_date: paymentDateStr,
    raw_iso_date: getTodayIsoString(),
    delivery_days: "",
    courier_name: "Ekart Logistics",
    current_location: "Pure Grow Farm Central Hub, Makhiyala",
    refund_credited_date: "",
    status: "Pending Verification"
  };

  const { error } = await _supabase.from('pgf_orders').insert([data]);
  if (error) {
    alert("Order save karne me error aayi: " + error.message);
    return;
  }

  pushNotification('ADMIN', '📦 New Order Received', `${data.name} ne naya order place kiya hai (Ref: #${data.order_id}).`, 'order');

  alert("Order successfully synced to Cloud & Submitted!");
  
  setTimeout(() => {
    window.open(`https://wa.me/${farmWhatsapp}?text=${encodeURIComponent("NEW GOODS ORDER: " + data.order_id)}`, '_blank');
  }, 300);
  
  if (typeof window.checkUserSession === 'function') {
    window.checkUserSession();
  }
  
  cart.clear();
  renderCart();
  document.getElementById("orderForm").reset();
}