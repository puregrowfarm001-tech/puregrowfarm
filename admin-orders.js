import { _supabase } from './config.js';
import { orderRegistry } from './state.js';
import { pushNotification } from './notifications.js';
import { computeFinancialLedgerStatements } from './accounting.js';
import { getTodayIsoString } from './utils.js';

export async function openOrderActionsMenu(idx) {
  const o = orderRegistry[idx];
  const choice = prompt(
    `👉 Select an action for Order #${o.orderId} (${o.name}):\n\n` +
    `1. Approve Order\n2. Reject Order\n3. Cancel & Refund\n4. Edit Details\n\nEnter option number (1, 2, 3 or 4):`,
    "1"
  );
  if (!choice) return;
  if (choice.trim() === "1") await handleOrderApprove(idx);
  else if (choice.trim() === "2") await handleOrderReject(idx);
  else if (choice.trim() === "3") await handleOrderCancelRefund(idx);
  else if (choice.trim() === "4") adminEditOrderDetails(idx);
}

export async function updateOrderCourierDirect(idx, newCourier) {
  if (!newCourier) return;
  orderRegistry[idx].courierName = newCourier.trim();
  localStorage.setItem('pgf_orders', JSON.stringify(orderRegistry));
  await _supabase.from('pgf_orders').update({ courier_name: orderRegistry[idx].courierName }).eq('order_id', orderRegistry[idx].orderId);
  pushNotification(orderRegistry[idx].email, '🚚 Courier Updated', `Your Order #${orderRegistry[idx].orderId} courier: ${newCourier}.`, 'order');
}

export async function updateOrderLocationDirect(idx, newLocation) {
  if (!newLocation) return;
  orderRegistry[idx].currentLocation = newLocation.trim();
  localStorage.setItem('pgf_orders', JSON.stringify(orderRegistry));
  await _supabase.from('pgf_orders').update({ current_location: orderRegistry[idx].currentLocation }).eq('order_id', orderRegistry[idx].orderId);
  pushNotification(orderRegistry[idx].email, '📍 Location Update', `Your Order #${orderRegistry[idx].orderId} location: ${newLocation}.`, 'order');
}

export async function updateExpectedDeliveryDate(idx, newDate) {
  if (!newDate) return;
  orderRegistry[idx].deliveryDays = newDate.trim();
  localStorage.setItem('pgf_orders', JSON.stringify(orderRegistry));
  await _supabase.from('pgf_orders').update({ delivery_days: orderRegistry[idx].deliveryDays }).eq('order_id', orderRegistry[idx].orderId);
  pushNotification(orderRegistry[idx].email, '🚚 Delivery Scheduled', `Arriving on: ${newDate}.`, 'order');
}

export async function updateOrderRefundDate(idx, newDate) {
  if (!newDate) return;
  orderRegistry[idx].refundCreditedDate = newDate.trim();
  localStorage.setItem('pgf_orders', JSON.stringify(orderRegistry));
  await _supabase.from('pgf_orders').update({ refund_credited_date: orderRegistry[idx].refundCreditedDate }).eq('order_id', orderRegistry[idx].orderId);
}

export function adminEditOrderDetails(idx) {
  const o = orderRegistry[idx];
  const newPhone = prompt("Phone Number:", o.phone || "");
  if (newPhone) o.phone = newPhone.trim();
  const newAddress = prompt("Address:", o.address || "");
  if (newAddress) o.address = newAddress.trim();
  localStorage.setItem('pgf_orders', JSON.stringify(orderRegistry));
  alert("✅ Order details updated!");
}

export async function handleOrderApprove(idx) {
  const o = orderRegistry[idx];
  o.status = "Approved";
  o.trackingStage = "Packed";
  await _supabase.from('pgf_orders').update({ status: o.status, tracking_stage: o.trackingStage }).eq('order_id', o.orderId);
  pushNotification(o.email, '📦 Order Approved!', `Your Order #${o.orderId} is confirmed and packed.`, 'order');
  if (typeof window.populateAdminDashboardTables === 'function') window.populateAdminDashboardTables();
  computeFinancialLedgerStatements();
}

export async function handleOrderReject(idx) {
  const o = orderRegistry[idx];
  o.status = "Rejected (Reason: Invalid UTR)";
  await _supabase.from('pgf_orders').update({ status: o.status }).eq('order_id', o.orderId);
  pushNotification(o.email, '❌ Order Rejected', `Your Order #${o.orderId} was rejected.`, 'order');
  if (typeof window.populateAdminDashboardTables === 'function') window.populateAdminDashboardTables();
  computeFinancialLedgerStatements();
}

export async function handleOrderCancelRefund(idx) {
  const o = orderRegistry[idx];
  o.status = "Cancelled";
  o.refundStage = "Refund Initiated";
  await _supabase.from('pgf_orders').update({ status: o.status, refund_stage: o.refundStage }).eq('order_id', o.orderId);
  pushNotification(o.email, '⚠️ Order Cancelled', `Refund initiated for Order #${o.orderId}.`, 'order');
  if (typeof window.populateAdminDashboardTables === 'function') window.populateAdminDashboardTables();
  computeFinancialLedgerStatements();
}

export async function setOrderStageDirect(idx, newStage) {
  const o = orderRegistry[idx];
  o.trackingStage = newStage;
  if (newStage === 'Delivered') o.status = 'Delivered';
  await _supabase.from('pgf_orders').update({ tracking_stage: newStage, status: o.status }).eq('order_id', o.orderId);
  if (typeof window.populateAdminDashboardTables === 'function') window.populateAdminDashboardTables();
}

export async function setRefundStageDirect(idx, newRefStage) {
  const o = orderRegistry[idx];
  o.refundStage = newRefStage;
  o.refundCreditedDate = getTodayIsoString();
  await _supabase.from('pgf_orders').update({ refund_stage: newRefStage, refund_credited_date: o.refundCreditedDate }).eq('order_id', o.orderId);
  if (typeof window.populateAdminDashboardTables === 'function') window.populateAdminDashboardTables();
}