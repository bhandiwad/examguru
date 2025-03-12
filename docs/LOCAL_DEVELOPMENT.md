# Local Development Guide for ExamGuru

This guide provides detailed instructions for setting up and running ExamGuru in a local development environment.

## Prerequisites

1. **Node.js**
   - Version 20 or higher required
   - Download from [nodejs.org](https://nodejs.org)
   - Verify installation: `node --version`

2. **Git**
   - Required for version control
   - Download from [git-scm.com](https://git-scm.com/)

Note: PostgreSQL is automatically installed and configured as part of the setup process.

## Installation Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/bhandiwad/examguru.git
   cd examguru
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory with the following variables:
   ```env
   # Database configuration is automatically handled
   # Just verify these environment variables are set:
   DATABASE_URL=<automatically-set>
   PGPORT=<automatically-set>
   PGUSER=<automatically-set>
   PGPASSWORD=<automatically-set>
   PGDATABASE=<automatically-set>
   PGHOST=<automatically-set>

   # OpenAI
   OPENAI_API_KEY=your_openai_api_key

   # Firebase
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id
   ```

4. **Database Setup**
   ```bash
   # Initialize/update the database schema
   npm run db:push
   ```
   The database is automatically created and configured for you.

5. **Start Development Server**
   ```bash
   npm run dev
   ```

   The application will be available at http://localhost:5000

## Troubleshooting

### Database Connection Issues
1. The database is automatically installed and configured
2. Verify environment variables are set correctly
3. If needed, check the logs: `npm run dev`
4. Database port (5432) should be automatically configured

### Build Errors
1. Clear npm cache: `npm cache clean --force`
2. Delete node_modules: `rm -rf node_modules`
3. Reinstall dependencies: `npm install`

### Runtime Errors
1. Check console for error messages
2. Verify all environment variables are set
3. Ensure database migrations are applied
4. Check port 5000 is available

## Development Workflow

1. **Making Changes**
   - Create a new branch for features
   - Follow the coding style guide
   - Write tests for new features

2. **Testing**
   ```bash
   # Run tests
   npm test

   # Run linter
   npm run lint
   ```

3. **Building for Production**
   ```bash
   npm run build
   ```

## Common Tasks

### Updating Dependencies
```bash
# Update all dependencies
npm update

# Update a specific package
npm update package-name
```

### Database Management
```bash
# Reset database (development only)
npm run db:reset

# Generate new migration
npm run db:generate

# Apply migrations
npm run db:push
```

### Running Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test -- path/to/test

# Run tests in watch mode
npm test -- --watch
```

## Additional Resources

- [Project Documentation](../README.md)
- [Contributing Guidelines](../CONTRIBUTING.md)
- [Deployment Guide](../DEPLOYMENT.md)
- [API Documentation](./API.md)

## Support

For issues or questions:
1. Check the [troubleshooting guide](#troubleshooting)
2. Review [GitHub Issues](https://github.com/bhandiwad/examguru/issues)
3. Create a new issue if needed