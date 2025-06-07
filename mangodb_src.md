require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const sgMail = require('@sendgrid/mail');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const app = express();

// Set Mongoose strictQuery to suppress deprecation warning
mongoose.set('strictQuery', true);

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from 'public' folder

// MongoDB Connection
mongoose.connect('mongodb://localhost/food-delight', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// Order Schema
const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        title: String,
        price: Number,
        quantity: Number,
        image: String
    }],
    total: Number,
    orderDate: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

// SendGrid Setup
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Register Route
app.post('/api/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(400).json({ error: 'Registration failed', details: error.message });
    }
});

// Login Route
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: 'User not found' });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(400).json({ error: 'Login failed', details: error.message });
    }
});

// Place Order Route
app.post('/api/place-order', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'No token provided' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { items, total } = req.body;

        // Save order to database
        const order = new Order({
            userId: decoded.userId,
            items,
            total
        });
        await order.save();

        // Fetch user for email
        const user = await User.findById(decoded.userId);

        // Prepare email content
        const itemList = items.map(item => `
      <li>
        <img src="${item.image}" alt="${item.title}" style="width: 50px; height: 50px;">
        <p>${item.title} - $${item.price} x ${item.quantity} = $${(item.price * item.quantity).toFixed(2)}</p>
      </li>
    `).join('');

        const msg = {
            to: user.email,
            from: 'rockeysubhas@gmail.com', // Replace with your SendGrid verified sender email
            subject: 'Your Food Delight Order Confirmation',
            html: `
        <h2>Thank you for your order!</h2>
        <h3>Order Details:</h3>
        <ul>${itemList}</ul>
        <p><strong>Total: $${total.toFixed(2)}</strong></p>
        <p>We will process your order soon!</p>
      `
        };

        // Send email with SendGrid
        await sgMail.send(msg);
        res.json({ message: 'Order placed successfully, confirmation email sent' });
    } catch (error) {
        console.error('Error sending email:', error);
        if (error.response) {
            console.error(error.response.body);
        }
        res.status(400).json({ error: 'Order placement failed', details: error.message });
    }
});

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(3000, () => console.log('Server running on port 3000'));