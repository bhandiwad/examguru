import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeLLM } from "./llm/factory";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enhanced logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Initialize LLM system before setting up routes
    console.log("Initializing LLM system...");
    await initializeLLM();
    console.log("LLM system initialized successfully");

    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("Application error:", err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Always bind to port 5000 for Replit compatibility
    const port = 5000;
    await new Promise<void>((resolve, reject) => {
      const startTimeout = setTimeout(() => {
        reject(new Error("Server startup timed out after 30 seconds"));
      }, 30000);

      server.listen({
        port,
        host: "0.0.0.0",
      })
      .once('error', (err) => {
        clearTimeout(startTimeout);
        reject(err);
      })
      .once('listening', () => {
        clearTimeout(startTimeout);
        console.log(`Server started successfully on port ${port}`);
        log(`serving on port ${port}`);
        resolve();
      });
    });

  } catch (error) {
    console.error("Failed to initialize server:", error);
    process.exit(1);
  }
})();