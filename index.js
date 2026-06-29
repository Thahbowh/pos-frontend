// ═══════════════════════════════════════════════════════
//  index.js  —  Leboneng Tavern storefront
// ═══════════════════════════════════════════════════════
console.log("index.js loaded");

const API_BASE = "https://192.168.8.152:5000";

let allProducts = [];
let cart        = [];          // ← single declaration

// ─── Age Verification ──────────────────────────────────
function verifyAge(isAdult) {
  const modal = document.getElementById('ageModal');
  if (isAdult) {
    modal.classList.add('hidden');
    sessionStorage.setItem('ageVerified', 'true');
  } else {
    document.getElementById('ageDenied').style.display = 'block';
    document.querySelector('.age-buttons').style.display = 'none';
  }
}

// ─── Token refresh (every 14 min) ──────────────────────
async function refreshToken() {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST", credentials: "include"
  });
  if (res.ok) {
    const data = await res.json();
    localStorage.setItem("token", data.accessToken);
  } else {
    localStorage.clear();
    window.location.href = "index.html";
  }
}
setInterval(refreshToken, 14 * 60 * 1000);

// ─── Products ──────────────────────────────────────────
async function loadProducts() {
  showSkeletons();
  try {
    const res  = await fetch(`${API_BASE}/products`);
    const data = await res.json();
    allProducts = data;
    displayProducts(allProducts);
  } catch (err) {
    console.error('Error loading products:', err);
  }
}

function displayProducts(products) {
  const container = document.getElementById('products');
  container.innerHTML = '';
  products.forEach(p => {
    const outOfStock = p.stock === 0;
    const lowStock   = p.stock > 0 && p.stock <= (p.lowStockThreshold || 5);
    const badge = outOfStock
      ? `<div style="margin:6px 0;padding:4px 10px;background:#2a0a0a;border:1px solid #e24b4a60;border-radius:6px;color:#e24b4a;font-size:12px;font-weight:600;text-align:center;">Out of Stock</div>`
      : lowStock
      ? `<div style="margin:6px 0;padding:4px 10px;background:#2d2200;border:1px solid #ef9f2760;border-radius:6px;color:#ef9f27;font-size:12px;font-weight:600;text-align:center;">Only ${p.stock} left!</div>`
      : '';
    const btn = outOfStock
      ? `<button class="add-btn" disabled style="opacity:0.4;cursor:not-allowed;background:#333;border-color:#444;">Out of Stock</button>`
      : `<button class="add-btn" onclick='addToCart(${JSON.stringify(p)})'>Add to Cart</button>`;
    container.innerHTML += `
      <div class="card">
        <img src="${p.img || ''}" width="100">
        <h3>${p.name}</h3>
        <p>R${p.price}</p>
        ${badge}
        ${btn}
      </div>`;
  });
}

function filterCategory(category) {
  if (category === 'all') displayProducts(allProducts);
  else displayProducts(allProducts.filter(p => p.category === category));
}

function searchProducts() {
  const value    = document.getElementById('searchInput').value.toLowerCase();
  const filtered = allProducts.filter(
    item => item.name.toLowerCase().includes(value) ||
            item.category.toLowerCase().includes(value)
  );
  displayProducts(filtered);
}

function showSkeletons() {
  const container = document.getElementById('products');
  container.innerHTML = '';
  for (let i = 0; i < 6; i++) {
    container.innerHTML += `
      <div class="card">
        <div class="skeleton"></div>
        <div class="skeleton-text"></div>
        <div class="skeleton-text" style="width:60%"></div>
      </div>`;
  }
}

// show logged-in customer name in header instead of Login button
const user = JSON.parse(localStorage.getItem("user") || "null");

// ─── styles for user UI ──────────────────
const userStyles = document.createElement("style");
userStyles.innerHTML = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

  /* ── Online pulse ── */
  @keyframes onlinePulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(0,255,102,0.6); }
    50%      { box-shadow: 0 0 0 5px rgba(0,255,102,0); }
  }

  /* ── Footer slide out/in ── */
  @keyframes footerSlideIn {
    from { transform: translateY(100%); opacity: 0; }
    to   { transform: translateY(0);   opacity: 1; }
  }

  /* ── Desktop header area ── */
  .user-header-wrap {
    display: flex;
    margin-left: 680px;
    align-items: center;
    gap: 1px;
    font-family: 'DM Sans', sans-serif;
  }
  .user-online-dot {
    width: 9px; height: 9px;
    background: #00ff66;
    border-radius: 50%;
    
    flex-shrink: 0;
    animation: onlinePulse 2s ease-in-out infinite;
  }
  .user-name-label {
     
    font-size: 15px;
    font-weight: 600;
    color: #fff;
    letter-spacing: -0.2px;
    white-space: nowrap;
  }
  .user-name-label span {
    color: #888;
    font-weight: 400;
    margin-right: 2px;
  }
  .user-btn {
  
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 7px 15px;
    border-radius: 999px;
    font-family: 'DM Sans', sans-serif;
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.22s ease;
    letter-spacing: 0.1px;
    border: none;
    outline: none;
  }
  .user-btn:hover { transform: translateY(-1px); }
  .user-btn:active { transform: scale(0.97); }

  .user-btn--cart {
    margin-left: 10px;
    background: #1c1c1c;
    border: 1px solid rgba(255,255,255,0.1);
    color: #d4d4d4;
  }
  .user-btn--cart:hover {
    background: #252525;
    border-color: rgba(255,255,255,0.2);
    color: #fff;
  }
  .user-btn--dashboard {
    background: linear-gradient(135deg, #FFB800 0%, #ff6b00 100%);
    color: #000;
    box-shadow: 0 4px 18px rgba(255,150,0,0.28);
  }
  .user-btn--dashboard:hover {
    box-shadow: 0 6px 24px rgba(255,150,0,0.42);
    filter: brightness(1.07);
  }
  .user-btn--signout {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.08);
    color: #555;
    padding: 7px 12px;
    font-size: 12px;
  }
  .user-btn--signout:hover {
    border-color: rgba(255,80,80,0.35);
    color: #ff6060;
    background: rgba(255,60,60,0.06);
  }

  /* ── Mobile header chip ── */
  .mobile-user-chip {
    margin-left: 110px;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 999px;
    padding: 5px 12px 5px 8px;
    font-family: 'DM Sans', sans-serif;
  }
  .mobile-user-chip strong {
    font-size: 13px;
    font-weight: 700;
    color: #fff;
    letter-spacing: -0.1px;
  }

  /* ── Mobile footer nav ── */
  #userFooterNav {
    position: fixed;
    bottom: 0; left: 0;
    width: 100%;
    z-index: 99999;
    transform: translateY(0);
    opacity: 1;
    transition: transform 0.32s cubic-bezier(0.16,1,0.3,1),
                opacity   0.32s ease;
  }
  #userFooterNav.hidden-by-cart {
    transform: translateY(110%);
    opacity: 0;
    pointer-events: none;
  }
  .footer-nav-inner {
    background: rgba(12,12,12,0.97);
    border-top: 1px solid rgba(255,255,255,0.07);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    box-shadow: 0 -10px 40px rgba(0,0,0,0.5);
    display: flex;
    justify-content: space-around;
    align-items: center;
    height: 68px;
    padding-bottom: env(safe-area-inset-bottom);
  }

  .fnav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff; /* or var(--gold) */
 }

  .fnav-icon svg {
  display: block;
  width: 22px;
  height: 22px;
 }
  .fnav-btn {
    background: none;
    border: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    padding: 8px 18px;
    border-radius: 14px;
    transition: all 0.22s ease;
    position: relative;
    font-family: 'DM Sans', sans-serif;
  }
  .fnav-btn:active { transform: scale(0.92); }
  .fnav-btn .fnav-icon {
    font-size: 20px;
    line-height: 1;
    transition: transform 0.22s ease;
  }
  .fnav-btn:hover .fnav-icon { transform: translateY(-2px); }
  .fnav-btn .fnav-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.3px;
    text-transform: uppercase;
  }
  .fnav-btn--cart  .fnav-label { color: #ccc; }
  .fnav-btn--cart:hover        { background: rgba(255,255,255,0.05); }

  .fnav-btn--dash  { background: rgba(255,184,0,0.08); border-radius: 14px; }
  .fnav-btn--dash  .fnav-label { color: #FFB800; }
  .fnav-btn--dash:hover { background: rgba(255,184,0,0.15); }

  .fnav-btn--logout .fnav-label { color: #ff5a5a; }
  .fnav-btn--logout:hover { background: rgba(255,60,60,0.07); }

  .fnav-cart-badge {
    position: absolute;
    top: 4px; right: 10px;
    background: #FFB800;
    color: #000;
    font-size: 10px;
    font-weight: 800;
    min-width: 17px; height: 17px;
    border-radius: 999px;
    display: flex; align-items: center; justify-content: center;
    padding: 0 4px;
    pointer-events: none;
  }
`;
document.head.appendChild(userStyles);

if (user) {
  const loginDiv = document.getElementById("login");
  const cartBtn  = document.getElementById("cartBtn");
  const isMobile = window.innerWidth <= 1024;

  // =========================================
  // DESKTOP / LAPTOP / TABLET HEADER
  // =========================================
  if (!isMobile) {
    if (cartBtn) cartBtn.style.display = "none";

    if (loginDiv) {
      loginDiv.innerHTML = `
        <div class="user-header-wrap">
          <div class="user-online-dot"></div>
          <div class="user-name-label">
            ${user.name?.split(' ')[0] || 'user.name'}
          </div>
          <button class="user-btn user-btn--cart" onclick="openCart()">
            🛒 Cart
          </button>
          <button class="user-btn user-btn--dashboard" onclick="window.location.href='customer-dashboard.html'">
            <span class="fnav-icon">
            <svg xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round">
              <line x1="12" y1="20" x2="12" y2="10"></line>
              <line x1="18" y1="20" x2="18" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="16"></line>
            </svg>
          </span>
          <span class="fnav-label">Dashboard</span>
          </button>

          <button class="user-btn user-btn--signout" onclick="logoutCustomer()">
            <span class="fnav-icon">
              <svg xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </span>
            <span class="fnav-label">Logout</span>
          </button>
        </div>
      `;
    }

  } else {
    // =========================================
    // MOBILE
    // =========================================
    if (cartBtn) cartBtn.style.display = "none";

    if (loginDiv) {
      loginDiv.innerHTML = `
        <div class="mobile-user-chip">
          <div class="user-online-dot"></div>
          <strong>${user.name?.split(' ')[0] || 'Account'}</strong>
        </div>
      `;
    }

    // Footer nav
    const footerNav = document.createElement("div");
    footerNav.id = "userFooterNav";
    footerNav.innerHTML = `
      <div class="footer-nav-inner">

        <button class="fnav-btn fnav-btn--cart" onclick="openCart()">
          <span class="fnav-icon">
            <svg xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              style="display:block;">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39A2 2 0 0 0 9.64 16H19.4a2 2 0 0 0 1.96-1.61L23 6H6"/>
            </svg>
          </span>

          <span class="fnav-label">Cart</span>
          <span class="fnav-cart-badge" id="mobileCartBadge">0</span>
        </button>

        <button class="fnav-btn fnav-btn--dash" onclick="window.location.href='customer-dashboard.html'">
          <span class="fnav-icon">
            <svg xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round">
              <line x1="12" y1="20" x2="12" y2="10"></line>
              <line x1="18" y1="20" x2="18" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="16"></line>
            </svg>
          </span>
          <span class="fnav-label">Dashboard</span>
        </button>

        <button class="fnav-btn fnav-btn--logout" onclick="logoutCustomer()">
          <span class="fnav-icon">
            <svg xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </span>
          <span class="fnav-label">Logout</span>
        </button>

      </div>
    `;
    document.body.appendChild(footerNav);
  }
}

function hideMobileFooterNav() {
  const nav = document.getElementById("userFooterNav");
  if (nav) {
    nav.classList.add("hidden-by-cart");
  }
}

function showMobileFooterNav() {
  const nav = document.getElementById("userFooterNav");
  if (nav) {
    nav.classList.remove("hidden-by-cart");
  }
}


// =========================================
// LOGOUT FUNCTION
// =========================================
function logoutCustomer() {

  localStorage.removeItem("user");
  localStorage.removeItem("token");

  window.location.href = "customer-login.html";
}

// =========================================
// OPEN CART FUNCTION
// =========================================
function openCart() {

  document
    .getElementById("userFooterNav")
    ?.classList.add("hidden-by-cart");

  const cartBtn = document.getElementById("cartBtn");

  if (cartBtn) {
    cartBtn.click();
  }
}

function closeCart() {

  document
    .getElementById("userFooterNav")
    ?.classList.remove("hidden-by-cart");

  cartSidebar.classList.remove("active");

}

// =========================================
// GREEN PULSE ANIMATION
// =========================================
const style = document.createElement("style");

style.innerHTML = `

@keyframes pulse {
  0%   { transform:scale(1);   opacity:1;   }
  50%  { transform:scale(1.3); opacity:0.7; }
  100% { transform:scale(1);   opacity:1;   }
}
@keyframes toastIn {
  from { opacity:0; transform:translateX(-50%) translateY(-10px); }
  to   { opacity:1; transform:translateX(-50%) translateY(0);     }
}
`;

document.head.appendChild(style);

// ─── Cart ──────────────────────────────────────────────
function addToCart(product) {
  const found = cart.find(c => c.name === product.name);
  if (found) found.qty++;
  else cart.push({ ...product, qty: 1 });
  updateCart();
}

function changeQty(i, val) {
  cart[i].qty += val;
  if (cart[i].qty <= 0) cart.splice(i, 1);
  updateCart();
}

function toggleCart() {
  const cartEl    = document.getElementById('cart');
  const footerNav = document.getElementById('userFooterNav');
  cartEl.classList.toggle('active');
  if (footerNav) {
    footerNav.classList.toggle('hidden-by-cart', cartEl.classList.contains('active'));
  }
}

function updateCart() {
  const cartDiv = document.getElementById('cartItems');
  cartDiv.innerHTML = '';
  let count = 0;

  cart.forEach((item, index) => {
    count += item.qty;
    cartDiv.innerHTML += `
      <div class="cart-item">
        <span>${item.name} x${item.qty} = R${(item.price * item.qty).toFixed(2)}</span>
        <div>
          <span class="qty-btn" onclick="changeQty(${index},-1)">-</span>
          <span class="qty-btn" onclick="changeQty(${index}, 1)">+</span>
        </div>
      </div>`;
  });

  document.getElementById('count').innerText = count;
  // Sync mobile footer badge
  const mobileBadge = document.getElementById('mobileCartBadge');
  if (mobileBadge) mobileBadge.textContent = count;
  localStorage.setItem('cart', JSON.stringify(cart));
  updateSummary();
}

function calculateTotals() {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  return { subtotal, total: subtotal };
}

function updateSummary() {
  const { subtotal, total } = calculateTotals();
  document.getElementById('subtotal').innerText = subtotal.toFixed(2);
  document.getElementById('total').innerText    = total.toFixed(2);
}

// ── Collect slip ───────────────────────────────
let collectPollInterval = null;

// REPLACE showCollectSlip with:
function showCollectSlip(order) {
  document.getElementById("slipOrderId").textContent = order.id;
  document.getElementById("slipTotal").textContent   = "R" + parseFloat(order.total).toFixed(2);
  document.getElementById("slipItems").innerHTML     = (order.items || [])
    .map(i => `<div style="display:flex;justify-content:space-between;">
      <span>${i.name} ×${i.qty}</span>
      <span style="color:#fff;">R${(i.price * i.qty).toFixed(2)}</span>
    </div>`).join("");

  const slip = document.getElementById("collectSlip");
  slip.style.display = "flex";

  // Force animation to replay
  const inner = slip.querySelector("div");
  inner.style.animation = "none";
  inner.offsetHeight;   // trigger reflow
  inner.style.animation = "slipIn 0.4s cubic-bezier(0.16,1,0.3,1) both";
}

function closeCollectSlip() {
  document.getElementById("collectSlip").style.display = "none";
  clearInterval(collectPollInterval);
  collectPollInterval = null;
  // Remove this order from polling so it never shows again
  const dismissed = JSON.parse(localStorage.getItem("dismissed_orders") || "[]");
  const slip = document.getElementById("slipOrderId").textContent;
  if (slip && !dismissed.includes(slip)) {
    dismissed.push(slip);
    localStorage.setItem("dismissed_orders", JSON.stringify(dismissed));
  }
}

function startOrderPolling(order) {
  // Don't poll if already dismissed
  const dismissed = JSON.parse(localStorage.getItem("dismissed_orders") || "[]");
  if (dismissed.includes(order.id)) return;

  // Stop any existing poll
  if (collectPollInterval) clearInterval(collectPollInterval);

  collectPollInterval = setInterval(async () => {
    try {
      const res  = await fetch(`${API_BASE}/api/orders/status/${order.id}`);
      if (!res.ok) return;
      const data = await res.json();

      if (data.status === "completed") {
        clearInterval(collectPollInterval);
        collectPollInterval = null;
        showCollectSlip(order);
      }
    } catch (err) {
      console.warn("Status poll failed:", err.message);
    }
  }, 5000); // check every 5 seconds
}

// ─── Stock / Order message toast ──────────────────────
function showOrderMessage(msg, type) {
  // Remove any existing toast
  const existing = document.getElementById('order-toast');
  if (existing) existing.remove();

  const color  = type === 'error' ? '#e24b4a' : '#ef9f27';
  const bg     = type === 'error' ? '#2a0a0a' : '#2d2200';
  const border = type === 'error' ? '#e24b4a60' : '#ef9f2760';
  const icon   = type === 'error' ? '❌' : '⚠';

  const toast = document.createElement('div');
  toast.id = 'order-toast';
  toast.innerHTML = `${icon} ${msg}`;
  toast.style.cssText = `
    position:fixed; top:20px; left:50%; transform:translateX(-50%);
    background:${bg}; color:${color}; border:1px solid ${border};
    padding:14px 24px; border-radius:10px; font-size:14px; font-weight:600;
    z-index:99999; box-shadow:0 4px 20px rgba(0,0,0,0.5);
    animation:toastIn 0.3s ease; max-width:90vw; text-align:center;
  `;
  document.body.appendChild(toast);

  // Auto remove after 4 seconds
  setTimeout(() => { if (toast.parentNode) toast.remove(); }, 4000);
}

// ─── Place Order ───────────────────────────────────────
async function placeOrder() {
  if (!cart || cart.length === 0) { alert("Your cart is empty!"); return; }

  const user    = JSON.parse(localStorage.getItem("user") || "{}");
  const orderId = "ORD-" + Date.now().toString().slice(-6);
  const total   = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  const order = {
    id:       orderId,
    customer: user.name  || "",
    email:    user.email || "",
    items:    cart.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })),
    total:    total,
    time:     new Date().toISOString(),
    status:   "pending",
    payment:  "cash"
  };

  // 1 — Save to localStorage (admin dashboard reads this)
  const stored = JSON.parse(localStorage.getItem("tavern_orders") || "[]");
  stored.unshift(order);
  localStorage.setItem("tavern_orders", JSON.stringify(stored));
  console.log("✅ Order saved. Total in storage:", stored.length);

  // 2 — POST to backend
  try {
    const _tok = localStorage.getItem("token") || "";
    const res  = await fetch(`${API_BASE}/api/orders`, {
      method:  "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + _tok },
      body:    JSON.stringify(order)
    });

    if (!res.ok) {
      const err = await res.json();
      showOrderMessage(err.message || "Order failed. Please try again.", "error");
      return;
    }
  } catch (err) {
    console.warn("Backend offline:", err);
    showOrderMessage("Cannot reach server. Please check your connection.", "error");
    return;
  }

  // 3 — Show receipt
  document.getElementById("orderId").textContent      = "Order ID: " + orderId;
  document.getElementById("receiptTotal").textContent = total.toFixed(2);
  document.getElementById("receiptItems").innerHTML   =
    order.items.map(i =>
      `<p>${i.name} × ${i.qty} — R${(i.price * i.qty).toFixed(2)}</p>`
    ).join("");
  startOrderPolling(order); 
  document.getElementById("receiptModal").style.display = "flex";

  // 4 — Clear cart
  cart = [];
  updateCart();
}

// ── Resume polling for pending orders on page reload
window.addEventListener("load", () => {
  const stored   = JSON.parse(localStorage.getItem("tavern_orders") || "[]");
  const dismissed = JSON.parse(localStorage.getItem("dismissed_orders") || "[]");

  // Find the most recent pending order belonging to this session
  const user    = JSON.parse(localStorage.getItem("user") || "{}");
  const pending = stored.find(o =>
    o.status === "pending" &&
    !dismissed.includes(o.id) &&
    (o.email === (user.email || "") || o.customer === (user.name || "Guest"))
  );

  if (pending) startOrderPolling(pending);
});

function closeReceipt() {        // ← single declaration
  document.getElementById('receiptModal').style.display = 'none';
}

// ─── Boot ──────────────────────────────────────────────
loadProducts();