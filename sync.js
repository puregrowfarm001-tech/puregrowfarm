import { _supabase } from './config.js';
import { setOrderRegistry, setBookingsRegistry, setNotificationsRegistry } from './state.js';
import { renderNotificationBadge } from './notifications.js';

async function backgroundDataSync() {
  if (!_supabase) return;

  try {
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

    const localNotifs = JSON.parse(localStorage.getItem('pgf_notifications')) || [];
    if (Array.isArray(localNotifs)) {
      setNotificationsRegistry(localNotifs);
    }

    if (typeof window.loadUserPanelData === 'function') {
      window.loadUserPanelData();
    }
    renderNotificationBadge();
  } catch (err) {
    console.log("Background sync pause/error:", err);
  }
}

setInterval(backgroundDataSync, 10000);