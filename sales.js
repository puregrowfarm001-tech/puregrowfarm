import { _supabase } from './config.js';
import { salesRegistry } from './state.js';
import { getTodayIsoString, initDefaultDatePickers } from './utils.js';
import { computeFinancialLedgerStatements } from './accounting.js';
import { renderAdminLiveStockSummary } from './stock.js';

export async function saveAdminSale(e) {
  e.preventDefault();
  const rawDate = document.getElementById("saleLogDate").value;
  const qty = parseFloat(document.getElementById("saleQty").value);
  const rate = parseFloat(document.getElementById("saleRate").value);
  const delivery = parseFloat(document.getElementById("saleDelivery").value) || 0;
  const paid = parseFloat(document.getElementById("salePaidAmount").value) || 0;
  const notes = document.getElementById("saleNotes") ? document.getElementById("saleNotes").value.trim() : "";
  const prodType = document.getElementById("saleProduct").value;

  const subtotal = qty * rate;
  const grandTotal = subtotal + delivery;

  const dbData = {
    sale_id: "SALE-" + Date.now().toString().slice(-4),
    date: rawDate ? new Date(rawDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
    product: prodType,
    collector: "Farm",
    buyer: document.getElementById("saleBuyer").value.trim(),
    phone: document.getElementById("salePhone").value.trim(),
    address: document.getElementById("saleAddress").value.trim(),
    qty: qty,
    rate: rate,
    subtotal: subtotal,
    delivery: delivery,
    total: grandTotal,
    paid_amount: paid,
    notes: notes
  };

  const { error } = await _supabase.from('pgf_sales').insert([dbData]);
  if (error) { alert("Cloud Error: " + error.message); return; }

  salesRegistry.push({
    saleId: dbData.sale_id, date: dbData.date, product: dbData.product, collector: dbData.collector, buyer: dbData.buyer, phone: dbData.phone, address: dbData.address, qty: dbData.qty, rate: dbData.rate, subtotal: dbData.subtotal, delivery: dbData.delivery, total: dbData.total, paidAmount: dbData.paid_amount, notes: dbData.notes
  });
  localStorage.setItem('pgf_sales', JSON.stringify(salesRegistry));

  e.target.reset();
  if (document.getElementById("saleDelivery")) document.getElementById("saleDelivery").value = "0";
  initDefaultDatePickers();
  computeFinancialLedgerStatements();
  renderAdminLiveStockSummary();
  alert(`✅ Data cloud me save ho gaya hai! Wholesale Sale Total: Rs ${grandTotal}`);
}

export async function adminEditSale(idx) {
  const s = salesRegistry[idx];
  if (!s) return;
  
  const newDate = prompt("1. Sale Date:", s.date || getTodayIsoString());
  if (newDate === null) return;
  const newBuyer = prompt("2. Buyer Name:", s.buyer || "");
  if (newBuyer === null) return;
  const newQty = prompt("3. Qty:", s.qty);
  if (newQty === null || isNaN(parseFloat(newQty))) return;
  const newRate = prompt("4. Price per unit (Rate):", s.rate);
  if (newRate === null || isNaN(parseFloat(newRate))) return;
  const newDel = prompt("5. Delivery Charge (Rs):", s.delivery || 0);
  if (newDel === null) return;

  const sub = parseFloat(newQty) * parseFloat(newRate);
  const total = sub + parseFloat(newDel || 0);
  const newPaid = prompt(`6. Received Payment Amount (Total Rs ${total}):`, s.paidAmount !== undefined ? s.paidAmount : total);
  if (newPaid === null || isNaN(parseFloat(newPaid))) return;

  const { error } = await _supabase.from('pgf_sales').update({
    date: newDate.trim(), buyer: newBuyer.trim(), qty: parseFloat(newQty), rate: parseFloat(newRate), subtotal: sub, delivery: parseFloat(newDel || 0), total: total, paid_amount: parseFloat(newPaid)
  }).eq('sale_id', s.saleId);

  if (error) { alert("Database update error: " + error.message); return; }

  s.date = newDate.trim();
  s.buyer = newBuyer.trim();
  s.qty = parseFloat(newQty);
  s.rate = parseFloat(newRate);
  s.subtotal = sub;
  s.delivery = parseFloat(newDel || 0);
  s.total = total;
  s.paidAmount = parseFloat(newPaid);

  localStorage.setItem('pgf_sales', JSON.stringify(salesRegistry));
  computeFinancialLedgerStatements();
  alert("✅ Sell Entry successfully updated in cloud!");
}

export async function adminDeleteSale(idx) {
  const s = salesRegistry[idx];
  if (!s) return;
  if (confirm("Kya aap sach me ye Sell entry delete karna chahte hain?")) {
    const { error } = await _supabase.from('pgf_sales').delete().eq('sale_id', s.saleId);
    if (error) { alert("Database delete error: " + error.message); return; }
    salesRegistry.splice(idx, 1);
    localStorage.setItem('pgf_sales', JSON.stringify(salesRegistry));
    computeFinancialLedgerStatements();
    alert("✅ Sell entry successfully deleted from cloud!");
  }
}