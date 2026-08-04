// =========================================================
// CONFIGURATION & GLOBAL CONSTANTS
// =========================================================
const SHEET_URL = "https://script.google.com/macros/s/AKfycbys57lPqLYcl8eiQFaRlruVHTeowRhwmCHSIf-a4eu-xw27z6iu5F7L_9A4c9iuhRRa/exec";

const farmEmail = "puregrowfarm001@gmail.com";
const farmWhatsapp = "919067891039";
const farmUpiId = "sohamgajera01@okhdfcbank";
const farmName = "Pure Grow Farm";

const ADMIN_CREDENTIALS = { user: "admin", pass: "PureGrow@2026" };

const products = [
  { id: 1, name: "Fresh Green Oyster Mushroom", price: 180, unit: "1kg", image: "mushroom/Screenshot 2025-10-24 154001.png", detail: "Picked fresh, chilled and delivered within 24-48 hours.", type: "green", available: true },
  { id: 2, name: "Dried Oyster Mushroom", price: 800, unit: "1kg pack", image: "mushroom/oyst dry.webp", detail: "Slow-dried to preserve flavor and nutrients.", type: "dry", available: true },
  { id: 3, name: "Oyster Mushroom Powder", price: 130, unit: "100gm pack", image: "mushroom/oyster powder.png", detail: "Mushroom powder for soup, health mix and snacks.", type: "powder", available: true },
  { id: 4, name: "Methi Mushroom Khakhra", price: 70, unit: "200gm pack", image: "Methi khakhra 2.png", detail: "Crispy khakhra prepared with oyster mushroom powder.", type: "khakhra", available: true },
  { id: 5, name: "Adad Mushroom Papad", price: 120, unit: "1 pack", image: "mushroom/bulk.png", detail: "Papad enriched with mushroom nutrition.", type: "papad", available: true },
  { id: 6, name: "Bulk and Wholesale Supply", price: 0, unit: "Custom", bulk: true, image: "mushroom/bulk.png", detail: "Supply for restaurants, retailers and local markets.", available: true }
];

const cart = new Map();

let usersDatabase = JSON.parse(localStorage.getItem('pgf_user_db')) || [];
let orderRegistry = JSON.parse(localStorage.getItem('pgf_orders')) || [];
let bookingsRegistry = JSON.parse(localStorage.getItem('pgf_bookings')) || [];
let expensesRegistry = JSON.parse(localStorage.getItem('pgf_expenses')) || [];
let salesRegistry = JSON.parse(localStorage.getItem('pgf_sales')) || [];
let purchasesRegistry = JSON.parse(localStorage.getItem('pgf_purchases')) || [];

let currentUser = JSON.parse(localStorage.getItem('pgf_session')) || null;

// Sync Data with Google Sheets Backend
async function fetchAdminSummaryFromSheet() {
  try {
    const response = await fetch(SHEET_URL + "?action=getErpSummary");
    if (!response.ok) return;
    
    const data = await response.json();
    
    if (data.totals) {
      if(document.getElementById("finTotalRevenue")) document.getElementById("finTotalRevenue").textContent = "Rs " + Number(data.totals.totalSales || 0).toFixed(2);
      if(document.getElementById("finTotalExpenses")) document.getElementById("finTotalExpenses").textContent = "Rs " + Number(data.totals.totalExpenses || 0).toFixed(2);
      if(document.getElementById("finTotalPurchases")) document.getElementById("finTotalPurchases").textContent = "Rs " + Number(data.totals.totalPurchases || 0).toFixed(2);
      if(document.getElementById("finNetProfit")) document.getElementById("finNetProfit").textContent = "Rs " + Number(data.totals.netProfit || 0).toFixed(2);
    }

    if (data.orders && data.orders.length) { orderRegistry = data.orders; localStorage.setItem('pgf_orders', JSON.stringify(orderRegistry)); }
    if (data.users && data.users.length) { usersDatabase = data.users; localStorage.setItem('pgf_user_db', JSON.stringify(usersDatabase)); }
    if (data.sales && data.sales.length) { salesRegistry = data.sales; localStorage.setItem('pgf_sales', JSON.stringify(salesRegistry)); }
    if (data.expenses && data.expenses.length) { expensesRegistry = data.expenses; localStorage.setItem('pgf_expenses', JSON.stringify(expensesRegistry)); }
    if (data.purchases && data.purchases.length) { purchasesRegistry = data.purchases; localStorage.setItem('pgf_purchases', JSON.stringify(purchasesRegistry)); }
    if (data.bookings && data.bookings.length) { bookingsRegistry = data.bookings; localStorage.setItem('pgf_bookings', JSON.stringify(bookingsRegistry)); }

    if(currentUser && !currentUser.isAdmin) loadUserPanelData();
    populateAdminDashboardTables();
  } catch (error) {
    console.warn("Google Sheet Sync Warning: Using local memory.", error);
    computeFinancialLedgerStatements();
  }
}

async function sendDataToGoogleSheet(payload) {
  try {
    await fetch(SHEET_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setTimeout(fetchAdminSummaryFromSheet, 1500);
  } catch (err) {
    console.error("Data save failed to Google Sheet:", err);
  }
}

// Multi-Device Authentication Handling
async function handleLogin(e) {
  e.preventDefault();
  const userInput = document.getElementById("loginEmail").value.trim();
  const passInput = document.getElementById("loginPassword").value;
  const loginBtn = document.getElementById("loginSubmitBtn");

  if (userInput === ADMIN_CREDENTIALS.user && passInput === ADMIN_CREDENTIALS.pass) {
    currentUser = { name: "System Admin", email: "admin@puregrowfarm.internal", isAdmin: true };
    localStorage.setItem('pgf_session', JSON.stringify(currentUser));
    checkUserSession();
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = "Verifying...";

  try {
    // 1. Fetch latest backend users list for multi-device sync
    const response = await fetch(SHEET_URL + "?action=getErpSummary");
    if (response.ok) {
      const data = await response.json();
      if (data.users && data.users.length) {
        usersDatabase = data.users;
        localStorage.setItem('pgf_user_db', JSON.stringify(usersDatabase));
      }
    }
  } catch (err) {
    console.warn("Offline fallback for login verification");
  }

  // 2. Validate Login Matching Phone or Email
  const match = usersDatabase.find(u => 
    (u.email && u.email.toLowerCase() === userInput.toLowerCase()) || 
    (u.phone && u.phone.trim() === userInput)
  );

  loginBtn.disabled = false;
  loginBtn.textContent = "Continue";

  if (match && match.password === passInput) {
    currentUser = { name: match.name, email: match.email, phone: match.phone, isAdmin: false };
    localStorage.setItem('pgf_session', JSON.stringify(currentUser));
    checkUserSession();
    fetchAdminSummaryFromSheet(); // Load user's live device data
  } else {
    alert("❌ Invalid credentials! Check email/phone or create an account.");
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById("regName").value.trim();
  const phone = document.getElementById("regPhone").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;
  const regBtn = document.getElementById("regSubmitBtn");

  regBtn.disabled = true;
  regBtn.textContent = "Registering...";

  // Refresh user data first
  try {
    const response = await fetch(SHEET_URL + "?action=getErpSummary");
    if (response.ok) {
      const data = await response.json();
      if (data.users) usersDatabase = data.users;
    }
  } catch(e){}

  const existing = usersDatabase.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
  if(existing) {
    alert("❌ An account with this email address already exists!");
    regBtn.disabled = false;
    regBtn.textContent = "Create Your Account";
    return;
  }

  const newUser = { name, phone, email, password };
  usersDatabase.push(newUser);
  localStorage.setItem('pgf_user_db', JSON.stringify(usersDatabase));

  // Sync to global database
  await sendDataToGoogleSheet({ type: "user_reg", name, phone, email, password });

  currentUser = { name, email, phone, isAdmin: false };
  localStorage.setItem('pgf_session', JSON.stringify(currentUser));
  
  regBtn.disabled = false;
  regBtn.textContent = "Create Your Account";
  
  alert("🎉 Account Registered Successfully!");
  checkUserSession();
}

function handleLogout() {
  currentUser = null;
  localStorage.removeItem('pgf_session');
  checkUserSession();
}

function checkUserSession() {
  if (currentUser) {
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

function loadUserPanelData() {
  if(!currentUser) return;
  
  const oList = document.getElementById("userOrdersList");
  const bList = document.getElementById("userBookingsList");
  
  const myOrders = orderRegistry.filter(o => o.email === currentUser.email || o.phone === currentUser.phone);
  const myBookings = bookingsRegistry.filter(b => b.email === currentUser.email || b.phone === currentUser.phone);

  oList.innerHTML = myOrders.length ? myOrders.map(o => `
    <div class="data-item-card">
      <strong>Order ID: ${o.orderId}</strong><br>
      <small>Date Received: ${o.dateLogged}</small><br>
      <span>Items: ${o.products}</span><br>
      <strong>Total: Rs ${o.total} [<span style="color:${o.status === 'Approved' ? 'var(--accent)' : 'var(--warn)'}">${o.status}</span>]</strong>
    </div>
  `).join("") : "No active orders mapped for this account.";

  bList.innerHTML = myBookings.length ? myBookings.map(b => `
    <div class="data-item-card">
      <strong>Booking ID: ${b.bookingId}</strong><br>
      <small>Booked On: ${b.dateLogged}</small><br>
      <strong>Scheme: ${b.type} Visit [<span style="color:${b.status === 'Approved' ? 'var(--accent)' : 'var(--warn)'}">${b.status}</span>]</strong>
    </div>
  `).join("") : "No course training applications logged.";
}

function getTodayIsoString() {
  const d = new Date();
  return [d.getFullYear(), (d.getMonth() + 1).toString().padStart(2, '0'), d.getDate().toString().padStart(2, '0')].join('-');
}

function initDefaultDatePickers() {
  const today = getTodayIsoString();
  ['expLogDate', 'saleLogDate', 'purLogDate', 'dmgLogDate'].forEach(id => {
    if(document.getElementById(id)) document.getElementById(id).value = today;
  });
}

function openHistoryModal() { document.getElementById("userHistoryModal").classList.add("active-modal"); }
function closeHistoryModal() { document.getElementById("userHistoryModal").classList.remove("active-modal"); }
function closeHistoryModalOutside(e) { if(e.target.id === "userHistoryModal") closeHistoryModal(); }

function switchAuthBox(boxId) {
  document.querySelectorAll('.auth-box').forEach(b => b.classList.remove('active'));
  document.getElementById(boxId).classList.add('active');
}

function triggerAdminView() {
  document.getElementById("authSection").style.display = "none";
  document.getElementById("dashboardWorkspace").style.display = "none";
  document.getElementById("publicContent").style.display = "none";
  document.getElementById("adminErpView").classList.add("active");
  initDefaultDatePickers();
  populateAdminDashboardTables();
  fetchAdminSummaryFromSheet();
}

function exitAdminPanel() { handleLogout(); }

function handleForgotPassword(e) {
  e.preventDefault();
  const emailInput = document.getElementById("forgotEmail").value.trim();
  window.open(`https://wa.me/${farmWhatsapp}?text=Password Assist Request for: ${emailInput}`, '_blank');
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
}

function populateAdminDashboardTables() {
  if(document.getElementById("adminOrdersTableBody")) {
    document.getElementById("adminOrdersTableBody").innerHTML = orderRegistry.map((o) => `
      <tr>
        <td><strong>${o.orderId}</strong></td>
        <td>${o.name}</td>
        <td>${o.phone}</td>
        <td>${o.address}</td>
        <td>${o.products}</td>
        <td>Rs ${o.total}</td>
        <td><code>${o.txnId}</code></td>
        <td><strong>${o.dateLogged}</strong></td>
        <td><span class="badge">${o.status}</span></td>
        <td>Resolved</td>
      </tr>
    `).join("");
  }

  if(document.getElementById("adminUsersTableBody")) {
    document.getElementById("adminUsersTableBody").innerHTML = usersDatabase.map((u, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${u.name}</strong></td>
        <td>${u.phone}</td>
        <td><code>${u.email}</code></td>
        <td><mark style="background:#f3f4f6; padding:2px 4px; border-radius:4px;">${u.password}</mark></td>
        <td>Active User</td>
      </tr>
    `).join("");
  }
}

function computeFinancialLedgerStatements() {
  const totalSales = salesRegistry.reduce((sum, s) => sum + Number(s.total || 0), 0);
  const totalPurchases = purchasesRegistry.reduce((sum, p) => sum + Number(p.total || 0), 0);
  const totalExpenses = expensesRegistry.filter(e => e.category !== "Damage Received").reduce((sum, e) => sum + Number(e.amount || 0), 0);

  if(document.getElementById("finTotalRevenue")) document.getElementById("finTotalRevenue").textContent = "Rs " + totalSales.toFixed(2);
  if(document.getElementById("finTotalPurchases")) document.getElementById("finTotalPurchases").textContent = "Rs " + totalPurchases.toFixed(2);
  if(document.getElementById("finTotalExpenses")) document.getElementById("finTotalExpenses").textContent = "Rs " + totalExpenses.toFixed(2);
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

// Initial Sync & Boot Execution
renderProducts();
checkUserSession();
fetchAdminSummaryFromSheet();