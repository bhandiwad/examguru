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

      // Extract all questions from sections and flatten them into a single array
      const allQuestions = generatedContent.sections.flatMap(section => 
        section.questions.map(q => ({
          ...q,
          type: section.type,
          marks: q.marks || Math.floor(section.marks / section.questions.length)
        }))
      );

      console.log("Creating exam in storage");
      const exam = await storage.createExam({
        ...validation.data,
        userId,
        questions: allQuestions
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