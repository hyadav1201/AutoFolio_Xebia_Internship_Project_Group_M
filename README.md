# AutoFolio - AI-Powered Portfolio Generator

A modern, AI-powered portfolio generator that creates stunning portfolios from resumes using advanced text extraction and AI analysis.



## 🔗 Live Demo

👉 [View Live Project](https://autofolioporfoliogenerator.netlify.app/)


## 🚀 Features

- **AI Resume Parsing**: Advanced text extraction from PDF, DOC, DOCX files
- **Smart Data Extraction**: Automatically extracts personal info, skills, experience, projects
- **Multiple Templates**: Choose from creative, minimal, modern, and tech templates
- **Real-time Preview**: See your portfolio as you build it
- **Payment Integration**: Razorpay integration for premium features
- **Responsive Design**: Works perfectly on all devices
- **3D Interactive Elements**: Modern UI with 3D components

## 🛠️ Tech Stack

### Frontend
- React 18 with Vite
- Tailwind CSS
- Radix UI Components
- React Router DOM
- Lucide React Icons

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT Authentication
- Razorpay Payment Integration
- Multer for file uploads

### AI & APIs
- PDF.js for PDF parsing
- Mammoth.js for Word document parsing
- Cohere API for AI text generation
- Resume Parser API for data extraction

## 📦 Installation

### Prerequisites
- Node.js 18+
- MongoDB
- Razorpay account
- Resume parser API key
- Cohere API key

### Backend Setup

```bash
cd backend
npm install
cp env.example .env
# Edit .env with your configuration
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
cp env.example .env
# Edit .env with your backend URL
npm run dev
```

## 🔧 Environment Variables

### Backend (.env)
```env
PORT=5001
NODE_ENV=production
MONGO_URI=mongodb://localhost:27017/autofolio
JWT_SECRET=your-jwt-secret
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
RZP_WEBHOOK_SECRET=your-webhook-secret
RESUME_PARSER=your-resume-parser-key
cohere_API_KEY=your-cohere-key
CORS_ORIGIN=https://your-frontend-domain.com
```

### Frontend (.env)
```env
VITE_API_BASE_URL=https://your-backend-domain.com
```


## 📁 Project Structure

```
├── backend/
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth middleware
│   ├── templates/       # Portfolio templates
│   └── server.js        # Main server file
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom hooks
│   │   └── config/      # Configuration files
│   └── public/          # Static assets
└── docs/               # Documentation
```

## 🔒 Security Features

- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ CORS configuration
- ✅ Input validation with Zod
- ✅ Environment variable protection
- ✅ Secure file upload handling

## 🎨 Templates

- **Creative**: Bold and artistic design
- **Minimal**: Clean and simple layout
- **Modern**: Contemporary styling
- **Tech**: Developer-focused design

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Portfolio
- `POST /api/portfolio` - Create portfolio
- `GET /api/portfolio/finalized` - Get finalized portfolio
- `POST /api/portfolio/generate` - Generate portfolio HTML
- `POST /api/portfolio/upload-resume` - Upload resume

### Payment
- `POST /api/payment/create-order` - Create payment order
- `POST /api/payment/activate-subscription` - Activate subscription

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please check:
1. Environment variables are correctly set
2. All API keys are valid
3. Database connection is working



