# ExamGuru - AI-Powered Exam Generation Platform

ExamGuru is an intelligent, AI-powered exam generation and personalized learning platform that adapts to student needs across multiple educational levels and curricula.

## Features

- 🎯 **Intelligent Exam Generation**: AI-driven exam creation supporting multiple difficulty levels
- 🎓 **Multi-Board Support**: Compatible with ICSE, CBSE, State Boards, and competitive exams
- 📊 **Performance Analytics**: Advanced tracking and personalized learning insights
- 🤖 **AI Tutor**: Conversational learning companion with dynamic, subject-agnostic interface
- 📝 **Custom Templates**: Flexible question paper templates for different formats
- 🏆 **Achievement System**: Gamified learning with badges and rewards

## Tech Stack

- **Frontend**: Next.js, React, TailwindCSS, shadcn/ui
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: OpenAI API
- **Authentication**: Session-based auth

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL
- OpenAI API key

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/examguru

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Session
SESSION_SECRET=your_session_secret
```

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

4. Start the development server:
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
│   └── public/          # Static assets
├── server/              # Backend Express application
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Database operations
│   └── openai.ts        # OpenAI integration
└── shared/              # Shared types and constants
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
