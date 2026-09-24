# 🎒 CampusFindHub — Lost & Found Campus Management System

A modern, full-stack MERN application for reporting, tracking, and recovering lost and found items on campus.

---

## 🏗️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React.js + Vite |
| **Styling** | Tailwind CSS (Custom Design System) |
| **Routing** | React Router DOM v6 |
| **HTTP Client** | Axios (Cookie-based session credentials) |
| **Backend** | Node.js + Express.js 5 |
| **Database** | MongoDB Atlas / Local + Mongoose |
| **Authentication** | JWT stored in HttpOnly secure cookies + bcryptjs |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer)
- [npm](https://www.npmjs.com/) (v9 or newer)
- MongoDB Atlas cluster URI or local MongoDB instance

---

### 1. Installation

Clone the repository and install all dependencies in one command from the project root:

```bash
git clone <repository-url>
cd CampusFindHub

# Install root, server, and client dependencies
npm run install-all
```

---

### 2. Configure Environment Variables

Create or configure `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/campusfindhub
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

---

### 3. Run Application

Run both the **Backend** and **Frontend** simultaneously with a single command from the root directory:

```bash
npm run dev
```

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000/api](http://localhost:5000/api)

#### Available Root Scripts:
| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs backend (nodemon) & frontend (vite) concurrently |
| `npm run server` | Runs only backend server with nodemon |
| `npm run client` | Runs only frontend Vite dev server |
| `npm run build` | Builds production frontend bundle (`client/dist`) |
| `npm run install-all`| Installs dependencies for both server and client |

---

## 📁 Project Structure

```text
CampusFindHub/
├── package.json                # Root concurrently runner
├── README.md
├── .gitignore
│
├── server/                     # Express.js Backend
│   ├── config/
│   │   └── db.js               # MongoDB Mongoose connection
│   ├── controllers/
│   │   ├── auth.controller.js  # Register, login, profile edit, logout
│   │   ├── item.controller.js  # CRUD and status toggle for items
│   │   ├── claim.controller.js # Claims workflow for found items
│   │   └── insight.controller.js # Sightings & location info on lost items
│   ├── middleware/
│   │   └── auth.middleware.js  # Cookie JWT verification
│   ├── models/
│   │   ├── User.js             # User schema with roles
│   │   ├── Item.js             # Item schema (open/matched/claimed/closed)
│   │   ├── Claim.js            # Claim schema
│   │   └── Insight.js          # Sighting information schema
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── item.routes.js
│   │   ├── claim.routes.js
│   │   └── insight.routes.js
│   ├── nodemon.json            # Nodemon auto-restart watcher
│   ├── .env                    # Environment configuration
│   └── index.js                # Server entry point & CORS
│
└── client/                     # Vite + React Frontend
    ├── src/
    │   ├── api/
    │   │   └── axios.js        # Axios instance with credentials
    │   ├── context/
    │   │   └── AuthContext.jsx # Global auth session state & profile updater
    │   ├── components/
    │   │   ├── Navbar.jsx      # Top nav with profile dropdown
    │   │   ├── ItemCard.jsx    # Item display card with status badges
    │   │   ├── ClaimModal.jsx  # Modal to submit item claims
    │   │   └── InsightModal.jsx# Modal to share sighting information
    │   ├── pages/
    │   │   ├── Home.jsx        # Search, filter, and item browsing
    │   │   ├── Login.jsx       # User sign-in
    │   │   ├── Register.jsx    # User sign-up
    │   │   ├── ReportItem.jsx  # Form to report lost/found items
    │   │   ├── ItemDetail.jsx  # Item view, claims, insights, close action
    │   │   ├── Dashboard.jsx   # Reports, claims, insights & status toggle
    │   │   └── EditProfile.jsx # Edit display name & change password
    │   ├── App.jsx             # Router and ProtectedRoute setup
    │   ├── main.jsx
    │   └── index.css           # Tailwind design tokens and badge styles
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## 🔑 API Endpoints

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | No | Register new campus user |
| `POST` | `/api/auth/login` | No | Login and receive secure HttpOnly cookie |
| `GET` | `/api/auth/me` | Yes | Get authenticated user profile |
| `PUT` | `/api/auth/profile` | Yes | Update display name and change password |
| `POST` | `/api/auth/logout` | Yes | Clear session cookie |

### 📦 Items (`/api/items`)
| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/items` | No | List items with search/category/status filters |
| `POST` | `/api/items` | Yes | Report a new lost or found item |
| `GET` | `/api/items/:id` | No | Get single item details |
| `PUT` | `/api/items/:id` | Owner / Admin | Update item metadata |
| `PATCH`| `/api/items/:id/status` | Owner / Admin | Close, reopen, or update status (`open`/`closed`) |
| `DELETE`| `/api/items/:id` | Owner / Admin | Delete item report and associated claims |

### 📋 Claims (`/api/claims`)
| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/claims` | Yes | Submit ownership claim for a found item |
| `GET` | `/api/claims/my` | Yes | View claims submitted by current user |
| `GET` | `/api/claims/item/:itemId` | Owner / Admin | View incoming claims on an item |
| `PUT` | `/api/claims/:id` | Owner / Admin | Approve (marks item claimed) or reject claim |

### 💡 Insights / Sightings (`/api/insights`)
| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/insights` | Yes | Share sighting details/location on a lost item |
| `GET` | `/api/insights/incoming` | Yes | Get sightings submitted on user's lost reports |

---

## ✨ Key Features

- **Profile Dropdown & Management**:
  - Clean top bar with all user links organized in a dropdown.
  - **Edit Profile** page to update display name and securely change passwords.
- **Close & Reopen Reports**:
  - Recovered your lost item? Mark it **Closed** directly from the Dashboard or Item Detail page without deleting it.
  - Easily **Reopen** if needed.
- **Community Sighting Clues (Insights)**:
  - Students can post location sightings and contact clues on lost-item posts to help owners recover their belongings.
- **Claims System for Found Items**:
  - Finders review claim messages from rightful owners and approve or reject them.
  - Approving a claim automatically transitions the item to **Claimed**.
- **Search & Filter**:
  - Real-time search with debounced typing.
  - Multi-attribute filters: Category, Type (Lost/Found), and Status (Open/Closed/Claimed/Matched).
- **Security & Session Management**:
  - HttpOnly JWT cookie storage prevents XSS token theft.
  - CSRF origin validation on state-changing requests.
  - Passwords salted and hashed with bcryptjs.
- **Single-Command Development**:
  - `npm run dev` concurrently launches Nodemon backend and Vite frontend with unified logging.

---