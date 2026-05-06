function toggleNav(){ 
      document.getElementById('mainNav').classList.toggle('show'); 
    }

    // Close nav when clicking on a link
    document.querySelectorAll('nav a').forEach(link => {
      link.addEventListener('click', () => {
        document.getElementById('mainNav').classList.remove('show');
      });
    });

    function submitForm(e){
      e.preventDefault();
        const name=document.getElementById('name').value.trim();
        const phone=document.getElementById('phone').value.trim();
        const product=document.getElementById('product').value;
        const address=document.getElementById('address').value.trim();
        const quantity=document.getElementById('quantity').value.trim();
        const weight=document.getElementById('weight').value.trim();
        const message=document.getElementById('message').value.trim();

         if(!/^[0-9]{10}$/.test(phone)){
          alert('Please enter a valid 10-digit phone number (numbers only).');
          return;
        }

        const body = `Name: ${name}\nPhone: ${phone}\nProduct: ${product}\nweight: ${weight}\nquantity: ${quantity}\naddress: ${address}\nMessage: ${message}`;
        const mailto = `mailto:puregrowfarm001@gmail.com?subject=Order%20from%20website&body=${encodeURIComponent(body)}`;
        window.location.href = mailto;
    }




   // Show Forms
function showStudent() {
    document.getElementById("studentForm").classList.remove("hidden");
    document.getElementById("farmerForm").classList.add("hidden");
}

function showFarmer() {
    document.getElementById("farmerForm").classList.remove("hidden");
    document.getElementById("studentForm").classList.add("hidden");
}

// Send Email
function sendEmail(data) {
    emailjs.send("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", data)
    .then(() => {
        document.getElementById("msg").innerText = "✅ Data sent successfully!";
    })
    .catch(() => {
        document.getElementById("msg").innerText = "❌ Failed to send!";
    });
}

// Student Submit
document.getElementById("studentForm").addEventListener("submit", function(e){
    e.preventDefault();

    let data = {
        type: "Student Internship",
        name: s_name.value,
        phone: s_phone.value,
        enrollment: s_enroll.value,
        degree: s_degree.value,
        payment: s_payment.value
    };

    sendEmail(data);
});

// Farmer Submit
document.getElementById("farmerForm").addEventListener("submit", function(e){
    e.preventDefault();

    let data = {
        type: "Farmer Visit",
        name: f_name.value,
        phone: f_phone.value,
        date: f_date.value,
        payment: f_payment.value
    };

    sendEmail(data);
});



