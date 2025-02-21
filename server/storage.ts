import { users, exams, attempts } from "@shared/schema";
import type { User, Exam, Attempt, InsertUser, InsertExam, InsertAttempt } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  createUser(user: InsertUser): Promise<User>;
  getUser(id: number): Promise<User | undefined>;
  createExam(exam: InsertExam & { userId: number, questions: any[] }): Promise<Exam>;
  getUserExams(userId: number): Promise<Exam[]>;
  getAttempts(userId: number): Promise<Attempt[]>;
  createAttempt(attempt: InsertAttempt): Promise<Attempt>;
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

  async getAttempts(userId: number): Promise<Attempt[]> {
    return db
      .select()
      .from(attempts)
      .where(eq(attempts.userId, userId));
  }

  async createAttempt(insertAttempt: InsertAttempt): Promise<Attempt> {
    const [attempt] = await db
      .insert(attempts)
      .values(insertAttempt)
      .returning();
    return attempt;
  }
}

export const storage = new DatabaseStorage();