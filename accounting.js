import { orderRegistry, bookingsRegistry, salesRegistry, purchasesRegistry, expensesRegistry } from './state.js';

export function computeFinancialLedgerStatements() {
  const selectedYear = document.getElementById("adminYearFilterSelect")?.value || "ALL";

  const filteredOrders = orderRegistry.filter(o => {
    if (!o || !(o.status === 'Approved' || o.status === 'Delivered')) return false;
    if (selectedYear === "ALL") return true;
    return (o.rawIsoDate || o.dateLogged || "").includes(selectedYear);
  });
  const orderTotal = filteredOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  const filteredBookings = bookingsRegistry.filter(b => {
    if (!b || !b.name || !(b.status === "Confirmed" || b.status === "Approved")) return false;
    if (selectedYear === "ALL") return true;
    return (b.date || b.dateLogged || "").includes(selectedYear);
  });
  const farmBookingTotal = filteredBookings.reduce((sum, b) => sum + Number(b.fee || 0), 0);

  const filteredSales = salesRegistry.filter(s => {
    if (!s) return false;
    if (selectedYear === "ALL") return true;
    return (s.date || "").includes(selectedYear);
  });
  const sellTotal = filteredSales.reduce((sum, s) => sum + Number(s.paidAmount !== undefined ? s.paidAmount : s.total || 0), 0);

  const filteredPurchases = purchasesRegistry.filter(p => {
    if (!p) return false;
    if (selectedYear === "ALL") return true;
    return (p.date || "").includes(selectedYear);
  });
  const buyTotal = filteredPurchases.reduce((sum, p) => sum + Number(p.paidAmount !== undefined ? p.paidAmount : p.total || 0), 0);

  const filteredExpenses = expensesRegistry.filter(e => {
    if (!e || e.category === "Damage Received") return false;
    if (selectedYear === "ALL") return true;
    return (e.date || "").includes(selectedYear);
  });
  const expenseTotal = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  let sohamBuyTotal = 0, jeetBuyTotal = 0, farmBuyTotal = 0;
  filteredPurchases.forEach(p => {
    const amt = Number(p.paidAmount !== undefined ? p.paidAmount : p.total || 0);
    if(p.funder === "Soham") sohamBuyTotal += amt;
    else if(p.funder === "Jeet") jeetBuyTotal += amt;
    else if(p.funder === "Farm") farmBuyTotal += amt;
  });

  let sohamExpOnly = 0, jeetExpOnly = 0, farmExpOnly = 0;
  filteredExpenses.forEach(e => {
    const amt = Number(e.amount || 0);
    if(e.payer === "Soham") sohamExpOnly += amt;
    else if(e.payer === "Jeet") jeetExpOnly += amt;
    else if(e.payer === "Farm") farmExpOnly += amt;
  });

  let sohamExpTotal = sohamExpOnly + sohamBuyTotal;
  let jeetExpTotal = jeetExpOnly + jeetBuyTotal;
  let farmExpTotal = farmExpOnly + farmBuyTotal;

  const filteredDamages = expensesRegistry.filter(e => {
    if (!e || e.category !== "Damage Received") return false;
    if (selectedYear === "ALL") return true;
    return (e.date || "").includes(selectedYear);
  });
  const damageTotal = filteredDamages.reduce((sum, d) => sum + Number(d.amount || 0), 0);

  let sohamDmgTotal = 0, jeetDmgTotal = 0, farmDmgTotal = 0;
  filteredDamages.forEach(d => {
    const amt = Number(d.amount || 0);
    if(d.payer === "Soham") sohamDmgTotal += amt;
    else if(d.payer === "Jeet") jeetDmgTotal += amt;
    else if(d.payer === "Farm") farmDmgTotal += amt;
  });

  let sohamNetExp = sohamExpTotal - sohamDmgTotal;
  let jeetNetExp = jeetExpTotal - jeetDmgTotal;

  const farmAvailableBalance = (orderTotal + farmBookingTotal + sellTotal + farmDmgTotal) - farmExpTotal;
  const netProfit = (orderTotal + farmBookingTotal + sellTotal) - buyTotal - expenseTotal;

  if(document.getElementById("ovOrderTotal")) document.getElementById("ovOrderTotal").textContent = "Rs " + orderTotal.toFixed(2);
  if(document.getElementById("ovFarmBookingTotal")) document.getElementById("ovFarmBookingTotal").textContent = "Rs " + farmBookingTotal.toFixed(2);
  if(document.getElementById("ovSellTotal")) document.getElementById("ovSellTotal").textContent = "Rs " + sellTotal.toFixed(2);
  
  if(document.getElementById("ovBuyTotal")) document.getElementById("ovBuyTotal").textContent = "Rs " + buyTotal.toFixed(2);
  if(document.getElementById("ovSohamBuy")) document.getElementById("ovSohamBuy").textContent = "Rs " + sohamBuyTotal.toFixed(2);
  if(document.getElementById("ovJeetBuy")) document.getElementById("ovJeetBuy").textContent = "Rs " + jeetBuyTotal.toFixed(2);
  if(document.getElementById("ovFarmBuy")) document.getElementById("ovFarmBuy").textContent = "Rs " + farmBuyTotal.toFixed(2);

  if(document.getElementById("ovExpenseTotal")) document.getElementById("ovExpenseTotal").textContent = "Rs " + expenseTotal.toFixed(2);
  if(document.getElementById("ovSohamExpOnly")) document.getElementById("ovSohamExpOnly").textContent = "Rs " + sohamExpOnly.toFixed(2);
  if(document.getElementById("ovJeetExpOnly")) document.getElementById("ovJeetExpOnly").textContent = "Rs " + jeetExpOnly.toFixed(2);
  if(document.getElementById("ovFarmExpOnly")) document.getElementById("ovFarmExpOnly").textContent = "Rs " + farmExpOnly.toFixed(2);
  
  if(document.getElementById("ovSohamTotal")) document.getElementById("ovSohamTotal").textContent = "Rs " + sohamExpTotal.toFixed(2);
  if(document.getElementById("ovJeetTotal")) document.getElementById("ovJeetTotal").textContent = "Rs " + jeetExpTotal.toFixed(2);
  if(document.getElementById("ovFarmTotal")) document.getElementById("ovFarmTotal").textContent = "Rs " + farmExpTotal.toFixed(2);

  if(document.getElementById("ovFarmAvailableBalance")) document.getElementById("ovFarmAvailableBalance").textContent = "Rs " + farmAvailableBalance.toFixed(2);
  if(document.getElementById("ovProfit")) document.getElementById("ovProfit").textContent = "Rs " + netProfit.toFixed(2);
  
  if(document.getElementById("ovDamage")) document.getElementById("ovDamage").textContent = "Rs " + damageTotal.toFixed(2);
  if(document.getElementById("ovSohamDmgCard")) document.getElementById("ovSohamDmgCard").textContent = "Rs " + sohamDmgTotal.toFixed(2);
  if(document.getElementById("ovJeetDmgCard")) document.getElementById("ovJeetDmgCard").textContent = "Rs " + jeetDmgTotal.toFixed(2);
  if(document.getElementById("ovFarmDmgCard")) document.getElementById("ovFarmDmgCard").textContent = "Rs " + farmDmgTotal.toFixed(2);

  if(document.getElementById("ovSohamNet")) document.getElementById("ovSohamNet").textContent = "Rs " + sohamNetExp.toFixed(2);
  if(document.getElementById("ovJeetNet")) document.getElementById("ovJeetNet").textContent = "Rs " + jeetNetExp.toFixed(2);

  if(document.getElementById("subTabExpTotalDisplay")) document.getElementById("subTabExpTotalDisplay").textContent = "Rs " + expenseTotal.toFixed(2);
  if(document.getElementById("subTabSohamExp")) document.getElementById("subTabSohamExp").textContent = "Rs " + sohamExpOnly.toFixed(2);
  if(document.getElementById("subTabJeetExp")) document.getElementById("subTabJeetExp").textContent = "Rs " + jeetExpOnly.toFixed(2);
  if(document.getElementById("subTabFarmExp")) document.getElementById("subTabFarmExp").textContent = "Rs " + farmExpOnly.toFixed(2);

  const expFarmList = filteredExpenses.filter(e => e.category === "Farm");
  const expMushroomList = filteredExpenses.filter(e => e.category === "Mushroom");
  const expStudentList = filteredExpenses.filter(e => e.category === "Student & Farmer");

  const totalFarmExp = expFarmList.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalMushroomExp = expMushroomList.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalStudentExp = expStudentList.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  if(document.getElementById("totalExpFarm")) document.getElementById("totalExpFarm").textContent = "Rs " + totalFarmExp.toFixed(2);
  if(document.getElementById("totalExpMushroom")) document.getElementById("totalExpMushroom").textContent = "Rs " + totalMushroomExp.toFixed(2);
  if(document.getElementById("totalExpStudent")) document.getElementById("totalExpStudent").textContent = "Rs " + totalStudentExp.toFixed(2);

  if(document.getElementById("countExpFarm")) document.getElementById("countExpFarm").textContent = expFarmList.length;
  if(document.getElementById("countExpMushroom")) document.getElementById("countExpMushroom").textContent = expMushroomList.length;
  if(document.getElementById("countExpStudent")) document.getElementById("countExpStudent").textContent = expStudentList.length;

  if(document.getElementById("subExpenseTableBodyFarm")) {
    document.getElementById("subExpenseTableBodyFarm").innerHTML = expFarmList.map((e) => {
      const idx = expensesRegistry.indexOf(e);
      return `
        <tr>
          <td>${e.date}</td>
          <td>${e.payer}</td>
          <td>${e.desc}</td>
          <td style="color:var(--warn); font-weight:bold;">Rs ${e.amount}</td>
          <td><small>${e.notes || '-'}</small></td>
          <td>
            <button type="button" class="btn" style="padding:2px 5px; font-size:10px; min-height:auto; background:#0284c7;" onclick="adminEditExpense(${idx})">✏️</button>
            <button type="button" class="btn" style="padding:2px 5px; font-size:10px; min-height:auto; background:var(--danger);" onclick="adminDeleteExpense(${idx})">🗑️</button>
          </td>
        </tr>
      `;
    }).join("") || `<tr><td colspan="6" style="text-align:center; color:var(--muted); padding:14px;">No Farm expenses recorded.</td></tr>`;
  }

  if(document.getElementById("subExpenseTableBodyMushroom")) {
    document.getElementById("subExpenseTableBodyMushroom").innerHTML = expMushroomList.map((e) => {
      const idx = expensesRegistry.indexOf(e);
      return `
        <tr>
          <td>${e.date}</td>
          <td>${e.payer}</td>
          <td>${e.desc}</td>
          <td style="color:var(--warn); font-weight:bold;">Rs ${e.amount}</td>
          <td><small>${e.notes || '-'}</small></td>
          <td>
            <button type="button" class="btn" style="padding:2px 5px; font-size:10px; min-height:auto; background:#0284c7;" onclick="adminEditExpense(${idx})">✏️</button>
            <button type="button" class="btn" style="padding:2px 5px; font-size:10px; min-height:auto; background:var(--danger);" onclick="adminDeleteExpense(${idx})">🗑️</button>
          </td>
        </tr>
      `;
    }).join("") || `<tr><td colspan="6" style="text-align:center; color:var(--muted); padding:14px;">No Mushroom expenses recorded.</td></tr>`;
  }

  if(document.getElementById("subExpenseTableBodyStudent")) {
    document.getElementById("subExpenseTableBodyStudent").innerHTML = expStudentList.map((e) => {
      const idx = expensesRegistry.indexOf(e);
      return `
        <tr>
          <td>${e.date}</td>
          <td>${e.payer}</td>
          <td>${e.desc}</td>
          <td style="color:var(--warn); font-weight:bold;">Rs ${e.amount}</td>
          <td><small>${e.notes || '-'}</small></td>
          <td>
            <button type="button" class="btn" style="padding:2px 5px; font-size:10px; min-height:auto; background:#0284c7;" onclick="adminEditExpense(${idx})">✏️</button>
            <button type="button" class="btn" style="padding:2px 5px; font-size:10px; min-height:auto; background:var(--danger);" onclick="adminDeleteExpense(${idx})">🗑️</button>
          </td>
        </tr>
      `;
    }).join("") || `<tr><td colspan="6" style="text-align:center; color:var(--muted); padding:14px;">No Training expenses recorded.</td></tr>`;
  }

  const sellPaidTotal = filteredSales.reduce((sum, s) => sum + Number(s.paidAmount !== undefined ? s.paidAmount : s.total || 0), 0);
  const sellPendingTotal = filteredSales.reduce((sum, s) => {
    const tot = Number(s.total || 0);
    const pd = Number(s.paidAmount !== undefined ? s.paidAmount : tot);
    return sum + Math.max(0, tot - pd);
  }, 0);

  if(document.getElementById("subTabSellTotalDisplay")) document.getElementById("subTabSellTotalDisplay").textContent = "Rs " + sellTotal.toFixed(2);
  if(document.getElementById("subTabSellPaid")) document.getElementById("subTabSellPaid").textContent = "Rs " + sellPaidTotal.toFixed(2);
  if(document.getElementById("subTabSellPending")) document.getElementById("subTabSellPending").textContent = "Rs " + sellPendingTotal.toFixed(2);

  if(document.getElementById("subSellTableBody")) {
    document.getElementById("subSellTableBody").innerHTML = filteredSales.map((s) => {
      const idx = salesRegistry.indexOf(s);
      const sub = Number(s.subtotal || (s.qty * s.rate) || s.total);
      const del = Number(s.delivery || 0);
      const grandTotal = Number(s.total || (sub + del));
      const paid = Number(s.paidAmount !== undefined ? s.paidAmount : grandTotal);
      const pending = Math.max(0, grandTotal - paid);

      return `
        <tr>
          <td>${s.date}</td>
          <td>${s.product}</td>
          <td><strong>${s.buyer}</strong><br><small>${s.phone || ''}</small></td>
          <td>${s.qty}</td>
          <td>Rs ${Number(s.rate || 0).toFixed(2)}</td>
          <td>Rs ${del.toFixed(2)}</td>
          <td style="color:var(--accent); font-weight:bold;">Rs ${grandTotal.toFixed(2)}</td>
          <td><span style="color:#16a34a; font-weight:bold;">Rs ${paid.toFixed(2)}</span>${pending > 0 ? `<br><small style="color:#dc2626;">Due: Rs ${pending.toFixed(2)}</small>` : ''}</td>
          <td>
            <div style="display:flex; gap:3px;">
              <button type="button" class="btn" style="padding:2px 5px; font-size:10px; min-height:auto;" onclick="downloadOfflineSaleInvoice('${s.saleId}')">📄</button>
              <button type="button" class="btn" style="padding:2px 5px; font-size:10px; min-height:auto; background:#0284c7;" onclick="adminEditSale(${idx})">✏️</button>
              <button type="button" class="btn" style="padding:2px 5px; font-size:10px; min-height:auto; background:var(--danger);" onclick="adminDeleteSale(${idx})">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join("") || `<tr><td colspan="9" style="text-align:center; padding:14px;">No sales found.</td></tr>`;
  }

  if(document.getElementById("subTabBuyTotalDisplay")) document.getElementById("subTabBuyTotalDisplay").textContent = "Rs " + buyTotal.toFixed(2);
  if(document.getElementById("subTabSohamBuy")) document.getElementById("subTabSohamBuy").textContent = "Rs " + sohamBuyTotal.toFixed(2);
  if(document.getElementById("subTabJeetBuy")) document.getElementById("subTabJeetBuy").textContent = "Rs " + jeetBuyTotal.toFixed(2);
  if(document.getElementById("subTabFarmBuy")) document.getElementById("subTabFarmBuy").textContent = "Rs " + farmBuyTotal.toFixed(2);

  if(document.getElementById("subBuyTableBody")) {
    document.getElementById("subBuyTableBody").innerHTML = filteredPurchases.map((p) => {
      const idx = purchasesRegistry.indexOf(p);
      const deliveryAmt = Number(p.delivery || 0);
      const totalPayable = Number(p.total || (p.qty * p.rate) + deliveryAmt);
      const paid = Number(p.paidAmount !== undefined ? p.paidAmount : totalPayable);

      return `
        <tr>
          <td>${p.date}</td>
          <td>${p.product}</td>
          <td><span class="badge">${p.funder || 'Farm'}</span></td>
          <td><strong>${p.vendor}</strong><br><small>${p.vendorPhone || ''}</small></td>
          <td>${p.qty}</td>
          <td>Rs ${p.rate}</td>
          <td>Rs ${deliveryAmt.toFixed(2)}</td>
          <td style="color:var(--danger); font-weight:bold;">Rs ${totalPayable.toFixed(2)}</td>
          <td><span style="color:#16a34a;">Paid: Rs ${paid.toFixed(2)}</span></td>
          <td>
            <button type="button" class="btn" style="padding:2px 5px; font-size:10px; min-height:auto; background:#0284c7;" onclick="adminEditPurchase(${idx})">✏️</button>
            <button type="button" class="btn" style="padding:2px 5px; font-size:10px; min-height:auto; background:var(--danger);" onclick="adminDeletePurchase(${idx})">🗑️</button>
          </td>
        </tr>
      `;
    }).join("") || `<tr><td colspan="10" style="text-align:center; padding:14px;">No purchases found.</td></tr>`;
  }

  if(document.getElementById("subTabDamageTotalDisplay")) document.getElementById("subTabDamageTotalDisplay").textContent = "Rs " + damageTotal.toFixed(2);
  if(document.getElementById("subTabSohamDmg")) document.getElementById("subTabSohamDmg").textContent = "Rs " + sohamDmgTotal.toFixed(2);
  if(document.getElementById("subTabJeetDmg")) document.getElementById("subTabJeetDmg").textContent = "Rs " + jeetDmgTotal.toFixed(2);
  if(document.getElementById("subTabFarmDmg")) document.getElementById("subTabFarmDmg").textContent = "Rs " + farmDmgTotal.toFixed(2);

  if(document.getElementById("subDamageTableBody")) {
    document.getElementById("subDamageTableBody").innerHTML = filteredDamages.map((d) => {
      const idx = expensesRegistry.indexOf(d);
      return `
        <tr>
          <td>${d.date}</td>
          <td>${d.desc}</td>
          <td><span class="badge">${d.payer}</span></td>
          <td style="color:var(--danger); font-weight:bold;">Rs ${d.amount}</td>
          <td><small>${d.notes || '-'}</small></td>
          <td>
            <button type="button" class="btn" style="padding:2px 5px; font-size:10px; min-height:auto; background:#0284c7;" onclick="adminEditDamage(${idx})">✏️</button>
            <button type="button" class="btn" style="padding:2px 5px; font-size:10px; min-height:auto; background:var(--danger);" onclick="adminDeleteDamage(${idx})">🗑️</button>
          </td>
        </tr>
      `;
    }).join("") || `<tr><td colspan="6" style="text-align:center; padding:14px;">No damages found.</td></tr>`;
  }
}