import type { Express } from "express";
import { createServer } from "http";
import multer from "multer";
import { storage } from "./storage";
import { generateQuestions, evaluateAnswers } from "./openai";
import { insertExamSchema, insertAttemptSchema } from "@shared/schema";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export async function registerRoutes(app: Express) {
  app.post("/api/exams", async (req, res) => {
    try {
      const validation = insertExamSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid exam data",
          errors: validation.error.errors 
        });
      }

      // TODO: Add proper authentication middleware
      const userId = 1; // Temporary for testing

      const questions = await generateQuestions(
        validation.data.subject,
        validation.data.curriculum,
        validation.data.difficulty,
        validation.data.format
      );

      const exam = await storage.createExam({
        ...validation.data,
        userId,
        questions: questions.questions
      });

      res.json(exam);
    } catch (error: any) {
      console.error("Error creating exam:", error);
      res.status(500).json({ 
        message: "Failed to create exam",
        error: error.message 
      });
    }
  });

  app.get("/api/exams/current", async (req, res) => {
    // TODO: Add proper authentication middleware
    const userId = 1; // Temporary for testing
    const exam = await storage.getCurrentExam(userId);
    res.json(exam);
  });

  app.get("/api/attempts", async (req, res) => {
    // TODO: Add proper authentication middleware
    const userId = 1; // Temporary for testing
    const attempts = await storage.getAttempts(userId);
    res.json(attempts);
  });

  app.post("/api/attempts/upload", upload.single("answer"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const validation = insertAttemptSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid attempt data" });
      }

      // Process image and evaluate
      const imageBuffer = req.file.buffer;
      const result = await evaluateAnswers(imageBuffer.toString('base64'), validation.data);

      const attempt = await storage.createAttempt({
        ...validation.data,
        score: result.score,
        feedback: result.feedback
      });

      res.json(attempt);
    } catch (error: any) {
      console.error("Error uploading attempt:", error);
      res.status(500).json({ 
        message: "Failed to process attempt",
        error: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}