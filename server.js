require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const sgMail = require('@sendgrid/mail');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// SQLite Database Setup
const db = new sqlite3.Database('food-delight.db', (err) => {
    if (err) {
        console.error('SQLite connection error:', err.message);
    } else {
        console.log('SQLite database connected');
    }
});

// Create Users Table
db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )
`);

// Create Orders Table
db.run(`
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        items TEXT NOT NULL,
        total REAL NOT NULL,
        orderDate TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (userId) REFERENCES users(id)
    )
`);

// SendGrid Setup
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Register Route
app.post('/api/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword], function (err) {
            if (err) {
                return res.status(400).json({ error: 'Registration failed, email may already exist', details: err.message });
            }
            res.status(201).json({ message: 'User registered successfully' });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error during registration', details: error.message });
    }
});

// Login Route
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error', details: err.message });
            }
            if (!user) {
                return res.status(400).json({ error: 'User not found' });
            }
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ error: 'Invalid credentials' });
            }
            const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
            // Log login content to terminal
            console.log('Login Successful:');
            console.log(`  Email: ${user.email}`);
            console.log(`  User ID: ${user.id}`);
            console.log('------------------------');
            res.json({ token });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error during login', details: error.message });
    }
});

// Place Order Route
app.post('/api/place-order', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'No token provided' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { items, total } = req.body;
        if (!items || !Array.isArray(items) || isNaN(total)) {
            return res.status(400).json({ error: 'Invalid order data' });
        }

        const itemsJson = JSON.stringify(items);
        db.run('INSERT INTO orders (userId, items, total) VALUES (?, ?, ?)', [decoded.userId, itemsJson, total], async function (err) {
            if (err) {
                return res.status(400).json({ error: 'Order placement failed', details: err.message });
            }
            db.get('SELECT * FROM users WHERE id = ?', [decoded.userId], async (err, user) => {
                if (err || !user) {
                    return res.status(400).json({ error: 'User not found for email', details: err?.message });
                }
                const itemList = items.map(item => `
                    <li>
                        <img src="${item.image}" alt="${item.title}" style="width: 50px; height: 50px;">
                        <p>${item.title} - $${item.price} x ${item.quantity} = $${(item.price * item.quantity).toFixed(2)}</p>
                    </li>
                `).join('');
                const msg = {
                    to: user.email,
                    from: 'rockeysubhas@gmail.com', // Replace with your verified SendGrid sender
                    subject: 'Your Food Delight Order Confirmation',
                    html: `
                        <h2>Thank you for your order!</h2>
                        <h3>Order Details:</h3>
                        <ul>${itemList}</ul>
                        <p><strong>Total: $${total.toFixed(2)}</strong></p>
                        <p>We will process your order soon!</p>
                    `
                };
                // Log email content to terminal
                console.log('Sending Order Confirmation Email:');
                console.log(`  To: ${msg.to}`);
                console.log(`  Subject: ${msg.subject}`);
                console.log('  HTML Content:');
                console.log(msg.html);
                console.log('------------------------');
                try {
                    await sgMail.send(msg);
                    res.json({ message: 'Order placed successfully, confirmation email sent' });
                } catch (emailError) {
                    console.error('Error sending email:', emailError);
                    res.status(400).json({ error: 'Order placed but email failed', details: emailError.message });
                }
            });
        });
    } catch (error) {
        console.error('Error in place-order:', error);
        res.status(401).json({ error: 'Invalid or expired token', details: error.message });
    }
});

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(3000, () => console.log(`Server running on port http://localhost:3000`));

// Close the database connection on server shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing SQLite database:', err.message);
        }
        console.log('SQLite database connection closed');
        process.exit(0);
    });
});