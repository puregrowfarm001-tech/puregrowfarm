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

// =========================================================
// HELPER FUNCTIONS & MODALS
// =========================================================
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

// =========================================================
// ADMIN FILTER MODAL & NAVIGATION LOGIC
// =========================================================
function openAdminFilterModal(filterType) {
  const modal = document.getElementById("adminFilterPopupModal");
  const titleElem = document.getElementById("adminFilterModalTitle");
  const contentList = document.getElementById("adminFilterModalContentList");
  if (!modal || !titleElem || !contentList) return;

  modal.classList.add("active-modal");
  let htmlOutput = "";

  if (filterType === 'orders_pending_delivery') {
    titleElem.textContent = "⏳ Orders Pending Delivery List";
    const pendingOrders = orderRegistry.map((o, idx) => ({ ...o, originalIdx: idx })).filter(o => o && o.name && o.status !== 'Delivered' && o.trackingStage !== 'Delivered' && !o.status.startsWith('Cancelled') && !o.status.startsWith('Rejected'));
    
    if (!pendingOrders.length) {
      htmlOutput = `<p class="muted" style="text-align:center; padding:15px;">No orders pending delivery.</p>`;
    } else {
      htmlOutput = pendingOrders.map(o => `
        <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:12px; border-radius:8px; cursor:pointer; transition:0.2s;" onclick="jumpToAdminRow('erpOrdersTab', 'tabNavOrders', ${o.originalIdx}, 'order')">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong>📦 Order #${o.orderId} - ${o.name}</strong>
            <span style="color:var(--accent); font-weight:bold;">₹${o.total}</span>
          </div>
          <div style="font-size:12px; color:#475569; margin-top:4px;">Products: ${o.products}</div>
          <div style="font-size:11px; color:#0284c7; margin-top:4px;">👉 Click here to view & manage order in table</div>
        </div>
      `).join("");
    }
  } else if (filterType === 'orders_refund_pending') {
    titleElem.textContent = "🔄 Refund Pending Orders List";
    const refundPending = orderRegistry.map((o, idx) => ({ ...o, originalIdx: idx })).filter(o => o && o.status && o.status.startsWith('Cancelled') && o.refundStage !== 'Refund Credited');
    
    if (!refundPending.length) {
      htmlOutput = `<p class="muted" style="text-align:center; padding:15px;">No pending refunds.</p>`;
    } else {
      htmlOutput = refundPending.map(o => `
        <div style="background:#fff7ed; border:1px solid #fed7aa; padding:12px; border-radius:8px; cursor:pointer; transition:0.2s;" onclick="jumpToAdminRow('erpOrdersTab', 'tabNavOrders', ${o.originalIdx}, 'order')">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong>🔄 Refund Order #${o.orderId} - ${o.name}</strong>
            <span style="color:#c2410c; font-weight:bold;">₹${o.total}</span>
          </div>
          <div style="font-size:12px; color:#7c2d12; margin-top:4px;">UPI: ${o.userUpiId || 'N/A'} | Status: ${o.refundStage || 'Initiated'}</div>
          <div style="font-size:11px; color:#0284c7; margin-top:4px;">👉 Click here to process refund credit in table</div>
        </div>
      `).join("");
    }
  } else if (filterType === 'bookings_pending') {
    titleElem.textContent = "⏳ Farm Bookings Pending Verification List";
    const pendingBookings = bookingsRegistry.map((b, idx) => ({ ...b, originalIdx: idx })).filter(b => b && b.name && b.status === "Pending Verification");
    
    if (!pendingBookings.length) {
      htmlOutput = `<p class="muted" style="text-align:center; padding:15px;">No pending bookings.</p>`;
    } else {
      htmlOutput = pendingBookings.map(b => `
        <div style="background:#fffbeb; border:1px solid #fde68a; padding:12px; border-radius:8px; cursor:pointer; transition:0.2s;" onclick="jumpToAdminRow('erpBookingsTab', 'tabNavBookings', ${b.originalIdx}, 'booking')">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong>🎓 Booking #${b.bookingId} - ${b.name} (${b.type})</strong>
            <span style="color:#b45309; font-weight:bold;">₹${b.fee || 0}</span>
          </div>
          <div style="font-size:12px; color:#92400e; margin-top:4px;">UPI ID: ${b.userUpiId || 'N/A'} | Date: ${b.dateLogged}</div>
          <div style="font-size:11px; color:#0284c7; margin-top:4px;">👉 Click here to verify & approve booking in table</div>
        </div>
      `).join("");
    }
  } else if (filterType === 'certificates_pending') {
    titleElem.textContent = "📜 Certificates Pending Approval List";
    const pendingCerts = bookingsRegistry.map((b, idx) => ({ ...b, originalIdx: idx })).filter(b => b && (b.status === "Confirmed" || b.status === "Approved") && !b.certIssued);
    
    if (!pendingCerts.length) {
      htmlOutput = `<p class="muted" style="text-align:center; padding:15px;">No certificates pending.</p>`;
    } else {
      htmlOutput = pendingCerts.map(b => `
        <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:12px; border-radius:8px; cursor:pointer; transition:0.2s;" onclick="jumpToAdminRow('erpBookingsTab', 'tabNavBookings', ${b.originalIdx}, 'booking')">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong>📜 Certificate Request #${b.bookingId} - ${b.name} (${b.type})</strong>
            <span style="color:#15803d; font-weight:bold;">Confirmed</span>
          </div>
          <div style="font-size:12px; color:#166534; margin-top:4px;">Training completed, ready for certificate issuance.</div>
          <div style="font-size:11px; color:#0284c7; margin-top:4px;">👉 Click here to issue certificate in table</div>
        </div>
      `).join("");
    }
  }

  contentList.innerHTML = htmlOutput;
}

function jumpToAdminRow(tabId, navBtnId, rowIndex, type) {
  const modal = document.getElementById("adminFilterPopupModal");
  if (modal) modal.classList.remove("active-modal");

  switchErpTab(tabId, navBtnId);

  setTimeout(() => {
    const tableBodyId = type === 'order' ? 'adminOrdersTableBody' : 'adminBookingsTableBody';
    const tbody = document.getElementById(tableBodyId);
    if (!tbody) return;
    const targetRow = tbody.children[rowIndex];
    if (targetRow) {
      targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetRow.style.backgroundColor = "#fef08a";
      setTimeout(() => {
        targetRow.style.transition = "background-color 1.5s ease";
        targetRow.style.backgroundColor = "";
      }, 1500);
    }
  }, 100);
}

// =========================================================
// PASSWORD & AUTH ENGINE
// =========================================================
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
    feedback.textContent = "❌ Weak password! Ensure 8+ chars, 1 uppercase (A-Z), 1 number (0-9), and 1 symbol (@$!%*?&).";
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
    if (notif.action === 'certificate' || notif.action === 'booking') {
      openBookingsModal();
    } else {
      openOrdersModal();
    }
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
        <div style="font-size:10px; color:var(--accent); margin-top:4px; font-weight:bold;">👉 Click to open details</div>
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

document.addEventListener('click', function(e) {
  const wrapper = document.getElementById("notificationBellWrapper");
  const panel = document.getElementById("notificationDropdownPanel");
  if (wrapper && panel && !wrapper.contains(e.target)) {
    if (panel.style.display === "block") {
      markAllNotificationsAsRead();
    }
    panel.style.display = "none";
  }
});

function scrollToCartSection() {
  const target = document.getElementById("cartBasketSidebar");
  if (target) {
    target.scrollIntoView({ behavior: 'smooth' });
    target.style.boxShadow = "0 0 15px rgba(22, 163, 74, 0.5)";
    setTimeout(() => { target.style.boxShadow = ""; }, 1500);
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
  switchSubAccountingTab('subTabDryStock');
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
    alert("⚠️ Kripya Strong Password dalein!\n\nRules:\n• Minimum 8 characters\n• Kam se kam 1 Capital letter (A-Z)\n• Kam se kam 1 Number (0-9)\n• Kam se kam 1 Special character (@$!%*?&)");
    return;
  }

  const existing = usersDatabase.find(u => u && u.email && u.email.toLowerCase() === email.toLowerCase());
  if(existing) {
    alert("Is Email ID se account pehle se bana hua hai!");
    return;
  }

  const now = new Date();
  const currentFormattedDateTime = now.toLocaleDateString('en-IN') + " " + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  const newUser = { name, phone, email, password, registeredOn: currentFormattedDateTime };
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

function toggleOrderDetailsView(orderId) {
  const panel = document.getElementById(`order-details-${orderId}`);
  const arrow = document.getElementById(`arrow-${orderId}`);
  if (!panel) return;
  if (panel.style.display === "none" || panel.style.display === "") {
    panel.style.display = "block";
    if (arrow) arrow.textContent = "▲";
  } else {
    panel.style.display = "none";
    if (arrow) arrow.textContent = "▼";
  }
}

function loadUserPanelData() {
  if (!currentUser) return;
  const oList = document.getElementById("userOrdersList");
  const bList = document.getElementById("userBookingsList");
  const historyCertWrapper = document.getElementById("historyCertificateWrapper");
  const historyCertContainer = document.getElementById("historyCertificatesContainer");
  
  const myOrders = orderRegistry.filter(o => o && o.email === currentUser.email);
  const myBookings = bookingsRegistry.filter(b => b && b.email === currentUser.email);

  if (oList) {
    oList.innerHTML = myOrders.length ? myOrders.map(o => {
      const isDelivered = o.status === 'Delivered' || o.trackingStage === 'Delivered';
      const isApproved = o.status === 'Approved' || isDelivered;
      const isCancelled = o.status && o.status.startsWith('Cancelled');
      const isRejected = o.status && o.status.startsWith('Rejected');
      const isPending = o.status === 'Pending Verification';

      const stage = o.trackingStage || (isDelivered ? 'Delivered' : (isApproved ? 'Packed' : 'Placed'));
      const orderPlacedDate = o.dateLogged || new Date().toLocaleDateString('en-IN');
      const courier = o.courierName || "Ekart Logistics";
      const awb = o.trackingNumber || ("FMPC" + Math.floor(1000000000 + Math.random() * 9000000000));
      const loc = o.currentLocation || "Farm Facility";
      const arrivalDeliveryDate = o.deliveryDays || "2-4 Business Days";
      const refundCompletedDate = o.refundCreditedDate || orderPlacedDate;
      const prodImg = getOrderProductImage(o.products);

      const stageMap = { 'Placed': 1, 'Packed': 2, 'Shipped': 3, 'OutForDelivery': 4, 'Delivered': 5 };
      const curLevel = stageMap[stage] || (isDelivered ? 5 : (isApproved ? 2 : 1));

      let statusDotColor = "#16a34a";
      let statusText = "Delivered on " + (arrivalDeliveryDate !== "2-4 Business Days" ? arrivalDeliveryDate : orderPlacedDate);
      let subtitleText = `Delivered to your address via ${courier}`;

      if (isPending) {
        statusDotColor = "#eab308";
        statusText = "Verification Pending";
        subtitleText = "Admin is reviewing payment";
      } else if (isCancelled) {
        if (o.refundStage === 'Refund Credited') {
          statusDotColor = "#16a34a";
          statusText = "Refund Completed " + refundCompletedDate;
          subtitleText = `Refund of ₹${o.total} credited to UPI`;
        } else {
          statusDotColor = "#ea580c";
          statusText = "Cancelled / " + (o.refundStage || 'Refund Initiated');
          subtitleText = "Your order was cancelled by Farm Admin.";
        }
      } else if (isRejected) {
        statusDotColor = "#ef4444";
        statusText = "Order Rejected";
        subtitleText = "Payment Not Verified / Invalid UTR";
      } else {
        if (stage === 'Placed') { statusText = "Order Placed " + orderPlacedDate; subtitleText = "Your order has been placed."; }
        else if (stage === 'Packed') { statusText = "Seller Packed & Ready"; subtitleText = `Dispatched with ${courier}`; }
        else if (stage === 'Shipped') { statusText = "Shipped via " + courier; subtitleText = `AWB: ${awb}`; }
        else if (stage === 'OutForDelivery') { statusText = "Out For Delivery"; subtitleText = `Arriving Today via ${courier}`; }
        else if (stage === 'Delivered') { statusText = "Delivered " + (arrivalDeliveryDate !== "2-4 Business Days" ? arrivalDeliveryDate : orderPlacedDate); subtitleText = "Delivered safely to your doorstep"; }
      }

      return `
        <div style="border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 14px; background:#fff; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.04);">
          <div onclick="toggleOrderDetailsView('${o.orderId}')" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; cursor: pointer; gap: 10px; background: #ffffff; overflow-x: auto; -webkit-overflow-scrolling: touch;">
            <div style="display: flex; align-items: center; gap: 12px; min-width: 180px; flex: 1;">
              <img src="${prodImg}" alt="Product Photo" style="width: 58px; height: 58px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0; flex-shrink: 0; background:#f8fafc;">
              <div>
                <strong style="font-size: 13.5px; color: #1e293b; display: block; line-height: 1.3;">${o.products}</strong>
                <span style="font-size: 11.5px; color: #64748b; margin-top: 2px; display: block;">
                  Ref: ${o.orderId}<br>Total: <strong style="color: #0f172a;">₹${o.total}</strong>
                </span>
              </div>
            </div>

            <div style="text-align: right; min-width: 160px; flex-shrink: 0;">
              <div style="display: flex; align-items: center; justify-content: flex-end; gap: 5px;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: ${statusDotColor}; display: inline-block; flex-shrink: 0;"></span>
                <strong style="font-size: 12.5px; color: #1e293b; white-space: nowrap;">${statusText}</strong>
              </div>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px; line-height: 1.2;">${subtitleText}</div>
            </div>

            <span id="arrow-${o.orderId}" style="font-size: 11px; color: #94a3b8; margin-left: 4px; flex-shrink: 0;">▼</span>
          </div>

          <div id="order-details-${o.orderId}" style="display: none; padding: 14px 16px; background: #f8fafc; border-top: 1px solid #f1f5f9;">
            <div style="background:#fff; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-size:13px; margin-bottom: 12px; line-height:1.6;">
              <div><strong>📅 Order Placed Date:</strong> <span style="color:#0284c7; font-weight:bold;">${orderPlacedDate}</span></div>
              <div><strong>Shipping Address:</strong> <span style="color:#475569;">${o.address || 'N/A'}</span></div>
              <div><strong>Contact Number:</strong> <span style="color:#475569;">${o.phone || 'N/A'}</span></div>
              <div style="margin-top:4px;"><strong>Payment Mode:</strong> <span class="badge" style="background:#eef2ff; color:#3730a3;">${o.paymentMode || 'UPI'}</span> | <strong>Txn ID:</strong> <code>${o.txnId || 'N/A'}</code> | <strong>Your UPI:</strong> <code style="color:var(--accent); font-weight:bold;">${o.userUpiId || 'N/A'}</code></div>
              
              ${isApproved && !isCancelled && !isRejected ? `
                <div style="margin-top:8px; background:#f0fdf4; padding:10px 12px; border-radius:6px; border:1px solid #bbf7d0; color:#15803d; font-size:13px; line-height:1.5;">
                  <strong>🚚 Target Delivery Date:</strong> <span style="font-weight:800; font-size:14px; text-decoration:underline;">${arrivalDeliveryDate}</span><br>
                  <strong>📦 Dispatched Courier:</strong> <span>${courier}</span> (AWB Tracking Code: <code>${awb}</code>)
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join("") : "No active orders mapped for this profile.";
  }

  if (bList) {
    bList.innerHTML = myBookings.length ? myBookings.map(b => {
      const isConfirmed = b.status === 'Confirmed' || b.status === 'Approved';
      let statusColor = isConfirmed ? 'var(--accent)' : (b.status && b.status.startsWith('Rejected') ? 'var(--danger)' : 'var(--warn)');
      const certNote = b.certIssued ? `<br><span style="color:var(--accent); font-weight:bold;">📜 Certificate Approved & Ready to Download below!</span>` : (isConfirmed ? `<br><span style="color:#d97706; font-size:12px;">⏳ Step 1: Farm Booking Confirmed. Step 2: Certificate will unlock after training.</span>` : '');
      
      return `
        <div class="data-item-card" style="border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; margin-bottom: 10px; background:#fff;">
          <strong>Booking ID: ${b.bookingId || ''}</strong><br>
          <small>Booked On: ${b.dateLogged || ''}</small><br>
          <strong>Scheme: ${b.type || ''} Visit [<span style="color:${statusColor}; font-weight:bold;">${isConfirmed ? 'Booking Confirmed' : (b.status || 'Pending Verification')}</span>]</strong>
          <br><small>Your UPI ID: <code style="color:var(--accent);">${b.userUpiId || 'N/A'}</code></small>
          ${certNote}
        </div>
      `;
    }).join("") : "No course training applications logged.";

    const issuedBookings = myBookings.filter(b => b.certIssued === true);

    if (issuedBookings.length > 0 && historyCertWrapper && historyCertContainer) {
      let historyCertHtml = "";
      issuedBookings.forEach((b) => {
        const titleText = b.type === "Student" ? "Certificate of Internship" : "Certificate of Farming";
        historyCertHtml += `
          <div style="padding: 10px; background: #fff; border: 1px solid var(--line); border-radius: 8px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
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
    } else if (historyCertWrapper) {
      historyCertWrapper.style.display = "none";
    }
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
  
  const buttons = ['btnSubTabDryStock', 'btnSubTabExpense', 'btnSubTabSell', 'btnSubTabBuy', 'btnSubTabDamage'];
  buttons.forEach(bId => {
    if(document.getElementById(bId)) document.getElementById(bId).style.background = 'var(--muted)';
  });
  
  let targetActiveButton = 'btn' + subTabId.charAt(0).toUpperCase() + subTabId.slice(1);
  if(document.getElementById(targetActiveButton)) document.getElementById(targetActiveButton).style.background = 'var(--accent)';
}

function deleteUserAccount(idx) {
  if (confirm(`Kya aap sach me ${usersDatabase[idx].name} ka account delete karna chahte hain?`)) {
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
  const totalOrders = validOrders.length;
  
  const approvedOrdersList = validOrders.filter(o => o.status === 'Approved' || o.status === 'Delivered');
  const approvedOnlineRevenue = approvedOrdersList.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const directOfflineSales = salesRegistry.reduce((sum, s) => sum + Number(s.paidAmount !== undefined ? s.paidAmount : s.total || 0), 0);
  const approvedTotalRevenue = approvedOnlineRevenue + directOfflineSales;
  
  const pendingOrders = validOrders.filter(o => o.status !== 'Delivered' && o.trackingStage !== 'Delivered' && !o.status.startsWith('Cancelled') && !o.status.startsWith('Rejected')).length;
  const refundPendingCount = validOrders.filter(o => o.status && o.status.startsWith('Cancelled') && o.refundStage !== 'Refund Credited').length;

  if (document.getElementById("adminTotalOrdersCount")) document.getElementById("adminTotalOrdersCount").textContent = totalOrders;
  if (document.getElementById("adminApprovedRevenueValue")) document.getElementById("adminApprovedRevenueValue").textContent = `Rs ${approvedTotalRevenue.toFixed(2)}`;
  if (document.getElementById("adminPendingOrdersCount")) document.getElementById("adminPendingOrdersCount").textContent = pendingOrders;
  if (document.getElementById("adminRefundPendingCount")) document.getElementById("adminRefundPendingCount").textContent = refundPendingCount;

  if (document.getElementById("adminOrdersTableBody")) {
    if (!validOrders.length) {
      document.getElementById("adminOrdersTableBody").innerHTML = `<tr><td colspan="10" style="text-align:center; color:var(--muted); padding:24px; font-weight:bold;">No customer orders placed yet.</td></tr>`;
    } else {
      document.getElementById("adminOrdersTableBody").innerHTML = validOrders.map((o, idx) => {
        const grandTotal = Number(o.total || 0);
        const mode = o.paymentMode || "Online UPI";
        const status = o.status || "Pending Verification";
        const isDelivered = status === 'Delivered' || o.trackingStage === 'Delivered';
        const isApproved = status === 'Approved' || isDelivered;
        const isCancelled = status.startsWith('Cancelled');
        const isRejected = status.startsWith('Rejected');
        
        const stage = o.trackingStage || (isDelivered ? 'Delivered' : (isApproved ? 'Packed' : 'Placed'));
        const loc = o.currentLocation || 'Farm Facility';
        const eta = o.deliveryDays || '';
        const courier = o.courierName || 'Ekart Logistics';
        const refundDate = o.refundCreditedDate || getTodayIsoString();
        const displayDateTime = o.dateLogged || new Date().toLocaleDateString('en-IN');
        const userUpi = o.userUpiId || "N/A";

        return `
          <tr>
            <td><strong>${o.orderId}</strong></td>
            <td style="white-space: nowrap;"><span style="color:#0284c7; font-weight:bold; font-size:12px;">📅 ${displayDateTime}</span></td>
            <td><strong>${o.name}</strong><br><small>${o.phone || 'N/A'}</small></td>
            <td><small>${o.address || 'N/A'}</small></td>
            <td>${o.products || 'N/A'}</td>
            <td style="color:var(--accent); font-weight:bold;">Rs ${grandTotal}</td>
            <td>
              <span class="badge" style="background:#eef2ff; color:#3730a3;">${mode}</span><br>
              <small>Txn: <code>${o.txnId || 'N/A'}</code></small>
            </td>
            <td><span class="badge">${status}</span></td>
            <td>
              ${isApproved && !isCancelled && !isRejected ? `
                <input type="date" value="${eta}" style="font-size:11px;" onchange="updateExpectedDeliveryDate(${idx}, this.value)">
              ` : ''}
            </td>
            <td>
              <button class="btn" style="padding:6px 10px; font-size:11.5px; background:#0f172a;" onclick="openOrderActionsMenu(${idx})">⚙️ Manage</button>
            </td>
          </tr>
        `;
      }).join("");
    }
  }

  const validBookings = bookingsRegistry.filter(b => b && b.name && b.bookingId);
  const totalStudents = validBookings.filter(b => b.type === "Student").length;
  const totalFarmers = validBookings.filter(b => b.type === "Farmer").length;
  const totalBookingsFee = validBookings.filter(b => b.status === "Confirmed" || b.status === "Approved").reduce((sum, b) => sum + Number(b.fee || 0), 0);
  const pendingBookings = validBookings.filter(b => b.status === "Pending Verification").length;
  const pendingCertificates = validBookings.filter(b => (b.status === "Confirmed" || b.status === "Approved") && !b.certIssued).length;

  if (document.getElementById("adminTotalStudentsCount")) document.getElementById("adminTotalStudentsCount").textContent = totalStudents;
  if (document.getElementById("adminTotalFarmersCount")) document.getElementById("adminTotalFarmersCount").textContent = totalFarmers;
  if (document.getElementById("adminTotalBookingsFee")) document.getElementById("adminTotalBookingsFee").textContent = `Rs ${totalBookingsFee.toFixed(2)}`;
  if (document.getElementById("adminBookingsPendingCount")) document.getElementById("adminBookingsPendingCount").textContent = pendingBookings;
  if (document.getElementById("adminCertificatesPendingCount")) document.getElementById("adminCertificatesPendingCount").textContent = pendingCertificates;

  if (document.getElementById("adminBookingsTableBody")) {
    if (!validBookings.length) {
      document.getElementById("adminBookingsTableBody").innerHTML = `<tr><td colspan="10" style="text-align:center; padding:24px;">No registrations yet.</td></tr>`;
    } else {
      document.getElementById("adminBookingsTableBody").innerHTML = validBookings.map((b, idx) => {
        const isConfirmed = b.status === "Confirmed" || b.status === "Approved";
        const certIssued = b.certIssued === true;
        return `
          <tr>
            <td><strong>${b.bookingId}</strong></td>
            <td>${b.type}</td>
            <td><strong>${b.name}</strong><br><small>${b.phone || ''}</small></td>
            <td>Rs ${b.fee || 0}</td>
            <td><code>${b.userUpiId || 'N/A'}</code></td>
            <td>${b.status}</td>
            <td>${certIssued ? 'Approved' : 'Pending'}</td>
            <td>
              <button class="btn" style="padding:4px 8px; font-size:11px;" onclick="confirmBookingSlot(${idx})">Approve</button>
            </td>
          </tr>
        `;
      }).join("");
    }
  }

  if (document.getElementById("adminUsersTableBody")) {
    const validUsers = usersDatabase.filter(u => u && u.name && u.email);
    document.getElementById("adminUsersTableBody").innerHTML = validUsers.map((u, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${u.name}</strong></td>
        <td>${u.phone || 'N/A'}</td>
        <td><code>${u.email}</code></td>
        <td><mark>${u.password || '******'}</mark></td>
        <td><button class="btn" style="background:var(--danger);" onclick="deleteUserAccount(${idx})">Delete</button></td>
      </tr>
    `).join("");
  }
}

function openOrderActionsMenu(idx) {
  const o = orderRegistry[idx];
  const choice = prompt(`Select action for Order #${o.orderId}:\n1. Approve\n2. Reject\n3. Cancel & Refund\n4. Edit Details`, "1");
  if (choice === "1") handleOrderApprove(idx);
  else if (choice === "2") handleOrderReject(idx);
  else if (choice === "3") handleOrderCancelRefund(idx);
}

function handleOrderApprove(idx) {
  const o = orderRegistry[idx];
  o.status = "Approved";
  o.trackingStage = "Packed";
  localStorage.setItem('pgf_orders', JSON.stringify(orderRegistry));
  populateAdminDashboardTables();
  computeFinancialLedgerStatements();
}

function handleOrderReject(idx) {
  const o = orderRegistry[idx];
  o.status = "Rejected";
  localStorage.setItem('pgf_orders', JSON.stringify(orderRegistry));
  populateAdminDashboardTables();
  computeFinancialLedgerStatements();
}

function handleOrderCancelRefund(idx) {
  const o = orderRegistry[idx];
  o.status = "Cancelled";
  o.refundStage = "Refund Credited";
  localStorage.setItem('pgf_orders', JSON.stringify(orderRegistry));
  populateAdminDashboardTables();
  computeFinancialLedgerStatements();
}

function confirmBookingSlot(idx) {
  bookingsRegistry[idx].status = "Confirmed";
  bookingsRegistry[idx].certIssued = true;
  localStorage.setItem('pgf_bookings', JSON.stringify(bookingsRegistry));
  populateAdminDashboardTables();
  computeFinancialLedgerStatements();
}

function computeFinancialLedgerStatements() {
  const approvedOnlineOrdersRevenue = orderRegistry.filter(o => o && (o.status === 'Approved' || o.status === 'Delivered')).reduce((sum, o) => sum + Number(o.total || 0), 0);
  const directOfflineSales = salesRegistry.reduce((sum, s) => sum + Number(s.paidAmount !== undefined ? s.paidAmount : s.total || 0), 0);
  const totalSales = approvedOnlineOrdersRevenue + directOfflineSales;

  const totalPurchases = purchasesRegistry.reduce((sum, p) => sum + Number(p.paidAmount !== undefined ? p.paidAmount : p.total || 0), 0);
  const totalExpenses = expensesRegistry.filter(e => e.category !== "Damage Received").reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const netProfit = totalSales - (totalPurchases + totalExpenses);

  if(document.getElementById("finTotalRevenue")) document.getElementById("finTotalRevenue").textContent = "Rs " + totalSales.toFixed(2);
  if(document.getElementById("finTotalPurchases")) document.getElementById("finTotalPurchases").textContent = "Rs " + totalPurchases.toFixed(2);
  if(document.getElementById("finTotalExpenses")) document.getElementById("finTotalExpenses").textContent = "Rs " + totalExpenses.toFixed(2);
  if(document.getElementById("finNetProfit")) document.getElementById("finNetProfit").textContent = "Rs " + netProfit.toFixed(2);
  if(document.getElementById("cashFarm")) document.getElementById("cashFarm").textContent = "Rs " + approvedOnlineOrdersRevenue.toFixed(2);
}

function saveAdminExpense(e) {
  e.preventDefault();
  const data = {
    date: document.getElementById("expLogDate").value,
    category: document.getElementById("expCategory").value,
    payer: document.getElementById("expPayer").value,
    desc: document.getElementById("expDesc").value,
    amount: parseFloat(document.getElementById("expAmount").value)
  };
  expensesRegistry.push(data);
  localStorage.setItem('pgf_expenses', JSON.stringify(expensesRegistry));
  e.target.reset();
  computeFinancialLedgerStatements();
}

function saveAdminSale(e) {
  e.preventDefault();
  const data = {
    date: document.getElementById("saleLogDate").value,
    product: document.getElementById("saleProduct").value,
    buyer: document.getElementById("saleBuyer").value,
    qty: parseFloat(document.getElementById("saleQty").value),
    rate: parseFloat(document.getElementById("saleRate").value),
    total: parseFloat(document.getElementById("saleQty").value) * parseFloat(document.getElementById("saleRate").value),
    paidAmount: parseFloat(document.getElementById("salePaidAmount").value)
  };
  salesRegistry.push(data);
  localStorage.setItem('pgf_sales', JSON.stringify(salesRegistry));
  e.target.reset();
  computeFinancialLedgerStatements();
}

function saveAdminPurchase(e) {
  e.preventDefault();
  const data = {
    date: document.getElementById("purLogDate").value,
    product: document.getElementById("purProduct").value,
    vendor: document.getElementById("purVendor").value,
    qty: parseFloat(document.getElementById("purQty").value),
    rate: parseFloat(document.getElementById("purRate").value),
    total: parseFloat(document.getElementById("purQty").value) * parseFloat(document.getElementById("purRate").value)
  };
  purchasesRegistry.push(data);
  localStorage.setItem('pgf_purchases', JSON.stringify(purchasesRegistry));
  e.target.reset();
  computeFinancialLedgerStatements();
}

function saveAdminDamage(e) {
  e.preventDefault();
  expensesRegistry.push({
    date: document.getElementById("dmgLogDate").value,
    category: "Damage Received",
    payer: document.getElementById("dmgPayer").value,
    desc: document.getElementById("dmgDesc").value,
    amount: parseFloat(document.getElementById("dmgAmount").value)
  });
  localStorage.setItem('pgf_expenses', JSON.stringify(expensesRegistry));
  e.target.reset();
  computeFinancialLedgerStatements();
}

renderProducts();
checkUserSession();