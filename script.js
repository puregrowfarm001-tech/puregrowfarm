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
        const message=document.getElementById('message').value.trim();
        const address=document.getElementById('address').value.trim();
        const quantity=document.getElementById('quantity').value.trim();

        if(!/^[0-9]{10}$/.test(phone)){
          alert('Please enter a valid 10-digit phone number (numbers only).');
          return;
        }

        const body = `Name: ${name}\nPhone: ${phone}\nProduct: ${product}\nMessage: ${message}\naddress: ${address}\nquantity: ${quantity}`;
        const mailto = `mailto:puregrowfarm001@gmail.com?subject=Order%20from%20website&body=${encodeURIComponent(body)}`;
        window.location.href = mailto;
    }