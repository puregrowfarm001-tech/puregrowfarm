const farmEmail = "puregrowfarm001@gmail.com";
const farmWhatsapp = "919067891039";
const farmUpiId = "sohamgajera01@okhdfcbank";
const farmName = "Pure Grow Farm";

// YAHAN APNA COPY KIYA HUA WEB APP URL DALEIN
const SHEET_URL = "https://script.google.com/macros/s/AKfycbygMDC4TecN3eXRy-HFi2mjqRW3UTgmua-JwHUpaY6WJ4_Y8OyjxV2m6Zvc2GRL-xzC/exec";
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

let usersDatabase = JSON.parse(localStorage.getItem('pgf_user_db')) || [];
let orderRegistry = JSON.parse(localStorage.getItem('pgf_orders')) || [];
let bookingsRegistry = JSON.parse(localStorage.getItem('pgf_bookings')) || [];
let expensesRegistry = JSON.parse(localStorage.getItem('pgf_expenses')) || [];
let salesRegistry = JSON.parse(localStorage.getItem('pgf_sales')) || [];
let purchasesRegistry = JSON.parse(localStorage.getItem('pgf_purchases')) || [];

let currentUser = JSON.parse(localStorage.getItem('pgf_session')) || null;

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
  try { 
    await fetch(SHEET_URL, { 
      method: "POST", 
      mode: "no-cors", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify(payload) 
    }); 
  } catch(e) {
    console.log("Error saving to Excel sheet:", e);
  }
}

async function fetchLiveDataFromSheet() {
  try {
    const response = await fetch(SHEET_URL);
    const data = await response.json();
    
    if (data.orders) { orderRegistry = data.orders; localStorage.setItem('pgf_orders', JSON.stringify(orderRegistry)); }
    if (data.visits) { bookingsRegistry = data.visits; localStorage.setItem('pgf_bookings', JSON.stringify(bookingsRegistry)); }
    if (data.expenses) { expensesRegistry = data.expenses; localStorage.setItem('pgf_expenses', JSON.stringify(expensesRegistry)); }
    if (data.sales) { salesRegistry = data.sales; localStorage.setItem('pgf_sales', JSON.stringify(salesRegistry)); }
    if (data.purchases) { purchasesRegistry = data.purchases; localStorage.setItem('pgf_purchases', JSON.stringify(purchasesRegistry)); }
    if (data.users) { usersDatabase = data.users; localStorage.setItem('pgf_user_db', JSON.stringify(usersDatabase)); }

    if (currentUser && currentUser.isAdmin) {
      populateAdminDashboardTables();
      computeFinancialLedgerStatements();
    } else if (currentUser) {
      loadUserPanelData();
    }
  } catch (e) {
    console.log("Cloud Excel Sheet fetch fallback:", e);
  }
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
  fetchLiveDataFromSheet();
  populateAdminDashboardTables();
  computeFinancialLedgerStatements();
  switchSubAccountingTab('subTabExpense');
}

function exitAdminPanel() { handleLogout(); }

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

      fetchLiveDataFromSheet();
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

  if (userInput === ADMIN_CREDENTIALS.user && passInput === ADMIN_CREDENTIALS.pass) {
    currentUser = { name: "System Admin", email: "admin@puregrowfarm.internal", isAdmin: true };
    localStorage.setItem('pgf_session', JSON.stringify(currentUser));
    checkUserSession();
    return;
  }

  await fetchLiveDataFromSheet();

  const match = usersDatabase.find(u => (u.email && u.email.toLowerCase() === userInput.toLowerCase()) || (u.phone && u.phone === userInput));
  if (match && match.password === passInput) {
    currentUser = { name: match.name, email: match.email, phone: match.phone, isAdmin: false };
    localStorage.setItem('pgf_session', JSON.stringify(currentUser));
    checkUserSession();
  } else {
    alert("❌ Error: Credentials Galat Hain ya Account Exist Nahi Karta!");
  }
}

function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById("regName").value.trim();
  const phone = document.getElementById("regPhone").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;

  const existing = usersDatabase.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
  if(existing) {
    alert("❌ Error: Is Email ID se account pehle se bana hua hai!");
    return;
  }

  const newUser = { type: "user", name, phone, email, password };
  usersDatabase.push(newUser);
  localStorage.setItem('pgf_user_db', JSON.stringify(usersDatabase));
  saveToSheet(newUser);

  currentUser = { name, email, phone, isAdmin: false };
  localStorage.setItem('pgf_session', JSON.stringify(currentUser));
  alert("🎉 Account Successfully Register Ho Gaya!");
  checkUserSession();
}

function handleForgotPassword(e) {
  e.preventDefault();
  const emailInput = document.getElementById("forgotEmail").value.trim();
  window.open(`https://wa.me/${farmWhatsapp}?text=Password Help Request for: ${emailInput}`, '_blank');
}

function handleLogout() {
  currentUser = null;
  localStorage.removeItem('pgf_session');
  checkUserSession();
}

function loadUserPanelData() {
  const oList = document.getElementById("userOrdersList");
  const bList = document.getElementById("userBookingsList");
  const historyCertWrapper = document.getElementById("historyCertificateWrapper");
  const historyCertContainer = document.getElementById("historyCertificatesContainer");
  
  const myOrders = orderRegistry.filter(o => o.phone === currentUser.phone || o.email === currentUser.email);
  const myBookings = bookingsRegistry.filter(b => b.phone === currentUser.phone || b.email === currentUser.email);

  oList.innerHTML = myOrders.length ? myOrders.map(o => {
    let statusColor = o.status === 'Approved' ? 'var(--accent)' : (o.status && o.status.startsWith('Rejected') ? 'var(--danger)' : 'var(--warn)');
    return `
      <div class="data-item-card">
        <strong>Order ID: ${o.orderId}</strong><br>
        <small>Date Received: ${o.dateLogged}</small><br>
        <span>Items: ${o.products}</span><br>
        <strong>Total: Rs ${o.total} [<span style="color:${statusColor}; font-weight:bold;">${o.status}</span>]</strong>
      </div>
    `;
  }).join("") : "Is profile ke liye koi active orders nahi hain.";

  bList.innerHTML = myBookings.length ? myBookings.map(b => {
    let statusColor = b.status === 'Approved' ? 'var(--accent)' : (b.status && b.status.startsWith('Rejected') ? 'var(--danger)' : 'var(--warn)');
    return `
      <div class="data-item-card">
        <strong>Booking ID: ${b.bookingId}</strong><br>
        <small>Booked On: ${b.dateLogged}</small><br>
        <strong>Scheme: ${b.type} Visit [<span style="color:${statusColor}; font-weight:bold;">${b.status}</span>]</strong>
      </div>
    `;
  }).join("") : "Koi training/internship application register nahi hai.";

  const approvedBookings = myBookings.filter(b => b.status === "Approved");

  if (approvedBookings.length > 0) {
    let historyCertHtml = "";

    approvedBookings.forEach((b) => {
      const titleText = b.type === "Student" ? "Certificate of Internship" : "Certificate of Farming";
      
      historyCertHtml += `
        <div style="padding: 10px; background: #fff; border: 1px solid var(--line); border-radius: 8px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
          <div>
            <span style="font-weight: bold; font-size:13px; color: var(--accent);">${titleText}</span><br>
            <small class="muted">Ref ID: ${b.bookingId}</small>
          </div>
          <button type="button" class="btn" style="min-height:30px; padding: 4px 10px; font-size:12px;" onclick="downloadCertificatePDF('${b.bookingId}')">📥 Download PDF</button>
        </div>
      `;
    });
    
    historyCertContainer.innerHTML = historyCertHtml;
    historyCertWrapper.style.display = "block";
  } else {
    historyCertWrapper.style.display = "none";
  }
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

function deleteUserAccount(idx) {
  if (confirm(`Kya aap sach me ${usersDatabase[idx].name} ka account delete karna chahte hain?`)) {
    usersDatabase.splice(idx, 1);
    localStorage.setItem('pgf_user_db', JSON.stringify(usersDatabase));
    alert("🗑️ Account delete ho gaya!");
    populateAdminDashboardTables();
  }
}

function populateAdminDashboardTables() {
  document.getElementById("adminOrdersTableBody").innerHTML = orderRegistry.map((o, idx) => `
    <tr>
      <td><strong>${o.orderId}</strong></td>
      <td>${o.name}</td>
      <td>${o.phone}</td>
      <td>${o.address}</td>
      <td>${o.products}</td>
      <td>Rs ${o.total}</td>
      <td><code>${o.txnId}</code></td>
      <td><strong>${o.dateLogged}</strong></td>
      <td><span class="badge ${o.status==='Approved'?'badge-confirmed':'badge-pending'}" style="${o.status && o.status.startsWith('Rejected')?'background:#fee2e2; color:var(--danger);':''}" >${o.status}</span></td>
      <td>
        ${o.status === 'Pending Verification' ? `
          <button class="btn" style="padding:4px 8px; min-height:auto; background:var(--accent); margin-right:4px;" onclick="approveCustomerOrder(${idx})">Approve</button>
          <button class="btn" style="padding:4px 8px; min-height:auto; background:var(--danger);" onclick="rejectCustomerOrder(${idx})">Reject</button>
        ` : `<span style="font-weight:bold;">Resolved</span>`}
      </td>
    </tr>
  `).join("");

  document.getElementById("adminBookingsTableBody").innerHTML = bookingsRegistry.map((b, idx) => `
    <tr>
      <td><strong>${b.bookingId}</strong></td>
      <td>${b.type}</td>
      <td>${b.name}</td>
      <td>${b.phone}</td>
      <td><strong>${b.date || b.start}</strong></td>
      <td><code>${b.txnId}</code></td>
      <td><strong>${b.dateLogged}</strong></td>
      <td><span class="badge ${b.status==='Approved'?'badge-confirmed':'badge-pending'}" style="${b.status && b.status.startsWith('Rejected')?'background:#fee2e2; color:var(--danger);':''}" >${b.status}</span></td>
      <td>
        ${b.status === 'Pending Verification' ? `
          <button class="btn" style="padding:4px 8px; min-height:auto; background:var(--accent); margin-right:4px;" onclick="approveTrainingBooking(${idx})">Approve</button>
          <button class="btn" style="padding:4px 8px; min-height:auto; background:var(--danger);" onclick="rejectTrainingBooking(${idx})">Reject</button>
        ` : `<span style="font-weight:bold;">Resolved</span>`}
      </td>
      <td>
        ${b.status === 'Approved' ? `
          <button type="button" class="btn" style="padding:4px 8px; min-height:auto; font-size:12px; background:var(--accent);" onclick="downloadCertificatePDF('${b.bookingId}')">📜 Certificate</button>
        ` : `<span class="muted" style="font-size:12px;">Not Approved Yet</span>`}
      </td>
    </tr>
  `).join("");

  document.getElementById("adminUsersTableBody").innerHTML = usersDatabase.map((u, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td><strong>${u.name}</strong></td>
      <td>${u.phone}</td>
      <td><code>${u.email}</code></td>
      <td><mark style="background:#f3f4f6; padding:2px 4px; border-radius:4px;">${u.password}</mark></td>
      <td>
        <button class="btn" style="padding:4px 8px; min-height:auto; background:var(--danger);" onclick="deleteUserAccount(${idx})">Delete Account</button>
      </td>
    </tr>
  `).join("");
}

function approveCustomerOrder(idx) {
  orderRegistry[idx].status = "Approved";
  localStorage.setItem('pgf_orders', JSON.stringify(orderRegistry));
  saveToSheet({ type: "order", action: "updateStatus", orderId: orderRegistry[idx].orderId, status: "Approved" });
  alert("Order Approved Ho Gaya!");
  populateAdminDashboardTables();
  computeFinancialLedgerStatements();
}

function rejectCustomerOrder(idx) {
  let reason = prompt("Reject karne ka reason likhein:");
  if(reason === null) return;
  if(reason.trim() === "") reason = "Not specified by farm admin";
  
  orderRegistry[idx].status = `Rejected (Reason: ${reason})`;
  localStorage.setItem('pgf_orders', JSON.stringify(orderRegistry));
  saveToSheet({ type: "order", action: "updateStatus", orderId: orderRegistry[idx].orderId, status: orderRegistry[idx].status });
  alert("Order Reject Ho Gaya!");
  populateAdminDashboardTables();
  computeFinancialLedgerStatements();
}

function approveTrainingBooking(idx) {
  bookingsRegistry[idx].status = "Approved";
  bookingsRegistry[idx].approvedDate = new Date().toLocaleDateString();
  localStorage.setItem('pgf_bookings', JSON.stringify(bookingsRegistry));
  
  saveToSheet({ 
    type: "visit", 
    action: "updateStatus", 
    bookingId: bookingsRegistry[idx].bookingId, 
    status: "Approved", 
    approvedDate: bookingsRegistry[idx].approvedDate 
  });

  const target = bookingsRegistry[idx];
  const saleLog = { 
    type: "sale",
    saleId: "SALE-" + Date.now().toString().slice(-4),
    product: `Training Entry: ${target.type} Program`, 
    collector: "Farm", 
    buyer: target.name, 
    phone: target.phone || "N/A",
    address: "Pure Grow Farm Campus Training Workshop",
    qty: 1, 
    rate: Number(target.fee), 
    total: Number(target.fee), 
    date: new Date().toLocaleDateString() 
  };
  salesRegistry.push(saleLog);
  localStorage.setItem('pgf_sales', JSON.stringify(salesRegistry));
  saveToSheet(saleLog);
  
  alert("Booking Approved Ho Gayi!");
  populateAdminDashboardTables();
  computeFinancialLedgerStatements();
}

function rejectTrainingBooking(idx) {
  let reason = prompt("Reject karne ka reason likhein:");
  if(reason === null) return;
  if(reason.trim() === "") reason = "Not specified by farm admin";
  
  bookingsRegistry[idx].status = `Rejected (Reason: ${reason})`;
  localStorage.setItem('pgf_bookings', JSON.stringify(bookingsRegistry));
  saveToSheet({ type: "visit", action: "updateStatus", bookingId: bookingsRegistry[idx].bookingId, status: bookingsRegistry[idx].status });
  alert("Booking Reject Ho Gayi!");
  populateAdminDashboardTables();
  computeFinancialLedgerStatements();
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
  expensesRegistry.forEach(e => { if(cashBalances[e.payer] !== undefined) cashBalances[e.payer] -= Number(e.amount || 0); });
  purchasesRegistry.forEach(p => { if(cashBalances[p.funder] !== undefined) cashBalances[p.funder] -= Number(p.total || 0); });

  document.getElementById("cashSoham").textContent = "Rs " + cashBalances.Soham.toFixed(2);
  document.getElementById("cashJeet").textContent = "Rs " + cashBalances.Jeet.toFixed(2);
  document.getElementById("cashFarm").textContent = "Rs " + cashBalances.Farm.toFixed(2);

  const expRows = expensesRegistry.filter(e => e.category !== "Damage Received");
  document.getElementById("subExpenseTableBody").innerHTML = expRows.map(e => `
    <tr><td>${e.date}</td><td>${e.category}</td><td>${e.payer}</td><td>${e.desc}</td><td style="color:var(--warn); font-weight:bold;">Rs ${e.amount}</td></tr>
  `).join("");

  document.getElementById("subSellTableBody").innerHTML = salesRegistry.map(s => `
    <tr>
      <td>${s.date}</td>
      <td>${s.product}</td>
      <td>${s.buyer}</td>
      <td>${s.phone || 'N/A'}</td>
      <td>${s.qty}</td>
      <td style="color:var(--accent); font-weight:bold;">Rs ${s.total}</td>
      <td><button type="button" class="btn" style="padding:2px 6px; min-height:auto; font-size:11px;" onclick="downloadOfflineSaleInvoice('${s.saleId}')">Receipt</button></td>
    </tr>
  `).join("");

  document.getElementById("subBuyTableBody").innerHTML = purchasesRegistry.map(p => `
    <tr><td>${p.date}</td><td>${p.product}</td><td>${p.vendor}</td><td>${p.qty}</td><td style="color:var(--danger); font-weight:bold;">Rs ${p.total}</td></tr>
  `).join("");

  const dmgRows = expensesRegistry.filter(e => e.category === "Damage Received");
  document.getElementById("subDamageTableBody").innerHTML = dmgRows.map(d => `
    <tr><td>${d.date}</td><td>${d.desc}</td><td>${d.payer}</td><td style="color:var(--danger); font-weight:bold;">Rs ${d.amount}</td></tr>
  `).join("");
}

function saveAdminExpense(e) {
  e.preventDefault();
  const rawDate = document.getElementById("expLogDate").value;
  const data = {
    type: "expense",
    expId: "EXP-" + Date.now().toString().slice(-4),
    date: rawDate ? new Date(rawDate).toLocaleDateString() : new Date().toLocaleDateString(),
    category: document.getElementById("expCategory").value,
    payer: document.getElementById("expPayer").value,
    mode: document.getElementById("expMode").value,
    desc: document.getElementById("expDesc").value.trim(),
    amount: parseFloat(document.getElementById("expAmount").value)
  };
  expensesRegistry.push(data);
  localStorage.setItem('pgf_expenses', JSON.stringify(expensesRegistry));
  saveToSheet(data);
  e.target.reset();
  initDefaultDatePickers();
  computeFinancialLedgerStatements();
}

function saveAdminSale(e) {
  e.preventDefault();
  const rawDate = document.getElementById("saleLogDate").value;
  const qty = parseFloat(document.getElementById("saleQty").value);
  const rate = parseFloat(document.getElementById("saleRate").value);

  const data = {
    type: "sale",
    saleId: "SALE-" + Date.now().toString().slice(-4),
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

  salesRegistry.push(data);
  localStorage.setItem('pgf_sales', JSON.stringify(salesRegistry));
  saveToSheet(data);
  e.target.reset();
  initDefaultDatePickers();
  computeFinancialLedgerStatements();
}

function saveAdminPurchase(e) {
  e.preventDefault();
  const rawDate = document.getElementById("purLogDate").value;
  const qty = parseFloat(document.getElementById("purQty").value);
  const rate = parseFloat(document.getElementById("purRate").value);
  
  const data = {
    type: "purchase",
    purId: "PUR-" + Date.now().toString().slice(-4),
    date: rawDate ? new Date(rawDate).toLocaleDateString() : new Date().toLocaleDateString(),
    product: document.getElementById("purProduct").value,
    funder: document.getElementById("purFunder").value,
    vendor: document.getElementById("purVendor").value.trim(),
    qty: qty,
    rate: rate,
    total: qty * rate
  };

  purchasesRegistry.push(data);
  localStorage.setItem('pgf_purchases', JSON.stringify(purchasesRegistry));
  saveToSheet(data);
  e.target.reset();
  initDefaultDatePickers();
  computeFinancialLedgerStatements();
}

function saveAdminDamage(e) {
  e.preventDefault();
  const rawDate = document.getElementById("dmgLogDate").value;
  const data = {
    type: "expense",
    expId: "DMG-" + Date.now().toString().slice(-4),
    date: rawDate ? new Date(rawDate).toLocaleDateString() : new Date().toLocaleDateString(),
    category: "Damage Received",
    payer: document.getElementById("dmgPayer").value,
    mode: "Internal Allocation",
    desc: document.getElementById("dmgDesc").value.trim(),
    amount: parseFloat(document.getElementById("dmgAmount").value)
  };
  expensesRegistry.push(data);
  localStorage.setItem('pgf_expenses', JSON.stringify(expensesRegistry));
  saveToSheet(data);
  e.target.reset();
  initDefaultDatePickers();
  computeFinancialLedgerStatements();
}

function confirmOrder(e) {
  e.preventDefault();
  const bill = getTotals();
  const currentTimestamp = new Date().toLocaleString();
  const generatedOrderId = "PGF-INV-" + Date.now().toString().slice(-5);

  const data = {
    type: "order",
    orderId: generatedOrderId,
    name: currentUser.name,
    phone: currentUser.phone,
    address: document.getElementById("address").value.trim(),
    products: [...cart.values()].map(i => `${i.name} [x${i.qty}]`).join(", "),
    total: bill.total,
    txnId: document.getElementById("paymentId").value.trim(),
    dateLogged: currentTimestamp,
    status: "Pending Verification"
  };

  orderRegistry.unshift(data);
  localStorage.setItem('pgf_orders', JSON.stringify(orderRegistry));
  
  saveToSheet(data);
  
  const waMessage = `NEW GOODS ORDER VERIFICATION FLOW:\n----------------------------------------\nInvoice Ref Code: ${data.orderId}\nClient Name: ${data.name}\nProducts: ${data.products}\nTotal Paid Amount: Rs ${data.total}\nPayment Method: ${document.getElementById("paymentMode").value}\nTransaction ID: ${data.txnId}\n----------------------------------------`;
  
  alert("Order Placed! Opening WhatsApp Verification.");
  window.open(`https://wa.me/${farmWhatsapp}?text=${encodeURIComponent(waMessage)}`, '_blank');
  
  cart.clear();
  renderCart();
  document.getElementById("orderForm").reset();
  checkUserSession();
}

function submitStudentVisit(e) {
  e.preventDefault();
  const data = {
    type: "visit",
    bookingId: "PGF-STU-" + Date.now().toString().slice(-4),
    type: "Student",
    name: currentUser.name,
    phone: currentUser.phone,
    date: document.getElementById("sstart").value,
    fee: 100,
    txnId: document.getElementById("spayment").value.trim(),
    dateLogged: new Date().toLocaleString(),
    status: "Pending Verification",
    approvedDate: ""
  };
  bookingsRegistry.unshift(data);
  localStorage.setItem('pgf_bookings', JSON.stringify(bookingsRegistry));
  saveToSheet(data);

  const waText = `NEW STUDENT INTERNSHIP REGISTRATION:\n----------------------------------------\nBooking Ref ID: ${data.bookingId}\nName: ${data.name}\nUTR Number: ${data.txnId}\n----------------------------------------`;
  window.open(`https://wa.me/${farmWhatsapp}?text=${encodeURIComponent(waText)}`, '_blank');
  
  document.getElementById("studentForm").reset();
  document.getElementById("spayment").disabled = true;
  checkUserSession();
}

function submitFarmerVisit(e) {
  e.preventDefault();
  const data = {
    type: "visit",
    bookingId: "PGF-FAR-" + Date.now().toString().slice(-4),
    type: "Farmer",
    name: currentUser.name,
    phone: currentUser.phone,
    date: document.getElementById("fdate").value,
    fee: 699,
    txnId: document.getElementById("fpayment").value.trim(),
    dateLogged: new Date().toLocaleString(),
    status: "Pending Verification",
    approvedDate: ""
  };
  bookingsRegistry.unshift(data);
  localStorage.setItem('pgf_bookings', JSON.stringify(bookingsRegistry));
  saveToSheet(data);

  const waText = `NEW FARMER TRAINING BOOKING:\n----------------------------------------\nBooking Ref ID: ${data.bookingId}\nName: ${data.name}\nUTR Number: ${data.txnId}\n----------------------------------------`;
  window.open(`https://wa.me/${farmWhatsapp}?text=${encodeURIComponent(waText)}`, '_blank');
  
  document.getElementById("farmerForm").reset();
  document.getElementById("fpayment").disabled = true;
  checkUserSession();
}

renderProducts();
checkUserSession();