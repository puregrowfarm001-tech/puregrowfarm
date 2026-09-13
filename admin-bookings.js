import { _supabase } from './config.js';
import { bookingsRegistry } from './state.js';
import { pushNotification } from './notifications.js';
import { computeFinancialLedgerStatements } from './accounting.js';
import { getTodayIsoString } from './utils.js';

export async function confirmBookingSlot(idx) {
  const target = bookingsRegistry[idx];
  const todayDate = getTodayIsoString();
  target.status = "Confirmed";
  target.approvedDate = todayDate;
  target.certIssued = false;
  
  await _supabase.from('pgf_bookings').update({ status: "Confirmed", approved_date: todayDate, cert_issued: false }).eq('booking_id', target.bookingId);
  pushNotification(target.email, '🎓 Farm Booking Confirmed!', `Your booking #${target.bookingId} is confirmed.`, 'booking');
  if (typeof window.populateAdminDashboardTables === 'function') window.populateAdminDashboardTables();
  computeFinancialLedgerStatements();
}

export async function rejectTrainingBooking(idx) {
  const target = bookingsRegistry[idx];
  target.status = "Rejected";
  target.certIssued = false;
  
  await _supabase.from('pgf_bookings').update({ status: "Rejected", cert_issued: false }).eq('booking_id', target.bookingId);
  pushNotification(target.email, '❌ Farm Booking Rejected', `Your booking #${target.bookingId} was rejected.`, 'booking');
  if (typeof window.populateAdminDashboardTables === 'function') window.populateAdminDashboardTables();
  computeFinancialLedgerStatements();
}

export async function issueUserCertificate(idx) {
  const target = bookingsRegistry[idx];
  const todayDate = getTodayIsoString();
  target.certIssued = true;
  target.certIssueDate = todayDate;
  
  await _supabase.from('pgf_bookings').update({ cert_issued: true, cert_issue_date: todayDate }).eq('booking_id', target.bookingId);
  pushNotification(target.email, '📜 Certificate Issued & Ready!', `Your certificate for booking #${target.bookingId} is ready.`, 'certificate');
  if (typeof window.populateAdminDashboardTables === 'function') window.populateAdminDashboardTables();
}

export function adminEditCertificateData(idx) {
  const b = bookingsRegistry[idx];
  const newName = prompt("Candidate Name:", b.name);
  if (newName) b.name = newName.trim();
  localStorage.setItem('pgf_bookings', JSON.stringify(bookingsRegistry));
  if (typeof window.populateAdminDashboardTables === 'function') window.populateAdminDashboardTables();
  alert("✅ Certificate records updated!");
}