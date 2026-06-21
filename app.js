const farmEmail = "puregrowfarm001@gmail.com";
const farmWhatsapp = "919999999999";
const deliveryCharge = 40;

// Image change yahin se karo. File ko mushroom folder me rakho aur path update karo.
const siteImages = {
  logo: "mushroom/pgf logo.png",
  hero: "mushroom/home.png",
  farm: "mushroom/farm.jpeg",
  bulk: "mushroom/bulk.png",
  powder: "mushroom/oyster powder.png",
  dry: "mushroom/oyst dry.webp",
  gallery1: "mushroom/7.jpg",
  gallery2: "mushroom/8.jpg",
  gallery3: "mushroom/9.jpg",
  gallery4: "mushroom/10.jpg",
  gallery5: "mushroom/11.jpg",
  gallery6: "mushroom/12.jpg"
};

const products = [
  { id: "fresh-oyster", name: "Fresh Oyster Mushroom", unit: "500 g", price: 120, image: siteImages.farm },
  { id: "dry-oyster", name: "Dry Oyster Mushroom", unit: "100 g", price: 180, image: siteImages.dry },
  { id: "oyster-powder", name: "Oyster Mushroom Powder", unit: "100 g", price: 220, image: siteImages.powder },
  { id: "bulk-order", name: "Bulk Mushroom Order", unit: "1 kg", price: 220, image: siteImages.bulk }
];

const cart = new Map();

const $ = (id) => document.getElementById(id);

function applyImages() {
  document.querySelectorAll("[data-image]").forEach((node) => {
    node.src = siteImages[node.dataset.image];
  });
}

function renderProducts() {
  $("productGrid").innerHTML = products.map((product) => `
    <article class="product">
      <img src="${product.image}" alt="${product.name}">
      <h3>${product.name}</h3>
      <p>${product.unit} - Rs ${product.price}</p>
      <div class="product-controls">
        <input class="qty" id="qty-${product.id}" type="number" min="1" value="1" aria-label="${product.name} quantity">
        <button class="button primary" type="button" data-add-product="${product.id}">Add</button>
      </div>
    </article>
  `).join("");
}

function renderGallery() {
  const images = ["gallery1", "gallery2", "gallery3", "gallery4", "gallery5", "gallery6"];
  $("gallery").innerHTML = images.map((key, index) => `
    <img src="${siteImages[key]}" alt="Pure Grow Farm gallery ${index + 1}">
  `).join("");
}

function addProduct(productId) {
  const product = products.find((item) => item.id === productId);
  const qty = Math.max(1, Number($(`qty-${productId}`).value || 1));
  const existing = cart.get(productId);

  cart.set(productId, {
    ...product,
    qty: existing ? existing.qty + qty : qty
  });

  renderCart();
}

function getTotals() {
  const subtotal = [...cart.values()].reduce((sum, item) => sum + item.price * item.qty, 0);
  const delivery = subtotal ? deliveryCharge : 0;
  return { subtotal, delivery, total: subtotal + delivery };
}

function renderCart() {
  const items = [...cart.values()];
  $("cartItems").innerHTML = items.length
    ? items.map((item) => `
        <div class="cart-line">
          <span>${item.name} x ${item.qty}</span>
          <strong>Rs ${item.price * item.qty}</strong>
        </div>
      `).join("")
    : "No product selected.";

  $("cartItems").className = items.length ? "" : "cart-empty";
  const totals = getTotals();
  $("subtotal").textContent = `Rs ${totals.subtotal}`;
  $("delivery").textContent = `Rs ${totals.delivery}`;
  $("total").textContent = `Rs ${totals.total}`;
  updateOrderButton();
}

function updateOrderButton() {
  $("confirmOrderBtn").disabled = !cart.size;
}

function getSaved(key) {
  return JSON.parse(localStorage.getItem(key) || "[]");
}

function addSaved(key, data) {
  const saved = getSaved(key);
  saved.push(data);
  localStorage.setItem(key, JSON.stringify(saved));
}

function buildOrderInvoice(order) {
  const lines = order.items.map((item) => `${item.name} x ${item.qty} = Rs ${item.amount}`).join("\n");
  return [
    `Invoice: ${order.invoiceNo}`,
    `Name: ${order.customer.name}`,
    `Phone: ${order.customer.phone}`,
    lines,
    `Total: Rs ${order.totals.total}`,
    `Status: ${order.status}`
  ].join("\n");
}

function buildVisitInvoice(visit) {
  return [
    `Booking: ${visit.bookingNo}`,
    `Type: ${visit.visitType}`,
    `Name: ${visit.name}`,
    `Phone: ${visit.phone}`,
    `Amount: Rs ${visit.amount}`,
    `Status: ${visit.status}`
  ].join("\n");
}

function showSavedMessage(invoice, subject) {
  $("invoiceText").textContent = invoice;
  $("emailInvoice").href = `mailto:${farmEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(invoice)}`;
  $("whatsappInvoice").href = `https://wa.me/${farmWhatsapp}?text=${encodeURIComponent(invoice)}`;
  $("invoiceDialog").showModal();
}

function confirmOrder(event) {
  event.preventDefault();
  const phone = $("phone").value.trim();

  if (!/^[0-9]{10}$/.test(phone)) {
    alert("Please enter valid 10-digit phone number.");
    return;
  }

  const order = {
    date: new Date().toLocaleString("en-IN"),
    invoiceNo: `PGF-${Date.now().toString().slice(-6)}`,
    customer: {
      name: $("name").value.trim(),
      phone,
      email: $("email").value.trim(),
      address: $("address").value.trim()
    },
    items: [...cart.values()].map((item) => ({
      id: item.id,
      name: item.name,
      unit: item.unit,
      price: item.price,
      qty: item.qty,
      amount: item.price * item.qty
    })),
    totals: getTotals(),
    payment: {
      mode: $("paymentMode").value,
      transactionId: $("paymentId").value.trim()
    },
    status: "Confirmed"
  };

  addSaved("pgfOrders", order);
  showSavedMessage(buildOrderInvoice(order), "Pure Grow Farm Product Invoice");
  cart.clear();
  $("orderForm").reset();
  renderCart();
}

function formToObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function saveVisit(data, form) {
  const record = {
    ...data,
    date: new Date().toLocaleString("en-IN"),
    bookingNo: `PGF-V-${Date.now().toString().slice(-6)}`,
    status: "Confirmed"
  };

  addSaved("pgfVisits", record);
  showSavedMessage(buildVisitInvoice(record), `Pure Grow Farm ${record.visitType} Booking`);
  form.reset();
}

function exportExcel() {
  const orders = getSaved("pgfOrders");
  const visits = getSaved("pgfVisits");

  if (!orders.length && !visits.length) {
    alert("Abhi koi saved data nahi hai.");
    return;
  }

  const orderRows = orders.map((order) => ({
    "Saved At": order.date,
    Invoice: order.invoiceNo,
    Customer: order.customer.name,
    Phone: order.customer.phone,
    Email: order.customer.email,
    Address: order.customer.address,
    Items: order.items.map((item) => `${item.name} x ${item.qty}`).join("; "),
    Subtotal: order.totals.subtotal,
    Delivery: order.totals.delivery,
    Total: order.totals.total,
    "Payment Mode": order.payment.mode,
    "Transaction ID": order.payment.transactionId,
    Status: order.status
  }));

  const visitRows = visits.map((visit) => ({
    "Saved At": visit.date,
    Booking: visit.bookingNo,
    Type: visit.visitType,
    Name: visit.name,
    Phone: visit.phone,
    Email: visit.email,
    Amount: visit.amount,
    "Payment Mode": visit.paymentMode,
    "Payment ID": visit.paymentId,
    Enrollment: visit.enrollment || "",
    College: visit.college || "",
    Course: visit.course || "",
    "Start Date": visit.startDate || "",
    "End Date": visit.endDate || "",
    "Training Date": visit.trainingDate || "",
    Status: visit.status
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(orderRows), "Orders");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(visitRows), "Visits");
  XLSX.writeFile(workbook, "pure-grow-farm-data.xlsx");
}

function setupInstallButton() {
  let installPrompt = null;
  const button = $("installAppBtn");

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    button.hidden = false;
  });

  button.addEventListener("click", async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    button.hidden = true;
  });
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add-product]");
  if (button) addProduct(button.dataset.addProduct);
});

$("orderForm").addEventListener("submit", confirmOrder);
$("studentVisitForm").addEventListener("submit", (event) => {
  event.preventDefault();
  saveVisit({ ...formToObject(event.currentTarget), visitType: "student internship", amount: 500 }, event.currentTarget);
});
$("farmerTrainingForm").addEventListener("submit", (event) => {
  event.preventDefault();
  saveVisit({ ...formToObject(event.currentTarget), visitType: "farmer training", amount: 1000 }, event.currentTarget);
});
$("downloadExcelBtn").addEventListener("click", exportExcel);
$("mailLink").href = `mailto:${farmEmail}`;
$("whatsappLink").href = `https://wa.me/${farmWhatsapp}`;

applyImages();
renderProducts();
renderGallery();
renderCart();
setupInstallButton();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}
