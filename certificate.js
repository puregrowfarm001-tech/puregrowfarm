import { bookingsRegistry } from './state.js';

export function downloadCertificatePDF(bookingId) {
  const targetBooking = bookingsRegistry.find(b => b && b.bookingId === bookingId);
  if (!targetBooking) return alert("Certificate not found.");
  if (!targetBooking.certIssued) return alert("Certificate has not been issued yet by Farm Admin.");

  const titleText = targetBooking.type === "Student" ? "Certificate of Internship" : "Certificate of Farming";
  const descText = targetBooking.type === "Student" 
    ? `has successfully completed an internship program in Oyster Mushroom Cultivation at Pure Grow Farm, at Makhiyala, Gujarat.`
    : `has successfully completed the practical farmer training framework module in Oyster Mushroom Cultivation at Pure Grow Farm, at Makhiyala, Gujarat.`;
  
  const durationContent = targetBooking.type === "Student" 
    ? `from <strong>${targetBooking.start || 'N/A'}</strong> to <strong>${targetBooking.end || 'N/A'}</strong>`
    : `on target session date <strong>${targetBooking.date || 'N/A'}</strong>`;

  const actualApprovedDate = targetBooking.certIssueDate ? targetBooking.certIssueDate : (targetBooking.dateLogged ? targetBooking.dateLogged.split(" ")[0] : new Date().toLocaleDateString('en-IN'));

  const basePath = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
  const logoUrl = basePath + "mushroom/pgf logo.png";
  const sohamSignUrl = basePath + "mushroom/soham sign.png";
  const jeetSignUrl = basePath + "mushroom/jeet sign.png";

  const certificateHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=1024, initial-scale=0.4, user-scalable=yes">
  <title>${titleText} - ${targetBooking.name}</title>
  <style>
    @page { size: A4 landscape; margin: 6mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { 
      margin: 0; 
      padding: 12px; 
      font-family: Arial, sans-serif; 
      background: #f8fafc; 
      text-align: center;
      min-width: 980px; 
    }
    .certificate-frame { 
      width: 960px; 
      background: #fff; 
      border: 8px solid #1e4620; 
      padding: 20px; 
      box-sizing: border-box; 
      margin: 0 auto; 
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }
    .inner-border { border: 2px solid #d97706; padding: 20px; background: #ffffff; }
    .cert-header-top { display: flex; justify-content: center; align-items: center; gap: 15px; }
    .cert-title { font-size: 28px; font-weight: bold; color: #1e4620; text-transform: uppercase; letter-spacing: 1px; font-family: 'Times New Roman', Times, serif; margin: 12px 0 6px 0; }
    .cert-name { font-size: 24px; font-weight: bold; color: #2b8a3e; border-bottom: 2px solid #d97706; display: inline-block; padding: 0 20px; margin: 6px auto; font-family: 'Times New Roman', Times, serif; }
    .cert-desc { font-size: 14px; line-height: 1.6; text-align: justify; margin: 12px auto; max-width: 820px; color: #222; }
    .cert-footer-grid { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 25px; padding: 0 10px; }
    .sign-img { width: 120px; height: 48px; object-fit: contain; display: block; margin: 0 auto -8px auto; mix-blend-mode: multiply; }
    .no-print-bar { margin-bottom: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 10px; border-radius: 8px; width: 960px; margin-left: auto; margin-right: auto; }
    .no-print-btn { background: #2b8a3e; color: #fff; border: 0; padding: 8px 18px; font-weight: bold; border-radius: 6px; font-size: 14px; cursor: pointer; }
    @media print { .no-print-bar { display: none !important; } body { padding: 0; background: #fff; min-width: 100%; } .certificate-frame { width: 100%; box-shadow: none; } }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <button class="no-print-btn" onclick="window.print()">📥 Click Here to Save / Download PDF</button>
  </div>

  <div class="certificate-frame">
    <div class="inner-border">
      <div class="cert-header-top">
        <img src="${logoUrl}" alt="Logo" style="width: 60px; height: auto;">
        <div style="text-align:left;">
          <h2 style="color: #1e4620; margin: 0; font-size: 20px; font-weight: 800;">PURE GROW FARM</h2>
          <p style="margin: 2px 0 0 0; font-size: 11px; color:#6b7280;">Makhiyala, Gujarat, 362011 | puregrowfarm001@gmail.com</p>
        </div>
      </div>
      <hr style="border:0; border-top: 2px solid #2b8a3e; margin: 10px 0;">
      <div class="cert-title">${titleText}</div>
      <p style="font-style: italic; margin: 3px 0; color: #555; font-size: 13px;">This is to certify that</p>
      <div class="cert-name">${targetBooking.name.toUpperCase()}</div>
      <p style="font-style: italic; margin: 5px 0; color: #555; font-size: 13px;">${descText}</p>
      <p class="cert-desc">
        The program execution guidelines were conducted ${durationContent}. 
        During this framework index period, the candidate gained foundational knowledge in mushroom biology, substrate preparation, spawn inoculation, and scientific crop management, demonstrating an exceptional work ethic.
      </p>
      
      <div class="cert-footer-grid">
        <div style="text-align: center; width: 34%;">
          <div style="height: 50px; display: flex; align-items: flex-end; justify-content: center;">
            <img src="${sohamSignUrl}" alt="Soham Gajera Signature" class="sign-img">
          </div>
          <div style="border-top: 1.5px solid #333; width: 160px; margin: 0 auto 4px auto;"></div>
          <div style="font-size: 13px; font-weight: bold; color: #1e4620;">Soham N Gajera</div>
          <div style="font-size: 10px; color: #475569; margin-top: 2px;">Co-Founder & Managing Director</div>
        </div>

        <div style="text-align: center; width: 28%;">
          <img src="${logoUrl}" alt="Stamp" style="width: 55px; height: auto; opacity: 0.95;">
          <div style="font-size: 9px; font-weight: 800; color: #1e4620; margin-top: 2px; letter-spacing: 0.5px;">PURE GROW FARM</div>
          <div style="font-size: 11px; color: #334155; margin-top: 3px;">
            <strong>Approved Date:</strong> ${actualApprovedDate}
          </div>
        </div>

        <div style="text-align: center; width: 34%;">
          <div style="height: 50px; display: flex; align-items: flex-end; justify-content: center;">
            <img src="${jeetSignUrl}" alt="Jeet Gajera Signature" class="sign-img">
          </div>
          <div style="border-top: 1.5px solid #333; width: 160px; margin: 0 auto 4px auto;"></div>
          <div style="font-size: 13px; font-weight: bold; color: #1e4620;">Jeet A Gajera</div>
          <div style="font-size: 10px; color: #475569; margin-top: 2px;">Co-Founder & Director<br>(Agriculture & Production)</div>
        </div>
      </div>
    </div>
  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 500);
    });
  <\/script>
</body>
</html>`;

  const blob = new Blob([certificateHTML], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  const printWindow = window.open(blobUrl, '_blank');
  if (!printWindow) window.location.href = blobUrl;
}