/* ─────────────────────────────────────────
     CONFIG — change this if your URL differs
  ───────────────────────────────────────── */
  const API_BASE = 'https://task-api-clean-production.up.railway.app';
  const API_URL = `${API_BASE}/products`;

  function getToken() {
    return localStorage.getItem("token");
  }

  function authHeaders() {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
}

  /* ─────────────────────────────────────────
     TOAST
  ───────────────────────────────────────── */
  function showToast(msg, type = "success") {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.className = `toast ${type} show`;
    setTimeout(() => t.classList.remove("show"), 3000);
  }

  /* ─────────────────────────────────────────
     HELPERS
  ───────────────────────────────────────── */
  const catLabel = { beer: "Beer", spirits: "Spirits", food: "Food", soft: "Soft Drink" };
  const catClass  = { beer: "badge-beer", spirits: "badge-spirits", food: "badge-food", soft: "badge-soft" };

  /* ─────────────────────────────────────────
   GET ALL PRODUCTS
───────────────────────────────────────── */
async function loadProducts() {
  // Show loading state in whichever view is active
  const grid = document.getElementById("prod-grid");
  const label = document.getElementById("prod-count-label");
  if (grid) grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; color:#555;">Loading products...</div>`;
  if (label) label.textContent = "Loading...";

  try {
    const res = await fetch(API_URL, {
      method: "GET",
      headers: authHeaders()
    });

    if (!res.ok) throw new Error(`Server responded with ${res.status}`);

    const products = await res.json();

    if (!products.length) {
      if (grid) grid.innerHTML = "";
      const empty = document.getElementById("prod-empty");
      if (empty) empty.style.display = "block";
      if (label) label.textContent = "0 products";

      // Update dashboard low stock
      const lsCount = document.getElementById("low-stock-count");
      if (lsCount) lsCount.textContent = 0;
      allProducts = [];
      renderLowStock();
      return;
    }

    renderProductRows(products);

  } catch (err) {
    console.error(err);
    if (grid) grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; color:#f87171;">Failed to load products. Is your API running?</div>`;
    showToast("Could not load products", "error");
  }
}

function renderLowStock() {
  const body = document.getElementById('low-stock-body');

  const lowItems = allProducts.filter(
    p => p.stock > 0 && p.stock <= (p.lowStockThreshold || 5)
  );

  const outItems = allProducts.filter(
    p => p.stock === 0
  );

  const all = [...lowItems, ...outItems];

  if (all.length === 0) {
    body.innerHTML = `
      <div class="card-value" style="color:#555">—</div>
    `;
    return;
  }

  body.innerHTML = all.map(p => `
    <div style="
      display:flex;
      justify-content:space-between;
      align-items:center;
      margin-bottom:6px;
    ">
      <span style="font-size:13px; color:#d4b87a;">
        ${p.name}
      </span>

      <span style="
        font-size:12px;
        color:${p.stock === 0 ? '#e24b4a' : '#ef9f27'};
      ">
        ${p.stock === 0
          ? 'out of stock'
          : p.stock + ' left'}
      </span>
    </div>
  `).join('');
}

function checkLowStockWarn() {
  const qty = parseFloat(document.getElementById('product-stock').value);
  const threshold = parseFloat(document.getElementById('product-low-stock').value);
  const warn = document.getElementById('low-stock-warn');
  warn.style.display = (!isNaN(qty) && !isNaN(threshold) && qty <= threshold) ? 'block' : 'none';
}


/* ─────────────────────────────────────────
   CATEGORY CONFIG
───────────────────────────────────────── */
const catConfig = {
  beer:        { emoji: "🍺", label: "Beer",       cls: "cat-beer"       },
  cider:       { emoji: "🍹", label: "Cider",      cls: "cat-cider"      },
  food:        { emoji: "🍗", label: "Food",        cls: "cat-food"       },
  cigarettes: { emoji: "🚬", label: "Cigarettes", cls: "cat-cigarettes"},
};

function getCat(key) {
  return catConfig[key] || { emoji: "📦", label: key || "Other", cls: "cat-default" };
}

/* ─────────────────────────────────────────
   VIEW STATE
───────────────────────────────────────── */
let currentProductView = "grid";
let allProducts = [];

function setProductView(view) {
  currentProductView = view;

  document.getElementById("view-grid").classList.toggle("active", view === "grid");
  document.getElementById("view-list").classList.toggle("active", view === "list");

  document.getElementById("prod-grid").style.display = view === "grid" ? "grid" : "none";
  document.getElementById("prod-list").style.display = view === "list" ? "block" : "none";

  filterProducts();
}

/* ─────────────────────────────────────────
   SUMMARY STRIP
───────────────────────────────────────── */
function updateProductSummary(products) {
  const threshold  = getLowStockThreshold();
  const categories = [...new Set(products.map(p => p.category))].length;
  const lowStock = products.filter(
  p => p.stock <= (p.lowStockThreshold || threshold)
).length;
  const value      = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

  document.getElementById("ps-total").textContent      = products.length;
  document.getElementById("ps-categories").textContent = categories;
  document.getElementById("ps-low").textContent        = lowStock;
  document.getElementById("ps-value").textContent      = `R${value.toLocaleString()}`;

  const lsCount = document.getElementById("low-stock-count");
  const lsBadge = document.getElementById("low-stock-badge");
  if (lsCount) lsCount.textContent = lowStock;
  if (lsBadge) lsBadge.style.display = lowStock > 0 ? "inline-flex" : "none";
}

function getLowStockThreshold() {
  return parseInt(localStorage.getItem("lowStockThreshold") || "5", 10);
}

function saveLowStockThreshold(val) {
  const n = Math.max(1, parseInt(val, 10) || 5);
  localStorage.setItem("lowStockThreshold", n);
  document.getElementById("low-stock-threshold").value = n;
  if (allProducts.length) updateProductSummary(allProducts);  // re-evaluate immediately
}

const savedThreshold = localStorage.getItem("lowStockThreshold");
const threshInput = document.getElementById("low-stock-threshold");
if (savedThreshold && threshInput) threshInput.value = savedThreshold;

/* ─────────────────────────────────────────
   FILTER
───────────────────────────────────────── */
function filterProducts() {
  const search = (document.getElementById("prod-search")?.value || "").toLowerCase();
  const cat    =  document.getElementById("prod-cat-filter")?.value || "all";
  const stock  =  document.getElementById("prod-stock-filter")?.value || "all";

  const filtered = allProducts.filter(p => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search) ||
      (p.category || "").toLowerCase().includes(search);
    const matchCat   = cat   === "all" || p.category === cat;
    const matchStock =
      stock === "all" ? true :
      stock === "low" ? p.stock <= getLowStockThreshold() :
      stock === "ok"  ? p.stock > getLowStockThreshold()  : true;
    return matchSearch && matchCat && matchStock;
  });

  const label = document.getElementById("prod-count-label");
  if (label) label.textContent =
    filtered.length === allProducts.length
      ? `${allProducts.length} products`
      : `${filtered.length} of ${allProducts.length} products`;

  if (currentProductView === "grid") renderProductGrid(filtered);
  else                                renderProductList(filtered);
}

/* ─────────────────────────────────────────
   GRID VIEW
───────────────────────────────────────── */
function renderProductGrid(products) {
  const grid  = document.getElementById("prod-grid");
  const empty = document.getElementById("prod-empty");

  if (!grid) return;

  if (!products.length) {
    grid.innerHTML = "";
    if (empty) empty.style.display = "block";
    return;
  }
  if (empty) empty.style.display = "none";

  grid.innerHTML = products.map(p => {
    const cat      = getCat(p.category);
    const threshold = p.lowStockThreshold || getLowStockThreshold();
    const stockCls = p.stock <= threshold ? "low" : "ok";
    const stockTxt = p.stock <= 0
      ? "❌ Out of stock"
      : p.stock <= threshold
      ? `⚠ Only ${p.stock} left`
      : `✓ ${p.stock} in stock`;

    const imgHtml = p.img
      ? `<img class="prod-card-img" src="${p.img}" alt="${p.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">`
      + `<div class="prod-card-img-placeholder" style="display:none">${cat.emoji}</div>`
      : `<div class="prod-card-img-placeholder">${cat.emoji}</div>`;

    return `
      <div class="prod-card">
        ${imgHtml}
        <div class="prod-card-body">
          <div class="prod-card-top">
            <div class="prod-card-name">${p.name}</div>
            <div class="prod-card-price">R${p.price}</div>
          </div>
          <span class="prod-card-cat ${cat.cls}">${cat.emoji} ${cat.label}</span>
          <div class="prod-card-stock ${stockCls}">${stockTxt}</div>
          <div class="prod-card-actions">
            <button class="prod-edit-btn" onclick="openModal(${JSON.stringify(p).split('"').join('&quot;')})">✏ Edit</button>
            <button class="prod-del-btn"  onclick="deleteProduct(${p.id})">🗑</button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

/* ─────────────────────────────────────────
   LIST VIEW
───────────────────────────────────────── */
function renderProductList(products) {
  const tbody = document.getElementById("prod-list-body");
  const empty = document.getElementById("prod-empty");

  if (!tbody) return;

  if (!products.length) {
    tbody.innerHTML = "";
    if (empty) empty.style.display = "block";
    return;
  }
  if (empty) empty.style.display = "none";

  tbody.innerHTML = products.map(p => {
    const cat      = getCat(p.category);
    const thresh   = p.lowStockThreshold || getLowStockThreshold();
    const stockCls = p.stock <= thresh ? "low" : "ok";
    const stockTxt = p.stock <= 0 ? "Out of stock"
      : p.stock <= thresh ? `⚠ ${p.stock} left`
      : `✓ ${p.stock}`;

    const imgHtml = p.img
      ? `<img class="prod-list-img" src="${p.img}" alt="${p.name}" onerror="this.outerHTML='<div class=\\'prod-list-img-placeholder\\'>${cat.emoji}</div>'">`
      : `<div class="prod-list-img-placeholder">${cat.emoji}</div>`;

    return `
      <tr>
        <td>
          <div class="prod-name-cell">
            ${imgHtml}
            <span class="prod-name-text">${p.name}</span>
          </div>
        </td>
        <td><span class="prod-card-cat ${cat.cls}" style="padding:3px 8px; border-radius:20px; font-size:11px; font-weight:600;">${cat.emoji} ${cat.label}</span></td>
        <td style="color:gold; font-weight:700;">R${p.price}</td>
        <td class="prod-card-stock ${stockCls}">${stockTxt}</td>
        <td>
          <span class="status ${p.stock <= 0 ? 'cancelled' : p.stock <= thresh ? 'pending' : 'completed'}">
            ${p.stock <= 0 ? 'Out of Stock' : p.stock <= thresh ? 'Low Stock' : 'In Stock'}
          </span>
        </td>
        <td>
          <div class="action-group">
            <button class="prod-edit-btn" style="padding:5px 10px;" onclick="openModal(${JSON.stringify(p).split('"').join('&quot;')})">✏ Edit</button>
            <button class="prod-del-btn"  style="padding:5px 10px;" onclick="deleteProduct(${p.id})">🗑</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

/* ─────────────────────────────────────────
   MAIN RENDER — replaces old renderProductRows()
   Called by loadProducts() in your existing code
───────────────────────────────────────── */
function renderProductRows(products) {
  allProducts = products;
  updateProductSummary(products);
  renderLowStock();   // ← ADD THIS LINE

  const label = document.getElementById("prod-count-label");
  if (label) label.textContent = `${products.length} products`;

  filterProducts();
}

  /* ─────────────────────────────────────────
     CREATE PRODUCT
  ───────────────────────────────────────── */
  async function createProduct(data) {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`Server responded with ${res.status}`);
    return res.json();
  }

  /* ─────────────────────────────────────────
     UPDATE PRODUCT
  ───────────────────────────────────────── */
   async function updateProduct(id, data) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: authHeaders(),  // ✅ authHeaders() alone is enough
    body: JSON.stringify(data)
  });

  if (!res.ok) throw new Error("Update failed");

  loadProducts();
}



  /* ─────────────────────────────────────────
     DELETE PRODUCT
  ───────────────────────────────────────── */
async function deleteProduct(id) {
  if (!confirm("Delete this product?")) return;

  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: authHeaders()  // ✅ add this
    });

    if (!res.ok) throw new Error("Delete failed");

    showToast("Product deleted");  // use your toast instead of alert
    loadProducts();

  } catch (err) {
    console.error(err);
    showToast("Failed to delete product", "error");
  }
}

  /* ─────────────────────────────────────────
     MODAL
  ───────────────────────────────────────── */
  function openModal(product = null) {
    document.getElementById("modal-title").textContent  = product ? "Edit Product" : "Add Product";
    document.getElementById("product-id").value         = product ? (product._id || product.id) : "";
    document.getElementById("product-barcode").value    = product ? (product.barcode || "") : "";
    document.getElementById("product-picture").value    = product ? product.img : "";
    document.getElementById("product-name").value       = product ? product.name : "";
    document.getElementById("product-price").value      = product ? product.price : "";
    document.getElementById("product-category").value   = product ? product.category : "beer";
    document.getElementById("product-stock").value      = product ? product.stock : "";
    document.getElementById("product-low-stock").value  = product ? (product.lowStockThreshold || 5) : 5;  // ← ADD
    document.getElementById("low-stock-warn").style.display = "none";
    checkLowStockWarn();
    document.getElementById("modal-overlay").classList.add("open");
  }

  // Used by the Edit button in table rows (avoids JSON-in-onclick issues)
  function openModalEncoded(encoded) {
    try {
      const product = JSON.parse(decodeURIComponent(encoded));
      openModal(product);
    } catch(e) {
      console.error("Failed to parse product data", e);
    }
  }

  function closeModal() {
    document.getElementById("modal-overlay").classList.remove("open");
  }

  // Close when clicking outside modal box
  document.getElementById("modal-overlay").addEventListener("click", function(e) {
    if (e.target === this) closeModal();
  });

  /* ─────────────────────────────────────────
     SAVE (CREATE OR UPDATE)
  ───────────────────────────────────────── */
  async function saveProduct() {
    const id       = document.getElementById("product-id").value;
    const barcode  = document.getElementById("product-barcode").value.trim();
    const picture  = document.getElementById("product-picture").value.trim();
    const name     = document.getElementById("product-name").value.trim();
    const price    = document.getElementById("product-price").value.trim();
    const category = document.getElementById("product-category").value;
    const stock    = document.getElementById("product-stock").value.trim()

    if (!name || !price || !stock) {
      showToast("Please fill in all fields", "error");
      return;
    }

    const saveBtn = document.getElementById("save-btn");
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    const data = {
      barcode,
      img: picture,
      name,
      price: Number(price),
      category,
      stock: Number(stock),
      lowStockThreshold: parseFloat(document.getElementById('product-low-stock').value) || 5
    };

    try {
      if (id) {
        await updateProduct(id, data);
        showToast("Product updated");
      } else {
        await createProduct(data);
        showToast("Product added");
      }
      closeModal();
      loadProducts();
    } catch (err) {
      console.error(err);
      showToast("Failed to save product", "error");
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save";
    }

    
  }

  /* ─────────────────────────────────────────
     SECTION SWITCHING
  ───────────────────────────────────────── */
  function showSection(id, el) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('.sidebar li').forEach(li => li.classList.remove('active'));
    if (el) el.classList.add('active');
    if (id === 'dashboard') loadProducts();
    if (id === 'products')  loadProducts();
    if (id === 'orders')    initOrdersTab();
    if (id === 'users')     loadUsers();
    if (id === 'analytics') loadAnalytics(currentAnalyticsRange);
    if (id === 'expenses') {
      const df = document.getElementById('exp-inline-date');
      if (df && !df.value) df.value = new Date().toISOString().split('T')[0];
      loadExpenses_tab();
    }
  }

  /* ─────────────────────────────────────────
     ORDERS
  ───────────────────────────────────────── */
  /* ─────────────────────────────────────────
   ORDERS DATA
   Replace this with a real fetch() call later
───────────────────────────────────────── */
let allOrdersData = JSON.parse(localStorage.getItem("tavern_orders") || "[]");
 
/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
 
function ordTimeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60)    return "Just now";
  if (diff < 3600)  return Math.floor(diff / 60) + " min ago";
  if (diff < 86400) {
    return "Today " + new Date(date).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
  }
  return new Date(date).toLocaleDateString("en-ZA");
}
 
const ordStatusCfg = {
  pending:   { label: "⏳ Pending",   cls: "pending"   },
  completed: { label: "✓ Completed",  cls: "completed" },
  cancelled: { label: "✕ Cancelled",  cls: "cancelled" },
};
 
const payLabels = {
  cash:   { label: "💵 Cash",   cls: "pay-cash"   },
  card:   { label: "💳 Card",   cls: "pay-card"   },
  online: { label: "🌐 Online", cls: "pay-online" },
};
 
/* ─────────────────────────────────────────
   SUMMARY CARDS
───────────────────────────────────────── */
function updateOrderSummary(orders) {
  const pending   = orders.filter(o => o.status === "pending").length;
  const completed = orders.filter(o => o.status === "completed").length;
  const cancelled = orders.filter(o => o.status === "cancelled").length;
  const revenue   = orders
    .filter(o => o.status === "completed")
    .reduce((sum, o) => sum + getOrderTotal(o), 0);
 
  document.getElementById("sum-total").textContent     = orders.length;
  document.getElementById("sum-pending").textContent   = pending;
  document.getElementById("sum-completed").textContent = completed;
  document.getElementById("sum-cancelled").textContent = cancelled;
  document.getElementById("sum-revenue").textContent   = `R${revenue.toLocaleString()}`;
}
 
/* ─────────────────────────────────────────
   RENDER TABLE
───────────────────────────────────────── */
function renderOrdersTable(orders) {
  const tbody = document.getElementById("orders-full-body");
  if (!tbody) return;
 
  updateOrderSummary(orders);
 
  if (!orders.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="state-msg">No orders match your filters</td></tr>`;
    return;
  }
 
  tbody.innerHTML = orders.map(order => {
    const idx     = allOrdersData.indexOf(order);
    const total   = getOrderTotal(order);
    const sc      = ordStatusCfg[order.status] || ordStatusCfg.pending;
    const pay     = payLabels[order.payment]   || payLabels.cash;
    const isDone  = order.status === "completed" || order.status === "cancelled";
    const rowCls  = `row-${order.status}`;
    const itemCount = order.items.reduce((s, i) => s + i.qty, 0);
 
    return `
      <tr class="${rowCls}">
        <td><span class="order-id">${order.id}</span></td>
        <td style="font-weight:500">${order.customer}</td>
        <td>
          <span class="order-items" title="${order.items.map(i => `${i.name} x${i.qty}`).join(', ')}">
            ${itemCount} item${itemCount !== 1 ? 's' : ''}
          </span>
        </td>
        <td><span class="order-total">R${total}</span></td>
        <td><span class="pay-badge ${pay.cls}">${pay.label}</span></td>
        <td><span class="order-time">${ordTimeAgo(order.time)}</span></td>
        <td><span class="status ${sc.cls}">${sc.label}</span></td>
        <td>
          <div class="action-group">
            <button class="act-btn view"     onclick="openOrderDetail(${idx})">👁 View</button>
            <button class="act-btn complete" onclick="changeOrderStatus(${idx},'completed')" ${isDone ? 'disabled' : ''}>✅</button>
            <button class="act-btn cancel"   onclick="changeOrderStatus(${idx},'cancelled')" ${isDone ? 'disabled' : ''}>❌</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}
 
/* ─────────────────────────────────────────
   FILTERS
───────────────────────────────────────── */
function applyOrderFilters() {
  const search  = (document.getElementById("ord-search-input")?.value  || "").toLowerCase();
  const status  =  document.getElementById("ord-status-filter")?.value  || "all";
  const date    =  document.getElementById("ord-date-filter")?.value    || "all";
  const payment =  document.getElementById("ord-payment-filter")?.value || "all";
 
  const now     = Date.now();
  const oneDay  = 86400000;
  const oneWeek = 7 * oneDay;
 
  const filtered = allOrdersData.filter(o => {
    const matchSearch  = !search ||
      o.id.toLowerCase().includes(search) ||
      o.customer.toLowerCase().includes(search);
    const matchStatus  = status  === "all" || o.status  === status;
    const matchPayment = payment === "all" || o.payment === payment;
    const age = now - new Date(o.time).getTime();
    const matchDate =
      date === "all"  ? true :
      date === "today"? age < oneDay :
      date === "week" ? age < oneWeek : true;
 
    return matchSearch && matchStatus && matchPayment && matchDate;
  });
 
  renderOrdersTable(filtered);
}
 
/* ─────────────────────────────────────────
   CHANGE ORDER STATUS
   Only allows: pending → completed / cancelled
───────────────────────────────────────── */
async function changeOrderStatus(idx, newStatus) {
  const order = allOrdersData[idx];
  if (!order) return;

  if (order.status !== "pending") {
    showToast(`Order ${order.id} is already ${order.status}`, "error");
    return;
  }

  // Call the server version using the order ID
  await updateOrderStatus(order.id, newStatus);
}
 
/* ─────────────────────────────────────────
   ORDER DETAIL MODAL
───────────────────────────────────────── */
function openOrderDetail(idx) {
  const o     = allOrdersData[idx];
  const total = getOrderTotal(o);
  const sc    = ordStatusCfg[o.status] || ordStatusCfg.pending;
  const pay   = payLabels[o.payment]   || payLabels.cash;
 
  document.getElementById("detail-order-id").textContent  = `Order ${o.id}`;
  document.getElementById("detail-customer").textContent  = o.customer;
  document.getElementById("detail-time").textContent      = ordTimeAgo(o.time);
  document.getElementById("detail-payment").innerHTML     = `<span class="pay-badge ${pay.cls}">${pay.label}</span>`;
  document.getElementById("detail-status").innerHTML      = `<span class="status ${sc.cls}">${sc.label}</span>`;
  document.getElementById("detail-total").textContent     = `R${total}`;
 
  // Items list
  document.getElementById("detail-items-list").innerHTML = o.items.map(item => `
    <div class="detail-item-row">
      <span>
        <span class="detail-item-name">${item.name}</span>
        <span class="detail-item-qty">× ${item.qty}</span>
      </span>
      <span class="detail-item-price">R${item.qty * item.price}</span>
    </div>
  `).join("");
 
  // Action buttons — only show if pending
  const actionsEl = document.getElementById("detail-actions");
  if (o.status === "pending") {
    actionsEl.innerHTML = `
      <button class="btn-ghost" onclick="closeOrderModal()">Close</button>
      <button class="act-btn cancel"   onclick="changeOrderStatus(${idx},'cancelled'); closeOrderModal()">❌ Cancel</button>
      <button class="act-btn complete" onclick="changeOrderStatus(${idx},'completed'); closeOrderModal()">✅ Mark Completed</button>
    `;
  } else {
    actionsEl.innerHTML = `<button class="btn-ghost" onclick="closeOrderModal()">Close</button>`;
  }
 
  document.getElementById("order-detail-modal").classList.add("open");
}
 
function closeOrderModal() {
  document.getElementById("order-detail-modal").classList.remove("open");
}
 
// Close on outside click
document.getElementById("order-detail-modal").addEventListener("click", function(e) {
  if (e.target === this) closeOrderModal();
});
 
/* ─────────────────────────────────────────
   EXPORT TO CSV
───────────────────────────────────────── */
function exportOrdersCSV() {
  const rows = [["Order ID", "Customer", "Items", "Total", "Payment", "Time", "Status"]];
 
  allOrdersData.forEach(o => {
    rows.push([
      o.id,
      o.customer,
      o.items.map(i => `${i.name} x${i.qty}`).join(" | "),
      `R${getOrderTotal(o)}`,
      o.payment,
      new Date(o.time).toLocaleString("en-ZA"),
      o.status
    ]);
  });
 
  const csv  = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `orders-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("Orders exported ✓");
}
 
/* ─────────────────────────────────────────
   INIT — called when Orders tab is opened
───────────────────────────────────────── */
function initOrdersTab() {
  // Reset filters
  const s = document.getElementById("ord-search-input");
  const f = document.getElementById("ord-status-filter");
  const d = document.getElementById("ord-date-filter");
  const p = document.getElementById("ord-payment-filter");
  if (s) s.value = "";
  if (f) f.value = "all";
  if (d) d.value = "all";
  if (p) p.value = "all";
 
  renderOrdersTable(allOrdersData);
}

  /* ─────────────────────────────────────────
     AUTH GUARD
     Remove the "return;" line when deploying
  ───────────────────────────────────────── */
  (function protectAdminPage() {
  const user  = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  // Not logged in at all
  if (!user || !token) {
    alert("Please login first");
    window.location.replace("index.html"); // replace() prevents going back
    return;
  }

  // Logged in but not admin
  if (user.role !== "admin") {
    alert("Access denied: Admins only");
    window.location.replace("index.html");
  }
})();

/* ─────────────────────────────────────────
   REVENUE GRAPH
───────────────────────────────────────── */
/* ─────────────────────────────────────────
   REVENUE GRAPH — REAL DATA
───────────────────────────────────────── */
let revenueChart  = null;
let currentRange  = "week";
let currentView   = "trend";

// ── Helpers ─────────────────────────────
function getOrderTotal(o) {
  if (typeof o.total === "number") return o.total;
  return (o.items || []).reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
}

function validOrders(list) {
  return (list || loadStoredOrders()).filter(o => o.status !== "cancelled");
}

// ── Goal persistence ─────────────────────
// (goal bar removed)

// ── Range + View buttons ──────────────────
function setGraphRange(range) {
  currentRange = range;
  ["week","month","year"].forEach(r => {
    const b = document.getElementById(`btn-${r}`);
    if (!b) return;
    b.style.background = r === range ? "gold" : "transparent";
    b.style.color      = r === range ? "#111" : "#888";
    b.style.fontWeight = r === range ? "700"  : "400";
  });
  renderGraph(range);
}

function setGraphView(view, btn) {
  currentView = view;
  document.querySelectorAll("[id^='vbtn-']").forEach(b => {
    b.style.background = "transparent";
    b.style.color      = "#888";
    b.style.fontWeight = "400";
  });
  if (btn) { btn.style.background = "gold"; btn.style.color = "#111"; btn.style.fontWeight = "700"; }
  renderGraph(currentRange);
}

// ── Data builders ────────────────────────
function buildTrendData(range) {
  const orders = validOrders();
  const now    = new Date();

  if (range === "week") {
    // Mon–Sun, grouped by day
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    monday.setHours(0,0,0,0);
    const labels  = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    const revenue = Array(7).fill(0);
    const ords    = Array(7).fill(0);
    orders.forEach(o => {
      const d = new Date(o.time);
      if (d >= monday) {
        const idx = (d.getDay() + 6) % 7;
        revenue[idx] += getOrderTotal(o);
        ords[idx]    += 1;
      }
    });
    return { labels, revenue, ords };
  }

  if (range === "month") {
    // Current month grouped by week
    const yr  = now.getFullYear(), mo = now.getMonth();
    const labels = [], revenue = [], ords = [];
    let ws = new Date(yr, mo, 1), wn = 1;
    while (ws.getMonth() === mo) {
      const we = new Date(ws); we.setDate(ws.getDate() + 6);
      labels.push(`Wk ${wn}`);
      let r = 0, c = 0;
      orders.forEach(o => {
        const d = new Date(o.time);
        if (d >= ws && d <= we && d.getMonth() === mo && d.getFullYear() === yr) {
          r += getOrderTotal(o); c++;
        }
      });
      revenue.push(r); ords.push(c);
      ws.setDate(ws.getDate() + 7); wn++;
      if (ws.getMonth() !== mo) break;
    }
    return { labels, revenue, ords };
  }

  // 6 months — grouped by month
  const labels = [], revenue = [], ords = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(d.toLocaleString("en-ZA", { month: "short" }));
    let r = 0, c = 0;
    orders.forEach(o => {
      const od = new Date(o.time);
      if (od.getFullYear() === d.getFullYear() && od.getMonth() === d.getMonth()) {
        r += getOrderTotal(o); c++;
      }
    });
    revenue.push(r); ords.push(c);
  }
  return { labels, revenue, ords };
}

function buildPeakData() {
  // Group all orders by hour of day
  const orders  = validOrders();
  const revenue = Array(24).fill(0);
  const ords    = Array(24).fill(0);
  orders.forEach(o => {
    const h = new Date(o.time).getHours();
    revenue[h] += getOrderTotal(o);
    ords[h]    += 1;
  });
  // Only show hours 10am–3am (club hours)
  const hours = [10,11,12,13,14,15,16,17,18,19,20,21,22,23,0,1,2,3];
  return {
    labels:  hours.map(h => h === 0 ? "12AM" : h < 12 ? `${h}AM` : h === 12 ? "12PM" : `${h-12}PM`),
    revenue: hours.map(h => revenue[h]),
    ords:    hours.map(h => ords[h])
  };
}

function buildCategoryData() {
  const orders  = validOrders();
  const revMap  = {}, cntMap = {};
  orders.forEach(o => {
    (o.items || []).forEach(item => {
      const cat = (item.category || item.cat || "other").toLowerCase();
      revMap[cat]  = (revMap[cat]  || 0) + (item.price || 0) * (item.qty || 1);
      cntMap[cat]  = (cntMap[cat]  || 0) + (item.qty  || 1);
    });
  });
  // Also infer from product name if category not stored on item
  if (!Object.keys(revMap).length) {
    orders.forEach(o => {
      (o.items || []).forEach(item => {
        const cat = "other";
        revMap[cat]  = (revMap[cat]  || 0) + (item.price || 0) * (item.qty || 1);
        cntMap[cat]  = (cntMap[cat]  || 0) + (item.qty  || 1);
      });
    });
  }
  const catColors = {
    beer:"#f59e0b", whiskey:"#a78bfa", cider:"#34d399",
    wine:"#f472b6", vodka:"#60a5fa", food:"#fb923c", other:"#94a3b8"
  };
  const entries = Object.entries(revMap).sort((a,b) => b[1]-a[1]);
  return {
    labels:  entries.map(([k]) => k.charAt(0).toUpperCase() + k.slice(1)),
    revenue: entries.map(([,v]) => v),
    counts:  entries.map(([k]) => cntMap[k] || 0),
    colors:  entries.map(([k]) => catColors[k] || "#94a3b8")
  };
}

// ── Main render ──────────────────────────
function renderGraph(range) {
  const ctx = document.getElementById("revenueChart");
  if (!ctx) return;

  if (revenueChart && typeof revenueChart.destroy === "function") {
    revenueChart.destroy();
  }
  revenueChart = null;

  // ── TREND VIEW
  if (currentView === "trend") {
    const d      = buildTrendData(range);
    const total  = d.revenue.reduce((a,b) => a+b, 0);
    const subMap = { week:"Daily revenue · this week", month:"Weekly revenue · this month", year:"Monthly revenue · last 6 months" };
    const el     = document.getElementById("graph-sub");
    if (el) el.textContent = subMap[range];
    document.getElementById("graph-total").textContent = `R${total.toLocaleString()}`;

    // Change % vs prior equivalent period
    const changeEl = document.getElementById("graph-change");
    if (changeEl) {
      const orders   = validOrders();
      const now      = new Date();
      let priorStart, priorEnd = new Date();
      if (range === "week") {
        const monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay()+6)%7)); monday.setHours(0,0,0,0);
        priorEnd   = new Date(monday); priorEnd.setDate(priorEnd.getDate()-1);
        priorStart = new Date(priorEnd); priorStart.setDate(priorEnd.getDate()-6);
      } else if (range === "month") {
        priorStart = new Date(now.getFullYear(), now.getMonth()-1, 1);
        priorEnd   = new Date(now.getFullYear(), now.getMonth(), 0);
      } else {
        priorStart = new Date(now.getFullYear(), now.getMonth()-11, 1);
        priorEnd   = new Date(now.getFullYear(), now.getMonth()-5, 0);
      }
      const prior = orders.filter(o => { const d=new Date(o.time); return d>=priorStart && d<=priorEnd; })
                          .reduce((s,o) => s+getOrderTotal(o), 0);
      const pct   = prior > 0 ? Math.round(((total-prior)/prior)*100) : null;
      if (pct !== null) {
        changeEl.textContent = (pct>=0?"↑ ":"↓ ") + Math.abs(pct) + "% vs prev period";
        changeEl.style.color = pct>=0 ? "#4ade80" : "#f87171";
      } else {
        changeEl.textContent = "";
      }
    }



    document.getElementById("graph-legend").innerHTML = `
      <div class="legend-item"><div class="legend-dot" style="background:gold"></div>Revenue (R)</div>
      <div class="legend-item"><div class="legend-dot" style="background:#555;border-style:dashed"></div>Orders</div>`;

    revenueChart = new Chart(ctx.getContext("2d"), {
      data: {
        labels: d.labels,
        datasets: [
          {
            type: "line",
            label: "Revenue",
            data: d.revenue,
            borderColor: "gold",
            backgroundColor: "rgba(255,215,0,0.07)",
            borderWidth: 2,
            pointBackgroundColor: "gold",
            pointRadius: 4, pointHoverRadius: 6,
            tension: 0.4, fill: true, yAxisID: "y"
          },
          {
            type: "bar",
            label: "Orders",
            data: d.ords,
            backgroundColor: "rgba(99,102,241,0.35)",
            borderColor: "#6366f1",
            borderWidth: 1,
            borderRadius: 4,
            yAxisID: "y1"
          }
        ]
      },
      options: {
        responsive: true,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#1a1a1a", borderColor: "#333", borderWidth: 1,
            titleColor: "#fff", bodyColor: "#aaa",
            callbacks: {
              label: c => c.datasetIndex === 0
                ? ` R${c.parsed.y.toLocaleString()}`
                : ` ${c.parsed.y} orders`
            }
          }
        },
        scales: {
          x: { grid:{ color:"#2a2a2a" }, ticks:{ color:"#666", font:{size:11} } },
          y: {
            position:"left", grid:{ color:"#2a2a2a" },
            ticks:{ color:"#666", font:{size:11}, callback: v=>`R${v.toLocaleString()}` }
          },
          y1: {
            position:"right", grid:{ drawOnChartArea:false },
            ticks:{ color:"#555", font:{size:11} }
          }
        }
      }
    });
    return;
  }

  // ── PEAK HOURS VIEW
  if (currentView === "peak") {
    const d     = buildPeakData();
    const peak  = d.revenue.indexOf(Math.max(...d.revenue));
    const total = d.revenue.reduce((a,b)=>a+b,0);
    const subEl = document.getElementById("graph-sub");
    if (subEl) subEl.textContent = peak >= 0 ? `Peak hour: ${d.labels[peak]}` : "All-time peak hours";
    document.getElementById("graph-total").textContent = `R${total.toLocaleString()}`;
    const changeEl = document.getElementById("graph-change");
    if (changeEl) {
      changeEl.textContent = peak >= 0 ? `🔥 Busiest: ${d.labels[peak]}` : "";
      changeEl.style.color = "#f59e0b";
    }


    document.getElementById("graph-legend").innerHTML = `
      <div class="legend-item"><div class="legend-dot" style="background:#f59e0b"></div>Revenue by hour</div>
      <div class="legend-item"><div class="legend-dot" style="background:#6366f1"></div>Orders by hour</div>`;

    const barColors = d.revenue.map((v, i) =>
      i === peak ? "#f59e0b" : "rgba(245,158,11,0.3)"
    );

    revenueChart = new Chart(ctx.getContext("2d"), {
      data: {
        labels: d.labels,
        datasets: [
          {
            type: "bar",
            label: "Revenue",
            data: d.revenue,
            backgroundColor: barColors,
            borderColor: barColors.map(c => c === "#f59e0b" ? "#f59e0b" : "rgba(245,158,11,0.5)"),
            borderWidth: 1,
            borderRadius: 4,
            yAxisID: "y"
          },
          {
            type: "line",
            label: "Orders",
            data: d.ords,
            borderColor: "#6366f1",
            backgroundColor: "transparent",
            borderWidth: 2,
            pointRadius: 3, pointHoverRadius: 5,
            tension: 0.4,
            yAxisID: "y1"
          }
        ]
      },
      options: {
        responsive: true,
        interaction: { mode:"index", intersect:false },
        plugins: {
          legend: { display:false },
          tooltip: {
            backgroundColor:"#1a1a1a", borderColor:"#333", borderWidth:1,
            titleColor:"#fff", bodyColor:"#aaa",
            callbacks: {
              label: c => c.datasetIndex === 0
                ? ` R${c.parsed.y.toLocaleString()}`
                : ` ${c.parsed.y} orders`
            }
          }
        },
        scales: {
          x: { grid:{ color:"#2a2a2a" }, ticks:{ color:"#666", font:{size:10} } },
          y: {
            position:"left", grid:{ color:"#2a2a2a" },
            ticks:{ color:"#666", font:{size:11}, callback: v=>`R${v.toLocaleString()}` }
          },
          y1: {
            position:"right", grid:{ drawOnChartArea:false },
            ticks:{ color:"#555", font:{size:11} }
          }
        }
      }
    });
    return;
  }

  // ── CATEGORY VIEW
  if (currentView === "category") {
    const d     = buildCategoryData();
    const total = d.revenue.reduce((a,b)=>a+b,0);
    const top   = d.labels[0] || "—";
    const subEl = document.getElementById("graph-sub");
    if (subEl) subEl.textContent = `Revenue by drink category · top: ${top}`;
    document.getElementById("graph-total").textContent = `R${total.toLocaleString()}`;
    const changeEl = document.getElementById("graph-change");
    if (changeEl) {
      changeEl.textContent = d.labels.length ? `${d.labels.length} categories` : "no orders yet";
      changeEl.style.color = "#94a3b8";
    }


    document.getElementById("graph-legend").innerHTML = d.labels.map((l, i) =>
      `<div class="legend-item"><div class="legend-dot" style="background:${d.colors[i]}"></div>${l}</div>`
    ).join("");

    revenueChart = new Chart(ctx.getContext("2d"), {
      data: {
        labels: d.labels,
        datasets: [
          {
            type: "bar",
            label: "Revenue",
            data: d.revenue,
            backgroundColor: d.colors.map(c => c + "bb"),
            borderColor: d.colors,
            borderWidth: 2,
            borderRadius: 6,
            yAxisID: "y"
          },
          {
            type: "line",
            label: "Units Sold",
            data: d.counts,
            borderColor: "#94a3b8",
            backgroundColor: "transparent",
            borderWidth: 1.5,
            pointRadius: 4, pointHoverRadius: 6,
            borderDash: [4, 3],
            tension: 0.4,
            yAxisID: "y1"
          }
        ]
      },
      options: {
        responsive: true,
        interaction: { mode:"index", intersect:false },
        plugins: {
          legend: { display:false },
          tooltip: {
            backgroundColor:"#1a1a1a", borderColor:"#333", borderWidth:1,
            titleColor:"#fff", bodyColor:"#aaa",
            callbacks: {
              label: c => c.datasetIndex === 0
                ? ` R${c.parsed.y.toLocaleString()}`
                : ` ${c.parsed.y} units sold`
            }
          }
        },
        scales: {
          x: { grid:{ color:"#2a2a2a" }, ticks:{ color:"#666", font:{size:11} } },
          y: {
            position:"left", grid:{ color:"#2a2a2a" },
            ticks:{ color:"#666", font:{size:11}, callback: v=>`R${v.toLocaleString()}` }
          },
          y1: {
            position:"right", grid:{ drawOnChartArea:false },
            ticks:{ color:"#555", font:{size:11} }
          }
        }
      }
    });
  }
}


/* ─────────────────────────────────────────
   RECENT ORDERS — NEW VERSION
───────────────────────────────────────── */
let recentOrdersData = [
  { id:"#1089", customer:"Sipho M.",     items:"Beer x2, Chips x1",     total:"R95",  time: new Date(Date.now()-2*60000),   status:"pending"    },
  { id:"#1088", customer:"Lerato K.",    items:"Whiskey x1",            total:"R80",  time: new Date(Date.now()-8*60000),   status:"completed"  },
  { id:"#1087", customer:"Thabo N.",     items:"Cider x3",              total:"R120", time: new Date(Date.now()-15*60000),  status:"processing" },
  { id:"#1086", customer:"Nomsa D.",     items:"Castle Lager x4",       total:"R100", time: new Date(Date.now()-22*60000),  status:"completed"  },
  { id:"#1085", customer:"Kagiso P.",    items:"Wings x2, Beer x1",     total:"R240", time: new Date(Date.now()-35*60000),  status:"pending"    },
  { id:"#1084", customer:"Zanele V.",    items:"Soft Drink x2",         total:"R40",  time: new Date(Date.now()-48*60000),  status:"completed"  },
  { id:"#1083", customer:"Bongani T.",   items:"Whiskey x2, Chips x2",  total:"R210", time: new Date(Date.now()-65*60000),  status:"cancelled"  },
  { id:"#1082", customer:"Mpho S.",      items:"Beer x1",               total:"R30",  time: new Date(Date.now()-70*60000),  status:"pending"    },
  { id:"#1081", customer:"Rethabile G.", items:"Cider x1, Wings x1",    total:"R165", time: new Date(Date.now()-90*60000),  status:"completed"  },
  { id:"#1080", customer:"Dineo W.",     items:"Castle Lager x2",       total:"R50",  time: new Date(Date.now()-110*60000), status:"completed"  },
];

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60)    return "Just now";
  if (diff < 3600)  return Math.floor(diff / 60)   + " min ago";
  if (diff < 86400) return Math.floor(diff / 3600)  + " hr ago";
  return new Date(date).toLocaleDateString("en-ZA");
}

const statusConfig = {
  completed:  { label: "✓ Completed",   cls: "completed"  },
  pending:    { label: "⏳ Pending",     cls: "pending"    },
  processing: { label: "⚙ Processing",  cls: "processing" },
  cancelled:  { label: "✕ Cancelled",   cls: "cancelled"  },
};

function renderRecentOrders(data) {
  const src   = data || recentOrdersData;
  const tbody = document.getElementById("recent-orders-body");
  if (!tbody) return;

  if (!src.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="state-msg">No orders found</td></tr>`;
    return;
  }

  tbody.innerHTML = src.map(order => {
    const idx  = recentOrdersData.indexOf(order);
    const sc   = statusConfig[order.status] || statusConfig.pending;
    const done = order.status === "completed" || order.status === "cancelled";

    return `
      <tr>
        <td><span class="order-id">${order.id}</span></td>
        <td style="font-weight:500">${order.customer}</td>
        <td><span class="order-items" title="${order.items}">${order.items}</span></td>
        <td><span class="order-total">${order.total}</span></td>
        <td><span class="order-time">${timeAgo(order.time)}</span></td>
        <td><span class="status ${sc.cls}">${sc.label}</span></td>
        <td>
          <div class="action-group">
            <button class="act-btn complete" onclick="updateOrderStatus('${order.id}','completed')"
            ${done ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : ''}>✓</button>
            <button class="act-btn cancel"   onclick="updateOrderStatus('${order.id}','cancelled')"
            ${done ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : ''}>✕</button>
            <button class="act-btn view"     onclick="viewOrderDetail('${order.id}')">View</button>    onclick="viewOrder(${idx})">View</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function viewOrder(orderId) {
  viewOrderDetail(orderId);
}

function filterRecentOrders(search) {
  const filterVal = document.getElementById("orders-filter").value;
  const q = (search || "").toLowerCase();

  const filtered = recentOrdersData.filter(o => {
    const matchSearch = !q ||
      o.id.toLowerCase().includes(q) ||
      o.customer.toLowerCase().includes(q) ||
      o.items.toLowerCase().includes(q);
    const matchFilter = filterVal === "all" || o.status === filterVal;
    return matchSearch && matchFilter;
  });

  renderRecentOrders(filtered);
}

/* ════════════════════════════════════════
   USERS TAB 
════════════════════════════════════════ */

const USERS_URL = `${API_BASE}/users`;

let allUsersData = [];

/* ────────────────────────────────────────
   AVATAR COLOR — generates consistent color
   per user based on their name
──────────────────────────────────────── */
function avatarColor(name) {
  const colors = [
    ["#3b1f00","#f5a623"], ["#001a30","#60a5fa"],
    ["#0d2200","#4ade80"], ["#1a0030","#a78bfa"],
    ["#2a0a00","#fb923c"], ["#001a1a","#2dd4bf"],
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  const [bg, text] = colors[hash % colors.length];
  return { bg, text };
}

function initials(name) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

/* ────────────────────────────────────────
   FORMAT DATE
──────────────────────────────────────── */
function formatJoined(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-ZA", {
    day: "numeric", month: "short", year: "numeric"
  });
}

function isThisWeek(dateStr) {
  if (!dateStr) return false;
  const diff = Date.now() - new Date(dateStr).getTime();
  return diff < 7 * 86400000;
}

/* ────────────────────────────────────────
   SUMMARY STRIP
──────────────────────────────────────── */
function updateUserSummary(users) {
  const admins    = users.filter(u => u.role === "admin").length;
  const customers = users.filter(u => u.role === "customer").length;
  const newUsers  = users.filter(u => isThisWeek(u.created_at)).length;

  document.getElementById("usr-total").textContent     = users.length;
  document.getElementById("usr-admins").textContent    = admins;
  document.getElementById("usr-customers").textContent = customers;
  document.getElementById("usr-new").textContent       = newUsers;
}

/* ────────────────────────────────────────
   LOAD USERS FROM BACKEND
──────────────────────────────────────── */
async function loadUsers() {
  const tbody = document.getElementById("users-body");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="5" class="state-msg">Loading users...</td></tr>`;

  try {
    const res = await fetch(USERS_URL, {
      method: "GET",
      headers: authHeaders()
    });

    if (!res.ok) throw new Error(`Server responded with ${res.status}`);

    const users = await res.json();
    allUsersData = users;

    updateUserSummary(users);
    filterUsers();

  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="5" class="state-msg" style="color:#f87171">
      Failed to load users. Is your API running?
    </td></tr>`;
    showToast("Could not load users", "error");
  }
}

/* ────────────────────────────────────────
   FILTER
──────────────────────────────────────── */
function filterUsers() {
  const search = (document.getElementById("usr-search")?.value || "").toLowerCase();
  const role   =  document.getElementById("usr-role-filter")?.value || "all";

  const filtered = allUsersData.filter(u => {
    const matchSearch = !search ||
      u.name.toLowerCase().includes(search) ||
      u.email.toLowerCase().includes(search);
    const matchRole = role === "all" || u.role === role;
    return matchSearch && matchRole;
  });

  renderUsersTable(filtered);
}

/* ────────────────────────────────────────
   RENDER TABLE
──────────────────────────────────────── */
function renderUsersTable(users) {
  const tbody = document.getElementById("users-body");
  if (!tbody) return;

  // Get logged-in user id to mark "You"
  const me = JSON.parse(localStorage.getItem("user") || "null");

  if (!users.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="state-msg">No users found</td></tr>`;
    return;
  }

  tbody.innerHTML = users.map(u => {
    const av      = avatarColor(u.name || "?");
    const isMe    = me && me.id === u.id;
    const roleCls = u.role === "admin" ? "role-admin" : "role-customer";
    const roleIcon= u.role === "admin" ? "👑" : "🧑";

    return `
      <tr style="animation: rowIn 0.3s ease both;">
        <td>
          <div class="usr-cell">
            <div class="usr-avatar" style="background:${av.bg}; color:${av.text};">
              ${initials(u.name || "?")}
            </div>
            <div>
              <div class="usr-name">
                ${u.name}
                ${isMe ? '<span class="self-badge">You</span>' : ''}
              </div>
            </div>
          </div>
        </td>
        <td class="usr-email-cell">${u.email}</td>
        <td>
          <span class="role-badge ${roleCls}">${roleIcon} ${u.role}</span>
        </td>
        <td class="usr-date">${formatJoined(u.created_at)}</td>
        <td>
          <div class="action-group">
            <button class="act-btn view"
              onclick="openUserModal(${u.id})">✏ Edit</button>
            <button class="act-btn cancel"
              onclick="confirmDeleteUser(${u.id}, '${u.name.replace(/'/g, "\\'")}')"
              ${isMe ? 'disabled title="Cannot delete your own account"' : ''}>
              🗑
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

/* ────────────────────────────────────────
   OPEN MODAL — Add or Edit
──────────────────────────────────────── */
async function openUserModal(userId = null) {
  document.getElementById("user-modal-id").value       = "";
  document.getElementById("user-modal-name").value     = "";
  document.getElementById("user-modal-email").value    = "";
  document.getElementById("user-modal-role").value     = "customer";
  document.getElementById("user-modal-password").value = "";

  const hint  = document.getElementById("user-modal-pass-hint");
  const label = document.getElementById("user-modal-pass-label");
  const title = document.getElementById("user-modal-title");

  if (userId) {
    // EDIT MODE — fetch current user data
    title.textContent  = "Edit User";
    hint.style.display = "block";
    label.textContent  = "New Password";

    try {
      const res = await fetch(`${USERS_URL}/${userId}`, {
        headers: authHeaders()
      });
      if (!res.ok) throw new Error("Failed to fetch user");
      const user = await res.json();

      document.getElementById("user-modal-id").value    = user.id;
      document.getElementById("user-modal-name").value  = user.name;
      document.getElementById("user-modal-email").value = user.email;
      document.getElementById("user-modal-role").value  = user.role;
    } catch (err) {
      showToast("Could not load user data", "error");
      return;
    }
  } else {
    // ADD MODE
    title.textContent  = "Add User";
    hint.style.display = "none";
    label.textContent  = "Password";
  }

  document.getElementById("user-modal").classList.add("open");
}

function closeUserModal() {
  document.getElementById("user-modal").classList.remove("open");
}

// Close on outside click
document.getElementById("user-modal").addEventListener("click", function(e) {
  if (e.target === this) closeUserModal();
});

/* ────────────────────────────────────────
   SAVE USER (Create or Update)
──────────────────────────────────────── */
async function saveUser() {
  const id       = document.getElementById("user-modal-id").value;
  const name     = document.getElementById("user-modal-name").value.trim();
  const email    = document.getElementById("user-modal-email").value.trim();
  const role     = document.getElementById("user-modal-role").value;
  const password = document.getElementById("user-modal-password").value;

  if (!name || !email) {
    showToast("Name and email are required", "error");
    return;
  }

  if (!id && !password) {
    showToast("Password is required for new users", "error");
    return;
  }

  const btn = document.getElementById("user-save-btn");
  btn.disabled    = true;
  btn.textContent = "Saving...";

  const body = { name, email, role };
  if (password) body.password = password;

  try {
    const url    = id ? `${USERS_URL}/${id}` : USERS_URL;
    const method = id ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: authHeaders(),
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Save failed");

    showToast(id ? "✅ User updated" : "✅ User created");
    closeUserModal();
    loadUsers();

  } catch (err) {
    console.error(err);
    showToast("❌ " + err.message, "error");
  } finally {
    btn.disabled    = false;
    btn.textContent = "Save User";
  }
}

/* ────────────────────────────────────────
   DELETE USER
──────────────────────────────────────── */
function confirmDeleteUser(id, name) {
  if (!confirm(`Delete user "${name}"?\nThis cannot be undone.`)) return;
  deleteUser(id, name);
}

async function deleteUser(id, name) {
  try {
    const res = await fetch(`${USERS_URL}/${id}`, {
      method: "DELETE",
      headers: authHeaders()
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Delete failed");

    showToast(`🗑 ${name} deleted`);
    loadUsers();

  } catch (err) {
    console.error(err);
    showToast("❌ " + err.message, "error");
  }
}

/* ─────────────────────────────────────────
   LOGOUT
───────────────────────────────────────── */
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.replace("index.html");
}

/* ─────────────────────────────────────────
   TOPBAR DATE
───────────────────────────────────────── */
document.getElementById("topbar-date").textContent = new Date().toLocaleDateString("en-ZA", {
  weekday: "long",
  year:    "numeric",
  month:   "long",
  day:     "numeric"
});

/* ─────────────────────────────────────────
   SHOW ADMIN NAME FROM LOCALSTORAGE
───────────────────────────────────────── */
(function setAdminName() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (user?.name) {
    document.getElementById("admin-name").textContent = user.name;
  }
})();

/* ════════════════════════════════════════
   ANALYTICS TAB — FULL JAVASCRIPT
   showSection() calls loadAnalytics() when
   the Analytics tab is opened (line 450)
════════════════════════════════════════ */

/* ────────────────────────────────────────
   CHART INSTANCES — kept so we can destroy
   and recreate on range change
──────────────────────────────────────── */
let anCharts = {};
let anRange  = "7d";
let anShowForecast = false;

/* ────────────────────────────────────────
   SAMPLE DATA (replace with real API calls)
   Structure matches what your backend returns
──────────────────────────────────────── */
function setAnalyticsRange(range, btn) {
  document.querySelectorAll('.an-range-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadAnalytics(range);
}

// staticData removed — analytics now powered by /api/analytics

/* ────────────────────────────────────────
   CHART.JS DEFAULTS — PREMIUM
──────────────────────────────────────── */
let currentAnalyticsRange = '7d';

function chartDefaults(prefix = '') {
  return {
    responsive: true,
    maintainAspectRatio: true,
    animation: { duration: 800, easing: 'easeInOutQuart' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0d0d0d',
        borderColor: '#252525',
        borderWidth: 1,
        titleColor: '#e0e0e0',
        bodyColor: '#666',
        padding: { top:10, bottom:10, left:14, right:14 },
        cornerRadius: 10,
        titleFont: { family:"'Syne', sans-serif", size:12, weight:'700' },
        bodyFont:  { family:"'JetBrains Mono', monospace", size:12 },
        displayColors: false,
        callbacks: {
          label: ctx => prefix
            ? ` ${prefix}${ctx.parsed.y?.toLocaleString('en-ZA') ?? 0}`
            : ` ${ctx.parsed.y}`,
        },
      },
    },
    scales: {
      x: { grid:{ color:'#1c1c1c' }, ticks:{ color:'#555', font:{size:10} } },
      y: { grid:{ color:'#1c1c1c' }, ticks:{ color:'#555', font:{size:10},
        callback: v => prefix ? `${prefix}${v.toLocaleString('en-ZA')}` : v,
      }},
    },
  };
}

function destroyChart(key) {
  if (anCharts[key]) { anCharts[key].destroy(); delete anCharts[key]; }
}

/* ────────────────────────────────────────
   ANALYTICS DATA BUILDER
   Computes everything from local order cache
   (same source used by dashboard + orders tab)
──────────────────────────────────────── */
function buildAnalyticsData(range) {
  const allOrders  = loadStoredOrders();
  const now        = new Date();

  // ── Date window ────────────────────────────────
  function windowStart(r) {
    const d = new Date(now);
    if (r === '7d')  { d.setDate(d.getDate() - 6);   d.setHours(0,0,0,0); return d; }
    if (r === '30d') { d.setDate(d.getDate() - 29);   d.setHours(0,0,0,0); return d; }
    if (r === '3m')  { d.setMonth(d.getMonth() - 3);  d.setDate(1); d.setHours(0,0,0,0); return d; }
    if (r === '6m')  { d.setMonth(d.getMonth() - 6);  d.setDate(1); d.setHours(0,0,0,0); return d; }
    if (r === '1y')  { d.setFullYear(d.getFullYear()-1); d.setDate(1); d.setHours(0,0,0,0); return d; }
    return d;
  }

  const start     = windowStart(range);
  const prevStart = windowStart(range);                          // mirror for prior period
  const prevEnd   = new Date(start.getTime() - 1);
  const prevPeriodMs = now - start;
  prevStart.setTime(prevEnd.getTime() - prevPeriodMs);

  const periodOrders = allOrders.filter(o => new Date(o.time) >= start);
  const validPeriod  = periodOrders.filter(o => o.status !== 'cancelled');
  const prevOrders   = allOrders.filter(o => {
    const t = new Date(o.time);
    return t >= prevStart && t <= prevEnd && o.status !== 'cancelled';
  });

  // ── Change helper ───────────────────────────────
  function changeBadge(curr, prev) {
    if (prev === 0) return { text: curr > 0 ? '↑ new' : '—', dir: curr > 0 ? 'up' : 'flat' };
    const pct = Math.round(((curr - prev) / prev) * 100);
    return {
      text: (pct >= 0 ? '↑ ' : '↓ ') + Math.abs(pct) + '% vs prev',
      dir:  pct >= 0 ? 'up' : 'down',
    };
  }

  // ── KPIs ───────────────────────────────────────
  const revenue    = validPeriod.reduce((s,o) => s + getOrderTotal(o), 0);
  const prevRev    = prevOrders.reduce((s,o) => s + getOrderTotal(o), 0);
  const orders     = validPeriod.length;
  const prevOrdCnt = prevOrders.length;
  const aov        = orders > 0 ? Math.round(revenue / orders) : 0;
  const prevAov    = prevOrdCnt > 0 ? Math.round(prevRev / prevOrdCnt) : 0;

  const custSet     = new Set(validPeriod.map(o => o.customer));
  const prevCustSet = new Set(prevOrders.map(o => o.customer));

  // Best day of week in this period
  const dayRevMap = {};
  validPeriod.forEach(o => {
    const day = new Date(o.time).toLocaleDateString('en-ZA', { weekday: 'long' });
    dayRevMap[day] = (dayRevMap[day] || 0) + getOrderTotal(o);
  });
  const bestDayEntry = Object.entries(dayRevMap).sort((a,b) => b[1]-a[1])[0];

  const kpi = {
    revenue:   { value: `R${revenue.toLocaleString('en-ZA')}`,  change: changeBadge(revenue,        prevRev)      },
    orders:    { value: orders,                                   change: changeBadge(orders,         prevOrdCnt)   },
    customers: { value: custSet.size,                            change: changeBadge(custSet.size,    prevCustSet.size) },
    aov:       { value: `R${aov.toLocaleString('en-ZA')}`,      change: changeBadge(aov,             prevAov)      },
    bestDay:   {
      label: bestDayEntry ? bestDayEntry[0] : '—',
      value: bestDayEntry ? `R${Math.round(bestDayEntry[1]).toLocaleString('en-ZA')}` : 'R0',
    },
  };

  // ── Revenue trend labels & buckets ─────────────
  const trend = (function() {
    const labels = [], revenue = [];

    if (range === '7d') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        labels.push(d.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric' }));
        const ds = d.toDateString();
        revenue.push(
          validPeriod.filter(o => new Date(o.time).toDateString() === ds)
                     .reduce((s,o) => s + getOrderTotal(o), 0)
        );
      }
    } else if (range === '30d') {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        labels.push(d.getDate() + '/' + (d.getMonth()+1));
        const ds = d.toDateString();
        revenue.push(
          validPeriod.filter(o => new Date(o.time).toDateString() === ds)
                     .reduce((s,o) => s + getOrderTotal(o), 0)
        );
      }
    } else {
      // 3m / 6m / 1y — group by month
      const months = range === '3m' ? 3 : range === '6m' ? 6 : 12;
      for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(d.toLocaleDateString('en-ZA', { month: 'short', year: '2-digit' }));
        revenue.push(
          validPeriod.filter(o => {
            const od = new Date(o.time);
            return od.getFullYear() === d.getFullYear() && od.getMonth() === d.getMonth();
          }).reduce((s,o) => s + getOrderTotal(o), 0)
        );
      }
    }

    // Optional 7-day linear forecast appended
    if (anShowForecast && revenue.length >= 2) {
      const last = revenue.slice(-7);
      const avg  = last.reduce((a,b)=>a+b,0) / last.length;
      const slope = (last[last.length-1] - last[0]) / Math.max(last.length-1,1);
      for (let i = 1; i <= 7; i++) {
        labels.push(`F+${i}`);
        revenue.push(Math.max(0, Math.round(avg + slope * i)));
      }
    }

    return { labels, revenue };
  })();

  // ── Categories donut ───────────────────────────
  const catRevMap = {}, catCntMap = {};
  validPeriod.forEach(o => {
    (o.items || []).forEach(item => {
      const cat = (item.category || item.cat || 'other').toLowerCase();
      catRevMap[cat]  = (catRevMap[cat]  || 0) + (item.price || 0) * (item.qty || 1);
      catCntMap[cat]  = (catCntMap[cat]  || 0) + (item.qty  || 1);
    });
  });
  const catTotal = Object.values(catRevMap).reduce((a,b)=>a+b,0) || 1;
  const categories = Object.entries(catRevMap)
    .sort((a,b) => b[1]-a[1])
    .map(([name, rev]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      revenue: Math.round(rev),
      pct: Math.round((rev / catTotal) * 100),
    }));

  // ── Peak hours ─────────────────────────────────
  const hourOrds = Array(24).fill(0);
  validPeriod.forEach(o => { hourOrds[new Date(o.time).getHours()]++; });
  const hoursRange = [10,11,12,13,14,15,16,17,18,19,20,21,22,23,0,1,2,3];
  const hours = hoursRange.map(h => ({
    label:  h === 0 ? '12AM' : h < 12 ? `${h}AM` : h === 12 ? '12PM' : `${h-12}PM`,
    orders: hourOrds[h],
  }));
  const peakIdx    = hours.reduce((mi,h,i,arr) => h.orders > arr[mi].orders ? i : mi, 0);
  const peakHour   = hours[peakIdx];

  // ── Payment methods ────────────────────────────
  const payMap = {};
  periodOrders.forEach(o => {
    const m = (o.payment || 'cash').toLowerCase();
    payMap[m] = (payMap[m] || 0) + 1;
  });
  const payments = Object.entries(payMap).map(([method, count]) => ({
    method: method.charAt(0).toUpperCase() + method.slice(1),
    count,
  }));

  // ── Best weekdays (avg revenue) ────────────────
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const dayBuckets = Array.from({length:7}, () => ({ total:0, days:new Set() }));
  validPeriod.forEach(o => {
    const d = new Date(o.time);
    dayBuckets[d.getDay()].total += getOrderTotal(o);
    dayBuckets[d.getDay()].days.add(d.toDateString());
  });
  const weekdays = dayNames.map((name, i) => ({
    name,
    avg: dayBuckets[i].days.size > 0
      ? Math.round(dayBuckets[i].total / dayBuckets[i].days.size)
      : 0,
  }));

  // ── Top products ───────────────────────────────
  const prodRevMap = {}, prodUnits = {};
  validPeriod.forEach(o => {
    (o.items || []).forEach(item => {
      prodRevMap[item.name]  = (prodRevMap[item.name]  || 0) + (item.price||0) * (item.qty||1);
      prodUnits[item.name]   = (prodUnits[item.name]   || 0) + (item.qty  || 1);
    });
  });
  const maxProdRev = Math.max(...Object.values(prodRevMap), 1);
  const products = Object.entries(prodRevMap)
    .sort((a,b) => b[1]-a[1])
    .slice(0, 8)
    .map(([name, rev], i) => ({
      rank:   i + 1,
      name,
      revenue: Math.round(rev),
      units:   prodUnits[name] || 0,
      barPct:  Math.round((rev / maxProdRev) * 100),
    }));

  // ── Customer insights ──────────────────────────
  const custOrderCount = {};
  validPeriod.forEach(o => {
    custOrderCount[o.customer] = (custOrderCount[o.customer] || 0) + 1;
  });
  const oneTime   = Object.values(custOrderCount).filter(c => c === 1).length;
  const returning = Object.values(custOrderCount).filter(c => c > 1).length;

  const custSpend = {};
  validPeriod.forEach(o => {
    custSpend[o.customer] = (custSpend[o.customer] || 0) + getOrderTotal(o);
  });
  const topCustomers = Object.entries(custSpend)
    .sort((a,b) => b[1]-a[1])
    .slice(0, 5)
    .map(([name, spent]) => ({ name, spent }));

  // ── Smart alerts ───────────────────────────────
  const alerts = [];
  if (revenue === 0 && orders === 0) {
    alerts.push({ type:'info', icon:'📊', text:'No orders in this period yet — try a wider range.' });
  } else {
    if (kpi.revenue.change.dir === 'up')
      alerts.push({ type:'success', icon:'📈', text:`Revenue is up vs the previous period — keep it up!` });
    if (kpi.revenue.change.dir === 'down')
      alerts.push({ type:'warn', icon:'📉', text:`Revenue is down vs the previous period. Check peak hours.` });
    if (peakHour.orders > 0)
      alerts.push({ type:'gold', icon:'🔥', text:`Busiest time: ${peakHour.label} with ${peakHour.orders} orders — consider extra staff then.` });
    if (returning > 0)
      alerts.push({ type:'success', icon:'🔁', text:`${returning} returning customer${returning>1?'s':''} this period — loyalty is building.` });
  }

  // Low stock alert from product list
  const lowItems = allProducts.filter(p => p.stock > 0 && p.stock <= (p.lowStockThreshold || 5));
  const outItems = allProducts.filter(p => p.stock === 0);
  if (outItems.length > 0)
    alerts.push({ type:'warn', icon:'⚠️', text:`${outItems.length} product${outItems.length>1?'s are':' is'} out of stock.` });
  else if (lowItems.length > 0)
    alerts.push({ type:'warn', icon:'📦', text:`${lowItems.length} product${lowItems.length>1?'s are':' is'} running low on stock.` });

  return { kpi, trend, categories, hours, peakHour, payments, weekdays, products, customers: { oneTime, returning }, topCustomers, alerts };
}

/* ────────────────────────────────────────
   LOAD ANALYTICS — computes from local
   order cache, no external API needed
──────────────────────────────────────── */
async function loadAnalytics(range = '7d') {
  currentAnalyticsRange = range;

  // Sync fresh orders from server first, then compute
  await syncOrdersFromServer();
  const data = buildAnalyticsData(range);

  // ── KPI Cards ──────────────────────────────
  document.getElementById('kpi-revenue').textContent     = data.kpi.revenue.value;
  document.getElementById('kpi-orders').textContent      = data.kpi.orders.value;
  document.getElementById('kpi-customers').textContent   = data.kpi.customers.value;
  document.getElementById('kpi-aov').textContent         = data.kpi.aov.value;
  document.getElementById('kpi-bestday').textContent     = data.kpi.bestDay.label;
  document.getElementById('kpi-bestday-sub').textContent = data.kpi.bestDay.value + ' avg';

  setKpiChange('kpi-revenue-change',   data.kpi.revenue.change);
  setKpiChange('kpi-orders-change',    data.kpi.orders.change);
  setKpiChange('kpi-customers-change', data.kpi.customers.change);
  setKpiChange('kpi-aov-change',       data.kpi.aov.change);

  // ── Smart Alerts ──────────────────────────
  const alertBox = document.getElementById('an-alerts');
  if (alertBox) alertBox.innerHTML = data.alerts.map((a, i) =>
    `<div class="an-alert an-alert-${a.type}" style="animation-delay:${i*0.08}s">${a.icon} ${a.text}</div>`
  ).join('');

  // ── Revenue Trend Chart ───────────────────
  destroyChart('revenue');
  const revCtx = document.getElementById('an-revenue-chart');
  if (revCtx) {
    const total = data.trend.revenue.reduce((a,b) => a+b, 0);
    const pill  = document.getElementById('an-revenue-total');
    if (pill) pill.textContent = `R${total.toLocaleString('en-ZA')} total`;

    anCharts.revenue = new Chart(revCtx, {
      type: 'line',
      data: {
        labels: data.trend.labels,
        datasets: [{
          label: 'Revenue',
          data: data.trend.revenue,
          borderColor: '#f5c842',
          backgroundColor: 'rgba(245,200,66,0.07)',
          borderWidth: 2,
          pointBackgroundColor: '#f5c842',
          pointRadius: 3,
          pointHoverRadius: 6,
          tension: 0.4,
          fill: true,
        }],
      },
      options: { ...chartDefaults('R') },
    });
  }

  // ── Category Donut ────────────────────────
  renderDonut(
    'an-donut-chart', 'an-donut-legend', 'an-donut-center-val',
    data.categories.map(c => c.name),
    data.categories.map(c => c.revenue),
    data.categories, 'R'
  );

  // ── Peak Hours Bar ────────────────────────
  destroyChart('hours');
  const hrsCtx = document.getElementById('an-hours-chart');
  if (hrsCtx) {
    const max = Math.max(...data.hours.map(h => h.orders));
    anCharts.hours = new Chart(hrsCtx, {
      type: 'bar',
      data: {
        labels: data.hours.map(h => h.label),
        datasets: [{
          data: data.hours.map(h => h.orders),
          backgroundColor: data.hours.map(h =>
            h.orders === max ? 'rgba(245,200,66,0.8)' : 'rgba(255,255,255,0.06)'
          ),
          borderRadius: 4,
        }],
      },
      options: {
        ...chartDefaults(),
        scales: {
          x: { grid:{ display:false }, ticks:{ color:'#555', font:{size:10} } },
          y: { display: false },
        },
      },
    });
    const insight = document.getElementById('an-peak-insight');
    if (insight) insight.textContent =
      `🔥 Peak time is ${data.peakHour.label} with ${data.peakHour.orders} orders — schedule extra staff then.`;
  }

  // ── Payment Methods Donut ─────────────────
  renderDonut(
    'an-payment-chart', 'an-payment-legend', 'an-pay-center-val',
    data.payments.map(p => p.method),
    data.payments.map(p => p.count),
    data.payments.map(p => ({ name: p.method, revenue: p.count, pct: 0 })), ''
  );
  const payCenter = document.getElementById('an-pay-center-val');
  if (payCenter) payCenter.textContent = data.payments.reduce((a,p) => a + p.count, 0);

  // ── Best Days Bar ─────────────────────────
  destroyChart('days');
  const daysCtx = document.getElementById('an-days-chart');
  if (daysCtx) {
    const maxDay = Math.max(...data.weekdays.map(d => d.avg));
    anCharts.days = new Chart(daysCtx, {
      type: 'bar',
      data: {
        labels: data.weekdays.map(d => d.name),
        datasets: [{
          data: data.weekdays.map(d => d.avg),
          backgroundColor: data.weekdays.map(d =>
            d.avg === maxDay ? 'rgba(245,200,66,0.8)' : 'rgba(255,255,255,0.06)'
          ),
          borderRadius: 4,
        }],
      },
      options: {
        ...chartDefaults('R'),
        scales: {
          x: { grid:{display:false}, ticks:{color:'#555',font:{size:10}} },
          y: { grid:{color:'#1c1c1c'}, ticks:{color:'#555',font:{size:10}, callback:v=>`R${(v/1000).toFixed(0)}k`} },
        },
      },
    });
  }

  // ── Top Products ──────────────────────────
  const prodEl = document.getElementById('an-top-products');
  if (prodEl) prodEl.innerHTML = data.products.map(p => `
    <div class="an-product-row">
      <div class="an-product-rank ${p.rank <= 3 ? 'rank-' + p.rank : 'rank-n'}">${p.rank}</div>
      <div class="an-product-name">${p.name}</div>
      <div class="an-product-bar-wrap">
        <div class="an-product-bar" style="width:${p.barPct}%"></div>
      </div>
      <div class="an-product-units">${p.units} sold</div>
      <div class="an-product-rev">R${p.revenue.toLocaleString('en-ZA')}</div>
    </div>
  `).join('');

  // ── Customer Insights ─────────────────────
  const statsEl = document.getElementById('an-customer-stats');
  if (statsEl) statsEl.innerHTML = `
    <div class="an-cust-stat">
      <div class="an-cust-stat-val">${data.customers.oneTime}</div>
      <div class="an-cust-stat-lbl">One-time</div>
    </div>
    <div class="an-cust-stat">
      <div class="an-cust-stat-val" style="color:#60a5fa;">${data.customers.returning}</div>
      <div class="an-cust-stat-lbl">Returning</div>
    </div>
  `;

  const colors = ['#f5c842','#60a5fa','#4ade80','#f97316','#a78bfa'];
  const custsEl = document.getElementById('an-top-customers');
  if (custsEl) custsEl.innerHTML = data.topCustomers.map((c, i) => `
    <div class="an-top-cust-row">
      <div class="an-cust-avatar" style="background:${colors[i%colors.length]}22;color:${colors[i%colors.length]};">
        ${c.name.slice(0,2).toUpperCase()}
      </div>
      <div class="an-cust-name" style="flex:1;">${c.name}</div>
      <div class="an-cust-spent">R${c.spent.toLocaleString('en-ZA')}</div>
    </div>
  `).join('');
}

/* ────────────────────────────────────────
   KPI CHANGE BADGE HELPER
──────────────────────────────────────── */
function setKpiChange(id, change) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = change.text;
  el.className   = 'an-kpi-change ' + change.dir;
}

/* ────────────────────────────────────────
   DONUT CHART HELPER — shared by Category
   and Payment Methods charts
──────────────────────────────────────── */
function renderDonut(canvasId, legendId, centerId, labels, values, items, prefix) {
  const PALETTE = ['#f5c842','#60a5fa','#4ade80','#a78bfa','#fb923c','#f87171','#34d399','#fbbf24'];
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  const total = values.reduce((a,b) => a+b, 0);

  anCharts[canvasId] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: PALETTE.slice(0, labels.length),
        borderWidth: 0,
        hoverOffset: 6,
      }],
    },
    options: {
      cutout: '72%',
      animation: { duration: 800 },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: {
          label: c => `${c.label}: ${prefix}${c.parsed.toLocaleString('en-ZA')}`,
        }},
      },
    },
  });

  const centerEl = document.getElementById(centerId);
  if (centerEl) centerEl.textContent = prefix + Math.round(total).toLocaleString('en-ZA');

  const legendEl = document.getElementById(legendId);
  if (legendEl) legendEl.innerHTML = items.map((item, i) => `
    <div class="an-donut-legend-item">
      <div class="an-donut-legend-left">
        <div class="an-donut-legend-dot" style="background:${PALETTE[i % PALETTE.length]}"></div>
        <span>${item.name}</span>
      </div>
      <div style="display:flex;gap:10px;align-items:center;">
        <span class="an-donut-legend-val">${prefix}${Math.round(item.revenue).toLocaleString('en-ZA')}</span>
        <span class="an-donut-legend-pct">${item.pct || Math.round((values[i]/total)*100)}%</span>
      </div>
    </div>
  `).join('');
}

/* ────────────────────────────────────────
   FORECAST TOGGLE
──────────────────────────────────────── */
function toggleForecast() {
  anShowForecast = document.getElementById('forecast-toggle').checked;
  loadAnalytics(currentAnalyticsRange);
}

/* initAnalytics removed — showSection() calls loadAnalytics() directly */

// syncOrdersFromServer — single version below

async function syncOrdersFromServer() {
  try {
    const token = localStorage.getItem("token");
    const res   = await fetch(`${API_BASE}/api/orders`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.status === 401 || res.status === 403) return loadStoredOrders();
    if (!res.ok) throw new Error(`Server ${res.status}`);
    const orders = await res.json();
    localStorage.setItem("tavern_orders", JSON.stringify(orders));
    return orders;
  } catch (err) {
    console.warn("Server unreachable — using cache:", err.message);
    return loadStoredOrders();
  }
}

function loadStoredOrders() {
  return JSON.parse(localStorage.getItem("tavern_orders") || "[]");
}

function updateRevenueCards() {
  const orders      = loadStoredOrders();
  const validOrders = orders.filter(o => o.status !== "cancelled");
  const now         = new Date();

  // ── This week (Mon–Sun)
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0,0,0,0);
  const weekOrders = validOrders.filter(o => new Date(o.time) >= monday);
  const weekRev    = weekOrders.reduce((s, o) => s + getOrderTotal(o), 0);

  // ── This month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthOrders = validOrders.filter(o => new Date(o.time) >= monthStart);
  const monthRev    = monthOrders.reduce((s, o) => s + getOrderTotal(o), 0);

  // ── 3 months (cumulative)
  const m3Start  = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const m3Orders = validOrders.filter(o => new Date(o.time) >= m3Start);
  const m3Rev    = m3Orders.reduce((s, o) => s + getOrderTotal(o), 0);

  // ── 6 months (cumulative — includes all above)
  const m6Start  = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const m6Orders = validOrders.filter(o => new Date(o.time) >= m6Start);
  const m6Rev    = m6Orders.reduce((s, o) => s + getOrderTotal(o), 0);

  // Update DOM
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set("rev-weekly",         `R${weekRev.toLocaleString()}`);
  set("rev-weekly-orders",  `${weekOrders.length} order${weekOrders.length !== 1 ? "s" : ""}`);
  set("rev-monthly",        `R${monthRev.toLocaleString()}`);
  set("rev-monthly-orders", `${monthOrders.length} order${monthOrders.length !== 1 ? "s" : ""}`);
  set("rev-3month",         `R${m3Rev.toLocaleString()}`);
  set("rev-3month-orders",  `${m3Orders.length} order${m3Orders.length !== 1 ? "s" : ""}`);
  set("rev-6month",         `R${m6Rev.toLocaleString()}`);
  set("rev-6month-orders",  `${m6Orders.length} order${m6Orders.length !== 1 ? "s" : ""}`);
}

// timeAgo defined above — duplicate removed

function fmtItems(items) {
  return items.map(i => `${i.name} ×${i.qty}`).join(", ");
}

/* ─── Live Orders Feed  (#recentOrders) ─── */
function renderLiveFeed() {
  const orders = loadStoredOrders().slice(0, 8);   // show latest 8
  const feed   = document.getElementById("recentOrders");
  if (!feed) return;

  if (orders.length === 0) {
    feed.innerHTML = `<p style="color:#555;font-size:13px;padding:10px 0;">
      No orders yet. Waiting for customers…</p>`;
    return;
  }

  feed.innerHTML = orders.map(o => `
    <div class="live-order-row" style="
        display:flex; justify-content:space-between; align-items:center;
        padding:10px 14px; margin-bottom:8px;
        background:#1a1a1a; border:1px solid #2a2a2a;
        border-left:3px solid ${o.status==='pending'?'#f97316':o.status==='completed'?'#22c55e':'#ef4444'};
        border-radius:8px; font-size:13px; animation:rowIn 0.3s ease;">
      <div>
        <span style="color:gold;font-weight:600;">${o.id}</span>
        <span style="color:#888;margin-left:10px;">${o.customer}</span>
        <span class="order-items" style="display:block;color:#555;font-size:11px;margin-top:3px;">
          ${fmtItems(o.items)}
        </span>
      </div>
      <div style="text-align:right;">
        <div style="font-weight:700;color:#fff;">R${o.total}</div>
        <span class="status ${o.status}" style="margin-top:4px;">${o.status}</span>
        <div style="color:#555;font-size:11px;margin-top:2px;">${timeAgo(o.time)}</div>
      </div>
    </div>
  `).join("");
}

/* ─── Recent Orders Table  (#recent-orders-body) ─── */
function renderRecentOrdersTable(filter = "", statusFilter = "all") {
  const orders = loadStoredOrders();
  const tbody  = document.getElementById("recent-orders-body");
  if (!tbody) return;

  const filtered = orders.filter(o => {
    const matchText   = !filter || o.id.toLowerCase().includes(filter) ||
                        o.customer.toLowerCase().includes(filter);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchText && matchStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#555;padding:24px;">
      No orders found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(o => `
    <tr class="row-${o.status}">
      <td><span class="order-id">${o.id}</span></td>
      <td>${o.customer}</td>
      <td><span class="order-items">${fmtItems(o.items)}</span></td>
      <td class="order-total">R${o.total}</td>
      <td class="order-time">${timeAgo(o.time)}</td>
      <td><span class="status ${o.status}">${o.status}</span></td>
      <td>
        <div class="action-group">
          <button class="act-btn complete" ${o.status!=='pending'?'disabled':''}
            onclick="updateOrderStatus('${o.id}','completed')">✓</button>
          <button class="act-btn cancel" ${o.status!=='pending'?'disabled style="opacity:0.3;cursor:not-allowed;"':''}
            onclick="updateOrderStatus('${o.id}','cancelled')">✕</button>
          <button class="act-btn view"     onclick="viewOrderDetail('${o.id}')">View</button>
        </div>
      </td>
    </tr>
  `).join("");
}

/* ─── Update order status from the dashboard ─── */
async function updateOrderStatus(orderId, newStatus) {
  const token = localStorage.getItem("token");

  // Check token exists first
  if (!token) {
    alert("Session expired. Please log in again.");
    window.location.href = "customer-login.html";
    return;
  }

  // Hit server first — don't continue if it fails
  try {
    const res = await fetch(`https://task-api-clean-production.up.railway.app/api/orders/${orderId}`, {
      method:  "PUT",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    });

    if (res.status === 401 || res.status === 403) {
      alert("Session expired. Please log in again.");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "customer-login.html";
      return;
    }

    if (!res.ok) {
      showToast(`Failed to update order — server error ${res.status}`, "error");
      return; // stop here — don't update localStorage with wrong status
    }

  } catch (err) {
    showToast("Cannot reach server — order not updated", "error");
    return;
  }

  // Only update localStorage AFTER server confirms success
  const orders = loadStoredOrders();
  const idx    = orders.findIndex(o => o.id === orderId);
  if (idx !== -1) {
    orders[idx].status = newStatus;
    localStorage.setItem("tavern_orders", JSON.stringify(orders));
  }

  await refreshAllOrderViews(true);
  showToast(`Order ${orderId} marked as ${newStatus}`);
}

/* ─── View detail modal ─── */
function viewOrderDetail(orderId) {
  const order = loadStoredOrders().find(o => o.id === orderId);
  if (!order) return;

  document.getElementById("detail-order-id").textContent  = "Order " + order.id;
  document.getElementById("detail-customer").textContent  = order.customer;
  document.getElementById("detail-time").textContent      = new Date(order.time).toLocaleTimeString();
  document.getElementById("detail-payment").textContent   = order.payment || "cash";
  document.getElementById("detail-status").innerHTML      =
    `<span class="status ${order.status}">${order.status}</span>`;
  document.getElementById("detail-total").textContent     = "R" + order.total;

  document.getElementById("detail-items-list").innerHTML =
    order.items.map(i => `
      <div class="detail-item-row">
        <span class="detail-item-name">${i.name}
          <span class="detail-item-qty">×${i.qty}</span>
        </span>
        <span class="detail-item-price">R${i.price * i.qty}</span>
      </div>`).join("");

  document.getElementById("detail-actions").innerHTML = `
    <button class="btn-ghost" onclick="closeOrderModal()">Close</button>
    <button class="btn" onclick="updateOrderStatus('${order.id}','completed');closeOrderModal()">
      Mark Complete</button>`;

  document.getElementById("order-detail-modal").style.display = "flex";
}

function closeOrderModal() {
  document.getElementById("order-detail-modal").style.display = "none";
}

/* ─── Hook into existing search/filter inputs ─── */
function filterRecentOrders(text) {
  const status = document.getElementById("orders-filter")?.value || "all";
  renderRecentOrdersTable(text.toLowerCase(), status);
}

/* ─── Refresh everything at once ─── */
// REPLACE refreshAllOrderViews with:
async function refreshAllOrderViews(skipSync = false) {
  if (!skipSync) await syncOrdersFromServer();
  allOrdersData = loadStoredOrders();
  renderLiveFeed();
  renderRecentOrdersTable(
    document.getElementById("orders-search")?.value?.toLowerCase() || "",
    document.getElementById("orders-filter")?.value || "all"
  );
  applyOrderFilters();
  updateDashboardOrderCounts();
  updateRevenueCards();
  renderGraph(currentRange);
}

/* ─── Update today's order count card ─── */
function updateDashboardOrderCounts() {
  const orders  = loadStoredOrders();
  const today   = new Date().toDateString();
  const todayOs = orders.filter(o => new Date(o.time).toDateString() === today);

  // ── Today's Revenue
  const todayRevenue = todayOs
    .filter(o => o.status !== "cancelled")
    .reduce((sum, o) => sum + getOrderTotal(o), 0);

  const yest = new Date(); yest.setDate(yest.getDate() - 1);
  const yesterdayOs = orders.filter(o => new Date(o.time).toDateString() === yest.toDateString());
  const yesterdayRevenue = yesterdayOs
    .filter(o => o.status !== "cancelled")
    .reduce((sum, o) => sum + getOrderTotal(o), 0);

  const revEl = document.getElementById("dash-revenue-today");
  const revCh = document.getElementById("dash-revenue-change");
  if (revEl) revEl.textContent = `R${todayRevenue.toLocaleString()}`;
  if (revCh && yesterdayRevenue > 0) {
    const pct = Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100);
    revCh.textContent = (pct >= 0 ? `↑ ${pct}%` : `↓ ${Math.abs(pct)}%`) + " vs yesterday";
    revCh.className = "card-change " + (pct >= 0 ? "up" : "down");
} else if (revCh) {
  if (todayRevenue > 0) {
    revCh.textContent = "↑ first sales recorded today";
    revCh.className   = "card-change up";
  } else {
    revCh.textContent = "no orders yet today";
    revCh.className   = "card-change";
  }
}

  // ── Orders Today
  const ordEl = document.getElementById("dash-orders-today");
  const ordCh = document.getElementById("dash-orders-change");
  if (ordEl) ordEl.textContent = todayOs.length;
  if (ordCh) ordCh.textContent = todayOs.length > 0 ? `${todayOs.filter(o => o.status === "pending").length} still pending` : "none yet today";

  // ── Top Product (all time — most ordered item by qty)
  const tally = {};
  orders.forEach(o => {
    (o.items || []).forEach(item => {
      tally[item.name] = (tally[item.name] || 0) + (item.qty || 1);
    });
  });
  const topEntry = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
  const topEl    = document.getElementById("dash-top-product");
  const topUnits = document.getElementById("dash-top-units");
  if (topEl)    topEl.textContent    = topEntry ? topEntry[0] : "—";
  if (topUnits) topUnits.textContent = topEntry ? `${topEntry[1]} units sold` : "no orders yet";
}

/* ─── Init: first render + auto-poll every 10 s ─── */
function updateLiveIndicator() {
  // Pulses the Live dot so the owner knows it just refreshed
  const dot = document.querySelector(".live-dot, .live-badge");
  if (!dot) return;
  dot.style.opacity = "0.3";
  setTimeout(() => dot.style.opacity = "1", 300);
}

// Add near the bottom of admin.js
async function keepTokenAlive() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Check if token expires within 30 minutes
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiresIn = (payload.exp * 1000) - Date.now();

    if (expiresIn < 30 * 60 * 1000) {
      // Token about to expire — refresh it
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("token", data.token || data.accessToken);
        console.log("Token refreshed ✅");
      } else {
        // Can't refresh — redirect to login
        window.location.href = "customer-login.html";
      }
    }
  } catch (err) {
    console.warn("Token check failed:", err.message);
  }
}



// Check every 10 minutes
setInterval(keepTokenAlive, 10 * 60 * 1000);
keepTokenAlive(); // run immediately on load

async function initOrderFeeds() {
  await refreshAllOrderViews();                          // immediate first load
  setInterval(refreshAllOrderViews, 30000);             // then every 30 seconds
}

document.addEventListener("DOMContentLoaded", () => {
  initOrderFeeds();
  loadProducts();
});

/* ════════════════════════════════════════════════════════════════
   EXPENSES & PROFIT TRACKING SYSTEM
   Fully integrated with POS — reads income from loadStoredOrders()
   Stores expenses in localStorage key: "tavern_expenses"
════════════════════════════════════════════════════════════════ */

/* ── Storage helpers ─────────────────────────────────────────── */
function loadExpenses() {
  return JSON.parse(localStorage.getItem('tavern_expenses') || '[]');
}
function saveExpenses(arr) {
  localStorage.setItem('tavern_expenses', JSON.stringify(arr));
}
function genExpenseId() {
  return 'EXP-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
}

/* ── Category config ─────────────────────────────────────────── */
const EXP_CATEGORIES = {
  rent:        { label: 'Rent',              icon: '🏠', color: '#60a5fa' },
  electricity: { label: 'Electricity',       icon: '⚡', color: '#fbbf24' },
  salaries:    { label: 'Employee Salaries', icon: '👥', color: '#a78bfa' },
  stock:       { label: 'Stock/Products',    icon: '📦', color: '#34d399' },
  internet:    { label: 'Internet',          icon: '🌐', color: '#22d3ee' },
  marketing:   { label: 'Marketing/Ads',     icon: '📣', color: '#f97316' },
  transport:   { label: 'Transport',         icon: '🚗', color: '#fb7185' },
  other:       { label: 'Other',             icon: '📋', color: '#94a3b8' },
};

/* ── State ───────────────────────────────────────────────────── */
let expEditingId     = null;
let expFilter        = { search: '', category: 'all', dateRange: 'all', sort: 'newest' };
let expCharts        = {};
let expChartRange    = '30d';

/* ── Section entry point ─────────────────────────────────────── */
function loadExpenses_tab() {
  renderExpSummaryCards();
  renderExpAlerts();
  renderExpTable();
  renderExpCharts();
}

/* ════════════════════════════════════════════════════════════════
   INCOME FROM POS ORDERS
════════════════════════════════════════════════════════════════ */
function getPOSIncome(fromDate, toDate) {
  return loadStoredOrders()
    .filter(o => {
      if (o.status === 'cancelled') return false;
      const t = new Date(o.time);
      if (fromDate && t < fromDate) return false;
      if (toDate   && t > toDate)   return false;
      return true;
    })
    .reduce((s, o) => s + getOrderTotal(o), 0);
}

function getExpenseTotal(fromDate, toDate) {
  return loadExpenses()
    .filter(e => {
      const d = new Date(e.date);
      if (fromDate && d < fromDate) return false;
      if (toDate   && d > toDate)   return false;
      return true;
    })
    .reduce((s, e) => s + Number(e.amount), 0);
}

/* ════════════════════════════════════════════════════════════════
   SUMMARY CARDS
════════════════════════════════════════════════════════════════ */
function renderExpSummaryCards() {
  const now       = new Date();
  const todayS    = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthS    = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekS     = new Date(now); weekS.setDate(now.getDate() - 6); weekS.setHours(0,0,0,0);

  const totalIncome   = getPOSIncome();
  const totalExpenses = getExpenseTotal();
  const netProfit     = totalIncome - totalExpenses;

  const todayExp   = getExpenseTotal(todayS);
  const monthExp   = getExpenseTotal(monthS);
  const monthInc   = getPOSIncome(monthS);
  const monthProfit= monthInc - monthExp;
  const margin     = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : 0;

  const profitColor  = netProfit > 0 ? '#22c55e' : netProfit < 0 ? '#ef4444' : '#f5c842';
  const profitLabel  = netProfit > 0 ? 'NET PROFIT' : netProfit < 0 ? 'NET LOSS' : 'BREAK-EVEN';
  const profitIcon   = netProfit > 0 ? '📈' : netProfit < 0 ? '📉' : '⚖️';

  const mPColor = monthProfit > 0 ? '#22c55e' : monthProfit < 0 ? '#ef4444' : '#f5c842';

  const el = document.getElementById('exp-summary-cards');
  if (!el) return;
  el.innerHTML = `
    <div class="exp-kpi-card">
      <div class="exp-kpi-icon" style="background:rgba(245,200,66,0.1);color:#f5c842;">💰</div>
      <div class="exp-kpi-body">
        <div class="exp-kpi-label">TOTAL INCOME</div>
        <div class="exp-kpi-value" style="color:#f5c842;">R${totalIncome.toLocaleString('en-ZA')}</div>
        <div class="exp-kpi-sub">All completed orders</div>
      </div>
    </div>
    <div class="exp-kpi-card">
      <div class="exp-kpi-icon" style="background:rgba(239,68,68,0.1);color:#ef4444;">💸</div>
      <div class="exp-kpi-body">
        <div class="exp-kpi-label">TOTAL EXPENSES</div>
        <div class="exp-kpi-value" style="color:#ef4444;">R${totalExpenses.toLocaleString('en-ZA')}</div>
        <div class="exp-kpi-sub">All recorded expenses</div>
      </div>
    </div>
    <div class="exp-kpi-card exp-kpi-card--profit" style="border-color:${profitColor}30;">
      <div class="exp-kpi-icon" style="background:${profitColor}18;color:${profitColor};">${profitIcon}</div>
      <div class="exp-kpi-body">
        <div class="exp-kpi-label">${profitLabel}</div>
        <div class="exp-kpi-value" style="color:${profitColor};">R${Math.abs(netProfit).toLocaleString('en-ZA')}</div>
        <div class="exp-kpi-sub">Margin: ${margin}%</div>
      </div>
    </div>
    <div class="exp-kpi-card">
      <div class="exp-kpi-icon" style="background:rgba(251,146,60,0.1);color:#fb923c;">📅</div>
      <div class="exp-kpi-body">
        <div class="exp-kpi-label">TODAY'S EXPENSES</div>
        <div class="exp-kpi-value">R${todayExp.toLocaleString('en-ZA')}</div>
        <div class="exp-kpi-sub">${new Date().toLocaleDateString('en-ZA')}</div>
      </div>
    </div>
    <div class="exp-kpi-card">
      <div class="exp-kpi-icon" style="background:rgba(167,139,250,0.1);color:#a78bfa;">📆</div>
      <div class="exp-kpi-body">
        <div class="exp-kpi-label">MONTHLY EXPENSES</div>
        <div class="exp-kpi-value">R${monthExp.toLocaleString('en-ZA')}</div>
        <div class="exp-kpi-sub">This month</div>
      </div>
    </div>
    <div class="exp-kpi-card">
      <div class="exp-kpi-icon" style="background:${mPColor}18;color:${mPColor};">🗓️</div>
      <div class="exp-kpi-body">
        <div class="exp-kpi-label">MONTHLY ${monthProfit >= 0 ? 'PROFIT' : 'LOSS'}</div>
        <div class="exp-kpi-value" style="color:${mPColor};">R${Math.abs(monthProfit).toLocaleString('en-ZA')}</div>
        <div class="exp-kpi-sub">Income R${monthInc.toLocaleString('en-ZA')}</div>
      </div>
    </div>
  `;
}

/* ════════════════════════════════════════════════════════════════
   SMART ALERTS
════════════════════════════════════════════════════════════════ */
function renderExpAlerts() {
  const el = document.getElementById('exp-alerts');
  if (!el) return;

  const now    = new Date();
  const monthS = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMS = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevME = new Date(now.getFullYear(), now.getMonth(), 0);

  const totalIncome   = getPOSIncome();
  const totalExpenses = getExpenseTotal();
  const netProfit     = totalIncome - totalExpenses;
  const margin        = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
  const monthExp      = getExpenseTotal(monthS);
  const prevMonthExp  = getExpenseTotal(prevMS, prevME);

  const alerts = [];

  if (totalExpenses === 0 && loadExpenses().length === 0) {
    alerts.push({ type: 'info', icon: '💡', text: 'No expenses recorded yet. Add your first expense below to start tracking profitability.' });
  } else {
    if (margin < 10 && totalIncome > 0)
      alerts.push({ type: 'warn', icon: '⚠️', text: `Low profit margin warning: only ${margin.toFixed(1)}% margin. Review your expenses to improve profitability.` });
    if (netProfit < 0)
      alerts.push({ type: 'loss', icon: '📉', text: `Business is currently at a loss of R${Math.abs(netProfit).toLocaleString('en-ZA')}. Total expenses exceed income.` });
    if (prevMonthExp > 0 && monthExp > prevMonthExp * 1.2)
      alerts.push({ type: 'warn', icon: '📊', text: `Monthly expenses increased ${Math.round(((monthExp - prevMonthExp) / prevMonthExp) * 100)}% vs last month. High spending detected.` });
    if (netProfit > 0 && margin >= 20)
      alerts.push({ type: 'success', icon: '🎯', text: `Healthy profit margin of ${margin.toFixed(1)}%. Business is performing well.` });
  }

  el.innerHTML = alerts.map((a, i) =>
    `<div class="exp-alert exp-alert--${a.type}" style="animation-delay:${i * 0.08}s">
      <span class="exp-alert-icon">${a.icon}</span>
      <span>${a.text}</span>
    </div>`
  ).join('');
}

/* ════════════════════════════════════════════════════════════════
   FORM — ADD / EDIT EXPENSE
════════════════════════════════════════════════════════════════ */
function openExpenseForm(id = null) {
  expEditingId = id;
  const modal  = document.getElementById('exp-modal');
  const title  = document.getElementById('exp-modal-title');
  if (!modal) return;

  // Reset form
  document.getElementById('exp-form-title').value    = '';
  document.getElementById('exp-form-category').value = 'other';
  document.getElementById('exp-form-amount').value   = '';
  document.getElementById('exp-form-date').value     = new Date().toISOString().split('T')[0];
  document.getElementById('exp-form-notes').value    = '';

  if (id) {
    const exp = loadExpenses().find(e => e.id === id);
    if (exp) {
      title.textContent = 'Edit Expense';
      document.getElementById('exp-form-title').value    = exp.title;
      document.getElementById('exp-form-category').value = exp.category;
      document.getElementById('exp-form-amount').value   = exp.amount;
      document.getElementById('exp-form-date').value     = exp.date;
      document.getElementById('exp-form-notes').value    = exp.notes || '';
    }
  } else {
    title.textContent = '+ Add Expense';
  }

  modal.classList.add('open');
  document.getElementById('exp-form-title').focus();
}

function closeExpenseModal() {
  document.getElementById('exp-modal')?.classList.remove('open');
  expEditingId = null;
}

function saveExpense() {
  const title    = document.getElementById('exp-form-title').value.trim();
  const category = document.getElementById('exp-form-category').value;
  const amount   = parseFloat(document.getElementById('exp-form-amount').value);
  const date     = document.getElementById('exp-form-date').value;
  const notes    = document.getElementById('exp-form-notes').value.trim();

  // Validation
  if (!title)         { expFormError('Expense name is required');         return; }
  if (!amount || amount <= 0) { expFormError('Enter a valid amount');     return; }
  if (!date)          { expFormError('Date is required');                  return; }

  const expenses = loadExpenses();

  if (expEditingId) {
    const idx = expenses.findIndex(e => e.id === expEditingId);
    if (idx !== -1) {
      expenses[idx] = { ...expenses[idx], title, category, amount, date, notes, updatedAt: new Date().toISOString() };
    }
    showToast('✅ Expense updated', 'success');
  } else {
    expenses.unshift({ id: genExpenseId(), title, category, amount, date, notes, createdAt: new Date().toISOString() });
    showToast('✅ Expense saved', 'success');
  }

  saveExpenses(expenses);
  closeExpenseModal();
  loadExpenses_tab();
}

function expFormError(msg) {
  const el = document.getElementById('exp-form-error');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 3000);
}

function deleteExpense(id) {
  if (!confirm('Delete this expense?')) return;
  const updated = loadExpenses().filter(e => e.id !== id);
  saveExpenses(updated);
  showToast('Expense deleted', 'success');
  loadExpenses_tab();
}

/* ════════════════════════════════════════════════════════════════
   EXPENSES TABLE
════════════════════════════════════════════════════════════════ */
function applyExpFilters() {
  expFilter.search    = (document.getElementById('exp-search')?.value   || '').toLowerCase();
  expFilter.category  =  document.getElementById('exp-cat-filter')?.value || 'all';
  expFilter.dateRange =  document.getElementById('exp-date-filter')?.value || 'all';
  expFilter.sort      =  document.getElementById('exp-sort')?.value || 'newest';
  renderExpTable();
}

function renderExpTable() {
  const tbody = document.getElementById('exp-table-body');
  if (!tbody) return;

  const now   = new Date();
  const todayS = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekS  = new Date(now); weekS.setDate(now.getDate() - 6); weekS.setHours(0,0,0,0);
  const monthS = new Date(now.getFullYear(), now.getMonth(), 1);

  let exps = loadExpenses().filter(e => {
    const d = new Date(e.date);
    if (expFilter.search && !e.title.toLowerCase().includes(expFilter.search) &&
        !(e.notes || '').toLowerCase().includes(expFilter.search)) return false;
    if (expFilter.category !== 'all' && e.category !== expFilter.category) return false;
    if (expFilter.dateRange === 'today' && d < todayS) return false;
    if (expFilter.dateRange === 'week'  && d < weekS)  return false;
    if (expFilter.dateRange === 'month' && d < monthS) return false;
    return true;
  });

  exps.sort((a, b) => {
    if (expFilter.sort === 'oldest')  return new Date(a.date) - new Date(b.date);
    if (expFilter.sort === 'highest') return b.amount - a.amount;
    if (expFilter.sort === 'lowest')  return a.amount - b.amount;
    return new Date(b.date) - new Date(a.date); // newest
  });

  const totalShown = exps.reduce((s, e) => s + Number(e.amount), 0);
  const countEl = document.getElementById('exp-table-count');
  if (countEl) countEl.textContent = `${exps.length} expense${exps.length !== 1 ? 's' : ''} · R${totalShown.toLocaleString('en-ZA')} total`;

  if (!exps.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:#333;font-size:13px;">
      No expenses found. <a href="#" onclick="openExpenseForm()" style="color:#f5c842;">Add one now →</a>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = exps.map(e => {
    const cat  = EXP_CATEGORIES[e.category] || EXP_CATEGORIES.other;
    const dateStr = new Date(e.date).toLocaleDateString('en-ZA', { day:'numeric', month:'short', year:'numeric' });
    return `
      <tr class="exp-row" style="animation: rowIn 0.25s ease both;">
        <td>
          <div style="font-size:13px;font-weight:600;color:#e0e0e0;">${e.title}</div>
          ${e.notes ? `<div style="font-size:11px;color:#444;margin-top:2px;">${e.notes}</div>` : ''}
        </td>
        <td>
          <span class="exp-cat-badge" style="background:${cat.color}18;color:${cat.color};border:1px solid ${cat.color}30;">
            ${cat.icon} ${cat.label}
          </span>
        </td>
        <td style="font-weight:700;color:#ef4444;font-size:14px;">R${Number(e.amount).toLocaleString('en-ZA')}</td>
        <td style="color:#555;font-size:12px;">${dateStr}</td>
        <td style="color:#333;font-size:12px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
          ${e.notes || '—'}
        </td>
        <td>
          <div style="display:flex;gap:6px;">
            <button class="exp-btn-edit" onclick="openExpenseForm('${e.id}')">✏ Edit</button>
            <button class="exp-btn-del"  onclick="deleteExpense('${e.id}')">🗑</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/* ════════════════════════════════════════════════════════════════
   CHARTS
════════════════════════════════════════════════════════════════ */
function setExpChartRange(range, btn) {
  expChartRange = range;
  document.querySelectorAll('.exp-range-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderExpCharts();
}

function destroyExpChart(key) {
  if (expCharts[key]) { expCharts[key].destroy(); delete expCharts[key]; }
}

function renderExpCharts() {
  renderExpCategoryChart();
  renderExpMonthlyChart();
  renderExpIncomeVsExpChart();
}

function renderExpCategoryChart() {
  destroyExpChart('category');
  const ctx = document.getElementById('exp-cat-chart');
  if (!ctx) return;

  const exps    = loadExpenses();
  const catMap  = {};
  exps.forEach(e => {
    catMap[e.category] = (catMap[e.category] || 0) + Number(e.amount);
  });

  const entries = Object.entries(catMap).sort((a,b) => b[1]-a[1]);
  if (!entries.length) {
    ctx.getContext('2d').clearRect(0,0,ctx.width,ctx.height);
    return;
  }

  const palette = Object.values(EXP_CATEGORIES).map(c => c.color);
  const total   = entries.reduce((s,[,v]) => s+v, 0);

  expCharts.category = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: entries.map(([k]) => EXP_CATEGORIES[k]?.label || k),
      datasets: [{ data: entries.map(([,v]) => v), backgroundColor: palette.slice(0, entries.length), borderWidth: 0, hoverOffset: 8 }],
    },
    options: {
      cutout: '70%',
      animation: { duration: 900 },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: c => ` R${c.parsed.toLocaleString('en-ZA')} (${Math.round((c.parsed/total)*100)}%)` } },
      },
    },
  });

  // Build legend
  const leg = document.getElementById('exp-cat-legend');
  if (leg) leg.innerHTML = entries.map(([k, v], i) => {
    const cat = EXP_CATEGORIES[k] || EXP_CATEGORIES.other;
    return `<div class="exp-legend-row">
      <div style="display:flex;align-items:center;gap:8px;">
        <div style="width:8px;height:8px;border-radius:50%;background:${cat.color};flex-shrink:0;"></div>
        <span style="font-size:12px;color:#888;">${cat.icon} ${cat.label}</span>
      </div>
      <div style="display:flex;gap:10px;align-items:center;">
        <span style="font-size:11px;color:#444;font-family:'Courier New',monospace;">R${v.toLocaleString('en-ZA')}</span>
        <span style="font-size:11px;font-weight:700;color:#c0c0c0;">${Math.round((v/total)*100)}%</span>
      </div>
    </div>`;
  }).join('');
}

function renderExpMonthlyChart() {
  destroyExpChart('monthly');
  const ctx = document.getElementById('exp-monthly-chart');
  if (!ctx) return;

  const now    = new Date();
  const months = 6;
  const labels = [], expData = [], incData = [];

  for (let i = months - 1; i >= 0; i--) {
    const d  = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const dE = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    labels.push(d.toLocaleDateString('en-ZA', { month: 'short' }));
    expData.push(getExpenseTotal(d, dE));
    incData.push(getPOSIncome(d, dE));
  }

  expCharts.monthly = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Income',
          data: incData,
          backgroundColor: 'rgba(245,200,66,0.7)',
          borderColor: '#f5c842',
          borderWidth: 1,
          borderRadius: 5,
        },
        {
          label: 'Expenses',
          data: expData,
          backgroundColor: 'rgba(239,68,68,0.6)',
          borderColor: '#ef4444',
          borderWidth: 1,
          borderRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: { duration: 800, easing: 'easeInOutQuart' },
      plugins: {
        legend: { display: true, labels: { color: '#666', font: { size: 11 }, boxWidth: 10, boxHeight: 10 } },
        tooltip: {
          backgroundColor: '#0d0d0d', borderColor: '#252525', borderWidth: 1,
          titleColor: '#e0e0e0', bodyColor: '#888',
          callbacks: { label: c => ` R${c.parsed.y.toLocaleString('en-ZA')}` },
        },
      },
      scales: {
        x: { grid: { color: '#1c1c1c' }, ticks: { color: '#555', font: { size: 10 } } },
        y: { grid: { color: '#1c1c1c' }, ticks: { color: '#555', font: { size: 10 }, callback: v => `R${v.toLocaleString('en-ZA')}` } },
      },
    },
  });
}

function renderExpIncomeVsExpChart() {
  destroyExpChart('incvexp');
  const ctx = document.getElementById('exp-incvexp-chart');
  if (!ctx) return;

  const now    = new Date();
  const labels = [], profitData = [], expData = [], incData = [];

  for (let i = 5; i >= 0; i--) {
    const d  = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const dE = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    labels.push(d.toLocaleDateString('en-ZA', { month: 'short' }));
    const inc = getPOSIncome(d, dE);
    const exp = getExpenseTotal(d, dE);
    incData.push(inc);
    expData.push(exp);
    profitData.push(inc - exp);
  }

  const profitColors = profitData.map(v => v >= 0 ? 'rgba(34,197,94,0.7)' : 'rgba(239,68,68,0.7)');

  expCharts.incvexp = new Chart(ctx, {
    data: {
      labels,
      datasets: [
        { type: 'line', label: 'Income',   data: incData,    borderColor: '#f5c842', backgroundColor: 'rgba(245,200,66,0.05)', borderWidth: 2, pointRadius: 3, tension: 0.4, fill: true, yAxisID: 'y' },
        { type: 'line', label: 'Expenses', data: expData,    borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.05)',   borderWidth: 2, pointRadius: 3, tension: 0.4, fill: true, yAxisID: 'y' },
        { type: 'bar',  label: 'Profit/Loss', data: profitData, backgroundColor: profitColors, borderRadius: 4, yAxisID: 'y1' },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: { duration: 900 },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: true, labels: { color: '#666', font: { size: 11 }, boxWidth: 10, boxHeight: 10 } },
        tooltip: {
          backgroundColor: '#0d0d0d', borderColor: '#252525', borderWidth: 1,
          titleColor: '#e0e0e0', bodyColor: '#888',
          callbacks: { label: c => ` ${c.dataset.label}: R${c.parsed.y.toLocaleString('en-ZA')}` },
        },
      },
      scales: {
        x:  { grid: { color: '#1c1c1c' }, ticks: { color: '#555', font: { size: 10 } } },
        y:  { position: 'left',  grid: { color: '#1c1c1c' }, ticks: { color: '#555', font: { size: 10 }, callback: v => `R${(v/1000).toFixed(0)}k` } },
        y1: { position: 'right', grid: { drawOnChartArea: false }, ticks: { color: '#555', font: { size: 10 }, callback: v => `R${v.toLocaleString('en-ZA')}` } },
      },
    },
  });
}

/* ════════════════════════════════════════════════════════════════
   EXPORT
════════════════════════════════════════════════════════════════ */
function exportExpensesCSV() {
  const exps = loadExpenses();
  if (!exps.length) { showToast('No expenses to export', 'error'); return; }

  const rows = [['ID', 'Title', 'Category', 'Amount (R)', 'Date', 'Notes', 'Created']];
  exps.forEach(e => {
    const cat = EXP_CATEGORIES[e.category]?.label || e.category;
    rows.push([e.id, e.title, cat, e.amount, e.date, e.notes || '', new Date(e.createdAt).toLocaleDateString('en-ZA')]);
  });

  const totalIncome   = getPOSIncome();
  const totalExpenses = exps.reduce((s,e) => s + Number(e.amount), 0);
  rows.push([]);
  rows.push(['', 'TOTAL INCOME', '', totalIncome, '', '']);
  rows.push(['', 'TOTAL EXPENSES', '', totalExpenses, '', '']);
  rows.push(['', 'NET PROFIT/LOSS', '', totalIncome - totalExpenses, '', '']);

  const csv  = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `expenses-report-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('📥 Expenses exported to CSV', 'success');
}

function printFinancialReport() {
  const totalIncome   = getPOSIncome();
  const totalExpenses = getExpenseTotal();
  const netProfit     = totalIncome - totalExpenses;
  const margin        = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : 0;
  const exps          = loadExpenses();
  const now           = new Date().toLocaleDateString('en-ZA', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  const catTotals = {};
  exps.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + Number(e.amount); });

  const w = window.open('', '_blank');
  w.document.write(`
    <!DOCTYPE html><html><head>
    <title>Financial Report — ${now}</title>
    <style>
      body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; color: #111; }
      h1   { font-size: 22px; border-bottom: 2px solid #111; padding-bottom: 10px; }
      h2   { font-size: 16px; margin-top: 28px; color: #333; }
      .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin: 16px 0; }
      .card { border: 1px solid #ddd; border-radius: 8px; padding: 14px; }
      .card-label { font-size: 11px; text-transform: uppercase; color: #888; margin-bottom: 6px; }
      .card-value { font-size: 20px; font-weight: 700; }
      .profit { color: green; } .loss { color: red; }
      table  { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
      th     { background: #f5f5f5; padding: 8px 10px; text-align: left; border: 1px solid #ddd; }
      td     { padding: 7px 10px; border: 1px solid #eee; }
      @media print { body { margin: 0; } }
    </style></head><body>
    <h1>📊 Financial Report</h1>
    <p style="color:#666;font-size:13px;">Generated: ${now}</p>
    <div class="grid">
      <div class="card"><div class="card-label">Total Income</div><div class="card-value" style="color:#b8860b;">R${totalIncome.toLocaleString('en-ZA')}</div></div>
      <div class="card"><div class="card-label">Total Expenses</div><div class="card-value" style="color:#c0392b;">R${totalExpenses.toLocaleString('en-ZA')}</div></div>
      <div class="card"><div class="card-label">${netProfit >= 0 ? 'Net Profit' : 'Net Loss'}</div><div class="card-value ${netProfit >= 0 ? 'profit' : 'loss'}">R${Math.abs(netProfit).toLocaleString('en-ZA')}</div></div>
    </div>
    <p><strong>Profit Margin:</strong> ${margin}%</p>
    <h2>Expenses by Category</h2>
    <table><tr><th>Category</th><th>Total</th><th>% of Expenses</th></tr>
    ${Object.entries(catTotals).sort((a,b)=>b[1]-a[1]).map(([k,v]) =>
      `<tr><td>${EXP_CATEGORIES[k]?.icon} ${EXP_CATEGORIES[k]?.label || k}</td><td>R${v.toLocaleString('en-ZA')}</td><td>${totalExpenses > 0 ? Math.round((v/totalExpenses)*100) : 0}%</td></tr>`
    ).join('')}
    </table>
    <h2>All Expenses (${exps.length})</h2>
    <table><tr><th>Name</th><th>Category</th><th>Amount</th><th>Date</th><th>Notes</th></tr>
    ${exps.map(e => `<tr>
      <td>${e.title}</td>
      <td>${EXP_CATEGORIES[e.category]?.label || e.category}</td>
      <td>R${Number(e.amount).toLocaleString('en-ZA')}</td>
      <td>${new Date(e.date).toLocaleDateString('en-ZA')}</td>
      <td>${e.notes || ''}</td>
    </tr>`).join('')}
    </table>
    <script>window.onload = () => window.print();<\/script>
    </body></html>
  `);
  w.document.close();
}

/* ── Wire up modal close on backdrop click ─── */
document.addEventListener('DOMContentLoaded', () => {
  const expModal = document.getElementById('exp-modal');
  if (expModal) {
    expModal.addEventListener('click', e => { if (e.target === expModal) closeExpenseModal(); });
  }
});


/* ── Inline quick-add form (always-visible on expenses tab) ── */
function saveInlineExpense() {
  const title    = document.getElementById('exp-inline-title')?.value.trim();
  const category = document.getElementById('exp-inline-category')?.value || 'other';
  const amount   = parseFloat(document.getElementById('exp-inline-amount')?.value);
  const date     = document.getElementById('exp-inline-date')?.value;
  const notes    = document.getElementById('exp-inline-notes')?.value.trim() || '';

  const errEl   = document.getElementById('exp-inline-error');
  const showErr = msg => {
    if (!errEl) return;
    errEl.textContent    = msg;
    errEl.style.display  = 'block';
    setTimeout(() => { errEl.style.display = 'none'; }, 3000);
  };

  if (!title)              { showErr('Expense name is required'); return; }
  if (!amount || amount <= 0) { showErr('Enter a valid amount (must be > 0)'); return; }
  if (!date)               { showErr('Date is required'); return; }

  const expenses = loadExpenses();
  expenses.unshift({
    id: genExpenseId(),
    title, category, amount, date, notes,
    createdAt: new Date().toISOString(),
  });
  saveExpenses(expenses);

  // Clear only the variable fields — keep date & category for rapid entry
  document.getElementById('exp-inline-title').value  = '';
  document.getElementById('exp-inline-amount').value = '';
  document.getElementById('exp-inline-notes').value  = '';

  showToast('✅ Expense saved', 'success');
  loadExpenses_tab();
}
