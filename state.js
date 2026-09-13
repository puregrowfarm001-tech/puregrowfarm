import { BASE_PRODUCTS } from './config.js';

export function getCleanData(key) {
  try {
    const raw = JSON.parse(localStorage.getItem(key)) || [];
    if (!Array.isArray(raw)) return [];
    return raw.filter(item => item && (item.name || item.orderId || item.bookingId || item.saleId || item.expId || item.dryId || item.purId || item.id));
  } catch (e) {
    return [];
  }
}

export let products = JSON.parse(localStorage.getItem('pgf_live_products')) || BASE_PRODUCTS;
export const cart = new Map();

export let usersDatabase = getCleanData('pgf_user_db');
export let orderRegistry = getCleanData('pgf_orders');
export let bookingsRegistry = getCleanData('pgf_bookings');
export let expensesRegistry = getCleanData('pgf_expenses');
export let salesRegistry = getCleanData('pgf_sales');
export let purchasesRegistry = getCleanData('pgf_purchases');
export let dailyDryStockRegistry = getCleanData('pgf_daily_dry_stock');
export let notificationsRegistry = getCleanData('pgf_notifications');

export let currentUser = JSON.parse(localStorage.getItem('pgf_session')) || null;

export function setProducts(newProducts) {
  products = newProducts;
}
export function setUsersDatabase(val) { usersDatabase = val; }
export function setOrderRegistry(val) { orderRegistry = val; }
export function setBookingsRegistry(val) { bookingsRegistry = val; }
export function setExpensesRegistry(val) { expensesRegistry = val; }
export function setSalesRegistry(val) { salesRegistry = val; }
export function setPurchasesRegistry(val) { purchasesRegistry = val; }
export function setDailyDryStockRegistry(val) { dailyDryStockRegistry = val; }
export function setNotificationsRegistry(val) { notificationsRegistry = val; }
export function setCurrentUser(val) { currentUser = val; }