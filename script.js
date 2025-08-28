/* ===========
   Data & init (transparent PNGs)
   =========== */
const PRODUCTS = [
  { id: "lap1", name: "Acer Aspire Laptop", brand: "Acer", price: 65000, image: "https://pngimg.com/d/laptop_PNG101763.png" },
  { id: "m1", name: "Television", brand: "JVC", price: 30000, image: "https://pngimg.com/uploads/monitor/laptop_PNG5887.png" },
  { id: "mon1", name: "LG Ultra Monitor", brand: "LG", price: 22000, image: "https://pngimg.com/uploads/monitor/laptop_PNG5874.png" },
  { id: "pr1", name: "Samsung Laser Printer", brand: "Samsung", price: 15000, image: "https://pngimg.com/d/printer_PNG7740.png" }
];

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let users = JSON.parse(localStorage.getItem("users")) || [];

/* ===========
   Helpers
   =========== */
const getCurrentUser = () => { try { return JSON.parse(localStorage.getItem("currentUser")) || null; } catch { return null; } };
const setCurrentUser = (u) => localStorage.setItem("currentUser", JSON.stringify(u));
const isLoggedIn = () => localStorage.getItem("loggedIn") === "true";

function showLoader() { const l = document.getElementById("loader"); if (l) l.style.display = "flex"; }
function hideLoader() { const l = document.getElementById("loader"); if (l) l.style.display = "none"; }

function showToast(message, variant = "primary") {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast align-items-center text-bg-${variant} border-0 show mb-2`;
  toast.style.minWidth = "220px";
  toast.innerHTML = `<div class="d-flex"><div class="toast-body">${message}</div>
    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
  container.appendChild(toast);
  setTimeout(() => { toast.remove(); }, 3500);
}

/* Navbar state */
function wireNavAuth() {
  const profileDropdown = document.getElementById("profileDropdown");
  const loginNav = document.getElementById("loginNav");
  const navUsername = document.getElementById("navUsername");
  const logoutBtn = document.getElementById("logoutBtn");

  if (isLoggedIn()) {
    const u = getCurrentUser();
    if (navUsername && u) navUsername.textContent = u.username;
    if (profileDropdown) profileDropdown.classList.remove("d-none");
    if (loginNav) loginNav.classList.add("d-none");
    if (logoutBtn) logoutBtn.onclick = logoutUser;
  } else {
    if (profileDropdown) profileDropdown.classList.add("d-none");
    if (loginNav) loginNav.classList.remove("d-none");
  }
}

/* Protect pages */
function protectPages() {
  const path = window.location.pathname.split("/").pop().toLowerCase();
  const locked = ["index.html", "orders.html"];
  if (locked.includes(path) && !isLoggedIn()) {
    window.location.href = "login.html";
  }
}

/* ===========
   Cart / Products
   =========== */
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}
function updateCartCount() {
  const el = document.getElementById("cartCount");
  if (el) el.textContent = cart.reduce((s, i) => s + (i.qty || 1), 0);
}

function renderProducts() {
  const grid = document.getElementById("productGrid");
  if (!grid) return;
  grid.innerHTML = PRODUCTS.map(p => `
    <div class="col-12 col-sm-6 col-md-4 col-lg-3">
      <div class="card product-card h-100">
        <img src="${p.image}" class="card-img-top" alt="${p.name}">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title mb-1 text-white">${p.brand}</h5>
          <p class="card-text mb-2 text-white-75">${p.name}</p>
          <div class="mt-auto d-flex justify-content-between align-items-center">
            <div class="fw-bold text-white">₹${p.price}</div>
            <button class="btn btn-sm btn-info ripple" onclick="addToCart('${p.id}')">Add</button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function addToCart(id) {
  const product = PRODUCTS.find(p => p.id === id);
  if (!product) return;
  const existing = cart.find(i => i.id === id);
  if (existing) existing.qty += 1; else cart.push({ ...product, qty: 1 });
  saveCart();
  showToast(`Added ${product.name} to cart`, "success");
}

function renderCart() {
  const wrap = document.getElementById("cartContainer");
  if (!wrap) return;
  if (cart.length === 0) {
    wrap.innerHTML = `<p class="text-white-75">Your cart is empty.</p>`;
    return;
  }
  const itemsHtml = cart.map((item, idx) => `
    <li class="list-group-item d-flex align-items-center justify-content-between list-item-glass">
      <div class="d-flex align-items-center gap-3">
        <img src="${item.image}" class="cart-img" alt="${item.name}">
        <div>
          <div class="fw-semibold text-white">${item.name}</div>
          <small class="text-white-75">₹${item.price}</small>
        </div>
      </div>
      <div class="d-flex align-items-center gap-2">
        <button class="btn btn-sm btn-outline-light" onclick="changeQty(${idx}, -1)">−</button>
        <span class="fw-bold text-white">${item.qty}</span>
        <button class="btn btn-sm btn-outline-light" onclick="changeQty(${idx}, 1)">+</button>
        <button class="btn btn-sm btn-danger ms-2" onclick="removeFromCart(${idx})">Remove</button>
      </div>
    </li>
  `).join('');
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  wrap.innerHTML = `<ul class="list-group mb-3">${itemsHtml}</ul>
    <div class="d-flex justify-content-between align-items-center">
      <strong class="fs-5 text-white">Total: ₹${total}</strong>
      <a href="checkout.html" class="btn btn-info btn-lg ripple">Proceed to Checkout</a>
    </div>`;
}

function changeQty(index, delta) {
  cart[index].qty += delta;
  if (cart[index].qty <= 0) cart.splice(index, 1);
  saveCart();
  renderCart();
}
function removeFromCart(index) {
  const removed = cart.splice(index, 1)[0];
  saveCart();
  renderCart();
  showToast(`Removed ${removed.name}`, "warning");
}

/* ===========
   Checkout & Orders (per-user)
   =========== */
function renderCheckout() {
  const container = document.getElementById("checkoutContainer");
  if (!container) return;
  if (cart.length === 0) {
    container.innerHTML = `<p class="text-white-75">Your cart is empty.</p>`;
    return;
  }
  const items = cart.map(item => `
    <li class="list-group-item d-flex justify-content-between list-item-glass">
      <div><strong class="text-white">${item.name}</strong><br><small class="text-white-75">₹${item.price} × ${item.qty}</small></div>
      <div class="fw-bold text-white">₹${item.price * item.qty}</div>
    </li>
  `).join('');
  const total = cart.reduce((s,i) => s + i.price*i.qty, 0);
  container.innerHTML = `
    <h4 class="mb-3 text-white">Order Summary</h4>
    <ul class="list-group mb-3">${items}</ul>
    <div class="mb-3"><strong class="fs-5 text-white">Total: ₹${total}</strong></div>
    <form id="confirmOrderForm">
      <div class="mb-3">
        <div class="form-check form-check-inline">
          <input class="form-check-input" type="radio" name="payment" value="UPI" id="payUpi">
          <label class="form-check-label text-white-75" for="payUpi">UPI</label>
        </div>
        <div class="form-check form-check-inline">
          <input class="form-check-input" type="radio" name="payment" value="Card" id="payCard">
          <label class="form-check-label text-white-75" for="payCard">Card</label>
        </div>
        <div class="form-check form-check-inline">
          <input class="form-check-input" type="radio" name="payment" value="COD" id="payCod">
          <label class="form-check-label text-white-75" for="payCod">COD</label>
        </div>
      </div>
      <button type="submit" class="btn btn-success btn-lg ripple">Place Order</button>
    </form>
  `;
  document.getElementById("confirmOrderForm").onsubmit = (e) => {
    e.preventDefault();
    confirmOrder();
  };
}

function confirmOrder() {
  const payment = document.querySelector("input[name='payment']:checked");
  if (!payment) { showToast("Please select a payment method", "warning"); return; }
  const user = getCurrentUser();
  if (!user) { showToast("Please login first", "warning"); return; }
  const key = "orders_" + user.email;
  const userOrders = JSON.parse(localStorage.getItem(key)) || [];
  userOrders.push({ items: [...cart], payment: payment.value, date: new Date().toLocaleString() });
  localStorage.setItem(key, JSON.stringify(userOrders));
  cart = [];
  saveCart();
  showLoader();
  setTimeout(() => { window.location.href = "orders.html"; }, 1000);
}

function renderOrders() {
  const list = document.getElementById("ordersContainer");
  if (!list) return;
  const user = getCurrentUser();
  if (!user) { list.innerHTML = `<p class="text-white-75 text-center">Please login to see your orders.</p>`; return; }
  const key = "orders_" + user.email;
  const userOrders = JSON.parse(localStorage.getItem(key)) || [];
  if (userOrders.length === 0) { list.innerHTML = `<p class="text-white-75 text-center">No orders yet.</p>`; return; }

  list.innerHTML = userOrders.map(o => `
    <div class="col-12 col-md-6">
      <div class="card glass-card h-100">
        <div class="card-body">
          <h5 class="card-title text-white">Order: ${o.date}</h5>
          <ul class="list-group list-group-flush mb-3">
            ${o.items.map(it => `<li class="list-group-item list-item-glass d-flex justify-content-between text-white">${it.name} <span class="fw-semibold">× ${it.qty}</span><span>₹${it.price * it.qty}</span></li>`).join('')}
          </ul>
          <p class="mb-0 text-white-75"><strong>Payment:</strong> ${o.payment}</p>
        </div>
      </div>
    </div>
  `).join('');
}

/* ===========
   Auth: register/login/logout
   =========== */
function handleRegisterForm() {
  const form = document.getElementById("registerForm");
  if (!form) return;
  form.onsubmit = (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const pwd = document.getElementById("password").value.trim();
    if (!username || !email || !pwd) { showToast("Please fill all fields", "warning"); return; }
    users = JSON.parse(localStorage.getItem("users")) || [];
    if (users.some(u => u.email === email)) { showToast("User already exists", "warning"); return; }
    users.push({ username, email, password: pwd });
    localStorage.setItem("users", JSON.stringify(users));
    showToast("Registration successful! Redirecting...", "success");
    showLoader();
    setTimeout(() => { window.location.href = "login.html"; }, 900);
  };
}

function handleLoginForm() {
  const form = document.getElementById("loginForm");
  if (!form) return;
  form.onsubmit = (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const pwd = document.getElementById("password").value.trim();
    users = JSON.parse(localStorage.getItem("users")) || [];
    const valid = users.find(u => u.username === username && u.email === email && u.password === pwd);
    if (!valid) { showToast("Invalid credentials", "danger"); return; }
    localStorage.setItem("loggedIn", "true");
    setCurrentUser(valid);
    wireNavAuth();
    showToast("Login successful!", "success");
    showLoader();
    setTimeout(() => { window.location.href = "index.html"; }, 800);
  };
}

function logoutUser() {
  localStorage.removeItem("loggedIn");
  localStorage.removeItem("currentUser");
  wireNavAuth();
  showLoader();
  setTimeout(() => { window.location.href = "login.html"; }, 700);
}

/* ===========
   Welcome
   =========== */
function runWelcome() {
  const el = document.getElementById("welcomeMsg");
  if (!el) return;
  if (!isLoggedIn()) { el.textContent = "Welcome to EnkinLab Mart"; return; }
  const u = getCurrentUser();
  const name = u?.username || "User";
  const msg = `Welcome ${name}...`;
  el.textContent = "";
  let i = 0;
  (function type() {
    if (i < msg.length) { el.textContent += msg.charAt(i++); setTimeout(type, 70); }
  })();
}

/* ===========
   Init
   =========== */
document.addEventListener("DOMContentLoaded", () => {
  protectPages();
  wireNavAuth();
  updateCartCount();

  if (document.getElementById("productGrid")) renderProducts();
  if (document.getElementById("cartContainer")) renderCart();
  if (document.getElementById("checkoutContainer")) renderCheckout();
  if (document.getElementById("ordersContainer")) renderOrders();

  handleRegisterForm();
  handleLoginForm();
  runWelcome();

  // safety: hide loader if visible
  hideLoader();
});
