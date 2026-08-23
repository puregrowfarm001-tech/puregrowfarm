// =========================================================
// CONFIGURATION & GLOBAL CONSTANTS
// =========================================================
const farmEmail = "puregrowfarm001@gmail.com";
const farmWhatsapp = "919067891039";
const farmUpiId = "sohamgajera01@okhdfcbank";
const farmName = "Pure Grow Farm";

const ADMIN_CREDENTIALS = { user: "admin", pass: "PureGrow@2026" };

const BASE_PRODUCTS = [
  { id: 1, name: "Fresh Green Oyster Mushroom", price: 180, unit: "1kg", image: "mushroom/Screenshot 2025-10-24 154001.png", detail: "Picked fresh, chilled and delivered within 24-48 hours.", type: "green", stock: 0 },
  { id: 2, name: "Dried Oyster Mushroom", price: 800, unit: "1kg pack", image: "mushroom/oyst dry.webp", detail: "Slow-dried to preserve flavor and nutrients.", type: "dry", stock: 0 },
  { id: 3, name: "Oyster Mushroom Powder", price: 130, unit: "100gm pack", image: "mushroom/oyster powder.png", detail: "Mushroom powder for soup, 1kg pack curry, health mix and snacks.", type: "powder", stock: 0 },
  { id: 4, name: "Methi Mushroom Khakhra", price: 70, unit: "200gm pack", image: "mushroom/Methi khakhra 2.png", detail: "Crispy khakhra prepared with oyster mushroom powder.", type: "khakhra", stock: 0 },
  { id: 5, name: "Adad Mushroom Papad", price: 120, unit: "1 pack", image: "mushroom/bulk.png", detail: "Papad enriched with mushroom nutrition.", type: "papad", stock: 0 },
  { id: 6, name: "Bulk and Wholesale Supply", price: 0, unit: "Custom", bulk: true, image: "mushroom/bulk.png", detail: "Supply for restaurants, retailers and local markets.", stock: 99999 }
];

let products = JSON.parse(localStorage.getItem('pgf_live_products')) || BASE_PRODUCTS;
const cart = new Map();

function saveProductsToStorage() {
  localStorage.setItem('pgf_live_products', JSON.stringify(products));
}

function getCleanData(key) {
  try {
    const raw = JSON.parse(localStorage.getItem(key)) || [];
    if (!Array.isArray(raw)) return [];
    return raw.filter(item => item && (item.name || item.orderId || item.bookingId || item.saleId || item.expId || item.dryId || item.purId || item.id));
  } catch (e) {
    return [];
  }
}

let usersDatabase = getCleanData('pgf_user_db');
let orderRegistry = getCleanData('pgf_orders');
let bookingsRegistry = getCleanData('pgf_bookings');
let expensesRegistry = getCleanData('pgf_expenses');
let salesRegistry = getCleanData('pgf_sales');
let purchasesRegistry = getCleanData('pgf_purchases');
let dailyDryStockRegistry = getCleanData('pgf_daily_dry_stock');
let notificationsRegistry = getCleanData('pgf_notifications');

let currentUser = JSON.parse(localStorage.getItem('pgf_session')) || null;

function getOrderProductImage(orderProductsText) {
  const text = (orderProductsText || "").toLowerCase();
  if (text.includes("khakhra")) return "mushroom/Methi khakhra 2.png";
  if (text.includes("dry") || text.includes("dried")) return "mushroom/oyst dry.webp";
  if (text.includes("powder")) return "mushroom/oyster powder.png";
  if (text.includes("papad")) return "mushroom/bulk.png";
  if (text.includes("green") || text.includes("fresh")) return "mushroom/Screenshot 2025-10-24 154001.png";
  return "mushroom/g mushroom.png";
}

function copyToClipboard(text) {
  if (!text || text === 'N/A') return;
  navigator.clipboard.writeText(text).then(() => {
    alert(`📋 Copied: ${text}`);
  }).catch(() => {
    prompt("Copy UPI ID:", text);
  });
}

function openOrdersModal() {
  document.getElementById("userOrdersModal").classList.add("active-modal");
  loadUserPanelData();
}
function closeOrdersModal() {
  document.getElementById("userOrdersModal").classList.remove("active-modal");
}

function openBookingsModal() {
  document.getElementById("userBookingsModal").classList.add("active-modal");
  loadUserPanelData();
}
function closeBookingsModal() {
  document.getElementById("userBookingsModal").classList.remove("active-modal");
}

function closeModalOutside(e, modalId) {
  if (e.target.id === modalId) {
    document.getElementById(modalId).classList.remove("active-modal");
  }
}

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === "password") {
    input.type = "text";
    btn.textContent = "🙈";
  } else {
    input.type = "password";
    btn.textContent = "👁️";
  }
}

function isPasswordStrong(pwd) {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(pwd);
}

function checkPasswordStrength(pwd) {
  const feedback = document.getElementById("passwordStrengthFeedback");
  if (!feedback) return;

  if (pwd.length === 0) {
    feedback.style.color = "#94a3b8";
    feedback.textContent = "Password must have 8+ chars, 1 uppercase, 1 number & 1 special character (@$!%*?&).";
    return;
  }

  if (isPasswordStrong(pwd)) {
    feedback.style.color = "#16a34a";
    feedback.textContent = "✅ Strong password!";
  } else {
    feedback.style.color = "#ef4444";
    feedback.textContent = "❌ Weak password!";
  }
}

function pushNotification(targetRecipient, title, message, targetAction = 'general') {
  const newNotif = {
    id: "NOTIF-" + Date.now(),
    recipient: targetRecipient,
    title: title,
    message: message,
    action: targetAction,
    time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    date: new Date().toLocaleDateString('en-IN'),
    isRead: false
  };

  notificationsRegistry.unshift(newNotif);
  localStorage.setItem('pgf_notifications', JSON.stringify(notificationsRegistry));
  renderNotificationBadge();
}

function markAllNotificationsAsRead() {
  const currentRecipient = currentUser ? (currentUser.isAdmin ? 'ADMIN' : currentUser.email) : null;
  if (!currentRecipient) return;

  let changed = false;
  notificationsRegistry.forEach(n => {
    if ((n.recipient === currentRecipient || (currentUser.isAdmin && n.recipient === 'ADMIN')) && !n.isRead) {
      n.isRead = true;
      changed = true;
    }
  });

  if (changed) {
    localStorage.setItem('pgf_notifications', JSON.stringify(notificationsRegistry));
    renderNotificationBadge();
  }
}

function handleNotificationClick(notifId) {
  const notif = notificationsRegistry.find(n => n.id === notifId);
  if (!notif) return;

  notif.isRead = true;
  localStorage.setItem('pgf_notifications', JSON.stringify(notificationsRegistry));
  renderNotificationBadge();

  const panel = document.getElementById("notificationDropdownPanel");
  if (panel) panel.style.display = "none";

  if (currentUser && currentUser.isAdmin) {
    if (notif.action === 'order') switchErpTab('erpOrdersTab', 'tabNavOrders');
    else if (notif.action === 'booking' || notif.action === 'certificate') switchErpTab('erpBookingsTab', 'tabNavBookings');
    else switchErpTab('erpOrdersTab', 'tabNavOrders');
  } else {
    if (notif.action === 'certificate' || notif.action === 'booking') openBookingsModal();
    else openOrdersModal();
  }
}

function renderNotificationBadge() {
  const badge = document.getElementById("notificationCountBadge");
  const listBody = document.getElementById("notificationListBody");
  if (!badge || !listBody) return;

  const currentRecipient = currentUser ? (currentUser.isAdmin ? 'ADMIN' : currentUser.email) : null;
  if (!currentRecipient) {
    badge.style.display = "none";
    listBody.innerHTML = `<span class="muted" style="font-size:12px; text-align:center; padding:10px;">Please login to view notifications.</span>`;
    return;
  }

  const myNotifs = notificationsRegistry.filter(n => n.recipient === currentRecipient || (currentUser.isAdmin && n.recipient === 'ADMIN'));
  const unreadCount = myNotifs.filter(n => !n.isRead).length;

  if (unreadCount > 0) {
    badge.textContent = unreadCount;
    badge.style.display = "inline-block";
  } else {
    badge.style.display = "none";
  }

  if (myNotifs.length === 0) {
    listBody.innerHTML = `<span class="muted" style="font-size:12px; text-align:center; padding:10px;">No alerts yet.</span>`;
  } else {
    listBody.innerHTML = myNotifs.map(n => `
      <div class="notif-interactive-card" onclick="handleNotificationClick('${n.id}')" style="background:${n.isRead ? '#f8fafc' : '#eff6ff'}; border:1px solid ${n.isRead ? '#e2e8f0' : '#bfdbfe'}; border-radius:8px; padding:10px; font-size:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">
          <strong style="color:${n.isRead ? '#334155' : '#1d4ed8'};">${n.title}</strong>
          <span style="font-size:10px; color:#64748b;">${n.time}</span>
        </div>
        <div style="color:#475569; line-height:1.3;">${n.message}</div>
      </div>
    `).join("");
  }
}

function toggleNotificationDropdown() {
  const panel = document.getElementById("notificationDropdownPanel");
  if (!panel) return;
  if (panel.style.display === "none" || panel.style.display === "") {
    panel.style.display = "block";
    renderNotificationBadge();
    markAllNotificationsAsRead();
  } else {
    panel.style.display = "none";
  }
}

function clearAllNotifications() {
  const currentRecipient = currentUser ? (currentUser.isAdmin ? 'ADMIN' : currentUser.email) : null;
  if (!currentRecipient) return;

  notificationsRegistry = notificationsRegistry.filter(n => n.recipient !== currentRecipient && !(currentUser.isAdmin && n.recipient === 'ADMIN'));
  localStorage.setItem('pgf_notifications', JSON.stringify(notificationsRegistry));
  renderNotificationBadge();
}

function scrollToCartSection() {
  const target = document.getElementById("cartBasketSidebar");
  if (target) {
    target.scrollIntoView({ behavior: 'smooth' });
  }
}

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
  if(document.getElementById("dryLogDate")) document.getElementById("dryLogDate").value = today;
}

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
  renderNotificationBadge();
  renderAdminLiveStockSummary();
  renderDailyDryStockTable();
  switchErpTab('erpOrdersTab', 'tabNavOrders');
}

function exitAdminPanel() { handleLogout(); }

function checkUserSession() {
  renderNotificationBadge();

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

  const match = usersDatabase.find(u => u && ((u.email && u.email.toLowerCase() === userInput.toLowerCase()) || u.phone === userInput));
  if (match && match.password === passInput) {
    currentUser = { name: match.name, email: match.email, phone: match.phone, isAdmin: false };
    localStorage.setItem('pgf_session', JSON.stringify(currentUser));
    checkUserSession();
  } else {
    alert("Invalid credentials or Account does not exist!");
  }
}

function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById("regName").value.trim();
  const phone = document.getElementById("regPhone").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;

  if (!isPasswordStrong(password)) {
    alert("⚠️ Kripya Strong Password dalein!");
    return;
  }

  const existing = usersDatabase.find(u => u && u.email && u.email.toLowerCase() === email.toLowerCase());
  if(existing) {
    alert("Is Email ID se account pehle se bana hua hai!");
    return;
  }

  const newUser = { name, phone, email, password };
  usersDatabase.push(newUser);
  localStorage.setItem('pgf_user_db', JSON.stringify(usersDatabase));

  pushNotification('ADMIN', '👤 New Account Created', `${name} (${email}) has registered.`, 'general');

  currentUser = { name, email, phone, isAdmin: false };
  localStorage.setItem('pgf_session', JSON.stringify(currentUser));
  alert("✅ Account Successfully Created!");
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

function loadUserPanelData() {
  if (!currentUser) return;
  const oList = document.getElementById("userOrdersList");
  const bList = document.getElementById("userBookingsList");
  
  const myOrders = orderRegistry.filter(o => o && o.email === currentUser.email);
  const myBookings = bookingsRegistry.filter(b => b && b.email === currentUser.email);

  if (oList) {
    oList.innerHTML = myOrders.length ? myOrders.map(o => `
      <div style="border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 14px; background:#fff; padding:12px;">
        <strong>Ref: ${o.orderId}</strong> - ₹${o.total} [${o.status || 'Pending'}]
      </div>
    `).join("") : "No active orders.";
  }

  if (bList) {
    bList.innerHTML = myBookings.length ? myBookings.map(b => `
      <div class="data-item-card">
        <strong>Booking ID: ${b.bookingId}</strong> - ${b.type} Visit [${b.status}]
      </div>
    `).join("") : "No course training applications logged.";
  }
}

function switchErpTab(tabId, buttonId) {
  document.querySelectorAll('.erp-section').forEach(s => s.classList.remove('active'));
  const targetSec = document.getElementById(tabId);
  if (targetSec) targetSec.classList.add('active');

  document.querySelectorAll('#erpNavbarBlock button').forEach(btn => btn.classList.remove('active-tab'));
  const targetBtn = document.getElementById(buttonId);
  if (targetBtn) targetBtn.classList.add('active-tab');
}

function switchSubAccountingTab(subTabId) {
  document.querySelectorAll('.sub-accounting-section').forEach(section => section.style.display = 'none');
  const targetSec = document.getElementById(subTabId);
  if (targetSec) targetSec.style.display = 'block';
}

function deleteUserAccount(idx) {
  if (confirm("Delete this user account?")) {
    usersDatabase.splice(idx, 1);
    localStorage.setItem('pgf_user_db', JSON.stringify(usersDatabase));
    populateAdminDashboardTables();
  }
}

function renderAdminLiveStockSummary() {
  const container = document.getElementById("adminLiveStockCardsContainer");
  if (!container) return;

  const dryProd = products.find(p => p.type === "dry") || { stock: 0 };
  const khakhraProd = products.find(p => p.type === "khakhra") || { stock: 0 };
  const papadProd = products.find(p => p.type === "papad") || { stock: 0 };

  container.innerHTML = `
    <div style="background: #fefce8; border: 1px solid #fef08a; padding: 14px; border-radius: 10px;">
      <div style="font-size: 13px; color: #854d0e; font-weight: bold;">🌾 Dry Mushroom Available Stock</div>
      <div style="font-size: 24px; font-weight: 900; color: #a16207; margin: 6px 0;">${dryProd.stock} kg</div>
    </div>
    <div style="background: #fff7ed; border: 1px solid #ffedd5; padding: 14px; border-radius: 10px;">
      <div style="font-size: 13px; color: #9a3412; font-weight: bold;">🧇 Methi Khakhra Available Stock</div>
      <div style="font-size: 24px; font-weight: 900; color: #ea580c; margin: 6px 0;">${khakhraProd.stock} packs</div>
    </div>
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 14px; border-radius: 10px;">
      <div style="font-size: 13px; color: #166534; font-weight: bold;">🫓 Adad Papad Available Stock</div>
      <div style="font-size: 24px; font-weight: 900; color: #15803d; margin: 6px 0;">${papadProd.stock} packs</div>
    </div>
  `;
}

function saveDailyDryStockEntry(e) {
  e.preventDefault();
  const rawDate = document.getElementById("dryLogDate").value;
  const qty = parseFloat(document.getElementById("dryLogQty").value);
  const notes = document.getElementById("dryLogNotes").value.trim();

  if (isNaN(qty) || qty <= 0) {
    alert("Kripya valid dry weight dalein!");
    return;
  }

  const dryEntry = {
    dryId: "DRY-" + Date.now().toString().slice(-4),
    date: rawDate ? new Date(rawDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
    qty: qty,
    notes: notes || "Daily Farm Drying Batch"
  };

  dailyDryStockRegistry.unshift(dryEntry);
  localStorage.setItem('pgf_daily_dry_stock', JSON.stringify(dailyDryStockRegistry));

  const dryProd = products.find(p => p.type === "dry");
  if (dryProd) {
    dryProd.stock = (dryProd.stock || 0) + qty;
    saveProductsToStorage();
    renderProducts();
  }

  e.target.reset();
  initDefaultDatePickers();
  renderDailyDryStockTable();
  renderAdminLiveStockSummary();
  alert(`✅ ${qty} kg Daily Dry Mushroom Stock successfully added!`);
}

function deleteDailyDryEntry(idx) {
  const item = dailyDryStockRegistry[idx];
  if (confirm(`Delete this dry stock entry (${item.qty} kg)?`)) {
    const dryProd = products.find(p => p.type === "dry");
    if (dryProd) {
      dryProd.stock = Math.max(0, (dryProd.stock || 0) - item.qty);
      saveProductsToStorage();
      renderProducts();
    }
    dailyDryStockRegistry.splice(idx, 1);
    localStorage.setItem('pgf_daily_dry_stock', JSON.stringify(dailyDryStockRegistry));
    renderDailyDryStockTable();
    renderAdminLiveStockSummary();
  }
}

function renderDailyDryStockTable() {
  const tbody = document.getElementById("dailyDryStockTableBody");
  const totalDisplay = document.getElementById("dailyDryTotalSum");
  if (!tbody) return;

  const totalDryWeight = dailyDryStockRegistry.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  if (totalDisplay) totalDisplay.textContent = `${totalDryWeight.toFixed(2)} kg`;

  if (!dailyDryStockRegistry.length) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--muted); padding:16px;">No daily dry mushroom records logged yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = dailyDryStockRegistry.map((item, idx) => `
    <tr>
      <td>${item.date}</td>
      <td>${item.notes}</td>
      <td style="color:#a16207; font-weight:bold; font-size:14px;">${item.qty} kg</td>
      <td>
        <button type="button" class="btn" style="padding:2px 6px; min-height:auto; font-size:11px; background:var(--danger);" onclick="deleteDailyDryEntry(${idx})">Delete</button>
      </td>
    </tr>
  `).join("");
}

function populateAdminDashboardTables() {
  renderAdminLiveStockSummary();
  renderDailyDryStockTable();

  const validOrders = orderRegistry.filter(o => o && o.name && o.orderId);
  if (document.getElementById("adminOrdersTableBody")) {
    document.getElementById("adminOrdersTableBody").innerHTML = validOrders.length ? validOrders.map((o, idx) => `
      <tr>
        <td><strong>${o.orderId}</strong></td>
        <td>${o.dateLogged || ''}</td>
        <td><strong>${o.name}</strong><br><small>${o.phone}</small></td>
        <td><small>${o.address}</small></td>
        <td>${o.products}</td>
        <td style="color:var(--accent); font-weight:bold;">Rs ${o.total}</td>
        <td>${o.paymentMode} <br><code>${o.txnId}</code></td>
        <td><span class="badge badge-confirmed">${o.status}</span></td>
        <td>🚚 ${o.deliveryDays || 'Pending'}</td>
        <td><button class="btn" style="padding:4px 8px; font-size:11px;" onclick="handleOrderApprove(${idx})">Approve</button></td>
      </tr>
    `).join("") : `<tr><td colspan="10" style="text-align:center;">No orders yet.</td></tr>`;
  }
}

function computeFinancialLedgerStatements() {
  const approvedOnlineOrdersRevenue = orderRegistry
    .filter(o => o && (o.status === 'Approved' || o.status === 'Delivered'))
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

  const directOfflineSales = salesRegistry.reduce((sum, s) => sum + Number(s.paidAmount !== undefined ? s.paidAmount : s.total || 0), 0);
  const totalSales = approvedOnlineOrdersRevenue + directOfflineSales;

  const totalPurchases = purchasesRegistry.reduce((sum, p) => sum + Number(p.paidAmount !== undefined ? p.paidAmount : p.total || 0), 0);
  const totalExpenses = expensesRegistry.filter(e => e.category !== "Damage Received").reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const netProfit = totalSales - (totalPurchases + totalExpenses);

  if(document.getElementById("finTotalRevenue")) document.getElementById("finTotalRevenue").textContent = "Rs " + totalSales.toFixed(2);
  if(document.getElementById("finTotalPurchases")) document.getElementById("finTotalPurchases").textContent = "Rs " + totalPurchases.toFixed(2);
  if(document.getElementById("finTotalExpenses")) document.getElementById("finTotalExpenses").textContent = "Rs " + totalExpenses.toFixed(2);
  if(document.getElementById("finNetProfit")) document.getElementById("finNetProfit").textContent = "Rs " + netProfit.toFixed(2);
  if(document.getElementById("cashFarm")) document.getElementById("cashFarm").textContent = "Rs " + totalSales.toFixed(2);
}

function saveAdminExpense(e) {
  e.preventDefault();
  const data = {
    expId: "EXP-" + Date.now().toString().slice(-4),
    date: document.getElementById("expLogDate").value || new Date().toLocaleDateString('en-IN'),
    category: document.getElementById("expCategory").value,
    payer: document.getElementById("expPayer").value,
    desc: document.getElementById("expDesc").value.trim(),
    amount: parseFloat(document.getElementById("expAmount").value)
  };
  expensesRegistry.push(data);
  localStorage.setItem('pgf_expenses', JSON.stringify(expensesRegistry));
  e.target.reset();
  computeFinancialLedgerStatements();
}

function saveAdminSale(e) {
  e.preventDefault();
  const qty = parseFloat(document.getElementById("saleQty").value);
  const rate = parseFloat(document.getElementById("saleRate").value);
  const total = qty * rate;
  const data = {
    saleId: "SALE-" + Date.now().toString().slice(-4),
    date: document.getElementById("saleLogDate").value || new Date().toLocaleDateString('en-IN'),
    product: document.getElementById("saleProduct").value,
    buyer: document.getElementById("saleBuyer").value.trim(),
    qty: qty,
    rate: rate,
    total: total,
    paidAmount: parseFloat(document.getElementById("salePaidAmount").value) || total
  };
  salesRegistry.push(data);
  localStorage.setItem('pgf_sales', JSON.stringify(salesRegistry));
  e.target.reset();
  computeFinancialLedgerStatements();
  renderAdminLiveStockSummary();
}

function saveAdminPurchase(e) {
  e.preventDefault();
  const qty = parseFloat(document.getElementById("purQty").value);
  const rate = parseFloat(document.getElementById("purRate").value);
  const total = qty * rate;
  const data = {
    purId: "PUR-" + Date.now().toString().slice(-4),
    date: document.getElementById("purLogDate").value || new Date().toLocaleDateString('en-IN'),
    product: document.getElementById("purProduct").value,
    vendor: document.getElementById("purVendor").value.trim(),
    qty: qty,
    rate: rate,
    total: total,
    paidAmount: parseFloat(document.getElementById("purPaidAmount").value) || total
  };
  purchasesRegistry.push(data);
  localStorage.setItem('pgf_purchases', JSON.stringify(purchasesRegistry));
  e.target.reset();
  computeFinancialLedgerStatements();
}

function saveAdminDamage(e) {
  e.preventDefault();
  const data = {
    expId: "DMG-" + Date.now().toString().slice(-4),
    date: document.getElementById("dmgLogDate").value || new Date().toLocaleDateString('en-IN'),
    category: "Damage Received",
    payer: document.getElementById("dmgPayer").value,
    desc: document.getElementById("dmgDesc").value.trim(),
    amount: parseFloat(document.getElementById("dmgAmount").value)
  };
  expensesRegistry.push(data);
  localStorage.setItem('pgf_expenses', JSON.stringify(expensesRegistry));
  e.target.reset();
  computeFinancialLedgerStatements();
}

function renderProducts(list = products) {
  if(!document.getElementById("productsList")) return;
  document.getElementById("productsList").innerHTML = list.map(product => `
    <article class="product">
      <img src="${product.image}" alt="${product.name}">
      <h3>${product.name}</h3>
      <p class="muted">${product.detail}</p>
      <div class="product-actions">
        <div class="pill">Rs ${product.price} / ${product.unit}</div>
        <button type="button" onclick="addToCart(${product.id})">Add Cart</button>
      </div>
    </article>
  `).join("");
}

function addToCart(id) {
  const product = products.find(item => item.id === id);
  if (!product) return;
  cart.set(id, { ...product, qty: (cart.get(id)?.qty || 0) + 1 });
  renderCart();
}

function renderCart() {
  const subtotal = [...cart.values()].reduce((sum, item) => sum + (item.price * item.qty), 0);
  if(document.getElementById("subtotal")) document.getElementById("subtotal").textContent = `Rs ${subtotal}`;
  if(document.getElementById("total")) document.getElementById("total").textContent = `Rs ${subtotal}`;
  if(document.getElementById("cartItems")) {
    document.getElementById("cartItems").innerHTML = [...cart.values()].map(item => `
      <div class="cart-item">
        <strong>${item.name}</strong> x ${item.qty}
      </div>
    `).join("");
  }
}

function confirmOrder(e) {
  e.preventDefault();
  const data = {
    orderId: "PGF-INV-" + Date.now().toString().slice(-5),
    name: currentUser.name,
    phone: currentUser.phone,
    email: currentUser.email,
    address: document.getElementById("address").value,
    total: 500,
    status: "Pending Verification",
    dateLogged: new Date().toLocaleDateString('en-IN')
  };
  orderRegistry.unshift(data);
  localStorage.setItem('pgf_orders', JSON.stringify(orderRegistry));
  alert("Order Placed Successfully!");
  cart.clear();
  renderCart();
}

renderProducts();
checkUserSession();