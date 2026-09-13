import { _supabase } from './config.js';
import { purchasesRegistry } from './state.js';
import { getTodayIsoString, initDefaultDatePickers } from './utils.js';
import { computeFinancialLedgerStatements } from './accounting.js';
import { renderAdminLiveStockSummary } from './stock.js';

export async function saveAdminPurchase(e) {
  e.preventDefault();
  const rawDate = document.getElementById("purLogDate").value;
  const qty = parseFloat(document.getElementById("purQty").value);
  const rate = parseFloat(document.getElementById("purRate").value);
  const delivery = parseFloat(document.getElementById("purDelivery")?.value) || 0;
  const subtotal = qty * rate;
  const grandTotal = subtotal + delivery;
  const paid = parseFloat(document.getElementById("purPaidAmount").value) || grandTotal;

  const purType = document.getElementById("purProduct").value;
  const funder = document.getElementById("purFunder").value;
  const vendor = document.getElementById("purVendor").value.trim();
  const vendorPhoneInput = document.getElementById("purVendorPhone") ? document.getElementById("purVendorPhone").value.trim() : "";
  const notes = document.getElementById("purNotes") ? document.getElementById("purNotes").value.trim() : "";

  const dbData = {
    pur_id: "PUR-" + Date.now().toString().slice(-4),
    date: rawDate ? new Date(rawDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
    product: purType,
    funder: funder,
    vendor: vendor,
    vendor_phone: vendorPhoneInput,
    qty: qty,
    rate: rate,
    delivery: delivery,
    total: grandTotal,
    paid_amount: paid,
    notes: notes
  };

  const { error } = await _supabase.from('pgf_purchases').insert([dbData]);
  if (error) { alert("Cloud Error: " + error.message); return; }

  purchasesRegistry.unshift({
    purId: dbData.pur_id, date: dbData.date, product: dbData.product, funder: dbData.funder, vendor: dbData.vendor, vendorPhone: dbData.vendor_phone, qty: dbData.qty, rate: dbData.rate, delivery: dbData.delivery, total: dbData.total, paidAmount: dbData.paid_amount, notes: dbData.notes
  });
  localStorage.setItem('pgf_purchases', JSON.stringify(purchasesRegistry));

  e.target.reset();
  if (document.getElementById("purDelivery")) document.getElementById("purDelivery").value = "0";
  initDefaultDatePickers();
  computeFinancialLedgerStatements();
  renderAdminLiveStockSummary();
  alert(`✅ Data cloud me save ho gaya hai! Purchase Total: Rs ${grandTotal}`);
}

export async function adminEditPurchase(idx) {
  const p = purchasesRegistry[idx];
  if (!p) return;
  
  const newDate = prompt("1. Purchase Date:", p.date || getTodayIsoString());
  if (newDate === null) return;
  const newVendor = prompt("2. Vendor Name:", p.vendor || "");
  if (newVendor === null) return;
  const newQty = prompt("3. Qty:", p.qty);
  if (newQty === null || isNaN(parseFloat(newQty))) return;
  const newRate = prompt("4. Rate (Rs):", p.rate);
  if (newRate === null || isNaN(parseFloat(newRate))) return;

  const deliveryAmt = Number(p.delivery || 0);
  const total = (parseFloat(newQty) * parseFloat(newRate)) + deliveryAmt;
  const newPaid = prompt(`5. Paid Amount to Vendor (Total Rs ${total}):`, p.paidAmount !== undefined ? p.paidAmount : total);
  if (newPaid === null || isNaN(parseFloat(newPaid))) return;

  const { error } = await _supabase.from('pgf_purchases').update({
    date: newDate.trim(), vendor: newVendor.trim(), qty: parseFloat(newQty), rate: parseFloat(newRate), total: total, paid_amount: parseFloat(newPaid)
  }).eq('pur_id', p.purId);

  if (error) { alert("Database update error: " + error.message); return; }

  p.date = newDate.trim();
  p.vendor = newVendor.trim();
  p.qty = parseFloat(newQty);
  p.rate = parseFloat(newRate);
  p.total = total;
  p.paidAmount = parseFloat(newPaid);

  localStorage.setItem('pgf_purchases', JSON.stringify(purchasesRegistry));
  computeFinancialLedgerStatements();
  alert("✅ Purchase record successfully updated in cloud!");
}

export async function adminDeletePurchase(idx) {
  const p = purchasesRegistry[idx];
  if (!p) return;
  if (confirm("Kya aap sach me ye Buy record delete karna chahte hain?")) {
    const { error } = await _supabase.from('pgf_purchases').delete().eq('pur_id', p.purId);
    if (error) { alert("Database delete error: " + error.message); return; }
    purchasesRegistry.splice(idx, 1);
    localStorage.setItem('pgf_purchases', JSON.stringify(purchasesRegistry));
    computeFinancialLedgerStatements();
    alert("✅ Purchase record successfully deleted from cloud!");
  }
}