# Shopping Cart Application

A simple e-commerce shopping cart application built with Node.js, Express.js, and MongoDB. This project allows users to browse products, add them to a cart, place orders, and includes an admin panel for managing products and orders.

## Features

- **User Authentication**: User registration and login with password hashing using bcrypt.
- **Product Management**: View products, add to cart, and manage cart items.
- **Order Placement**: Place orders with a mock payment system.
- **Admin Panel**: Admin can add, edit, and view products, as well as view all orders.
- **Session Management**: User sessions handled with express-session.
- **Responsive UI**: Built with Handlebars templates and basic CSS.

## Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Templating**: Handlebars (hbs)
- **Authentication**: bcrypt for password hashing
- **Session**: express-session
- **Development**: nodemon for auto-restart

## Installation

1. Clone the repository or download the project files.

2. Navigate to the project directory:
   ```
   cd shopping_cart
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Ensure MongoDB is installed and running on your local machine (default connection: `mongodb://localhost:27017`).

5. Start the application:
   - For production: `npm start`
   - For development (with auto-restart): `npm run dev`

6. Open your browser and go to `http://localhost:3000` (or the port specified in `bin/www`).

## Usage

- **User Side**:
  - Sign up or log in.
  - Browse products.
  - Add products to cart.
  - View cart and place orders.
  - View order history.

- **Admin Side**:
  - Log in as admin (assuming admin credentials are set up).
  - Add new products.
  - Edit existing products.
  - View all products and orders.

## Project Structure

- `app.js`: Main application file.
- `bin/www`: Server startup script.
- `config/`: Database connection and collection names.
- `helpers/`: Helper functions for admin, product, and user operations.
- `public/`: Static files (CSS, JS, images).
- `routes/`: Route handlers for admin and users.
- `views/`: Handlebars templates for rendering pages.

## Contributing

This is a learning project. Feel free to fork and modify as needed.

## License

This project is for educational purposes only.