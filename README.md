# 🛒 Bitkart - eCommerce Platform

Bitkart is a full-stack eCommerce platform built using **Node.js**, **Express.js**, **MongoDB**, and **Handlebars (hbs)**. The platform supports secure payments via **Razorpay** and user login through **Google OAuth 2.0**.

[🌐 **Live URL**](https://bitkart.farzin.in)

## 🚀 Features

- User authentication (Email/Password + Google Sign-In)
- Admin dashboard for product & order management
- Product listing, cart, and checkout system
- Secure payment integration using Razorpay
- Built-in user wallet system for storing and using credits
- MVC folder structure for clean code separation

## 🛠️ Tech Stack

- **Frontend**: HTML, CSS, JavaScript, Handlebars (hbs)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: Google OAuth 2.0
- **Payments**: Razorpay API

## 🔧 Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/muhammedfarzin/bitkart-ecom.git
   cd bitkart-ecom
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure environment variables**:

   Create a `.env` file in the root directory and add the following:

   ```bash
   # Server config
   PORT=your_app_port
   MONGO_URI=your_mongodb_connection_uri

   # Admin credentials
   ADMIN_EMAIL=your_admin_email@example.com
   ADMIN_PASSWORD=your_admin_password

   # Mail configuration
   MAIL_HOST=your_smtp_host
   MAIL_USER=your_email@example.com
   MAIL_PASS=your_email_password

   # Google OAuth config
   GOOGLE_AUTH_CLIENT_ID=your_google_client_id

   # Razorpay config
   RAZORPAY_ID=your_razorpay_key_id
   RAZORPAY_SECRET=your_razorpay_secret
   ```

4. **Run the app**:
   ```bash
   npm start
   ```

## ✅ Admin Panel

- Access: `/admin`.
- Use the credentials from your `.env` file to log in.
