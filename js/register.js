import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBasuAzvAlaVAayEdDU9bB9wvUzG7fVuAg",
  authDomain: "islamic-quiz-website.firebaseapp.com",
  projectId: "islamic-quiz-website",
  storageBucket: "islamic-quiz-website.appspot.com",
  messagingSenderId: "517259698394",
  appId: "1:517259698394:web:36094d03187da81685e3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);

document.getElementById("payment").addEventListener("change", function () {
  const details = document.getElementById("paymentDetails");
  if (this.value === "easypaisa" || this.value === "jazzcash") {
    details.style.display = "block";
    document.getElementById("screenshot").required = true;
    document.getElementById("accountNumber").required = true;
    document.getElementById("accountName").required = true;
  } else {
    details.style.display = "none";
  }
});

document.getElementById("registerForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const whatsapp = document.getElementById("whatsapp").value.trim();
  const plan = document.getElementById("plan").value;
  const payment = document.getElementById("payment").value;
  const accountNumber = document.getElementById("accountNumber").value.trim();
  const accountName = document.getElementById("accountName").value.trim();
  const screenshot = document.getElementById("screenshot").files[0];

  if (username.length < 1 || username.length > 10) return showError("usernameError", "Username must be 1 to 10 characters");
  if (!/^03\\d{9}$/.test(whatsapp)) return showError("whatsappError", "Invalid WhatsApp number");
  if (password.length < 1 || password.length > 10) return showError("passwordError", "Password must be 1 to 10 characters");
  if (password !== confirmPassword) return showError("confirmError", "Passwords do not match");

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await sendEmailVerification(user);

    let screenshotUrl = "";
    if (screenshot) {
      const refPath = storageRef(storage, `payment_screenshots/${user.uid}/${screenshot.name}`);
      await uploadBytes(refPath, screenshot);
      screenshotUrl = await getDownloadURL(refPath);
    }

    await set(ref(database, 'users/' + user.uid), {
      username,
      email,
      whatsapp,
      plan,
      paymentMethod: payment,
      accountNumber,
      accountName,
      paymentScreenshot: screenshotUrl,
      registrationDate: new Date().toISOString(),
      status: "pending",
      balance: 0,
      emailVerified: false
    });

    const msg = document.getElementById("successMessage");
    msg.innerHTML = `
      ✅ <strong>Registration Successful!</strong><br><br>
      A verification link has been sent to <strong>${email}</strong>.<br>
      Please verify your email and wait for admin approval.<br><br>
      Once approved, you will be redirected to dashboard.html.
    `;
    msg.style.display = "block";
    document.getElementById("registerForm").reset();
    document.getElementById("paymentDetails").style.display = "none";
  } catch (error) {
    showError("emailError", error.message);
  }
});

function showError(id, message) {
  const el = document.getElementById(id);
  el.textContent = message;
  el.style.display = "block";
}
