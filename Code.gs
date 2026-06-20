const FARM_EMAIL = "puregrowfarm001@gmail.com";
const SPREADSHEET_NAME = "Pure Grow Farm Orders And Visits";

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || "{}");
    const spreadsheet = getSpreadsheet_();

    if (payload.type === "order") {
      saveOrder_(spreadsheet, payload.data);
    } else if (payload.type === "visit") {
      saveVisit_(spreadsheet, payload.data);
    } else {
      throw new Error("Invalid payload type");
    }

    return json_({ ok: true, message: "Data saved to farm sheet" });
  } catch (error) {
    return json_({ ok: false, message: error.message });
  }
}

function doGet() {
  return json_({ ok: true, message: "Pure Grow Farm API is running" });
}

function getSpreadsheet_() {
  const props = PropertiesService.getScriptProperties();
  const existingId = props.getProperty("SPREADSHEET_ID");

  if (existingId) {
    return SpreadsheetApp.openById(existingId);
  }

  const ss = SpreadsheetApp.create(SPREADSHEET_NAME);
  props.setProperty("SPREADSHEET_ID", ss.getId());
  DriveApp.getFileById(ss.getId()).addEditor(FARM_EMAIL);
  setupHeaders_(ss);
  return ss;
}

function setupHeaders_(ss) {
  const orders = ss.getSheetByName("Orders") || ss.insertSheet("Orders");
  const visits = ss.getSheetByName("Visits") || ss.insertSheet("Visits");

  orders.clear();
  orders.appendRow([
    "Saved At",
    "Invoice",
    "Customer",
    "Phone",
    "Email",
    "Address",
    "Items",
    "Subtotal",
    "Delivery",
    "Total",
    "Payment Mode",
    "Transaction ID",
    "Status"
  ]);

  visits.clear();
  visits.appendRow([
    "Saved At",
    "Booking",
    "Type",
    "Name",
    "Phone",
    "Email",
    "Amount",
    "Payment Mode",
    "Payment ID",
    "Enrollment",
    "College",
    "Course",
    "Start Date",
    "End Date",
    "Training Date",
    "Status"
  ]);
}

function saveOrder_(ss, order) {
  const sheet = ss.getSheetByName("Orders") || ss.insertSheet("Orders");
  const items = (order.items || [])
    .map(item => `${item.name} x ${item.qty}`)
    .join("; ");

  sheet.appendRow([
    new Date(),
    order.invoiceNo || "",
    order.customer?.name || "",
    order.customer?.phone || "",
    order.customer?.email || "",
    order.customer?.address || "",
    items,
    order.totals?.subtotal || 0,
    order.totals?.delivery || 0,
    order.totals?.total || 0,
    order.payment?.mode || "",
    order.payment?.transactionId || "",
    order.status || "Confirmed"
  ]);

  MailApp.sendEmail({
    to: FARM_EMAIL,
    subject: `New Pure Grow Farm Order - ${order.invoiceNo || ""}`,
    htmlBody: buildOrderEmail_(order)
  });
}

function saveVisit_(ss, visit) {
  const sheet = ss.getSheetByName("Visits") || ss.insertSheet("Visits");

  sheet.appendRow([
    new Date(),
    visit.bookingNo || "",
    visit.visitType || "",
    visit.name || "",
    visit.phone || "",
    visit.email || "",
    visit.amount || 0,
    visit.paymentMode || "",
    visit.paymentId || "",
    visit.enrollment || "",
    visit.college || "",
    visit.course || "",
    visit.startDate || "",
    visit.endDate || "",
    visit.trainingDate || "",
    visit.status || "Confirmed"
  ]);

  MailApp.sendEmail({
    to: FARM_EMAIL,
    subject: `New Pure Grow Farm Visit - ${visit.bookingNo || ""}`,
    htmlBody: buildVisitEmail_(visit)
  });
}

function buildOrderEmail_(order) {
  const items = (order.items || [])
    .map(item => `<li>${escape_(item.name)} x ${item.qty} = Rs ${item.amount}</li>`)
    .join("");

  return `
    <h2>New Product Order</h2>
    <p><b>Invoice:</b> ${escape_(order.invoiceNo || "")}</p>
    <p><b>Name:</b> ${escape_(order.customer?.name || "")}</p>
    <p><b>Phone:</b> ${escape_(order.customer?.phone || "")}</p>
    <p><b>Email:</b> ${escape_(order.customer?.email || "")}</p>
    <p><b>Address:</b> ${escape_(order.customer?.address || "")}</p>
    <ul>${items}</ul>
    <p><b>Total:</b> Rs ${order.totals?.total || 0}</p>
    <p><b>Payment:</b> ${escape_(order.payment?.mode || "")} - ${escape_(order.payment?.transactionId || "")}</p>
  `;
}

function buildVisitEmail_(visit) {
  return `
    <h2>New Visit Booking</h2>
    <p><b>Booking:</b> ${escape_(visit.bookingNo || "")}</p>
    <p><b>Type:</b> ${escape_(visit.visitType || "")}</p>
    <p><b>Name:</b> ${escape_(visit.name || "")}</p>
    <p><b>Phone:</b> ${escape_(visit.phone || "")}</p>
    <p><b>Email:</b> ${escape_(visit.email || "")}</p>
    <p><b>Amount:</b> Rs ${visit.amount || 0}</p>
    <p><b>Payment:</b> ${escape_(visit.paymentMode || "")} - ${escape_(visit.paymentId || "")}</p>
  `;
}

function json_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function escape_(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
