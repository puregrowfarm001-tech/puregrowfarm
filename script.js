// =========================================================
// CONFIGURATION & GLOBAL CONSTANTS
// =========================================================
const farmEmail = "puregrowfarm001@gmail.com";
const farmWhatsapp = "919067891039";
const farmUpiId = "sohamgajera01@okhdfcbank";
const farmName = "Pure Grow Farm";

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

function getCleanData(key) {
  try {
    const raw = JSON.parse(localStorage.getItem(key)) || [];
    if (!Array.isArray(raw)) return [];
    return raw.filter(item => item && (item.name || item.orderId || item.bookingId || item.saleId || item.expId));
  } catch (e) {
    return [];
  }
}

let currentInventoryStock = JSON.parse(localStorage.getItem('pgf_stock_counters')) || { dry: 150, khakhra: 85, papad: 120 };
let usersDatabase = getCleanData('pgf_user_db');
let orderRegistry = getCleanData('pgf_orders');
let bookingsRegistry = getCleanData('pgf_bookings');
let expensesRegistry = getCleanData('pgf_expenses');
let salesRegistry = getCleanData('pgf_sales');
let purchasesRegistry = getCleanData('pgf_purchases');

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

  currentUser = { name, email, phone, isAdmin: false };
  localStorage.setItem('pgf_session', JSON.stringify(currentUser));
  alert("Account Registered Successfully!");
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

// =========================================================
// USER DASHBOARD
// =========================================================
function loadUserPanelData() {
  const oList = document.getElementById("userOrdersList");
  const bList = document.getElementById("userBookingsList");
  const historyCertWrapper = document.getElementById("historyCertificateWrapper");
  const historyCertContainer = document.getElementById("historyCertificatesContainer");
  
  const myOrders = orderRegistry.filter(o => o && o.email === currentUser.email);
  const myBookings = bookingsRegistry.filter(b => b && b.email === currentUser.email);

  oList.innerHTML = myOrders.length ? myOrders.map(o => {
    const isApproved = o.status === 'Approved';
    const isCancelled = o.status && o.status.startsWith('Cancelled');
    const isRejected = o.status && o.status.startsWith('Rejected');
    const isPending = o.status === 'Pending Verification';

    const stage = o.trackingStage || 'Packed';
    const loc = o.currentLocation || (isCancelled ? 'Refund in Progress' : 'Packed at Farm Yard');
    const eta = o.deliveryDays ? ` (Estimated Delivery: ${o.deliveryDays})` : '';

    const stageLevels = { 'Placed': 1, 'Packed': 2, 'Shipped': 3, 'OutForDelivery': 4, 'Delivered': 5 };
    const currentLvl = stageLevels[stage] || 2;
    const progressWidths = { 1: '0%', 2: '25%', 3: '50%', 4: '75%', 5: '100%' };
    const activeWidth = progressWidths[currentLvl] || '25%';

    const refundStage = o.refundStage || 'Refund Initiated';
    const refLevels = { 'Refund Initiated': 1, 'Refund Processing': 2, 'Refund Credited': 3 };
    const curRefLvl = refLevels[refundStage] || 1;
    const refWidths = { 1: '0%', 2: '50%', 3: '100%' };
    const activeRefWidth = refWidths[curRefLvl] || '0%';

    return `
      <div class="data-item-card" style="border: 1px solid ${isCancelled ? '#fdba74' : (isRejected ? '#fca5a5' : (isApproved ? '#86efac' : '#cbd5e1'))}; border-radius: 12px; padding: 14px; margin-bottom: 15px; background:#fff;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; border-bottom:1px solid #f1f5f9; padding-bottom:8px;">
          <strong>Order ID: <span style="color:var(--accent);">${o.orderId}</span></strong>
          <span style="font-size:12px; color:var(--muted); font-weight:600;">📅 ${o.dateLogged}</span>
        </div>
        <div style="margin: 8px 0; font-size:13px;">
          <span>Items: <strong>${o.products}</strong></span><br>
          <span>Grand Total: <strong>Rs ${o.total}</strong> [Payment: <strong>${o.paymentMode || 'UPI'}</strong> | Txn: <code>${o.txnId || 'N/A'}</code>]</span>
        </div>

        ${isPending ? `
          <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 10px; margin-top: 8px; font-size: 13px; color: #92400e;">
            ⏳ <strong>Status: Verification Pending</strong><br>
            <span style="font-size:12px;">Admin jaise hi order approve karega, Live Shipment Tracker yahan start ho jayega.</span>
          </div>
        ` : ''}

        ${isApproved ? `
          <div style="margin-top: 12px; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="font-weight:bold; font-size:13px; color:#1e293b; margin-bottom:8px;">
              🚚 Live Shipment Tracker${eta}
            </div>
            
            <div style="position: relative; margin: 20px 10px 10px 10px;">
              <div style="position: absolute; top: 12px; left: 0; width: 100%; height: 4px; background: #e2e8f0; z-index: 1;"></div>
              <div style="position: absolute; top: 12px; left: 0; width: ${activeWidth}; height: 4px; background: #2b8a3e; z-index: 1; transition: width 0.3s ease;"></div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 2;">
                <div style="text-align: center;">
                  <div style="width: 26px; height: 26px; border-radius: 50%; background: ${currentLvl >= 1 ? '#2b8a3e' : '#cbd5e1'}; color: #fff; font-size: 11px; line-height: 26px; margin: 0 auto; font-weight:bold;">✓</div>
                  <span style="font-size: 11px; font-weight: ${currentLvl >= 1 ? 'bold' : 'normal'}; display: block; margin-top: 4px; color:${currentLvl >= 1 ? '#1e293b' : '#94a3b8'};">Placed</span>
                </div>

                <div style="text-align: center;">
                  <div style="width: 26px; height: 26px; border-radius: 50%; background: ${currentLvl >= 2 ? '#2b8a3e' : '#cbd5e1'}; color: #fff; font-size: 11px; line-height: 26px; margin: 0 auto; font-weight:bold;">${currentLvl >= 2 ? '✓' : '2'}</div>
                  <span style="font-size: 11px; font-weight: ${currentLvl >= 2 ? 'bold' : 'normal'}; display: block; margin-top: 4px; color:${currentLvl >= 2 ? '#1e293b' : '#94a3b8'};">Packed</span>
                </div>

                <div style="text-align: center;">
                  <div style="width: 26px; height: 26px; border-radius: 50%; background: ${currentLvl >= 3 ? '#2b8a3e' : '#cbd5e1'}; color: #fff; font-size: 11px; line-height: 26px; margin: 0 auto; font-weight:bold;">${currentLvl >= 3 ? '✓' : '3'}</div>
                  <span style="font-size: 11px; font-weight: ${currentLvl >= 3 ? 'bold' : 'normal'}; display: block; margin-top: 4px; color:${currentLvl >= 3 ? '#1e293b' : '#94a3b8'};">Shipped</span>
                </div>

                <div style="text-align: center;">
                  <div style="width: 26px; height: 26px; border-radius: 50%; background: ${currentLvl >= 4 ? '#2b8a3e' : '#cbd5e1'}; color: #fff; font-size: 11px; line-height: 26px; margin: 0 auto; font-weight:bold;">${currentLvl >= 4 ? '✓' : '4'}</div>
                  <span style="font-size: 11px; font-weight: ${currentLvl >= 4 ? 'bold' : 'normal'}; display: block; margin-top: 4px; color:${currentLvl >= 4 ? '#1e293b' : '#94a3b8'};">Out For Delivery</span>
                </div>

                <div style="text-align: center;">
                  <div style="width: 26px; height: 26px; border-radius: 50%; background: ${currentLvl >= 5 ? '#2b8a3e' : '#cbd5e1'}; color: #fff; font-size: 11px; line-height: 26px; margin: 0 auto; font-weight:bold;">${currentLvl >= 5 ? '✓' : '5'}</div>
                  <span style="font-size: 11px; font-weight: ${currentLvl >= 5 ? 'bold' : 'normal'}; display: block; margin-top: 4px; color:${currentLvl >= 5 ? '#1e293b' : '#94a3b8'};">Delivered</span>
                </div>
              </div>
            </div>

            <div style="font-size: 12px; color: #334155; margin-top: 14px; background: #ffffff; padding: 8px 12px; border-radius: 6px; border-left: 4px solid var(--accent); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
              <span>📍 Location: <strong>${loc}</strong></span>
              <span style="font-weight:bold; color:var(--accent);">Current Stage: ${stage}</span>
            </div>
          </div>
        ` : ''}

        ${isCancelled ? `
          <div style="margin-top: 12px; background: #fffaf5; padding: 12px; border-radius: 8px; border: 1px solid #fdba74;">
            <div style="font-weight:bold; font-size:13px; color:#c2410c; margin-bottom:4px;">
              🔄 Order Cancelled & Live Payment Refund Tracker
            </div>
            <p style="margin: 2px 0 10px 0; font-size: 12px; color: #9a3412;"><strong>Reason:</strong> ${o.status.replace('Cancelled (Reason: ', '').replace(')', '')}</p>
            
            <div style="position: relative; margin: 20px 20px 10px 20px;">
              <div style="position: absolute; top: 12px; left: 0; width: 100%; height: 4px; background: #fed7aa; z-index: 1;"></div>
              <div style="position: absolute; top: 12px; left: 0; width: ${activeRefWidth}; height: 4px; background: #ea580c; z-index: 1; transition: width 0.3s ease;"></div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 2;">
                <div style="text-align: center;">
                  <div style="width: 26px; height: 26px; border-radius: 50%; background: ${curRefLvl >= 1 ? '#ea580c' : '#fdba74'}; color: #fff; font-size: 11px; line-height: 26px; margin: 0 auto; font-weight:bold;">✓</div>
                  <span style="font-size: 11px; font-weight: ${curRefLvl >= 1 ? 'bold' : 'normal'}; display: block; margin-top: 4px; color:${curRefLvl >= 1 ? '#9a3412' : '#94a3b8'};">Refund Initiated</span>
                </div>

                <div style="text-align: center;">
                  <div style="width: 26px; height: 26px; border-radius: 50%; background: ${curRefLvl >= 2 ? '#ea580c' : '#fdba74'}; color: #fff; font-size: 11px; line-height: 26px; margin: 0 auto; font-weight:bold;">${curRefLvl >= 2 ? '✓' : '2'}</div>
                  <span style="font-size: 11px; font-weight: ${curRefLvl >= 2 ? 'bold' : 'normal'}; display: block; margin-top: 4px; color:${curRefLvl >= 2 ? '#9a3412' : '#94a3b8'};">Processing (Bank)</span>
                </div>

                <div style="text-align: center;">
                  <div style="width: 26px; height: 26px; border-radius: 50%; background: ${curRefLvl >= 3 ? '#16a34a' : '#fdba74'}; color: #fff; font-size: 11px; line-height: 26px; margin: 0 auto; font-weight:bold;">${curRefLvl >= 3 ? '✓' : '3'}</div>
                  <span style="font-size: 11px; font-weight: ${curRefLvl >= 3 ? 'bold' : 'normal'}; display: block; margin-top: 4px; color:${curRefLvl >= 3 ? '#166534' : '#94a3b8'};">Refund Credited</span>
                </div>
              </div>
            </div>

            <div style="font-size: 12px; color: #7c2d12; margin-top: 14px; background: #ffffff; padding: 8px 12px; border-radius: 6px; border-left: 4px solid #ea580c; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap;">
              <span>💰 Original Payment: <strong>Rs ${o.total} Received</strong></span>
              <span style="font-weight:bold; color:#ea580c;">Status: ${refundStage}</span>
            </div>
          </div>
        ` : ''}

        ${isRejected ? `
          <div style="background: #fef2f2; border: 1px solid #f87171; border-radius: 8px; padding: 12px; margin-top: 10px;">
            <strong style="color: #991b1b; font-size: 14px;">❌ Order Rejected (Payment Not Verified)</strong>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #7f1d1d;"><strong>Reason:</strong> ${o.status.replace('Rejected (Reason: ', '').replace(')', '')}</p>
            <div style="margin-top: 6px; font-size: 12px; color: #991b1b;">
              ⚠️ Payment receive nahi hua tha / UTR invalid hone ke kaaran order reject kar diya gaya hai. Koi refund ya live tracking nahi hai.
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }).join("") : "No active orders mapped for this profile.";

  bList.innerHTML = myBookings.length ? myBookings.map(b => {
    const isConfirmed = b.status === 'Confirmed' || b.status === 'Approved';
    let statusColor = isConfirmed ? 'var(--accent)' : (b.status && b.status.startsWith('Rejected') ? 'var(--danger)' : 'var(--warn)');
    const certNote = b.certIssued ? `<br><span style="color:var(--accent); font-weight:bold;">📜 Certificate Approved & Ready to Download below!</span>` : (isConfirmed ? `<br><span style="color:#d97706; font-size:12px;">⏳ Step 1: Farm Booking Confirmed. Step 2: Certificate will be approved upon training completion.</span>` : '');
    
    return `
      <div class="data-item-card" style="border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; margin-bottom: 10px; background:#fff;">
        <strong>Booking ID: ${b.bookingId || ''}</strong><br>
        <small>Booked On: ${b.dateLogged || ''}</small><br>
        <strong>Scheme: ${b.type || ''} Visit [<span style="color:${statusColor}; font-weight:bold;">${isConfirmed ? 'Booking Confirmed' : (b.status || 'Pending Verification')}</span>]</strong>
        ${certNote}
      </div>
    `;
  }).join("") : "No course training applications logged.";

  const issuedBookings = myBookings.filter(b => b.certIssued === true);

  if (issuedBookings.length > 0) {
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
// ADMIN POPULATE TABLES (EXACT DATE & TIME SHOWN)
// =========================================================
function populateAdminDashboardTables() {
  if (document.getElementById("adminOrdersTableBody")) {
    const validOrders = orderRegistry.filter(o => o && o.name && o.orderId);
    if (!validOrders.length) {
      document.getElementById("adminOrdersTableBody").innerHTML = `<tr><td colspan="13" style="text-align:center; color:var(--muted); padding:24px; font-weight:bold;">No customer orders placed yet.</td></tr>`;
    } else {
      document.getElementById("adminOrdersTableBody").innerHTML = validOrders.map((o, idx) => {
        const sub = Number(o.subtotal || (o.total > 1000 ? o.total : o.total - 50) || 0);
        const del = Number(o.delivery !== undefined ? o.delivery : (o.total > 1000 ? 0 : 50));
        const grandTotal = Number(o.total || (sub + del));
        const mode = o.paymentMode || "Online UPI";
        const status = o.status || "Pending Verification";
        const isApproved = status === 'Approved';
        const isCancelled = status.startsWith('Cancelled');
        const isRejected = status.startsWith('Rejected');
        
        const stage = o.trackingStage || (isApproved ? 'Packed' : 'Placed');
        const loc = o.currentLocation || 'Order Received at Farm Yard';
        const eta = o.deliveryDays || '2-3 Days';
        
        // Exact Order Logged Date & Time Formatting
        const displayDateTime = o.dateLogged ? o.dateLogged : (new Date().toLocaleDateString('en-IN') + " 10:00 AM");

        return `
          <tr>
            <td><strong>${o.orderId}</strong></td>
            <td style="white-space: nowrap;">
              <span style="color:#0284c7; font-weight:bold; font-size:13px;">📅 ${displayDateTime}</span>
            </td>
            <td><strong>${o.name}</strong></td>
            <td>
              ${o.phone || 'N/A'}<br>
              <small class="muted">${o.email || ''}</small>
            </td>
            <td><small>${o.address || 'N/A'}</small></td>
            <td>${o.products || 'N/A'}</td>
            <td>Rs ${sub}</td>
            <td style="color:${del === 0 ? 'var(--accent)' : 'inherit'}; font-weight:bold;">
              ${del === 0 ? 'FREE' : 'Rs ' + del}
            </td>
            <td style="color:var(--accent); font-weight:bold; font-size:15px;">Rs ${grandTotal}</td>
            <td>
              <span class="badge" style="background:#eef2ff; color:#3730a3; margin-bottom:4px; font-weight:bold;">${mode}</span><br>
              <code>${o.txnId || 'N/A'}</code>
            </td>
            <td>
              <span class="badge ${isCancelled ? 'badge-pending' : (isRejected ? 'badge-pending' : (isApproved ? 'badge-confirmed' : 'badge-pending'))}" style="${isRejected ? 'background:#fee2e2; color:#991b1b;' : (isCancelled ? 'background:#ffedd5; color:#c2410c;' : '')}">
                ${status}
              </span>
              ${isCancelled ? `<br><small style="color:#ea580c; font-weight:bold;">Refund: ${o.refundStage || 'Initiated'}</small>` : ''}
            </td>
            
            <td style="min-width: 230px;">
              ${isApproved ? `
                <div style="background:#f8fafc; padding:8px; border-radius:8px; border:1px solid #e2e8f0; font-size:12px;">
                  <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                    <span style="font-weight:bold; color:#0284c7;">Stage: ${stage}</span>
                    <span style="color:var(--muted);">${eta}</span>
                  </div>
                  <div style="color:#334155; margin-bottom:6px;">📍 ${loc}</div>

                  <!-- 1-Click Shipment Stage Buttons -->
                  <div style="display:flex; gap:3px; flex-wrap:wrap;">
                    <button type="button" class="btn" style="padding:2px 5px; font-size:10px; min-height:22px; background:${stage==='Placed'?'#2b8a3e':'#94a3b8'};" onclick="setOrderStageDirect(${idx}, 'Placed')">Placed</button>
                    <button type="button" class="btn" style="padding:2px 5px; font-size:10px; min-height:22px; background:${stage==='Packed'?'#2b8a3e':'#94a3b8'};" onclick="setOrderStageDirect(${idx}, 'Packed')">Packed</button>
                    <button type="button" class="btn" style="padding:2px 5px; font-size:10px; min-height:22px; background:${stage==='Shipped'?'#2b8a3e':'#94a3b8'};" onclick="setOrderStageDirect(${idx}, 'Shipped')">Shipped</button>
                    <button type="button" class="btn" style="padding:2px 5px; font-size:10px; min-height:22px; background:${stage==='OutForDelivery'?'#2b8a3e':'#94a3b8'};" onclick="setOrderStageDirect(${idx}, 'Out Delivery')">Out Delivery</button>
                    <button type="button" class="btn" style="padding:2px 5px; font-size:10px; min-height:22px; background:${stage==='Delivered'?'#2b8a3e':'#94a3b8'};" onclick="setOrderStageDirect(${idx}, 'Delivered')">Delivered</button>
                  </div>
                </div>
              ` : (isCancelled ? `
                <div style="background:#fffaf5; padding:8px; border-radius:8px; border:1px solid #fdba74; font-size:12px;">
                  <span style="font-weight:bold; color:#ea580c;">Refund Tracker Control</span>
                  <div style="display:flex; gap:3px; flex-wrap:wrap; margin-top:4px;">
                    <button type="button" class="btn" style="padding:2px 5px; font-size:10px; min-height:22px; background:${o.refundStage==='Refund Initiated'?'#ea580c':'#94a3b8'};" onclick="setRefundStageDirect(${idx}, 'Refund Initiated')">1. Initiated</button>
                    <button type="button" class="btn" style="padding:2px 5px; font-size:10px; min-height:22px; background:${o.refundStage==='Refund Processing'?'#ea580c':'#94a3b8'};" onclick="setRefundStageDirect(${idx}, 'Refund Processing')">2. Processing</button>
                    <button type="button" class="btn" style="padding:2px 5px; font-size:10px; min-height:22px; background:${o.refundStage==='Refund Credited'?'#16a34a':'#94a3b8'};" onclick="setRefundStageDirect(${idx}, 'Refund Credited')">3. Credited</button>
                  </div>
                </div>
              ` : (isRejected ? `<span style="color:#dc2626; font-weight:bold; font-size:12px;">Rejected (No Payment / No Track)</span>` : `<span style="color:#d97706; font-weight:bold; font-size:12px;">Approve or Cancel to track</span>`))}
            </td>

            <td>
              <div style="display:flex; flex-direction:column; gap:4px;">
                ${!isApproved && !isCancelled && !isRejected ? `
                  <button class="btn" style="padding:4px 8px; min-height:auto; font-size:11px; background:var(--accent);" onclick="handleOrderApprove(${idx})">1. Approve (Live Track)</button>
                  <button class="btn" style="padding:4px 8px; min-height:auto; font-size:11px; background:var(--danger);" onclick="handleOrderReject(${idx})">2. Reject (No Payment)</button>
                  <button class="btn" style="padding:4px 8px; min-height:auto; font-size:11px; background:#ea580c;" onclick="handleOrderCancelRefund(${idx})">3. Cancel (Refund Track)</button>
                ` : `
                  ${isApproved ? `
                    <button class="btn" style="padding:3px 6px; min-height:auto; font-size:10px; background:#0284c7;" onclick="updateOrderLocationDetails(${idx})">📍 Edit Location</button>
                    <button class="btn" style="padding:3px 6px; min-height:auto; font-size:10px; background:#ea580c;" onclick="handleOrderCancelRefund(${idx})">Cancel & Refund</button>
                  ` : `<span style="font-weight:bold; color:var(--muted); font-size:12px;">Order Resolved</span>`}
                `}
              </div>
            </td>
          </tr>
        `;
      }).join("");
    }
  }

  // 2. Bookings Table
  if (document.getElementById("adminBookingsTableBody")) {
    const validBookings = bookingsRegistry.filter(b => b && b.name && b.bookingId);
    if (!validBookings.length) {
      document.getElementById("adminBookingsTableBody").innerHTML = `<tr><td colspan="10" style="text-align:center; color:var(--muted); padding:24px; font-weight:bold;">No student or farmer training registrations yet.</td></tr>`;
    } else {
      document.getElementById("adminBookingsTableBody").innerHTML = validBookings.map((b, idx) => {
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
            <td style="font-weight:bold; color:var(--accent); font-size:15px;">Rs ${b.fee || 0}</td>
            <td>
              <span class="badge" style="background:#eef2ff; color:#3730a3; margin-bottom:4px; font-weight:bold;">${mode}</span><br>
              <code>${b.txnId || 'N/A'}</code>
            </td>
            <td><small style="color:#0284c7; font-weight:bold;">${b.dateLogged || 'N/A'}</small></td>
            <td>
              <span class="badge ${isConfirmed ? 'badge-confirmed' : 'badge-pending'}">${isConfirmed ? '1. Booking Confirmed' : 'Pending Verification'}</span>
            </td>
            <td>
              <span class="badge ${certIssued ? 'badge-confirmed' : 'badge-pending'}">${certIssued ? '2. Certificate Approved' : 'Locked'}</span>
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
              </div>
            </td>
          </tr>
        `;
      }).join("");
    }
  }

  // 3. Users Directory Table
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
// 3 CORE ORDER ACTIONS: APPROVE / REJECT / CANCEL & REFUND
// =========================================================
function handleOrderApprove(idx) {
  orderRegistry[idx].status = "Approved";
  orderRegistry[idx].trackingStage = "Packed";
  orderRegistry[idx].currentLocation = "Processing & Packing at Pure Grow Farm Hub";
  orderRegistry[idx].deliveryDays = "2-3 Days";
  orderRegistry[idx].paymentReceived = true;
  orderRegistry[idx].refundStage = "";
  
  localStorage.setItem('pgf_orders', JSON.stringify(orderRegistry));
  alert("✅ Order Approved! User ko live shipment tracking show hone lagi.");
  populateAdminDashboardTables();
  computeFinancialLedgerStatements();
}

function handleOrderReject(idx) {
  let reason = prompt("Reject karne ka reason likhein (Payment nahi mila / Fake UTR):", "Payment Not Received / Invalid UTR");
  if (reason === null) return;

  orderRegistry[idx].status = `Rejected (Reason: ${reason})`;
  orderRegistry[idx].paymentReceived = false;
  orderRegistry[idx].trackingStage = "";
  orderRegistry[idx].refundStage = "";
  orderRegistry[idx].currentLocation = "Order Rejected due to payment failure";

  localStorage.setItem('pgf_orders', JSON.stringify(orderRegistry));
  alert("❌ Order Reject ho gaya! User ko koi live tracking ya refund line nahi dikhegi.");
  populateAdminDashboardTables();
  computeFinancialLedgerStatements();
}

function handleOrderCancelRefund(idx) {
  let reason = prompt("Order Cancel karne ka reason likhein (e.g. Out of Stock / Location Undeliverable):", "Item Out of Stock / Undeliverable Location");
  if (reason === null) return;

  orderRegistry[idx].status = `Cancelled (Reason: ${reason})`;
  orderRegistry[idx].paymentReceived = true;
  orderRegistry[idx].refundStage = "Refund Initiated";
  orderRegistry[idx].currentLocation = "Order Cancelled & Payment Refund Flow Initiated";

  localStorage.setItem('pgf_orders', JSON.stringify(orderRegistry));
  alert("🔄 Order Cancelled! User dashboard me Live Payment Refund tracker chalu ho gaya.");
  populateAdminDashboardTables();
  computeFinancialLedgerStatements();
}

function setOrderStageDirect(idx, newStage) {
  orderRegistry[idx].trackingStage = newStage;
  if (newStage === 'Placed') orderRegistry[idx].currentLocation = "Order Placed & Verified at Farm Desk";
  else if (newStage === 'Packed') orderRegistry[idx].currentLocation = "Packed & Ready at Pure Grow Farm Hub";
  else if (newStage === 'Shipped') orderRegistry[idx].currentLocation = "In Transit / Dispatched from Central Facility";
  else if (newStage === 'OutForDelivery') orderRegistry[idx].currentLocation = "Out For Delivery with Courier Partner";
  else if (newStage === 'Delivered') orderRegistry[idx].currentLocation = "Order Delivered to Customer Address";

  localStorage.setItem('pgf_orders', JSON.stringify(orderRegistry));
  populateAdminDashboardTables();
}

function setRefundStageDirect(idx, newRefStage) {
  orderRegistry[idx].refundStage = newRefStage;
  localStorage.setItem('pgf_orders', JSON.stringify(orderRegistry));
  populateAdminDashboardTables();
  alert(`Refund stage updated to: ${newRefStage}`);
}

function updateOrderLocationDetails(idx) {
  const o = orderRegistry[idx];
  const loc = prompt("Current Location enter karein:", o.currentLocation || "In Transit");
  if (loc !== null && loc.trim() !== "") o.currentLocation = loc.trim();

  const eta = prompt("Estimated Delivery Days / Time:", o.deliveryDays || "2-3 Days");
  if (eta !== null && eta.trim() !== "") o.deliveryDays = eta.trim();

  localStorage.setItem('pgf_orders', JSON.stringify(orderRegistry));
  populateAdminDashboardTables();
}

// =========================================================
// 2-STEP FARM BOOKING & CERTIFICATE APPROVAL
// =========================================================
function confirmBookingSlot(idx) {
  bookingsRegistry[idx].status = "Confirmed";
  bookingsRegistry[idx].approvedDate = new Date().toLocaleDateString('en-IN');
  bookingsRegistry[idx].certIssued = false;
  localStorage.setItem('pgf_bookings', JSON.stringify(bookingsRegistry));
  
  const target = bookingsRegistry[idx];
  const saleLog = { 
    saleId: "SALE-" + Date.now().toString().slice(-4),
    type: "sale", 
    product: `Training Entry: ${target.type} Program`, 
    collector: "Farm", 
    buyer: target.name, 
    phone: target.phone || "N/A",
    address: "Pure Grow Farm Campus",
    qty: 1, 
    rate: target.fee, 
    total: target.fee, 
    date: new Date().toLocaleDateString('en-IN') 
  };
  salesRegistry.push(saleLog);
  localStorage.setItem('pgf_sales', JSON.stringify(salesRegistry));

  alert(`✅ 1. Farm Book Approved for ${target.name}!\nTraining complete hone par '2. Approve Certificate' dabayein.`);
  populateAdminDashboardTables();
  computeFinancialLedgerStatements();
}

function issueUserCertificate(idx) {
  if (confirm(`Kya aap ${bookingsRegistry[idx].name} ke liye certificate approve karna chahte hain? Iske baad user download kar sakega.`)) {
    bookingsRegistry[idx].certIssued = true;
    bookingsRegistry[idx].certIssueDate = new Date().toLocaleDateString('en-IN');
    localStorage.setItem('pgf_bookings', JSON.stringify(bookingsRegistry));
    alert("✅ 2. Certificate Approved ho gaya aur user ke dashboard me download unlock ho gaya!");
    populateAdminDashboardTables();
  }
}

function rejectTrainingBooking(idx) {
  let reason = prompt("Reject karne ka reason likhein:");
  if(reason === null) return;
  if(reason.trim() === "") reason = "Not specified by farm admin";
  
  bookingsRegistry[idx].status = `Rejected (Reason: ${reason})`;
  bookingsRegistry[idx].certIssued = false;
  localStorage.setItem('pgf_bookings', JSON.stringify(bookingsRegistry));
  populateAdminDashboardTables();
  computeFinancialLedgerStatements();
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

  let cashBalances = { Soham: 0, Jeet: 0, Farm: 0 };
  salesRegistry.forEach(s => { if(cashBalances[s.collector] !== undefined) cashBalances[s.collector] += Number(s.total || 0); });
  expensesRegistry.forEach(e => { if(cashBalances[e.payer] !== undefined) cashBalances[e.payer] -= Number(e.amount || 0); });
  purchasesRegistry.forEach(p => { if(cashBalances[p.funder] !== undefined) cashBalances[p.funder] -= Number(p.total || 0); });

  if(document.getElementById("cashSoham")) document.getElementById("cashSoham").textContent = "Rs " + cashBalances.Soham.toFixed(2);
  if(document.getElementById("cashJeet")) document.getElementById("cashJeet").textContent = "Rs " + cashBalances.Jeet.toFixed(2);
  if(document.getElementById("cashFarm")) document.getElementById("cashFarm").textContent = "Rs " + cashBalances.Farm.toFixed(2);

  const expRows = expensesRegistry.filter(e => e.category !== "Damage Received");
  if(document.getElementById("subExpenseTableBody")) {
    document.getElementById("subExpenseTableBody").innerHTML = expRows.map(e => `
      <tr><td>${e.date}</td><td>${e.category}</td><td>${e.payer}</td><td>${e.desc}</td><td style="color:var(--warn); font-weight:bold;">Rs ${e.amount}</td></tr>
    `).join("");
  }

  if(document.getElementById("subSellTableBody")) {
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
  }

  if(document.getElementById("subBuyTableBody")) {
    document.getElementById("subBuyTableBody").innerHTML = purchasesRegistry.map(p => `
      <tr><td>${p.date}</td><td>${p.product}</td><td>${p.vendor}</td><td>${p.qty}</td><td style="color:var(--danger); font-weight:bold;">Rs ${p.total}</td></tr>
    `).join("");
  }

  const dmgRows = expensesRegistry.filter(e => e.category === "Damage Received");
  if(document.getElementById("subDamageTableBody")) {
    document.getElementById("subDamageTableBody").innerHTML = dmgRows.map(d => `
      <tr><td>${d.date}</td><td>${d.desc}</td><td>${d.payer}</td><td style="color:var(--danger); font-weight:bold;">Rs ${d.amount}</td></tr>
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

  const data = {
    saleId: "SALE-" + Date.now().toString().slice(-4),
    date: rawDate ? new Date(rawDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
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
    date: rawDate ? new Date(rawDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
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
    date: rawDate ? new Date(rawDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
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
  if(!targetSale) return alert("Invoice not found.");
  
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
      <td style="padding:12px 14px; border-bottom:1px solid #e6e9ec; text-align:right; font-weight:600; color:var(--accent);">Rs ${Number(targetSale.total).toFixed(2)}</td>
    </tr>
  `;
  
  document.getElementById("invSub").textContent = "Rs " + Number(targetSale.total).toFixed(2);
  document.getElementById("invDelivery").textContent = "Rs 0";
  document.getElementById("invTotal").textContent = "Rs " + Number(targetSale.total).toFixed(2);
  
  document.getElementById("invoiceDialog").showModal();
}

// =========================================================
// PRODUCT CATALOG & CART
// =========================================================
function renderProducts(list = products) {
  if(!document.getElementById("productsList")) return;
  document.getElementById("productsList").innerHTML = list.map(product => `
    <article class="product">
      <img src="${product.image}" alt="${product.name}">
      <h3>${product.name}</h3>
      <p class="muted">${product.detail}</p>
      <div style="margin-bottom: 8px;">
        <span class="badge" style="background: #dcfce7; color: #166534; font-size:11px;">Status: Available</span>
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
  if(document.getElementById("subtotal")) document.getElementById("subtotal").textContent = `Rs ${bill.subtotal}`;
  if(document.getElementById("delivery")) document.getElementById("delivery").textContent = `Rs ${bill.delivery}`;
  if(document.getElementById("total")) document.getElementById("total").textContent = `Rs ${bill.total}`;

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
  document.getElementById("productPaymentHelp").textContent = `Launching payment link for Rs ${bill.total} via ${mode}.`;
  
  window.location.href = `upi://pay?pa=${encodeURIComponent(farmUpiId)}&pn=${encodeURIComponent(farmName)}&am=${bill.total}&cu=INR`;
  
  document.getElementById("paymentId").disabled = false;
  validateOrderForm();
}

function validateOrderForm() {
  const address = document.getElementById("address") ? document.getElementById("address").value.trim() : "";
  const mode = document.getElementById("paymentMode") ? document.getElementById("paymentMode").value : "";
  const txnId = document.getElementById("paymentId") ? document.getElementById("paymentId").value.trim() : "";
  
  const isValid = cart.size > 0 && address.length > 4 && mode !== "" && txnId.length >= 4;
  if(document.getElementById("confirmOrderBtn")) document.getElementById("confirmOrderBtn").disabled = !isValid;
}

if(document.getElementById("address")) {
  document.getElementById("address").addEventListener("input", validateOrderForm);
}

function confirmOrder(e) {
  e.preventDefault();
  const bill = getTotals();
  
  // Exact Indian Local Date & Time
  const now = new Date();
  const currentFormattedDateTime = now.toLocaleDateString('en-IN') + " " + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  
  const generatedOrderId = "PGF-INV-" + Date.now().toString().slice(-5);
  const selectedMode = document.getElementById("paymentMode").value;

  const data = {
    orderId: generatedOrderId,
    name: currentUser.name,
    phone: currentUser.phone,
    email: currentUser.email,
    address: document.getElementById("address").value.trim(),
    products: [...cart.values()].map(i => `${i.name} [x${i.qty}]`).join(", "),
    subtotal: bill.subtotal,
    delivery: bill.delivery,
    total: bill.total,
    paymentMode: selectedMode ? selectedMode + " App" : "UPI App",
    txnId: document.getElementById("paymentId").value.trim(),
    dateLogged: currentFormattedDateTime,
    trackingStage: "Placed",
    currentLocation: "Order Placed - Waiting for Farm Packing",
    deliveryDays: "2-3 Days",
    status: "Pending Verification",
    paymentReceived: false,
    refundStage: ""
  };

  orderRegistry.unshift(data);
  localStorage.setItem('pgf_orders', JSON.stringify(orderRegistry));
  
  document.getElementById("invNum").textContent = data.orderId;
  document.getElementById("invDate").textContent = new Date().toLocaleDateString('en-IN');
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
  document.getElementById("invDelivery").textContent = "Rs " + bill.delivery;
  document.getElementById("invTotal").textContent = "Rs " + bill.total;
  
  const waMessage = `NEW GOODS ORDER VERIFICATION FLOW:\n----------------------------------------\nInvoice Ref Code: ${data.orderId}\nClient Legal Name: ${data.name}\nOrder Date & Time: ${data.dateLogged}\nProducts: ${data.products}\nSubtotal: Rs ${data.subtotal}\nDelivery: Rs ${data.delivery}\nGrand Total: Rs ${data.total}\nPayment Method: ${data.paymentMode}\nTransaction ID: ${data.txnId}\n----------------------------------------`;
  
  window.open(`https://wa.me/${farmWhatsapp}?text=${encodeURIComponent(waMessage)}`, '_blank');
  document.getElementById("invoiceDialog").showModal();
  
  cart.clear();
  renderCart();
  document.getElementById("orderForm").reset();
  checkUserSession();
}

function closeInvoice() { document.getElementById("invoiceDialog").close(); }

// =========================================================
// TRAINING & INTERNSHIP PAYMENT
// =========================================================
function showVisitForm(id) {
  document.getElementById("studentForm").classList.remove("active");
  document.getElementById("farmerForm").classList.remove("active");
  document.getElementById(id).classList.add("active");
}

function openVisitPayment(formId, amount) {
  const isStudent = formId === "studentForm";
  const selectModeId = isStudent ? "spaymentMode" : "fpaymentMode";
  const helpId = isStudent ? "studentPaymentHelp" : "farmerPaymentHelp";
  const txnInputId = isStudent ? "spayment" : "fpayment";
  const mode = document.getElementById(selectModeId).value;

  if(!mode) {
    document.getElementById(txnInputId).value = "";
    document.getElementById(txnInputId).disabled = true;
    if(isStudent) validateStudentForm();
    else validateFarmerForm();
    return;
  }
  
  document.getElementById(helpId).style.display = "block";
  document.getElementById(helpId).textContent = `Launching payment link for Rs ${amount} via ${mode}.`;
  
  window.location.href = `upi://pay?pa=${encodeURIComponent(farmUpiId)}&pn=${encodeURIComponent(farmName)}&am=${amount}&cu=INR`;
  
  document.getElementById(txnInputId).disabled = false;
  if(isStudent) validateStudentForm();
  else validateFarmerForm();
}

function validateStudentForm() {
  const enroll = document.getElementById("senroll").value.trim();
  const college = document.getElementById("scollege").value.trim();
  const course = document.getElementById("scourse").value.trim();
  const start = document.getElementById("sstart").value;
  const end = document.getElementById("send").value;
  const mode = document.getElementById("spaymentMode").value;
  const txn = document.getElementById("spayment").value.trim();
  const isDisabled = document.getElementById("spayment").disabled;
  
  const isValid = !isDisabled && enroll !== "" && college !== "" && course !== "" && start !== "" && end !== "" && mode !== "" && txn.length >= 4;
  document.getElementById("studentSubmitBtn").disabled = !isValid;
}

function validateFarmerForm() {
  const date = document.getElementById("fdate").value;
  const mode = document.getElementById("fpaymentMode").value;
  const txn = document.getElementById("fpayment").value.trim();
  const isDisabled = document.getElementById("fpayment").disabled;
  
  const isValid = !isDisabled && date !== "" && mode !== "" && txn.length >= 4;
  document.getElementById("farmerSubmitBtn").disabled = !isValid;
}

if(document.getElementById("studentForm")) {
  ['senroll', 'scollege', 'scourse', 'sstart', 'send', 'spayment'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.addEventListener("input", validateStudentForm);
  });
}
if(document.getElementById("farmerForm")) {
  ['fdate', 'fpayment'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.addEventListener("input", validateFarmerForm);
  });
}

function submitStudentVisit(e) {
  e.preventDefault();
  const selectedMode = document.getElementById("spaymentMode").value;
  const now = new Date();
  const currentFormattedDateTime = now.toLocaleDateString('en-IN') + " " + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

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
    fee: 100,
    paymentMode: selectedMode ? selectedMode + " App" : "UPI App",
    txnId: document.getElementById("spayment").value.trim(),
    dateLogged: currentFormattedDateTime,
    status: "Pending Verification",
    certIssued: false,
    approvedDate: ""
  };
  bookingsRegistry.unshift(data);
  localStorage.setItem('pgf_bookings', JSON.stringify(bookingsRegistry));

  const waText = `NEW STUDENT INTERNSHIP REGISTRATION:\n----------------------------------------\nBooking Ref ID: ${data.bookingId}\nName: ${data.name}\nCollege: ${data.college}\nCourse: ${data.course}\nDates: ${data.start} to ${data.end}\nPayment Mode: ${data.paymentMode}\nUTR / Txn ID: ${data.txnId}\n----------------------------------------`;
  window.open(`https://wa.me/${farmWhatsapp}?text=${encodeURIComponent(waText)}`, '_blank');
  
  document.getElementById("studentForm").reset();
  document.getElementById("spayment").disabled = true;
  alert("Student Registration submitted successfully!");
  checkUserSession();
}

function submitFarmerVisit(e) {
  e.preventDefault();
  const selectedMode = document.getElementById("fpaymentMode").value;
  const now = new Date();
  const currentFormattedDateTime = now.toLocaleDateString('en-IN') + " " + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  const data = {
    bookingId: "PGF-FAR-" + Date.now().toString().slice(-4),
    type: "Farmer",
    name: currentUser.name,
    phone: currentUser.phone,
    email: currentUser.email,
    date: document.getElementById("fdate").value,
    fee: 699,
    paymentMode: selectedMode ? selectedMode + " App" : "UPI App",
    txnId: document.getElementById("fpayment").value.trim(),
    dateLogged: currentFormattedDateTime,
    status: "Pending Verification",
    certIssued: false,
    approvedDate: ""
  };
  bookingsRegistry.unshift(data);
  localStorage.setItem('pgf_bookings', JSON.stringify(bookingsRegistry));

  const waText = `NEW FARMER TRAINING BOOKING:\n----------------------------------------\nBooking Ref ID: ${data.bookingId}\nName: ${data.name}\nTarget Date: ${data.date}\nPayment Mode: ${data.paymentMode}\nUTR / Txn ID: ${data.txnId}\n----------------------------------------`;
  window.open(`https://wa.me/${farmWhatsapp}?text=${encodeURIComponent(waText)}`, '_blank');
  
  document.getElementById("farmerForm").reset();
  document.getElementById("fpayment").disabled = true;
  alert("Farmer Training Booking submitted successfully!");
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
  const targetBooking = bookingsRegistry.find(b => b.bookingId === bookingId);
  if (!targetBooking) return alert("Certificate not found.");
  if (!targetBooking.certIssued) return alert("Certificate has not been issued yet by Farm Admin.");

  const titleText = targetBooking.type === "Student" ? "Certificate of Internship" : "Certificate of Farming";
  const descText = targetBooking.type === "Student" 
    ? `has successfully completed an internship program in Oyster Mushroom Cultivation at Pure Grow Mushroom Farm, at Makhiyala, Gujarat.`
    : `has successfully completed the practical farmer training framework module in Oyster Mushroom Cultivation at Pure Grow Mushroom Farm, at Makhiyala, Gujarat.`;
  
  const durationContent = targetBooking.type === "Student" 
    ? `from <strong>${targetBooking.start}</strong> to <strong>${targetBooking.end}</strong>`
    : `on target session date <strong>${targetBooking.date}</strong>`;

  const actualApprovedDate = targetBooking.certIssueDate ? targetBooking.certIssueDate : new Date(targetBooking.dateLogged).toLocaleDateString('en-IN');

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
              During this period, the candidate gained foundational knowledge in mushroom biology, substrate preparation, and crop management.
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

// Initial Booting
renderProducts();
checkUserSession();