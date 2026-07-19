const farmEmail = "puregrowfarm001@gmail.com";
const farmWhatsapp = "919067891039";
const farmUpiId = "sohamgajera01@okhdfcbank";
const farmName = "Pure Grow Farm";

const SHEET_URL = "https://script.google.com/macros/s/AKfycbyg8zhosR2maS7Sgz8j0Kr58JXCEWgqfXvTFgMEO_XP7cAjyw3vlHTsNZr5GJbDq1vs/exec";
const ADMIN_CREDENTIALS = { user: "admin", pass: "PureGrow@2026" };

const products = [
  { id: 1, name: "Fresh Green Oyster Mushroom", price: 180, unit: "1kg", image: "mushroom/Screenshot 2025-10-24 154001.png", detail: "Picked fresh, chilled and delivered within 24-48 hours.", type: "green" },
  { id: 2, name: "Dried Oyster Mushroom", price: 800, unit: "1kg pack", image: "mushroom/oyst dry.webp", detail: "Slow-dried to preserve flavor and nutrients.", type: "dry" },
  { id: 3, name: "Oyster Mushroom Powder", price: 130, unit: "100gm pack", image: "mushroom/oyster powder.png", detail: "Mushroom powder for soup, curry, health mix and snacks.", type: "powder" },
  { id: 4, name: "Methi Mushroom Khakhra", price: 70, unit: "200gm pack", image: "Methi khakhra 2.png", detail: "Crispy khakhra prepared with oyster mushroom powder.", type: "khakhra" },
  { id: 5, name: "Adad Mushroom Papad", price: 120, unit: "1 pack", image: "mushroom/bulk.png", detail: "Papad enriched with mushroom nutrition.", type: "papad" },
  { id: 6, name: "Bulk and Wholesale Supply", price: 0, unit: "Custom", bulk: true, image: "mushroom/bulk.png", detail: "Supply for restaurants, retailers and local markets." }
];

const cart = new Map();

let currentInventoryStock = JSON.parse(localStorage.getItem('pgf_stock_counters')) || { dry: 150, khakhra: 85, papad: 120 };
let usersDatabase = JSON.parse(localStorage.getItem('pgf_user_db')) || [];
let orderRegistry = JSON.parse(localStorage.getItem('pgf_orders')) || [];
let bookingsRegistry = JSON.parse(localStorage.getItem('pgf_bookings')) || [];
let expensesRegistry = JSON.parse(localStorage.getItem('pgf_expenses')) || [];
let salesRegistry = JSON.parse(localStorage.getItem('pgf_sales')) || [];
let purchasesRegistry = JSON.parse(localStorage.getItem('pgf_purchases')) || [];

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
  populateAdminDashboardTables();
  computeFinancialLedgerStatements();
  switchSubAccountingTab('subTabExpense');
}

function exitAdminPanel() { handleLogout(); }

function checkUserSession() {
  updateStockDisplayCounters();
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

function handleLogin(e) {
  e.preventDefault();
  const userInput = document.getElementById("loginEmail").value.trim();
  const passInput = document.getElementById("loginPassword").value;

  if (userInput === ADMIN_CREDENTIALS.user && passInput === ADMIN_CREDENTIALS.pass) {
    currentUser = { name: "System Admin", email: "admin@puregrowfarm.internal", isAdmin: true };
    localStorage.setItem('pgf_session', JSON.stringify(currentUser));
    checkUserSession();
    return;
  }

  const match = usersDatabase.find(u => u.email.toLowerCase() === userInput.toLowerCase());
  if (match && match.password === passInput) {
    currentUser = { name: match.name, email: match.email, phone: match.phone, isAdmin: false };
    localStorage.setItem('pgf_session', JSON.stringify(currentUser));
    checkUserSession();
  } else {
    alert("❌ Error: Invalid credentials or Account does not exist!");
  }
}

function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById("regName").value.trim();
  const phone = document.getElementById("regPhone").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;

  const existing = usersDatabase.find(u => u.email.toLowerCase() === email.toLowerCase());
  if(existing) {
    alert("❌ Error: Is Email ID se account pehle se bana hua hai!");
    return;
  }

  const newUser = { name, phone, email, password };
  usersDatabase.push(newUser);
  localStorage.setItem('pgf_user_db', JSON.stringify(usersDatabase));
  currentUser = { name, email, phone, isAdmin: false };
  localStorage.setItem('pgf_session', JSON.stringify(currentUser));
  alert("🎉 Account Registered Successfully!");
  checkUserSession();
}

function handleForgotPassword(e) {
  e.preventDefault();
  const emailInput = document.getElementById("forgotEmail").value.trim();
  window.open(`https://wa.me/${farmWhatsapp}?text=Password Assist Request for: ${emailInput}`, '_blank');
}

function handleLogout() {
  currentUser = null;
  localStorage.removeItem('pgf_session');
  checkUserSession();
}

// BHOOL FIXED: Pura clean multi-certificate loop logic ready kiya hai stamp and custom signature image ke saath
function loadUserPanelData() {
  const oList = document.getElementById("userOrdersList");
  const bList = document.getElementById("userBookingsList");
  
  const myOrders = orderRegistry.filter(o => o.email === currentUser.email);
  const myBookings = bookingsRegistry.filter(b => b.email === currentUser.email);

  oList.innerHTML = myOrders.length ? myOrders.map(o => {
    let statusColor = o.status === 'Approved' ? 'var(--accent)' : (o.status.startsWith('Rejected') ? 'var(--danger)' : 'var(--warn)');
    return `
      <div class="data-item-card">
        <strong>Order ID: ${o.orderId}</strong><br>
        <small>Date Received: ${o.dateLogged}</small><br>
        <span>Items: ${o.products}</span><br>
        <strong>Total: Rs ${o.total} [<span style="color:${statusColor}; font-weight:bold;">${o.status}</span>]</strong>
      </div>
    `;
  }).join("") : "No active orders mapped for this profile index.";

  bList.innerHTML = myBookings.length ? myBookings.map(b => {
    let statusColor = b.status === 'Approved' ? 'var(--accent)' : (b.status.startsWith('Rejected') ? 'var(--danger)' : 'var(--warn)');
    return `
      <div class="data-item-card">
        <strong>Booking ID: ${b.bookingId}</strong><br>
        <small>Booked On: ${b.dateLogged}</small><br>
        <strong>Scheme: ${b.type} Visit [<span style="color:${statusColor}; font-weight:bold;">${b.status}</span>]</strong>
      </div>
    `;
  }).join("") : "No course training applications logged.";

  // Multiple Approved Certificates dynamic rendering block logic loops here loop matrix
  const approvedBookingsHtml = myBookings.filter(b => b.status === "Approved").map(b => {
    const titleText = b.type === "Student" ? "Certificate of Internship" : "Certificate of Farming";
    const descText = b.type === "Student" 
      ? `has successfully completed an internship program in Oyster Mushroom Cultivation at Pure Grow Mushroom Farm, at Makhiyala, Gujarat.`
      : `has successfully completed the practical farmer training framework module in Oyster Mushroom Cultivation at Pure Grow Mushroom Farm, at Makhiyala, Gujarat.`;
    
    const durationContent = b.type === "Student" 
      ? `from <span style="font-weight:bold; border-bottom:1px solid #333;">${b.start}</span> to <span style="font-weight:bold; border-bottom:1px solid #333;">${b.end}</span>`
      : `on target session date <span style="font-weight:bold; border-bottom:1px solid #333;">${b.date}</span>`;

    // BHOOL FIXED: Fetch exact actual approval date instead of showing invalid string tokens
    const actualApprovedDate = b.approvedDate ? b.approvedDate : new Date(b.dateLogged).toLocaleDateString();

    return `
      <div class="certificate-frame" style="width: 100%; max-width: 650px; background: #fff; border: 12px double #2b8a3e; padding: 30px; position: relative; text-align: center; color: #222; margin: 0 auto 20px auto; box-shadow:0 4px 12px rgba(0,0,0,0.05);">
        <div class="cert-header-top" style="display: flex; justify-content: center; align-items: center; gap: 15px;">
          <img src="mushroom/pgf logo.png" alt="Logo" style="width: 60px; height: auto;">
          <div style="text-align:left;">
            <h2 style="color: #1e4620; margin: 0; font-size: 22px; letter-spacing: 0.5px; font-weight: 800;">PURE GROW MUSHROOM FARM</h2>
            <p class="muted" style="margin: 3px 0 0 0; font-size: 12px;">Makhiyala, Gujarat, 362011 | puregrowfarm001@gmail.com</p>
          </div>
        </div>
        
        <hr style="border:1px solid #2b8a3e; margin:15px 0;">
        <div style="font-size: 26px; font-weight: bold; color: #1e4620; text-align: center; text-transform: uppercase; letter-spacing:0.5px;">${titleText}</div>
        <p style="text-align: center; font-style: italic; margin: 10px 0; color: #555;">This is to certify that</p>
        <div style="font-size: 24px; font-weight: bold; color: #2b8a3e; border-bottom: 2px solid #ddd; display: inline-block; padding: 0 30px; margin: 8px auto; text-align: center;">${b.name.toUpperCase()}</div>
        <p style="text-align: center; font-style: italic; margin: 15px 0; color: #555;">${descText}</p>
        
        <p style="font-size: 14px; line-height: 1.8; text-align: justify; margin: 20px auto; max-width: 580px; color: #222;">
          The program execution guidelines were conducted ${durationContent}. 
          During this framework index period, the candidate gained foundational knowledge in mushroom biology, substrate preparation, and crop management, demonstrating an excellent work ethic.
        </p>
        
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 35px; padding: 0 10px;">
          <div style="text-align: left; font-size: 13px;">
            <strong>Approved Date:</strong> <span>${actualApprovedDate}</span>
          </div>
          
          <!-- Original Circular Badge Frame Stamp with Center Farm Logo -->
          <div style="text-align: center; border: 3px double #1e4620; padding: 6px; border-radius: 50%; width: 115px; height: 115px; display: flex; flex-direction: column; justify-content: center; align-items: center; background: rgba(43,138,62,0.02); transform: rotate(-4deg); box-shadow: 0 0 4px rgba(26,58,30,0.15);">
            <span style="font-size: 8px; color: #1e4620; font-weight: 800; text-transform: uppercase; letter-spacing: 0.3px;">Pure Grow Farm</span>
            <img src="mushroom/pgf logo.png" alt="Stamp Logo" style="width: 32px; height: auto; margin: 2px 0; opacity: 0.85;">
            <span style="font-size: 8px; color: #1e4620; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase;">PARTNER</span>
          </div>

          <!-- BHOOL FIXED: Image signature element path linked nicely with multiply mix blend overlay -->
          <div style="text-align: right; width: 150px;">
            <img src="mushroom/soham sign.png" alt="Soham Gajera Signature" style="width: 125px; height: auto; display: block; margin: 0 auto 2px auto; mix-blend-mode: multiply;">
            <div style="border-top: 1px solid #333; padding-top: 4px; font-size: 12px; font-weight: bold; text-align: center;">Soham Gajera</div>
            <div style="font-size: 10px; color: var(--muted); text-align: center;">Authorized Signatory</div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  if (approvedBookingsHtml.length > 0) {
    document.getElementById("certificatesListGridContainer").innerHTML = approvedBookingsHtml;
    document.getElementById("userInlineCertificateSandbox").style.display = "block";
  } else {
    document.getElementById("userInlineCertificateSandbox").style.display = "none";
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
      <td><span class="badge ${o.status==='Approved'?'badge-confirmed':(o.status.startsWith('Rejected')?'badge-pending':'badge-pending')}" style="${o.status.startsWith('Rejected')?'background:#fee2e2; color:var(--danger);':''}" >${o.status}</span></td>
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
      <td><span class="badge ${b.status==='Approved'?'badge-confirmed':(b.status.startsWith('Rejected')?'badge-pending':'badge-pending')}" style="${b.status.startsWith('Rejected')?'background:#fee2e2; color:var(--danger);':''}" >${b.status}</span></td>
      <td>
        ${b.status === 'Pending Verification' ? `
          <button class="btn" style="padding:4px 8px; min-height:auto; background:var(--accent); margin-right:4px;" onclick="approveTrainingBooking(${idx})">Approve</button>
          <button class="btn" style="padding:4px 8px; min-height:auto; background:var(--danger);" onclick="rejectTrainingBooking(${idx})">Reject</button>
        ` : `<span style="font-weight:bold;">Resolved</span>`}
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
    </tr>
  `).join("");
}

function approveCustomerOrder(idx) {
  orderRegistry[idx].status = "Approved";
  localStorage.setItem('pgf_orders', JSON.stringify(orderRegistry));
  alert("Order Marked Approved!");
  populateAdminDashboardTables();
  computeFinancialLedgerStatements();
}

function rejectCustomerOrder(idx) {
  let reason = prompt("Reject karne ka reason likhein (Taki User ko pata chal sake):");
  if(reason === null) return;
  if(reason.trim() === "") reason = "Not specified by farm admin";
  
  orderRegistry[idx].status = `Rejected (Reason: ${reason})`;
  localStorage.setItem('pgf_orders', JSON.stringify(orderRegistry));
  alert("Order Marked Rejected!");
  populateAdminDashboardTables();
  computeFinancialLedgerStatements();
}

function approveTrainingBooking(idx) {
  bookingsRegistry[idx].status = "Approved";
  bookingsRegistry[idx].approvedDate = new Date().toLocaleDateString();
  localStorage.setItem('pgf_bookings', JSON.stringify(bookingsRegistry));
  const target = bookingsRegistry[idx];
  
  const saleLog = { 
    type: "sale", 
    product: `Training Entry: ${target.type} Program`, 
    collector: "Farm", 
    buyer: target.name, 
    qty: 1, 
    rate: target.fee, 
    total: target.fee, 
    date: new Date().toLocaleDateString() 
  };
  salesRegistry.push(saleLog);
  localStorage.setItem('pgf_sales', JSON.stringify(salesRegistry));
  
  alert("Booking Approved successfully!");
  populateAdminDashboardTables();
  computeFinancialLedgerStatements();
}

function rejectTrainingBooking(idx) {
  let reason = prompt("Reject karne ka reason likhein (Taki User ko pata chal sake):");
  if(reason === null) return;
  if(reason.trim() === "") reason = "Not specified by farm admin";
  
  bookingsRegistry[idx].status = `Rejected (Reason: ${reason})`;
  localStorage.setItem('pgf_bookings', JSON.stringify(bookingsRegistry));
  alert("Booking Marked Rejected!");
  populateAdminDashboardTables();
  computeFinancialLedgerStatements();
}

function computeFinancialLedgerStatements() {
  const totalSales = salesRegistry.reduce((sum, s) => sum + s.total, 0);
  const totalPurchases = purchasesRegistry.reduce((sum, p) => sum + p.total, 0);
  const totalExpenses = expensesRegistry.filter(e => e.category !== "Damage Received").reduce((sum, e) => sum + e.amount, 0);
  const totalDamages = expensesRegistry.filter(e => e.category === "Damage Received").reduce((sum, e) => sum + e.amount, 0);

  const netProfit = totalSales - (totalPurchases + totalExpenses + totalDamages);

  document.getElementById("finTotalRevenue").textContent = "Rs " + totalSales.toFixed(2);
  document.getElementById("finTotalPurchases").textContent = "Rs " + totalPurchases.toFixed(2);
  document.getElementById("finTotalExpenses").textContent = "Rs " + totalExpenses.toFixed(2);
  document.getElementById("finNetProfit").textContent = "Rs " + netProfit.toFixed(2);

  let cashBalances = { Soham: 0, Jeet: 0, Farm: 0 };
  salesRegistry.forEach(s => { if(cashBalances[s.collector] !== undefined) cashBalances[s.collector] += s.total; });
  expensesRegistry.forEach(e => {
    if(cashBalances[e.payer] !== undefined) cashBalances[e.payer] -= e.amount;
  });
  purchasesRegistry.forEach(p => { if(cashBalances[p.funder] !== undefined) cashBalances[p.funder] -= p.total; });

  document.getElementById("cashSoham").textContent = "Rs " + cashBalances.Soham.toFixed(2);
  document.getElementById("cashJeet").textContent = "Rs " + cashBalances.Jeet.toFixed(2);
  document.getElementById("cashFarm").textContent = "Rs " + cashBalances.Farm.toFixed(2);

  // 1. Render Sub Expense Table
  const expRows = expensesRegistry.filter(e => e.category !== "Damage Received");
  document.getElementById("subExpenseTableBody").innerHTML = expRows.map(e => `
    <tr><td>${e.date}</td><td>${e.category}</td><td>${e.payer}</td><td>${e.desc}</td><td style="color:var(--warn); font-weight:bold;">Rs ${e.amount}</td></tr>
  `).join("");

  // 2. Render Sub Sell Table
  document.getElementById("subSellTableBody").innerHTML = salesRegistry.map(s => `
    <tr><td>${s.date}</td><td>${s.product}</td><td>${s.buyer}</td><td>${s.qty}</td><td style="color:var(--accent); font-weight:bold;">Rs ${s.total}</td><td><button type="button" class="btn" style="padding:2px 6px; min-height:auto; font-size:11px;" onclick="downloadOfflineSaleInvoice('${s.saleId}')">Receipt</button></td></tr>
  `).join("");

  // 3. Render Sub Buy Table
  document.getElementById("subBuyTableBody").innerHTML = purchasesRegistry.map(p => `
    <tr><td>${p.date}</td><td>${p.product}</td><td>${p.vendor}</td><td>${p.qty}</td><td style="color:var(--danger); font-weight:bold;">Rs ${p.total}</td></tr>
  `).join("");

  // 4. Render Sub Damage Table
  const dmgRows = expensesRegistry.filter(e => e.category === "Damage Received");
  document.getElementById("subDamageTableBody").innerHTML = dmgRows.map(d => `
    <tr><td>${d.date}</td><td>${d.desc}</td><td>${d.payer}</td><td style="color:var(--danger); font-weight:bold;">Rs ${d.amount}</td></tr>
  `).join("");
}

function saveAdminExpense(e) {
  e.preventDefault();
  const rawDate = document.getElementById("expLogDate").value;
  const data = {
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
  e.target.reset();
  initDefaultDatePickers();
  computeFinancialLedgerStatements();
}

function saveAdminSale(e) {
  e.preventDefault();
  const rawDate = document.getElementById("saleLogDate").value;
  const qty = parseFloat(document.getElementById("saleQty").value);
  const rate = parseFloat(document.getElementById("saleRate").value);
  const pVariant = document.getElementById("saleProduct").value;

  const data = {
    saleId: "SALE-" + Date.now().toString().slice(-4),
    date: rawDate ? new Date(rawDate).toLocaleDateString() : new Date().toLocaleDateString(),
    product: pVariant,
    collector: document.getElementById("saleCollector").value,
    buyer: document.getElementById("saleBuyer").value.trim(),
    qty: qty,
    rate: rate,
    total: qty * rate
  };

  salesRegistry.push(data);
  localStorage.setItem('pgf_sales', JSON.stringify(salesRegistry));
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
  e.target.reset();
  initDefaultDatePickers();
  computeFinancialLedgerStatements();
}

function saveAdminDamage(e) {
  e.preventDefault();
  const rawDate = document.getElementById("dmgLogDate").value;
  const data = {
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
  e.target.reset();
  initDefaultDatePickers();
  computeFinancialLedgerStatements();
}

function downloadOfflineSaleInvoice(saleId) {
  const targetSale = salesRegistry.find(s => s.saleId === saleId);
  if(!targetSale) return;
  const slipText = `SALE INVOICE\nRef: ${targetSale.saleId}\nDate: ${targetSale.date}\nBuyer: ${targetSale.buyer}\nProduct: ${targetSale.product}\nTotal: Rs ${targetSale.total}`;
  const blob = new Blob([slipText], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `sale-${saleId}.txt`;
  a.click();
}

function renderProducts(list = products) {
  document.getElementById("productsList").innerHTML = list.map(product => `
    <article class="product">
      <img src="${product.image}" alt="${product.name}">
      <h3>${product.name}</h3>
      <p class="muted">${product.detail}</p>
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

function confirmOrder(e) {
  e.preventDefault();
  const bill = getTotals();
  const currentTimestamp = new Date().toLocaleString();
  const generatedOrderId = "PGF-INV-" + Date.now().toString().slice(-5);

  const data = {
    orderId: generatedOrderId,
    name: currentUser.name,
    phone: currentUser.phone,
    email: currentUser.email,
    address: document.getElementById("address").value.trim(),
    products: [...cart.values()].map(i => `${i.name} [x${i.qty}]`).join(", "),
    total: bill.total,
    txnId: document.getElementById("paymentId").value.trim(),
    dateLogged: currentTimestamp,
    status: "Pending Verification"
  };

  orderRegistry.unshift(data);
  localStorage.setItem('pgf_orders', JSON.stringify(orderRegistry));
  
  document.getElementById("invNum").textContent = data.orderId;
  document.getElementById("invDate").textContent = new Date().toLocaleDateString();
  document.getElementById("invClientName").textContent = data.name;
  document.getElementById("invClientEmail").textContent = data.email + " | Ph: " + data.phone;
  document.getElementById("invClientAddr").textContent = data.address;
  
  document.getElementById("invoiceTableItemsBody").innerHTML = [...cart.values()].map(item => `
    <tr>
      <td style="padding:10px; border:1px solid var(--line);">${item.name} (${item.unit})</td>
      <td style="padding:10px; text-align:right; border:1px solid var(--line);">Rs ${item.price}</td>
      <td style="padding:10px; text-align:center; border:1px solid var(--line);">${item.qty}</td>
      <td style="padding:10px; text-align:right; border:1px solid var(--line);">Rs ${item.price * item.qty}</td>
    </tr>
  `).join("");
  
  document.getElementById("invSub").textContent = "Rs " + bill.subtotal;
  document.getElementById("invTotal").textContent = "Rs " + bill.total;

  saveToSheet({ type: "order", ...data });
  
  const waMessage = `NEW GOODS ORDER VERIFICATION FLOW:\n----------------------------------------\nInvoice Ref Code: ${data.orderId}\nClient Legal Name: ${data.name}\nProducts Mapped: ${data.products}\nTotal Paid Amount: Rs ${data.total}\nPayment Method: ${document.getElementById("paymentMode").value}\nTransaction Hash ID Code: ${data.txnId}\n----------------------------------------`;
  
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

function submitStudentVisit(e) {
  e.preventDefault();
  const data = {
    bookingId: "PGF-STU-" + Date.now().toString().slice(-4),
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
    txnId: document.getElementById("spayment").value.trim(),
    dateLogged: new Date().toLocaleString(),
    status: "Pending Verification",
    approvedDate: ""
  };
  bookingsRegistry.unshift(data);
  localStorage.setItem('pgf_bookings', JSON.stringify(bookingsRegistry));
  saveToSheet({ type: "visit", ...data });

  const waText = `NEW STUDENT INTERNSHIP REGISTRATION:\n----------------------------------------\nBooking Ref ID: ${data.bookingId}\nName: ${data.name}\nUTR Tracking Number: ${data.txnId}\n----------------------------------------`;
  window.open(`https://wa.me/${farmWhatsapp}?text=${encodeURIComponent(waText)}`, '_blank');
  
  document.getElementById("studentForm").reset();
  document.getElementById("spayment").disabled = true;
  checkUserSession();
}

function submitFarmerVisit(e) {
  e.preventDefault();
  const data = {
    bookingId: "PGF-FAR-" + Date.now().toString().slice(-4),
    type: "Farmer",
    name: currentUser.name,
    phone: currentUser.phone,
    email: currentUser.email,
    date: document.getElementById("fdate").value,
    fee: 699,
    txnId: document.getElementById("fpayment").value.trim(),
    dateLogged: new Date().toLocaleString(),
    status: "Pending Verification",
    approvedDate: ""
  };
  bookingsRegistry.unshift(data);
  localStorage.setItem('pgf_bookings', JSON.stringify(bookingsRegistry));
  saveToSheet({ type: "visit", ...data });

  const waText = `NEW FARMER TRAINING BOOKING:\n----------------------------------------\nBooking Ref ID: ${data.bookingId}\nName: ${data.name}\nUTR Tracking Number: ${data.txnId}\n----------------------------------------`;
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

renderProducts();
checkUserSession();