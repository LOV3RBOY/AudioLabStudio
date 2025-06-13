# 🎵 AudioLabStudio

**Professional AI-Powered Audio Production Platform**

A cutting-edge audio production studio featuring AI-powered mixing, multi-track processing, and a stunning professional dark theme interface.

![AudioLabStudio](https://img.shields.io/badge/Version-1.0.0-purple?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.3.1-61dafb?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-3178c6?style=for-the-badge&logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js)

## ✨ Features

### 🎨 **Stunning Professional UI**
- **Pure black theme** (#0a0a0a) with crisp white text
- **Glassmorphism effects** with backdrop blur and transparency
- **Modern purple/cyan accents** with neon highlights
- **Smooth animations** and hover effects throughout
- **Professional typography** using Inter font

### 🤖 **AI-Powered Audio Processing**
- **OpenAI integration** for intelligent mixing suggestions
- **Natural language prompts** for mixing instructions
- **Automated stem separation** and processing
- **Professional mastering** with target loudness settings

### 🎛️ **Professional Audio Tools**
- **Multi-track stem management** with individual controls
- **Real-time transport controls** (play, pause, stop, skip)
- **Audio visualization** with waveforms and level meters
- **Volume, pan, mute, and solo** controls for each stem
- **FFmpeg integration** for professional audio processing

### 🗄️ **Advanced Data Management**
- **PostgreSQL database** with automated migrations
- **Project management** with metadata and settings
- **Audio file upload** supporting multiple formats
- **Real-time progress tracking** for AI processing jobs

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ 
- **PostgreSQL** 14+
- **FFmpeg** (for audio processing)
- **OpenAI API key**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/LOV3RBOY/AudioLabStudio.git
   cd AudioLabStudio
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment**
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   ```

4. **Setup database**
   ```bash
   # Start PostgreSQL service
   brew services start postgresql@14  # macOS
   
   # Create database
   createdb audiolabstudio
   
   # Run migrations
   npm run db:setup
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   ```
   http://localhost:5000
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# OpenAI Configuration (REQUIRED)
OPENAI_API_KEY=your-openai-api-key-here

# Database Configuration
DATABASE_URL=postgresql://localhost:5432/audiolabstudio

# Server Configuration
NODE_ENV=development
PORT=5000

# File Storage
UPLOAD_DIR=uploads
DOWNLOAD_DIR=downloads

# Audio Processing
FFMPEG_PATH=ffmpeg
FFPROBE_PATH=ffprobe
```

### Database Setup

The application uses PostgreSQL with automated schema migrations. The database setup script will create all necessary tables and relationships.

## 🎵 Usage

### Creating a Project
1. Click **"New Project"** in the header
2. Fill in project details (name, genre, BPM, key signature)
3. Click **"Create Project"**

### Uploading Audio Stems
1. Select a project
2. Click **"Upload Stem"** 
3. Choose audio file (WAV, MP3, FLAC, AIFF supported)
4. Set stem name and type
5. Click **"Upload Stem"**

### AI-Powered Mixing
1. Upload multiple stems to a project
2. Click **"AI Mix"** 
3. Describe your mixing vision in natural language
4. Choose mixing style and target loudness
5. Click **"Start AI Mix"**
6. Monitor real-time progress

### Manual Mixing Controls
- **Volume sliders** for each stem
- **Mute/Solo buttons** for isolation
- **Master volume control**
- **Transport controls** for playback

## 🏗️ Technical Architecture

### Frontend (React + TypeScript)
- **React 18.3.1** with TypeScript for type safety
- **Vite** for fast development and building
- **TanStack Query** for efficient data fetching
- **Tailwind CSS** for responsive styling
- **Lucide React** for professional icons

### Backend (Node.js + Express)
- **Express.js** server with TypeScript
- **PostgreSQL** with Drizzle ORM
- **Multer** for file upload handling
- **WebSocket** support for real-time updates
- **FFmpeg** integration for audio processing

### AI Integration
- **OpenAI API** for intelligent mixing
- **Natural language processing** for mixing prompts
- **Real-time progress tracking** for AI jobs
- **Professional audio analysis** and recommendations

## 📁 Project Structure

```
AudioLabStudio/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility libraries
│   │   └── styles/         # CSS and styling
├── server/                 # Node.js backend
│   ├── database/           # Database schemas and migrations
│   ├── routes/             # API route handlers
│   ├── services/           # Business logic services
│   ├── ai/                 # AI integration modules
│   └── utils/              # Server utilities
├── shared/                 # Shared types and schemas
└── scripts/                # Build and setup scripts
```

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:client` - Build frontend only
- `npm run db:setup` - Setup database schema
- `npm test` - Run tests
- `npm run lint` - Run ESLint

### Code Style
- **TypeScript** for type safety
- **ESLint** and **Prettier** for code formatting
- **Conventional commits** for clear git history

## 🔒 Security

- Environment variables for sensitive data
- Input validation and sanitization
- CORS configuration for production
- Database query parameterization
- File upload restrictions and validation

## 📄 License

This project is private and proprietary.

## 🤝 Contributing

This is a private repository. Contact the owner for contribution guidelines.

## 🐛 Issues & Support

For issues and support, please contact the repository owner.

---

**Built with ❤️ using modern web technologies and AI**