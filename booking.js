import { _supabase, farmWhatsapp, farmName, farmUpiId } from './config.js';
import { currentUser, bookingsRegistry } from './state.js';
import { pushNotification } from './notifications.js';

export function showVisitForm(id) {
  document.getElementById("studentForm").classList.remove("active");
  document.getElementById("farmerForm").classList.remove("active");
  document.getElementById(id).classList.add("active");

  const indicator = document.getElementById("activeFormIndicatorTitle");
  const btnStudent = document.getElementById("btnTabStudent");
  const btnFarmer = document.getElementById("btnTabFarmer");

  if (id === 'studentForm') {
    if (indicator) indicator.textContent = "📝 Currently Filling: Student Internship Program Application (Fee: Rs 100)";
    if (btnStudent) btnStudent.style.background = "var(--accent)";
    if (btnFarmer) btnFarmer.style.background = "var(--muted)";
  } else {
    if (indicator) indicator.textContent = "📝 Currently Filling: Farmer Training Workshop Registration (Fee: Rs 699)";
    if (btnFarmer) btnFarmer.style.background = "var(--accent)";
    if (btnStudent) btnStudent.style.background = "var(--muted)";
  }
}

export function openVisitPayment(formId, amount) {
  const modeSelectId = formId === "studentForm" ? "spaymentMode" : "fpaymentMode";
  const helpId = formId === "studentForm" ? "studentPaymentHelp" : "farmerPaymentHelp";
  const txnInputId = formId === "studentForm" ? "spayment" : "fpayment";
  const mode = document.getElementById(modeSelectId).value;

  if (!mode) {
    document.getElementById(txnInputId).value = "";
    document.getElementById(txnInputId).disabled = true;
    if(formId === "studentForm") validateStudentForm();
    else validateFarmerForm();
    return;
  }
  
  document.getElementById(helpId).style.display = "block";
  document.getElementById(helpId).textContent = `Launching UPI App for program fee Rs ${amount}.`;
  
  window.location.href = `upi://pay?pa=${encodeURIComponent(farmUpiId)}&pn=${encodeURIComponent(farmName)}&am=${amount}&cu=INR`;
  
  document.getElementById(txnInputId).disabled = false;
  if(formId === "studentForm") validateStudentForm();
  else validateFarmerForm();
}

export function validateStudentForm() {
  const enroll = document.getElementById("senroll").value.trim();
  const college = document.getElementById("scollege").value.trim();
  const course = document.getElementById("scourse").value.trim();
  const start = document.getElementById("sstart").value;
  const end = document.getElementById("send").value;
  const userUpi = document.getElementById("suserUpi") ? document.getElementById("suserUpi").value.trim() : "";
  const txn = document.getElementById("spayment").value.trim();
  const isDisabled = document.getElementById("spayment").disabled;
  
  const isValid = !isDisabled && enroll !== "" && college !== "" && course !== "" && start !== "" && end !== "" && userUpi.length >= 5 && userUpi.includes('@') && txn.length >= 6;
  document.getElementById("studentSubmitBtn").disabled = !isValid;
}

export function validateFarmerForm() {
  const date = document.getElementById("fdate").value;
  const userUpi = document.getElementById("fuserUpi") ? document.getElementById("fuserUpi").value.trim() : "";
  const txn = document.getElementById("fpayment").value.trim();
  const isDisabled = document.getElementById("fpayment").disabled;
  
  const isValid = !isDisabled && date !== "" && userUpi.length >= 5 && userUpi.includes('@') && txn.length >= 6;
  document.getElementById("farmerSubmitBtn").disabled = !isValid;
}

export async function submitStudentVisit(e) {
  e.preventDefault();
  const currentTimestamp = new Date().toLocaleDateString('en-IN') + " " + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  
  const data = {
    booking_id: "PGF-STU-" + Date.now().toString().slice(-4),
    type: "Student",
    name: currentUser.name,
    phone: currentUser.phone,
    email: currentUser.email,
    enrollment: document.getElementById("senroll").value.trim(),
    college: document.getElementById("scollege").value.trim(),
    course: document.getElementById("scourse").value.trim(),
    start_date: document.getElementById("sstart").value,
    end_date: document.getElementById("send").value,
    user_upi_id: document.getElementById("suserUpi").value.trim(),
    fee: 100,
    payment_mode: document.getElementById("spaymentMode").value,
    txn_id: document.getElementById("spayment").value.trim(),
    date_logged: currentTimestamp,
    status: "Pending Verification",
    cert_issued: false
  };

  const { error } = await _supabase.from('pgf_bookings').insert([data]);
  if (error) {
    alert("Registration Error: " + error.message);
    return;
  }

  pushNotification('ADMIN', '🎓 New Training Booking', `${currentUser.name} ne Student training ke liye booking ki hai (Ref: #${data.booking_id}).`, 'booking');

  bookingsRegistry.unshift({
    bookingId: data.booking_id,
    type: data.type,
    name: data.name,
    phone: data.phone,
    email: data.email,
    enrollment: data.enrollment,
    college: data.college,
    course: data.course,
    start: data.start_date,
    end: data.end_date,
    userUpiId: data.user_upi_id,
    fee: data.fee,
    paymentMode: data.payment_mode,
    txnId: data.txn_id,
    dateLogged: data.date_logged,
    status: data.status,
    certIssued: data.cert_issued
  });

  const waText = `NEW STUDENT INTERNSHIP REGISTRATION:\n----------------------------------------\nBooking Ref ID: ${data.booking_id}\nName: ${data.name}\nStudent UPI ID: ${data.user_upi_id}\nCollege: ${data.college}\nCourse: ${data.course}\nUTR Tracking Number: ${data.txn_id}\n----------------------------------------`;
  
  setTimeout(() => {
    window.open(`https://wa.me/${farmWhatsapp}?text=${encodeURIComponent(waText)}`, '_blank');
  }, 300);

  alert("✅ Success! Aapka Student Internship Registration cloud database me save ho gaya hai.");
  document.getElementById("studentForm").reset();
  document.getElementById("spayment").disabled = true;
  if (typeof window.checkUserSession === 'function') window.checkUserSession();
}

export async function submitFarmerVisit(e) {
  e.preventDefault();
  const currentTimestamp = new Date().toLocaleDateString('en-IN') + " " + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  
  const data = {
    booking_id: "PGF-FAR-" + Date.now().toString().slice(-4),
    type: "Farmer",
    name: currentUser.name,
    phone: currentUser.phone,
    email: currentUser.email,
    session_date: document.getElementById("fdate").value,
    user_upi_id: document.getElementById("fuserUpi").value.trim(),
    fee: 699,
    payment_mode: document.getElementById("fpaymentMode").value,
    txn_id: document.getElementById("fpayment").value.trim(),
    date_logged: currentTimestamp,
    status: "Pending Verification",
    cert_issued: false
  };

  const { error } = await _supabase.from('pgf_bookings').insert([data]);
  if (error) {
    alert("Farmer Registration Error: " + error.message);
    return;
  }

  pushNotification('ADMIN', '🎓 New Training Booking', `${currentUser.name} ne Farmer training ke liye booking ki hai (Ref: #${data.booking_id}).`, 'booking');

  bookingsRegistry.unshift({
    bookingId: data.booking_id,
    type: data.type,
    name: data.name,
    phone: data.phone,
    email: data.email,
    date: data.session_date,
    userUpiId: data.user_upi_id,
    fee: data.fee,
    paymentMode: data.payment_mode,
    txnId: data.txn_id,
    dateLogged: data.date_logged,
    status: data.status,
    certIssued: data.cert_issued
  });

  const waText = `NEW FARMER TRAINING BOOKING:\n----------------------------------------\nBooking Ref ID: ${data.booking_id}\nName: ${data.name}\nFarmer UPI ID: ${data.user_upi_id}\nTraining Date: ${data.session_date}\nUTR Tracking Number: ${data.txn_id}\n----------------------------------------`;
  
  setTimeout(() => {
    window.open(`https://wa.me/${farmWhatsapp}?text=${encodeURIComponent(waText)}`, '_blank');
  }, 300);
  
  alert("✅ Success! Aapka Farmer Training Workshop booking cloud database me save ho gaya hai.");
  document.getElementById("farmerForm").reset();
  document.getElementById("fpayment").disabled = true;
  if (typeof window.checkUserSession === 'function') window.checkUserSession();
}