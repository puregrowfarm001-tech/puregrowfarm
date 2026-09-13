import { _supabase } from './config.js';
import { orderRegistry, bookingsRegistry, expensesRegistry, salesRegistry, purchasesRegistry, dailyDryStockRegistry, usersDatabase, setOrderRegistry, setBookingsRegistry, setDailyDryStockRegistry, setExpensesRegistry, setSalesRegistry, setPurchasesRegistry } from './state.js';
import { initDefaultDatePickers } from './utils.js';
import { renderAdminLiveStockSummary } from './stock.js';
import { renderDailyDryStockTable } from './production.js';
import { computeFinancialLedgerStatements } from './accounting.js';
import { renderNotificationBadge } from './notifications.js';

export async function triggerAdminView() {
  document.getElementById("mainNav").style.display = "none";
  document.getElementById("authSection").style.display = "none";
  document.getElementById("dashboardWorkspace").style.display = "none";
  document.getElementById("publicContent").style.display = "none";
  document.getElementById("adminErpView").classList.add("active");
  
  const { data: cloudOrders } = await _supabase.from('pgf_orders').select('*');
  if (cloudOrders) {
    const mappedOrders = cloudOrders.map(o => ({
      orderId: o.order_id, name: o.name, phone: o.phone, email: o.email, address: o.address,
      userUpiId: o.user_upi_id, products: o.products, subtotal: o.subtotal, delivery: o.delivery,
      total: o.total, paymentMode: o.payment_mode, txnId: o.txn_id, dateLogged: o.date_logged,
      paymentDate: o.payment_date || o.date_logged, rawIsoDate: o.raw_iso_date, deliveryDays: o.delivery_days,
      courierName: o.courier_name, trackingStage: o.tracking_stage, currentLocation: o.current_location,
      deliveredDate: o.delivered_date, cancelledDate: o.cancelled_date, refundStage: o.refund_stage,
      refundCreditedDate: o.refund_credited_date, status: o.status
    }));
    setOrderRegistry(mappedOrders);
  }

  const { data: cloudBookings } = await _supabase.from('pgf_bookings').select('*');
  if (cloudBookings) {
    const mappedBookings = cloudBookings.map(b => ({
      bookingId: b.booking_id, type: b.type, name: b.name, phone: b.phone, email: b.email,
      enrollment: b.enrollment, college: b.college, course: b.course, start: b.start_date,
      end: b.end_date, date: b.session_date, userUpiId: b.user_upi_id, fee: b.fee,
      paymentMode: b.payment_mode, txnId: b.txn_id, dateLogged: b.date_logged, status: b.status,
      approvedDate: b.approved_date, certIssued: b.cert_issued, certIssueDate: b.cert_issue_date
    }));
    setBookingsRegistry(mappedBookings);
  }

  const { data: cloudDry } = await _supabase.from('pgf_daily_dry_stock').select('*');
  if (cloudDry) {
    const mappedDry = cloudDry.map(d => ({
      dryId: d.dry_id, date: d.date, rawIsoDate: d.raw_iso_date, qty: Number(d.qty), notes: d.notes
    }));
    setDailyDryStockRegistry(mappedDry);
  }

  const { data: cloudExp } = await _supabase.from('pgf_expenses').select('*');
  if (cloudExp) {
    const mappedExp = cloudExp.map(e => ({
      expId: e.exp_id, date: e.date, category: e.category, payer: e.payer, mode: e.mode, desc: e.desc, amount: Number(e.amount), notes: e.notes
    }));
    setExpensesRegistry(mappedExp);
  }

  const { data: cloudSales } = await _supabase.from('pgf_sales').select('*');
  if (cloudSales) {
    const mappedSales = cloudSales.map(s => ({
      saleId: s.sale_id, date: s.date, product: s.product, collector: s.collector, buyer: s.buyer, phone: s.phone, address: s.address, qty: Number(s.qty), rate: Number(s.rate), subtotal: Number(s.subtotal), delivery: Number(s.delivery), total: Number(s.total), paidAmount: Number(s.paid_amount), notes: s.notes
    }));
    setSalesRegistry(mappedSales);
  }

  const { data: cloudPurchases } = await _supabase.from('pgf_purchases').select('*');
  if (cloudPurchases) {
    const mappedPurchases = cloudPurchases.map(p => ({
      purId: p.pur_id, date: p.date, product: p.product, funder: p.funder, vendor: p.vendor, vendorPhone: p.vendor_phone, qty: Number(p.qty), rate: Number(p.rate), delivery: Number(p.delivery), total: Number(p.total), paidAmount: Number(p.paid_amount), notes: p.notes
    }));
    setPurchasesRegistry(mappedPurchases);
  }

  const { data: cloudDamages } = await _supabase.from('pgf_damages').select('*');
  if (cloudDamages) {
    const mappedDamages = cloudDamages.map(d => ({
      exp_id: d.exp_id, date: d.date, category: "Damage Received", payer: d.payer, mode: "Internal Allocation", desc: d.desc, amount: Number(d.amount), notes: d.notes
    }));
    expensesRegistry.push(...mappedDamages);
  }

  initDefaultDatePickers();
  if (typeof window.populateAdminDashboardTables === 'function') {
    window.populateAdminDashboardTables();
  } else {
    populateAdminDashboardTables();
  }
  computeFinancialLedgerStatements();
  renderNotificationBadge();
  renderAdminLiveStockSummary();
  renderDailyDryStockTable();
  if (typeof window.switchSubAccountingTab === 'function') {
    window.switchSubAccountingTab('subTabDryStock');
  }
}

export function exitAdminPanel() { 
  if (typeof window.handleLogout === 'function') {
    window.handleLogout();
  }
}

export function switchErpTab(tabId, buttonId) {
  document.querySelectorAll('.erp-section').forEach(s => s.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  document.querySelectorAll('#erpNavbarBlock button').forEach(btn => btn.classList.remove('active-tab'));
  document.getElementById(buttonId).classList.add('active-tab');
}

export function switchSubAccountingTab(subTabId) {
  document.querySelectorAll('.sub-accounting-section').forEach(section => section.style.display = 'none');
  document.getElementById(subTabId).style.display = 'block';
  
  const buttons = ['btnSubTabDryStock', 'btnSubTabExpense', 'btnSubTabSell', 'btnSubTabBuy', 'btnSubTabDamage'];
  buttons.forEach(bId => {
    if(document.getElementById(bId)) document.getElementById(bId).style.background = 'var(--muted)';
  });
  
  let targetActiveButton = 'btn' + subTabId.charAt(0).toUpperCase() + subTabId.slice(1);
  if(document.getElementById(targetActiveButton)) document.getElementById(targetActiveButton).style.background = 'var(--accent)';
}

export function switchExpCategoryTab(secId) {
  document.querySelectorAll('.exp-cat-section').forEach(sec => sec.style.display = 'none');
  document.getElementById(secId).style.display = 'block';
  
  ['btnExpCatFarm', 'btnExpCatMushroom', 'btnExpCatStudent'].forEach(bId => {
    const btn = document.getElementById(bId);
    if(btn) btn.style.background = 'var(--muted)';
  });
  
  if(secId === 'expCatFarmSec') {
    const btn = document.getElementById('btnExpCatFarm');
    if(btn) btn.style.background = 'var(--accent)';
  }
  if(secId === 'expCatMushroomSec') {
    const btn = document.getElementById('btnExpCatMushroom');
    if(btn) btn.style.background = 'var(--accent)';
  }
  if(secId === 'expCatStudentSec') {
    const btn = document.getElementById('btnExpCatStudent');
    if(btn) btn.style.background = 'var(--accent)';
  }
}

export function handleAdminYearFilterChange() {
  populateAdminDashboardTables();
  computeFinancialLedgerStatements();
}

export function filterAdminOrdersTable() {
  const query = (document.getElementById("adminOrdersSearchInput")?.value || "").toLowerCase().trim();
  const rows = document.querySelectorAll("#adminOrdersTableBody tr");
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(query) ? "" : "none";
  });
}

export function filterAdminBookingsTable() {
  const query = (document.getElementById("adminBookingsSearchInput")?.value || "").toLowerCase().trim();
  const rows = document.querySelectorAll("#adminBookingsTableBody tr");
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(query) ? "" : "none";
  });
}

export function filterAdminUsersTable() {
  const query = (document.getElementById("adminUsersSearchInput")?.value || "").toLowerCase().trim();
  const rows = document.querySelectorAll("#adminUsersTableBody tr");
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(query) ? "" : "none";
  });
}

export function filterSubTable(inputId, tbodyId) {
  const query = (document.getElementById(inputId)?.value || "").toLowerCase().trim();
  const rows = document.querySelectorAll(`#${tbodyId} tr`);
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(query) ? "" : "none";
  });
}

export function populateAdminDashboardTables() {
  renderAdminLiveStockSummary();
  renderDailyDryStockTable();

  const selectedYear = document.getElementById("adminYearFilterSelect")?.value || "ALL";

  const validOrders = orderRegistry.filter(o => {
    if (!o || !o.name || !o.orderId) return false;
    if (selectedYear === "ALL") return true;
    const orderDateStr = o.rawIsoDate || o.dateLogged || "";
    return orderDateStr.includes(selectedYear);
  });
  
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
      document.getElementById("adminOrdersTableBody").innerHTML = `<tr><td colspan="10" style="text-align:center; color:var(--muted); padding:24px; font-weight:bold;">No customer orders found for year ${selectedYear}.</td></tr>`;
    } else {
      document.getElementById("adminOrdersTableBody").innerHTML = validOrders.map((o) => {
        const idx = orderRegistry.indexOf(o);
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
        const refundDate = o.refundCreditedDate || '2026-01-01';
        const displayDateTime = o.dateLogged || 'N/A';
        const paymentDate = o.paymentDate || displayDateTime;
        const userUpi = o.userUpiId || "N/A";

        return `
          <tr>
            <td><strong>${o.orderId}</strong></td>
            <td style="white-space: nowrap;">
              <span style="color:#0284c7; font-weight:bold; font-size:12px;">📅 Placed: ${displayDateTime}</span><br>
              <span style="color:#16a34a; font-weight:bold; font-size:11px;">💳 Paid: ${paymentDate}</span>
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
              <span class="badge" style="${isRejected ? 'background:#fee2e2; color:#991b1b;' : (isCancelled ? 'background:#ffedd5; color:#c2410c;' : (isDelivered ? 'background:#16a34a; color:#fff;' : ''))}">
                ${status}
              </span>
              ${isCancelled ? `<br><small style="color:${o.refundStage === 'Refund Credited' ? '#16a34a' : '#ea580c'}; font-weight:bold;">Refund: ${o.refundStage || 'Initiated'} ${o.refundCreditedDate ? `(${o.refundCreditedDate})` : ''}</small>` : ''}
              ${isDelivered && o.deliveredDate ? `<br><small style="color:#16a34a; font-weight:bold;">Delivered: ${o.deliveredDate}</small>` : ''}
            </td>
            
            <td style="min-width: 280px;">
              ${isApproved && !isCancelled && !isRejected ? `
                <div style="background:#f8fafc; padding:8px; border-radius:8px; border:1px solid #e2e8f0; font-size:12px;">
                  <div style="margin-bottom:6px; display:flex; align-items:center; gap:4px; background:#fff; padding:4px 6px; border-radius:6px; border:1px solid #cbd5e1;">
                    <label style="font-size:11px; font-weight:bold; color:#0f172a; white-space:nowrap;">📅 Delivery Date:</label>
                    <input type="date" value="${eta}" style="padding:2px 4px; font-size:11px; width:100%; border:1px solid #94a3b8; border-radius:4px;" onchange="updateExpectedDeliveryDate(${idx}, this.value)">
                  </div>

                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; gap:4px;">
                    <span style="font-weight:bold; color:#0284c7; white-space:nowrap;">Courier:</span>
                    <input type="text" value="${courier}" placeholder="Courier Name" style="padding:2px 6px; font-size:11px; font-weight:bold; color:#334155; border:1px solid #94a3b8; border-radius:4px; width:140px; text-align:right;" onchange="updateOrderCourierDirect(${idx}, this.value)">
                  </div>

                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; gap:4px;">
                    <span style="font-weight:bold; color:#0284c7; white-space:nowrap;">📍 Location:</span>
                    <input type="text" value="${loc}" placeholder="Order Location" style="padding:2px 6px; font-size:11px; font-weight:bold; color:#334155; border:1px solid #94a3b8; border-radius:4px; width:130px; text-align:right;" onchange="updateOrderLocationDirect(${idx}, this.value)">
                  </div>

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
                    <button type="button" class="btn" style="padding:3px 6px; font-size:11px; min-height:24px; background:${o.refundStage==='Refund Credited'?'#16a34a':'#dc2626'}; font-weight:bold;" onclick="setRefundStageDirect(${idx}, 'Refund Credited')">💸 Credited</button>
                  </div>
                </div>
              ` : `<span style="color:#d97706; font-weight:bold; font-size:12px;">Approve or Cancel</span>`)}
            </td>

            <td>
              <div style="display:flex; flex-direction:column; gap:4px;">
                <button class="btn" style="padding:5px 8px; font-size:11px; background:#0f172a; border-radius:6px;" onclick="openOrderActionsMenu(${idx})">⚙️ Manage</button>
                <button class="btn" style="padding:5px 8px; font-size:11px; background:#25d366; border-radius:6px;" onclick="sendAdminWhatsAppMessage('order', '${o.orderId}')">💬 WhatsApp</button>
              </div>
            </td>
          </tr>
        `;
      }).join("");
    }
  }

  const validBookings = bookingsRegistry.filter(b => {
    if (!b || !b.name || !b.bookingId) return false;
    if (selectedYear === "ALL") return true;
    const bookingDateStr = b.date || b.dateLogged || "";
    return bookingDateStr.includes(selectedYear);
  });

  if (document.getElementById("adminTotalStudentsCount")) document.getElementById("adminTotalStudentsCount").textContent = validBookings.filter(b => b.type === "Student").length;
  if (document.getElementById("adminTotalFarmersCount")) document.getElementById("adminTotalFarmersCount").textContent = validBookings.filter(b => b.type === "Farmer").length;
  if (document.getElementById("adminTotalBookingsFee")) document.getElementById("adminTotalBookingsFee").textContent = `Rs ${validBookings.filter(b => b.status === "Confirmed" || b.status === "Approved").reduce((sum, b) => sum + Number(b.fee || 0), 0).toFixed(2)}`;
  if (document.getElementById("adminBookingsPendingCount")) document.getElementById("adminBookingsPendingCount").textContent = validBookings.filter(b => b.status === "Pending Verification").length;
  if (document.getElementById("adminCertificatesPendingCount")) document.getElementById("adminCertificatesPendingCount").textContent = validBookings.filter(b => (b.status === "Confirmed" || b.status === "Approved") && !b.certIssued).length;

  if (document.getElementById("adminBookingsTableBody")) {
    if (!validBookings.length) {
      document.getElementById("adminBookingsTableBody").innerHTML = `<tr><td colspan="10" style="text-align:center; color:var(--muted); padding:24px; font-weight:bold;">No farm training bookings found.</td></tr>`;
    } else {
      document.getElementById("adminBookingsTableBody").innerHTML = validBookings.map((b) => {
        const idx = bookingsRegistry.indexOf(b);
        const isStudent = b.type === "Student";
        const submittedDetails = isStudent ? `<strong>College:</strong> ${b.college || 'N/A'}<br>Dates: ${b.start || 'N/A'} to ${b.end || 'N/A'}` : `Session Date: ${b.date || 'N/A'}`;
        const isConfirmed = b.status === "Confirmed" || b.status === "Approved";
        const certIssued = b.certIssued === true;
        const bUpi = b.userUpiId || "N/A";
        const isRejectedBooking = b.status && b.status.startsWith('Rejected');

        return `
          <tr>
            <td><strong>${b.bookingId}</strong></td>
            <td><span class="badge" style="background:${isStudent ? '#e0f2fe; color:#0369a1;' : '#fef3c7; color:#92400e;'}">${b.type}</span></td>
            <td><strong>${b.name}</strong><br><small>${b.phone || 'N/A'}</small></td>
            <td><small>${submittedDetails}</small></td>
            <td style="font-weight:bold; color:var(--accent);">Rs ${b.fee || 0}</td>
            <td><code>${bUpi}</code></td>
            <td><small>${b.dateLogged || 'N/A'}</small></td>
            <td><span class="badge">${isConfirmed ? 'Confirmed' : b.status}</span></td>
            <td><span class="badge">${certIssued ? 'Approved' : 'Pending'}</span></td>
            <td>
              <div style="display:flex; flex-direction:column; gap:4px;">
                ${!isConfirmed && !isRejectedBooking ? `
                  <button class="btn" style="padding:4px 8px; font-size:11px; background:var(--accent);" onclick="confirmBookingSlot(${idx})">Approve</button>
                  <button class="btn" style="padding:4px 8px; font-size:11px; background:var(--danger);" onclick="rejectTrainingBooking(${idx})">Reject</button>
                ` : (isConfirmed && !certIssued ? `
                  <button class="btn" style="padding:4px 8px; font-size:11px; background:#0284c7;" onclick="issueUserCertificate(${idx})">Approve Cert</button>
                ` : '')}
                <button class="btn" style="padding:4px 8px; font-size:11px; background:#25d366;" onclick="sendAdminWhatsAppMessage('booking', '${b.bookingId}')">WhatsApp</button>
              </div>
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
        <td>
          <button class="btn" style="padding:4px 8px; font-size:11px; background:var(--danger);" onclick="deleteUserAccount(${idx})">Delete</button>
        </td>
      </tr>
    `).join("") || `<tr><td colspan="6" style="text-align:center;">No users found.</td></tr>`;
  }
}

export function openAdminFilterModal(type) {
  const modal = document.getElementById("adminFilterPopupModal");
  const titleEl = document.getElementById("adminFilterModalTitle");
  const listEl = document.getElementById("adminFilterModalContentList");
  if (!modal || !titleEl || !listEl) return;

  modal.classList.add("active-modal");
  let htmlContent = "";

  if (type === 'orders_pending_confirm') {
    titleEl.textContent = "⌛ Pending Confirm Orders List";
    const pendingConfirmList = orderRegistry.filter(o => o && o.status === 'Pending Verification');
    htmlContent = pendingConfirmList.length ? pendingConfirmList.map(o => `
      <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; padding:12px; display:flex; justify-content:space-between; align-items:center;">
        <div><strong>${o.orderId} - ${o.name}</strong><br><small>Total: ₹${o.total} | UPI: ${o.userUpiId}</small></div>
      </div>
    `).join("") : `<p class="muted" style="text-align:center;">No pending orders.</p>`;
  } else if (type === 'list_orders') {
    titleEl.textContent = "📋 All Orders List";
    htmlContent = orderRegistry.map(o => `<div><strong>${o.orderId}</strong> - ${o.name} (₹${o.total})</div>`).join("");
  } else {
    titleEl.textContent = "Detailed List View";
    htmlContent = `<p>Data records list view.</p>`;
  }

  listEl.innerHTML = htmlContent;
}