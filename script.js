// =========================================================
// SUPABASE CONFIGURATION LINKED
// =========================================================
const SUPABASE_URL = "https://ihxwurfxutwzpheptjkh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloeHd1cmZ4dXR3enBoZXB0amtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4NTI1OTQsImV4cCI6MjEwMTQyODU5NH0.8LHaFC4LH2Z4CMgorGrDcXewNKcznww0PX0dOzqRvEE";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const farmEmail = "puregrowfarm001@gmail.com";
const farmWhatsapp = "919067891039";
const farmUpiId = "sohamgajera01@okhdfcbank";
const farmName = "Pure Grow Farm";

const ADMIN_EMAIL = "admin@puregrowfarm.internal";

const products = [
  { id: 1, name: "Fresh Green Oyster Mushroom", price: 180, unit: "1kg", image: "mushroom/Screenshot 2025-10-24 154001.png", detail: "Picked fresh, chilled and delivered within 24-48 hours.", type: "green", available: true },
  { id: 2, name: "Dried Oyster Mushroom", price: 800, unit: "1kg pack", image: "mushroom/oyst dry.webp", detail: "Slow-dried to preserve flavor and nutrients.", type: "dry", available: true },
  { id: 3, name: "Oyster Mushroom Powder", price: 130, unit: "100gm pack", image: "mushroom/oyster powder.png", detail: "Mushroom powder for soup, 1kg pack curry, health mix and snacks.", type: "powder", available: true },
  { id: 4, name: "Methi Mushroom Khakhra", price: 70, unit: "200gm pack", image: "Methi khakhra 2.png", detail: "Crispy khakhra prepared with oyster mushroom powder.", type: "khakhra", available: true },
  { id: 5, name: "Adad Mushroom Papad", price: 120, unit: "1 pack", image: "mushroom/bulk.png", detail: "Papad enriched with mushroom nutrition.", type: "papad", available: true },
  { id: 6, name: "Bulk and Wholesale Supply", price: 0, unit: "Custom", bulk: true, image: "mushroom/bulk.png", detail: "Supply for restaurants, retailers and local markets.", available: true }
];

const cart = new Map();

let orderRegistry = [];
let bookingsRegistry = [];
let expensesRegistry = [];
let salesRegistry = [];
let purchasesRegistry = [];
let currentUser = null;

function getTodayIsoString() {
  const d = new Date();
  const month = '' + (d.getMonth() + 1), day = '' + d.getDate(), year = d.getFullYear();
  return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
}

function initDefaultDatePickers() {
  const today = getTodayIsoString();
  if(document.getElementById("expLogDate")) document.getElementById("expLogDate").value = today;
  if(document.getElementById("saleLogDate")) document.getElementById("saleLogDate").value = today;
  if(document.getElementById("purLogDate")) document.getElementById("purLogDate").value = today;
  if(document.getElementById("dmgLogDate")) document.getElementById("dmgLogDate").value = today;
}

function openHistoryModal() { document.getElementById("userHistoryModal").classList.add("active-modal"); }
function closeHistoryModal() { document.getElementById("userHistoryModal").classList.remove("active-modal"); }
function closeHistoryModalOutside(e) { if(e.target.id === "userHistoryModal") closeHistoryModal(); }

function switchAuthBox(boxId) {
  document.querySelectorAll('.auth-box').forEach(b => b.classList.remove('active'));
  document.getElementById(boxId).classList.add('active');
}

// =========================================================
// SUPABASE AUTHENTICATION & MULTI-DEVICE SESSION MANAGEMENT
// =========================================================

async function handleRegister(e) {
  e.preventDefault();
  const regBtn = document.getElementById("regSubmitBtn");
  const name = document.getElementById("regName").value.trim();
  const phone = document.getElementById("regPhone").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;

  regBtn.disabled = true;
  regBtn.textContent = "Creating Account...";

  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: { full_name: name, phone: phone }
    }
  });

  regBtn.disabled = false;
  regBtn.textContent = "Create Your Account";

  if (error) {
    alert("❌ Error: " + error.message);
  } else {
    alert("🎉 Account Registered Successfully!");
    currentUser = { name, email, phone, isAdmin: false };
    checkUserSession();
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const loginBtn = document.getElementById("loginSubmitBtn");
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  loginBtn.disabled = true;
  loginBtn.textContent = "Verifying...";

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  });

  loginBtn.disabled = false;
  loginBtn.textContent = "Continue";

  if (error) {
    alert("❌ Login Error: " + error.message);
  } else {
    const user = data.user;
    currentUser = {
      name: user.user_metadata.full_name || "Grower",
      email: user.email,
      phone: user.user_metadata.phone || "",
      isAdmin: user.email === ADMIN_EMAIL
    };
    alert("🎉 Login Successful across devices!");
    checkUserSession();
  }
}

async function handleLogout() {
  await supabase.auth.signOut();
  currentUser = null;
  checkUserSession();
}

async function checkUserSession() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
    const user = session.user;
    currentUser = {
      name: user.user_metadata.full_name || "Grower",
      email: user.email,
      phone: user.user_metadata.phone || "",
      isAdmin: user.email === ADMIN_EMAIL
    };

    document.getElementById("authSection").style.display = "none";
    document.getElementById("logoutBtn").style.display = "inline-flex";
    document.getElementById("authNavBtn").style.display = "none";
    
    if(currentUser.isAdmin) {
      triggerAdminView();
    } else {
      document.getElementById("dashboardWorkspace").style.display = "block";
      document.getElementById("userDashboardName").textContent = currentUser.name;
      
      document.getElementById("checkoutGuardBlock").style.display = "none";
      document.getElementById("orderForm").style.display = "grid";
      document.getElementById("name").value = currentUser.name;
      document.getElementById("phone").value = currentUser.phone || "";
      document.getElementById("email").value = currentUser.email;

      document.getElementById("trainingGuardBlock").style.display = "none";
      document.getElementById("trainingMainContent").style.display = "block";
      document.getElementById("sname").value = currentUser.name;
      document.getElementById("sphone").value = currentUser.phone || "";
      document.getElementById("semail").value = currentUser.email;
      document.getElementById("fname").value = currentUser.name;
      document.getElementById("fphone").value = currentUser.phone || "";
      document.getElementById("femail").value = currentUser.email;

      loadUserPanelData();
    }
  } else {
    document.getElementById("authSection").style.display = "block";
    document.getElementById("logoutBtn").style.display = "none";
    document.getElementById("authNavBtn").style.display = "inline-flex";
    document.getElementById("dashboardWorkspace").style.display = "none";
    document.getElementById("adminErpView").classList.remove("active");
    document.getElementById("publicContent").style.display = "block";

    document.getElementById("checkoutGuardBlock").style.display = "block";
    document.getElementById("orderForm").style.display = "none";
    document.getElementById("trainingGuardBlock").style.display = "block";
    document.getElementById("trainingMainContent").style.display = "none";
  }
}

// =========================================================
// DATABASE SYNC & ERP DATA LOGIC
// =========================================================

async function loadUserPanelData() {
  if(!currentUser) return;
  
  const { data: orders } = await supabase.from("orders").select("*").eq("user_email", currentUser.email);
  const { data: bookings } = await supabase.from("bookings").select("*").eq("user_email", currentUser.email);

  const oList = document.getElementById("userOrdersList");
  const bList = document.getElementById("userBookingsList");

  oList.innerHTML = orders && orders.length ? orders.map(o => `
    <div class="data-item-card">
      <strong>Order ID: ${o.order_id}</strong><br>
      <small>Date Received: ${o.date_logged}</small><br>
      <span>Items: ${o.products}</span><br>
      <strong>Total: Rs ${o.total} [<span style="color:${o.status === 'Approved' ? 'var(--accent)' : 'var(--warn)'}">${o.status}</span>]</strong>
    </div>
  `).join("") : "No active orders mapped for this profile index.";

  bList.innerHTML = bookings && bookings.length ? bookings.map(b => `
    <div class="data-item-card">
      <strong>Booking ID: ${b.booking_id}</strong><br>
      <small>Booked On: ${b.date_logged}</small><br>
      <strong>Scheme: ${b.type} Visit [<span style="color:${b.status === 'Approved' ? 'var(--accent)' : 'var(--warn)'}">${b.status}</span>]</strong>
    </div>
  `).join("") : "No course training applications logged.";
}

function triggerAdminView() {
  document.getElementById("authSection").style.display = "none";
  document.getElementById("dashboardWorkspace").style.display = "none";
  document.getElementById("publicContent").style.display = "none";
  document.getElementById("adminErpView").classList.add("active");
  initDefaultDatePickers();
  fetchAdminSummary();
  switchSubAccountingTab('subTabExpense');
}

function exitAdminPanel() { handleLogout(); }

async function fetchAdminSummary() {
  const { data: orders } = await supabase.from("orders").select("*");
  const { data: bookings } = await supabase.from("bookings").select("*");
  const { data: sales } = await supabase.from("sales").select("*");
  const { data: expenses } = await supabase.from("expenses").select("*");
  const { data: purchases } = await supabase.from("purchases").select("*");

  orderRegistry = orders || [];
  bookingsRegistry = bookings || [];
  salesRegistry = sales || [];
  expensesRegistry = expenses || [];
  purchasesRegistry = purchases || [];

  populateAdminDashboardTables();
  computeFinancialLedgerStatements();
}

function switchErpTab(tabId, buttonId) {
  document.querySelectorAll('.erp-section').forEach(s => s.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  document.querySelectorAll('#erpNavbarBlock button').forEach(btn => btn.classList.remove('active-tab'));
  document.getElementById(buttonId).classList.add('active-tab');
}

function switchSubAccountingTab(subTabId) {
  document.querySelectorAll('.sub-accounting-section').forEach(section => section.style.display = 'none');
  document.getElementById(subTabId).style.display = 'block';
  
  const buttons = ['btnSubTabExpense', 'btnSubTabSell', 'btnSubTabBuy', 'btnSubTabDamage'];
  buttons.forEach(bId => {
    if(document.getElementById(bId)) document.getElementById(bId).style.background = 'var(--muted)';
  });
  
  let targetActiveButton = 'btn' + subTabId.charAt(0).toUpperCase() + subTabId.slice(1);
  if(document.getElementById(targetActiveButton)) document.getElementById(targetActiveButton).style.background = 'var(--accent)';
}

function populateAdminDashboardTables() {
  if(document.getElementById("adminOrdersTableBody")) {
    document.getElementById("adminOrdersTableBody").innerHTML = orderRegistry.map((o) => `
      <tr>
        <td><strong>${o.order_id}</strong></td>
        <td>${o.name}</td>
        <td>${o.phone}</td>
        <td>${o.address}</td>
        <td>${o.products}</td>
        <td>Rs ${o.total}</td>
        <td><code>${o.txn_id}</code></td>
        <td><strong>${o.date_logged}</strong></td>
        <td><span class="badge">${o.status}</span></td>
        <td>Resolved</td>
      </tr>
    `).join("");
  }

  if(document.getElementById("adminBookingsTableBody")) {
    document.getElementById("adminBookingsTableBody").innerHTML = bookingsRegistry.map((b) => `
      <tr>
        <td><strong>${b.booking_id}</strong></td>
        <td>${b.type}</td>
        <td>${b.name}</td>
        <td>${b.phone}</td>
        <td><strong>${b.date}</strong></td>
        <td><code>${b.txn_id}</code></td>
        <td><strong>${b.date_logged}</strong></td>
        <td><span class="badge">${b.status}</span></td>
        <td>Resolved</td>
        <td>Certificate Ready</td>
      </tr>
    `).join("");
  }
}

function computeFinancialLedgerStatements() {
  const totalSales = salesRegistry.reduce((sum, s) => sum + Number(s.total || 0), 0);
  const totalPurchases = purchasesRegistry.reduce((sum, p) => sum + Number(p.total || 0), 0);
  const totalExpenses = expensesRegistry.filter(e => e.category !== "Damage Received").reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalDamages = expensesRegistry.filter(e => e.category === "Damage Received").reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const netProfit = totalSales - (totalPurchases + totalExpenses + totalDamages);

  if(document.getElementById("finTotalRevenue")) document.getElementById("finTotalRevenue").textContent = "Rs " + totalSales.toFixed(2);
  if(document.getElementById("finTotalPurchases")) document.getElementById("finTotalPurchases").textContent = "Rs " + totalPurchases.toFixed(2);
  if(document.getElementById("finTotalExpenses")) document.getElementById("finTotalExpenses").textContent = "Rs " + totalExpenses.toFixed(2);
  if(document.getElementById("finNetProfit")) document.getElementById("finNetProfit").textContent = "Rs " + netProfit.toFixed(2);

  const expRows = expensesRegistry.filter(e => e.category !== "Damage Received");
  if(document.getElementById("subExpenseTableBody")) {
    document.getElementById("subExpenseTableBody").innerHTML = expRows.map(e => `
      <tr><td>${e.date}</td><td>${e.category}</td><td>${e.payer}</td><td>${e.description}</td><td style="color:var(--warn); font-weight:bold;">Rs ${e.amount}</td></tr>
    `).join("");
  }

  if(document.getElementById("subSellTableBody")) {
    document.getElementById("subSellTableBody").innerHTML = salesRegistry.map(s => `
      <tr><td>${s.date}</td><td>${s.product}</td><td>${s.buyer}</td><td>${s.phone || 'N/A'}</td><td>${s.qty}</td><td style="color:var(--accent); font-weight:bold;">Rs ${s.total}</td></tr>
    `).join("");
  }

  if(document.getElementById("subBuyTableBody")) {
    document.getElementById("subBuyTableBody").innerHTML = purchasesRegistry.map(p => `
      <tr><td>${p.date}</td><td>${p.product}</td><td>${p.vendor}</td><td>${p.qty}</td><td style="color:var(--danger); font-weight:bold;">Rs ${p.total}</td></tr>
    `).join("");
  }
}

async function saveAdminExpense(e) {
  e.preventDefault();
  const rawDate = document.getElementById("expLogDate").value;
  const payload = {
    exp_id: "EXP-" + Date.now().toString().slice(-4),
    date: rawDate ? new Date(rawDate).toLocaleDateString() : new Date().toLocaleDateString(),
    category: document.getElementById("expCategory").value,
    payer: document.getElementById("expPayer").value,
    mode: document.getElementById("expMode").value,
    description: document.getElementById("expDesc").value.trim(),
    amount: parseFloat(document.getElementById("expAmount").value)
  };

  await supabase.from("expenses").insert([payload]);
  e.target.reset();
  initDefaultDatePickers();
  fetchAdminSummary();
}

async function saveAdminSale(e) {
  e.preventDefault();
  const rawDate = document.getElementById("saleLogDate").value;
  const qty = parseFloat(document.getElementById("saleQty").value);
  const rate = parseFloat(document.getElementById("saleRate").value);

  const payload = {
    sale_id: "SALE-" + Date.now().toString().slice(-4),
    date: rawDate ? new Date(rawDate).toLocaleDateString() : new Date().toLocaleDateString(),
    product: document.getElementById("saleProduct").value,
    collector: document.getElementById("saleCollector").value,
    buyer: document.getElementById("saleBuyer").value.trim(),
    phone: document.getElementById("salePhone").value.trim(),
    address: document.getElementById("saleAddress").value.trim(),
    qty: qty,
    rate: rate,
    total: qty * rate
  };

  await supabase.from("sales").insert([payload]);
  e.target.reset();
  initDefaultDatePickers();
  fetchAdminSummary();
}

async function saveAdminPurchase(e) {
  e.preventDefault();
  const rawDate = document.getElementById("purLogDate").value;
  const qty = parseFloat(document.getElementById("purQty").value);
  const rate = parseFloat(document.getElementById("purRate").value);
  
  const payload = {
    pur_id: "PUR-" + Date.now().toString().slice(-4),
    date: rawDate ? new Date(rawDate).toLocaleDateString() : new Date().toLocaleDateString(),
    product: document.getElementById("purProduct").value,
    funder: document.getElementById("purFunder").value,
    vendor: document.getElementById("purVendor").value.trim(),
    qty: qty,
    rate: rate,
    total: qty * rate
  };

  await supabase.from("purchases").insert([payload]);
  e.target.reset();
  initDefaultDatePickers();
  fetchAdminSummary();
}

async function saveAdminDamage(e) {
  e.preventDefault();
  const rawDate = document.getElementById("dmgLogDate").value;
  const payload = {
    exp_id: "DMG-" + Date.now().toString().slice(-4),
    date: rawDate ? new Date(rawDate).toLocaleDateString() : new Date().toLocaleDateString(),
    category: "Damage Received",
    payer: document.getElementById("dmgPayer").value,
    mode: "Internal Allocation",
    description: document.getElementById("dmgDesc").value.trim(),
    amount: parseFloat(document.getElementById("dmgAmount").value)
  };

  await supabase.from("expenses").insert([payload]);
  e.target.reset();
  initDefaultDatePickers();
  fetchAdminSummary();
}

function renderProducts() {
  if(!document.getElementById("productsList")) return;
  document.getElementById("productsList").innerHTML = products.map(product => `
    <article class="product">
      <img src="${product.image}" alt="${product.name}">
      <h3>${product.name}</h3>
      <p class="muted">${product.detail}</p>
      <div style="margin-top:auto;">
        <div class="product-actions">
          <div class="pill">Rs ${product.price} / ${product.unit}</div>
          <button type="button" onclick="addToCart(${product.id})">Add Cart</button>
        </div>
      </div>
    </article>
  `).join("");
}

function addToCart(id) {
  const product = products.find(item => item.id === id);
  const current = cart.get(id);
  cart.set(id, { ...product, qty: current ? current.qty + 1 : 1 });
  renderCart();
}

function renderCart() {
  const subtotal = [...cart.values()].reduce((sum, item) => sum + (item.price * item.qty), 0);
  if(document.getElementById("subtotal")) document.getElementById("subtotal").textContent = `Rs ${subtotal}`;
  if(document.getElementById("total")) document.getElementById("total").textContent = `Rs ${subtotal}`;
}

async function confirmOrder(e) {
  e.preventDefault();
  const bill = getTotals();
  const orderId = "PGF-INV-" + Date.now().toString().slice(-5);

  const payload = {
    order_id: orderId,
    user_email: currentUser.email,
    name: currentUser.name,
    phone: currentUser.phone,
    address: document.getElementById("address").value.trim(),
    products: [...cart.values()].map(i => `${i.name} [x${i.qty}]`).join(", "),
    total: bill.subtotal,
    txn_id: document.getElementById("paymentId").value.trim(),
    date_logged: new Date().toLocaleString()
  };

  const { error } = await supabase.from("orders").insert([payload]);

  if (error) {
    alert("Error placing order: " + error.message);
  } else {
    alert("🎉 Order placed & saved to Supabase Cloud Database!");
    cart.clear();
    renderCart();
    checkUserSession();
  }
}

function getTotals() {
  const subtotal = [...cart.values()].reduce((sum, item) => sum + (item.price * item.qty), 0);
  return { subtotal, total: subtotal };
}

function handleForgotPassword(e) {
  e.preventDefault();
  const emailInput = document.getElementById("forgotEmail").value.trim();
  window.open(`https://wa.me/${farmWhatsapp}?text=Password Assist Request for: ${emailInput}`, '_blank');
}

// Boot Initializers
renderProducts();
checkUserSession();