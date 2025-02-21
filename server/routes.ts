import type { Express } from "express";
import { createServer } from "http";
import multer from "multer";
import { storage } from "./storage";
import { generateQuestions, evaluateAnswers } from "./openai";
import { insertExamSchema, insertAttemptSchema } from "@shared/schema";

// Configure multer for handling file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export async function registerRoutes(app: Express) {
  app.post("/api/exams", async (req, res) => {
    try {
      console.log("Received exam creation request:", req.body);

      const validation = insertExamSchema.safeParse(req.body);
      if (!validation.success) {
        console.error("Validation failed:", validation.error.errors);
        return res.status(400).json({ 
          message: "Invalid exam data",
          errors: validation.error.errors 
        });
      }

      // TODO: Add proper authentication middleware
      const userId = 1; // Temporary for testing

      console.log("Generating questions with validated data:", validation.data);
      const generatedContent = await generateQuestions(
        validation.data.subject,
        validation.data.curriculum,
        validation.data.difficulty,
        validation.data.format
      );

      if (!generatedContent.questions || !Array.isArray(generatedContent.questions)) {
        throw new Error("Invalid response from question generator");
      }

      console.log("Creating exam in storage");
      const exam = await storage.createExam({
        ...validation.data,
        userId,
        questions: generatedContent.questions
      });

      console.log("Exam created successfully:", exam);
      res.json(exam);
    } catch (error: any) {
      console.error("Error creating exam:", error);
      res.status(500).json({ 
        message: "Failed to create exam",
        error: error.message 
      });
    }
  });

  app.get("/api/exams", async (req, res) => {
    try {
      // TODO: Add proper authentication middleware
      const userId = 1; // Temporary for testing
      const exams = await storage.getUserExams(userId);
      res.json(exams);
    } catch (error: any) {
      console.error("Error fetching exams:", error);
      res.status(500).json({
        message: "Failed to fetch exams",
        error: error.message
      });
    }
  });

  app.get("/api/exams/:id", async (req, res) => {
    try {
      const examId = parseInt(req.params.id);
      if (isNaN(examId)) {
        return res.status(400).json({ message: "Invalid exam ID" });
      }

      const exam = await storage.getExam(examId);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }

      res.json(exam);
    } catch (error: any) {
      console.error("Error fetching exam:", error);
      res.status(500).json({
        message: "Failed to fetch exam",
        error: error.message
      });
    }
  });

  app.get("/api/attempts", async (req, res) => {
    try {
      // TODO: Add proper authentication middleware
      const userId = 1; // Temporary for testing
      const attempts = await storage.getAttempts(userId);
      res.json(attempts);
    } catch (error: any) {
      console.error("Error fetching attempts:", error);
      res.status(500).json({
        message: "Failed to fetch attempts",
        error: error.message
      });
    }
  });

  app.post("/api/attempts/upload", upload.single("answer"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const examId = parseInt(req.body.examId);
      const userId = parseInt(req.body.userId);
      const startTime = new Date(req.body.startTime);

      if (isNaN(examId) || isNaN(userId)) {
        return res.status(400).json({ message: "Invalid exam ID or user ID" });
      }

      // Get the exam to evaluate against
      const exam = await storage.getExam(examId);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }

      // Process image and evaluate answers
      const imageBuffer = req.file.buffer;
      const result = await evaluateAnswers(imageBuffer.toString('base64'), exam.questions);

      const attempt = await storage.createAttempt({
        examId,
        userId,
        startTime,
        endTime: new Date(),
        answerImageUrl: "data:image/jpeg;base64," + imageBuffer.toString('base64'),
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