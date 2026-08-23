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
// HELPER: PRODUCT IMAGE MAPPER & 1-CLICK CLIPBOARD COPY
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

// =========================================================
// SEPARATE MODAL CONTROLLERS (ORDERS & BOOKINGS)
// =========================================================
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
// PASSWORD STRENGTH CHECKER & EYE TOGGLE
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

// =========================================================
// NOTIFICATIONS ENGINE WITH AUTO-READ DISMISS
// =========================================================
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
                  <strong>🚚 Target Delivery Date (Kab Pahuchega):</strong> <span style="font-weight:800; font-size:14px; text-decoration:underline;">${arrivalDeliveryDate}</span><br>
                  <strong>📦 Dispatched Courier:</strong> <span>${courier}</span> (AWB Tracking Code: <code>${awb}</code>)
                </div>
              ` : ''}
            </div>

            ${isPending ? `
              <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 10px; font-size: 13px; color: #92400e;">
                ⏳ <strong>Status: Verification Pending</strong><br>
                <span style="font-size:12px;">Admin jaise hi payment verify karke approve karega, live delivery date aur courier tracking activate ho jayegi.</span>
              </div>
            ` : ''}

            ${(isApproved || stage === 'Placed') && !isCancelled && !isRejected ? `
              <div style="background: #ffffff; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <div class="vertical-timeline">
                  <div class="timeline-step ${curLevel >= 1 ? 'completed' : ''}">
                    <div class="timeline-dot"></div>
                    <div class="timeline-title">Order Confirmed <span>${orderPlacedDate}</span></div>
                    <div class="timeline-desc">Your Order was placed on ${orderPlacedDate}.</div>
                  </div>

                  <div class="timeline-step ${curLevel >= 2 ? 'completed' : ''}">
                    <div class="timeline-dot"></div>
                    <div class="timeline-title">Seller Processed & Packed</div>
                    <div class="timeline-desc">Seller has packed your order at Farm Hub.</div>
                    <div class="timeline-desc" style="color:#0284c7; font-size:12px;">Dispatched with delivery partner: <strong>${courier}</strong></div>
                  </div>

                  <div class="timeline-step ${curLevel >= 3 ? 'completed' : ''}">
                    <div class="timeline-dot"></div>
                    <div class="timeline-title">Shipped</div>
                    <div class="timeline-desc"><strong>${courier} - ${awb}</strong></div>
                    <div class="timeline-desc">Your item has been shipped. (📍 Hub: ${loc})</div>
                  </div>

                  <div class="timeline-step ${curLevel >= 4 ? 'completed' : ''}">
                    <div class="timeline-dot"></div>
                    <div class="timeline-title">Out For Delivery</div>
                    <div class="timeline-desc">Your item is out for delivery with ${courier} executive.</div>
                  </div>

                  <div class="timeline-step ${curLevel >= 5 ? 'completed' : ''}">
                    <div class="timeline-dot"></div>
                    <div class="timeline-title">Delivered <span>(Arriving Date: ${arrivalDeliveryDate})</span></div>
                    <div class="timeline-desc">Item safely delivered to your doorstep.</div>
                  </div>
                </div>
              </div>
            ` : ''}

            ${isCancelled ? `
              <div style="background: #ffffff; padding: 16px; border-radius: 8px; border: 1px solid ${o.refundStage === 'Refund Credited' ? '#86efac' : '#fed7aa'};">
                <div style="background:${o.refundStage === 'Refund Credited' ? '#f0fdf4' : '#fff7ed'}; padding:12px; border-radius:8px; border-left:4px solid ${o.refundStage === 'Refund Credited' ? '#16a34a' : '#ea580c'}; margin-bottom:12px;">
                  <strong style="color:${o.refundStage === 'Refund Credited' ? '#15803d' : '#c2410c'}; font-size:14px;">
                    ${o.refundStage === 'Refund Credited' ? `✅ Refund Completed on ${refundCompletedDate}` : `Refund Status: ${o.refundStage || 'Refund Initiated'}`}
                  </strong>
                  <p style="margin: 4px 0 0 0; font-size: 12.5px; color:${o.refundStage === 'Refund Credited' ? '#166534' : '#7c2d12'};">
                    ${o.refundStage === 'Refund Credited' 
                      ? `• Refund of <strong>₹${o.total}</strong> has been transferred successfully on <strong>${refundCompletedDate}</strong> to your UPI ID: <strong>${o.userUpiId || 'Linked Bank'}</strong>.` 
                      : `• Refund of ₹${o.total} for your order will be credited directly to your UPI ID: <strong>${o.userUpiId || 'Registered Account'}</strong>.`}
                  </p>
                </div>

                <div class="vertical-timeline">
                  <div class="timeline-step completed cancelled-line">
                    <div class="timeline-dot"></div>
                    <div class="timeline-title">Order Placed <span>${orderPlacedDate}</span></div>
                    <div class="timeline-desc">Your Order was placed on ${orderPlacedDate}.</div>
                  </div>
                  
                  <div class="timeline-step ${o.refundStage === 'Refund Credited' ? 'completed' : 'cancelled'}">
                    <div class="timeline-dot" style="${o.refundStage === 'Refund Credited' ? 'background:#16a34a;' : ''}"></div>
                    <div class="timeline-title" style="color:${o.refundStage === 'Refund Credited' ? '#16a34a' : '#ef4444'};">
                      ${o.refundStage === 'Refund Credited' ? `Refund Completed (${refundCompletedDate})` : 'Order Cancelled'}
                    </div>
                    <div class="timeline-desc">${o.refundStage === 'Refund Credited' ? `Full refund of ₹${o.total} credited to your UPI.` : `Reason: ${o.status.replace('Cancelled (Reason: ', '').replace(')', '')}`}</div>
                  </div>
                </div>
              </div>
            ` : ''}

            ${isRejected ? `
              <div style="background: #fef2f2; border: 1px solid #f87171; border-radius: 8px; padding: 12px;">
                <strong style="color: #991b1b; font-size: 14px;">❌ Order Rejected</strong>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #7f1d1d;"><strong>Reason:</strong> ${o.status.replace('Rejected (Reason: ', '').replace(')', '')}</p>
              </div>
            ` : ''}

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

// =========================================================
// LIVE STOCK SUMMARY (DRY, POWDER = DRY, KHAKHRA & PAPAD)
// =========================================================
function renderAdminLiveStockSummary() {
  const container = document.getElementById("adminLiveStockCardsContainer");
  if (!container) return;

  const dryProd = products.find(p => p.type === "dry") || { stock: 0 };
  const khakhraProd = products.find(p => p.type === "khakhra") || { stock: 0 };
  const papadProd = products.find(p => p.type === "papad") || { stock: 0 };

  const synchronizedPowderStock = dryProd.stock;

  container.innerHTML = `
    <div style="background: #fefce8; border: 1px solid #fef08a; padding: 12px; border-radius: 10px;">
      <div style="font-size: 12px; color: #854d0e; font-weight: bold;">🌾 Dry Mushroom Stock</div>
      <div style="font-size: 20px; font-weight: 900; color: #a16207; margin: 4px 0;">${dryProd.stock} kg</div>
    </div>

    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 10px;">
      <div style="font-size: 12px; color: #166534; font-weight: bold;">🧪 Powder Stock (Sync to Dry)</div>
      <div style="font-size: 20px; font-weight: 900; color: #15803d; margin: 4px 0;">${synchronizedPowderStock} kg</div>
    </div>

    <div style="background: #fff7ed; border: 1px solid #ffedd5; padding: 12px; border-radius: 10px;">
      <div style="font-size: 12px; color: #9a3412; font-weight: bold;">🧇 Khakhra Stock</div>
      <div style="font-size: 20px; font-weight: 900; color: #ea580c; margin: 4px 0;">${khakhraProd.stock} packs</div>
    </div>

    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 10px;">
      <div style="font-size: 12px; color: #166534; font-weight: bold;">🫓 Papad Stock</div>
      <div style="font-size: 20px; font-weight: 900; color: #15803d; margin: 4px 0;">${papadProd.stock} packs</div>
    </div>
  `;
}

// =========================================================
// DAILY DRY MUSHROOM STOCK MANAGEMENT & TOTALS
// =========================================================
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

// =========================================================
// ADMIN ERP TABLES, METRICS & INLINE COURIER EDIT
// =========================================================
function populateAdminDashboardTables() {
  renderAdminLiveStockSummary();
  renderDailyDryStockTable();

  const validOrders = orderRegistry.filter(o => o && o.name && o.orderId);
  
  const approvedOrdersList = validOrders.filter(o => o.status === 'Approved' || o.status === 'Delivered');
  const approvedOnlineRevenue = approvedOrdersList.reduce((sum, o) => sum + Number(o.total || 0), 0);
  
  const pendingConfirmCount = validOrders.filter(o => o && o.status === 'Pending Verification').length;
  const pendingDeliveryCount = validOrders.filter(o => o && o.status === 'Approved' && o.trackingStage !== 'Delivered' && o.status !== 'Delivered').length;
  const refundPendingCount = validOrders.filter(o => o && o.status && o.status.startsWith('Cancelled') && o.refundStage !== 'Refund Credited').length;

  if (document.getElementById("adminPendingConfirmCount")) document.getElementById("adminPendingConfirmCount").textContent = pendingConfirmCount;
  if (document.getElementById("adminPendingDeliveryCount")) document.getElementById("adminPendingDeliveryCount").textContent = pendingDeliveryCount;
  if (document.getElementById("adminApprovedRevenueValue")) document.getElementById("adminApprovedRevenueValue").textContent = `Rs ${approvedOnlineRevenue.toFixed(2)}`;
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
            <td style="white-space: nowrap;">
              <span style="color:#0284c7; font-weight:bold; font-size:12px;">📅 ${displayDateTime}</span>
            </td>
            <td>
              <strong>${o.name}</strong><br>
              <small>${o.phone || 'N/A'}</small><br>
              <small class="muted">${o.email || ''}</small>
            </td>
            <td><small>${o.address || 'N/A'}</small></td>
            <td>${o.products || 'N/A'}</td>
            <td style="color:var(--accent); font-weight:bold; font-size:14px;">Rs ${grandTotal}</td>
            <td>
              <span class="badge" style="background:#eef2ff; color:#3730a3; margin-bottom:3px; font-weight:bold;">${mode}</span><br>
              <small>Txn: <code>${o.txnId || 'N/A'}</code></small><br>
              <div style="display:flex; align-items:center; gap:4px; margin-top:2px;">
                <code style="background:#f1f5f9; padding:2px 4px; border-radius:4px; color:#0f172a; font-size:11px;">UPI: ${userUpi}</code>
                ${userUpi !== 'N/A' ? `<button type="button" title="Copy UPI ID" style="padding:1px 5px; min-height:auto; font-size:10px; background:#0284c7;" onclick="copyToClipboard('${userUpi}')">📋</button>` : ''}
              </div>
            </td>
            <td>
              <span class="badge ${isDelivered ? 'badge-confirmed' : (isCancelled ? 'badge-pending' : (isRejected ? 'badge-pending' : (isApproved ? 'badge-confirmed' : 'badge-pending')))}" style="${isRejected ? 'background:#fee2e2; color:#991b1b;' : (isCancelled ? 'background:#ffedd5; color:#c2410c;' : (isDelivered ? 'background:#16a34a; color:#fff;' : ''))}">
                ${status}
              </span>
              ${isCancelled ? `<br><small style="color:${o.refundStage === 'Refund Credited' ? '#16a34a' : '#ea580c'}; font-weight:bold;">Refund: ${o.refundStage || 'Initiated'} ${o.refundCreditedDate ? `(${o.refundCreditedDate})` : ''}</small>` : ''}
            </td>
            
            <td style="min-width: 280px;">
              ${isApproved && !isCancelled && !isRejected ? `
                <div style="background:#f8fafc; padding:8px; border-radius:8px; border:1px solid #e2e8f0; font-size:12px;">
                  <div style="margin-bottom:6px; display:flex; align-items:center; gap:4px; background:#fff; padding:4px 6px; border-radius:6px; border:1px solid #cbd5e1;">
                    <label style="font-size:11px; font-weight:bold; color:#0f172a; white-space:nowrap;">📅 Delivery Date:</label>
                    <input type="date" value="${eta}" style="padding:2px 4px; font-size:11px; width:100%; border:1px solid #94a3b8; border-radius:4px;" onchange="updateExpectedDeliveryDate(${idx}, this.value)">
                  </div>

                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; gap:4px;">
                    <span style="font-weight:bold; color:#0284c7; white-space:nowrap;">Stage: ${stage}</span>
                    <input type="text" value="${courier}" placeholder="Courier Name (e.g. Ekart)" style="padding:2px 6px; font-size:11px; font-weight:bold; color:#334155; border:1px solid #94a3b8; border-radius:4px; width:140px; text-align:right;" onchange="updateOrderCourierDirect(${idx}, this.value)">
                  </div>
                  
                  <div style="color:#334155; margin-bottom:6px;">📍 ${loc}</div>

                  <div style="display:flex; gap:3px; flex-wrap:wrap;">
                    <button type="button" class="btn" style="padding:2px 5px; font-size:10px; min-height:22px; background:${stage==='Placed'?'#2b8a3e':'#94a3b8'};" onclick="setOrderStageDirect(${idx}, 'Placed')">Placed</button>
                    <button type="button" class="btn" style="padding:2px 5px; font-size:10px; min-height:22px; background:${stage==='Packed'?'#2b8a3e':'#94a3b8'};" onclick="setOrderStageDirect(${idx}, 'Packed')">Packed</button>
                    <button type="button" class="btn" style="padding:2px 5px; font-size:10px; min-height:22px; background:${stage==='Shipped'?'#2b8a3e':'#94a3b8'};" onclick="setOrderStageDirect(${idx}, 'Shipped')">Shipped</button>
                    <button type="button" class="btn" style="padding:2px 5px; font-size:10px; min-height:22px; background:${stage==='OutForDelivery'?'#2b8a3e':'#94a3b8'};" onclick="setOrderStageDirect(${idx}, 'OutForDelivery')">Out Delivery</button>
                    <button type="button" class="btn" style="padding:2px 5px; font-size:10px; min-height:22px; background:${stage==='Delivered'?'#16a34a':'#94a3b8'};" onclick="setOrderStageDirect(${idx}, 'Delivered')">Delivered</button>
                  </div>
                </div>
              ` : (isCancelled ? `
                <div style="background:#fffaf5; padding:8px; border-radius:8px; border:1px solid #fdba74; font-size:12px;">
                  <span style="font-weight:bold; color:#ea580c;">Refund Control Action</span>
                  
                  <div style="margin: 6px 0 4px 0; display:flex; align-items:center; gap:4px; background:#fff; padding:3px 6px; border-radius:4px; border:1px solid #cbd5e1;">
                    <label style="font-size:10.5px; font-weight:bold; white-space:nowrap;">📅 Refund Date:</label>
                    <input type="date" value="${refundDate}" id="refundDateInput_${idx}" style="padding:1px 4px; font-size:11px; width:100%; border:1px solid #94a3b8; border-radius:4px;" onchange="updateOrderRefundDate(${idx}, this.value)">
                  </div>

                  <div style="display:flex; gap:4px; flex-wrap:wrap; margin-top:4px;">
                    <button type="button" class="btn" style="padding:3px 6px; font-size:11px; min-height:24px; background:${o.refundStage==='Refund Initiated'?'#ea580c':'#94a3b8'};" onclick="setRefundStageDirect(${idx}, 'Refund Initiated')">Initiated</button>
                    <button type="button" class="btn" style="padding:3px 6px; font-size:11px; min-height:24px; background:${o.refundStage==='Refund Processing'?'#ea580c':'#94a3b8'};" onclick="setRefundStageDirect(${idx}, 'Refund Processing')">Processing</button>
                    <button type="button" class="btn" style="padding:3px 6px; font-size:11px; min-height:24px; background:${o.refundStage==='Refund Credited'?'#16a34a':'#dc2626'}; font-weight:bold;" onclick="setRefundStageDirect(${idx}, 'Refund Credited')">💸 Credited (Deduct Cash)</button>
                  </div>
                </div>
              ` : (isRejected ? `<span style="color:#dc2626; font-weight:bold; font-size:12px;">Rejected</span>` : `<span style="color:#d97706; font-weight:bold; font-size:12px;">Approve or Cancel to track</span>`))}
            </td>

            <td>
              <button class="btn" style="padding:6px 10px; font-size:11.5px; background:#0f172a; border-radius:6px;" onclick="openOrderActionsMenu(${idx})">
                ⚙️ Manage Order
              </button>
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
      document.getElementById("adminBookingsTableBody").innerHTML = `<tr><td colspan="10" style="text-align:center; color:var(--muted); padding:24px; font-weight:bold;">No student or farmer training registrations yet.</td></tr>`;
    } else {
      const bookingsTbody = document.getElementById("adminBookingsTableBody");
      bookingsTbody.innerHTML = validBookings.map((b, idx) => {
        const isStudent = b.type === "Student";
        const submittedDetails = isStudent ? `
          <div style="line-height:1.4;">
            <strong>College:</strong> ${b.college || 'N/A'}<br>
            <strong>Course:</strong> ${b.course || 'N/A'} (Roll: ${b.enrollment || 'N/A'})<br>
            <strong>Dates:</strong> <span style="color:#0369a1; font-weight:600;">${b.start || 'N/A'}</span> to <span style="color:#0369a1; font-weight:600;">${b.end || 'N/A'}</span>
          </div>
        ` : `
          <div style="line-height:1.4;">
            <strong>Session Date:</strong> <span style="color:#92400e; font-weight:600;">${b.date || 'N/A'}</span><br>
            <span class="muted">Farmer Practical Training</span>
          </div>
        `;

        const mode = b.paymentMode || "UPI Gateway";
        const isConfirmed = b.status === "Confirmed" || b.status === "Approved";
        const certIssued = b.certIssued === true;
        const bUpi = b.userUpiId || "N/A";

        return `
          <tr>
            <td><strong>${b.bookingId}</strong></td>
            <td><span class="badge" style="background:${isStudent ? '#e0f2fe; color:#0369a1;' : '#fef3c7; color:#92400e;'}">${b.type || 'Booking'}</span></td>
            <td>
              <strong>${b.name}</strong><br>
              <small>${b.phone || 'N/A'}</small><br>
              <small class="muted">${b.email || 'N/A'}</small>
            </td>
            <td><small>${submittedDetails}</small></td>
            <td style="font-weight:bold; color:var(--accent); font-size:14px;">Rs ${b.fee || 0}</td>
            <td>
              <span class="badge" style="background:#eef2ff; color:#3730a3; margin-bottom:3px; font-weight:bold;">${mode}</span><br>
              <small>Txn: <code>${b.txnId || 'N/A'}</code></small><br>
              <div style="display:flex; align-items:center; gap:4px; margin-top:2px;">
                <code style="background:#f1f5f9; padding:2px 4px; border-radius:4px; color:#0f172a; font-size:11px;">UPI: ${bUpi}</code>
                ${bUpi !== 'N/A' ? `<button type="button" title="Copy UPI ID" style="padding:1px 5px; min-height:auto; font-size:10px; background:#0284c7;" onclick="copyToClipboard('${bUpi}')">📋</button>` : ''}
              </div>
            </td>
            <td><small style="color:#0284c7; font-weight:bold;">${b.dateLogged || 'N/A'}</small></td>
            <td>
              <span class="badge ${isConfirmed ? 'badge-confirmed' : 'badge-pending'}">${isConfirmed ? '1. Confirmed' : 'Pending'}</span>
            </td>
            <td>
              <span class="badge ${certIssued ? 'badge-confirmed' : 'badge-pending'}">${certIssued ? '2. Approved' : 'Pending Approval'}</span>
            </td>
            <td>
              <div style="display:flex; flex-direction:column; gap:4px;">
                ${!isConfirmed ? `
                  <button class="btn" style="padding:4px 8px; min-height:auto; font-size:11px; background:var(--accent);" onclick="confirmBookingSlot(${idx})">1. Approve Farm Book</button>
                  <button class="btn" style="padding:4px 8px; min-height:auto; font-size:11px; background:var(--danger);" onclick="rejectTrainingBooking(${idx})">Reject</button>
                ` : `
                  ${!certIssued ? `
                    <button class="btn" style="padding:4px 8px; min-height:auto; font-size:11px; background:#0284c7;" onclick="issueUserCertificate(${idx})">2. Approve Certificate</button>
                  ` : `
                    <button type="button" class="btn" style="padding:3px 6px; min-height:auto; font-size:11px; background:var(--accent);" onclick="downloadCertificatePDF('${b.bookingId}')">📜 Download PDF</button>
                  `}
                `}
                <button type="button" class="btn" style="padding:3px 6px; min-height:auto; font-size:10px; background:#4b5563;" onclick="adminEditCertificateData(${idx})">✏️ Edit Certificate</button>
              </div>
            </td>
          </tr>
        `;
      }).join("");
    }
  }

  if (document.getElementById("adminUsersTableBody")) {
    const validUsers = usersDatabase.filter(u => u && u.name && u.email);
    if (!validUsers.length) {
      document.getElementById("adminUsersTableBody").innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--muted); padding:24px; font-weight:bold;">No users registered yet.</td></tr>`;
    } else {
      document.getElementById("adminUsersTableBody").innerHTML = validUsers.map((u, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>${u.name}</strong></td>
          <td>${u.phone || 'N/A'}</td>
          <td><code>${u.email}</code></td>
          <td><mark style="background:#f3f4f6; padding:2px 4px; border-radius:4px;">${u.password || '******'}</mark></td>
          <td>
            <button class="btn" style="padding:4px 8px; min-height:auto; background:var(--danger);" onclick="deleteUserAccount(${idx})">Delete Account</button>
          </td>
        </tr>
      `).join("");
    }
  }
}

// =========================================================
// ADMIN FILTER MODAL POPUP FOR LISTS & PENDING ITEMS
// =========================================================
function openAdminFilterModal(type) {
  const modal = document.getElementById("adminFilterPopupModal");
  const titleEl = document.getElementById("adminFilterModalTitle");
  const listEl = document.getElementById("adminFilterModalContentList");
  if (!modal || !titleEl || !listEl) return;

  modal.classList.add("active-modal");
  let htmlContent = "";

  if (type === 'orders_pending_confirm') {
    titleEl.textContent = "⌛ Pending Confirm Orders List";
    const pendingConfirmList = orderRegistry.filter(o => o && o.name && o.status === 'Pending Verification');
    
    if (pendingConfirmList.length === 0) {
      htmlContent = `<p class="muted" style="text-align:center; padding:15px;">No pending confirmation orders.</p>`;
    } else {
      htmlContent = pendingConfirmList.map(o => `
        <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; padding:12px; display:flex; justify-content:space-between; align-items:center; gap:10px;">
          <div>
            <strong>${o.orderId} - ${o.name}</strong><br>
            <small class="muted">Products: ${o.products} | Total: ₹${o.total}</small><br>
            <small style="color:var(--warn); font-weight:bold;">UPI: ${o.userUpiId || 'N/A'} | Txn: ${o.txnId || 'N/A'}</small>
          </div>
          <button type="button" class="btn" style="font-size:12px; padding:6px 12px; min-height:auto;" onclick="closeModalOutside({target:{id:'adminFilterPopupModal'}}, 'adminFilterPopupModal'); switchErpTab('erpOrdersTab', 'tabNavOrders'); adminEditOrderDetails(${orderRegistry.indexOf(o)}); ">✏️ Edit & Approve</button>
        </div>
      `).join("");
    }
  } else if (type === 'orders_pending_delivery') {
    titleEl.textContent = "🚚 Orders Pending Delivery List";
    const pendingDeliveryList = orderRegistry.filter(o => o && o.name && o.status === 'Approved' && o.trackingStage !== 'Delivered' && o.status !== 'Delivered');
    
    if (pendingDeliveryList.length === 0) {
      htmlContent = `<p class="muted" style="text-align:center; padding:15px;">No orders pending delivery.</p>`;
    } else {
      htmlContent = pendingDeliveryList.map(o => `
        <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:8px; padding:12px; display:flex; justify-content:space-between; align-items:center; gap:10px;">
          <div>
            <strong>${o.orderId} - ${o.name}</strong><br>
            <small class="muted">Products: ${o.products} | Total: ₹${o.total}</small><br>
            <small style="color:#d97706; font-weight:bold;">Current Stage: ${o.trackingStage || 'Packed'}</small>
          </div>
          <button type="button" class="btn" style="font-size:12px; padding:6px 12px; min-height:auto; background:var(--accent);" onclick="closeModalOutside({target:{id:'adminFilterPopupModal'}}, 'adminFilterPopupModal'); switchErpTab('erpOrdersTab', 'tabNavOrders');">Manage Delivery</button>
        </div>
      `).join("");
    }
  } else if (type === 'orders_refund_pending') {
    titleEl.textContent = "🔄 Refund Pending Orders";
    const refundList = orderRegistry.filter(o => o && o.status && o.status.startsWith('Cancelled') && o.refundStage !== 'Refund Credited');

    if (refundList.length === 0) {
      htmlContent = `<p class="muted" style="text-align:center; padding:15px;">No refund pending orders.</p>`;
    } else {
      htmlContent = refundList.map(o => `
        <div style="background:#fff7ed; border:1px solid #fed7aa; border-radius:8px; padding:12px; display:flex; justify-content:space-between; align-items:center; gap:10px;">
          <div>
            <strong>${o.orderId} - ${o.name}</strong><br>
            <small class="muted">Refund Amount: ₹${o.total} | UPI: ${o.userUpiId || 'N/A'}</small><br>
            <small style="color:#ea580c; font-weight:bold;">Refund Status: ${o.refundStage || 'Initiated'}</small>
          </div>
          <button type="button" class="btn" style="font-size:12px; padding:6px 12px; min-height:auto;" onclick="closeModalOutside({target:{id:'adminFilterPopupModal'}}, 'adminFilterPopupModal'); switchErpTab('erpOrdersTab', 'tabNavOrders');">Process Refund</button>
        </div>
      `).join("");
    }
  } else if (type === 'bookings_pending') {
    titleEl.textContent = "⏳ Farm Bookings Pending Verification";
    const pendingBookingsList = bookingsRegistry.filter(b => b && b.name && b.status === "Pending Verification");

    if (pendingBookingsList.length === 0) {
      htmlContent = `<p class="muted" style="text-align:center; padding:15px;">No farm bookings pending verification.</p>`;
    } else {
      htmlContent = pendingBookingsList.map(b => `
        <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:8px; padding:12px; display:flex; justify-content:space-between; align-items:center; gap:10px;">
          <div>
            <strong>${b.bookingId} - ${b.name} (${b.type})</strong><br>
            <small class="muted">Fee: ₹${b.fee} | UPI: ${b.userUpiId || 'N/A'} | Txn: ${b.txnId || 'N/A'}</small>
          </div>
          <button type="button" class="btn" style="font-size:12px; padding:6px 12px; min-height:auto;" onclick="closeModalOutside({target:{id:'adminFilterPopupModal'}}, 'adminFilterPopupModal'); switchErpTab('erpBookingsTab', 'tabNavBookings');">Approve Booking</button>
        </div>
      `).join("");
    }
  } else if (type === 'certificates_pending') {
    titleEl.textContent = "📜 Certificates Pending Approval";
    const pendingCertList = bookingsRegistry.filter(b => b && b.name && (b.status === "Confirmed" || b.status === "Approved") && !b.certIssued);

    if (pendingCertList.length === 0) {
      htmlContent = `<p class="muted" style="text-align:center; padding:15px;">No certificates pending approval.</p>`;
    } else {
      htmlContent = pendingCertList.map(b => `
        <div style="background:#fff7ed; border:1px solid #fed7aa; border-radius:8px; padding:12px; display:flex; justify-content:space-between; align-items:center; gap:10px;">
          <div>
            <strong>${b.bookingId} - ${b.name} (${b.type})</strong><br>
            <small class="muted">Status: Booking Confirmed | Training Completed</small>
          </div>
          <button type="button" class="btn" style="font-size:12px; padding:6px 12px; min-height:auto;" onclick="closeModalOutside({target:{id:'adminFilterPopupModal'}}, 'adminFilterPopupModal'); switchErpTab('erpBookingsTab', 'tabNavBookings');">Issue Certificate</button>
        </div>
      `).join("");
    }
  } else if (type === 'list_orders') {
    titleEl.textContent = "📋 All Orders List";
    htmlContent = orderRegistry.length ? orderRegistry.map(o => `
      <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; padding:10px; font-size:13px;">
        <strong>${o.orderId} - ${o.name}</strong> | Total: ₹${o.total} | Status: <strong>${o.status}</strong><br>
        <small class="muted">Products: ${o.products} | Date: ${o.dateLogged}</small>
      </div>
    `).join("") : `<p class="muted" style="text-align:center;">No orders recorded.</p>`;
  } else if (type === 'list_bookings') {
    titleEl.textContent = "📋 All Farm Training Bookings List";
    htmlContent = bookingsRegistry.length ? bookingsRegistry.map(b => `
      <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; padding:10px; font-size:13px;">
        <strong>${b.bookingId} - ${b.name} (${b.type})</strong> | Fee: ₹${b.fee} | Status: <strong>${b.status}</strong><br>
        <small class="muted">Date: ${b.dateLogged}</small>
      </div>
    `).join("") : `<p class="muted" style="text-align:center;">No bookings recorded.</p>`;
  } else if (type === 'list_sales') {
    titleEl.textContent = "📋 All Wholesale Sales List";
    htmlContent = salesRegistry.length ? salesRegistry.map(s => `
      <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:10px; font-size:13px;">
        <strong>${s.saleId || 'SALE'} - ${s.product}</strong> | Buyer: ${s.buyer} | Qty: ${s.qty} | Price: ₹${s.rate} | Delivery: ₹${s.delivery || 0} | Total: ₹${s.total} (Paid: ₹${s.paidAmount})<br>
        <small class="muted">Date: ${s.date} | Notes: ${s.notes || '-'}</small>
      </div>
    `).join("") : `<p class="muted" style="text-align:center;">No wholesale sales recorded.</p>`;
  } else if (type === 'list_purchases') {
    titleEl.textContent = "📋 All Purchases (Buy) List";
    htmlContent = purchasesRegistry.length ? purchasesRegistry.map(p => `
      <div style="background:#fff7ed; border:1px solid #fed7aa; border-radius:8px; padding:10px; font-size:13px;">
        <strong>${p.purId || 'PUR'} - ${p.product}</strong> | Pese Diye: ${p.funder} | Vendor: ${p.vendor} | Qty: ${p.qty} | Total: ₹${p.total} (Paid: ₹${p.paidAmount})<br>
        <small class="muted">Date: ${p.date} | Notes: ${p.notes || '-'}</small>
      </div>
    `).join("") : `<p class="muted" style="text-align:center;">No purchase records.</p>`;
  } else if (type === 'list_expenses') {
    titleEl.textContent = "📋 All Expenses List";
    const exps = expensesRegistry.filter(e => e.category !== "Damage Received");
    htmlContent = exps.length ? exps.map(e => `
      <div style="background:#fef3c7; border:1px solid #fde68a; border-radius:8px; padding:10px; font-size:13px;">
        <strong>${e.expId || 'EXP'} - ${e.category}</strong> | Payer: ${e.payer} | Amount: ₹${e.amount}<br>
        <small class="muted">Desc: ${e.desc} | Date: ${e.date}</small>
      </div>
    `).join("") : `<p class="muted" style="text-align:center;">No expense records.</p>`;
  } else if (type === 'list_damages') {
    titleEl.textContent = "📋 All Damage Losses List";
    const dmgs = expensesRegistry.filter(e => e.category === "Damage Received");
    htmlContent = dmgs.length ? dmgs.map(d => `
      <div style="background:#fef2f2; border:1px solid #fca5a5; border-radius:8px; padding:10px; font-size:13px;">
        <strong>${d.expId || 'DMG'} - ${d.desc}</strong> | Pese Rakhe: ${d.payer} | Amount: ₹${d.amount}<br>
        <small class="muted">Date: ${d.date} | Notes: ${d.notes || '-'}</small>
      </div>
    `).join("") : `<p class="muted" style="text-align:center;">No damage records.</p>`;
  } else if (type === 'list_partner_expenses') {
    titleEl.textContent = "📋 Soham & Jeet Net Expenses List (6 - 9)";
    htmlContent = `
      <div style="background:#eef2ff; border:1px solid #c7d2fe; border-radius:8px; padding:12px; font-size:14px; line-height:1.6;">
        <strong>Net Expense Summary (Card 6 minus Card 9):</strong><br>
        • Soham Net Expense: <span id="modalSohamNet" style="font-weight:bold; color:#2563eb;">Rs 0.00</span><br>
        • Jeet Net Expense: <span id="modalJeetNet" style="font-weight:bold; color:#d97706;">Rs 0.00</span>
      </div>
    `;
  }

  listEl.innerHTML = htmlContent;
}

function openOrderActionsMenu(idx) {
  const o = orderRegistry[idx];
  const choice = prompt(
    `👉 Select an action for Order #${o.orderId} (${o.name}):\n\n` +
    `1. Approve Order (Sets Delivery Date & Courier)\n` +
    `2. Reject Order\n` +
    `3. Cancel & Refund\n` +
    `4. Edit Details (Phone, Address, Payment Mode, Txn ID & UPI ID)\n\n` +
    `Enter option number (1, 2, 3 or 4):`,
    "1"
  );

  if (!choice) return;

  if (choice.trim() === "1") {
    handleOrderApprove(idx);
  } else if (choice.trim() === "2") {
    handleOrderReject(idx);
  } else if (choice.trim() === "3") {
    handleOrderCancelRefund(idx);
  } else if (choice.trim() === "4") {
    adminEditOrderDetails(idx);
  } else {
    alert("⚠️ Invalid option selected. Please enter 1, 2, 3, or 4.");
  }
}

function updateOrderCourierDirect(idx, newCourier) {
  if (!newCourier) return;
  orderRegistry[idx].courierName = newCourier.trim();
  localStorage.setItem('pgf_orders', JSON.stringify(orderRegistry));
  pushNotification(orderRegistry[idx].email, '🚚 Courier Partner Updated', `Your Order #${orderRegistry[idx].orderId} will be delivered via: ${newCourier}.`, 'order');
}

function updateExpectedDeliveryDate(idx, newDate) {
  if (!newDate) return;
  orderRegistry[idx].deliveryDays = newDate.trim();
  localStorage.setItem('pgf_orders', JSON.stringify(orderRegistry));
  pushNotification(orderRegistry[idx].email, '🚚 Delivery Date Scheduled', `Your Order #${orderRegistry[idx].orderId} is scheduled to arrive on: ${newDate}.`, 'order');
  populateAdminDashboardTables();
}

function updateOrderRefundDate(idx, newDate) {
  if (!newDate) return;
  orderRegistry[idx].refundCreditedDate = newDate.trim();
  localStorage.setItem('pgf_orders', JSON.stringify(orderRegistry));
}

function adminEditOrderDetails(idx) {
  const o = orderRegistry[idx];

  const newPhone = prompt("1. Customer Phone Number edit karein:", o.phone || "");
  if (newPhone !== null && newPhone.trim() !== "") o.phone = newPhone.trim();

  const newAddress = prompt("2. Customer Shipping Address edit karein:", o.address || "");
  if (newAddress !== null && newAddress.trim() !== "") o.address = newAddress.trim();

  const newMode = prompt("3. Payment Mode edit karein (e.g. GPay, PhonePe, Paytm, UPI, Cash):", o.paymentMode || "Online UPI");
  if (newMode !== null && newMode.trim() !== "") o.paymentMode = newMode.trim();

  const newTxnId = prompt("4. Online Payment Transaction ID (UTR) edit karein:", o.txnId || "");
  if (newTxnId !== null && newTxnId.trim() !== "") o.txnId = newTxnId.trim();

  const newUpi = prompt("5. Customer UPI ID edit karein (e.g. name@okhdfcbank):", o.userUpiId || "");
  if (newUpi !== null && newUpi.trim() !== "") o.userUpiId = newUpi.trim();

  localStorage.setItem('pgf_orders', JSON.stringify(orderRegistry));
  pushNotification(o.email, '🚚 Order Details Updated', `Your Order #${o.orderId} details have been updated by Admin.`, 'order');
  populateAdminDashboardTables();
  alert("✅ Order Details updated successfully!");
}

function adminEditCertificateData(idx) {
  const b = bookingsRegistry[idx];
  const newName = prompt("Candidate Name for Certificate:", b.name);
  if (newName !== null && newName.trim() !== "") b.name = newName.trim();

  if (b.type === "Student") {
    const newCollege = prompt("College Name:", b.college || "");
    if (newCollege !== null && newCollege.trim() !== "") b.college = newCollege.trim();

    const newStart = prompt("Internship Start Date (YYYY-MM-DD):", b.start || "");
    if (newStart !== null && newStart.trim() !== "") b.start = newStart.trim();

    const newEnd = prompt("Internship End Date (YYYY-MM-DD):", b.end || "");
    if (newEnd !== null && newEnd.trim() !== "") b.end = newEnd.trim();
  } else {
    const newDate = prompt("Training Session Date:", b.date || "");
    if (newDate !== null && newDate.trim() !== "") b.date = newDate.trim();
  }

  localStorage.setItem('pgf_bookings', JSON.stringify(bookingsRegistry));
  populateAdminDashboardTables();
  alert("✅ Certificate records successfully updated!");
}

function handleOrderApprove(idx) {
  const o = orderRegistry[idx];

  const defaultDeliveryDate = o.deliveryDays || getTodayIsoString();
  const inputDeliveryDate = prompt("Order kis Date tak customer ko milega? (YYYY-MM-DD):", defaultDeliveryDate);
  if (inputDeliveryDate === null) return;
  const finalDeliveryDate = inputDeliveryDate.trim() || defaultDeliveryDate;

  const defaultCourier = o.courierName || "Ekart Logistics";
  const inputCourier = prompt("Order kis Courier partner se dispatch hoga? (e.g. Ekart, Delhivery, BlueDart, DTDC):", defaultCourier);
  if (inputCourier === null) return;
  const finalCourier = inputCourier.trim() || defaultCourier;

  o.status = "Approved";
  o.trackingStage = "Packed";
  o.deliveryDays = finalDeliveryDate;
  o.courierName = finalCourier;
  o.trackingNumber = o.trackingNumber || ("FMPC" + Math.floor(1000000000 + Math.random() * 9000000000));
  o.currentLocation = `Processing & Dispatched via ${finalCourier} at Farm Hub`;
  o.paymentReceived = true;
  o.refundStage = "";
  
  localStorage.setItem('pgf_orders', JSON.stringify(orderRegistry));
  
  pushNotification(
    o.email, 
    '📦 Order Approved & Dispatched!', 
    `Your Order #${o.orderId} is confirmed. Placed Date: ${o.dateLogged}. Expected Delivery Date: ${finalDeliveryDate} via ${finalCourier}.`, 
    'order'
  );

  alert(`✅ Order Approved Successfully!\n\n• Delivery Date: ${finalDeliveryDate}\n• Courier Partner: ${finalCourier}`);
  populateAdminDashboardTables();
  computeFinancialLedgerStatements();
}

function handleOrderReject(idx) {
  const o = orderRegistry[idx];
  let reason = prompt("Reject karne ka reason likhein (Payment nahi mila / Fake UTR):", "Payment Not Received / Invalid Txn ID");
  if (reason === null) return;

  o.status = `Rejected (Reason: ${reason})`;
  o.paymentReceived = false;
  o.trackingStage = "";
  o.refundStage = "";

  localStorage.setItem('pgf_orders', JSON.stringify(orderRegistry));
  pushNotification(o.email, '❌ Order Rejected', `Your Order #${o.orderId} was rejected. Reason: ${reason}.`, 'order');

  alert("❌ Option 2: Order Reject ho gaya! (Iska paisa accounting me count nahi hoga)");
  populateAdminDashboardTables();
  computeFinancialLedgerStatements();
}

function handleOrderCancelRefund(idx) {
  const o = orderRegistry[idx];
  let reason = prompt("Order Cancel karne ka reason likhein (User ko message jayega):", "Item Out of Stock / Unserviceable Pincode");
  if (reason === null) return;

  o.status = `Cancelled (Reason: ${reason})`;
  o.trackingStage = "Cancelled";
  o.refundStage = "Refund Initiated";
  o.refundCreditedDate = "";

  localStorage.setItem('pgf_orders', JSON.stringify(orderRegistry));
  
  pushNotification(o.email, '⚠️ Order Cancelled', `Aapka Order #${o.orderId} cancel kar diya gaya hai. Reason: ${reason}. Refund aapke UPI ID (${o.userUpiId || 'Bank'}) par process kiya ja raha hai.`, 'order');

  alert("🔄 Option 3: Order Cancel ho gaya aur User ko cancellation notification bhej di gayi hai.");
  populateAdminDashboardTables();
  computeFinancialLedgerStatements();
}

function setOrderStageDirect(idx, newStage) {
  const o = orderRegistry[idx];
  o.trackingStage = newStage;

  if (newStage === 'Placed') {
    o.currentLocation = "Farm Order Desk";
  } else if (newStage === 'Packed') {
    o.currentLocation = `Pure Grow Farm Central Hub (${o.courierName || 'Ekart Logistics'})`;
  } else if (newStage === 'Shipped') {
    o.currentLocation = `In Transit via ${o.courierName || 'Ekart Logistics'} Hub`;
  } else if (newStage === 'OutForDelivery') {
    o.currentLocation = `Out for Delivery with ${o.courierName || 'Ekart Logistics'} Partner`;
  } else if (newStage === 'Delivered') {
    o.currentLocation = "Delivered to Customer Doorstep";
    o.status = "Delivered";
  }

  localStorage.setItem('pgf_orders', JSON.stringify(orderRegistry));
  pushNotification(o.email, '🚚 Order Shipment Update', `Order #${o.orderId} stage updated to: ${newStage}. (${o.currentLocation})`, 'order');
  populateAdminDashboardTables();
}

function setRefundStageDirect(idx, newRefStage) {
  const o = orderRegistry[idx];
  o.refundStage = newRefStage;
  
  const refundInput = document.getElementById(`refundDateInput_${idx}`);
  const selectedDate = refundInput ? refundInput.value : getTodayIsoString();
  o.refundCreditedDate = selectedDate;

  localStorage.setItem('pgf_orders', JSON.stringify(orderRegistry));
  
  if (newRefStage === 'Refund Credited') {
    pushNotification(o.email, '💰 Refund Completed', `₹${o.total} has been successfully credited on ${selectedDate} to your UPI ID: ${o.userUpiId || 'Bank Account'}.`, 'order');
    alert(`💸 Refund of ₹${o.total} marked as Credited on ${selectedDate}! Farm Cash Vault se paisa deduct ho gaya.`);
  } else {
    pushNotification(o.email, '💰 Refund Status Update', `Refund for Order #${o.orderId} status: ${newRefStage}.`, 'order');
  }
  
  populateAdminDashboardTables();
  computeFinancialLedgerStatements();
}

function confirmBookingSlot(idx) {
  bookingsRegistry[idx].status = "Confirmed";
  bookingsRegistry[idx].approvedDate = new Date().toLocaleDateString('en-IN');
  bookingsRegistry[idx].certIssued = false;
  localStorage.setItem('pgf_bookings', JSON.stringify(bookingsRegistry));
  
  const target = bookingsRegistry[idx];
  pushNotification(target.email, '🎓 Farm Booking Confirmed!', `Your ${target.type} program booking #${target.bookingId} has been confirmed.`, 'booking');

  alert(`✅ 1. Farm Booking Approved for ${target.name}!`);
  populateAdminDashboardTables();
  computeFinancialLedgerStatements();
}

function issueUserCertificate(idx) {
  const target = bookingsRegistry[idx];
  if (confirm(`Kya aap ${target.name} ke liye certificate approve karna chahte hain?`)) {
    target.certIssued = true;
    target.certIssueDate = new Date().toLocaleDateString('en-IN');
    localStorage.setItem('pgf_bookings', JSON.stringify(bookingsRegistry));

    pushNotification(target.email, '📜 Certificate Issued & Ready!', `Your certificate for ${target.type} program (#${target.bookingId}) is ready to download.`, 'certificate');

    alert("✅ 2. Certificate Approved ho gaya!");
    populateAdminDashboardTables();
  }
}

function rejectTrainingBooking(idx) {
  const target = bookingsRegistry[idx];
  let reason = prompt("Reject karne ka reason likhein:", "Payment unverified");
  if(reason === null) return;
  
  target.status = `Rejected (Reason: ${reason})`;
  target.certIssued = false;
  localStorage.setItem('pgf_bookings', JSON.stringify(bookingsRegistry));

  pushNotification(target.email, '❌ Farm Booking Rejected', `Your booking #${target.bookingId} was rejected. Reason: ${reason}.`, 'booking');
  populateAdminDashboardTables();
}

function adminEditExpense(idx) {
  const exp = expensesRegistry[idx];

  const newDate = prompt("1. Operation Date:", exp.date || getTodayIsoString());
  if (newDate !== null && newDate.trim() !== "") exp.date = newDate.trim();

  const newCategory = prompt("2. Category (Farm / Mushroom / Student & Farmer):", exp.category || "Farm");
  if (newCategory !== null && newCategory.trim() !== "") exp.category = newCategory.trim();

  const newPayer = prompt("3. Payer Party (Soham / Jeet / Farm):", exp.payer || "Farm");
  if (newPayer !== null && newPayer.trim() !== "") exp.payer = newPayer.trim();

  const newDesc = prompt("4. Context / Item Summary:", exp.desc || "");
  if (newDesc !== null && newDesc.trim() !== "") exp.desc = newDesc.trim();

  const newAmt = prompt("5. Amount (Rs):", exp.amount);
  if (newAmt !== null && !isNaN(parseFloat(newAmt))) exp.amount = parseFloat(newAmt);

  const newNotes = prompt("6. Additional Notes / Memo:", exp.notes || "");
  if (newNotes !== null) exp.notes = newNotes.trim();

  localStorage.setItem('pgf_expenses', JSON.stringify(expensesRegistry));
  computeFinancialLedgerStatements();
  alert("✅ Expense row updated!");
}

function adminDeleteExpense(idx) {
  if (confirm("Kya aap sach me ye Expense entry delete karna chahte hain?")) {
    expensesRegistry.splice(idx, 1);
    localStorage.setItem('pgf_expenses', JSON.stringify(expensesRegistry));
    computeFinancialLedgerStatements();
  }
}

function adminEditSale(idx) {
  const s = salesRegistry[idx];
  
  const newDate = prompt("1. Sale Date:", s.date || getTodayIsoString());
  if (newDate !== null && newDate.trim() !== "") s.date = newDate.trim();

  const newBuyer = prompt("2. Buyer Name:", s.buyer || "");
  if (newBuyer !== null && newBuyer.trim() !== "") s.buyer = newBuyer.trim();

  const newPhone = prompt("3. Buyer Phone:", s.phone || "");
  if (newPhone !== null && newPhone.trim() !== "") s.phone = newPhone.trim();

  const newQty = prompt("4. Qty:", s.qty);
  if (newQty !== null && !isNaN(parseFloat(newQty))) s.qty = parseFloat(newQty);

  const newRate = prompt("5. Price per unit (Rate):", s.rate);
  if (newRate !== null && !isNaN(parseFloat(newRate))) s.rate = parseFloat(newRate);

  const newDel = prompt("6. Delivery Charge (Rs):", s.delivery || 0);
  if (newDel !== null && !isNaN(parseFloat(newDel))) s.delivery = parseFloat(newDel);

  s.subtotal = s.qty * s.rate;
  s.total = s.subtotal + s.delivery;

  const newPaid = prompt(`7. Received Payment Amount (Total Rs ${s.total}):`, s.paidAmount !== undefined ? s.paidAmount : s.total);
  if (newPaid !== null && !isNaN(parseFloat(newPaid))) s.paidAmount = parseFloat(newPaid);

  const newNotes = prompt("8. Sale Notes / Remarks:", s.notes || "");
  if (newNotes !== null) s.notes = newNotes.trim();

  localStorage.setItem('pgf_sales', JSON.stringify(salesRegistry));
  computeFinancialLedgerStatements();
  alert("✅ Sell Entry successfully updated!");
}

function adminDeleteSale(idx) {
  if (confirm("Kya aap sach me ye Sell entry delete karna chahte hain?")) {
    salesRegistry.splice(idx, 1);
    localStorage.setItem('pgf_sales', JSON.stringify(salesRegistry));
    computeFinancialLedgerStatements();
  }
}

function adminEditPurchase(idx) {
  const p = purchasesRegistry[idx];
  
  const newDate = prompt("1. Purchase Date:", p.date || getTodayIsoString());
  if (newDate !== null && newDate.trim() !== "") p.date = newDate.trim();

  const newFunder = prompt("2. Pese Diye (Funder: Farm / Soham / Jeet):", p.funder || "Farm");
  if (newFunder !== null && newFunder.trim() !== "") p.funder = newFunder.trim();

  const newVendor = prompt("3. Kiske Pas Se Liya (Vendor Name):", p.vendor || "");
  if (newVendor !== null && newVendor.trim() !== "") p.vendor = newVendor.trim();

  const newQty = prompt("4. Kitna Liya (Qty):", p.qty);
  if (newQty !== null && !isNaN(parseFloat(newQty))) p.qty = parseFloat(newQty);

  const newRate = prompt("5. Rate (Rs):", p.rate);
  if (newRate !== null && !isNaN(parseFloat(newRate))) p.rate = parseFloat(newRate);

  p.total = p.qty * p.rate;

  const newPaid = prompt(`6. Paid Amount to Vendor (Total Rs ${p.total}):`, p.paidAmount !== undefined ? p.paidAmount : p.total);
  if (newPaid !== null && !isNaN(parseFloat(newPaid))) p.paidAmount = parseFloat(newPaid);

  const newNotes = prompt("7. Vendor Notes / Memo:", p.notes || "");
  if (newNotes !== null) p.notes = newNotes.trim();

  localStorage.setItem('pgf_purchases', JSON.stringify(purchasesRegistry));
  computeFinancialLedgerStatements();
  alert("✅ Buy Purchase record updated!");
}

function adminDeletePurchase(idx) {
  if (confirm("Kya aap sach me ye Buy record delete karna chahte hain?")) {
    purchasesRegistry.splice(idx, 1);
    localStorage.setItem('pgf_purchases', JSON.stringify(purchasesRegistry));
    computeFinancialLedgerStatements();
  }
}

function adminEditDamage(idx) {
  const dmg = expensesRegistry[idx];
  
  const newDate = prompt("1. Damage Date:", dmg.date || getTodayIsoString());
  if (newDate !== null && newDate.trim() !== "") dmg.date = newDate.trim();

  const newPayer = prompt("2. Pese Kisne Rakhe (Farm / Soham / Jeet):", dmg.payer || "Farm");
  if (newPayer !== null && newPayer.trim() !== "") dmg.payer = newPayer.trim();

  const newDesc = prompt("3. Damage Reason:", dmg.desc || "");
  if (newDesc !== null && newDesc.trim() !== "") dmg.desc = newDesc.trim();

  const newAmt = prompt("4. Damage Amount (Rs):", dmg.amount);
  if (newAmt !== null && !isNaN(parseFloat(newAmt))) dmg.amount = parseFloat(newAmt);

  const newNotes = prompt("5. Audit Notes:", dmg.notes || "");
  if (newNotes !== null) dmg.notes = newNotes.trim();

  localStorage.setItem('pgf_expenses', JSON.stringify(expensesRegistry));
  computeFinancialLedgerStatements();
  alert("✅ Damage log updated!");
}

function adminDeleteDamage(idx) {
  if (confirm("Kya aap sach me ye Damage entry delete karna chahte hain?")) {
    expensesRegistry.splice(idx, 1);
    localStorage.setItem('pgf_expenses', JSON.stringify(expensesRegistry));
    computeFinancialLedgerStatements();
  }
}

// =========================================================
// MATHEMATICAL OVERVIEW & LEDGER CALCULATION LOGIC
// =========================================================
function computeFinancialLedgerStatements() {
  const orderTotal = orderRegistry
    .filter(o => o && (o.status === 'Approved' || o.status === 'Delivered'))
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

  const validBookings = bookingsRegistry.filter(b => b && b.name && (b.status === "Confirmed" || b.status === "Approved"));
  const farmBookingTotal = validBookings.reduce((sum, b) => sum + Number(b.fee || 0), 0);

  const sellTotal = salesRegistry.reduce((sum, s) => sum + Number(s.paidAmount !== undefined ? s.paidAmount : s.total || 0), 0);
  const buyTotal = purchasesRegistry.reduce((sum, p) => sum + Number(p.paidAmount !== undefined ? p.paidAmount : p.total || 0), 0);
  const expenseTotal = expensesRegistry.filter(e => e.category !== "Damage Received").reduce((sum, e) => sum + Number(e.amount || 0), 0);

  // Partner wise Buy Totals
  let sohamBuyTotal = 0, jeetBuyTotal = 0, farmBuyTotal = 0;
  purchasesRegistry.forEach(p => {
    const amt = Number(p.paidAmount !== undefined ? p.paidAmount : p.total || 0);
    if(p.funder === "Soham") sohamBuyTotal += amt;
    else if(p.funder === "Jeet") jeetBuyTotal += amt;
    else if(p.funder === "Farm") farmBuyTotal += amt;
  });

  // Partner wise Expense Totals (Expenses only)
  let sohamExpOnly = 0, jeetExpOnly = 0, farmExpOnly = 0;
  expensesRegistry.filter(e => e.category !== "Damage Received").forEach(e => {
    const amt = Number(e.amount || 0);
    if(e.payer === "Soham") sohamExpOnly += amt;
    else if(e.payer === "Jeet") jeetExpOnly += amt;
    else if(e.payer === "Farm") farmExpOnly += amt;
  });

  // 6) Partner & Farm Total (Expense + Buy) as requested: 4 + 5 total
  let sohamExpTotal = sohamExpOnly + sohamBuyTotal;
  let jeetExpTotal = jeetExpOnly + jeetBuyTotal;
  let farmExpTotal = farmExpOnly + farmBuyTotal;

  // Damage Totals & Partner Adjustments
  const damageRows = expensesRegistry.filter(e => e.category === "Damage Received");
  const damageTotal = damageRows.reduce((sum, d) => sum + Number(d.amount || 0), 0);

  let sohamDmgTotal = 0, jeetDmgTotal = 0, farmDmgTotal = 0;
  damageRows.forEach(d => {
    const amt = Number(d.amount || 0);
    if(d.payer === "Soham") sohamDmgTotal += amt;
    else if(d.payer === "Jeet") jeetDmgTotal += amt;
    else if(d.payer === "Farm") farmDmgTotal += amt;
  });

  // 10) Soham & Jeet Net Expenses = (6 - 9)
  let sohamNetExp = sohamExpTotal - sohamDmgTotal;
  let jeetNetExp = jeetExpTotal - jeetDmgTotal;

  let cashBalances = { Soham: 0, Jeet: 0, Farm: 0 };
  
  cashBalances.Farm += orderTotal;
  cashBalances.Farm += farmBookingTotal;

  const totalCreditedRefunds = orderRegistry
    .filter(o => o && o.status && o.status.startsWith('Cancelled') && o.refundStage === 'Refund Credited')
    .reduce((sum, o) => sum + Number(o.total || 0), 0);
  cashBalances.Farm -= totalCreditedRefunds;

  salesRegistry.forEach(s => { 
    if(cashBalances[s.collector] !== undefined) cashBalances[s.collector] += Number(s.paidAmount !== undefined ? s.paidAmount : s.total || 0); 
  });
  
  expensesRegistry.filter(e => e.category !== "Damage Received").forEach(e => { 
    if(cashBalances[e.payer] !== undefined) cashBalances[e.payer] -= Number(e.amount || 0); 
  });
  
  purchasesRegistry.forEach(p => { 
    if(cashBalances[p.funder] !== undefined) cashBalances[p.funder] -= Number(p.paidAmount !== undefined ? p.paidAmount : p.total || 0); 
  });

  damageRows.forEach(d => {
    const amt = Number(d.amount || 0);
    if (d.payer === "Farm") cashBalances.Farm += amt;
    else if (d.payer === "Soham") cashBalances.Soham -= amt;
    else if (d.payer === "Jeet") cashBalances.Jeet -= amt;
  });

  // 7) Farm Available Balance: 3 - 6 (6 me sirf farm ka total)
  const farmAvailableBalance = sellTotal - farmExpTotal;

  // 8) Unified Net Profit: 1 + 2 + 3 - 4 - 5
  const netProfit = (orderTotal + farmBookingTotal + sellTotal) - buyTotal - expenseTotal;

  // Overview DOM Updates
  if(document.getElementById("ovOrderTotal")) document.getElementById("ovOrderTotal").textContent = "Rs " + orderTotal.toFixed(2);
  if(document.getElementById("ovFarmBookingTotal")) document.getElementById("ovFarmBookingTotal").textContent = "Rs " + farmBookingTotal.toFixed(2);
  if(document.getElementById("ovSellTotal")) document.getElementById("ovSellTotal").textContent = "Rs " + sellTotal.toFixed(2);
  
  // 4) Buy Total Card with Breakdown
  if(document.getElementById("ovBuyTotal")) document.getElementById("ovBuyTotal").textContent = "Rs " + buyTotal.toFixed(2);
  if(document.getElementById("ovSohamBuy")) document.getElementById("ovSohamBuy").textContent = "Rs " + sohamBuyTotal.toFixed(2);
  if(document.getElementById("ovJeetBuy")) document.getElementById("ovJeetBuy").textContent = "Rs " + jeetBuyTotal.toFixed(2);
  if(document.getElementById("ovFarmBuy")) document.getElementById("ovFarmBuy").textContent = "Rs " + farmBuyTotal.toFixed(2);

  // 5) Expense Total Card with Breakdown
  if(document.getElementById("ovExpenseTotal")) document.getElementById("ovExpenseTotal").textContent = "Rs " + expenseTotal.toFixed(2);
  if(document.getElementById("ovSohamExpOnly")) document.getElementById("ovSohamExpOnly").textContent = "Rs " + sohamExpOnly.toFixed(2);
  if(document.getElementById("ovJeetExpOnly")) document.getElementById("ovJeetExpOnly").textContent = "Rs " + jeetExpOnly.toFixed(2);
  if(document.getElementById("ovFarmExpOnly")) document.getElementById("ovFarmExpOnly").textContent = "Rs " + farmExpOnly.toFixed(2);
  
  // 6) Partner & Farm Total (4 + 5 Total: Expense + Buy)
  if(document.getElementById("ovSohamTotal")) document.getElementById("ovSohamTotal").textContent = "Rs " + sohamExpTotal.toFixed(2);
  if(document.getElementById("ovJeetTotal")) document.getElementById("ovJeetTotal").textContent = "Rs " + jeetExpTotal.toFixed(2);
  if(document.getElementById("ovFarmTotal")) document.getElementById("ovFarmTotal").textContent = "Rs " + farmExpTotal.toFixed(2);

  // 7) Farm Available Balance: 3 - 6 (Farm total)
  if(document.getElementById("ovFarmAvailableBalance")) document.getElementById("ovFarmAvailableBalance").textContent = "Rs " + farmAvailableBalance.toFixed(2);
  
  // 8) Unified Net Profit: 1 + 2 + 3 - 4 - 5
  if(document.getElementById("ovProfit")) document.getElementById("ovProfit").textContent = "Rs " + netProfit.toFixed(2);
  
  // 9) Damage Losses Card with Breakdown
  if(document.getElementById("ovDamage")) document.getElementById("ovDamage").textContent = "Rs " + damageTotal.toFixed(2);
  if(document.getElementById("ovSohamDmgCard")) document.getElementById("ovSohamDmgCard").textContent = "Rs " + sohamDmgTotal.toFixed(2);
  if(document.getElementById("ovJeetDmgCard")) document.getElementById("ovJeetDmgCard").textContent = "Rs " + jeetDmgTotal.toFixed(2);
  if(document.getElementById("ovFarmDmgCard")) document.getElementById("ovFarmDmgCard").textContent = "Rs " + farmDmgTotal.toFixed(2);

  // 10) Soham & Jeet Net Expenses: (6 - 9)
  if(document.getElementById("ovSohamNet")) document.getElementById("ovSohamNet").textContent = "Rs " + sohamNetExp.toFixed(2);
  if(document.getElementById("ovJeetNet")) document.getElementById("ovJeetNet").textContent = "Rs " + jeetNetExp.toFixed(2);
  if(document.getElementById("modalSohamNet")) document.getElementById("modalSohamNet").textContent = "Rs " + sohamNetExp.toFixed(2);
  if(document.getElementById("modalJeetNet")) document.getElementById("modalJeetNet").textContent = "Rs " + jeetNetExp.toFixed(2);

  // Sub Tab 1: Expense Top Summary & Table
  if(document.getElementById("subTabExpTotalDisplay")) document.getElementById("subTabExpTotalDisplay").textContent = "Rs " + expenseTotal.toFixed(2);
  if(document.getElementById("subTabSohamExp")) document.getElementById("subTabSohamExp").textContent = "Rs " + sohamExpOnly.toFixed(2);
  if(document.getElementById("subTabJeetExp")) document.getElementById("subTabJeetExp").textContent = "Rs " + jeetExpOnly.toFixed(2);
  if(document.getElementById("subTabFarmExp")) document.getElementById("subTabFarmExp").textContent = "Rs " + farmExpOnly.toFixed(2);

  const expRows = expensesRegistry.filter(e => e.category !== "Damage Received");
  if(document.getElementById("subExpenseTableBody")) {
    document.getElementById("subExpenseTableBody").innerHTML = expRows.map((e, idx) => `
      <tr>
        <td>${e.date}</td>
        <td>${e.category}</td>
        <td>${e.payer}</td>
        <td>${e.desc}</td>
        <td style="color:var(--warn); font-weight:bold;">Rs ${e.amount}</td>
        <td><small>${e.notes || '-'}</small></td>
        <td>
          <button type="button" class="btn" style="padding:2px 5px; font-size:10px; min-height:auto; background:#0284c7;" onclick="adminEditExpense(${idx})">✏️</button>
          <button type="button" class="btn" style="padding:2px 5px; font-size:10px; min-height:auto; background:var(--danger);" onclick="adminDeleteExpense(${idx})">🗑️</button>
        </td>
      </tr>
    `).join("");
  }

  // Sub Tab 2: Sell Top Summary & Table
  const sellPaidTotal = salesRegistry.reduce((sum, s) => sum + Number(s.paidAmount !== undefined ? s.paidAmount : s.total || 0), 0);
  const sellPendingTotal = salesRegistry.reduce((sum, s) => {
    const tot = Number(s.total || 0);
    const pd = Number(s.paidAmount !== undefined ? s.paidAmount : tot);
    return sum + Math.max(0, tot - pd);
  }, 0);

  if(document.getElementById("subTabSellTotalDisplay")) document.getElementById("subTabSellTotalDisplay").textContent = "Rs " + sellTotal.toFixed(2);
  if(document.getElementById("subTabSellPaid")) document.getElementById("subTabSellPaid").textContent = "Rs " + sellPaidTotal.toFixed(2);
  if(document.getElementById("subTabSellPending")) document.getElementById("subTabSellPending").textContent = "Rs " + sellPendingTotal.toFixed(2);

  if(document.getElementById("subSellTableBody")) {
    document.getElementById("subSellTableBody").innerHTML = salesRegistry.map((s, idx) => {
      const sub = Number(s.subtotal || (s.qty * s.rate) || s.total);
      const del = Number(s.delivery || 0);
      const grandTotal = Number(s.total || (sub + del));
      const paid = Number(s.paidAmount !== undefined ? s.paidAmount : grandTotal);
      const pending = Math.max(0, grandTotal - paid);

      return `
        <tr>
          <td>${s.date}</td>
          <td>${s.product}</td>
          <td><strong>${s.buyer}</strong><br><small>${s.phone || ''}</small></td>
          <td>${s.qty}</td>
          <td style="font-weight:600;">Rs ${Number(s.rate || 0).toFixed(2)}</td>
          <td>Rs ${del.toFixed(2)}</td>
          <td style="color:var(--accent); font-weight:bold;">Rs ${grandTotal.toFixed(2)}</td>
          <td>
            <span style="color:#16a34a; font-weight:bold;">Rs ${paid.toFixed(2)}</span>
            ${pending > 0 ? `<br><small style="color:#dc2626; font-weight:bold;">Due: Rs ${pending.toFixed(2)}</small>` : '<br><small style="color:#16a34a;">(Fully Paid)</small>'}
          </td>
          <td>
            <div style="display:flex; gap:3px;">
              <button type="button" class="btn" style="padding:2px 5px; font-size:10px; min-height:auto;" onclick="downloadOfflineSaleInvoice('${s.saleId}')">📄</button>
              <button type="button" class="btn" style="padding:2px 5px; font-size:10px; min-height:auto; background:#0284c7;" onclick="adminEditSale(${idx})">✏️</button>
              <button type="button" class="btn" style="padding:2px 5px; font-size:10px; min-height:auto; background:var(--danger);" onclick="adminDeleteSale(${idx})">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  // Sub Tab 3: Buy Top Summary & Table
  if(document.getElementById("subTabBuyTotalDisplay")) document.getElementById("subTabBuyTotalDisplay").textContent = "Rs " + buyTotal.toFixed(2);
  if(document.getElementById("subTabSohamBuy")) document.getElementById("subTabSohamBuy").textContent = "Rs " + sohamBuyTotal.toFixed(2);
  if(document.getElementById("subTabJeetBuy")) document.getElementById("subTabJeetBuy").textContent = "Rs " + jeetBuyTotal.toFixed(2);
  if(document.getElementById("subTabFarmBuy")) document.getElementById("subTabFarmBuy").textContent = "Rs " + farmBuyTotal.toFixed(2);

  if(document.getElementById("subBuyTableBody")) {
    document.getElementById("subBuyTableBody").innerHTML = purchasesRegistry.map((p, idx) => {
      const totalPayable = Number(p.total || (p.qty * p.rate));
      const paid = Number(p.paidAmount !== undefined ? p.paidAmount : totalPayable);
      const pendingToVendor = Math.max(0, totalPayable - paid);

      return `
        <tr>
          <td>${p.date}</td>
          <td>${p.product}</td>
          <td><span class="badge" style="background:#eef2ff; color:#3730a3;">${p.funder || 'Farm'}</span></td>
          <td><strong>${p.vendor}</strong></td>
          <td>${p.qty}</td>
          <td>Rs ${p.rate}</td>
          <td style="color:var(--danger); font-weight:bold;">Rs ${totalPayable.toFixed(2)}</td>
          <td>
            <span style="color:#16a34a; font-weight:bold;">Paid: Rs ${paid.toFixed(2)}</span>
            ${pendingToVendor > 0 ? `<br><small style="color:#ea580c; font-weight:bold;">Due: Rs ${pendingToVendor.toFixed(2)}</small>` : '<br><small style="color:#16a34a;">(Clear)</small>'}
          </td>
          <td>
            <button type="button" class="btn" style="padding:2px 5px; font-size:10px; min-height:auto; background:#0284c7;" onclick="adminEditPurchase(${idx})">✏️</button>
            <button type="button" class="btn" style="padding:2px 5px; font-size:10px; min-height:auto; background:var(--danger);" onclick="adminDeletePurchase(${idx})">🗑️</button>
          </td>
        </tr>
      `;
    }).join("");
  }

  // Sub Tab 4: Damage Top Summary
  if(document.getElementById("subTabDamageTotalDisplay")) document.getElementById("subTabDamageTotalDisplay").textContent = "Rs " + damageTotal.toFixed(2);
  if(document.getElementById("subTabSohamDmg")) document.getElementById("subTabSohamDmg").textContent = "Rs " + sohamDmgTotal.toFixed(2);
  if(document.getElementById("subTabJeetDmg")) document.getElementById("subTabJeetDmg").textContent = "Rs " + jeetDmgTotal.toFixed(2);
  if(document.getElementById("subTabFarmDmg")) document.getElementById("subTabFarmDmg").textContent = "Rs " + farmDmgTotal.toFixed(2);

  if(document.getElementById("subDamageTableBody")) {
    document.getElementById("subDamageTableBody").innerHTML = damageRows.map((d, idx) => `
      <tr>
        <td>${d.date}</td>
        <td>${d.desc}</td>
        <td><span class="badge" style="background:#fee2e2; color:#991b1b;">${d.payer}</span></td>
        <td style="color:var(--danger); font-weight:bold;">Rs ${d.amount}</td>
        <td><small>${d.notes || '-'}</small></td>
        <td>
          <button type="button" class="btn" style="padding:2px 5px; font-size:10px; min-height:auto; background:#0284c7;" onclick="adminEditDamage(${idx})">✏️</button>
          <button type="button" class="btn" style="padding:2px 5px; font-size:10px; min-height:auto; background:var(--danger);" onclick="adminDeleteDamage(${idx})">🗑️</button>
        </td>
      </tr>
    `).join("");
  }
}

function saveAdminExpense(e) {
  e.preventDefault();
  const rawDate = document.getElementById("expLogDate").value;
  const data = {
    expId: "EXP-" + Date.now().toString().slice(-4),
    date: rawDate ? new Date(rawDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
    category: document.getElementById("expCategory").value,
    payer: document.getElementById("expPayer").value,
    mode: document.getElementById("expMode").value,
    desc: document.getElementById("expDesc").value.trim(),
    amount: parseFloat(document.getElementById("expAmount").value),
    notes: document.getElementById("expNotes") ? document.getElementById("expNotes").value.trim() : ""
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
  const delivery = parseFloat(document.getElementById("saleDelivery").value) || 0;
  const paid = parseFloat(document.getElementById("salePaidAmount").value) || 0;
  const notes = document.getElementById("saleNotes") ? document.getElementById("saleNotes").value.trim() : "";
  const prodType = document.getElementById("saleProduct").value;

  const targetProd = products.find(p => p.type === prodType || p.name.toLowerCase().includes(prodType.toLowerCase()));
  if (targetProd && !targetProd.bulk) {
    targetProd.stock = Math.max(0, targetProd.stock - qty);
    saveProductsToStorage();
    renderProducts();
  }

  const subtotal = qty * rate;
  const grandTotal = subtotal + delivery;

  const data = {
    saleId: "SALE-" + Date.now().toString().slice(-4),
    date: rawDate ? new Date(rawDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
    product: prodType,
    collector: "Farm",
    buyer: document.getElementById("saleBuyer").value.trim(),
    phone: document.getElementById("salePhone").value.trim(),
    address: document.getElementById("saleAddress").value.trim(),
    qty: qty,
    rate: rate,
    subtotal: subtotal,
    delivery: delivery,
    total: grandTotal,
    paidAmount: paid,
    notes: notes
  };

  salesRegistry.push(data);
  localStorage.setItem('pgf_sales', JSON.stringify(salesRegistry));
  e.target.reset();
  if (document.getElementById("saleDelivery")) document.getElementById("saleDelivery").value = "0";
  initDefaultDatePickers();
  computeFinancialLedgerStatements();
  renderAdminLiveStockSummary();
  alert(`✅ Wholesale Sale Entry saved! Total: Rs ${grandTotal}, Received: Rs ${paid}`);
}

function saveAdminPurchase(e) {
  e.preventDefault();
  const rawDate = document.getElementById("purLogDate").value;
  const qty = parseFloat(document.getElementById("purQty").value);
  const rate = parseFloat(document.getElementById("purRate").value);
  const paid = parseFloat(document.getElementById("purPaidAmount").value) || (qty * rate);
  const purType = document.getElementById("purProduct").value;
  const funder = document.getElementById("purFunder").value;
  const vendor = document.getElementById("purVendor").value.trim();
  const notes = document.getElementById("purNotes") ? document.getElementById("purNotes").value.trim() : "";
  
  let matchedProd = null;
  if (purType.includes("Dry")) matchedProd = products.find(p => p.type === "dry");
  else if (purType.includes("Khakhra")) matchedProd = products.find(p => p.type === "khakhra");
  else if (purType.includes("Papad")) matchedProd = products.find(p => p.type === "papad");
  else if (purType.includes("Green")) matchedProd = products.find(p => p.type === "green");

  if (matchedProd) {
    matchedProd.stock = (matchedProd.stock || 0) + qty;
    saveProductsToStorage();
    renderProducts();
  }

  const data = {
    purId: "PUR-" + Date.now().toString().slice(-4),
    date: rawDate ? new Date(rawDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
    product: purType,
    funder: funder,
    vendor: vendor,
    qty: qty,
    rate: rate,
    total: qty * rate,
    paidAmount: paid,
    notes: notes
  };

  purchasesRegistry.push(data);
  localStorage.setItem('pgf_purchases', JSON.stringify(purchasesRegistry));
  e.target.reset();
  initDefaultDatePickers();
  computeFinancialLedgerStatements();
  renderAdminLiveStockSummary();
  alert(`✅ Inventory Buy recorded! Total: Rs ${qty * rate}, Paid: Rs ${paid}`);
}

function saveAdminDamage(e) {
  e.preventDefault();
  const rawDate = document.getElementById("dmgLogDate").value;
  const payerType = document.getElementById("dmgPayer").value;
  const amountVal = parseFloat(document.getElementById("dmgAmount").value);
  const notes = document.getElementById("dmgNotes") ? document.getElementById("dmgNotes").value.trim() : "";

  const data = {
    expId: "DMG-" + Date.now().toString().slice(-4),
    date: rawDate ? new Date(rawDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
    category: "Damage Received",
    payer: payerType,
    mode: "Internal Allocation",
    desc: document.getElementById("dmgDesc").value.trim(),
    amount: amountVal,
    notes: notes
  };

  expensesRegistry.push(data);
  localStorage.setItem('pgf_expenses', JSON.stringify(expensesRegistry));
  e.target.reset();
  initDefaultDatePickers();
  computeFinancialLedgerStatements();
  alert(`✅ Damage recorded under ${payerType}!`);
}

function downloadOfflineSaleInvoice(saleId) {
  const targetSale = salesRegistry.find(s => s.saleId === saleId);
  if(!targetSale) return alert("Invoice not found.");
  
  const sub = Number(targetSale.subtotal || (targetSale.qty * targetSale.rate) || targetSale.total);
  const del = Number(targetSale.delivery || 0);
  const grandTotal = Number(targetSale.total || (sub + del));
  const paid = Number(targetSale.paidAmount !== undefined ? targetSale.paidAmount : grandTotal);
  const due = Math.max(0, grandTotal - paid);

  document.getElementById("invNum").textContent = targetSale.saleId;
  document.getElementById("invDate").textContent = targetSale.date;
  document.getElementById("invClientName").textContent = targetSale.buyer;
  document.getElementById("invClientEmail").textContent = "Phone Lines: " + (targetSale.phone || "N/A");
  document.getElementById("invClientAddr").textContent = "Shipping Address: " + (targetSale.address || "Direct Spot Distribution Counter");
  
  document.getElementById("invoiceTableItemsBody").innerHTML = `
    <tr>
      <td style="padding:12px 14px; border-bottom:1px solid #e6e9ec; font-weight: 600;">${targetSale.product} Lot Log Entry</td>
      <td style="padding:12px 14px; border-bottom:1px solid #e6e9ec; text-align:right;">Rs ${Number(targetSale.rate).toFixed(2)}</td>
      <td style="padding:12px 14px; border-bottom:1px solid #e6e9ec; text-align:center;">${targetSale.qty}</td>
      <td style="padding:12px 14px; border-bottom:1px solid #e6e9ec; text-align:right; font-weight:600; color:var(--accent);">Rs ${sub.toFixed(2)}</td>
    </tr>
  `;
  
  document.getElementById("invSub").textContent = `Rs ${sub.toFixed(2)}`;
  document.getElementById("invDelivery").textContent = `Rs ${del.toFixed(2)}`;
  document.getElementById("invTotal").textContent = `Rs ${grandTotal.toFixed(2)}`;

  const notesSec = document.getElementById("invNotesSection");
  if (notesSec) {
    if (targetSale.notes) {
      notesSec.style.display = "block";
      notesSec.innerHTML = `<strong>Memo / Note:</strong> ${targetSale.notes}`;
    } else {
      notesSec.style.display = "none";
    }
  }

  const paidRow = document.getElementById("invPaidRow");
  const dueRow = document.getElementById("invDueRow");
  if (paidRow && dueRow) {
    paidRow.style.display = "flex";
    dueRow.style.display = "flex";
    document.getElementById("invPaid").textContent = `Rs ${paid.toFixed(2)}`;
    document.getElementById("invDue").textContent = `Rs ${due.toFixed(2)}`;
  }

  const waTargetPhone = (targetSale.phone && targetSale.phone.replace(/[^0-9]/g, '')) || farmWhatsapp;
  const cleanPhone = waTargetPhone.length === 10 ? "91" + waTargetPhone : waTargetPhone;

  const waInvoiceText = 
`*PURE GROW FARM - SALES INVOICE RECEIPT*
----------------------------------------
📄 *Invoice Ref:* ${targetSale.saleId}
📅 *Date:* ${targetSale.date}
👤 *Customer:* ${targetSale.buyer}
📞 *Phone:* ${targetSale.phone || 'N/A'}
📍 *Address:* ${targetSale.address || 'Direct Spot Delivery'}
🍄 *Product:* ${targetSale.product} (${targetSale.qty} Units @ Rs ${targetSale.rate}/unit)
----------------------------------------
💰 *Subtotal:* Rs ${sub.toFixed(2)}
🚚 *Delivery:* Rs ${del.toFixed(2)}
💵 *Grand Total:* Rs ${grandTotal.toFixed(2)}
✅ *Paid Amount:* Rs ${paid.toFixed(2)}
${due > 0 ? `⚠️ *Pending Balance:* Rs ${due.toFixed(2)}\n` : `🎉 *Status:* Fully Paid\n`}${targetSale.notes ? `📝 *Note:* ${targetSale.notes}\n` : ''}----------------------------------------
*Thank you for your business!*
Pure Grow Farm, Makhiyala, Gujarat
📞 +91 9067891039 | +91 8200145732`;

  const waBtn = document.getElementById("whatsappInvoice");
  if (waBtn) {
    waBtn.href = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waInvoiceText)}`;
  }
  
  document.getElementById("invoiceDialog").showModal();
}

function renderProducts(list = products) {
  if(!document.getElementById("productsList")) return;
  document.getElementById("productsList").innerHTML = list.map(product => {
    const inStock = product.stock > 0;

    return `
      <article class="product">
        <img src="${product.image}" alt="${product.name}">
        <h3>${product.name}</h3>
        <p class="muted">${product.detail}</p>
        
        <div style="margin-bottom: 8px;">
          ${product.bulk ? 
            `<span class="badge" style="background: #e0f2fe; color: #0369a1; font-size:11px;">📦 Custom Supply</span>` : 
            (inStock 
              ? `<span class="badge badge-confirmed" style="font-size:11px;">🟢 Available: ${product.stock} ${product.unit}</span>` 
              : `<span class="badge" style="background:#fee2e2; color:#991b1b; font-size:11px;">🔴 Out of Stock</span>`
            )
          }
        </div>

        <div style="margin-top:auto;">
          <div class="product-actions">
            <div class="pill">Rs ${product.price} / ${product.unit}</div>
            ${product.bulk ? 
              `<button type="button" onclick="window.open('https://wa.me/${farmWhatsapp}')">Contact Bulk</button>` : 
              `<button type="button" ${inStock ? '' : 'disabled style="background:#9ca3af; cursor:not-allowed;"'} onclick="addToCart(${product.id})">
                ${inStock ? 'Add Cart' : 'Out of Stock'}
              </button>`
            }
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function updateHeaderCartCounter() {
  const badge = document.getElementById("headerCartCount");
  if (!badge) return;
  const totalCount = [...cart.values()].reduce((sum, item) => sum + item.qty, 0);
  badge.textContent = totalCount;
}

function addToCart(id) {
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

function minusCart(id) {
  const item = cart.get(id);
  if (!item) return;
  if (item.qty === 1) cart.delete(id);
  else cart.set(id, { ...item, qty: item.qty - 1 });
  renderCart();
  updateHeaderCartCounter();
}

function getTotals() {
  const subtotal = [...cart.values()].reduce((sum, item) => sum + (item.price * item.qty), 0);
  const delivery = subtotal > 0 ? (subtotal > 1000 ? 0 : 50) : 0;
  return { subtotal, delivery, total: subtotal + delivery };
}

function renderCart() {
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
  const address = document.getElementById("address") ? document.getElementById("address").value.trim() : "";
  const userUpi = document.getElementById("userUpiId") ? document.getElementById("userUpiId").value.trim() : "";
  const mode = document.getElementById("paymentMode") ? document.getElementById("paymentMode").value : "";
  const txnId = document.getElementById("paymentId") ? document.getElementById("paymentId").value.trim() : "";
  
  const isValid = cart.size > 0 && address.length > 4 && userUpi.length >= 5 && userUpi.includes('@') && mode !== "" && txnId.length >= 6;
  if(document.getElementById("confirmOrderBtn")) document.getElementById("confirmOrderBtn").disabled = !isValid;
}

if(document.getElementById("address")) {
  document.getElementById("address").addEventListener("input", validateOrderForm);
}

function confirmOrder(e) {
  e.preventDefault();
  const bill = getTotals();
  const currentTimestamp = new Date().toLocaleDateString('en-IN') + " " + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
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
    orderId: generatedOrderId,
    name: currentUser.name,
    phone: currentUser.phone,
    email: currentUser.email,
    address: document.getElementById("address").value.trim(),
    userUpiId: document.getElementById("userUpiId").value.trim(),
    products: [...cart.values()].map(i => `${i.name} [x${i.qty}]`).join(", "),
    subtotal: bill.subtotal,
    delivery: bill.delivery,
    total: bill.total,
    paymentMode: document.getElementById("paymentMode").value,
    txnId: document.getElementById("paymentId").value.trim(),
    dateLogged: currentTimestamp,
    deliveryDays: "",
    courierName: "Ekart Logistics",
    refundCreditedDate: "",
    status: "Pending Verification"
  };

  orderRegistry.unshift(data);
  localStorage.setItem('pgf_orders', JSON.stringify(orderRegistry));
  
  document.getElementById("invNum").textContent = data.orderId;
  document.getElementById("invDate").textContent = new Date().toLocaleDateString('en-IN');
  document.getElementById("invClientName").textContent = data.name;
  document.getElementById("invClientEmail").textContent = "Email: " + data.email + " | Ph: " + data.phone;
  document.getElementById("invClientAddr").textContent = "Address: " + data.address + " | User UPI: " + data.userUpiId;
  
  document.getElementById("invoiceTableItemsBody").innerHTML = [...cart.values()].map(item => `
    <tr>
      <td style="padding:12px 14px; border-bottom:1px solid #e6e9ec; font-weight: 600;">${item.name} (${item.unit})</td>
      <td style="padding:12px 14px; border-bottom:1px solid #e6e9ec; text-align:right;">Rs ${item.price}</td>
      <td style="padding:12px 14px; border-bottom:1px solid #e6e9ec; text-align:center;">${item.qty}</td>
      <td style="padding:12px 14px; border-bottom:1px solid #e6e9ec; text-align:right; font-weight:600; color:var(--accent);">Rs ${item.price * item.qty}</td>
    </tr>
  `).join("");
  
  document.getElementById("invSub").textContent = "Rs " + bill.subtotal;
  document.getElementById("invDelivery").textContent = "Rs " + bill.delivery;
  document.getElementById("invTotal").textContent = "Rs " + bill.total;

  const paidRow = document.getElementById("invPaidRow");
  const dueRow = document.getElementById("invDueRow");
  const notesSec = document.getElementById("invNotesSection");
  if (paidRow) paidRow.style.display = "none";
  if (dueRow) dueRow.style.display = "none";
  if (notesSec) notesSec.style.display = "none";

  pushNotification('ADMIN', '🛍️ New Order Placed!', `${data.name} placed order #${data.orderId} for Rs ${data.total}`, 'order');
  
  const waMessage = `NEW GOODS ORDER VERIFICATION FLOW:\n----------------------------------------\nInvoice Ref Code: ${data.orderId}\nClient Legal Name: ${data.name}\nClient UPI ID: ${data.userUpiId}\nProducts Mapped: ${data.products}\nTotal Paid Amount: Rs ${data.total}\nPayment Method: ${data.paymentMode}\nTransaction Hash ID Code: ${data.txnId}\n----------------------------------------`;
  
  alert("Order submitted! Opening WhatsApp summary.");
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

function openVisitPayment(formId, amount) {
  const modeSelectId = formId === "studentForm" ? "spaymentMode" : "fpaymentMode";
  const helpId = formId === "studentForm" ? "studentPaymentHelp" : "farmerPaymentHelp";
  const txnInputId = formId === "studentForm" ? "spayment" : "fpayment";
  const mode = document.getElementById(modeSelectId).value;

  if (!mode) {
    document.getElementById(txnInputId).value = "";
    document.getElementById(txnInputId).disabled = true;
    if(formId === "studentForm") validateStudentForm();
    else validateFarmerForm();
    return;
  }
  
  document.getElementById(helpId).style.display = "block";
  document.getElementById(helpId).textContent = `Launching UPI App for program fee Rs ${amount}.`;
  
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
  const userUpi = document.getElementById("suserUpi") ? document.getElementById("suserUpi").value.trim() : "";
  const txn = document.getElementById("spayment").value.trim();
  const isDisabled = document.getElementById("spayment").disabled;
  
  const isValid = !isDisabled && enroll !== "" && college !== "" && course !== "" && start !== "" && end !== "" && userUpi.length >= 5 && userUpi.includes('@') && txn.length >= 6;
  document.getElementById("studentSubmitBtn").disabled = !isValid;
}

function validateFarmerForm() {
  const date = document.getElementById("fdate").value;
  const userUpi = document.getElementById("fuserUpi") ? document.getElementById("fuserUpi").value.trim() : "";
  const txn = document.getElementById("fpayment").value.trim();
  const isDisabled = document.getElementById("fpayment").disabled;
  
  const isValid = !isDisabled && date !== "" && userUpi.length >= 5 && userUpi.includes('@') && txn.length >= 6;
  document.getElementById("farmerSubmitBtn").disabled = !isValid;
}

if(document.getElementById("studentForm")) {
  ['senroll', 'scollege', 'scourse', 'sstart', 'send', 'suserUpi'].forEach(id => {
    if(document.getElementById(id)) document.getElementById(id).addEventListener("input", validateStudentForm);
  });
}
if(document.getElementById("farmerForm")) {
  ['fdate', 'fuserUpi'].forEach(id => {
    if(document.getElementById(id)) document.getElementById(id).addEventListener("input", validateFarmerForm);
  });
}

function submitStudentVisit(e) {
  e.preventDefault();
  const currentTimestamp = new Date().toLocaleDateString('en-IN') + " " + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const data = {
    bookingId: "PGF-STU-" + Date.now().toString().slice(-4),
    type: "Student",
    name: currentUser.name,
    phone: currentUser.phone,
    email: currentUser.email,
    enrollment: document.getElementById("senroll").value.trim(),
    college: document.getElementById("scollege").value.trim(),
    course: document.getElementById("scourse").value.trim(),
    start: document.getElementById("sstart").value,
    end: document.getElementById("send").value,
    userUpiId: document.getElementById("suserUpi").value.trim(),
    fee: 100,
    paymentMode: document.getElementById("spaymentMode").value,
    txnId: document.getElementById("spayment").value.trim(),
    dateLogged: currentTimestamp,
    status: "Pending Verification",
    certIssued: false
  };
  bookingsRegistry.unshift(data);
  localStorage.setItem('pgf_bookings', JSON.stringify(bookingsRegistry));

  pushNotification('ADMIN', '🎓 New Student Registration', `${data.name} applied for Internship (#${data.bookingId}).`, 'booking');

  const waText = `NEW STUDENT INTERNSHIP REGISTRATION:\n----------------------------------------\nBooking Ref ID: ${data.bookingId}\nName: ${data.name}\nStudent UPI ID: ${data.userUpiId}\nCollege: ${data.college}\nCourse: ${data.course}\nUTR Tracking Number: ${data.txnId}\n----------------------------------------`;
  window.open(`https://wa.me/${farmWhatsapp}?text=${encodeURIComponent(waText)}`, '_blank');
  
  document.getElementById("studentForm").reset();
  document.getElementById("spayment").disabled = true;
  checkUserSession();
}

function submitFarmerVisit(e) {
  e.preventDefault();
  const currentTimestamp = new Date().toLocaleDateString('en-IN') + " " + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const data = {
    bookingId: "PGF-FAR-" + Date.now().toString().slice(-4),
    type: "Farmer",
    name: currentUser.name,
    phone: currentUser.phone,
    email: currentUser.email,
    date: document.getElementById("fdate").value,
    userUpiId: document.getElementById("fuserUpi").value.trim(),
    fee: 699,
    paymentMode: document.getElementById("fpaymentMode").value,
    txnId: document.getElementById("fpayment").value.trim(),
    dateLogged: currentTimestamp,
    status: "Pending Verification",
    certIssued: false
  };
  bookingsRegistry.unshift(data);
  localStorage.setItem('pgf_bookings', JSON.stringify(bookingsRegistry));

  pushNotification('ADMIN', '👨‍🌾 New Farmer Training Booking', `${data.name} booked training (#${data.bookingId}) for ${data.date}.`, 'booking');

  const waText = `NEW FARMER TRAINING BOOKING:\n----------------------------------------\nBooking Ref ID: ${data.bookingId}\nName: ${data.name}\nFarmer UPI ID: ${data.userUpiId}\nTraining Date: ${data.date}\nUTR Tracking Number: ${data.txnId}\n----------------------------------------`;
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
  const targetBooking = bookingsRegistry.find(b => b && b.bookingId === bookingId);
  if (!targetBooking) return alert("Certificate not found.");
  if (!targetBooking.certIssued) return alert("Certificate has not been issued yet by Farm Admin.");

  const titleText = targetBooking.type === "Student" ? "Certificate of Internship" : "Certificate of Farming";
  const descText = targetBooking.type === "Student" 
    ? `has successfully completed an internship program in Oyster Mushroom Cultivation at Pure Grow Farm, at Makhiyala, Gujarat.`
    : `has successfully completed the practical farmer training framework module in Oyster Mushroom Cultivation at Pure Grow Farm, at Makhiyala, Gujarat.`;
  
  const durationContent = targetBooking.type === "Student" 
    ? `from <strong>${targetBooking.start || 'N/A'}</strong> to <strong>${targetBooking.end || 'N/A'}</strong>`
    : `on target session date <strong>${targetBooking.date || 'N/A'}</strong>`;

  const actualApprovedDate = targetBooking.certIssueDate ? targetBooking.certIssueDate : (targetBooking.dateLogged ? targetBooking.dateLogged.split(" ")[0] : new Date().toLocaleDateString('en-IN'));

  const basePath = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
  const logoUrl = basePath + "mushroom/pgf logo.png";
  const sohamSignUrl = basePath + "mushroom/soham sign.png";
  const jeetSignUrl = basePath + "mushroom/jeet sign.png";

  const certificateHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=1024, initial-scale=0.4, user-scalable=yes">
  <title>${titleText} - ${targetBooking.name}</title>
  <style>
    @page { size: A4 landscape; margin: 6mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { 
      margin: 0; 
      padding: 12px; 
      font-family: Arial, sans-serif; 
      background: #f8fafc; 
      text-align: center;
      min-width: 980px; 
    }
    .certificate-frame { 
      width: 960px; 
      background: #fff; 
      border: 8px solid #1e4620; 
      padding: 20px; 
      box-sizing: border-box; 
      margin: 0 auto; 
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }
    .inner-border { border: 2px solid #d97706; padding: 20px; background: #ffffff; }
    .cert-header-top { display: flex; justify-content: center; align-items: center; gap: 15px; }
    .cert-title { font-size: 28px; font-weight: bold; color: #1e4620; text-transform: uppercase; letter-spacing: 1px; font-family: 'Times New Roman', Times, serif; margin: 12px 0 6px 0; }
    .cert-name { font-size: 24px; font-weight: bold; color: #2b8a3e; border-bottom: 2px solid #d97706; display: inline-block; padding: 0 20px; margin: 6px auto; font-family: 'Times New Roman', Times, serif; }
    .cert-desc { font-size: 14px; line-height: 1.6; text-align: justify; margin: 12px auto; max-width: 820px; color: #222; }
    .cert-footer-grid { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 25px; padding: 0 10px; }
    .sign-img { width: 120px; height: 48px; object-fit: contain; display: block; margin: 0 auto -8px auto; mix-blend-mode: multiply; }
    .no-print-bar { margin-bottom: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 10px; border-radius: 8px; width: 960px; margin-left: auto; margin-right: auto; }
    .no-print-btn { background: #2b8a3e; color: #fff; border: 0; padding: 8px 18px; font-weight: bold; border-radius: 6px; font-size: 14px; cursor: pointer; }
    @media print { .no-print-bar { display: none !important; } body { padding: 0; background: #fff; min-width: 100%; } .certificate-frame { width: 100%; box-shadow: none; } }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <button class="no-print-btn" onclick="window.print()">📥 Click Here to Save / Download PDF</button>
  </div>

  <div class="certificate-frame">
    <div class="inner-border">
      <div class="cert-header-top">
        <img src="${logoUrl}" alt="Logo" style="width: 60px; height: auto;">
        <div style="text-align:left;">
          <h2 style="color: #1e4620; margin: 0; font-size: 20px; font-weight: 800;">PURE GROW FARM</h2>
          <p style="margin: 2px 0 0 0; font-size: 11px; color:#6b7280;">Makhiyala, Gujarat, 362011 | puregrowfarm001@gmail.com</p>
        </div>
      </div>
      <hr style="border:0; border-top: 2px solid #2b8a3e; margin: 10px 0;">
      <div class="cert-title">${titleText}</div>
      <p style="font-style: italic; margin: 3px 0; color: #555; font-size: 13px;">This is to certify that</p>
      <div class="cert-name">${targetBooking.name.toUpperCase()}</div>
      <p style="font-style: italic; margin: 5px 0; color: #555; font-size: 13px;">${descText}</p>
      <p class="cert-desc">
        The program execution guidelines were conducted ${durationContent}. 
        During this framework index period, the candidate gained foundational knowledge in mushroom biology, substrate preparation, spawn inoculation, and scientific crop management, demonstrating an exceptional work ethic.
      </p>
      
      <div class="cert-footer-grid">
        <div style="text-align: center; width: 34%;">
          <div style="height: 50px; display: flex; align-items: flex-end; justify-content: center;">
            <img src="${sohamSignUrl}" alt="Soham Gajera Signature" class="sign-img">
          </div>
          <div style="border-top: 1.5px solid #333; width: 160px; margin: 0 auto 4px auto;"></div>
          <div style="font-size: 13px; font-weight: bold; color: #1e4620;">Soham N Gajera</div>
          <div style="font-size: 10px; color: #475569; margin-top: 2px;">Co-Founder & Managing Director</div>
        </div>

        <div style="text-align: center; width: 28%;">
          <img src="${logoUrl}" alt="Stamp" style="width: 55px; height: auto; opacity: 0.95;">
          <div style="font-size: 9px; font-weight: 800; color: #1e4620; margin-top: 2px; letter-spacing: 0.5px;">PURE GROW FARM</div>
          <div style="font-size: 11px; color: #334155; margin-top: 3px;">
            <strong>Approved Date:</strong> ${actualApprovedDate}
          </div>
        </div>

        <div style="text-align: center; width: 34%;">
          <div style="height: 50px; display: flex; align-items: flex-end; justify-content: center;">
            <img src="${jeetSignUrl}" alt="Jeet Gajera Signature" class="sign-img">
          </div>
          <div style="border-top: 1.5px solid #333; width: 160px; margin: 0 auto 4px auto;"></div>
          <div style="font-size: 13px; font-weight: bold; color: #1e4620;">Jeet A Gajera</div>
          <div style="font-size: 10px; color: #475569; margin-top: 2px;">Co-Founder & Director<br>(Agriculture & Production)</div>
        </div>
      </div>
    </div>
  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 500);
    });
  <\/script>
</body>
</html>`;

  const blob = new Blob([certificateHTML], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  const printWindow = window.open(blobUrl, '_blank');
  if (!printWindow) window.location.href = blobUrl;
}

function printDivInvoice() {
  const basePath = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
  const absoluteLogoUrl = basePath + "mushroom/pgf logo.png";

  const containerClone = document.getElementById('invoiceCaptureFrame').cloneNode(true);
  const logoImg = containerClone.querySelector('#invoiceBrandLogo');
  if (logoImg) {
    logoImg.src = absoluteLogoUrl;
  }

  const invoiceHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Pure Grow Farm - Invoice</title>
        <style>
          @page { size: A4; margin: 10mm; }
          body { font-family: sans-serif; padding: 20px; background: #fff; color: #222; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 14px; }
          th, td { border: 1px solid #e6e9ec; padding: 12px 14px; text-align: left; }
          th { background: #2b8a3e !important; color: white !important; -webkit-print-color-adjust: exact; font-weight: bold; }
        </style>
      </head>
      <body>
        ${containerClone.innerHTML}
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 400);
          };
        <\/script>
      </body>
    </html>
  `;

  const blob = new Blob([invoiceHTML], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  const printWin = window.open(blobUrl, '_blank');
  if (!printWin) window.location.href = blobUrl;
}

renderProducts();
checkUserSession();