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
  template: jsonb("template").notNull(),
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

export const insertQuestionTemplateSchema = z.object({
  curriculum: z.string().min(1, "Curriculum is required"),
  subject: z.string().min(1, "Subject is required"),
  grade: z.string().min(1, "Grade is required"),
  type: z.string().min(1, "Question type is required"),
  template: z.object({
    structure: z.string(),
    marks: z.number(),
    rubric: z.string(),
    examples: z.array(z.string())
  })
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
  })
});

export const insertAttemptSchema = z.object({
  examId: z.number().int().min(1, "Exam ID is required"),
  userId: z.number().int().min(1, "User ID is required"),
  startTime: z.date(),
  endTime: z.date().optional(),
  answerImageUrl: z.string().optional(),
  score: z.number().int().optional(),
  feedback: z.any().optional()
});

export type User = typeof users.$inferSelect;
export type Exam = typeof exams.$inferSelect;
export type Attempt = typeof attempts.$inferSelect;
export type QuestionTemplate = typeof questionTemplates.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type InsertExam = z.infer<typeof insertExamSchema>;
export type InsertAttempt = z.infer<typeof insertAttemptSchema>;
export type InsertQuestionTemplate = z.infer<typeof insertQuestionTemplateSchema>;