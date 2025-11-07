# Gamified Productivity App

A 3D gamified productivity application that integrates with Google Calendar to create actionable steps using AI agents. Features RPG-style progression, mental health assessments, and immersive 3D interface.

## Features

- 🎮 **Gamified Interface**: 3D hexagonal interface with avatar customization
- 📅 **Calendar Integration**: Google Calendar sync with AI-powered recommendations  
- 🧠 **Mental Health**: ADHD, anxiety, and depression screening questionnaires
- 🏆 **Six Life Pillars**: Finance, physicality, mental health, social health, intellect, discipline
- 🤖 **AI Agents**: Gemini-powered personalized recommendations
- 👤 **3D Avatars**: Face scan-based avatar creation with progression system

## Tech Stack

### Frontend
- **Next.js 14+** with TypeScript
- **Three.js** with React Three Fiber for 3D rendering
- **Drei** for Three.js helpers
- **Framer Motion** for animations
- **Tailwind CSS** for styling

### Backend  
- **FastAPI** with Python 3.11+
- **MongoDB** with Motor (async driver)
- **Google Calendar API** integration
- **Google Gemini AI** for recommendations
- **WebSocket** for real-time updates

### 3D Assets
- **GLTF/GLB** models for avatars and objects
- **WebGL** optimization for performance
- **Face scanning** for avatar creation

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- MongoDB
- Google Cloud Console project with Calendar API enabled

### Installation

1. **Clone and install frontend dependencies:**
```bash
npm install
```

2. **Install backend dependencies:**
```bash
pip install -r requirements.txt
```

3. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

4. **Start development servers:**

Frontend:
```bash
npm run dev
```

Backend:
```bash
uvicorn main:app --reload --port 8000
```

### Environment Variables

Create a `.env` file with:

```env
# Google APIs
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Database
MONGODB_URL=mongodb://localhost:27017/gamified_productivity

# JWT
JWT_SECRET_KEY=your_jwt_secret_key
JWT_ALGORITHM=HS256

# WebSocket
WEBSOCKET_URL=ws://localhost:8000/ws
```

## Project Structure

```
├── frontend/                 # Next.js frontend
│   ├── components/          # React components
│   │   ├── 3d/             # Three.js 3D components
│   │   ├── ui/             # UI components
│   │   └── forms/          # Form components
│   ├── pages/              # Next.js pages
│   ├── hooks/              # Custom React hooks
│   ├── store/              # Zustand state management
│   └── utils/              # Utility functions
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Core configuration
│   │   ├── models/         # Pydantic models
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   └── main.py             # FastAPI app entry point
├── assets/                  # 3D models and static assets
│   ├── models/             # GLTF/GLB 3D models
│   ├── textures/           # Texture files
│   └── animations/         # Animation files
└── docs/                   # Documentation
```

## Development

### Frontend Development
- Uses React Three Fiber for 3D rendering
- Zustand for state management
- SWR for data fetching
- Tailwind CSS for styling

### Backend Development  
- FastAPI with async/await patterns
- Motor for async MongoDB operations
- Pydantic for data validation
- Google APIs for calendar integration

### 3D Development
- Three.js for WebGL rendering
- GLTF/GLB models for complex assets
- Face scanning integration for avatars
- Performance optimization with LOD

## API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details