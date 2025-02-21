import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
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

export const insertUserSchema = createInsertSchema(users);
export const insertExamSchema = createInsertSchema(exams);
export const insertAttemptSchema = createInsertSchema(attempts);

export type User = typeof users.$inferSelect;
export type Exam = typeof exams.$inferSelect;
export type Attempt = typeof attempts.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertExam = z.infer<typeof insertExamSchema>;
export type InsertAttempt = z.infer<typeof insertAttemptSchema>;
