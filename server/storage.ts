import { users, exams, attempts } from "@shared/schema";
import type { User, Exam, Attempt, InsertUser, InsertExam, InsertAttempt } from "@shared/schema";

export interface IStorage {
  createUser(user: InsertUser): Promise<User>;
  getUser(id: number): Promise<User | undefined>;
  createExam(exam: InsertExam): Promise<Exam>;
  getCurrentExam(userId: number): Promise<Exam | undefined>;
  getAttempts(userId: number): Promise<Attempt[]>;
  createAttempt(attempt: InsertAttempt): Promise<Attempt>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private exams: Map<number, Exam>;
  private attempts: Map<number, Attempt>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.exams = new Map();
    this.attempts = new Map();
    this.currentId = 1;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async createExam(insertExam: InsertExam): Promise<Exam> {
    const id = this.currentId++;
    const exam = { 
      ...insertExam, 
      id,
      createdAt: new Date()
    };
    this.exams.set(id, exam);
    return exam;
  }

  async getCurrentExam(userId: number): Promise<Exam | undefined> {
    return Array.from(this.exams.values()).find(
      (exam) => exam.userId === userId
    );
  }

  async getAttempts(userId: number): Promise<Attempt[]> {
    return Array.from(this.attempts.values()).filter(
      (attempt) => attempt.userId === userId
    );
  }

  async createAttempt(insertAttempt: InsertAttempt): Promise<Attempt> {
    const id = this.currentId++;
    const attempt = { ...insertAttempt, id };
    this.attempts.set(id, attempt);
    return attempt;
  }
}

export const storage = new MemStorage();
