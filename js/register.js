import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  sendEmailVerification 
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  addDoc,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCOTwS-H0NQmj6-jDNAlFzu4Yv81f86tTU",
  authDomain: "islamic-quiz-fe72f.firebaseapp.com",
  databaseURL: "https://islamic-quiz-fe72f-default-rtdb.firebaseio.com",
  projectId: "islamic-quiz-fe72f",
  storageBucket: "islamic-quiz-fe72f.appspot.com",
  messagingSenderId: "523541510921",
  appId: "1:523541510921:web:b78005ef3bc1f1a14a31d8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const registrationForm = document.getElementById('registrationForm');
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const submitBtn = document.getElementById('submitBtn');
const messageContainer = document.getElementById('messageContainer');
const accountDetails = document.getElementById('accountDetails');

// Error Elements
const usernameError = document.getElementById('usernameError');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const confirmPasswordError = document.getElementById('confirmPasswordError');
const whatsappError = document.getElementById('whatsappError');
const planError = document.getElementById('plan-error');
const paymentMethodError = document.getElementById('paymentMethodError');

// Toggle plan selection
window.togglePlanSelection = function() {
  const plansContainer = document.getElementById('plans-container');
  plansContainer.style.display = plansContainer.style.display === 'none' ? 'block' : 'none';
}

// Select plan
window.selectPlan = function(amount) {
  document.getElementById('selected-plan').value = amount;
  document.getElementById('selected-plan-text').textContent = amount + ' PKR Plan';
  document.getElementById('plans-container').style.display = 'none';
  planError.style.display = 'none';
}

// Select payment method
window.selectPaymentMethod = function(method) {
  document.getElementById('paymentMethod').value = method;
  const buttons = document.querySelectorAll('.payment-options button');
  buttons.forEach(btn => {
    btn.classList.remove('active');
    if (btn.textContent === method) {
      btn.classList.add('active');
    }
  });
  paymentMethodError.style.display = 'none';
  accountDetails.style.display = 'block';
}

// Show error message
function showError(input, errorElement, message) {
  input.classList.add('error');
  errorElement.textContent = message;
  errorElement.style.display = 'block';
}

// Hide error message
function hideError(input, errorElement) {
  input.classList.remove('error');
  errorElement.style.display = 'none';
}

// Show success message
function showSuccess(message) {
  messageContainer.innerHTML = `<div class="success-message">${message}</div>`;
}

// Show loading state
function setLoading(button, isLoading) {
  if (isLoading) {
    button.classList.add('loading');
    button.disabled = true;
  } else {
    button.classList.remove('loading');
    button.disabled = false;
  }
}

// Validate username
function validateUsername() {
  const username = document.getElementById('username').value;
  if (username.length > 12) {
    showError(document.getElementById('username'), usernameError, 'Username must be 12 letters or less');
    return false;
  }
  hideError(document.getElementById('username'), usernameError);
  return true;
}

// Validate email
function validateEmail() {
  const email = document.getElementById('email').value;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError(document.getElementById('email'), emailError, 'Please enter a valid email address');
    return false;
  }
  hideError(document.getElementById('email'), emailError);
  return true;
}

// Validate password
function validatePassword() {
  const password = document.getElementById('password').value;
  if (password.length > 10) {
    showError(document.getElementById('password'), passwordError, 'Password must be 10 characters or less');
    return false;
  }
  hideError(document.getElementById('password'), passwordError);
  return true;
}

// Validate confirm password
function validateConfirmPassword() {
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
    
  if (password !== confirmPassword) {
    showError(document.getElementById('confirmPassword'), confirmPasswordError, 'Passwords do not match');
    return false;
  }
  hideError(document.getElementById('confirmPassword'), confirmPasswordError);
  return true;
}

// Validate WhatsApp number
function validateWhatsApp() {
  const whatsapp = document.getElementById('whatsapp').value;
  if (!/^03\d{9}$/.test(whatsapp)) {
    showError(document.getElementById('whatsapp'), whatsappError, 'Invalid WhatsApp number (must start with 03 and 11 digits)');
    return false;
  }
  hideError(document.getElementById('whatsapp'), whatsappError);
  return true;
}

// Validate plan selection
function validatePlan() {
  const plan = document.getElementById('selected-plan').value;
  if (!plan) {
    planError.style.display = 'block';
    return false;
  }
  planError.style.display = 'none';
  return true;
}

// Validate payment method
function validatePaymentMethod() {
  const method = document.getElementById('paymentMethod').value;
  if (!method) {
    paymentMethodError.style.display = 'block';
    return false;
  }
  paymentMethodError.style.display = 'none';
  return true;
}

// Form submission
submitBtn.addEventListener('click', async () => {
  if (!validateUsername() || !validatePassword() || 
      !validateConfirmPassword() || !validateWhatsApp() || 
      !validateEmail() || !validatePlan() || !validatePaymentMethod()) {
    return;
  }

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const username = document.getElementById('username').value;
  const whatsapp = document.getElementById('whatsapp').value;
  const plan = document.getElementById('selected-plan').value;
  const paymentMethod = document.getElementById('paymentMethod').value;
  const accountNumber = document.getElementById('accountNumber').value;
  const accountName = document.getElementById('accountName').value;
  const screenshot = document.getElementById('screenshot').files[0];

  try {
    setLoading(submitBtn, true);
      
    // Check if username already exists
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);
      
    if (!querySnapshot.empty) {
      showError(document.getElementById('username'), usernameError, 'This username is already taken');
      setLoading(submitBtn, false);
      return;
    }

    // Create user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Send verification email
    await sendEmailVerification(user);

    // Save user data to Firestore
    await addDoc(collection(db, "users"), {
      uid: user.uid,
      username,
      email,
      whatsapp,
      plan,
      paymentMethod,
      accountNumber,
      accountName,
      status: "pending",
      registrationDate: new Date(),
      screenshot: screenshot.name,
      emailVerified: false
    });

    // Show success message and hide form
    step1.classList.add('hidden');
    step2.classList.remove('hidden');
      
  } catch (error) {
    let errorMessage = 'Registration failed';
      
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'This email is already registered';
      showError(document.getElementById('email'), emailError, errorMessage);
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password should be at least 6 characters';
      showError(document.getElementById('password'), passwordError, errorMessage);
    }
      
    showSuccess(`❌ ${errorMessage}`);
  } finally {
    setLoading(submitBtn, false);
  }
});

// Real-time validation
document.getElementById('username').addEventListener('input', validateUsername);
document.getElementById('email').addEventListener('input', validateEmail);
document.getElementById('password').addEventListener('input', validatePassword);
document.getElementById('confirmPassword').addEventListener('input', validateConfirmPassword);
document.getElementById('whatsapp').addEventListener('input', validateWhatsApp);￼Enterimport { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  sendEmailVerification 
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  addDoc,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCOTwS-H0NQmj6-jDNAlFzu4Yv81f86tTU",
  authDomain: "islamic-quiz-fe72f.firebaseapp.com",
  databaseURL: "https://islamic-quiz-fe72f-default-rtdb.firebaseio.com",
  projectId: "islamic-quiz-fe72f",
  storageBucket: "islamic-quiz-fe72f.appspot.com",
  messagingSenderId: "523541510921",
  appId: "1:523541510921:web:b78005ef3bc1f1a14a31d8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const registrationForm = document.getElementById('registrationForm');
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const submitBtn = document.getElementById('submitBtn');
const messageContainer = document.getElementById('messageContainer');
const accountDetails = document.getElementById('accountDetails');

// Error Elements
const usernameError = document.getElementById('usernameError');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const confirmPasswordError = document.getElementById('confirmPasswordError');
const whatsappError = document.getElementById('whatsappError');
const planError = document.getElementById('plan-error');
const paymentMethodError = document.getElementById('paymentMethodError');

// Toggle plan selection
window.togglePlanSelection = function() {
  const plansContainer = document.getElementById('plans-container');
sContainer.style.display = plansContainer.style.display === 'none' ? 'block' : 'none';
}

// Select plan
window.selectPlan = function(amount) {
  document.getElementById('selected-plan').value = amount;
  document.getElementById('selected-plan-text').textContent = amount + ' PKR Plan';
  document.getElementById('plans-container').style.display = 'none';
  planError.style.display = 'none';
}

// Select payment method
window.selectPaymentMethod = function(method) {
  document.getElementById('paymentMethod').value = method;
  const buttons = document.querySelectorAll('.payment-options button');
  buttons.forEach(btn => {
    btn.classList.remove('active');
    if (btn.textContent === method) {
      btn.classList.add('active');
    }
  });
  paymentMethodError.style.display = 'none';
  accountDetails.style.display = 'block';
}

// Show error message
function showError(input, errorElement, message) {
  input.classList.add('error');
  errorElement.textContent = message;
  errorElement.style.display = 'block';
}

// Hide error message
function hideError(input, errorElement) {
  input.classList.remove('error');
  errorElement.style.display = 'none';
}

// Show success message
function showSuccess(message) {
  messageContainer.innerHTML = `<div class="success-message">${message}</div>`;
}

// Show loading state
function setLoading(button, isLoading) {
  if (isLoading) {
    button.classList.add('loading');
    button.disabled = true;
  } else {
    button.classList.remove('loading');
    button.disabled = false;
  }
}

// Validate username
function validateUsername() {
  const username = document.getElementById('username').value;
  if (username.length > 12) {
    showError(document.getElementById('username'), usernameError, 'Username must be 12 letters or less');
    return false;
  }
  hideError(document.getElementById('username'), usernameError);
  return true;
}

// Validate email
function validateEmail() {
  const email = document.getElementById('email').value;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError(document.getElementById('email'), emailError, 'Please enter a valid email address');
    return false;
  }
  hideError(document.getElementById('email'), emailError);
  return true;
}

// Validate password
function validatePassword() {
  const password = document.getElementById('password').value;
  if (password.length > 10) {
    showError(document.getElementById('password'), passwordError, 'Password must be 10 characters or less');
    return false;
  }
  hideError(document.getElementById('password'), passwordError);
  return true;
}

// Validate confirm password
function validateConfirmPassword() {
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
    
  if (password !== confirmPassword) {
    showError(document.getElementById('confirmPassword'), confirmPasswordError, 'Passwords do not match');
    return false;
  }
  hideError(document.getElementById('confirmPassword'), confirmPasswordError);
  return true;
}

// Validate WhatsApp number
function validateWhatsApp() {
  const whatsapp = document.getElementById('whatsapp').value;
  if (!/^03\d{9}$/.test(whatsapp)) {
    showError(document.getElementById('whatsapp'), whatsappError, 'Invalid WhatsApp number (must start with 03 and 11 digits)');
    return false;
  }
