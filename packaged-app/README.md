# AudioLabStudio - Professional AI-Powered Audio Mixing & Mastering

A cutting-edge web application that leverages OpenAI's GPT-4 to provide professional audio mixing and mastering capabilities through natural language instructions.

## 🎵 Features

- **AI-Powered Mixing**: Describe your vision in plain English and get professional results
- **Multi-Track Support**: Upload and mix multiple audio stems (drums, bass, vocals, etc.)
- **Reference Track Matching**: AI analyzes professional tracks to match commercial standards
- **Real-Time Processing**: Live progress tracking during AI mixing operations
- **Professional Mastering**: Industry-standard loudness targeting (-14 LUFS)
- **Collaborative Tools**: Comments, feedback, and project sharing
- **Advanced Analytics**: Comprehensive spectral and musical analysis

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (https://nodejs.org)
- **PostgreSQL** 12+ (https://postgresql.org)
- **FFmpeg** (https://ffmpeg.org)
- **OpenAI API Key** (https://platform.openai.com)

### Installation

1. **Extract the application** to your desired location
2. **Run setup**:
   ```bash
   # On macOS/Linux
   ./setup.sh
   
   # On Windows
   setup.bat
   ```
3. **Configure environment**:
   ```bash
   # Create .env file
   cp .env.example .env
   
   # Edit .env with your settings
   OPENAI_API_KEY=your-openai-api-key-here
   DATABASE_URL=postgresql://localhost:5432/audiolabstudio
   ```
4. **Start the application**:
   ```bash
   # On macOS/Linux
   ./start.js
   
   # On Windows
   start.bat
   ```

The application will be available at http://localhost:5000

## 🎛️ Usage Guide

### Creating Your First Project

1. **New Project**: Click "New Project" and enter details (name, genre, BPM, key)
2. **Upload Stems**: Add individual audio tracks using the "Upload Stem" button
3. **Add Reference** (optional): Upload a professional track for style matching
4. **AI Mixing**: Click "Start AI Mix" and describe your vision in natural language

### Example AI Prompts

- *"Create a modern pop mix with punchy drums and warm vocals"*
- *"Make this sound like a Calvin Harris track with wide stereo image"*
- *"Apply vintage analog warmth with subtle compression"*
- *"Professional master for streaming platforms"*

### Supported Audio Formats

- **Input**: WAV, MP3, FLAC, AIFF, M4A
- **Output**: WAV (24-bit/44.1kHz)
- **File Size**: Up to 100MB per file

## 🔧 Configuration

### Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-your-openai-api-key
DATABASE_URL=postgresql://user:pass@host:port/database

# Optional
NODE_ENV=production
PORT=5000
LOG_LEVEL=info
```

### Database Setup

The application automatically creates the database schema on first run. For manual setup:

```bash
# Create database
createdb audiolabstudio

# Run schema
psql audiolabstudio < server/database/setup.sql
```

## 📱 Mobile Support

The application is fully responsive and optimized for:
- **Tablets**: Full functionality with touch-optimized controls
- **Phones**: Essential mixing controls and monitoring
- **Desktop**: Complete professional interface

## 🎨 Architecture

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Radix UI** components
- **TanStack Query** for state management
- **Framer Motion** animations

### Backend
- **Node.js** with Express
- **PostgreSQL** with Drizzle ORM
- **FFmpeg** for audio processing
- **OpenAI GPT-4** integration

### Audio Processing
- **Real-time analysis**: Spectral, harmonic, and perceptual analysis
- **Professional mixing**: EQ, compression, reverb, mastering
- **Format conversion**: Automatic WAV conversion for processing
- **Waveform generation**: Visual feedback for all audio

## 🔒 Security & Privacy

- **Local Processing**: All audio processing happens on your server
- **Secure Storage**: Audio files stored locally, not in the cloud
- **API Security**: OpenAI calls only send analysis metadata, not audio
- **Data Privacy**: No user data collected or transmitted

## 🐛 Troubleshooting

### Common Issues

**"FFmpeg not found"**
```bash
# macOS (with Homebrew)
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Windows (with Chocolatey)
choco install ffmpeg
```

**"Database connection failed"**
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env file
- Verify database exists and permissions

**"OpenAI API error"**
- Check your API key is valid
- Ensure you have sufficient credits
- Verify internet connection

### Performance Tips

- **RAM**: 8GB+ recommended for large projects
- **Storage**: SSD recommended for audio processing
- **CPU**: Multi-core processor for faster processing
- **Network**: Stable connection for AI processing

## 📈 System Requirements

### Minimum
- **CPU**: 2-core processor
- **RAM**: 4GB
- **Storage**: 2GB free space
- **OS**: macOS 10.15+, Windows 10+, Linux

### Recommended
- **CPU**: 4+ core processor
- **RAM**: 8GB+
- **Storage**: 10GB+ SSD
- **OS**: Latest versions

## 🔄 Updates

The application checks for updates automatically. To manually update:

1. Download the latest version
2. Stop the current application
3. Replace files (keep your .env and database)
4. Run setup.sh/setup.bat
5. Restart the application

## 🤝 Support

For technical support or feature requests:
- Check the troubleshooting section above
- Review system requirements
- Ensure all dependencies are installed

## 📄 License

This project is licensed under the MIT License.

---

**AudioLabStudio** - Professional audio production powered by AI
