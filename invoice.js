import { salesRegistry, bookingsRegistry, orderRegistry } from './state.js';
import { farmWhatsapp } from './config.js';

export function closeInvoice() { 
  document.getElementById("invoiceDialog").close(); 
}

export function printDivInvoice() {
  const basePath = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
  const absoluteLogoUrl = basePath + "mushroom/pgf logo.png";

  const containerClone = document.getElementById('invoiceCaptureFrame').cloneNode(true);
  const logoImg = containerClone.querySelector('#invoiceBrandLogo');
  if (logoImg) {
    logoImg.src = absoluteLogoUrl;
  }

  const invoiceHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Pure Grow Farm - Invoice</title>
        <style>
          @page { size: A4; margin: 10mm; }
          body { font-family: sans-serif; padding: 20px; background: #fff; color: #222; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 14px; }
          th, td { border: 1px solid #e6e9ec; padding: 12px 14px; text-align: left; }
          th { background: #2b8a3e !important; color: white !important; -webkit-print-color-adjust: exact; font-weight: bold; }
        </style>
      </head>
      <body>
        ${containerClone.innerHTML}
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 400);
          };
        <\/script>
      </body>
    </html>
  `;

  const blob = new Blob([invoiceHTML], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  const printWin = window.open(blobUrl, '_blank');
  if (!printWin) window.location.href = blobUrl;
}

export function downloadOfflineSaleInvoice(saleId) {
  const targetSale = salesRegistry.find(s => s.saleId === saleId);
  if(!targetSale) return alert("Invoice not found.");
  
  const sub = Number(targetSale.subtotal || (targetSale.qty * targetSale.rate) || targetSale.total);
  const del = Number(targetSale.delivery || 0);
  const grandTotal = Number(targetSale.total || (sub + del));
  const paid = Number(targetSale.paidAmount !== undefined ? targetSale.paidAmount : grandTotal);
  const due = Math.max(0, grandTotal - paid);

  document.getElementById("invNum").textContent = targetSale.saleId;
  document.getElementById("invDate").textContent = targetSale.date;
  document.getElementById("invClientName").textContent = targetSale.buyer;
  document.getElementById("invClientEmail").textContent = "Phone Lines: " + (targetSale.phone || "N/A");
  document.getElementById("invClientAddr").textContent = "Shipping Address: " + (targetSale.address || "Direct Spot Distribution Counter");
  
  document.getElementById("invoiceTableItemsBody").innerHTML = `
    <tr>
      <td style="padding:12px 14px; border-bottom:1px solid #e6e9ec; font-weight: 600;">${targetSale.product} Lot Log Entry</td>
      <td style="padding:12px 14px; border-bottom:1px solid #e6e9ec; text-align:right;">Rs ${Number(targetSale.rate).toFixed(2)}</td>
      <td style="padding:12px 14px; border-bottom:1px solid #e6e9ec; text-align:center;">${targetSale.qty}</td>
      <td style="padding:12px 14px; border-bottom:1px solid #e6e9ec; text-align:right; font-weight:600; color:var(--accent);">Rs ${sub.toFixed(2)}</td>
    </tr>
  `;
  
  document.getElementById("invSub").textContent = `Rs ${sub.toFixed(2)}`;
  document.getElementById("invDelivery").textContent = `Rs ${del.toFixed(2)}`;
  document.getElementById("invTotal").textContent = `Rs ${grandTotal.toFixed(2)}`;

  const notesSec = document.getElementById("invNotesSection");
  if (notesSec) {
    if (targetSale.notes) {
      notesSec.style.display = "block";
      notesSec.innerHTML = `<strong>Memo / Note:</strong> ${targetSale.notes}`;
    } else {
      notesSec.style.display = "none";
    }
  }

  const paidRow = document.getElementById("invPaidRow");
  const dueRow = document.getElementById("invDueRow");
  if (paidRow && dueRow) {
    paidRow.style.display = "flex";
    dueRow.style.display = "flex";
    document.getElementById("invPaid").textContent = `Rs ${paid.toFixed(2)}`;
    document.getElementById("invDue").textContent = `Rs ${due.toFixed(2)}`;
  }

  const waTargetPhone = (targetSale.phone && targetSale.phone.replace(/[^0-9]/g, '')) || farmWhatsapp;
  const cleanPhone = waTargetPhone.length === 10 ? "91" + waTargetPhone : waTargetPhone;

  const waInvoiceText = 
`*PURE GROW FARM - SALES INVOICE RECEIPT*
----------------------------------------
📄 *Invoice Ref:* ${targetSale.saleId}
📅 *Date:* ${targetSale.date}
👤 *Customer:* ${targetSale.buyer}
📞 *Phone:* ${targetSale.phone || 'N/A'}
📍 *Address:* ${targetSale.address || 'Direct Spot Delivery'}
🍄 *Product:* ${targetSale.product} (${targetSale.qty} Units @ Rs ${targetSale.rate}/unit)
----------------------------------------
💰 *Subtotal:* Rs ${sub.toFixed(2)}
🚚 *Delivery:* Rs ${del.toFixed(2)}
💵 *Grand Total:* Rs ${grandTotal.toFixed(2)}
✅ *Paid Amount:* Rs ${paid.toFixed(2)}
${due > 0 ? `⚠️ *Pending Balance:* Rs ${due.toFixed(2)}\n` : `🎉 *Status:* Fully Paid\n`}${targetSale.notes ? `📝 *Note:* ${targetSale.notes}\n` : ''}----------------------------------------
*Thank you for your business!*
Pure Grow Farm, Makhiyala, Gujarat
📞 +91 9067891039 | +91 8200145732`;

  const waBtn = document.getElementById("whatsappInvoice");
  if (waBtn) {
    waBtn.href = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waInvoiceText)}`;
  }
  
  document.getElementById("invoiceDialog").showModal();
}