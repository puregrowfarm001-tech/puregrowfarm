import { renderProducts } from './products.js';
import { checkUserSession } from './auth.js';
import './sync.js';

document.addEventListener("DOMContentLoaded", function() {
  renderProducts();
  checkUserSession();

  const searchInput = document.getElementById("productSearch");
  if (searchInput) {
    searchInput.addEventListener("input", function(e) {
      const query = e.target.value.toLowerCase().trim();
      if (!query) {
        renderProducts();
        return;
      }
      // Product filtering handled in products.js or globally
    });
  }
});

// Expose required functions globally for inline HTML onclick handlers
import { handleLogin, handleRegister, handleLogout, switchAuthBox, handleSendOtp, handleVerifyAndReset } from './auth.js';
import { openOrdersModal, closeOrdersModal, openBookingsModal, closeBookingsModal, openEditProfileModal, closeEditProfileModal, openChangePasswordModal, closeChangePasswordModal, handleUpdateProfile, handleUpdatePassword, switchToOtpPasswordMode, switchToStandardPasswordMode, sendProfileResetOtp, handleVerifyOtpAndChangePassword, toggleProfileDropdown } from './user-dashboard.js';
import { addToCart, minusCart, confirmOrder, openProductPayment, validateOrderForm } from './cart.js';
import { showVisitForm, openVisitPayment, validateStudentForm, validateFarmerForm, submitStudentVisit, submitFarmerVisit } from './booking.js';
import { toggleNotificationDropdown, clearAllNotifications, handleNotificationClick } from './notifications.js';
import { triggerAdminView, exitAdminPanel, switchErpTab, switchSubAccountingTab, switchExpCategoryTab, handleAdminYearFilterChange, printActiveAdminReport, filterAdminOrdersTable, filterAdminBookingsTable, filterAdminUsersTable, filterSubTable, openAdminFilterModal } from './admin.js';
import { closeInvoice, printDivInvoice, downloadOfflineSaleInvoice } from './invoice.js';
import { downloadCertificatePDF } from './certificate.js';
import { saveDailyDryStockEntry, deleteDailyDryEntry } from './production.js';
import { saveAdminExpense, adminEditExpense, adminDeleteExpense } from './expenses.js';
import { saveAdminSale, adminEditSale, adminDeleteSale } from './sales.js';
import { saveAdminPurchase, adminEditPurchase, adminDeletePurchase } from './purchases.js';
import { saveAdminDamage, adminEditDamage, adminDeleteDamage } from './expenses.js';
import { copyToClipboard, closeModalOutside, togglePasswordVisibility, checkPasswordStrength } from './utils.js';
import { updateOrderCourierDirect, updateOrderLocationDirect, updateExpectedDeliveryDate, updateOrderRefundDate, adminEditOrderDetails, setOrderStageDirect, setRefundStageDirect } from './admin-orders.js';
import { confirmBookingSlot, rejectTrainingBooking, issueUserCertificate, adminEditCertificateData } from './admin-bookings.js';
import { deleteUserAccount } from './admin-users.js';

window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleLogout = handleLogout;
window.switchAuthBox = switchAuthBox;
window.handleSendOtp = handleSendOtp;
window.handleVerifyAndReset = handleVerifyAndReset;

window.openOrdersModal = openOrdersModal;
window.closeOrdersModal = closeOrdersModal;
window.openBookingsModal = openBookingsModal;
window.closeBookingsModal = closeBookingsModal;
window.openEditProfileModal = openEditProfileModal;
window.closeEditProfileModal = closeEditProfileModal;
window.openChangePasswordModal = openChangePasswordModal;
window.closeChangePasswordModal = closeChangePasswordModal;
window.handleUpdateProfile = handleUpdateProfile;
window.handleUpdatePassword = handleUpdatePassword;
window.switchToOtpPasswordMode = switchToOtpPasswordMode;
window.switchToStandardPasswordMode = switchToStandardPasswordMode;
window.sendProfileResetOtp = sendProfileResetOtp;
window.handleVerifyOtpAndChangePassword = handleVerifyOtpAndChangePassword;
window.toggleProfileDropdown = toggleProfileDropdown;

window.addToCart = addToCart;
window.minusCart = minusCart;
window.confirmOrder = confirmOrder;
window.openProductPayment = openProductPayment;
window.validateOrderForm = validateOrderForm;

window.showVisitForm = showVisitForm;
window.openVisitPayment = openVisitPayment;
window.validateStudentForm = validateStudentForm;
window.validateFarmerForm = validateFarmerForm;
window.submitStudentVisit = submitStudentVisit;
window.submitFarmerVisit = submitFarmerVisit;

window.toggleNotificationDropdown = toggleNotificationDropdown;
window.clearAllNotifications = clearAllNotifications;
window.handleNotificationClick = handleNotificationClick;

window.triggerAdminView = triggerAdminView;
window.exitAdminPanel = exitAdminPanel;
window.switchErpTab = switchErpTab;
window.switchSubAccountingTab = switchSubAccountingTab;
window.switchExpCategoryTab = switchExpCategoryTab;
window.handleAdminYearFilterChange = handleAdminYearFilterChange;
window.printActiveAdminReport = printActiveAdminReport;
window.filterAdminOrdersTable = filterAdminOrdersTable;
window.filterAdminBookingsTable = filterAdminBookingsTable;
window.filterAdminUsersTable = filterAdminUsersTable;
window.filterSubTable = filterSubTable;
window.openAdminFilterModal = openAdminFilterModal;

window.closeInvoice = closeInvoice;
window.printDivInvoice = printDivInvoice;
window.downloadOfflineSaleInvoice = downloadOfflineSaleInvoice;
window.downloadCertificatePDF = downloadCertificatePDF;

window.saveDailyDryStockEntry = saveDailyDryStockEntry;
window.deleteDailyDryEntry = deleteDailyDryEntry;
window.saveAdminExpense = saveAdminExpense;
window.adminEditExpense = adminEditExpense;
window.adminDeleteExpense = adminDeleteExpense;
window.saveAdminSale = saveAdminSale;
window.adminEditSale = adminEditSale;
window.adminDeleteSale = adminDeleteSale;
window.saveAdminPurchase = saveAdminPurchase;
window.adminEditPurchase = adminEditPurchase;
window.adminDeletePurchase = adminDeletePurchase;
window.saveAdminDamage = saveAdminDamage;
window.adminEditDamage = adminEditDamage;
window.adminDeleteDamage = adminDeleteDamage;

window.copyToClipboard = copyToClipboard;
window.closeModalOutside = closeModalOutside;
window.togglePasswordVisibility = togglePasswordVisibility;
window.checkPasswordStrength = checkPasswordStrength;

window.updateOrderCourierDirect = updateOrderCourierDirect;
window.updateOrderLocationDirect = updateOrderLocationDirect;
window.updateExpectedDeliveryDate = updateExpectedDeliveryDate;
window.updateOrderRefundDate = updateOrderRefundDate;
window.adminEditOrderDetails = adminEditOrderDetails;
window.setOrderStageDirect = setOrderStageDirect;
window.setRefundStageDirect = setRefundStageDirect;

window.confirmBookingSlot = confirmBookingSlot;
window.rejectTrainingBooking = rejectTrainingBooking;
window.issueUserCertificate = issueUserCertificate;
window.adminEditCertificateData = adminEditCertificateData;
window.deleteUserAccount = deleteUserAccount;