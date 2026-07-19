
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

// CORE STATE INITIALIZATIONS FIXED & VERIFIED NATIVELY
let currentInventoryStock = JSON.parse(localStorage.getItem('pgf_stock_counters')) || { dry: 150, khakhra: 85, papad: 120 };
let usersDatabase = JSON.parse(localStorage.getItem('pgf_user_db')) || [];
let orderRegistry = JSON.parse(localStorage.getItem('pgf_orders')) || [];
let bookingsRegistry = JSON.parse(localStorage.getItem('pgf_bookings')) || [];
let expensesRegistry = JSON.parse(localStorage.getItem('pgf_expenses')) || [];
let salesRegistry = JSON.parse(localStorage.getItem('pgf_sales')) || [];
let purchasesRegistry = JSON.parse(localStorage.getItem('pgf_purchases')) || [];

let currentUser = JSON.parse(localStorage.getItem('pgf_session')) || null;
let currentUpiState = { opened: false };
let latestInvoice = "";
let latestVisitInvoice = "";

// Helper to get formatted ISO local date string for inputs (YYYY-MM-DD)
function getTodayIsoString() {
  const d = new Date();
  const month = '' + (d.getMonth() + 1), day = '' + d.getDate(), year = d.getFullYear();
  return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
}

// Automatically bind today's date dynamically to administrative logger inputs
function initDefaultDatePickers() {
  const today = getTodayIsoString();
  if(document.getElementById("expLogDate")) document.getElementById("expLogDate").value = today;
  if(document.getElementById("saleLogDate")) document.getElementById("saleLogDate").value = today;
  if(document.getElementById("purLogDate")) document.getElementById("purLogDate").value = today;
}

async function saveToSheet(payload) {
  try { await fetch(SHEET_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); } catch(e) {}
}

function updateStockDisplayCounters() {
  localStorage.setItem('pgf_stock_counters', JSON.stringify(currentInventoryStock));
  if(document.getElementById("stockValDry")) document.getElementById("stockValDry").textContent = currentInventoryStock.dry + " kg";
  if(document.getElementById("stockValKhakhra")) document.getElementById("stockValKhakhra").textContent = currentInventoryStock.khakhra + " Packs";
  if(document.getElementById("stockValPapad")) document.getElementById("stockValPapad").textContent = currentInventoryStock.papad + " Packs";
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
}

function exitAdminPanel() {
  handleLogout();
}

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

  if (!name || !phone || !email || !password) {
    alert("❌ Error: Kripya sabhi fields ko thik se bharein.");
    return;
  }

  const existing = usersDatabase.find(u => u.email.toLowerCase() === email.toLowerCase());
  if(existing) {
    alert("❌ Error: Is Email ID se account pehle se bana hua hai!");
    switchAuthBox('loginBox');
    return;
  }

  const newUser = { name, phone, email, password };
  usersDatabase.push(newUser);
  localStorage.setItem('pgf_user_db', JSON.stringify(usersDatabase));

  currentUser = { name, email, phone, isAdmin: false };
  localStorage.setItem('pgf_session', JSON.stringify(currentUser));
  
  alert("🎉 Account Registered Successfully! Aapka account ban gaya hai.");
  e.target.reset();
  checkUserSession();
}

function handleForgotPassword(e) {
  e.preventDefault();
  const emailInput = document.getElementById("forgotEmail").value.trim();
  
  if(!emailInput) {
    alert("Kripya apna registered email dalein.");
    return;
  }

  const match = usersDatabase.find(u => u.email.toLowerCase() === emailInput.toLowerCase());
  
  let msg = `Hello Pure Grow Farm Team, main apna account password bhool gaya hu. Kripya meri sahayata karein.\n\nRegistered Email: ${emailInput}`;
  if(match) {
    msg += `\nName: ${match.name}\nPhone: ${match.phone}`;
  }

  alert("Redirecting to WhatsApp for Account Verification Help...");
  window.open(`https://wa.me/${farmWhatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
}

function handleLogout() {
  currentUser = null;
  localStorage.removeItem('pgf_session');
  document.getElementById("userInlineCertificateSandbox").style.display = "none";
  checkUserSession();
}

function loadUserPanelData() {
  const oList = document.getElementById("userOrdersList");
  const bList = document.getElementById("userBookingsList");
  
  const myOrders = orderRegistry.filter(o => o.email === currentUser.email);
  const myBookings = bookingsRegistry.filter(b => b.email === currentUser.email);

  oList.innerHTML = myOrders.length ? myOrders.map(o => `
    <div class="data-item-card">
      <strong>Order ID: ${o.orderId}</strong><br>
      <small>Date Received: ${o.dateLogged}</small><br>
      <span>Items: ${o.products}</span><br>
      <strong>Total: Rs ${o.total} [<span style="color:${o.status==='Approved'?'var(--accent)':'var(--warn)'}; font-weight:bold;">${o.status}</span>]</strong>
    </div>
  `).join("") : "No active orders mapped for this profile index.";

  bList.innerHTML = myBookings.length ? myBookings.map(b => `
    <div class="data-item-card">
      <strong>Booking ID: ${b.bookingId}</strong><br>
      <small>Booked On: ${b.dateLogged}</small><br>
      <small>Schedule Date: ${b.date || b.start}</small><br>
      <strong>Scheme: ${b.type} Visit [${b.status}]</strong>
    </div>
  `).join("") : "No course training applications logged.";

  const approvedBooking = myBookings.find(b => b.status === "Approved");
  if (approvedBooking) {
    renderUserCertificateInline(approvedBooking.bookingId);
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
      <td><span class="badge ${o.status==='Approved'?'badge-confirmed':'badge-pending'}">${o.status}</span></td>
      <td>
        ${o.status !== 'Approved' ? `<button class="btn" style="padding:4px 8px; min-height:auto; background:var(--accent);" onclick="approveCustomerOrder(${idx})">Approve Order</button>` : `<span style="color:var(--accent); font-weight:bold;">Verified</span>`}
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
      <td><span class="badge ${b.status==='Approved'?'badge-confirmed':'badge-pending'}">${b.status}</span></td>
      <td>
        ${b.status !== 'Approved' ? `<button class="btn" style="padding:4px 8px; min-height:auto;" onclick="approveTrainingBooking(${idx})">Approve</button>` : `<span style="color:var(--accent); font-weight:bold;">Approved</span>`}
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
  alert("Customer purchase order marked as Approved successfully.");
  populateAdminDashboardTables();
  computeFinancialLedgerStatements();
}

function approveTrainingBooking(idx) {
  bookingsRegistry[idx].status = "Approved";
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
  
  alert("Course Booking authorized successfully.");
  populateAdminDashboardTables();
  computeFinancialLedgerStatements();
  renderCertificateInline(target.bookingId);
}

function renderCertificateInline(bId) {
  const target = bookingsRegistry.find(b => b.bookingId === bId);
  if(!target) return;
  document.getElementById("certGeneratedName").textContent = target.name.toUpperCase();
  document.getElementById("certGeneratedApproveDate").textContent = new Date().toLocaleDateString();
  
  if(target.type === "Student") {
    document.getElementById("certGeneratedDuration").textContent = `${target.start} to ${target.end}`;
    document.getElementById("certGeneratedBody").textContent = `for successfully finishing the core intensive practical student internship framework module hosted inside Pure Grow Farm.`;
  } else {
    document.getElementById("certGeneratedDuration").textContent = target.date;
    document.getElementById("certGeneratedBody").textContent = `for actively undertaking and completing the technical commercial farmer cultivation development workshop program at Pure Grow Farm.`;
  }
  document.getElementById("certificateGeneratorSandbox").style.display = "block";
}

function renderUserCertificateInline(bId) {
  const target = bookingsRegistry.find(b => b.bookingId === bId);
  if(!target) return;
  document.getElementById("userCertGeneratedName").textContent = target.name.toUpperCase();
  document.getElementById("userCertGeneratedApproveDate").textContent = new Date().toLocaleDateString();
  
  if(target.type === "Student") {
    document.getElementById("userCertGeneratedDuration").textContent = `${target.start} to ${target.end}`;
    document.getElementById("userCertGeneratedBody").textContent = `for successfully finishing the core intensive practical student internship framework module hosted inside Pure Grow Farm.`;
  } else {
    document.getElementById("userCertGeneratedDuration").textContent = target.date;
    document.getElementById("userCertGeneratedBody").textContent = `for actively undertaking and completing the technical commercial farmer cultivation development workshop program at Pure Grow Farm.`;
  }
  document.getElementById("userInlineCertificateSandbox").style.display = "block";
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

  if(pVariant === "Dry") currentInventoryStock.dry = Math.max(0, currentInventoryStock.dry - qty);
  salesRegistry.push(data);
  localStorage.setItem('pgf_sales', JSON.stringify(salesRegistry));
  updateStockDisplayCounters();
  e.target.reset();
  initDefaultDatePickers();
  computeFinancialLedgerStatements();
  renderProducts();
}

function saveAdminPurchase(e) {
  e.preventDefault();
  const rawDate = document.getElementById("purLogDate").value;
  const qty = parseFloat(document.getElementById("purQty").value);
  const rate = parseFloat(document.getElementById("purRate").value);
  const itemVariant = document.getElementById("purProduct").value;

  const data = {
    purId: "PUR-" + Date.now().toString().slice(-4),
    date: rawDate ? new Date(rawDate).toLocaleDateString() : new Date().toLocaleDateString(),
    product: itemVariant,
    funder: document.getElementById("purFunder").value,
    vendor: document.getElementById("purVendor").value.trim(),
    qty: qty,
    rate: rate,
    total: qty * rate
  };

  if(itemVariant === "Dry") currentInventoryStock.dry += qty;
  if(itemVariant === "Khakhra Lots") currentInventoryStock.khakhra += qty;
  if(itemVariant === "Papad Lots") currentInventoryStock.papad += qty;

  purchasesRegistry.push(data);
  localStorage.setItem('pgf_purchases', JSON.stringify(purchasesRegistry));
  updateStockDisplayCounters();
  e.target.reset();
  initDefaultDatePickers();
  computeFinancialLedgerStatements();
  renderProducts();
}

function downloadOfflineSaleInvoice(saleId) {
  const targetSale = salesRegistry.find(s => s.saleId === saleId);
  if(!targetSale) return;
  
  const slipText = `----------------------------------------\n${farmName.toUpperCase()} WHOLESALE OFFLINE SALE INVOICE\n----------------------------------------\nHelpline Desk: +91 ${farmWhatsapp}\nSale Date Mapped: ${targetSale.date}\nTransaction Ref Code: ${targetSale.saleId}\n\n[PURCHASER TARGET ENTITY]\nBuyer Party Name: ${targetSale.buyer}\nAsset Collector Location: ${targetSale.collector}\n\n[PRODUCT LOG FACTOR]\nDispatched Stock Type: ${targetSale.product}\nQuantity (kg/Packs): ${targetSale.qty}\nUnit Cost Factor: Rs ${targetSale.rate}\nTotal Valuation Inflow: Rs ${targetSale.total}\n----------------------------------------`;
  
  const blob = new Blob([slipText], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `pgf-wholesale-sale-${saleId}.txt`;
  a.click();
}

function computeFinancialLedgerStatements() {
  const totalSales = salesRegistry.reduce((sum, s) => sum + s.total, 0);
  const totalPurchases = purchasesRegistry.reduce((sum, p) => sum + p.total, 0);
  const totalExpenses = expensesRegistry.reduce((sum, e) => sum + (e.category !== "Damage Received" ? e.amount : 0), 0);
  const totalDamagesReceived = expensesRegistry.reduce((sum, e) => sum + (e.category === "Damage Received" ? e.amount : 0), 0);

  const netProfit = (totalSales + totalDamagesReceived) - (totalPurchases + totalExpenses);

  document.getElementById("finTotalRevenue").textContent = "Rs " + totalSales.toFixed(2);
  document.getElementById("finTotalPurchases").textContent = "Rs " + totalPurchases.toFixed(2);
  document.getElementById("finTotalExpenses").textContent = "Rs " + totalExpenses.toFixed(2);
  document.getElementById("finNetProfit").textContent = "Rs " + netProfit.toFixed(2);

  let cashBalances = { Soham: 0, Jeet: 0, Farm: 0 };
  salesRegistry.forEach(s => { if(cashBalances[s.collector] !== undefined) cashBalances[s.collector] += s.total; });
  expensesRegistry.forEach(e => {
    if(e.category === "Damage Received") {
      if(cashBalances[e.payer] !== undefined) cashBalances[e.payer] += e.amount;
    } else {
      if(cashBalances[e.payer] !== undefined) cashBalances[e.payer] -= e.amount;
    }
  });
  purchasesRegistry.forEach(p => { if(cashBalances[p.funder] !== undefined) cashBalances[p.funder] -= p.total; });

  document.getElementById("cashSoham").textContent = "Rs " + cashBalances.Soham.toFixed(2);
  document.getElementById("cashJeet").textContent = "Rs " + cashBalances.Jeet.toFixed(2);
  document.getElementById("cashFarm").textContent = "Rs " + cashBalances.Farm.toFixed(2);

  const ledgersBody = document.getElementById("adminAccountingTableBody");
  let htmlRows = "";

  salesRegistry.forEach(s => {
    htmlRows += `<tr><td>${s.date}</td><td><mark style='background:#dcfce7; color:#166534;'>INFLOW: SALE</mark></td><td>${s.product}</td><td>Firm: ${s.buyer}</td><td>Holder: ${s.collector}</td><td style='color:var(--accent); font-weight:bold;'>+ Rs ${s.total.toFixed(2)}</td><td>${s.saleId ? `<button type="button" class="btn" style="padding:2px 6px; min-height:auto; font-size:11px;" onclick="downloadOfflineSaleInvoice('${s.saleId}')">Download Invoice</button>` : 'System Log'}</td></tr>`;
  });
  purchasesRegistry.forEach(p => {
    htmlRows += `<tr><td>${p.date}</td><td><mark style='background:#fee2e2; color:#991b1b;'>OUTFLOW: PURCHASE</mark></td><td>Material: ${p.product}</td><td>To: ${p.vendor}</td><td>Funder: ${p.funder}</td><td style='color:var(--danger); font-weight:bold;'>- Rs ${p.total.toFixed(2)}</td><td>Procurement</td></tr>`;
  });
  expensesRegistry.forEach(e => {
    if(e.category === "Damage Received") {
      htmlRows += `<tr><td>${e.date}</td><td><mark style='background:#e0f2fe; color:#0369a1;'>INFLOW: DAMAGE FUNDS</mark></td><td>Lot: ${e.desc}</td><td>Damages Compensation</td><td>Receiver: ${e.payer}</td><td style='color:#0369a1; font-weight:bold;'>+ Rs ${e.amount.toFixed(2)}</td><td>Damages Inward</td></tr>`;
    } else {
      htmlRows += `<tr><td>${e.date}</td><td><mark style='background:#fef3c7; color:#92400e;'>OUTFLOW: FARM EXPENSE</mark></td><td>${e.category} Operations (${e.desc})</td><td>Mode: ${e.mode}</td><td>Payer: ${e.payer}</td><td style='color:var(--warn); font-weight:bold;'>- Rs ${e.amount.toFixed(2)}</td><td>Outflow Raw</td></tr>`;
    }
  });
  ledgersBody.innerHTML = htmlRows;
}

function renderProducts(list = products) {
  document.getElementById("productsList").innerHTML = list.map(product => {
    let stockStatus = "";
    if(!product.bulk) {
      if(product.type === "dry") {
        stockStatus = currentInventoryStock.dry <= 0 ? `<span class="badge" style="background:#fee2e2; color:var(--danger);">Out of Stock</span>` : `<span class="badge badge-confirmed">${currentInventoryStock.dry} kg Available</span>`;
      } else if(product.type === "khakhra") {
        stockStatus = currentInventoryStock.khakhra <= 0 ? `<span class="badge" style="background:#fee2e2; color:var(--danger);">Out of Stock</span>` : `<span class="badge badge-confirmed">${currentInventoryStock.khakhra} Packs Available</span>`;
      } else if(product.type === "papad") {
        stockStatus = currentInventoryStock.papad <= 0 ? `<span class="badge" style="background:#fee2e2; color:var(--danger);">Out of Stock</span>` : `<span class="badge badge-confirmed">${currentInventoryStock.papad} Packs Available</span>`;
      } else {
        stockStatus = `<span class="badge badge-confirmed">Available In Stock</span>`;
      }
    }

    return `
      <article class="product">
        <img src="${product.image}" alt="${product.name}">
        <h3>${product.name}</h3>
        <p class="muted">${product.detail}</p>
        <div style="margin-top:auto;">
          <div style="margin-bottom:6px;">${stockStatus}</div>
          <div class="product-actions">
            <div class="pill">Rs ${product.price} / ${product.unit}</div>
            ${product.bulk ? `<button type="button" onclick="window.open('https://wa.me/${farmWhatsapp}')">Contact Bulk</button>` : `<button type="button" onclick="addToCart(${product.id})">Add Cart</button>`}
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function addToCart(id) {
  const product = products.find(item => item.id === id);
  const current = cart.get(id);
  cart.set(id, { ...product, qty: current ? current.qty + 1 : 1 });
  renderCart();
  updateOrderButton();
}
function minusCart(id) {
  const item = cart.get(id);
  if (!item) return;
  if (item.qty === 1) cart.delete(id);
  else cart.set(id, { ...item, qty: item.qty - 1 });
  renderCart();
  updateOrderButton();
}
function renderCart() {
  const bill = getTotals();
  document.getElementById("subtotal").textContent = `Rs ${bill.subtotal}`;
  document.getElementById("delivery").textContent = `Rs ${bill.delivery}`;
  document.getElementById("total").textContent = `Rs ${bill.total}`;

  if (!cart.size) { document.getElementById("cartItems").innerHTML = `<p class="muted">Cart selection is empty.</p>`; return; }
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

function openProductPayment() {
  const mode = document.getElementById("paymentMode").value;
  const bill = getTotals();
  if(!mode || !cart.size) return;
  currentUpiState.opened = true;
  document.getElementById("productPaymentHelp").style.display = "block";
  document.getElementById("productPaymentHelp").textContent = `Launching UPI Payment link for Rs ${bill.total}.`;
  window.location.href = `upi://pay?pa=${encodeURIComponent(farmUpiId)}&pn=${encodeURIComponent(farmName)}&am=${bill.total}&cu=INR`;
  updateOrderButton();
}
document.getElementById("paymentMode").onchange = openProductPayment;

function updateOrderButton() {
  if(!currentUser) return;
  const ready = cart.size && document.getElementById("address").value.trim().length > 4 && document.getElementById("paymentId").value.trim().length >= 6;
  document.getElementById("confirmOrderBtn").disabled = !ready;
}
document.getElementById("orderForm").oninput = updateOrderButton;

function confirmOrder(e) {
  e.preventDefault();
  const bill = getTotals();
  const currentTimestamp = new Date().toLocaleString();

  cart.forEach(item => {
    if(item.type === "dry") currentInventoryStock.dry = Math.max(0, currentInventoryStock.dry - item.qty);
    if(item.type === "khakhra") currentInventoryStock.khakhra = Math.max(0, currentInventoryStock.khakhra - item.qty);
    if(item.type === "papad") currentInventoryStock.papad = Math.max(0, currentInventoryStock.papad - item.qty);
  });

  const data = {
    orderId: "PGF-" + Date.now().toString().slice(-6),
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
  
  const salesLog = { type: "sale", product: `Client E-Com Order [${data.products}]`, collector: "Farm", buyer: data.name, qty: 1, rate: data.total, total: data.total, date: currentTimestamp };
  salesRegistry.unshift(salesLog);
  localStorage.setItem('pgf_sales', JSON.stringify(salesRegistry));

  saveToSheet({ type: "order", ...data });
  updateStockDisplayCounters();

  latestInvoice = `----------------------------------------\n${farmName.toUpperCase()} OFFICIAL INVOICE RECEIPT\n----------------------------------------\nFarm Contact Desk Helpline: +91 ${farmWhatsapp}\nInvoice Generated Date & Time: ${data.dateLogged}\nOrder Reference Hash ID: ${data.orderId}\n\n[USER CUSTOMER ACCOUNT DETAILS]\nClient Identity Legal Name: ${data.name}\nRegistered Mobile Line Link: ${data.phone}\nConfigured Account Email ID: ${data.email}\nComplete Shipping Delivery Address: ${data.address}\n\n[TRANSACTION DATA PARAMETERS]\nDispatched Stock Items: ${data.products}\nOnline Network Mode Reference: ${document.getElementById("paymentMode").value}\nPayment Gateway Txn Code Ref: ${data.txnId}\nFinal Paid Balance Factor: Rs ${data.total}\n----------------------------------------`;
  document.getElementById("invoiceText").textContent = latestInvoice;
  
  alert("Thank you! Opening WhatsApp for instant order logging, after that your layout invoice parameters will render.");
  
  // Directly trigger WhatsApp window loop frame framework execution before launching dialog
  window.open(`https://wa.me/${farmWhatsapp}?text=${encodeURIComponent("NEW E-COM GOODS ORDER VERIFICATION FLOW:\n" + latestInvoice)}`, '_blank');
  
  document.getElementById("invoiceDialog").showModal();
  
  cart.clear();
  renderCart();
  document.getElementById("orderForm").reset();
  checkUserSession();
}

function downloadInvoice() {
  const blob = new Blob([latestInvoice], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "pgf-invoice-slip.txt";
  link.click();
}
function closeInvoice() { document.getElementById("invoiceDialog").close(); }

function showVisitForm(id) {
  document.getElementById("studentForm").classList.remove("active");
  document.getElementById("farmerForm").classList.remove("active");
  document.getElementById(id).classList.add("active");
}

function openVisitUpi(amount, formId) {
  const helpId = formId === "studentForm" ? "studentPaymentHelp" : "farmerPaymentHelp";
  document.getElementById(helpId).style.display = "block";
  document.getElementById(helpId).textContent = `UPI open active for Rs ${amount}.`;
  if(formId === "studentForm") document.getElementById("studentSubmitBtn").disabled = false;
  else document.getElementById("farmerSubmitBtn").disabled = false;
  window.location.href = `upi://pay?pa=${encodeURIComponent(farmUpiId)}&pn=${encodeURIComponent(farmName)}&am=${amount}&cu=INR`;
}

function submitStudentVisit(e) {
  e.preventDefault();
  const currentTimestamp = new Date().toLocaleString();
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
    dateLogged: currentTimestamp,
    status: "Pending Verification"
  };
  bookingsRegistry.unshift(data);
  localStorage.setItem('pgf_bookings', JSON.stringify(bookingsRegistry));
  saveToSheet({ type: "visit", ...data });

  latestVisitInvoice = `----------------------------------------\n${farmName.toUpperCase()} TRAINING BOOKING RECEIPT\n----------------------------------------\nFarm Contact Desk Helpline: +91 ${farmWhatsapp}\nBooking Generated Date & Time: ${data.dateLogged}\nBooking Reference ID: ${data.bookingId}\n\n[STUDENT APPLICANT INFORMATION]\nFull Student Legal Name: ${data.name}\nContact Mobile Line: ${data.phone}\nAccount Email ID: ${data.email}\nUniversity Enrollment Code: ${data.enrollment}\nCollege Entity Context: ${data.college}\nTarget Course Schema: ${data.course}\nTarget Operational Duration: ${data.start} to ${data.end}\n\n[TRANSACTION DETAILS]\nOnline Network Payment Mode: ${document.getElementById("spaymentMode").value}\nUTR Reference Tracking Number: ${data.txnId}\nTotal Paid Amount Outflow: Rs ${data.fee}\n----------------------------------------`;
  document.getElementById("visitInvoiceText").textContent = latestVisitInvoice;
  
  alert("Thank you! Opening WhatsApp for verification assistance.");
  window.open(`https://wa.me/${farmWhatsapp}?text=${encodeURIComponent("NEW STUDENT INTERNSHIP REGISTRATION:\n" + latestVisitInvoice)}`, '_blank');
  
  document.getElementById("visitThankyouBox").style.display = "block";
  e.target.reset();
  checkUserSession();
}

function submitFarmerVisit(e) {
  e.preventDefault();
  const currentTimestamp = new Date().toLocaleString();
  const data = {
    bookingId: "PGF-FAR-" + Date.now().toString().slice(-4),
    type: "Farmer",
    name: currentUser.name,
    phone: currentUser.phone,
    email: currentUser.email,
    date: document.getElementById("fdate").value,
    fee: 699,
    txnId: document.getElementById("fpayment").value.trim(),
    dateLogged: currentTimestamp,
    status: "Pending Verification"
  };
  bookingsRegistry.unshift(data);
  localStorage.setItem('pgf_bookings', JSON.stringify(bookingsRegistry));
  saveToSheet({ type: "visit", ...data });

  latestVisitInvoice = `----------------------------------------\n${farmName.toUpperCase()} TRAINING BOOKING RECEIPT\n----------------------------------------\nFarm Contact Desk Helpline: +91 ${farmWhatsapp}\nBooking Generated Date & Time: ${data.dateLogged}\nBooking Reference ID: ${data.bookingId}\n\n[FARMER APPLICANT INFORMATION]\nFull Farmer Legal Name: ${data.name}\nContact Mobile Line: ${data.phone}\nAccount Email ID: ${data.email}\nScheduled Workshop Target Date: ${data.date}\n\n[TRANSACTION DETAILS]\nOnline Network Payment Mode: ${document.getElementById("fpaymentMode").value}\nUTR Reference Tracking Number: ${data.txnId}\nTotal Paid Amount Outflow: Rs ${data.fee}\n----------------------------------------`;
  document.getElementById("visitInvoiceText").textContent = latestVisitInvoice;
  
  alert("Thank you! Opening WhatsApp for confirmation logging flow.");
  window.open(`https://wa.me/${farmWhatsapp}?text=${encodeURIComponent("NEW FARMER TRAINING BOOKING:\n" + latestVisitInvoice)}`, '_blank');
  
  document.getElementById("visitThankyouBox").style.display = "block";
  e.target.reset();
  checkUserSession();
}

function downloadVisitInvoice() {
  const blob = new Blob([latestVisitInvoice], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "pgf-visit-receipt.txt";
  a.click();
}

function getTotals() {
  const subtotal = [...cart.values()].reduce((sum, item) => sum + item.price * item.qty, 0);
  return { subtotal, delivery: subtotal > 0 ? 50 : 0, total: subtotal > 0 ? subtotal + 50 : 0 };
}

function toggleNav() {
  document.getElementById("mainNav").classList.toggle("show");
}

renderProducts();
checkUserSession();