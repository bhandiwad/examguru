import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  firebaseId: text("firebase_id").notNull().unique()
});

export const questionTemplates = pgTable("question_templates", {
  id: serial("id").primaryKey(),
  curriculum: text("curriculum").notNull(),
  subject: text("subject").notNull(),
  grade: text("grade").notNull(),
  type: text("type").notNull(), 
  institution: text("institution"),
  paperFormat: text("paper_format"),
  template: jsonb("template").notNull(),
  sampleQuestions: jsonb("sample_questions"),
  formatMetadata: jsonb("format_metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const exams = pgTable("exams", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  curriculum: text("curriculum").notNull(),
  subject: text("subject").notNull(),
  grade: text("grade").notNull(), 
  difficulty: text("difficulty").notNull(),
  format: jsonb("format").notNull(),
  questions: jsonb("questions").notNull(),
  templateId: integer("template_id"), 
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const attempts = pgTable("attempts", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull(),
  userId: integer("user_id").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  answerImageUrl: text("answer_image_url"),
  score: integer("score"),
  feedback: jsonb("feedback")
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // e.g., "EXAM_SCORE", "STREAK", "SUBJECT_MASTERY"
  requirement: jsonb("requirement").notNull(), // e.g., { "score": 90, "examCount": 5 }
  badgeIcon: text("badge_icon").notNull(), // SVG string for the badge
  points: integer("points").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  achievementId: integer("achievement_id").notNull(),
  earnedAt: timestamp("earned_at").notNull().defaultNow(),
  progress: jsonb("progress").notNull(), // Track progress towards achievement
});

export const insertQuestionTemplateSchema = z.object({
  curriculum: z.string().min(1, "Curriculum is required"),
  subject: z.string().min(1, "Subject is required"),
  grade: z.string().min(1, "Grade is required"),
  type: z.string().min(1, "Question type is required"),
  institution: z.string().optional(),
  paperFormat: z.string().optional(),
  template: z.object({
    structure: z.string(),
    marks: z.number(),
    rubric: z.string(),
    examples: z.array(z.string())
  }),
  sampleQuestions: z.array(z.any()).optional(),
  formatMetadata: z.object({
    sections: z.array(z.object({
      name: z.string(),
      questionCount: z.number(),
      marksPerQuestion: z.number(),
      questionType: z.string(),
      format: z.string()
    })).optional(),
    totalMarks: z.number().optional(),
    duration: z.number().optional(),
    specialInstructions: z.array(z.string()).optional()
  }).optional()
});

export const insertExamSchema = z.object({
  curriculum: z.string().min(1, "Curriculum is required"),
  subject: z.string().min(1, "Subject is required"),
  grade: z.string().min(1, "Grade is required"),
  difficulty: z.string().min(1, "Difficulty is required"),
  format: z.object({
    totalMarks: z.number(),
    sections: z.array(z.object({
      type: z.string(),
      marks: z.number()
    }))
  }),
  templateId: z.number().optional()
});

// Define the feedback structure for the advanced AI evaluation system
const evaluationFeedbackSchema = z.object({
  overall: z.object({
    summary: z.string(),
    strengths: z.array(z.string()),
    areas_for_improvement: z.array(z.string()),
    learning_recommendations: z.array(z.string())
  }),
  perQuestion: z.array(z.object({
    questionNumber: z.number(),
    score: z.number(),
    conceptualUnderstanding: z.object({
      level: z.enum(["Excellent", "Good", "Fair", "Needs Improvement"]),
      details: z.string()
    }),
    technicalAccuracy: z.object({
      score: z.number(),
      details: z.string()
    }),
    keyConceptsCovered: z.array(z.string()),
    misconceptions: z.array(z.string()),
    improvementAreas: z.array(z.string()),
    exemplarAnswer: z.string()
  })),
  performanceAnalytics: z.object({
    conceptualStrengths: z.array(z.string()),
    technicalStrengths: z.array(z.string()),
    learningPatterns: z.array(z.string()),
    recommendedTopics: z.array(z.string()),
    difficultyAnalysis: z.object({
      easy: z.number(),
      medium: z.number(),
      hard: z.number()
    })
  })
});

export const insertAttemptSchema = z.object({
  examId: z.number().int().min(1, "Exam ID is required"),
  userId: z.number().int().min(1, "User ID is required"),
  startTime: z.date(),
  endTime: z.date().optional(),
  answerImageUrl: z.string().optional(),
  score: z.number().int().optional(),
  feedback: evaluationFeedbackSchema.optional()
});

export const achievementSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  type: z.enum(["EXAM_SCORE", "STREAK", "SUBJECT_MASTERY", "TEMPLATE_CREATION"]),
  requirement: z.object({
    score: z.number().optional(),
    examCount: z.number().optional(),
    streakDays: z.number().optional(),
    templateCount: z.number().optional(),
    subjectMasteryLevel: z.number().optional()
  }),
  badgeIcon: z.string().min(1, "Badge icon is required"),
  points: z.number().min(0, "Points must be positive")
});

export const userAchievementSchema = z.object({
  userId: z.number().int().min(1, "User ID is required"),
  achievementId: z.number().int().min(1, "Achievement ID is required"),
  progress: z.record(z.string(), z.number())
});

// Export types
export type User = typeof users.$inferSelect;
export type Exam = typeof exams.$inferSelect;
export type Attempt = typeof attempts.$inferSelect;
export type QuestionTemplate = typeof questionTemplates.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type InsertExam = z.infer<typeof insertExamSchema>;
export type InsertAttempt = z.infer<typeof insertAttemptSchema>;
export type InsertQuestionTemplate = z.infer<typeof insertQuestionTemplateSchema>;
export type EvaluationFeedback = z.infer<typeof evaluationFeedbackSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertAchievement = z.infer<typeof achievementSchema>;
export type InsertUserAchievement = z.infer<typeof userAchievementSchema>;