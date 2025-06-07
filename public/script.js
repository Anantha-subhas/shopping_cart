const btnCart = document.querySelector('#cart-icon');
const cart = document.querySelector('.cart');
const btnClose = document.querySelector('#cart-close');
const btnBuy = document.querySelector('.btn-buy');
let token = localStorage.getItem('token') || null;
let hasClosedModalWithoutLogin = false; // Flag to track if the user closed the modal without logging in

// Validate JWT token (client-side check for expiration)
function isTokenValid(token) {
    if (!token) return false;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp * 1000; // Convert to milliseconds
        return Date.now() < exp;
    } catch (e) {
        return false;
    }
}

// CART OPEN/CLOSE
btnCart.addEventListener('click', () => {
    if (!token || !isTokenValid(token)) {
        showLoginPrompt();
        return;
    }
    cart.classList.add('cart-active');
});

btnClose.addEventListener('click', () => {
    cart.classList.remove('cart-active');
});

// INITIAL LOAD
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication on page load
    if (!token || !isTokenValid(token)) {
        showLoginPrompt();
    } else {
        setupAddToCartButtons();
        setupExistingCart();
        updateCartTotal();
    }
});

// ADD TO CART FUNCTION
function setupAddToCartButtons() {
    const buttons = document.querySelectorAll('.cart-icon');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            if (!token || !isTokenValid(token)) {
                if (hasClosedModalWithoutLogin) {
                    alert('Please log in or register to add items to your cart.');
                } else {
                    showLoginPrompt();
                }
                return;
            }
            const foodBox = button.closest('.food-box');
            const img = foodBox.querySelector('img').src;
            const title = foodBox.querySelector('.food-title').textContent;
            const price = foodBox.querySelector('.food-price').textContent;
            addToCart(img, title, price);
        });
    });
}

function addToCart(img, title, price) {
    const cartContent = document.querySelector('.cart-content');
    const cartItems = cartContent.querySelectorAll('.cart-food-title');
    for (let item of cartItems) {
        if (item.textContent.trim() === title.trim()) {
            alert('Item already in cart!');
            return;
        }
    }
    const cartBox = document.createElement('div');
    cartBox.classList.add('cart-box');
    cartBox.innerHTML = `
        <img src="${img}" alt="${title}" class="cart-img">
        <div class="detail-box">
            <div class="cart-food-title">${title}</div>
            <div class="price-box">
                <div class="cart-price">${price}</div>
                <div class="cart-amt">${price}</div>
            </div>
            <input type="number" value="1" min="1" class="cart-quantity">
        </div>
        <ion-icon name="trash" class="cart-trash"></ion-icon>
    `;
    cartContent.insertBefore(cartBox, cartContent.querySelector('.total'));
    setupCartItem(cartBox);
    updateCartTotal();
    updateItemCount();
}

function setupCartItem(cartBox) {
    const removeBtn = cartBox.querySelector('.cart-trash');
    const qtyInput = cartBox.querySelector('.cart-quantity');
    const priceEl = cartBox.querySelector('.cart-price');
    const amtEl = cartBox.querySelector('.cart-amt');
    removeBtn.addEventListener('click', () => {
        cartBox.remove();
        updateCartTotal();
        updateItemCount();
    });
    qtyInput.addEventListener('change', () => {
        if (isNaN(qtyInput.value) || qtyInput.value <= 0) {
            qtyInput.value = 1;
        }
        const price = parseFloat(priceEl.textContent.replace('$', ''));
        const newAmt = (price * parseFloat(qtyInput.value)).toFixed(2);
        amtEl.textContent = `$${newAmt}`;
        updateCartTotal();
    });
}

function setupExistingCart() {
    const cartBoxes = document.querySelectorAll('.cart-box');
    cartBoxes.forEach(cartBox => setupCartItem(cartBox));
}

function updateCartTotal() {
    const cartBoxes = document.querySelectorAll('.cart-box');
    let total = 0;
    cartBoxes.forEach(box => {
        const price = parseFloat(box.querySelector('.cart-price').textContent.replace('$', ''));
        const quantity = parseInt(box.querySelector('.cart-quantity').value);
        total += price * quantity;
    });
    document.querySelectorAll('.total-price')[1].textContent = `$${total.toFixed(2)}`;
}

function updateItemCount() {
    const count = document.querySelectorAll('.cart-box').length;
    document.getElementById('count').textContent = count;
}

// Login/Register Modal
function showLoginPrompt() {
    if (document.querySelector('.login-prompt')) return;

    let isLoginMode = true; // Track whether the modal is in login or register mode

    const loginDiv = document.createElement('div');
    loginDiv.classList.add('login-prompt');
    loginDiv.innerHTML = `
        <div class="login-box">
            <h2>Login</h2>
            <input type="email" id="email" placeholder="Email" required>
            <input type="password" id="password" placeholder="Password" required>
            <div class="login-actions">
                <button id="submit-btn">Login</button>
                <button id="close-login">Close</button>
            </div>
            <p id="toggle-mode">Don't have an account? Register here</p>
        </div>
    `;
    document.body.appendChild(loginDiv);

    const updateModalContent = () => {
        const title = document.querySelector('.login-box h2');
        const submitBtn = document.getElementById('submit-btn');
        const toggleLink = document.getElementById('toggle-mode');
        if (isLoginMode) {
            title.textContent = 'Login';
            submitBtn.textContent = 'Login';
            toggleLink.textContent = "Don't have an account? Register here";
        } else {
            title.textContent = 'Register';
            submitBtn.textContent = 'Register';
            toggleLink.textContent = 'Already have an account? Login here';
        }
    };

    const toggleMode = () => {
        isLoginMode = !isLoginMode;
        updateModalContent();
    };

    const handleSubmit = async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        if (!email || !password) {
            alert('Please enter both email and password.');
            return;
        }
        if (isLoginMode) {
            await handleLogin(email, password);
        } else {
            await handleRegister(email, password);
        }
    };

    document.getElementById('submit-btn').addEventListener('click', handleSubmit);
    document.getElementById('toggle-mode').addEventListener('click', toggleMode);
    document.getElementById('close-login').addEventListener('click', () => {
        hasClosedModalWithoutLogin = true; // Set flag when modal is closed without login
        loginDiv.remove();
    });
}

async function handleLogin(email, password) {
    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (data.token) {
            token = data.token;
            localStorage.setItem('token', token);
            hasClosedModalWithoutLogin = false; // Reset flag on successful login
            document.querySelector('.login-prompt').remove();
            setupAddToCartButtons();
            setupExistingCart();
            updateCartTotal();
            cart.classList.add('cart-active');
        } else {
            alert(data.error || 'Login failed. Please try again.');
        }
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
}

async function handleRegister(email, password) {
    try {
        const response = await fetch('http://localhost:3000/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (response.ok) {
            alert('Registration successful! Please log in with your new credentials.');
            document.getElementById('email').value = ''; // Clear email field
            document.getElementById('password').value = ''; // Clear password field
            document.getElementById('toggle-mode').click(); // Switch to login mode
        } else {
            alert(data.error || 'Registration failed. Please try again.');
        }
    } catch (error) {
        alert('Registration failed: ' + error.message);
    }
}

// Place Order
btnBuy.addEventListener('click', async () => {
    if (!token || !isTokenValid(token)) {
        if (hasClosedModalWithoutLogin) {
            alert('Please log in or register to place an order.');
        } else {
            showLoginPrompt();
        }
        return;
    }
    const cartBoxes = document.querySelectorAll('.cart-box');
    if (cartBoxes.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    const items = Array.from(cartBoxes).map(box => ({
        image: box.querySelector('.cart-img').src,
        title: box.querySelector('.cart-food-title').textContent,
        price: parseFloat(box.querySelector('.cart-price').textContent.replace('$', '')),
        quantity: parseInt(box.querySelector('.cart-quantity').value)
    }));
    const total = parseFloat(document.querySelectorAll('.total-price')[1].textContent.replace('$', ''));
    try {
        const response = await fetch('http://localhost:3000/api/place-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ items, total })
        });
        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            cartBoxes.forEach(box => box.remove());
            updateCartTotal();
            updateItemCount();
            cart.classList.remove('cart-active');
        } else {
            alert(data.error || 'Order placement failed. Please try again.');
        }
    } catch (error) {
        alert('Order placement failed: ' + error.message);
    }
});