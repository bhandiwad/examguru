import type { Express } from "express";
import { createServer } from "http";
import multer from "multer";
import { storage } from "./storage";
import { generateQuestions, evaluateAnswers } from "./openai";
import { insertExamSchema, insertAttemptSchema, insertQuestionTemplateSchema } from "@shared/schema";

// Configure multer for handling file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export async function registerRoutes(app: Express) {
  // Template management routes
  app.get("/api/templates/search", async (req, res) => {
    try {
      const { curriculum, subject, grade, institution, paperFormat } = req.query;

      console.log("Template search request with params:", {
        curriculum,
        subject,
        grade,
        institution,
        paperFormat
      });

      const templates = await storage.getTemplates({
        curriculum: curriculum as string,
        subject: subject as string,
        grade: grade as string,
        institution: institution as string,
        paperFormat: paperFormat as string
      });

      console.log("Found templates:", templates);
      res.json(templates);
    } catch (error: any) {
      console.error("Error searching templates:", error);
      res.status(500).json({
        message: "Failed to search templates",
        error: error.message
      });
    }
  });

  app.get("/api/templates/:id", async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      if (isNaN(templateId)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }

      const template = await storage.getTemplateById(templateId);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      res.json(template);
    } catch (error: any) {
      console.error("Error fetching template:", error);
      res.status(500).json({
        message: "Failed to fetch template",
        error: error.message
      });
    }
  });

  app.post("/api/templates", async (req, res) => {
    try {
      const validation = insertQuestionTemplateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid template data",
          errors: validation.error.errors
        });
      }

      const template = await storage.createTemplate(validation.data);
      res.json(template);
    } catch (error: any) {
      console.error("Error creating template:", error);
      res.status(500).json({
        message: "Failed to create template",
        error: error.message
      });
    }
  });

  // Modified exam creation to use custom templates
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

      // Get relevant templates
      const templates = await storage.getTemplates({
        curriculum: validation.data.curriculum,
        subject: validation.data.subject,
        grade: validation.data.grade
      });

      console.log("Found templates:", templates.length);

      // Get selected custom template if specified
      let selectedTemplate;
      if (validation.data.templateId) {
        selectedTemplate = await storage.getTemplateById(validation.data.templateId);
        if (!selectedTemplate) {
          return res.status(404).json({ message: "Selected template not found" });
        }
      }

      console.log("Generating questions with validated data:", validation.data);
      const generatedContent = await generateQuestions(
        validation.data.subject,
        validation.data.curriculum,
        validation.data.grade,
        validation.data.difficulty,
        validation.data.format,
        templates,
        selectedTemplate
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

      const exam = await storage.getExam(examId);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }

      // Evaluate answers using the image directly
      const evaluation = await evaluateAnswers(req.file.buffer.toString('base64'), exam.questions);

      const attempt = await storage.createAttempt({
        examId,
        userId,
        startTime,
        endTime: new Date(),
        answerImageUrl: "data:image/jpeg;base64," + req.file.buffer.toString('base64'),
        score: evaluation.score,
        feedback: evaluation.feedback
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