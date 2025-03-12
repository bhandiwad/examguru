# Database Setup Guide for ExamGuru

This guide will help you install and configure PostgreSQL for ExamGuru development.

## Installing PostgreSQL

### Windows
1. Download the PostgreSQL installer from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Run the installer
3. Choose a password for the `postgres` user when prompted
4. Keep the default port (5432)
5. Complete the installation

### macOS
Using Homebrew:
```bash
# Install Homebrew if you haven't already
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install PostgreSQL
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15
```

### Linux (Ubuntu/Debian)
```bash
# Add PostgreSQL repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Update package list
sudo apt-get update

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## Setting Up the Database

1. After installation, create a new database and user:

```bash
# Connect to PostgreSQL as postgres user
# On Windows: Use pgAdmin or SQL Shell (psql)
# On macOS/Linux:
sudo -u postgres psql

# Create a new user (replace 'youruser' and 'yourpassword')
CREATE USER youruser WITH PASSWORD 'yourpassword';

# Create the database
CREATE DATABASE examguru;

# Grant privileges to the user
GRANT ALL PRIVILEGES ON DATABASE examguru TO youruser;

# Exit psql
\q
```

2. Update your `.env` file with the database connection details:
```bash
DATABASE_URL=postgresql://youruser:yourpassword@localhost:5432/examguru
```

## Verifying the Setup

1. Test the database connection:
```bash
psql -h localhost -U youruser -d examguru
```

2. You should be prompted for your password and then see the psql prompt:
```
examguru=>
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check if PostgreSQL service is running
   - Verify port 5432 is not blocked
   - Check pg_hba.conf for connection settings

2. **Authentication Failed**
   - Double-check username and password
   - Ensure DATABASE_URL is correctly formatted
   - Check PostgreSQL logs for more details

3. **Permission Denied**
   - Ensure user has proper privileges
   - Check database owner settings
   - Verify connection settings in pg_hba.conf

### PostgreSQL Service Commands

```bash
# Windows (Run as Administrator)
net start postgresql
net stop postgresql

# macOS
brew services start postgresql
brew services stop postgresql
brew services restart postgresql

# Linux
sudo systemctl start postgresql
sudo systemctl stop postgresql
sudo systemctl restart postgresql
sudo systemctl status postgresql
```

## Next Steps

After setting up the database:

1. Initialize the database schema:
```bash
npm run db:push
```

2. Start the ExamGuru application:
```bash
npm run dev
```

For more information, check the [PostgreSQL Documentation](https://www.postgresql.org/docs/).
