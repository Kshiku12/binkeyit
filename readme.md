# Binkeyit - Premium Blinkit Clone (MERN Stack)

Binkeyit is a high-performance, full-stack grocery delivery application inspired by Blinkit. It features a modern, responsive UI, real-time order tracking, and an integrated AI shopping assistant.

## 🚀 Key Features

- **Modern UI/UX**: Built with React and Vanilla CSS for a premium, high-performance experience.
- **Real-Time Tracking**: Live order tracking using Socket.io and Leaflet maps to visualize the rider's progress.
- **AI Assistant**: Integrated AI bot to help users find products, suggest recipes, and add items directly to the cart.
- **Full E-commerce Flow**:
  - Dynamic product catalog with categories and subcategories.
  - Advanced cart management with instructions and tips.
  - Multi-step address wizard with geolocation support.
  - Multiple payment options: Credit/Debit Card, UPI (with QR & Deep links), Wallet, and COD.
- **Secure Authentication**: JWT-based auth with Google OAuth integration.
- **Order History & Profiles**: Comprehensive user dashboard for managing orders, addresses, and saved cards.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, React Router, Socket.io Client, Leaflet.
- **Backend**: Node.js, Express, MongoDB (Mongoose), Socket.io.
- **AI**: Google Gemini API (integrated via custom AI controller).
- **Styling**: Vanilla CSS with modern variables and animations.

## 📦 Project Structure

```text
v2/
├── apps/
│   ├── api/      # Express Backend
│   └── web/      # Vite + React Frontend
├── package.json  # Root workspace configuration
└── scratch/      # Utility and data seeding scripts
```

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)

### 1. Clone and Install
```bash
# Navigate to the v2 directory
cd v2

# Install dependencies for both apps (using npm workspaces logic)
npm install --prefix apps/api
npm install --prefix apps/web
```

### 2. Environment Variables
Create `.env` files in both `apps/api` and `apps/web` based on the `.env.example` files provided in those directories.

**API (`apps/api/.env`):**
- `PORT=8081`
- `MONGODB_URI=your_mongodb_uri`
- `JWT_SECRET=your_secret`
- `GEMINI_API_KEY=your_key`

**WEB (`apps/web/.env`):**
- `VITE_API_URL=http://localhost:8081`
- `VITE_GOOGLE_CLIENT_ID=your_google_client_id`

### 3. Run the Project

You can run both servers from the `v2` root directory:

```bash
# Start API Server (Running on http://localhost:8081)
npm run api:dev

# Start Web Frontend (Running on http://localhost:5174)
npm run web:dev
```

### 4. Seed Sample Data (Optional)
To populate the database with categories and products:
```bash
npm run api:seed
```

## 📝 License
This project is for educational purposes as part of Group 27's Blinkit Clone development.