// script.js — utility helpers only
// NOTE: cart state lives in index.js — do not redeclare it here
console.log("script.js loaded");

// ─── Login popup (legacy helper, openLogin() is in index.js) ───
// This file is kept for any page that loads script.js WITHOUT index.js.
// If both are loaded together, index.js takes precedence.

function loadCart() {
  const cartContainer = document.getElementById("cart");
  if (!cartContainer) return;

  const saved = JSON.parse(localStorage.getItem("cart") || "[]");
  cartContainer.innerHTML = "";

  saved.forEach((item, index) => {
    cartContainer.innerHTML += `
      <div class="cart-item">
        <img src="${item.img || ''}" width="50">
        <p>${item.name}</p>
        <p>R${item.price}</p>
        <button onclick="removeFromCart(${index})">Remove</button>
      </div>`;
  });
}

function removeFromCart(index) {
  const saved = JSON.parse(localStorage.getItem("cart") || "[]");
  saved.splice(index, 1);
  localStorage.setItem("cart", JSON.stringify(saved));
  loadCart();
}

loadCart();