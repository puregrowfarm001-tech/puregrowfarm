import { _supabase, ADMIN_CREDENTIALS } from './config.js';
import { currentUser, setCurrentUser, orderRegistry, bookingsRegistry } from './state.js';
import { isPasswordStrong } from './utils.js';
import { pushNotification, renderNotificationBadge } from './notifications.js';

export function switchAuthBox(boxId) {
  document.querySelectorAll('.auth-box').forEach(b => b.classList.remove('active'));
  document.getElementById(boxId).classList.add('active');
}

export async function checkUserSession() {
  renderNotificationBadge();

  let activeUser = currentUser;
  if (!activeUser) {
    const savedSession = localStorage.getItem('pgf_session');
    if (savedSession) {
      try {
        activeUser = JSON.parse(savedSession);
        setCurrentUser(activeUser);
      } catch (e) {
        setCurrentUser(null);
      }
    }
  }

  const profileWrapper = document.getElementById("userProfileMenuWrapper");

  if (activeUser) {
    document.getElementById("authSection").style.display = "none";
    document.getElementById("authNavBtn").style.display = "none";
    
    if (activeUser.isAdmin) {
      if (profileWrapper) profileWrapper.style.display = "none";
      if (typeof window.triggerAdminView === 'function') {
        window.triggerAdminView();
      }
    } else {
      if (profileWrapper) profileWrapper.style.display = "inline-block";
      
      if (document.getElementById("headerUserNameDisplay")) document.getElementById("headerUserNameDisplay").textContent = activeUser.name;
      if (document.getElementById("dropUserName")) document.getElementById("dropUserName").textContent = activeUser.name;
      if (document.getElementById("dropUserEmail")) document.getElementById("dropUserEmail").textContent = activeUser.email;
      if (document.getElementById("dropUserPhone")) document.getElementById("dropUserPhone").textContent = activeUser.phone || "No Phone";

      document.getElementById("mainNav").style.display = "flex";
      document.getElementById("dashboardWorkspace").style.display = "block";
      document.getElementById("userDashboardName").textContent = activeUser.name;
      
      document.getElementById("checkoutGuardBlock").style.display = "none";
      document.getElementById("orderForm").style.display = "grid";
      document.getElementById("name").value = activeUser.name;
      document.getElementById("phone").value = activeUser.phone || "";
      document.getElementById("email").value = activeUser.email;

      document.getElementById("trainingGuardBlock").style.display = "none";
      document.getElementById("trainingMainContent").style.display = "block";
      document.getElementById("sname").value = activeUser.name;
      document.getElementById("sphone").value = activeUser.phone || "";
      document.getElementById("semail").value = activeUser.email;
      document.getElementById("fname").value = activeUser.name;
      document.getElementById("fphone").value = activeUser.phone || "";
      document.getElementById("femail").value = activeUser.email;

      if (typeof window.loadUserPanelDataFromCloud === 'function') {
        window.loadUserPanelDataFromCloud();
      }
    }
  } else {
    document.getElementById("mainNav").style.display = "flex";
    document.getElementById("authSection").style.display = "block";
    if (profileWrapper) profileWrapper.style.display = "none";
    document.getElementById("authNavBtn").style.display = "inline-flex";
    document.getElementById("dashboardWorkspace").style.display = "none";
    
    const adminErpView = document.getElementById("adminErpView");
    if (adminErpView) adminErpView.classList.remove("active");
    
    document.getElementById("publicContent").style.display = "block";
    document.getElementById("checkoutGuardBlock").style.display = "block";
    document.getElementById("orderForm").style.display = "none";
    document.getElementById("trainingGuardBlock").style.display = "block";
    document.getElementById("trainingMainContent").style.display = "none";
  }
}

export async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById("regName").value.trim();
  const phone = document.getElementById("regPhone").value.trim();
  const email = document.getElementById("regEmail").value.trim().toLowerCase();
  const password = document.getElementById("regPassword").value;

  if (!isPasswordStrong(password)) {
    alert("⚠️ Kripya Strong Password dalein!\n(8+ chars, 1 Uppercase, 1 Number, 1 Special character)");
    return;
  }

  const { data: existingUser } = await _supabase
    .from('pgf_users')
    .select('*')
    .eq('email', email)
    .single();

  if (existingUser) {
    alert("Is Email ID se account pehle se bana hua hai!");
    return;
  }

  const now = new Date();
  const currentFormattedDateTime = now.toLocaleDateString('en-IN') + " " + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  const newUser = { name, phone, email, password, registered_on: currentFormattedDateTime };

  const { error } = await _supabase.from('pgf_users').insert([newUser]);
  if (error) {
    alert("Registration error: " + error.message);
    return;
  }

  pushNotification('ADMIN', '👤 New Account Created', `${name} (${email}) has registered.`, 'general');

  setCurrentUser({ name, email, phone, isAdmin: false });
  localStorage.setItem('pgf_session', JSON.stringify(currentUser));
  alert("✅ Account Successfully Created & Synced to Cloud!");
  checkUserSession();
}

export async function handleLogin(e) {
  e.preventDefault();
  let userInput = document.getElementById("loginEmail").value.trim();
  const passInput = document.getElementById("loginPassword").value;

  if (userInput === ADMIN_CREDENTIALS.user && passInput === ADMIN_CREDENTIALS.pass) {
    setCurrentUser({ name: "System Admin", email: "admin@puregrowfarm.internal", isAdmin: true });
    localStorage.setItem('pgf_session', JSON.stringify(currentUser));
    checkUserSession();
    return;
  }

  if (userInput.includes('@')) {
    userInput = userInput.toLowerCase();
  }

  const { data: dbUser, error } = await _supabase
    .from('pgf_users')
    .select('*')
    .or(`email.eq.${userInput},phone.eq.${userInput}`)
    .single();

  if (error || !dbUser || dbUser.password !== passInput) {
    alert("Invalid credentials or Account does not exist!");
    return;
  }

  setCurrentUser({ name: dbUser.name, email: dbUser.email, phone: dbUser.phone, isAdmin: false });
  localStorage.setItem('pgf_session', JSON.stringify(currentUser));
  
  alert(`✅ Welcome back, ${currentUser.name}!`);
  checkUserSession();
}

let pendingResetEmail = "";
let generatedOtpCode = "";

export async function handleSendOtp(e) {
  e.preventDefault();
  const email = document.getElementById("forgotEmail").value.trim();

  const { data: user, error } = await _supabase
    .from('pgf_users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !user) {
    alert("⚠️ Yeh email hamare database me registered nahi hai!");
    return;
  }

  generatedOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
  pendingResetEmail = email;

  await _supabase
    .from('pgf_users')
    .update({ forgot_otp: generatedOtpCode })
    .eq('email', email);

  const templateParams = {
    to_email: email,
    to_name: user.name,
    otp_code: generatedOtpCode
  };

  emailjs.send('service_jk9zdkf', 'template_zihxosq', templateParams)
    .then(function(response) {
       alert(`✅ 6-digit OTP successfully aapke Gmail (${email}) par bhej diya gaya hai! Kripya inbox check karein.`);
       document.getElementById("forgotRequestForm").style.display = "none";
       document.getElementById("forgotVerifyForm").style.display = "grid";
    }, function(error) {
       alert("❌ Email send karne me error aayi: " + JSON.stringify(error));
    });
}

export async function handleVerifyAndReset(e) {
  e.preventDefault();
  const enteredOtp = document.getElementById("otpInputCode").value.trim();
  const newPassword = document.getElementById("newResetPassword").value;

  if (!isPasswordStrong(newPassword)) {
    alert("⚠️ Kripya Strong Password dalein!\n(8+ chars, 1 Uppercase, 1 Number, 1 Special character)");
    return;
  }

  const { data: user, error } = await _supabase
    .from('pgf_users')
    .select('*')
    .eq('email', pendingResetEmail)
    .single();

  if (error || !user || user.forgot_otp !== enteredOtp) {
    alert("❌ Invalid OTP! Kripya sahi 6-digit OTP enter karein.");
    return;
  }

  const { error: updateError } = await _supabase
    .from('pgf_users')
    .update({ password: newPassword, forgot_otp: null })
    .eq('email', pendingResetEmail);

  if (updateError) {
    alert("Password update karne me error aayi: " + updateError.message);
    return;
  }

  alert("✅ Password successfully change ho gaya hai! Ab aap naye password se Sign In kar sakte hain.");
  
  document.getElementById("forgotVerifyForm").reset();
  document.getElementById("forgotRequestForm").reset();
  document.getElementById("forgotVerifyForm").style.display = "none";
  document.getElementById("forgotRequestForm").style.display = "grid";
  switchAuthBox('loginBox');
}

export function handleLogout() {
  setCurrentUser(null);
  localStorage.removeItem('pgf_session');
  
  const ordersModal = document.getElementById("userOrdersModal");
  if (ordersModal) ordersModal.classList.remove("active-modal");

  const bookingsModal = document.getElementById("userBookingsModal");
  if (bookingsModal) bookingsModal.classList.remove("active-modal");

  const filterModal = document.getElementById("adminFilterPopupModal");
  if (filterModal) filterModal.classList.remove("active-modal");

  checkUserSession();
}