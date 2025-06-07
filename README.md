# Food Delight - Online Food Ordering System
Overview
Food Delight is a simple web-based food ordering application that allows users to browse food items, add them to a cart, and place orders. The application features user authentication (login/register), order confirmation emails via SendGrid, and a SQLite database to store user and order data. It is built using Node.js, Express, HTML, CSS, and JavaScript.
Features

## User Authentication: Users must log in or register to add items to their cart and place orders. Authentication is handled using JWT (JSON Web Tokens).
Shopping Cart: Users can add food items to their cart, adjust quantities, and view the total price.
## Order Placement: Orders are saved in a SQLite database, and a confirmation email is sent to the user with order details, including embedded images of the food items.
## Responsive Design: The frontend is styled with CSS for a clean and user-friendly interface.
## Email Notifications: Order confirmation emails are sent via SendGrid with embedded images of the ordered items.
## Logging: The server logs login details and email content to the terminal for debugging purposes.

## Prerequisites
Before running the application, ensure you have the following installed:

> Node.js (v14 or higher)
> npm (comes with Node.js)
A SendGrid account and API key
SQLite (included with sqlite3 package)

Setup Instructions
1. Clone the Repository
Clone this repository to your local machine:
git clone https://github.com/your-username/food-delight.git
cd food-delight

2. Install Dependencies
Install the required Node.js packages:
npm install

This will install the following dependencies (as listed in package.json):

express: Web server framework
sqlite3: SQLite database driver
@sendgrid/mail: SendGrid email service
bcrypt: Password hashing
jsonwebtoken: JWT for authentication
cors: Cross-Origin Resource Sharing
dotenv: Environment variable management

3. Set Up Environment Variables
Create a .env file in the root directory and add the following environment variables:
SENDGRID_API_KEY=your_sendgrid_api_key_here
JWT_SECRET=your_jwt_secret_here


SENDGRID_API_KEY: Obtain this from your SendGrid dashboard after creating an API key with "Mail Send" permissions.
JWT_SECRET: A random, secure string for signing JWT tokens (e.g., generate using openssl rand -base64 32).

4. Verify SendGrid Sender Email

Log in to your SendGrid account.
Go to Settings > Sender Authentication and verify a sender email (e.g., rockeysubhas@gmail.com).
Ensure this email matches the from address in server.js.

5. Set Up the Database
The application uses SQLite to store users and orders. The database file (food-delight.db) will be created automatically in the root directory when you start the server. The schema includes:

users: Stores user information (ID, email, password).
orders: Stores order details (ID, user ID, items, total, order date).

6. Start the Server
Run the server:
node server.js

The server will start on http://localhost:3000. You should see the following in the terminal:
SQLite database connected
Server running on port http://localhost:3000

7. Access the Application
Open your browser and navigate to http://localhost:3000. You’ll see the Food Delight homepage with a list of food items.
Usage

Register/Login:

On page load, a login/register modal will appear since cart access requires authentication.
Click "Register here" to create a new account, or log in with existing credentials.
After successful registration, the modal will switch to login mode for you to log in.


Add Items to Cart:

Once logged in, click the green cart icon on any food item to add it to your cart.
If you try to add an item without logging in, the login/register modal will reappear.


View and Manage Cart:

Click the cart icon in the header to view your cart.
Adjust quantities or remove items as needed.
The total price updates automatically.


Place an Order:

Click the "Buy Now" button in the cart to place your order.
The order will be saved in the database, and a confirmation email will be sent to your registered email address.
The email includes the list of items (with embedded images), quantities, prices, and the total amount.


Check Terminal Logs:

After logging in, the server logs the user’s email and ID to the terminal.
After placing an order, the server logs the email content (recipient, subject, and HTML body) to the terminal.



File Structure
food-delight/
├── public/
│   ├── images/
│   │   ├── img_1.jpg  # Images for food items
│   │   ├── img_2.jpg
│   │   ├── img_3.jpg
│   │   └── img_4.jpg
│   ├── index.html     # Main HTML file
│   ├── script.js      # Frontend JavaScript logic
│   └── style.css      # CSS styles
├── .env               # Environment variables (not tracked by Git)
├── .gitignore         # Git ignore file
├── food-delight.db    # SQLite database (created on first run)
├── package.json       # Node.js dependencies and scripts
├── package-lock.json  # Dependency lock file
├── server.js          # Backend server code
└── README.md          # Project documentation

Troubleshooting
Images Not Showing in Emails

The application embeds images in emails as Base64 data to avoid issues with external URLs in development.
Ensure the image files exist in public/images/ and match the names used in index.html (e.g., img_1.jpg).
In production, consider hosting images on a public server or CDN and updating script.js to use absolute URLs.

Email Not Sending

Verify that your SendGrid API key is correct in the .env file.
Ensure the sender email (rockeysubhas@gmail.com) is verified in SendGrid.
Check the terminal logs for email errors if the email fails to send.

Time Zone Issues

The orderDate in the database uses the server’s local time. If you’re in IST (Indian Standard Time), set the server’s time zone:export TZ='Asia/Kolkata'
node server.js



Login/Register Modal Keeps Reappearing

If you close the modal without logging in, clicking "Add to Cart" will show an alert instead of reopening the modal immediately.
Log in or register to access cart functionality.

Deployment to Production
For production deployment:

Host your application on a platform like Heroku, AWS, or Render.
Use a public domain (e.g., https://yourdomain.com) instead of localhost.
Update script.js to use absolute URLs for images (e.g., https://yourdomain.com/images/img_1.jpg) instead of embedding them as Base64 to reduce email size.
Secure your .env file and ensure it’s not exposed in version control.

Technologies Used

Frontend: HTML, CSS, JavaScript
Backend: Node.js, Express
Database: SQLite
Email Service: SendGrid
Authentication: JWT, bcrypt
Environment Variables: dotenv

Contributing
Feel free to fork this repository and submit pull requests with improvements or bug fixes.
License
This project is licensed under the MIT License.
Contact
For questions or support, please contact your-email@example.com.

Last Updated: Saturday, June 07, 2025, 11:43 AM IST
