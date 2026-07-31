// ==========================================
// 1. CONFIGURATION & GLOBAL STATE
// ==========================================
const SHEET_URL = "https://script.google.com/macros/s/AKfycbygMDC4TecN3eXRy-HFi2mjqRW3UTgmua-JwHUpaY6WJ4_Y8OyjxV2m6Zvc2GRL-xzC/exec";

// Application Data Cache
let appData = {
    users: [],
    orders: [],
    visits: [],
    expenses: [],
    sales: [],
    purchases: [],
    products: []
};

// ==========================================
// 2. APP INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
    console.log("Initializing Pure Grow Farm System...");
    loadFromLocalStorage(); // Fast local load
    await fetchAllDataFromSheet(); // Live sync from Google Sheets
    initApp();
});

// ==========================================
// 3. GOOGLE SHEETS API INTEGRATION
// ==========================================

// Read Data from Google Sheets (doGet)
async function fetchAllDataFromSheet() {
    if (!SHEET_URL || SHEET_URL.includes("YOUR_GOOGLE_APPS_SCRIPT")) {
        console.warn("Sheet URL missing or default. Using local storage data.");
        return;
    }

    try {
        const response = await fetch(SHEET_URL);
        const data = await response.json();
        
        if (data && (data.status === "success" || data.users || data.orders)) {
            appData = { ...appData, ...data };
            localStorage.setItem("pureGrowData", JSON.stringify(appData));
            console.log("Data synced successfully from Google Sheets:", appData);
            initApp(); // Refresh UI with live data
        }
    } catch (error) {
        console.error("Fetch Error (doGet):", error);
    }
}

// Write Data to Google Sheets (doPost)
async function sendDataToSheet(actionType, payload) {
    const postData = {
        action: actionType,
        payload: payload,
        timestamp: new Date().toISOString()
    };

    // Update local state instantly for fast UI feedback
    saveToLocalState(actionType, payload);

    if (!SHEET_URL || SHEET_URL.includes("YOUR_GOOGLE_APPS_SCRIPT")) {
        console.warn("Sheet URL not set. Data saved to browser only.");
        return { status: "local_success" };
    }

    try {
        await fetch(SHEET_URL, {
            method: "POST",
            mode: "no-cors", // Required for Google Apps Script redirects
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(postData)
        });

        console.log(`Action [${actionType}] sent to Google Sheet.`);
        return { status: "success" };
    } catch (error) {
        console.error(`Post Error (${actionType}):`, error);
        return { status: "error" };
    }
}

// Local Caching Helpers
function loadFromLocalStorage() {
    const saved = localStorage.getItem("pureGrowData");
    if (saved) {
        appData = JSON.parse(saved);
    }
}

function saveToLocalState(action, payload) {
    if (action === "addUser" || action === "register") {
        appData.users = appData.users || [];
        appData.users.push(payload);
    } else if (action === "addOrder") {
        appData.orders = appData.orders || [];
        appData.orders.push(payload);
    } else if (action === "addExpense") {
        appData.expenses = appData.expenses || [];
        appData.expenses.push(payload);
    } else if (action === "addSale") {
        appData.sales = appData.sales || [];
        appData.sales.push(payload);
    }
    localStorage.setItem("pureGrowData", JSON.stringify(appData));
}

// ==========================================
// 4. USER AUTHENTICATION & LOGIN
// ==========================================
async function registerUser(username, email, password, phone) {
    const newUser = {
        id: "USR-" + Date.now(),
        username: username,
        email: email,
        password: password,
        phone: phone,
        createdAt: new Date().toLocaleDateString()
    };

    await sendDataToSheet("addUser", newUser);
    alert("Registration Successful! You can now login.");
}

function loginUser(email, password) {
    const users = appData.users || [];
    const foundUser = users.find(u => String(u.email).toLowerCase() === String(email).toLowerCase() && String(u.password) === String(password));

    if (foundUser) {
        localStorage.setItem("currentUser", JSON.stringify(foundUser));
        alert(`Welcome back, ${foundUser.username || "User"}!`);
        window.location.reload();
    } else {
        alert("Invalid Email or Password. Please try again.");
    }
}

function logoutUser() {
    localStorage.removeItem("currentUser");
    alert("Logged out successfully.");
    window.location.reload();
}

function getCurrentUser() {
    const userStr = localStorage.getItem("currentUser");
    return userStr ? JSON.parse(userStr) : null;
}

// ==========================================
// 5. ADMIN PANEL RENDERERS
// ==========================================
function renderAdminDashboard() {
    const ordersContainer = document.getElementById("admin-orders-list");
    const usersContainer = document.getElementById("admin-users-list");
    const expensesContainer = document.getElementById("admin-expenses-list");

    // Orders Table
    if (ordersContainer) {
        const orders = appData.orders || [];
        if (orders.length === 0) {
            ordersContainer.innerHTML = "<tr><td colspan='5'>No orders found.</td></tr>";
        } else {
            ordersContainer.innerHTML = orders.map(o => `
                <tr>
                    <td>${o.id || '-'}</td>
                    <td>${o.customerName || o.userEmail || 'Guest'}</td>
                    <td>${o.product || 'Mushroom Product'}</td>
                    <td>₹${o.totalAmount || 0}</td>
                    <td><span class="badge">${o.status || 'Pending'}</span></td>
                </tr>
            `).join('');
        }
    }

    // Users Table
    if (usersContainer) {
        const users = appData.users || [];
        if (users.length === 0) {
            usersContainer.innerHTML = "<tr><td colspan='4'>No registered users found.</td></tr>";
        } else {
            usersContainer.innerHTML = users.map(u => `
                <tr>
                    <td>${u.id || '-'}</td>
                    <td>${u.username || '-'}</td>
                    <td>${u.email || '-'}</td>
                    <td>${u.phone || '-'}</td>
                </tr>
            `).join('');
        }
    }

    // Expenses Table
    if (expensesContainer) {
        const expenses = appData.expenses || [];
        if (expenses.length === 0) {
            expensesContainer.innerHTML = "<tr><td colspan='3'>No expenses recorded.</td></tr>";
        } else {
            expensesContainer.innerHTML = expenses.map(e => `
                <tr>
                    <td>${e.date || '-'}</td>
                    <td>${e.category || '-'}</td>
                    <td>₹${e.amount || 0}</td>
                </tr>
            `).join('');
        }
    }
}

// ==========================================
// 6. PRODUCT CATALOG & ORDER SYSTEM
// ==========================================
function renderProducts() {
    const productContainer = document.getElementById("products-grid");
    if (!productContainer) return;

    const products = (appData.products && appData.products.length > 0) ? appData.products : [
        { id: 1, name: "Fresh Oyster Mushroom", price: 200, unit: "kg" },
        { id: 2, name: "Dry Oyster Mushroom", price: 800, unit: "kg" },
        { id: 3, name: "Oyster Mushroom Powder", price: 1000, unit: "kg" }
    ];

    productContainer.innerHTML = products.map(p => `
        <div class="product-card">
            <h3>${p.name}</h3>
            <p class="price">₹${p.price} / ${p.unit}</p>
            <button class="btn-order" onclick="placeOrder('${p.name}', ${p.price})">Order Now</button>
        </div>
    `).join('');
}

async function placeOrder(productName, price) {
    const user = getCurrentUser();
    if (!user) {
        alert("Please login first to place an order!");
        return;
    }

    const orderPayload = {
        id: "ORD-" + Date.now(),
        userEmail: user.email,
        customerName: user.username || user.email,
        product: productName,
        totalAmount: price,
        status: "Pending",
        date: new Date().toLocaleDateString()
    };

    await sendDataToSheet("addOrder", orderPayload);
    alert(`Order placed successfully for ${productName}!`);
    renderAdminDashboard();
}

// ==========================================
// 7. SYSTEM INITIALIZATION & UI REFLECTION
// ==========================================
function initApp() {
    renderProducts();
    renderAdminDashboard();
    
    // Auth State Display
    const user = getCurrentUser();
    const userDisplay = document.getElementById("user-display-name");
    if (userDisplay && user) {
        userDisplay.innerText = `Hello, ${user.username || 'User'}`;
    }
}