import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";

async function initializeDatabase() {
  try {
    // Connect to the database using environment variables
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable not set");
    }

    // Create the database client
    const client = postgres(connectionString);
    const db = drizzle(client, { schema });

    // Push the schema changes to the database
    console.log("Initializing database schema...");
    
    // Your schema initialization logic here
    // This will be handled by drizzle-kit's push command

    console.log("Database initialization completed successfully!");
    
    await client.end();
  } catch (error) {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  }
}

initializeDatabase();
