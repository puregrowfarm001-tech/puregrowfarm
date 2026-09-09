// excel-export.js - Admin Panel Master Excel Downloader
function exportAdminDataToExcel() {
  if (typeof XLSX === 'undefined') {
    alert("⚠️ SheetJS library loaded nahi hai. Kripya index.html me script tag add karein.");
    return;
  }

  const wb = XLSX.utils.book_new();

  // 1. Overview & Live Summary Ledger
  const summaryData = [
    ["Metric Category / Indicator", "Value / Amount (₹ or Qty)", "Partner / Breakdown Details"],
    ["1) Order Total (Online Sales)", document.getElementById("ovOrderTotal")?.textContent || "Rs 0.00", "Online Store Checkout Ledger"],
    ["2) Farm Booking Total", document.getElementById("ovFarmBookingTotal")?.textContent || "Rs 0.00", "Student & Farmer Workshops"],
    ["3) Sell Total (Offline Wholesale)", document.getElementById("ovSellTotal")?.textContent || "Rs 0.00", "Direct Wholesale Distribution"],
    ["4) Buy Total (Purchases)", document.getElementById("ovBuyTotal")?.textContent || "Rs 0.00", "Raw Material Outflows"],
    ["5) Expense Total", document.getElementById("ovExpenseTotal")?.textContent || "Rs 0.00", "Farm Infrastructure & Substrate"],
    ["6) Farm Available Balance (Net Vault)", document.getElementById("ovFarmAvailableBalance")?.textContent || "Rs 0.00", "Liquid Reserves"],
    ["7) Unified Net Profit (P&L)", document.getElementById("ovProfit")?.textContent || "Rs 0.00", "Gross Revenue minus Outflows"],
    ["8) Total Damage Losses", document.getElementById("ovDamage")?.textContent || "Rs 0.00", "Adjusted Batch Losses"],
    ["9) Dry Stock Available", document.getElementById("adminLiveStockCardsContainer")?.children[0]?.innerText || "0 kg", "Live Dry Stock"]
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), "Overview & Live Summary");

  // 2. Orders Manager (Including Confirm, Reject, Cancel, Payment Details)
  const ordersData = [
    ["Order ID", "Date & Time", "Client Name", "Phone", "Email", "Shipping Address", "Products Ordered", "Total (₹)", "Payment Mode", "Txn ID (UTR)", "User UPI ID", "Order Status", "Courier & Location", "Refund Stage & Date"]
  ];
  if (typeof orderRegistry !== 'undefined') {
    orderRegistry.forEach(o => {
      ordersData.push([
        o.orderId, o.dateLogged || o.paymentDate || '-', o.name, o.phone, o.email, o.address, o.products, o.total, o.paymentMode, o.txnId, o.userUpiId, o.status, `${o.courierName || 'Ekart'} | Loc: ${o.currentLocation || 'Hub'}`, `${o.refundStage || 'N/A'} ${o.refundCreditedDate ? '('+o.refundCreditedDate+')' : ''}`
      ]);
    });
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ordersData), "Orders Manager");

  // 3. Farm Training Bookings (Confirm, Reject, Cancel, Approve, Certificate Status)
  const bookingsData = [
    ["Booking ID", "Type", "Name", "Phone", "Email", "College / Session Details", "Fee (₹)", "Payment Mode", "Txn ID (UTR)", "User UPI", "Booking Status", "Approval Date", "Certificate Status", "Issue Date"]
  ];
  if (typeof bookingsRegistry !== 'undefined') {
    bookingsRegistry.forEach(b => {
      bookingsData.push([
        b.bookingId, b.type, b.name, b.phone, b.email, b.college ? `${b.college} (${b.course})` : (b.date || '-'), b.fee, b.paymentMode, b.txnId, b.userUpiId, b.status, b.approvedDate || '-', b.certIssued ? "Approved & Issued" : "Pending Approval", b.certIssueDate || '-'
      ]);
    });
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(bookingsData), "Farm Training Bookings");

  // 4. Core Financial & Stock Summary
  const coreFinData = [
    ["Financial Dimension", "Aggregated Value / Qty", "Associated Ledger Page Reference"],
    ["Total Daily Dry Stock Inwarded", document.getElementById("dailyDryTotalSum")?.textContent || "0 kg", "Daily Dry Stock Page"],
    ["Total Operational Expenses", document.getElementById("subTabExpTotalDisplay")?.textContent || "Rs 0.00", "Expenses Page"],
    ["Total Wholesale Sales Revenue", document.getElementById("subTabSellTotalDisplay")?.textContent || "Rs 0.00", "Sell Page"],
    ["Total Raw Material Purchases", document.getElementById("subTabBuyTotalDisplay")?.textContent || "Rs 0.00", "Buy Page"],
    ["Total Damage Losses", document.getElementById("subTabDamageTotalDisplay")?.textContent || "Rs 0.00", "Damage Page"]
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(coreFinData), "Core Financial & Stock");

  // 5. Daily Dry Mushroom Stock Page
  const dryData = [["Date", "Batch Context / Description", "Dry Weight (kg)"]];
  if (typeof dailyDryStockRegistry !== 'undefined') {
    dailyDryStockRegistry.forEach(d => { dryData.push([d.date, d.notes, d.qty]); });
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dryData), "🌾 Daily Dry Stock");

  // 6. Expenses Page
  const expData = [["Date", "Category", "Payer", "Transaction Mode", "Context Summary", "Amount (₹)", "Notes"]];
  if (typeof expensesRegistry !== 'undefined') {
    expensesRegistry.filter(e => e.category !== "Damage Received").forEach(e => {
      expData.push([e.date, e.category, e.payer, e.mode, e.desc, e.amount, e.notes]);
    });
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(expData), "1. Expenses Page");

  // 7. Sell Page
  const sellData = [["Date", "Product Variant", "Buyer Name", "Phone", "Qty", "Rate (₹)", "Delivery (₹)", "Total (₹)", "Paid Amount (₹)", "Notes"]];
  if (typeof salesRegistry !== 'undefined') {
    salesRegistry.forEach(s => {
      sellData.push([s.date, s.product, s.buyer, s.phone, s.qty, s.rate, s.delivery || 0, s.total, s.paidAmount, s.notes]);
    });
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sellData), "2. Sell Page");

  // 8. Buy Page
  const buyData = [["Date", "Resource Inward Lot", "Funder", "Vendor Name", "Qty", "Rate (₹)", "Delivery (₹)", "Total Payable (₹)", "Paid Amount (₹)", "Notes"]];
  if (typeof purchasesRegistry !== 'undefined') {
    purchasesRegistry.forEach(p => {
      buyData.push([p.date, p.product, p.funder, p.vendor, p.qty, p.rate, p.delivery || 0, p.total, p.paidAmount, p.notes]);
    });
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(buyData), "3. Buy Page");

  // 9. Damage Page
  const dmgData = [["Date", "Damage Context Info", "Payer (Partner)", "Adjusted Amount (₹)", "Notes"]];
  if (typeof expensesRegistry !== 'undefined') {
    expensesRegistry.filter(e => e.category === "Damage Received").forEach(d => {
      dmgData.push([d.date, d.desc, d.payer, d.amount, d.notes]);
    });
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dmgData), "4. Damage Page");

  // 10. Registered Accounts (Automatic Database Sync)
  const usersData = [["Index No", "Client Legal Name", "Registered Mobile Line", "Email Authentication ID", "Account Created On"]];
  if (typeof usersDatabase !== 'undefined') {
    usersDatabase.forEach((u, i) => {
      usersData.push([i + 1, u.name, u.phone || '-', u.email, u.registeredOn || '-']);
    });
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(usersData), "Registered Accounts");

  // Trigger Download
  XLSX.writeFile(wb, "Pure_Grow_Farm_ERP_Master_Ledger.xlsx");
  alert("✅ Master Excel file successfully downloaded with all live records!");
}