# MotoParts — Automotive Parts Marketplace

A full-stack e-commerce platform for buying and selling car, motorcycle, and superbike parts. Built with React, Node.js, MongoDB, Stripe, and Cloudinary.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, Tailwind CSS, Redux Toolkit |
| Backend | Node.js, Express 4 |
| Database | MongoDB + Mongoose |
| Auth | JWT (access tokens) |
| Payments | Stripe Checkout Sessions |
| Images | Cloudinary + Multer |
| Real-time | Socket.IO |
| Email | Nodemailer |

---

## Features

- **Authentication** — Register, login, JWT-protected routes, forgot/reset password
- **Marketplace** — Browse 5 part categories (engine, brakes, suspension, electrical, body)
- **Vehicle Filters** — Filter by car / bike / superbike / universal
- **Shopping Cart** — Persistent cart (localStorage), quantity controls, live totals
- **Checkout** — Multi-step form, Stripe card payments or Cash on Delivery
- **Seller Dashboard** — List products, manage orders, view earnings overview
- **Admin Panel** — Approve sellers & products, manage users/orders, view stats
- **Wishlist** — Save products, move to cart
- **Reviews & Ratings** — Star ratings, helpful votes, verified purchase badge
- **Real-time Messaging** — Socket.IO chat between buyers and sellers
- **Notifications** — In-app notifications for orders, messages, seller approvals
- **Dark / Light Mode** — Persisted to localStorage

---

## Project Structure

```
e-commerce web/
├── server/                  # Express API
│   ├── config/              # DB + Cloudinary setup
│   ├── controllers/         # Route logic
│   ├── middlewares/         # Auth, roles, file upload
│   ├── models/              # Mongoose schemas
│   ├── routes/              # Express routers
│   ├── utils/               # JWT, email helpers
│   ├── server.js            # Entry point
│   └── package.json
│
└── client/                  # React SPA
    ├── public/
    ├── src/
    │   ├── components/
    │   │   ├── cart/        # CartSidebar
    │   │   ├── common/      # Navbar, Footer, Loader, ProtectedRoute
    │   │   └── product/     # ProductCard, ProductFilters
    │   ├── context/         # ThemeContext
    │   ├── hooks/           # useAuth
    │   ├── pages/           # All page components
    │   ├── services/        # Axios API client
    │   ├── store/           # Redux store + slices
    │   ├── utils/           # formatCurrency
    │   ├── App.jsx
    │   └── main.jsx
    └── package.json
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- A [Stripe](https://stripe.com) account (test keys)
- A [Cloudinary](https://cloudinary.com) account (free tier)

---

### 1. Clone / Open the project

```bash
cd "e-commerce web"
```

---

### 2. Configure Environment Variables

Copy the example file and fill in your credentials:

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
NODE_ENV=development
PORT=5000

MONGO_URI=mongodb://localhost:27017/motoparts
# OR for Atlas: mongodb+srv://<user>:<pass>@cluster.mongodb.net/motoparts

JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=30d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
CLIENT_URL=http://localhost:5173

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
```

> **Stripe webhook:** For local testing, install the [Stripe CLI](https://stripe.com/docs/stripe-cli) and run:
> ```bash
> stripe listen --forward-to localhost:5000/api/orders/webhook
> ```
> Copy the webhook signing secret it shows into `STRIPE_WEBHOOK_SECRET`.

---

### 3. Install Dependencies

**Backend:**
```bash
cd server
npm install
```

**Frontend:**
```bash
cd ../client
npm install
```

---

### 4. Run the Application

Open two terminals:

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
# Server starts on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
# App starts on http://localhost:5173
```

Open http://localhost:5173 in your browser.

---

### 5. Create an Admin Account

Register a user normally, then open MongoDB Compass (or mongo shell) and update:w

```js
db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
```

---

### 6. Bulk Seed 150 Products (50 bike + 50 car + 50 superbike parts)

Run this command from the `server` folder to auto-insert products with image URLs and prices:

```bash
npm run seed:vehicles
```

What it does:
- Inserts exactly **150 products** (50 per group)
- Adds a valid product image URL for each item
- Sets realistic price ranges and optional discounted prices
- Replaces previous bulk-seeded items safely (idempotent)

---

## API Endpoints Reference

### Auth — `/api/auth`
| Method | Route | Description |
|---|---|---|
| POST | `/register` | Register new user |
| POST | `/login` | Login, returns JWT |
| GET | `/me` | Get current user (auth) |
| POST | `/forgot-password` | Send reset email |
| PUT | `/reset-password/:token` | Reset password |
| POST | `/apply-seller` | Apply to become a seller (auth) |

### Products — `/api/products`
| Method | Route | Description |
|---|---|---|
| GET | `/` | List products (search, filter, paginate) |
| GET | `/:id` | Get single product |
| POST | `/` | Create product (seller) |
| PUT | `/:id` | Update product (seller) |
| DELETE | `/:id` | Delete product (seller) |
| GET | `/featured` | Get featured products |
| GET | `/my-products` | Seller's own products |

### Orders — `/api/orders`
| Method | Route | Description |
|---|---|---|
| POST | `/` | Place order (Stripe or COD) |
| POST | `/webhook` | Stripe webhook |
| GET | `/my-orders` | Buyer's order history |
| GET | `/seller` | Seller's incoming orders |
| GET | `/:id` | Order detail |

### Users — `/api/users`
| Method | Route | Description |
|---|---|---|
| PUT | `/profile` | Update profile |
| PUT | `/profile/avatar` | Upload avatar |
| PUT | `/change-password` | Change password |
| PUT | `/wishlist` | Toggle wishlist item |
| GET | `/wishlist` | Get wishlist |
| GET | `/notifications` | Get notifications |
| GET | `/:id/public` | Public seller profile |

### Reviews — `/api/reviews`
| Method | Route | Description |
|---|---|---|
| POST | `/` | Create review |
| PUT | `/:id` | Update own review |
| DELETE | `/:id` | Delete own review |
| PUT | `/:id/helpful` | Vote helpful |

### Messages — `/api/messages`
| Method | Route | Description |
|---|---|---|
| POST | `/` | Send message |
| GET | `/inbox` | Get inbox |
| GET | `/:userId` | Get conversation |

### Admin — `/api/admin`
| Method | Route | Description |
|---|---|---|
| GET | `/stats` | Platform statistics |
| GET | `/users` | All users |
| PATCH | `/users/:id/toggle` | Ban/unban user |
| GET | `/sellers/pending` | Pending applications |
| PATCH | `/sellers/:id` | Approve/reject seller |
| GET | `/products` | All products |
| PATCH | `/products/:id/approve` | Toggle product approval |
| GET | `/orders` | All orders |

---

## Scaling for a Large Marketplace (eBay-like)

To grow MotoParts into an enterprise-grade platform:

### Infrastructure
- **Horizontal scaling:** Deploy API behind a load balancer (AWS ALB / NGINX). Use PM2 cluster mode.
- **Database:** Migrate to MongoDB Atlas M10+ with replica sets. Add read replicas for product queries.
- **Caching:** Add Redis for session storage, product catalog caching, and rate-limit state. Use `ioredis`.
- **CDN:** Serve frontend via Cloudflare or AWS CloudFront. Cloudinary already handles image CDN.
- **Message queue:** Use BullMQ + Redis for async jobs (email, notifications, order processing) instead of inline Nodemailer calls.

### Search
- Replace MongoDB full-text search with **Elasticsearch** or **Algolia** for faceted search, typo-tolerance, and sub-50ms results at scale.

### Payments & Finance
- Add **Stripe Connect** for direct seller payouts and marketplace escrow.
- Add **multi-currency** support with Stripe's currency conversion.

### Reliability
- Add circuit-breaker pattern for external service calls (Stripe, Cloudinary).
- Implement **idempotency keys** on Stripe order creation to prevent duplicate charges.
- Add **database transactions** (MongoDB sessions) for order + stock deduction atomicity.

### Observability
- Add **structured logging** with Winston + log aggregation (Datadog / CloudWatch).
- Add **APM** (Sentry for errors, Datadog or New Relic for performance tracing).
- Set up health-check endpoints + uptime monitoring.

### Security Hardening
- Implement **refresh token rotation** (short-lived access tokens + long-lived refresh tokens in httpOnly cookies).
- Add **CAPTCHA** (hCaptcha) on registration and login.
- Use **Cloudflare WAF** rules to block bot traffic and scraping.
- Apply field-level encryption on PII (addresses, phone numbers) in MongoDB.

---

## License

MIT
