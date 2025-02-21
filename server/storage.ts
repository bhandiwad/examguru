import { users, exams, attempts, questionTemplates } from "@shared/schema";
import type { User, Exam, Attempt, QuestionTemplate, InsertUser, InsertExam, InsertAttempt, InsertQuestionTemplate } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  createUser(user: InsertUser): Promise<User>;
  getUser(id: number): Promise<User | undefined>;
  createExam(exam: InsertExam & { userId: number, questions: any[] }): Promise<Exam>;
  getUserExams(userId: number): Promise<Exam[]>;
  getExam(examId: number): Promise<Exam | undefined>;
  getAttempts(userId: number): Promise<(Attempt & { exam: Exam })[]>;
  createAttempt(attempt: InsertAttempt): Promise<Attempt>;
  // New template methods
  createTemplate(template: InsertQuestionTemplate): Promise<QuestionTemplate>;
  getTemplates(curriculum: string, subject: string, grade: string): Promise<QuestionTemplate[]>;
}

export class DatabaseStorage implements IStorage {
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user;
  }

  async createExam(insertExam: InsertExam & { userId: number, questions: any[] }): Promise<Exam> {
    const [exam] = await db
      .insert(exams)
      .values({
        curriculum: insertExam.curriculum,
        subject: insertExam.subject,
        grade: insertExam.grade,
        difficulty: insertExam.difficulty,
        userId: insertExam.userId,
        format: insertExam.format,
        questions: insertExam.questions,
        createdAt: new Date()
      })
      .returning();
    return exam;
  }

  async getUserExams(userId: number): Promise<Exam[]> {
    return db
      .select()
      .from(exams)
      .where(eq(exams.userId, userId))
      .orderBy(desc(exams.createdAt));
  }

  async getExam(examId: number): Promise<Exam | undefined> {
    const [exam] = await db
      .select()
      .from(exams)
      .where(eq(exams.id, examId));
    return exam;
  }

  async getAttempts(userId: number): Promise<(Attempt & { exam: Exam })[]> {
    const results = await db
      .select({
        attempt: attempts,
        exam: exams
      })
      .from(attempts)
      .where(eq(attempts.userId, userId))
      .innerJoin(exams, eq(attempts.examId, exams.id))
      .orderBy(desc(attempts.startTime));

    return results.map(({ attempt, exam }) => ({
      ...attempt,
      exam
    }));
  }

  async createAttempt(insertAttempt: InsertAttempt): Promise<Attempt> {
    const [attempt] = await db
      .insert(attempts)
      .values(insertAttempt)
      .returning();
    return attempt;
  }

  // New template methods
  async createTemplate(template: InsertQuestionTemplate): Promise<QuestionTemplate> {
    const [newTemplate] = await db
      .insert(questionTemplates)
      .values({
        ...template,
        createdAt: new Date()
      })
      .returning();
    return newTemplate;
  }

  async getTemplates(curriculum: string, subject: string, grade: string): Promise<QuestionTemplate[]> {
    return db
      .select()
      .from(questionTemplates)
      .where(
        and(
          eq(questionTemplates.curriculum, curriculum),
          eq(questionTemplates.subject, subject),
          eq(questionTemplates.grade, grade)
        )
      )
      .orderBy(desc(questionTemplates.createdAt));
  }
}

export const storage = new DatabaseStorage();