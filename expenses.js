import { _supabase } from './config.js';
import { expensesRegistry } from './state.js';
import { getTodayIsoString, initDefaultDatePickers } from './utils.js';
import { computeFinancialLedgerStatements } from './accounting.js';

export async function saveAdminExpense(e) {
  e.preventDefault();
  const rawDate = document.getElementById("expLogDate").value;
  const amountVal = parseFloat(document.getElementById("expAmount").value);

  const dbData = {
    exp_id: "EXP-" + Date.now().toString().slice(-4),
    date: rawDate ? new Date(rawDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
    category: document.getElementById("expCategory").value,
    payer: document.getElementById("expPayer").value,
    mode: document.getElementById("expMode").value,
    desc: document.getElementById("expDesc").value.trim(),
    amount: amountVal,
    notes: document.getElementById("expNotes") ? document.getElementById("expNotes").value.trim() : ""
  };

  const { error } = await _supabase.from('pgf_expenses').insert([dbData]);
  if (error) { alert("Cloud Error: " + error.message); return; }

  expensesRegistry.push({
    expId: dbData.exp_id, date: dbData.date, category: dbData.category, payer: dbData.payer, mode: dbData.mode, desc: dbData.desc, amount: dbData.amount, notes: dbData.notes
  });
  localStorage.setItem('pgf_expenses', JSON.stringify(expensesRegistry));

  e.target.reset();
  initDefaultDatePickers();
  computeFinancialLedgerStatements();
  alert(`✅ Data cloud me save ho gaya hai! Expense Amount: Rs ${amountVal}`);
}

export async function adminEditExpense(idx) {
  const exp = expensesRegistry[idx];
  if (!exp) return;

  const newDate = prompt("1. Operation Date:", exp.date || getTodayIsoString());
  if (newDate === null) return;
  const newDesc = prompt("2. Context / Item Summary:", exp.desc || "");
  if (newDesc === null) return;
  const newAmt = prompt("3. Amount (Rs):", exp.amount);
  if (newAmt === null || isNaN(parseFloat(newAmt))) return;

  const { error } = await _supabase.from('pgf_expenses').update({
    date: newDate.trim(), desc: newDesc.trim(), amount: parseFloat(newAmt)
  }).eq('exp_id', exp.expId);

  if (error) { alert("Database update error: " + error.message); return; }

  exp.date = newDate.trim();
  exp.desc = newDesc.trim();
  exp.amount = parseFloat(newAmt);

  localStorage.setItem('pgf_expenses', JSON.stringify(expensesRegistry));
  computeFinancialLedgerStatements();
  alert("✅ Expense updated successfully in cloud!");
}

export async function adminDeleteExpense(idx) {
  const exp = expensesRegistry[idx];
  if (!exp) return;
  if (confirm("Kya aap sach me ye Expense entry delete karna chahte hain?")) {
    const { error } = await _supabase.from('pgf_expenses').delete().eq('exp_id', exp.expId);
    if (error) { alert("Database delete error: " + error.message); return; }
    expensesRegistry.splice(idx, 1);
    localStorage.setItem('pgf_expenses', JSON.stringify(expensesRegistry));
    computeFinancialLedgerStatements();
    alert("✅ Expense deleted successfully from cloud!");
  }
}

export async function saveAdminDamage(e) {
  e.preventDefault();
  const rawDate = document.getElementById("dmgLogDate").value;
  const payerType = document.getElementById("dmgPayer").value;
  const amountVal = parseFloat(document.getElementById("dmgAmount").value);
  const notes = document.getElementById("dmgNotes") ? document.getElementById("dmgNotes").value.trim() : "";

  const dbData = {
    exp_id: "DMG-" + Date.now().toString().slice(-4),
    date: rawDate ? new Date(rawDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
    payer: payerType,
    desc: document.getElementById("dmgDesc").value.trim(),
    amount: amountVal,
    notes: notes
  };

  const { error } = await _supabase.from('pgf_damages').insert([dbData]);
  if (error) { alert("Cloud Error: " + error.message); return; }

  expensesRegistry.push({
    expId: dbData.exp_id, date: dbData.date, category: "Damage Received", payer: dbData.payer, mode: "Internal Allocation", desc: dbData.desc, amount: dbData.amount, notes: dbData.notes
  });
  
  e.target.reset();
  initDefaultDatePickers();
  computeFinancialLedgerStatements();
  alert(`✅ Data cloud me save ho gaya hai! Damage Loss: Rs ${amountVal}`);
}

export async function adminEditDamage(idx) {
  const dmg = expensesRegistry[idx];
  if (!dmg) return;
  const newDate = prompt("1. Damage Date:", dmg.date || getTodayIsoString());
  if (newDate === null) return;
  const newAmt = prompt("2. Damage Amount (Rs):", dmg.amount);
  if (newAmt === null || isNaN(parseFloat(newAmt))) return;

  const { error } = await _supabase.from('pgf_damages').update({
    date: newDate.trim(), amount: parseFloat(newAmt)
  }).eq('exp_id', dmg.expId);

  if (error) { alert("Database update error: " + error.message); return; }
  dmg.date = newDate.trim();
  dmg.amount = parseFloat(newAmt);
  localStorage.setItem('pgf_expenses', JSON.stringify(expensesRegistry));
  computeFinancialLedgerStatements();
  alert("✅ Damage log successfully updated in cloud!");
}

export async function adminDeleteDamage(idx) {
  const dmg = expensesRegistry[idx];
  if (!dmg) return;
  if (confirm("Kya aap sach me ye Damage entry delete karna chahte hain?")) {
    const { error } = await _supabase.from('pgf_damages').delete().eq('exp_id', dmg.expId);
    if (error) { alert("Database delete error: " + error.message); return; }
    expensesRegistry.splice(idx, 1);
    localStorage.setItem('pgf_expenses', JSON.stringify(expensesRegistry));
    computeFinancialLedgerStatements();
    alert("✅ Damage entry successfully deleted from cloud!");
  }
}