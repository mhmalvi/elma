# ELMA - Islamic AI Companion for Authentic Guidance from Quran and Hadith

## About ELMA

ELMA is an Islamic AI assistant that provides authentic guidance from the Quran and Hadith. The platform offers voice-enabled interactions and multilingual support to help users with Islamic teachings, spiritual guidance, and religious questions.

## Features

- 🎤 **Voice-First Interaction** - Natural speech recognition and text-to-speech
- 📚 **Authentic Islamic Sources** - All answers backed by verified Quran and Hadith references  
- 🌍 **Multilingual Support** - Available in English, Arabic, Bengali, Hindi, and Urdu
- 💾 **Offline Functionality** - Continue conversations without internet
- 🔐 **Privacy-Focused** - No sensitive voice or text data logged
- 📱 **Progressive Web App** - Install on mobile and desktop
- 🔍 **Content Filtering** - Age-appropriate and contextually relevant responses

## Technology Stack

This project is built with:

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Voice**: Web Speech API + OpenAI Whisper + ElevenLabs TTS
- **AI**: OpenRouter (Anthropic Claude) + OpenAI Embeddings
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Search**: Qdrant Vector Database
- **Build**: Vite
- **Testing**: Vitest + React Testing Library

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Supabase CLI
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd elma

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Configure your API keys in .env.local

# Start Supabase locally (optional for local development)
supabase start

# Start development server
npm run dev
```

### Environment Variables

Create a `.env.local` file with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_key
OPENROUTER_API_KEY=your_openrouter_key
ELEVENLABS_API_KEY=your_elevenlabs_key
QDRANT_API_KEY=your_qdrant_key
QDRANT_ENDPOINT=your_qdrant_endpoint
```

## Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Code Quality
npm run lint         # Lint code
npm run type-check   # Check TypeScript types
```

## Project Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── chat/           # Chat interface components
│   ├── voice/          # Voice interaction components
│   └── ui/             # Reusable UI components
├── hooks/              # Custom React hooks
├── contexts/           # React contexts
├── lib/                # Utility functions
├── pages/              # Page components
├── types/              # TypeScript type definitions
└── i18n/               # Internationalization

supabase/
├── functions/          # Edge Functions
└── migrations/         # Database migrations
```

## Voice Features

ELMA supports advanced voice interaction:

- **Real-time STT**: Convert speech to text using browser APIs and OpenAI Whisper
- **Neural TTS**: Generate natural speech using ElevenLabs and browser synthesis
- **Voice Commands**: Control the application with voice commands
- **Multi-language**: Voice support for Arabic, English, Bengali, Hindi, and Urdu

## Islamic Content Integration

- **Quran Integration**: Verse lookup and contextual references
- **Hadith Database**: Sahih Bukhari, Muslim, and other authentic collections  
- **Semantic Search**: AI-powered search across Islamic texts
- **Source Verification**: All responses include authentic source citations

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit with descriptive messages
5. Push to your fork and submit a pull request

## Security

- Input validation on all API endpoints
- CORS restrictions for production domains
- Rate limiting on voice and chat APIs
- Privacy-safe logging (no sensitive data)
- Secure authentication with Supabase Auth

## License

This project is private and proprietary. All rights reserved.

## Support

For support and questions, please refer to the in-app help section or contact the development team.