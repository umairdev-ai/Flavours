# 🍽️ Dine Delight

A modern, full-stack restaurant management application built with React, TypeScript, Node.js, and MongoDB. Experience seamless dining with online ordering, table reservations, and comprehensive admin management.

## ✨ Features

### 🛒 Customer Features
- **Interactive Menu**: Browse delicious dishes with high-quality images and detailed descriptions
- **Smart Cart**: Add items, adjust quantities, and manage your order with persistent local storage
- **Table Reservations**: Book tables for any party size with real-time availability
- **Order Placement**: Complete orders with delivery or pickup options
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

### 👨‍💼 Admin Features
- **Secure Authentication**: JWT-based login system for admin access
- **Order Management**: View and track all customer orders in real-time
- **Reservation Oversight**: Monitor table bookings and manage availability
- **Menu Management**: Add, edit, and organize menu items
- **Table Management**: Control table availability and capacity

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Shadcn/ui** - Beautiful, accessible UI components
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **TanStack Query** - Powerful data fetching and caching
- **Lucide Icons** - Beautiful icon library

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework for APIs
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v16 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dine-delight
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd server
   npm install
   cd ..
   ```

4. **Set up environment variables**

   Create `.env` file in the `server` directory:
   ```env
   MONGO_URI=mongodb://localhost:27017/dine-delight
   JWT_SECRET=your_super_secret_jwt_key_here
   PORT=5000
   ```

5. **Start MongoDB**
   ```bash
   # For local MongoDB
   mongod
   # Or start MongoDB service on your system
   ```

6. **Create admin user**
   ```bash
   cd server
   node seed.js
   cd ..
   ```

7. **Start the development servers**

   **Terminal 1 - Backend:**
   ```bash
   cd server
   npm run dev
   ```

   **Terminal 2 - Frontend:**
   ```bash
   npm run dev
   ```

8. **Open your browser**
   ```
   http://localhost:8080
   ```

## 📁 Project Structure

```
dine-delight/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # Shadcn/ui components
│   │   └── ...
│   ├── context/           # React context providers
│   ├── data/              # Static data and types
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   ├── pages/             # Page components
│   └── ...
├── server/                # Backend application
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   └── ...
├── package.json
├── vite.config.ts
└── README.md
```

## 🔗 API Endpoints

### Public Endpoints
- `POST /api/orders` - Place a new order
- `POST /api/bookings` - Create a table reservation

### Admin Endpoints (Protected)
- `POST /api/admin/login` - Admin authentication
- `GET /api/admin/orders` - Get all orders
- `GET /api/admin/bookings` - Get all reservations

## 👤 Default Admin Credentials

- **Username:** `admin`
- **Password:** `admin123`

## 🎨 UI/UX Features

- **Dark/Light Mode Ready** - Built with design tokens for easy theming
- **Accessibility First** - WCAG compliant components
- **Mobile Responsive** - Optimized for all screen sizes
- **Smooth Animations** - CSS transitions and transforms
- **Loading States** - User feedback during API calls
- **Error Handling** - Graceful error messages and fallbacks

## 🧪 Testing

```bash
# Run frontend tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 📦 Build for Production

```bash
# Build frontend
npm run build

# Build backend
cd server
npm run build
```

## 🚀 Deployment

### Frontend
The built files in `dist/` can be deployed to any static hosting service:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

### Backend
Deploy the `server/` directory to:
- Heroku
- Railway
- Render
- AWS EC2
- DigitalOcean App Platform

### Environment Setup
- Set `NODE_ENV=production`
- Configure production MongoDB URI
- Set secure JWT secret
- Enable HTTPS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Shadcn/ui** for beautiful component library
- **Unsplash** for high-quality food images
- **Lucide** for consistent iconography
- **Tailwind CSS** for utility-first styling

## 📞 Support

For support, email support@dinedelight.com or join our Discord community.

---

**Made with ❤️ for food lovers everywhere**
