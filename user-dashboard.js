import { _supabase } from './config.js';
import { currentUser, setCurrentUser, orderRegistry, bookingsRegistry } from './state.js';
import { isPasswordStrong } from './utils.js';
import { checkUserSession } from './auth.js';

export function openOrdersModal() {
  document.getElementById("userOrdersModal").classList.add("active-modal");
  loadUserPanelData();
}

export function closeOrdersModal() {
  document.getElementById("userOrdersModal").classList.remove("active-modal");
}

export function openBookingsModal() {
  document.getElementById("userBookingsModal").classList.add("active-modal");
  loadUserPanelData();
}

export function closeBookingsModal() {
  document.getElementById("userBookingsModal").classList.remove("active-modal");
}

export function toggleOrderDetailsView(orderId) {
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

export function toggleBookingDetailsView(bookingId) {
  const panel = document.getElementById(`booking-details-${bookingId}`);
  const arrow = document.getElementById(`booking-arrow-${bookingId}`);
  if (!panel) return;
  if (panel.style.display === "none" || panel.style.display === "") {
    panel.style.display = "block";
    if (arrow) arrow.textContent = "▲";
  } else {
    panel.style.display = "none";
    if (arrow) arrow.textContent = "▼";
  }
}

function getOrderProductImage(orderProductsText) {
  const text = (orderProductsText || "").toLowerCase();
  if (text.includes("khakhra")) return "mushroom/methikhakhra2.png"; 
  if (text.includes("papad")) return "mushroom/adadpapad2.png";   
  if (text.includes("dry") || text.includes("dried")) return "mushroom/oyst dry.webp";
  if (text.includes("powder")) return "mushroom/oyster powder.png";
  if (text.includes("green") || text.includes("fresh")) return "mushroom/Screenshot 2025-10-24 154001.png";
  return "mushroom/g mushroom.png";
}

export function loadUserPanelData() {
  if (!currentUser) return;
  const oList = document.getElementById("userOrdersList");
  const bList = document.getElementById("userBookingsList");
  
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
      const paymentDateStr = o.paymentDate || orderPlacedDate;
      const courier = o.courierName || "Ekart Logistics";
      const awb = o.trackingNumber || ("FMPC" + Math.floor(1000000000 + Math.random() * 9000000000));
      const loc = o.currentLocation || "Farm Facility";
      const arrivalDeliveryDate = o.deliveryDays || "2-4 Business Days";
      const exactDeliveredDate = o.deliveredDate || orderPlacedDate;
      const exactCancelledDate = o.cancelledDate || orderPlacedDate;
      const refundCompletedDate = o.refundCreditedDate || orderPlacedDate;
      const prodImg = getOrderProductImage(o.products);

      const stageMap = { 'Placed': 1, 'Packed': 2, 'Shipped': 3, 'OutForDelivery': 4, 'Delivered': 5 };
      const curLevel = stageMap[stage] || (isDelivered ? 5 : (isApproved ? 2 : 1));

      let statusDotColor = "#16a34a";
      let statusText = "Delivered on " + (isDelivered ? exactDeliveredDate : arrivalDeliveryDate);
      let subtitleText = `Delivered via ${courier} | Current Location: ${loc}`;

      if (isPending) {
        statusDotColor = "#eab308";
        statusText = "Verification Pending";
        subtitleText = `Payment made on ${paymentDateStr} - Reviewing`;
      } else if (isCancelled) {
        if (o.refundStage === 'Refund Credited') {
          statusDotColor = "#16a34a";
          statusText = "Refund Completed " + refundCompletedDate;
          subtitleText = `Cancelled on ${exactCancelledDate} | Refund credited to UPI`;
        } else {
          statusDotColor = "#ea580c";
          statusText = "Cancelled on " + exactCancelledDate;
          subtitleText = `Live Status: Cancelled | ${o.refundStage || 'Refund Initiated'}`;
        }
      } else if (isRejected) {
        statusDotColor = "#ef4444";
        statusText = "Order Rejected";
        subtitleText = "Payment Not Verified / Invalid UTR";
      } else {
        if (stage === 'Placed') { statusText = "Order Placed " + orderPlacedDate; subtitleText = `Payment Date: ${paymentDateStr} | Status: Order Placed at Farm Desk`; }
        else if (stage === 'Packed') { statusText = "Seller Packed & Ready"; subtitleText = `Dispatched with ${courier} | 📍 Location: ${loc}`; }
        else if (stage === 'Shipped') { statusText = "Shipped via " + courier; subtitleText = `AWB: ${awb} | 📍 Live Location: ${loc}`; }
        else if (stage === 'OutForDelivery') { statusText = "Out For Delivery"; subtitleText = `Arriving Today via ${courier} | 📍 Location: ${loc}`; }
        else if (stage === 'Delivered') { statusText = "Delivered on " + exactDeliveredDate; subtitleText = `Delivered safely to doorstep via ${courier}`; }
      }

      return `
        <div style="border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 14px; background:#fff; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.04);">
          <div onclick="toggleOrderDetailsView('${o.orderId}')" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; cursor: pointer; gap: 10px; background: #ffffff; overflow-x: auto;">
            <div style="display: flex; align-items: center; gap: 12px; min-width: 180px; flex: 1;">
              <img src="${prodImg}" alt="Product Photo" style="width: 58px; height: 58px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0; flex-shrink: 0; background:#f8fafc;">
              <div>
                <strong style="font-size: 13.5px; color: #1e293b; display: block; line-height: 1.3;">${o.products}</strong>
                <span style="font-size: 11.5px; color: #64748b; margin-top: 2px; display: block;">
                  Ref: ${o.orderId} | Paid Date: <strong>${paymentDateStr}</strong><br>Total: <strong style="color: #0f172a;">₹${o.total}</strong>
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
              <div><strong>💳 Payment Date & Time:</strong> <span style="color:#16a34a; font-weight:bold;">${paymentDateStr}</span></div>
              <div><strong>Shipping Address:</strong> <span style="color:#475569;">${o.address || 'N/A'}</span></div>
              <div><strong>Contact Number:</strong> <span style="color:#475569;">${o.phone || 'N/A'}</span></div>
              <div style="margin-top:4px;"><strong>Payment Mode:</strong> <span class="badge" style="background:#eef2ff; color:#3730a3;">${o.paymentMode || 'UPI'}</span> | <strong>Txn ID:</strong> <code>${o.txnId || 'N/A'}</code> | <strong>Your UPI:</strong> <code style="color:var(--accent); font-weight:bold;">${o.userUpiId || 'N/A'}</code></div>
            </div>
          </div>
        </div>
      `;
    }).join("") : "No active orders mapped for this profile.";
  }

  if (bList) {
    bList.innerHTML = myBookings.length ? myBookings.map(b => {
      const isConfirmed = b.status === 'Confirmed' || b.status === 'Approved';
      const isRejectedBooking = b.status && b.status.startsWith('Rejected');
      let statusColor = isConfirmed ? 'var(--accent)' : (isRejectedBooking ? 'var(--danger)' : 'var(--warn)');
      let statusText = isConfirmed ? 'Booking Confirmed' : (b.status || 'Pending Verification');
      
      const certActionSection = b.certIssued ? `
        <div style="margin-top: 10px; background: #f0fdf4; padding: 10px; border-radius: 8px; border: 1px solid #bbf7d0; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="color: var(--accent); font-weight: bold; font-size: 13px;">📜 Certificate Approved & Ready!</span><br>
            <small class="muted">Aapka training certificate approve ho gaya hai.</small>
          </div>
          <button type="button" class="btn" style="padding: 6px 14px; font-size: 12px; min-height: 32px; background: var(--accent);" onclick="downloadCertificatePDF('${b.bookingId}')">📥 Download PDF</button>
        </div>
      ` : (isConfirmed ? `<div style="margin-top:6px; color:#d97706; font-size:12px;">⏳ Step 1: Booking Confirmed. Certificate training ke baad approve hoga.</div>` : '');
      
      return `
        <div style="border: 1px solid #cbd5e1; border-radius: 10px; margin-bottom: 12px; background:#fff; overflow:hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
          <div onclick="toggleBookingDetailsView('${b.bookingId}')" style="padding: 12px 14px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; background: #fff;">
            <div>
              <strong>${b.type || 'Program'} Training Booking</strong><br>
              <small class="muted">Ref ID: ${b.bookingId} | Date: ${b.dateLogged || ''}</small>
            </div>
            <div style="text-align: right;">
              <span style="color:${statusColor}; font-weight:bold; font-size:12.5px;">${statusText}</span>
              <span id="booking-arrow-${b.bookingId}" style="font-size: 11px; color: #94a3b8; margin-left: 6px;">▼</span>
            </div>
          </div>
          <div id="booking-details-${b.bookingId}" style="display: none; padding: 14px; background: #f8fafc; border-top: 1px solid #f1f5f9; font-size: 13px; line-height: 1.6;">
            <div><strong>📌 Booking Type:</strong> <span style="font-weight:bold; color:var(--accent);">${b.type} Program</span></div>
            <div><strong>💰 Fee Paid:</strong> <span style="color:#16a34a; font-weight:bold;">Rs ${b.fee || 0}</span></div>
            ${certActionSection}
          </div>
        </div>
      `;
    }).join("") : "No course training applications logged.";
  }
}

export async function loadUserPanelDataFromCloud() {
  if (!currentUser || currentUser.isAdmin) return;

  try {
    const { data: cloudOrders } = await _supabase
      .from('pgf_orders')
      .select('*')
      .eq('email', currentUser.email);

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
      orderRegistry.push(...mappedOrders.filter(co => !orderRegistry.some(eo => eo.orderId === co.orderId)));
    }
    loadUserPanelData();
  } catch (err) {
    loadUserPanelData();
  }
}

export function toggleProfileDropdown() {
  const panel = document.getElementById("userProfileDropdownPanel");
  if (!panel) return;
  panel.style.display = panel.style.display === "block" ? "none" : "block";
}

export function openEditProfileModal() {
  document.getElementById("userProfileDropdownPanel").style.display = "none";
  if (!currentUser) return;
  document.getElementById("editProfileName").value = currentUser.name || "";
  document.getElementById("editProfilePhone").value = currentUser.phone || "";
  document.getElementById("editProfileEmail").value = currentUser.email || "";
  document.getElementById("editProfileModal").classList.add("active-modal");
}

export function closeEditProfileModal() {
  document.getElementById("editProfileModal").classList.remove("active-modal");
}

export function openChangePasswordModal() {
  document.getElementById("userProfileDropdownPanel").style.display = "none";
  document.getElementById("changePasswordModal").classList.add("active-modal");
}

export function closeChangePasswordModal() {
  document.getElementById("changePasswordModal").classList.remove("active-modal");
}

export async function handleUpdateProfile(e) {
  e.preventDefault();
  if (!currentUser) return;

  const newName = document.getElementById("editProfileName").value.trim();
  const newPhone = document.getElementById("editProfilePhone").value.trim();

  const { error } = await _supabase
    .from('pgf_users')
    .update({ name: newName, phone: newPhone })
    .eq('email', currentUser.email);

  if (error) {
    alert("❌ Profile update karne me error aayi: " + error.message);
    return;
  }

  currentUser.name = newName;
  currentUser.phone = newPhone;
  localStorage.setItem('pgf_session', JSON.stringify(currentUser));

  closeEditProfileModal();
  checkUserSession();
  alert("✅ Profile successfully updated and synced to Supabase cloud!");
}

export async function handleUpdatePassword(e) {
  e.preventDefault();
  if (!currentUser) return;

  const currentPass = document.getElementById("currentPasswordInput").value;
  const newPass = document.getElementById("newPasswordInput").value;

  if (!isPasswordStrong(newPass)) {
    alert("⚠️ Kripya Strong Password dalein!\n(8+ chars, 1 Uppercase, 1 Number, 1 Special character)");
    return;
  }

  const { data: dbUser, error: fetchErr } = await _supabase
    .from('pgf_users')
    .select('password')
    .eq('email', currentUser.email)
    .single();

  if (fetchErr || !dbUser || dbUser.password !== currentPass) {
    alert("❌ Current password galat hai!");
    return;
  }

  const { error: updateErr } = await _supabase
    .from('pgf_users')
    .update({ password: newPass })
    .eq('email', currentUser.email);

  if (updateErr) {
    alert("❌ Password update karne me error aayi: " + updateErr.message);
    return;
  }

  closeChangePasswordModal();
  document.getElementById("changePasswordModal").querySelector("form").reset();
  alert("✅ Password successfully updated in Supabase cloud!");
}

export function switchToOtpPasswordMode() {
  document.getElementById("passwordChangeStandardForm").style.display = "none";
  document.getElementById("passwordChangeOtpForm").style.display = "grid";
}

export function switchToStandardPasswordMode() {
  document.getElementById("passwordChangeOtpForm").style.display = "none";
  document.getElementById("passwordChangeStandardForm").style.display = "grid";
}

let profileResetOtpCode = "";

export async function sendProfileResetOtp() {
  if (!currentUser) return;
  profileResetOtpCode = Math.floor(100000 + Math.random() * 900000).toString();

  const { error: dbErr } = await _supabase
    .from('pgf_users')
    .update({ forgot_otp: profileResetOtpCode })
    .eq('email', currentUser.email);

  if (dbErr) {
    alert("Database error: " + dbErr.message);
    return;
  }

  const templateParams = {
    to_email: currentUser.email,
    to_name: currentUser.name,
    otp_code: profileResetOtpCode
  };

  emailjs.send('service_jk9zdkf', 'template_zihxosq', templateParams)
    .then(function(response) {
       alert(`✅ 6-digit OTP has been sent to your email (${currentUser.email})!`);
       document.getElementById("sendProfileOtpBtn").style.display = "none";
       document.getElementById("otpVerifySectionBlock").style.display = "grid";
    }, function(error) {
       alert("❌ Failed to send email: " + JSON.stringify(error));
    });
}

export async function handleVerifyOtpAndChangePassword(e) {
  e.preventDefault();
  const enteredOtp = document.getElementById("profileOtpInputCode").value.trim();
  const newPass = document.getElementById("newOtpPasswordInput").value;

  if (!isPasswordStrong(newPass)) {
    alert("⚠️ Please enter a strong password!");
    return;
  }

  const { data: dbUser, error } = await _supabase
    .from('pgf_users')
    .select('*')
    .eq('email', currentUser.email)
    .single();

  if (error || !dbUser || dbUser.forgot_otp !== enteredOtp) {
    alert("❌ Invalid OTP!");
    return;
  }

  await _supabase
    .from('pgf_users')
    .update({ password: newPass, forgot_otp: null })
    .eq('email', currentUser.email);

  closeChangePasswordModal();
  switchToStandardPasswordMode();
  alert("✅ Password successfully reset & updated in Supabase cloud!");
}