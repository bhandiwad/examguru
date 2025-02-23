# Deployment Guide for ExamGuru

This guide provides instructions for deploying ExamGuru to various platforms.

## Prerequisites

Before deploying, ensure you have:
1. Node.js 20 or higher installed
2. PostgreSQL database instance
3. OpenAI API key
4. All environment variables configured

## Environment Variables

Create a `.env` file with the following variables:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/examguru

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Session (Generate a secure random string)
SESSION_SECRET=your_session_secret
```

## Deployment Options

### 1. Deploy to Replit

1. Fork the repository on Replit
2. Configure environment variables in Replit's Secrets tab
3. Click "Run" to start the application

### 2. Deploy to Railway

1. Create a new project on Railway
2. Connect your GitHub repository
3. Add environment variables in Railway's dashboard
4. Railway will automatically deploy your application

### 3. Deploy to Vercel

1. Import your GitHub repository to Vercel
2. Configure environment variables in Vercel's dashboard
3. Ensure the build command is set to `npm run build`
4. Set the output directory to `dist`

### 4. Manual Deployment

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/examguru.git
   cd examguru
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the application:
   ```bash
   npm run build
   ```

4. Start the production server:
   ```bash
   npm start
   ```

## Database Migration

Before deploying, ensure your database schema is up to date:
```bash
npm run db:push
```

## Monitoring and Maintenance

- Monitor application logs through your deployment platform
- Set up error tracking (e.g., Sentry)
- Configure database backups
- Regularly update dependencies

## Troubleshooting

Common issues and solutions:

1. Database Connection Issues
   - Verify DATABASE_URL format
   - Check database credentials
   - Ensure database is accessible from deployment environment

2. Build Failures
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Review build logs for specific errors

3. Runtime Errors
   - Verify all environment variables are set
   - Check application logs
   - Ensure database migrations are applied

## Support

For deployment issues:
1. Check the [troubleshooting guide](#troubleshooting)
2. Review [GitHub Issues](https://github.com/yourusername/examguru/issues)
3. Open a new issue if needed
