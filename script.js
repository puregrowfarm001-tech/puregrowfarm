// =========================================================
// SUPABASE CLIENT CONNECTED
// =========================================================
const SUPABASE_URL = "https://ihxwurfxutwzpheptjkh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloeHd1cmZ4dXR3enBoZXB0amtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4NTI1OTQsImV4cCI6MjEwMTQyODU5NH0.8LHaFC4LH2Z4CMgorGrDcXewNKcznww0PX0dOzqRvEE";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const farmEmail = "puregrowfarm001@gmail.com";
const farmWhatsapp = "919067891039";
const farmUpiId = "sohamgajera01@okhdfcbank";
const farmName = "Pure Grow Farm";

const SHEET_URL = "https://script.google.com/macros/s/AKfycbyg8zhosR2maS7Sgz8j0Kr58JXCEWgqfXvTFgMEO_XP7cAjyw3vlHTsNZr5GJbDq1vs/exec";
const ADMIN_CREDENTIALS = { user: "admin", pass: "PureGrow@2026" };

const products = [
  { id: 1, name: "Fresh Green Oyster Mushroom", price: 180, unit: "1kg", image: "mushroom/Screenshot 2025-10-24 154001.png", detail: "Picked fresh, chilled and delivered within 24-48 hours.", type: "green", available: true },
  { id: 2, name: "Dried Oyster Mushroom", price: 800, unit: "1kg pack", image: "mushroom/oyst dry.webp", detail: "Slow-dried to preserve flavor and nutrients.", type: "dry", available: true },
  { id: 3, name: "Oyster Mushroom Powder", price: 130, unit: "100gm pack", image: "mushroom/oyster powder.png", detail: "Mushroom powder for soup, 1kg pack curry, health mix and snacks.", type: "powder", available: true },
  { id: 4, name: "Methi Mushroom Khakhra", price: 70, unit: "200gm pack", image: "Methi khakhra 2.png", detail: "Crispy khakhra prepared with oyster mushroom powder.", type: "khakhra", available: true },
  { id: 5, name: "Adad Mushroom Papad", price: 120, unit: "1 pack", image: "mushroom/bulk.png", detail: "Papad enriched with mushroom nutrition.", type: "papad", available: true },
  { id: 6, name: "Bulk and Wholesale Supply", price: 0, unit: "Custom", bulk: true, image: "mushroom/bulk.png", detail: "Supply for restaurants, retailers and local markets.", available: true }
];

const cart = new Map();

let currentInventoryStock = JSON.parse(localStorage.getItem('pgf_stock_counters')) || { dry: 150, khakhra: 85, papad: 120 };
let usersDatabase = [];
let orderRegistry = [];
let bookingsRegistry = [];
let expensesRegistry = [];
let salesRegistry = [];
let purchasesRegistry = [];

let currentUser = JSON.parse(localStorage.getItem('pgf_session')) || null;
let latestInvoice = "";
let latestVisitInvoice = "";

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

async function saveToSheet(payload) {
  try { await fetch(SHEET_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); } catch(e) {}
}

function updateStockDisplayCounters() {
  localStorage.setItem('pgf_stock_counters', JSON.stringify(currentInventoryStock));
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
  fetchAdminDataFromSupabase();
  switchSubAccountingTab('subTabExpense');
}

function exitAdminPanel() { handleLogout(); }

async function checkUserSession() {
  updateStockDisplayCounters();
  
  // Supabase live session check
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session || currentUser) {
    if(session) {
      currentUser = {
        name: session.user.user_metadata.full_name || "Grower",
        email: session.user.email,
        phone: session.user.user_metadata.phone || "",
        isAdmin: session.user.email === "admin@puregrowfarm.internal"
      };
    }

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
  loginBtn.textContent = "Logging in...";

  const { data, error } = await supabase.auth.signInWithPassword({
    email: userInput,
    password: passInput
  });

  loginBtn.disabled = false;
  loginBtn.textContent = "Continue";

  if (error) {
    alert("❌ Error: " + error.message);
  } else {
    const user = data.user;
    currentUser = {
      name: user.user_metadata.full_name || "Grower",
      email: user.email,
      phone: user.user_metadata.phone || "",
      isAdmin: false
    };
    localStorage.setItem('pgf_session', JSON.stringify(currentUser));
    checkUserSession();
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
    currentUser = { name, email, phone, isAdmin: false };
    localStorage.setItem('pgf_session', JSON.stringify(currentUser));
    alert("🎉 Account Registered Successfully!");
    checkUserSession();
  }
}

function handleForgotPassword(e) {
  e.preventDefault();
  const emailInput = document.getElementById("forgotEmail").value.trim();
  window.open(`https://wa.me/${farmWhatsapp}?text=Password Assist Request for: ${emailInput}`, '_blank');
}

async function handleLogout() {
  await supabase.auth.signOut();
  currentUser = null;
  localStorage.removeItem('pgf_session');
  checkUserSession();
}

async function loadUserPanelData() {
  const oList = document.getElementById("userOrdersList");
  const bList = document.getElementById("userBookingsList");
  const historyCertWrapper = document.getElementById("historyCertificateWrapper");
  const historyCertContainer = document.getElementById("historyCertificatesContainer");
  
  // Supabase se live fetch
  const { data: myOrders } = await supabase.from("orders").select("*").eq("user_email", currentUser.email);
  const { data: myBookings } = await supabase.from("bookings").select("*").eq("user_email", currentUser.email);

  const ordersList = myOrders || [];
  const bookingsList = myBookings || [];

  oList.innerHTML = ordersList.length ? ordersList.map(o => {
    let statusColor = o.status === 'Approved' ? 'var(--accent)' : (o.status && o.status.startsWith('Rejected') ? 'var(--danger)' : 'var(--warn)');
    return `
      <div class="data-item-card">
        <strong>Order ID: ${o.order_id}</strong><br>
        <small>Date Received: ${o.date_logged}</small><br>
        <span>Items: ${o.products}</span><br>
        <strong>Total: Rs ${o.total} [<span style="color:${statusColor}; font-weight:bold;">${o.status}</span>]</strong>
      </div>
    `;
  }).join("") : "No active orders mapped for this profile index.";

  bList.innerHTML = bookingsList.length ? bookingsList.map(b => {
    let statusColor = b.status === 'Approved' ? 'var(--accent)' : (b.status && b.status.startsWith('Rejected') ? 'var(--danger)' : 'var(--warn)');
    return `
      <div class="data-item-card">
        <strong>Booking ID: ${b.booking_id}</strong><br>
        <small>Booked On: ${b.date_logged}</small><br>
        <strong>Scheme: ${b.type} Visit [<span style="color:${statusColor}; font-weight:bold;">${b.status}</span>]</strong>
      </div>
    `;
  }).join("") : "No course training applications logged.";

  const approvedBookings = bookingsList.filter(b => b.status === "Approved");

  if (approvedBookings.length > 0) {
    let historyCertHtml = "";

    approvedBookings.forEach((b) => {
      const titleText = b.type === "Student" ? "Certificate of Internship" : "Certificate of Farming";
      
      historyCertHtml += `
        <div style="padding: 10px; background: #fff; border: 1px solid var(--line); border-radius: 8px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
          <div>
            <span style="font-weight: bold; font-size:13px; color: var(--accent);">${titleText}</span><br>
            <small class="muted">Ref ID: ${b.booking_id}</small>
          </div>
          <button type="button" class="btn" style="min-height:30px; padding: 4px 10px; font-size:12px;" onclick="downloadCertificatePDF('${b.booking_id}')">📥 Download PDF</button>
        </div>
      `;
    });
    
    historyCertContainer.innerHTML = historyCertHtml;
    historyCertWrapper.style.display = "block";
  } else {
    historyCertWrapper.style.display = "none";
  }
}

async function fetchAdminDataFromSupabase() {
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
    document.getElementById(bId).style.background = 'var(--muted)';
  });
  
  let targetActiveButton = 'btn' + subTabId.charAt(0).toUpperCase() + subTabId.slice(1);
  document.getElementById(targetActiveButton).style.background = 'var(--accent)';
}

function populateAdminDashboardTables() {
  document.getElementById("adminOrdersTableBody").innerHTML = orderRegistry.map((o, idx) => `
    <tr>
      <td><strong>${o.order_id}</strong></td>
      <td>${o.name}</td>
      <td>${o.phone}</td>
      <td>${o.address}</td>
      <td>${o.products}</td>
      <td>Rs ${o.total}</td>
      <td><code>${o.txn_id}</code></td>
      <td><strong>${o.date_logged}</strong></td>
      <td><span class="badge ${o.status==='Approved'?'badge-confirmed':(o.status && o.status.startsWith('Rejected')?'badge-pending':'badge-pending')}">${o.status}</span></td>
      <td>
        ${o.status === 'Pending Verification' ? `
          <button class="btn" style="padding:4px 8px; min-height:auto; background:var(--accent); margin-right:4px;" onclick="approveCustomerOrder('${o.id}')">Approve</button>
          <button class="btn" style="padding:4px 8px; min-height:auto; background:var(--danger);" onclick="rejectCustomerOrder('${o.id}')">Reject</button>
        ` : `<span style="font-weight:bold;">Resolved</span>`}
      </td>
    </tr>
  `).join("");

  document.getElementById("adminBookingsTableBody").innerHTML = bookingsRegistry.map((b, idx) => `
    <tr>
      <td><strong>${b.booking_id}</strong></td>
      <td>${b.type}</td>
      <td>${b.name}</td>
      <td>${b.phone}</td>
      <td><strong>${b.date || b.start}</strong></td>
      <td><code>${b.txn_id}</code></td>
      <td><strong>${b.date_logged}</strong></td>
      <td><span class="badge ${b.status==='Approved'?'badge-confirmed':(b.status && b.status.startsWith('Rejected')?'badge-pending':'badge-pending')}">${b.status}</span></td>
      <td>
        ${b.status === 'Pending Verification' ? `
          <button class="btn" style="padding:4px 8px; min-height:auto; background:var(--accent); margin-right:4px;" onclick="approveTrainingBooking('${b.id}')">Approve</button>
          <button class="btn" style="padding:4px 8px; min-height:auto; background:var(--danger);" onclick="rejectTrainingBooking('${b.id}')">Reject</button>
        ` : `<span style="font-weight:bold;">Resolved</span>`}
      </td>
      <td>
        ${b.status === 'Approved' ? `
          <button type="button" class="btn" style="padding:4px 8px; min-height:auto; font-size:12px; background:var(--accent);" onclick="downloadCertificatePDF('${b.booking_id}')">📜 Certificate</button>
        ` : `<span class="muted" style="font-size:12px;">Not Approved Yet</span>`}
      </td>
    </tr>
  `).join("");
}

async function approveCustomerOrder(id) {
  await supabase.from("orders").update({ status: "Approved" }).eq("id", id);
  alert("Order Marked Approved!");
  fetchAdminDataFromSupabase();
}

async function rejectCustomerOrder(id) {
  let reason = prompt("Reject karne ka reason likhein:");
  if(reason === null) return;
  if(reason.trim() === "") reason = "Not specified by farm admin";
  
  await supabase.from("orders").update({ status: `Rejected (Reason: ${reason})` }).eq("id", id);
  alert("Order Marked Rejected!");
  fetchAdminDataFromSupabase();
}

async function approveTrainingBooking(id) {
  const target = bookingsRegistry.find(b => b.id == id);
  await supabase.from("bookings").update({ status: "Approved", approved_date: new Date().toLocaleDateString() }).eq("id", id);
  
  if(target) {
    const saleLog = { 
      sale_id: "SALE-" + Date.now().toString().slice(-4),
      product: `Training Entry: ${target.type} Program`, 
      collector: "Farm", 
      buyer: target.name, 
      phone: target.phone || "N/A",
      address: "Pure Grow Farm Campus Training Workshop",
      qty: 1, 
      rate: target.fee, 
      total: target.fee, 
      date: new Date().toLocaleDateString() 
    };
    await supabase.from("sales").insert([saleLog]);
  }

  alert("Booking Approved successfully!");
  fetchAdminDataFromSupabase();
}

async function rejectTrainingBooking(id) {
  let reason = prompt("Reject karne ka reason likhein:");
  if(reason === null) return;
  if(reason.trim() === "") reason = "Not specified by farm admin";
  
  await supabase.from("bookings").update({ status: `Rejected (Reason: ${reason})` }).eq("id", id);
  alert("Booking Marked Rejected!");
  fetchAdminDataFromSupabase();
}

function computeFinancialLedgerStatements() {
  const totalSales = salesRegistry.reduce((sum, s) => sum + Number(s.total || 0), 0);
  const totalPurchases = purchasesRegistry.reduce((sum, p) => sum + Number(p.total || 0), 0);
  const totalExpenses = expensesRegistry.filter(e => e.category !== "Damage Received").reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalDamages = expensesRegistry.filter(e => e.category === "Damage Received").reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const netProfit = totalSales - (totalPurchases + totalExpenses + totalDamages);

  document.getElementById("finTotalRevenue").textContent = "Rs " + totalSales.toFixed(2);
  document.getElementById("finTotalPurchases").textContent = "Rs " + totalPurchases.toFixed(2);
  document.getElementById("finTotalExpenses").textContent = "Rs " + totalExpenses.toFixed(2);
  document.getElementById("finNetProfit").textContent = "Rs " + netProfit.toFixed(2);

  let cashBalances = { Soham: 0, Jeet: 0, Farm: 0 };
  salesRegistry.forEach(s => { if(cashBalances[s.collector] !== undefined) cashBalances[s.collector] += Number(s.total || 0); });
  expensesRegistry.forEach(e => {
    if(cashBalances[e.payer] !== undefined) cashBalances[e.payer] -= Number(e.amount || 0);
  });
  purchasesRegistry.forEach(p => { if(cashBalances[p.funder] !== undefined) cashBalances[p.funder] -= Number(p.total || 0); });

  document.getElementById("cashSoham").textContent = "Rs " + cashBalances.Soham.toFixed(2);
  document.getElementById("cashJeet").textContent = "Rs " + cashBalances.Jeet.toFixed(2);
  document.getElementById("cashFarm").textContent = "Rs " + cashBalances.Farm.toFixed(2);

  const expRows = expensesRegistry.filter(e => e.category !== "Damage Received");
  document.getElementById("subExpenseTableBody").innerHTML = expRows.map(e => `
    <tr><td>${e.date}</td><td>${e.category}</td><td>${e.payer}</td><td>${e.description}</td><td style="color:var(--warn); font-weight:bold;">Rs ${e.amount}</td></tr>
  `).join("");

  document.getElementById("subSellTableBody").innerHTML = salesRegistry.map(s => `
    <tr>
      <td>${s.date}</td>
      <td>${s.product}</td>
      <td>${s.buyer}</td>
      <td>${s.phone || 'N/A'}</td>
      <td>${s.qty}</td>
      <td style="color:var(--accent); font-weight:bold;">Rs ${s.total}</td>
      <td><button type="button" class="btn" style="padding:2px 6px; min-height:auto; font-size:11px;" onclick="downloadOfflineSaleInvoice('${s.sale_id}')">Receipt</button></td>
    </tr>
  `).join("");

  document.getElementById("subBuyTableBody").innerHTML = purchasesRegistry.map(p => `
    <tr><td>${p.date}</td><td>${p.product}</td><td>${p.vendor}</td><td>${p.qty}</td><td style="color:var(--danger); font-weight:bold;">Rs ${p.total}</td></tr>
  `).join("");

  const dmgRows = expensesRegistry.filter(e => e.category === "Damage Received");
  document.getElementById("subDamageTableBody").innerHTML = dmgRows.map(d => `
    <tr><td>${d.date}</td><td>${d.description}</td><td>${d.payer}</td><td style="color:var(--danger); font-weight:bold;">Rs ${d.amount}</td></tr>
  `).join("");
}

async function saveAdminExpense(e) {
  e.preventDefault();
  const rawDate = document.getElementById("expLogDate").value;
  const data = {
    exp_id: "EXP-" + Date.now().toString().slice(-4),
    date: rawDate ? new Date(rawDate).toLocaleDateString() : new Date().toLocaleDateString(),
    category: document.getElementById("expCategory").value,
    payer: document.getElementById("expPayer").value,
    mode: document.getElementById("expMode").value,
    description: document.getElementById("expDesc").value.trim(),
    amount: parseFloat(document.getElementById("expAmount").value)
  };
  
  await supabase.from("expenses").insert([data]);
  e.target.reset();
  initDefaultDatePickers();
  fetchAdminDataFromSupabase();
}

async function saveAdminSale(e) {
  e.preventDefault();
  const rawDate = document.getElementById("saleLogDate").value;
  const qty = parseFloat(document.getElementById("saleQty").value);
  const rate = parseFloat(document.getElementById("saleRate").value);

  const data = {
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

  await supabase.from("sales").insert([data]);
  e.target.reset();
  initDefaultDatePickers();
  fetchAdminDataFromSupabase();
}

async function saveAdminPurchase(e) {
  e.preventDefault();
  const rawDate = document.getElementById("purLogDate").value;
  const qty = parseFloat(document.getElementById("purQty").value);
  const rate = parseFloat(document.getElementById("purRate").value);
  
  const data = {
    pur_id: "PUR-" + Date.now().toString().slice(-4),
    date: rawDate ? new Date(rawDate).toLocaleDateString() : new Date().toLocaleDateString(),
    product: document.getElementById("purProduct").value,
    funder: document.getElementById("purFunder").value,
    vendor: document.getElementById("purVendor").value.trim(),
    qty: qty,
    rate: rate,
    total: qty * rate
  };

  await supabase.from("purchases").insert([data]);
  e.target.reset();
  initDefaultDatePickers();
  fetchAdminDataFromSupabase();
}

async function saveAdminDamage(e) {
  e.preventDefault();
  const rawDate = document.getElementById("dmgLogDate").value;
  const data = {
    exp_id: "DMG-" + Date.now().toString().slice(-4),
    date: rawDate ? new Date(rawDate).toLocaleDateString() : new Date().toLocaleDateString(),
    category: "Damage Received",
    payer: document.getElementById("dmgPayer").value,
    mode: "Internal Allocation",
    description: document.getElementById("dmgDesc").value.trim(),
    amount: parseFloat(document.getElementById("dmgAmount").value)
  };

  await supabase.from("expenses").insert([data]);
  e.target.reset();
  initDefaultDatePickers();
  fetchAdminDataFromSupabase();
}

function downloadOfflineSaleInvoice(saleId) {
  const targetSale = salesRegistry.find(s => s.sale_id === saleId);
  if(!targetSale) return alert("Invoice not found.");
  
  document.getElementById("invNum").textContent = targetSale.sale_id;
  document.getElementById("invDate").textContent = targetSale.date;
  document.getElementById("invClientName").textContent = targetSale.buyer;
  document.getElementById("invClientEmail").textContent = "Phone Lines: " + (targetSale.phone || "N/A");
  document.getElementById("invClientAddr").textContent = "Shipping Address: " + (targetSale.address || "Direct Spot Distribution Counter");
  
  document.getElementById("invoiceTableItemsBody").innerHTML = `
    <tr>
      <td style="padding:12px 14px; border-bottom:1px solid #e6e9ec; font-weight: 600;">${targetSale.product} Lot Log Entry</td>
      <td style="padding:12px 14px; border-bottom:1px solid #e6e9ec; text-align:right;">Rs ${Number(targetSale.rate).toFixed(2)}</td>
      <td style="padding:12px 14px; border-bottom:1px solid #e6e9ec; text-align:center;">${targetSale.qty}</td>
      <td style="padding:12px 14px; border-bottom:1px solid #e6e9ec; text-align:right; font-weight:600; color:var(--accent);">Rs ${Number(targetSale.total).toFixed(2)}</td>
    </tr>
  `;
  
  document.getElementById("invSub").textContent = "Rs " + Number(targetSale.total).toFixed(2);
  document.getElementById("invTotal").textContent = "Rs " + Number(targetSale.total).toFixed(2);
  
  document.getElementById("invoiceDialog").showModal();
}

function renderProducts(list = products) {
  document.getElementById("productsList").innerHTML = list.map(product => `
    <article class="product">
      <img src="${product.image}" alt="${product.name}">
      <h3>${product.name}</h3>
      <p class="muted">${product.detail}</p>
      <div style="margin-bottom: 8px;">
        <span class="badge" style="background: #dcfce7; color: #166534; font-size:11px;">🟢 Status: Available</span>
      </div>
      <div style="margin-top:auto;">
        <div class="product-actions">
          <div class="pill">Rs ${product.price} / ${product.unit}</div>
          ${product.bulk ? `<button type="button" onclick="window.open('https://wa.me/${farmWhatsapp}')">Contact Bulk</button>` : `<button type="button" onclick="addToCart(${product.id})">Add Cart</button>`}
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
function minusCart(id) {
  const item = cart.get(id);
  if (!item) return;
  if (item.qty === 1) cart.delete(id);
  else cart.set(id, { ...item, qty: item.qty - 1 });
  renderCart();
}

function getTotals() {
  const subtotal = [...cart.values()].reduce((sum, item) => sum + (item.price * item.qty), 0);
  const delivery = subtotal > 0 ? (subtotal > 1000 ? 0 : 50) : 0;
  return { subtotal, delivery, total: subtotal + delivery };
}

function renderCart() {
  const bill = getTotals();
  document.getElementById("subtotal").textContent = `Rs ${bill.subtotal}`;
  document.getElementById("delivery").textContent = `Rs ${bill.delivery}`;
  document.getElementById("total").textContent = `Rs ${bill.total}`;

  if (!cart.size) { 
    document.getElementById("cartItems").innerHTML = `<p class="muted">Cart selection is empty.</p>`; 
    document.getElementById("paymentMode").value = "";
    document.getElementById("paymentId").value = "";
    document.getElementById("paymentId").disabled = true;
    document.getElementById("confirmOrderBtn").disabled = true;
    return; 
  }
  
  document.getElementById("cartItems").innerHTML = [...cart.values()].map(item => `
    <div class="cart-item">
      <div><strong>${item.name}</strong><br><span class="muted">Rs ${item.price} x ${item.qty}</span></div>
      <div class="qty-actions">
        <button type="button" onclick="minusCart(${item.id})">-</button>
        <button type="button" onclick="addToCart(${item.id})">+</button>
      </div>
    </div>
  `).join("");
  validateOrderForm();
}

function openProductPayment() {
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

function validateOrderForm() {
  const address = document.getElementById("address").value.trim();
  const mode = document.getElementById("paymentMode").value;
  const txnId = document.getElementById("paymentId").value.trim();
  
  const isValid = cart.size > 0 && address.length > 4 && mode !== "" && txnId.length >= 6;
  document.getElementById("confirmOrderBtn").disabled = !isValid;
}

if(document.getElementById("address")) {
  document.getElementById("address").addEventListener("input", validateOrderForm);
}

async function confirmOrder(e) {
  e.preventDefault();
  const bill = getTotals();
  const currentTimestamp = new Date().toLocaleString();
  const generatedOrderId = "PGF-INV-" + Date.now().toString().slice(-5);

  const data = {
    order_id: generatedOrderId,
    user_email: currentUser.email,
    name: currentUser.name,
    phone: currentUser.phone,
    email: currentUser.email,
    address: document.getElementById("address").value.trim(),
    products: [...cart.values()].map(i => `${i.name} [x${i.qty}]`).join(", "),
    total: bill.total,
    txn_id: document.getElementById("paymentId").value.trim(),
    date_logged: currentTimestamp,
    status: "Pending Verification"
  };

  await supabase.from("orders").insert([data]);
  
  document.getElementById("invNum").textContent = data.order_id;
  document.getElementById("invDate").textContent = new Date().toLocaleDateString();
  document.getElementById("invClientName").textContent = data.name;
  document.getElementById("invClientEmail").textContent = "Email: " + data.email + " | Ph: " + data.phone;
  document.getElementById("invClientAddr").textContent = "Address: " + data.address;
  
  document.getElementById("invoiceTableItemsBody").innerHTML = [...cart.values()].map(item => `
    <tr>
      <td style="padding:12px 14px; border-bottom:1px solid #e6e9ec; font-weight: 600;">${item.name} (${item.unit})</td>
      <td style="padding:12px 14px; border-bottom:1px solid #e6e9ec; text-align:right;">Rs ${item.price}</td>
      <td style="padding:12px 14px; border-bottom:1px solid #e6e9ec; text-align:center;">${item.qty}</td>
      <td style="padding:12px 14px; border-bottom:1px solid #e6e9ec; text-align:right; font-weight:600; color:var(--accent);">Rs ${item.price * item.qty}</td>
    </tr>
  `).join("");
  
  document.getElementById("invSub").textContent = "Rs " + bill.subtotal;
  document.getElementById("invTotal").textContent = "Rs " + bill.total;

  saveToSheet({ type: "order", ...data });
  
  const waMessage = `NEW GOODS ORDER VERIFICATION FLOW:\n----------------------------------------\nInvoice Ref Code: ${data.order_id}\nClient Legal Name: ${data.name}\nProducts Mapped: ${data.products}\nTotal Paid Amount: Rs ${data.total}\nPayment Method: ${document.getElementById("paymentMode").value}\nTransaction Hash ID Code: ${data.txn_id}\n----------------------------------------`;
  
  alert("Order authorized! Opening WhatsApp automation link channel framework.");
  window.open(`https://wa.me/${farmWhatsapp}?text=${encodeURIComponent(waMessage)}`, '_blank');
  
  document.getElementById("invoiceDialog").showModal();
  
  cart.clear();
  renderCart();
  document.getElementById("orderForm").reset();
  checkUserSession();
}

function closeInvoice() { document.getElementById("invoiceDialog").close(); }

function showVisitForm(id) {
  document.getElementById("studentForm").classList.remove("active");
  document.getElementById("farmerForm").classList.remove("active");
  document.getElementById(id).classList.add("active");
}

function openVisitUpi(amount, formId) {
  const helpId = formId === "studentForm" ? "studentPaymentHelp" : "farmerPaymentHelp";
  const txnInputId = formId === "studentForm" ? "spayment" : "fpayment";
  
  document.getElementById(helpId).style.display = "block";
  document.getElementById(helpId).textContent = `UPI app launched for program fee value factor Rs ${amount}.`;
  
  window.location.href = `upi://pay?pa=${encodeURIComponent(farmUpiId)}&pn=${encodeURIComponent(farmName)}&am=${amount}&cu=INR`;
  
  document.getElementById(txnInputId).disabled = false;
  if(formId === "studentForm") validateStudentForm();
  else validateFarmerForm();
}

function validateStudentForm() {
  const enroll = document.getElementById("senroll").value.trim();
  const college = document.getElementById("scollege").value.trim();
  const course = document.getElementById("scourse").value.trim();
  const start = document.getElementById("sstart").value;
  const end = document.getElementById("send").value;
  const txn = document.getElementById("spayment").value.trim();
  const isDisabled = document.getElementById("spayment").disabled;
  
  const isValid = !isDisabled && enroll !== "" && college !== "" && course !== "" && start !== "" && end !== "" && txn.length >= 6;
  document.getElementById("studentSubmitBtn").disabled = !isValid;
}

function validateFarmerForm() {
  const date = document.getElementById("fdate").value;
  const txn = document.getElementById("fpayment").value.trim();
  const isDisabled = document.getElementById("fpayment").disabled;
  
  const isValid = !isDisabled && date !== "" && txn.length >= 6;
  document.getElementById("farmerSubmitBtn").disabled = !isValid;
}

if(document.getElementById("studentForm")) {
  ['senroll', 'scollege', 'scourse', 'sstart', 'send'].forEach(id => {
    document.getElementById(id).addEventListener("input", validateStudentForm);
  });
}
if(document.getElementById("farmerForm")) {
  document.getElementById("fdate").addEventListener("input", validateFarmerForm);
}

async function submitStudentVisit(e) {
  e.preventDefault();
  const data = {
    booking_id: "PGF-STU-" + Date.now().toString().slice(-4),
    user_email: currentUser.email,
    type: "Student",
    name: currentUser.name,
    phone: currentUser.phone,
    email: currentUser.email,
    enrollment: document.getElementById("senroll").value,
    college: document.getElementById("scollege").value,
    course: document.getElementById("scourse").value,
    start: document.getElementById("sstart").value,
    end: document.getElementById("send").value,
    fee: 100,
    txn_id: document.getElementById("spayment").value.trim(),
    date_logged: new Date().toLocaleString(),
    status: "Pending Verification",
    approved_date: ""
  };
  
  await supabase.from("bookings").insert([data]);
  saveToSheet({ type: "visit", ...data });

  const waText = `NEW STUDENT INTERNSHIP REGISTRATION:\n----------------------------------------\nBooking Ref ID: ${data.booking_id}\nName: ${data.name}\nUTR Tracking Number: ${data.txn_id}\n----------------------------------------`;
  window.open(`https://wa.me/${farmWhatsapp}?text=${encodeURIComponent(waText)}`, '_blank');
  
  document.getElementById("studentForm").reset();
  document.getElementById("spayment").disabled = true;
  checkUserSession();
}

async function submitFarmerVisit(e) {
  e.preventDefault();
  const data = {
    booking_id: "PGF-FAR-" + Date.now().toString().slice(-4),
    user_email: currentUser.email,
    type: "Farmer",
    name: currentUser.name,
    phone: currentUser.phone,
    email: currentUser.email,
    date: document.getElementById("fdate").value,
    fee: 699,
    txn_id: document.getElementById("fpayment").value.trim(),
    date_logged: new Date().toLocaleString(),
    status: "Pending Verification",
    approved_date: ""
  };
  
  await supabase.from("bookings").insert([data]);
  saveToSheet({ type: "visit", ...data });

  const waText = `NEW FARMER TRAINING BOOKING:\n----------------------------------------\nBooking Ref ID: ${data.booking_id}\nName: ${data.name}\nUTR Tracking Number: ${data.txn_id}\n----------------------------------------`;
  window.open(`https://wa.me/${farmWhatsapp}?text=${encodeURIComponent(waText)}`, '_blank');
  
  document.getElementById("farmerForm").reset();
  document.getElementById("fpayment").disabled = true;
  checkUserSession();
}

if (document.getElementById("productSearch")) {
  document.getElementById("productSearch").addEventListener("input", function(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    const filteredProducts = products.filter(product => {
      return product.name.toLowerCase().includes(searchTerm) || 
             product.detail.toLowerCase().includes(searchTerm);
    });
    renderProducts(filteredProducts);
  });
}

function downloadCertificatePDF(bookingId) {
  const targetBooking = bookingsRegistry.find(b => b.booking_id === bookingId);
  if (!targetBooking) return alert("Certificate not found.");

  const titleText = targetBooking.type === "Student" ? "Certificate of Internship" : "Certificate of Farming";
  const descText = targetBooking.type === "Student" 
    ? `has successfully completed an internship program in Oyster Mushroom Cultivation at Pure Grow Mushroom Farm, at Makhiyala, Gujarat.`
    : `has successfully completed the practical farmer training framework module in Oyster Mushroom Cultivation at Pure Grow Mushroom Farm, at Makhiyala, Gujarat.`;
  
  const durationContent = targetBooking.type === "Student" 
    ? `from <strong>${targetBooking.start}</strong> to <strong>${targetBooking.end}</strong>`
    : `on target session date <strong>${targetBooking.date}</strong>`;

  const actualApprovedDate = targetBooking.approved_date ? targetBooking.approved_date : new Date(targetBooking.date_logged).toLocaleDateString();

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const priDoc = iframe.contentWindow.document;

  priDoc.open();
  priDoc.write(`
    <html>
      <head>
        <title>${titleText}</title>
        <style>
          @page { size: A4 landscape; margin: 8mm; }
          body { margin: 0; padding: 0; font-family: Arial, sans-serif; background: #fff; -webkit-print-color-adjust: exact; }
          .certificate-frame { width: 100%; max-width: 960px; background: #fff; border: 8px solid #1e4620; padding: 25px; box-sizing: border-box; text-align: center; color: #222; margin: 0 auto; }
          .inner-border { border: 2px solid #d97706; padding: 25px; background: #ffffff; }
          .cert-header-top { display: flex; justify-content: center; align-items: center; gap: 20px; }
          .cert-title { font-size: 32px; font-weight: bold; color: #1e4620; text-transform: uppercase; letter-spacing: 1px; font-family: 'Times New Roman', Times, serif; margin: 20px 0 10px 0; }
          .cert-name { font-size: 28px; font-weight: bold; color: #2b8a3e; border-bottom: 2px solid #d97706; display: inline-block; padding: 0 25px; margin: 10px auto; font-family: 'Times New Roman', Times, serif; }
          .cert-desc { font-size: 15px; line-height: 1.8; text-align: justify; margin: 20px auto; max-width: 800px; color: #222; }
          .cert-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 40px; padding: 0 10px; }
        </style>
      </head>
      <body>
        <div class="certificate-frame">
          <div class="inner-border">
            <div class="cert-header-top">
              <img src="mushroom/pgf logo.png" alt="Logo" style="width: 70px; height: auto;">
              <div style="text-align:left;">
                <h2 style="color: #1e4620; margin: 0; font-size: 24px; font-weight: 800;">PURE GROW MUSHROOM FARM</h2>
                <p style="margin: 3px 0 0 0; font-size: 13px; color:#6b7280;">Makhiyala, Gujarat, 362011 | puregrowfarm001@gmail.com</p>
              </div>
            </div>
            <hr style="border:0; border-top: 2px solid #2b8a3e; margin: 15px 0;">
            <div class="cert-title">${titleText}</div>
            <p style="font-style: italic; margin: 5px 0; color: #555; font-size: 15px;">This is to certify that</p>
            <div class="cert-name">${targetBooking.name.toUpperCase()}</div>
            <p style="font-style: italic; margin: 5px 0; color: #555; font-size: 15px;">${descText}</p>
            <p class="cert-desc">
              The program execution guidelines were conducted ${durationContent}. 
              During this framework index period, the candidate gained foundational knowledge in mushroom biology, substrate preparation, and crop management, demonstrating an excellent work ethic.
            </p>
            <div class="cert-footer">
              <div style="text-align: left; font-size: 14px; width: 30%;">
                <strong>Approved Date:</strong><br>
                <span style="display: inline-block; margin-top: 5px; color: #333; font-weight: 600;">${actualApprovedDate}</span>
              </div>
              <div style="text-align: center; width: 30%;">
                <img src="mushroom/pgf logo.png" alt="Pure Grow Farm Logo" style="width: 90px; height: auto; object-fit: contain;">
                <div style="font-size: 10px; font-weight: 800; color: #1e4620; margin-top: 5px; letter-spacing: 0.5px;">PURE GROW FARM</div>
              </div>
              <div style="text-align: center; width: 35%; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; padding-right: 20px; box-sizing: border-box;">
                <img src="mushroom/soham sign.png" alt="Soham Gajera Signature" style="width: 130px; height: auto; display: block; margin: 0 auto -15px auto; mix-blend-mode: multiply; z-index: 5;">
                <div style="border-top: 1px solid #333; width: 160px; margin: 0 auto 6px auto;"></div>
                <div style="font-size: 14px; font-weight: bold; color: #1e4620; line-height: 1.2;">Soham Gajera</div>
                <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">Authorized Signatory</div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `);
  priDoc.close();

  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => { document.body.removeChild(iframe); }, 1000);
  }, 500);
}

function printDivInvoice() {
  const printContents = document.getElementById('invoiceCaptureFrame').innerHTML;
  
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const priDoc = iframe.contentWindow.document;
  priDoc.open();
  priDoc.write(`
    <html>
      <head>
        <title>Pure Grow Farm - Invoice Printout</title>
        <style>
          body { font-family: sans-serif; padding: 20px; background: #fff; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 14px; }
          th, td { border: 1px solid #e6e9ec; padding: 12px 14px; text-align: left; }
          th { background: #2b8a3e !important; color: white !important; -webkit-print-color-adjust: exact; font-weight: bold; }
        </style>
      </head>
      <body>
        ${printContents}
      </body>
    </html>
  `);
  priDoc.close();
  
  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => { document.body.removeChild(iframe); }, 1000);
  }, 500);
}

renderProducts();
checkUserSession();