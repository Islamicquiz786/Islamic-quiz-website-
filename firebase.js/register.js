import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";    
import {   
  getAuth,   
  createUserWithEmailAndPassword,   
  sendEmailVerification,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";    
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";    
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";    

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBasuAzvAlaVAayEdDU9bB9wvUzG7fVuAg",
  authDomain: "islamic-quiz-website.firebaseapp.com",
  databaseURL: "https://islamic-quiz-website-default-rtdb.firebaseio.com",
  projectId: "islamic-quiz-website",
  storageBucket: "islamic-quiz-website.appspot.com",
  messagingSenderId: "517259698394",
  appId: "1:517259698394:web:36094d03187da81685e3"
};

try {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);    
  const auth = getAuth(app);    
  const database = getDatabase(app);    
  const storage = getStorage(app);    

  // Check if user is already logged in or verified
  onAuthStateChanged(auth, (user) => {
    if (user) {
      if (user.emailVerified) {
        const userRef = ref(database, 'users/' + user.uid);
        onValue(userRef, (snapshot) => {
          const userData = snapshot.val();
          if (userData && userData.status === "approved") {
            setTimeout(() => {
              window.location.href = "dashboard.html";
            }, 1000);
          } else {
            document.getElementById("successMessage").innerHTML = `
              <h3>📩 Account Registration Successful!</h3>
              <p>Your account has been registered successfully.</p>
              <p>Our admin team will review and verify your details shortly.</p>
              <p>Once your account is approved, you will be granted access to the dashboard.</p>
              <p>Thank you for joining Islamic Quiz — a step towards knowledge, faith, and halal earning.</p>
            `;
            document.getElementById("successMessage").style.display = "block";
            document.getElementById("registerForm").style.display = "none";
            
            setTimeout(() => {
              window.location.href = "index.html";
            }, 60000);
          }
        });
      }
    }
  });

  // Real-time validation for username (10 characters)  
  document.getElementById('username').addEventListener('input', function(e) {  
    if (this.value.length > 10) {  
      this.value = this.value.slice(0, 10);  
      document.getElementById('usernameError').textContent = 'Username must be exactly 10 characters';  
      document.getElementById('usernameError').style.display = 'block';  
    } else {  
      document.getElementById('usernameError').style.display = 'none';  
    }  
  });  

  // WhatsApp number validation
  document.getElementById('whatsapp').addEventListener('input', function(e) {
    this.value = this.value.replace(/[^0-9]/g, '');
    if (!this.value.startsWith('03') && this.value.length > 0) {
      this.value = '03' + this.value.replace(/^03/, '');
    }
    if (this.value.length > 11) {
      this.value = this.value.slice(0, 11);
    }
    if (this.value.length > 0 && !/^03\d{9}$/.test(this.value)) {
      document.getElementById('whatsappError').textContent = 'Must start with 03 and be 11 digits total';
      document.getElementById('whatsappError').style.display = 'block';
    } else {
      document.getElementById('whatsappError').style.display = 'none';
    }
  });

  // Password validation
  document.getElementById('password').addEventListener('input', function(e) {  
    if (this.value.length > 10) {  
      this.value = this.value.slice(0, 10);  
      document.getElementById('passwordError').textContent = 'Password must be 10 characters or less';  
      document.getElementById('passwordError').style.display = 'block';  
    } else {  
      document.getElementById('passwordError').style.display = 'none';  
    }  
  });  

  // Show payment details when payment method is selected    
  document.getElementById("payment").addEventListener("change", function() {    
    const paymentDetails = document.getElementById("paymentDetails");    
    if (this.value === "easypaisa" || this.value === "jazzcash") {    
      paymentDetails.style.display = "block";    
      document.getElementById("screenshot").required = true;    
      document.getElementById("accountNumber").required = true;    
      document.getElementById("accountName").required = true;    
    } else {    
      paymentDetails.style.display = "none";    
      document.getElementById("screenshot").required = false;    
      document.getElementById("accountNumber").required = false;    
      document.getElementById("accountName").required = false;    
    }    
  });  

  // Form submission
  document.getElementById("registerForm").addEventListener("submit", async (e) => {    
    e.preventDefault();    
        
    // Reset error messages    
    document.querySelectorAll('.error-message').forEach(el => {    
      el.style.display = 'none';    
      el.textContent = '';    
    });    
        
    // Get form values    
    const username = document.getElementById("username").value.trim();    
    const email = document.getElementById("email").value.trim();    
    const password = document.getElementById("password").value;    
    const whatsapp = document.getElementById("whatsapp").value.trim();    
    const plan = document.getElementById("plan").value;    
    const payment = document.getElementById("payment").value;    
    const accountNumber = document.getElementById("accountNumber")?.value.trim();    
    const accountName = document.getElementById("accountName")?.value.trim();    
    const screenshot = document.getElementById("screenshot")?.files[0];    
        
    // Validate username (exactly 10 characters)  
    if (username.length !== 10) {  
      document.getElementById("usernameError").textContent = "Username must be exactly 10 characters";  
      document.getElementById("usernameError").style.display = "block";  
      return;  
    }  

    // Validate WhatsApp number (03XXXXXXXXX)  
    if (!/^03\d{9}$/.test(whatsapp)) {  
      document.getElementById("whatsappError").textContent = "Invalid WhatsApp number (must be 03XXXXXXXXX)";  
      document.getElementById("whatsappError").style.display = "block";  
      return;  
    }  
        
    // Validate password (max 10 characters)  
    if (password.length > 10) {  
      document.getElementById("passwordError").textContent = "Password must be 10 characters or less";  
      document.getElementById("passwordError").style.display = "block";  
      return;  
    }  
        
    try {    
      // Create user with Firebase Auth    
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);    
      const user = userCredential.user;    
          
      // Send email verification  
      await sendEmailVerification(user);  
          
      // Upload payment screenshot if exists    
      let screenshotUrl = "";    
      if (screenshot) {    
        const screenshotRef = storageRef(storage, `payment_screenshots/${user.uid}/${screenshot.name}`);    
        await uploadBytes(screenshotRef, screenshot);    
        screenshotUrl = await getDownloadURL(screenshotRef);    
      }    
          
      // Save user data to Realtime Database    
      await set(ref(database, 'users/' + user.uid), {    
        username: username,    
        email: email,    
        whatsapp: whatsapp,    
        plan: plan,    
        paymentMethod: payment,    
        accountNumber: accountNumber || "",    
        accountName: accountName || "",    
        paymentScreenshot: screenshotUrl,    
        registrationDate: new Date().toISOString(),    
        status: "pending",    
        balance: 0,  
        emailVerified: false  
      });    
          
      // Show success message    
      document.getElementById("successMessage").innerHTML = `  
        <h3>📩 Verification Email Sent!</h3>  
        <p>A verification link has been sent to your email (${email}).</p>  
        <p>Please check your inbox and verify your email address to complete registration.</p>  
        <p><strong>Note:</strong> Your account will be fully activated after admin verification.</p>  
        <p>You will be redirected to login page shortly...</p>  
      `;    
      document.getElementById("successMessage").style.display = "block";    
      document.getElementById("registerForm").style.display = "none";    
          
      // Redirect to login page after 1 minute
      setTimeout(() => {
        window.location.href = "index.html";
      }, 60000);
          
    } catch (error) {    
      console.error("Registration error:", error);  
      let errorMessage = "Registration failed!";    
      switch (error.code) {    
        case "auth/email-already-in-use":    
          errorMessage = "Email is already registered (1 account per email allowed)";    
          document.getElementById("emailError").textContent = errorMessage;    
          document.getElementById("emailError").style.display = "block";    
          break;    
        case "auth/invalid-email":    
          errorMessage = "Invalid email address";    
          document.getElementById("emailError").textContent = errorMessage;    
          document.getElementById("emailError").style.display = "block";    
          break;    
        case "auth/weak-password":    
          errorMessage = "Password must be at least 6 characters";    
          document.getElementById("passwordError").textContent = errorMessage;    
          document.getElementById("passwordError").style.display = "block";    
          break;    
        default:    
          document.getElementById("emailError").textContent = errorMessage + ": " + error.message;    
          document.getElementById("emailError").style.display = "block";    
      }    
    }    
  });    

} catch (error) {
  console.error("Firebase initialization error:", error);
  document.getElementById("emailError").textContent = "System error. Please try again later.";
  document.getElementById("emailError").style.display = "block";
              }
