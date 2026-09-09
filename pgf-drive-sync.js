// =========================================================
// PGF MANAGEMENT - GOOGLE SHEETS / DRIVE SYNC BRIDGE (alag.js)
// =========================================================

const PGF_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzuqVnQVwweajZya8OYwi8IU5KzgPEeVp3mOm_cSaZo8kjIT0McqHM93BUwDULEaht_YA/exechttps://script.google.com/macros/s/AKfycbzuqVnQVwweajZya8OYwi8IU5KzgPEeVp3mOm_cSaZo8kjIT0McqHM93BUwDULEaht_YA/exechttps://script.google.com/macros/s/AKfycbzuqVnQVwweajZya8OYwi8IU5KzgPEeVp3mOm_cSaZo8kjIT0McqHM93BUwDULEaht_YA/exechttps://script.google.com/macros/s/AKfycbzuqVnQVwweajZya8OYwi8IU5KzgPEeVp3mOm_cSaZo8kjIT0McqHM93BUwDULEaht_YA/exec";

/**
 * 1. Google Sheet / Drive se saara data fetch karne ke liye (Website par dikhane ke liye)
 */
async function fetchAllDataFromGoogleSheet() {
  try {
    const response = await fetch(PGF_APPS_SCRIPT_URL);
    const result = await response.json();
    if (result.status === "success") {
      console.log("✅ Data successfully loaded from Google Sheets!", result.data);
      return result.data; // Yeh aapko 10 sheets ka data object form me dega
    } else {
      console.error("Error fetching data:", result.message);
    }
  } catch (err) {
    console.error("Network or Script Error:", err);
  }
  return null;
}

/**
 * 2. Admin taraf se update hone par Google Sheet me direct save/update karne ke liye
 */
async function pushAdminUpdateToGoogleSheet(sheetName, actionType, payloadData) {
  try {
    const bodyData = {
      sheet: sheetName,       // Kis sheet me update karna hai (jaise 'Orders Ledger', 'Expenses', etc.)
      action: actionType,     // 'add', 'update', ya 'delete'
      data: payloadData       // Data object jo update hoga
    };

    await fetch(PGF_APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyData)
    });

    console.log(`✅ Google Sheet (${sheetName}) successfully updated with action: ${actionType}!`);
  } catch (err) {
    console.error("Google Sheet Push Sync Error:", err);
  }
}