import { users, exams, attempts } from "@shared/schema";
import type { User, Exam, Attempt, InsertUser, InsertExam, InsertAttempt } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  createUser(user: InsertUser): Promise<User>;
  getUser(id: number): Promise<User | undefined>;
  createExam(exam: InsertExam): Promise<Exam>;
  getCurrentExam(userId: number): Promise<Exam | undefined>;
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

  async createExam(insertExam: InsertExam): Promise<Exam> {
    const [exam] = await db
      .insert(exams)
      .values({
        ...insertExam,
        createdAt: new Date(),
      })
      .returning();
    return exam;
  }

  async getCurrentExam(userId: number): Promise<Exam | undefined> {
    const [exam] = await db
      .select()
      .from(exams)
      .where(eq(exams.userId, userId))
      .orderBy(exams.createdAt);
    return exam;
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