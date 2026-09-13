import { orderRegistry, bookingsRegistry, usersDatabase } from './state.js';
import { farmWhatsapp } from './config.js';

export function sendAdminWhatsAppMessage(type, refIdOrIndex) {
  let targetPhone = "";
  let customerName = "";
  let messageText = "";

  if (type === 'order') {
    const o = orderRegistry[refIdOrIndex] || orderRegistry.find(item => item && item.orderId === refIdOrIndex);
    if (!o) return;
    targetPhone = o.phone;
    customerName = o.name;

    const status = o.status || "Pending Verification";
    const stage = o.trackingStage || "Placed";
    const courier = o.courierName || "Ekart Logistics";
    const loc = o.currentLocation || "Pure Grow Farm Central Hub";
    const eta = o.deliveryDays || "2-4 Business Days";
    const refundSt = o.refundStage || "Initiated";
    const refundDt = o.refundCreditedDate || new Date().toLocaleDateString('en-IN');

    if (status.startsWith('Rejected')) {
      const reason = status.replace('Rejected (Reason: ', '').replace(')', '');
      messageText = `Hello *${customerName}*,\n\n❌ *Order Rejected Update*\nAapka Order Ref (*#${o.orderId}*) reject kar diya gaya hai.\n🔍 *Reason:* ${reason}\n\nAapko koi sahayata chahiye toh sampark karein: +91 9067891039.`;
    } 
    else if (status.startsWith('Cancelled')) {
      const reason = status.replace('Cancelled (Reason: ', '').replace(')', '');
      messageText = `Hello *${customerName}*,\n\n⚠️ *Order Cancelled & Refund Update*\nAapka Order (*#${o.orderId}*) cancel ho gaya hai.\n🔍 *Reason:* ${reason}\n💰 *Refund Status:* ${refundSt} (Date: ${refundDt})\nAapke UPI ID par payment process ki ja rahi hai.`;
    } 
    else if (refundSt === 'Refund Credited') {
      messageText = `Hello *${customerName}*,\n\n💸 *Refund Successfully Credited!*\nAapke Order (*#${o.orderId}*) ka poora refund amount date *${refundDt}* ko aapke UPI ID (${o.userUpiId || 'Linked Bank'}) par safely transfer kar diya gaya hai. ✅`;
    }
    else if (stage === 'Delivered' || status === 'Delivered') {
      messageText = `Hello *${customerName}*,\n\n🎉 *Order Delivered Successfully!*\nAapka Pure Grow Farm order (*#${o.orderId}*) successfully deliver ho chuka hai via *${courier}*.\n\nUmeed hai aapko hamare organic oyster mushroom products pasand aaye honge! ⭐`;
    }
    else {
      messageText = `Hello *${customerName}*,\n\n📦 *Pure Grow Farm - Live Order Update* (*#${o.orderId}*)\n\n📍 *Current Status / Stage:* ${stage}\n🚚 *Courier Partner:* ${courier}\n📍 *Current Location:* ${loc}\n📅 *Expected Delivery Date:* ${eta}\n\nThank you for choosing Pure Grow Farm! 🌱`;
    }

  } else if (type === 'booking') {
    const b = bookingsRegistry[refIdOrIndex] || bookingsRegistry.find(item => item && item.bookingId === refIdOrIndex);
    if (!b) return;
    targetPhone = b.phone;
    customerName = b.name;

    const bStatus = b.status || "Pending Verification";
    const isCertIssued = b.certIssued === true;

    if (bStatus.startsWith('Rejected')) {
      const reason = bStatus.replace('Rejected (Reason: ', '').replace(')', '');
      messageText = `Hello *${customerName}*,\n\n❌ *Farm Booking / Certificate Rejected*\nAapka ${b.type} application (*#${b.bookingId}*) reject kar diya gaya hai.\n🔍 *Reason:* ${reason}`;
    }
    else if (isCertIssued) {
      messageText = `Hello *${customerName}*,\n\n📜 *Certificate Approved & Ready!* 🎉\nBadhai ho! Aapka *Pure Grow Farm ${b.type} Training Certificate* (*#${b.bookingId}*) approve kar liya gaya hai.\nAap apni profile me login karke PDF download kar sakte hain!`;
    }
    else if (bStatus === 'Confirmed' || bStatus === 'Approved') {
      messageText = `Hello *${customerName}*,\n\n✅ *Farm Booking Confirmed!*\nAapka ${b.type} session/internship booking (*#${b.bookingId}*) confirm kar liya gaya hai. Makhiyala farm training hub me aapka swagat hai! 🎓`;
    }
    else {
      messageText = `Hello *${customerName}*,\n\n⏳ *Farm Booking Update*\nAapka ${b.type} booking (*#${b.bookingId}*) abhi *${bStatus}* state me hai. Verification ke baad update mil jayega.`;
    }

  } else if (type === 'user') {
    const u = usersDatabase[refIdOrIndex];
    if (!u) return;
    targetPhone = u.phone;
    customerName = u.name;
    messageText = `Hello *${customerName}*,\n\nWelcome to *Pure Grow Farm* official portal! 🌱\nAapka account successfully registered ho gaya hai. Aap hamare store se Oyster mushrooms product aur training sessions access kar sakte hain.`;
  }

  if (!targetPhone) {
    alert("⚠️ Is user ka valid mobile number available nahi hai!");
    return;
  }

  let cleanPhone = targetPhone.replace(/[^0-9]/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = "91" + cleanPhone;
  }

  window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`, '_blank');
}

export function sendWhatsAppNotification(customerPhone, customerName, refId, statusType, extraDetails = {}) {
  if (!customerPhone) {
    alert("⚠️ Is user ka valid mobile number available nahi hai!");
    return;
  }

  let cleanPhone = customerPhone.replace(/[^0-9]/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = "91" + cleanPhone;
  }

  let message = "";

  if (statusType === "order_placed") {
    message = `Hello *${customerName}*,\n\nThank you for shopping with *Pure Grow Farm*! 🌱\nAapka Order Ref (*#${refId}*) successfully receive ho gaya hai aur verification process me hai.\n\nThank you for choosing Pure Grow Farm!`;
  } 
  else if (statusType === "order_approved") {
    message = `Hello *${customerName}*,\n\nGood news! 🌱 Aapka Order Ref (*#${refId}*) *Confirm & Pack* ho gaya hai.\n🚚 *Courier:* ${extraDetails.courier || 'Ekart Logistics'}\n📍 *Current Location:* ${extraDetails.location || 'Farm Hub'}\n📅 *Expected Delivery:* ${extraDetails.eta || '2-4 Days'}`;
  }
  else if (statusType === "shipped") {
    message = `Hello *${customerName}*,\n\nAapka order (*#${refId}*) *Shipped* ho gaya hai aur raste me hai 🚚.\n📦 *Courier:* ${extraDetails.courier || 'Ekart Logistics'}\n📍 *Live Location:* ${extraDetails.location || 'Transit Hub'}`;
  }
  else if (statusType === "delivered") {
    message = `Hello *${customerName}*,\n\nAapka order (*#${refId}*) successfully *Delivered* ho chuka hai! 🎉\n\nUmeed hai aapko hamare organic oyster mushroom products pasand aaye honge. Review zaroor dein!`;
  }
  else if (statusType === "cancelled") {
    message = `Hello *${customerName}*,\n\nKhed hai ki aapka order (*#${refId}*) cancel kar diya gaya hai. ⚠️\n💰 *Refund Status:* ${extraDetails.refund || 'Initiated to your UPI ID'}\n\nAgar koi sawal ho toh sampark karein: +91 9067891039.`;
  }
  else if (statusType === "certificate") {
    message = `Hello *${customerName}*,\n\nBadhai ho! 📜 Aapka *Pure Grow Farm Training Certificate* approve kar liya gaya hai.\nAap apni profile me login karke PDF download kar sakte hain!`;
  }

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank');
}