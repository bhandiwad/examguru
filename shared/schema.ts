import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  firebaseId: text("firebase_id").notNull().unique()
});

export const exams = pgTable("exams", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  curriculum: text("curriculum").notNull(),
  subject: text("subject").notNull(),
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

// Create Schema for exam creation - we'll omit userId and questions as they're handled by the server
export const insertExamSchema = z.object({
  curriculum: z.string().min(1, "Curriculum is required"),
  subject: z.string().min(1, "Subject is required"),
  difficulty: z.string().min(1, "Difficulty is required"),
  format: z.object({
    totalMarks: z.number(),
    sections: z.array(z.object({
      type: z.string(),
      marks: z.number()
    }))
  })
});

// Create Schema for attempt creation
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
export type InsertUser = typeof users.$inferInsert;
export type InsertExam = z.infer<typeof insertExamSchema>;
export type InsertAttempt = z.infer<typeof insertAttemptSchema>;