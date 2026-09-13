import { _supabase } from './config.js';
import { dailyDryStockRegistry, products } from './state.js';
import { getTodayIsoString, initDefaultDatePickers } from './utils.js';
import { renderProducts, saveProductsToStorage } from './products.js';
import { renderAdminLiveStockSummary } from './stock.js';

export async function saveDailyDryStockEntry(e) {
  e.preventDefault();
  const rawDate = document.getElementById("dryLogDate").value;
  const qty = parseFloat(document.getElementById("dryLogQty").value);
  const notes = document.getElementById("dryLogNotes").value.trim();

  if (isNaN(qty) || qty <= 0) {
    alert("Kripya valid dry weight dalein!");
    return;
  }

  const dryEntry = {
    dry_id: "DRY-" + Date.now().toString().slice(-4),
    date: rawDate ? new Date(rawDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
    raw_iso_date: rawDate || getTodayIsoString(),
    qty: qty,
    notes: notes || "Daily Farm Drying Batch"
  };

  const { error } = await _supabase.from('pgf_daily_dry_stock').insert([dryEntry]);
  if (error) { alert("Cloud Error: " + error.message); return; }

  dailyDryStockRegistry.unshift({
    dryId: dryEntry.dry_id, date: dryEntry.date, rawIsoDate: dryEntry.raw_iso_date, qty: dryEntry.qty, notes: dryEntry.notes
  });
  localStorage.setItem('pgf_daily_dry_stock', JSON.stringify(dailyDryStockRegistry));

  const dryProd = products.find(p => p.type === "dry");
  if (dryProd) {
    dryProd.stock = (dryProd.stock || 0) + qty;
    saveProductsToStorage();
    renderProducts();
  }

  e.target.reset();
  initDefaultDatePickers();
  renderDailyDryStockTable();
  renderAdminLiveStockSummary();
  alert(`✅ ${qty} kg Daily Dry Mushroom Stock successfully saved to Cloud!`);
}

export async function deleteDailyDryEntry(idx) {
  const item = dailyDryStockRegistry[idx];
  if (!item) return;

  if (confirm(`Delete this dry stock entry (${item.qty} kg)?`)) {
    const { error } = await _supabase.from('pgf_daily_dry_stock').delete().eq('dry_id', item.dryId);
    if (error) {
      alert("Database delete error: " + error.message);
      return;
    }

    const dryProd = products.find(p => p.type === "dry");
    if (dryProd) {
      dryProd.stock = Math.max(0, (dryProd.stock || 0) - item.qty);
      saveProductsToStorage();
      renderProducts();
    }
    
    dailyDryStockRegistry.splice(idx, 1);
    localStorage.setItem('pgf_daily_dry_stock', JSON.stringify(dailyDryStockRegistry));
    renderDailyDryStockTable();
    renderAdminLiveStockSummary();
    alert("✅ Dry stock entry successfully deleted from cloud!");
  }
}

export function renderDailyDryStockTable() {
  const tbody = document.getElementById("dailyDryStockTableBody");
  const totalDisplay = document.getElementById("dailyDryTotalSum");
  if (!tbody) return;

  const selectedYear = document.getElementById("adminYearFilterSelect")?.value || "ALL";

  const filteredData = dailyDryStockRegistry.filter(item => {
    if (selectedYear === "ALL") return true;
    const itemDate = item.rawIsoDate || item.date || "";
    return itemDate.includes(selectedYear);
  });

  const totalDryWeight = filteredData.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  if (totalDisplay) totalDisplay.textContent = `${totalDryWeight.toFixed(2)} kg`;

  if (!filteredData.length) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--muted); padding:16px;">No daily dry mushroom records found for year ${selectedYear}.</td></tr>`;
    return;
  }

  tbody.innerHTML = filteredData.map((item) => `
    <tr>
      <td>${item.date}</td>
      <td>${item.notes}</td>
      <td style="color:#a16207; font-weight:bold; font-size:14px;">${item.qty} kg</td>
      <td>
        <button type="button" class="btn" style="padding:2px 6px; min-height:auto; font-size:11px; background:var(--danger);" onclick="deleteDailyDryEntry(${dailyDryStockRegistry.indexOf(item)})">Delete</button>
      </td>
    </tr>
  `).join("");
}