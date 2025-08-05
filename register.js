import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-register.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    sendEmailVerification,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBasuAzvAlaVAayEdDU9bB9wvUzG7fVuAg",
    authDomain: "islamic-quiz-website.firebaseapp.com",
    databaseURL: "https://islamic-quiz-website-default-rtdb.firebaseio.com",
    projectId: "islamic-quiz-website",
    storageBucket: "islamic-quiz-website.appspot.com",
    messagingSenderId: "517259698394",
    appId: "1:517259698394:web:36094d03187da81685e3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);

// Payment Method Toggle
document.getElementById("payment").addEventListener("change", function() {
    const paymentDetails = document.getElementById("paymentDetails");
    if (this.value === "easypaisa" || this.value === "jazzcash") {
        paymentDetails.style.display = "block";
    } else {
        paymentDetails.style.display = "none";
    }
});

// WhatsApp Number Validation (03XXXXXXXXX)
document.getElementById('whatsapp').addEventListener('input', function(e) {
    let value = this.value.replace(/[^0-9]/g, '');
    if (!value.startsWith('03')) {
        value = '03' + value.substring(2);
    }
    this.value = value.substring(0, 11);
    
    const isValid = /^03\d{9}$/.test(this.value);
    document.getElementById('whatsappError').style.display = isValid ? 'none' : 'block';
});

// Account Number Validation (03XXXXXXXXX)
document.getElementById('accountNumber').addEventListener('input', function(e) {
    let value = this.value.replace(/[^0-9]/g, '');
    if (!value.startsWith('03')) {
        value = '03' + value.substring(2);
    }
    this.value = value.substring(0, 11);
    
    const isValid = /^03\d{9}$/.test(this.value);
    document.getElementById('accountError').style.display = isValid ? 'none' : 'block';
});

// Form Submission
document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // Reset errors
    document.querySelectorAll('.error-message').forEach(el => {
        el.style.display = 'none';
        el.textContent = '';
    });

    // Get form values
    const formData = {
        username: document.getElementById("username").value.trim(),
        email: document.getElementById("email").value.trim(),
        password: document.getElementById("password").value,
        whatsapp: document.getElementById("whatsapp").value.trim(),
        plan: document.getElementById("plan").value,
        paymentMethod: document.getElementById("payment").value,
        accountNumber: document.getElementById("accountNumber")?.value.trim(),
        accountName: document.getElementById("accountName")?.value.trim(),
        screenshot: document.getElementById("screenshot")?.files[0]
    };

    // Validate WhatsApp
    if (!/^03\d{9}$/.test(formData.whatsapp)) {
        document.getElementById("whatsappError").textContent = "Must be 11 digits starting with 03";
        document.getElementById("whatsappError").style.display = "block";
        return;
    }

    // Validate Account Number if payment method selected
    if (document.getElementById("paymentDetails").style.display === "block" && 
        !/^03\d{9}$/.test(formData.accountNumber)) {
        document.getElementById("accountError").textContent = "Must be 11 digits starting with 03";
        document.getElementById("accountError").style.display = "block";
        return;
    }

    try {
        // Create user account
        const userCredential = await createUserWithEmailAndPassword(
            auth, 
            formData.email, 
            formData.password
        );
        const user = userCredential.user;

        // Send verification email
        await sendEmailVerification(user);

        // Upload payment screenshot if exists
        let screenshotUrl = "";
        if (formData.screenshot) {
            const fileRef = storageRef(storage, `payments/${user.uid}/${formData.screenshot.name}`);
            await uploadBytes(fileRef, formData.screenshot);
            screenshotUrl = await getDownloadURL(fileRef);
        }

        // Save user data
        await set(ref(database, `users/${user.uid}`), {
            username: formData.username,
            email: formData.email,
            whatsapp: formData.whatsapp,
            plan: formData.plan,
            paymentMethod: formData.paymentMethod,
            accountNumber: formData.accountNumber || "",
            accountName: formData.accountName || "",
            paymentScreenshot: screenshotUrl,
            registrationDate: new Date().toISOString(),
            status: "pending",
            balance: 0,
            emailVerified: false
        });

        // Show success message
        document.getElementById('registerForm').style.display = 'none';
        document.getElementById('verificationMessage').style.display = 'block';

    } catch (error) {
        console.error("Registration error:", error);
        let errorMessage = "Registration failed. Please try again.";
        
        if (error.code === "auth/email-already-in-use") {
            errorMessage = "Email is already registered";
        } else if (error.code === "auth/invalid-email") {
            errorMessage = "Invalid email address";
        } else if (error.code === "auth/weak-password") {
            errorMessage = "Password should be at least 6 characters";
        }
        
        document.getElementById("emailError").textContent = errorMessage;
        document.getElementById("emailError").style.display = "block";
    }
});

// Handle post-verification redirect
onAuthStateChanged(auth, (user) => {
    if (user && user.emailVerified) {
        // Update database
        set(ref(database, `users/${user.uid}/emailVerified`), true);
        
        // Show success message
        document.getElementById('verificationMessage').style.display = 'none';
        document.getElementById('successMessage').style.display = 'block';
        
        // Start countdown
        let seconds = 5;
        const countdownElement = document.getElementById('countdown');
        const timer = setInterval(() => {
            seconds--;
            countdownElement.textContent = seconds;
            if (seconds <= 0) {
                clearInterval(timer);
                window.location.href = "dashboard.html";
            }
        }, 1000);
    }
});

