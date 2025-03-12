import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function killProcessOnPort(port: number): Promise<void> {
  try {
    console.log(`Attempting to kill process on port ${port}...`);
    // Use npx kill-port as a more reliable cross-platform solution
    await execAsync(`npx kill-port ${port}`);
    console.log(`Successfully killed process on port ${port}`);
  } catch (error) {
    // If kill-port fails or process doesn't exist, that's okay
    console.log(`No existing process found on port ${port}`);
  }

  // Wait longer to ensure the port is fully released
  console.log('Waiting for port to be fully released...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  console.log('Proceeding with server startup...');
}

async function startServer() {
  try {
    // First kill any existing process
    await killProcessOnPort(5000);

    // Start the server using tsx
    console.log('Starting server...');
    const serverProcess = await execAsync('tsx server/index.ts', {
      env: {
        ...process.env,
        PORT: '5000'
      },
      timeout: 60000 // 60 second timeout for longer initialization
    });

    console.log('Server output:', serverProcess.stdout);
    if (serverProcess.stderr) {
      console.error('Server errors:', serverProcess.stderr);
    }
  } catch (error: any) {
    if (error.code === 'ETIMEDOUT') {
      console.error('Server startup timed out after 60 seconds');
    } else if (error.code === 'EADDRINUSE') {
      console.error('Port 5000 is still in use. Please try again or restart the environment');
    } else {
      console.error('Failed to start server:', error);
    }
    process.exit(1);
  }
}

startServer();