export function getCleanData(key) {
  try {
    const raw = JSON.parse(localStorage.getItem(key)) || [];
    if (!Array.isArray(raw)) return [];
    return raw.filter(item => item && (item.name || item.orderId || item.bookingId || item.saleId || item.expId || item.dryId || item.purId || item.id));
  } catch (e) {
    return [];
  }
}

export function copyToClipboard(text) {
  if (!text || text === 'N/A') return;
  navigator.clipboard.writeText(text).then(() => {
    alert(`📋 Copied: ${text}`);
  }).catch(() => {
    prompt("Copy UPI ID:", text);
  });
}

export function closeModalOutside(e, modalId) {
  if (e.target.id === modalId) {
    document.getElementById(modalId).classList.remove("active-modal");
  }
}

export function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === "password") {
    input.type = "text";
    btn.textContent = "🙈";
  } else {
    input.type = "password";
    btn.textContent = "👁️";
  }
}

export function isPasswordStrong(pwd) {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(pwd);
}

export function checkPasswordStrength(pwd) {
  const feedback = document.getElementById("passwordStrengthFeedback");
  if (!feedback) return;

  if (pwd.length === 0) {
    feedback.style.color = "#94a3b8";
    feedback.textContent = "Password must have 8+ chars, 1 uppercase, 1 number & 1 special character (@$!%*?&).";
    return;
  }

  if (isPasswordStrong(pwd)) {
    feedback.style.color = "#16a34a";
    feedback.textContent = "✅ Strong password!";
  } else {
    feedback.style.color = "#ef4444";
    feedback.textContent = "❌ Weak password! Ensure 8+ chars, 1 uppercase (A-Z), 1 number (0-9), and 1 symbol (@$!%*?&).";
  }
}

export function getTodayIsoString() {
  const d = new Date();
  const month = '' + (d.getMonth() + 1), day = '' + d.getDate(), year = d.getFullYear();
  return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
}

export function initDefaultDatePickers() {
  const today = getTodayIsoString();
  if(document.getElementById("expLogDate")) document.getElementById("expLogDate").value = today;
  if(document.getElementById("saleLogDate")) document.getElementById("saleLogDate").value = today;
  if(document.getElementById("purLogDate")) document.getElementById("purLogDate").value = today;
  if(document.getElementById("dmgLogDate")) document.getElementById("dmgLogDate").value = today;
  if(document.getElementById("dryLogDate")) document.getElementById("dryLogDate").value = today;
}