# ExamGuru - AI-Powered Exam Generation Platform

ExamGuru is an intelligent, AI-powered exam generation and personalized learning platform that adapts to student needs across multiple educational levels and curricula.

## Features

### Core Features
- 🎯 **Intelligent Exam Generation**: AI-driven exam creation supporting multiple difficulty levels
- 🎓 **Multi-Board Support**: Compatible with ICSE, CBSE, State Boards, and competitive exams (JEE, NEET, etc.)
- 📊 **Performance Analytics**: Advanced tracking and personalized learning insights
- 🤖 **AI Tutor**: Conversational learning companion with dynamic, subject-agnostic interface
- 📝 **Custom Templates**: Flexible question paper templates for different formats
- 🏆 **Achievement System**: Gamified learning with badges and rewards

### AI Features
- **Multi-Provider LLM Support**: Flexible integration with various LLM providers
- **Configurable System Prompts**: Customize AI behavior through configuration files
- **Context-Aware Responses**: Tailored AI responses for different educational contexts
- **Real-time Chat Interface**: Interactive AI tutoring with subject-specific knowledge

### Educational Features
- **Curriculum-Specific Content**: Support for multiple education boards and competitive exams
- **Smart Question Generation**: AI-powered question creation based on difficulty and topics
- **Performance Tracking**: Detailed analytics and progress monitoring
- **Personalized Learning**: Adaptive content based on student performance

## Tech Stack

- **Frontend**: Next.js, React, TailwindCSS, shadcn/ui
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: Modular LLM provider system
- **Authentication**: Firebase Authentication

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL
- LLM Provider API key (OpenAI, or other supported providers)
- Firebase project credentials (for authentication)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/examguru

# LLM Provider
LLM_PROVIDER=openai  # or other provider name
LLM_API_KEY=your_api_key
LLM_MODEL_NAME=your_model_name  # Optional, defaults to provider's default

# Firebase (Authentication)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

## LLM Provider Configuration

### Provider Setup

The system supports multiple LLM providers through a modular architecture. Configure providers in `config/llm/<provider>.json`:

```json
{
  "modelName": "gpt-4",
  "apiEndpoint": "https://api.openai.com/v1",
  "options": {
    "temperature": 0.7,
    "maxTokens": 2000
  },
  "systemPrompts": {
    "default": "You are a helpful AI assistant.",
    "questionGeneration": "You are an expert exam question generator...",
    "evaluation": "You are an assessment expert...",
    "tutoring": "You are a patient and knowledgeable tutor...",
    "analysis": "You are a performance analysis expert...",
    "custom": {
      "customContext1": "Custom prompt for specific use case...",
      "customContext2": "Another custom prompt..."
    }
  }
}
```

### Adding New Providers

1. Create a provider implementation in `server/llm/providers/<provider>.ts`
2. Add provider configuration in `config/llm/<provider>.json`
3. Register the provider in `server/llm/factory.ts`

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/examguru.git
cd examguru
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npm run db:push
```

4. Configure your LLM provider:
- Copy `config/llm/provider.example.json` to `config/llm/<your-provider>.json`
- Update the configuration with your provider's settings

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`.

## Project Structure

```
├── client/               # Frontend React application
│   ├── src/
│   │   ├── components/  # Reusable React components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utility functions and API clients
│   │   └── pages/       # Application pages
├── config/              # Configuration files
│   └── llm/            # LLM provider configurations
├── server/              # Backend Express application
│   ├── llm/            # LLM integration
│   │   ├── providers/  # Provider implementations
│   │   ├── factory.ts  # Provider factory
│   │   └── types.ts    # Common types
│   ├── routes.ts       # API routes
│   └── storage.ts      # Database operations
└── shared/             # Shared types and constants
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:push` - Push database schema changes
- `npm run db:studio` - Open Drizzle Studio

## Contributing

Pull requests are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and development process.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.