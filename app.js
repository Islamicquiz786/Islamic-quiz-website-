// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBasuAzvAlaVAayEdDU9bB9wvUzG7fVuAg",
  authDomain: "islamic-quiz-website.firebaseapp.com",
  databaseURL: "https://islamic-quiz-website-default-rtdb.firebaseio.com",
  projectId: "islamic-quiz-website",
  storageBucket: "islamic-quiz-website.firebasestorage.app",
  messagingSenderId: "517259698394",
  appId: "1:517259698394:web:36094d8d03187da81685e3"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

// Check authentication state
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        showSection('dashboard');
        loadSettings();
    } else {
        // User is signed out
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('adminPanel').style.display = 'none';
    }
});

// Login function
function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorElement = document.getElementById('loginError');

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Signed in successfully
            errorElement.textContent = '';
        })
        .catch((error) => {
            errorElement.textContent = error.message;
        });
}

// Logout function
function logout() {
    auth.signOut().then(() => {
        // Sign-out successful
    }).catch((error) => {
        console.error('Logout error:', error);
    });
}

// Function to show different sections
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show the selected section
    document.getElementById(sectionId).style.display = 'block';
    
    // Load data for the section if needed
    if(sectionId === 'users') {
        loadUsers();
    } else if(sectionId === 'withdrawals') {
        loadWithdrawals();
    } else if(sectionId === 'dashboard') {
        updateDashboard();
    }
}

// User management functions
function showAddUserForm() {
    document.getElementById('addUserForm').style.display = 'block';
}

function hideAddUserForm() {
    document.getElementById('addUserForm').style.display = 'none';
}

function addUser() {
    const name = document.getElementById('newUserName').value;
    const email = document.getElementById('newUserEmail').value;
    const password = document.getElementById('newUserPassword').value;
    const balance = parseFloat(document.getElementById('newUserBalance').value) || 0;

    // Create user in Firebase Authentication
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const userId = userCredential.user.uid;
            
            // Add user to Realtime Database
            database.ref('users/' + userId).set({
                name: name,
                email: email,
                balance: balance,
                status: "active",
                createdAt: firebase.database.ServerValue.TIMESTAMP
            }).then(() => {
                alert('User added successfully!');
                hideAddUserForm();
                loadUsers();
                updateDashboard();
            });
        })
        .catch((error) => {
            alert('Error adding user: ' + error.message);
        });
}

function loadUsers() {
    const tableBody = document.querySelector('#usersTable tbody');
    tableBody.innerHTML = '';
    
    database.ref('users').once('value').then((snapshot) => {
        snapshot.forEach((childSnapshot) => {
            const user = childSnapshot.val();
            const userId = childSnapshot.key;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${userId.substring(0, 8)}</td>
                <td>${user.name || ''}</td>
                <td>${user.email || ''}</td>
                <td>$${user.balance || 0}</td>
                <td>${user.status || 'active'}</td>
                <td>
                    <button onclick="editUser('${userId}')">Edit</button>
                    <button onclick="deleteUser('${userId}')">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    });
}

function editUser(userId) {
    const newName = prompt("Enter new name:");
    if (newName) {
        database.ref('users/' + userId).update({
            name: newName
        }).then(() => {
            loadUsers();
        });
    }
}

function deleteUser(userId) {
    if (confirm("Are you sure you want to delete this user?")) {
        // Delete from Authentication
        auth.currentUser.delete().then(() => {
            // Delete from Realtime Database
            database.ref('users/' + userId).remove().then(() => {
                loadUsers();
                updateDashboard();
            });
        }).catch((error) => {
            alert('Error deleting user: ' + error.message);
        });
    }
}

// Withdrawal management functions
function loadWithdrawals() {
    const tableBody = document.querySelector('#withdrawalsTable tbody');
    tableBody.innerHTML = '';
    
    database.ref('withdrawals').once('value').then((snapshot) => {
        snapshot.forEach((childSnapshot) => {
            const withdrawal = childSnapshot.val();
            const withdrawalId = childSnapshot.key;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${withdrawalId.substring(0, 8)}</td>
                <td>${withdrawal.userName || 'Unknown'}</td>
                <td>$${withdrawal.amount || 0}</td>
                <td>${withdrawal.method || 'N/A'}</td>
                <td>${withdrawal.status || 'pending'}</td>
                <td>${new Date(withdrawal.date).toLocaleDateString() || 'N/A'}</td>
                <td>
                    <button onclick="approveWithdrawal('${withdrawalId}')">Approve</button>
                    <button onclick="rejectWithdrawal('${withdrawalId}')">Reject</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    });
}

function approveWithdrawal(withdrawalId) {
    database.ref('withdrawals/' + withdrawalId).update({
        status: 'approved',
        processedAt: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
        loadWithdrawals();
        updateDashboard();
    });
}

function rejectWithdrawal(withdrawalId) {
    database.ref('withdrawals/' + withdrawalId).update({
        status: 'rejected',
        processedAt: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
        loadWithdrawals();
        updateDashboard();
    });
}

// Dashboard functions
function updateDashboard() {
    // Count total users
    database.ref('users').once('value').then((snapshot) => {
        document.getElementById('totalUsers').textContent = snapshot.numChildren();
        
        // Count active users
        let activeCount = 0;
        snapshot.forEach((childSnapshot) => {
            const user = childSnapshot.val();
            if (user.status === 'active') {
                activeCount++;
            }
        });
        document.getElementById('activeUsers').textContent = activeCount;
    });
    
    // Count pending withdrawals
    database.ref('withdrawals').once('value').then((snapshot) => {
        let pendingCount = 0;
        snapshot.forEach((childSnapshot) => {
            const withdrawal = childSnapshot.val();
            if (withdrawal.status === 'pending') {
                pendingCount++;
            }
        });
        document.getElementById('pendingWithdrawals').textContent = pendingCount;
    });
    
    // Calculate total earnings
    database.ref('users').once('value').then((snapshot) => {
        let totalEarnings = 0;
        snapshot.forEach((childSnapshot) => {
            const user = childSnapshot.val();
            totalEarnings += user.balance || 0;
        });
        document.getElementById('totalEarnings').textContent = '$' + totalEarnings.toFixed(2);
    });
}

// Settings functions
function loadSettings() {
    database.ref('settings').once('value').then((snapshot) => {
        const settings = snapshot.val() || {};
        document.getElementById('siteName').value = settings.siteName || 'Earning App';
        document.getElementById('minWithdrawal').value = settings.minWithdrawal || 50;
        document.getElementById('referralBonus').value = settings.referralBonus || 10;
    });
}

function saveSettings() {
    const settings = {
        siteName: document.getElementById('siteName').value,
        minWithdrawal: parseFloat(document.getElementById('minWithdrawal').value) || 50,
        referralBonus: parseFloat(document.getElementById('referralBonus').value) || 10
    };
    
    database.ref('settings').set(settings).then(() => {
        alert('Settings saved successfully!');
    });
}