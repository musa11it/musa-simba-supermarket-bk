# 🛒 Simba Supermarket Backend API v2.0

Full-featured backend for Simba Supermarket 2.0 — Rwanda's largest supermarket chain.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Make sure MongoDB is running locally, or set MONGODB_URI in .env

# Seed database with branches, categories, products and demo users
npm run seed

# Start development server
npm run dev
```

Server runs on **http://localhost:5000**

## 🔑 Default Login Credentials (after seed)

| Role         | Email                      | Password       |
|--------------|----------------------------|----------------|
| Super Admin  | superadmin@simba.rw        | Simba@2026     |
| Admin        | admin.remera@simba.rw      | Admin@2026     |
| Staff        | staff.remera@simba.rw      | Staff@2026     |
| Customer     | customer@simba.rw          | Customer@2026  |

## 📡 API Endpoints

Base URL: `http://localhost:5000/api`

### Authentication
- `POST /auth/register` — Register new customer
- `POST /auth/login` — Login
- `POST /auth/google` — Google OAuth login
- `POST /auth/forgot-password` — Request password reset
- `POST /auth/reset-password/:token` — Reset password
- `GET /auth/me` — Get current user (auth required)
- `PUT /auth/profile` — Update profile
- `PUT /auth/change-password` — Change password

### Branches
- `GET /branches` — List all branches
- `GET /branches/:id` — Get branch details
- `POST /branches` — Create branch (admin creates, pending; superadmin auto-approved)
- `PUT /branches/:id` — Update branch
- `POST /branches/:id/approve` — Super admin approves branch
- `POST /branches/:id/reject` — Super admin rejects branch
- `GET /branches/pending` — Super admin: pending branches
- `POST /branches/:id/assign-manager` — Assign branch manager

### Products
- `GET /products?category=&search=&branchId=&page=&limit=` — List products
- `GET /products/featured` — Featured products for landing page
- `GET /products/category/:slug` — By category
- `GET /products/:id?branchId=` — Product detail with stock
- `POST /products` — Create (admin)
- `PUT /products/:id` — Update (admin)

### Categories
- `GET /categories` — All categories
- `POST /categories` — Create (admin)

### Orders
- `POST /orders` — Create order
- `GET /orders/my-orders` — Customer's orders
- `GET /orders/staff` — Staff's assigned orders
- `GET /orders/branch/:branchId?` — Branch orders (admin)
- `GET /orders/stats` — Dashboard stats
- `POST /orders/:id/confirm-payment` — Mock MoMo confirm
- `POST /orders/:id/assign` — Admin assigns to staff
- `PUT /orders/:id/status` — Update status (accepted, preparing, ready, completed, no_show)

### Inventory
- `GET /inventory/branch/:branchId?` — Branch inventory
- `PUT /inventory/stock` — Update stock
- `GET /inventory/low-stock` — Low stock alerts

### Reviews
- `POST /reviews` — Customer reviews branch after completed order
- `GET /reviews/branch/:branchId` — Branch reviews

### Users (Super Admin)
- `GET /users` — All users
- `POST /users` — Create user (admin/staff)
- `PUT /users/:id` — Update
- `PUT /users/:id/toggle-status` — Activate/deactivate

### Notifications
- `GET /notifications` — User's notifications
- `GET /notifications/unread-count` — Unread count

### AI
- `POST /ai/chat` — Chat with Simba AI assistant
- `POST /ai/search` — Conversational product search

## 🔐 Roles & Permissions

- **superadmin** — Full control; approves branches, manages all users
- **admin** — Manages their assigned branch (orders, inventory, staff)
- **staff** — Handles their assigned orders
- **customer** — Places orders, leaves reviews

## 🌍 Multi-Language Support

All models support **English (en)**, **Kinyarwanda (rw)**, and **French (fr)** fields.

## 🤖 AI Integration

Uses Groq API (free tier) with `llama-3.3-70b-versatile`. Set `GROQ_API_KEY` in `.env`. If unset, falls back to rule-based responses.

## 📧 Email

Configure SMTP in `.env` for real emails. If not configured, emails are logged to console.

## 📂 Project Structure

```
backend/
├── src/
│   ├── config/         # Database config
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Auth, error handling
│   ├── models/         # Mongoose schemas
│   ├── routes/         # API routes
│   ├── services/       # Email, AI services
│   ├── types/          # TypeScript types
│   ├── utils/          # Seed script, helpers
│   ├── data/           # Seed data
│   ├── app.ts          # Express app
│   └── server.ts       # Entry point
├── .env                # Environment variables
├── package.json
└── tsconfig.json
```
