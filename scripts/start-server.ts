import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function killProcessOnPort(port: number): Promise<void> {
  try {
    // On Linux, we can use fuser to find and kill processes
    await execAsync(`fuser -k ${port}/tcp`);
    console.log(`Killed process on port ${port}`);
  } catch (error) {
    // If fuser fails or process doesn't exist, that's okay
    console.log(`No existing process found on port ${port}`);
  }

  // Wait a moment to ensure the port is released
  await new Promise(resolve => setTimeout(resolve, 1000));
}

async function startServer() {
  try {
    // First kill any existing process
    await killProcessOnPort(5000);

    // Start the server using tsx
    console.log('Starting server...');
    const { stdout, stderr } = await execAsync('tsx server/index.ts', {
      env: {
        ...process.env,
        PORT: '5000'
      }
    });

    console.log('Server output:', stdout);
    if (stderr) {
      console.error('Server errors:', stderr);
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
