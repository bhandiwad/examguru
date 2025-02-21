import { users, exams, attempts, questionTemplates } from "@shared/schema";
import type { User, Exam, Attempt, QuestionTemplate, InsertUser, InsertExam, InsertAttempt, InsertQuestionTemplate } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, ilike } from "drizzle-orm";

export interface IStorage {
  createUser(user: InsertUser): Promise<User>;
  getUser(id: number): Promise<User | undefined>;
  createExam(exam: InsertExam & { userId: number, questions: any[], templateId: number }): Promise<Exam>;
  getUserExams(userId: number): Promise<Exam[]>;
  getExam(examId: number): Promise<Exam | undefined>;
  getAttempts(userId: number): Promise<(Attempt & { exam: Exam })[]>;
  createAttempt(attempt: InsertAttempt): Promise<Attempt>;
  // Enhanced template methods
  createTemplate(template: InsertQuestionTemplate): Promise<QuestionTemplate>;
  getTemplates(params: {
    curriculum?: string;
    subject?: string;
    grade?: string;
    institution?: string;
    paperFormat?: string;
  }): Promise<QuestionTemplate[]>;
  getTemplateById(id: number): Promise<QuestionTemplate | undefined>;
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

  async createExam(insertExam: InsertExam & { userId: number, questions: any[], templateId: number }): Promise<Exam> {
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
        templateId: insertExam.templateId,
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

  async getTemplates(params: {
    curriculum?: string;
    subject?: string;
    grade?: string;
    institution?: string;
    paperFormat?: string;
  }): Promise<QuestionTemplate[]> {
    let conditions = [];

    if (params.curriculum) {
      conditions.push(eq(questionTemplates.curriculum, params.curriculum));
    }
    if (params.subject) {
      conditions.push(eq(questionTemplates.subject, params.subject));
    }
    if (params.grade) {
      conditions.push(eq(questionTemplates.grade, params.grade));
    }
    if (params.institution) {
      conditions.push(ilike(questionTemplates.institution!, `%${params.institution}%`));
    }
    if (params.paperFormat) {
      conditions.push(eq(questionTemplates.paperFormat!, params.paperFormat));
    }

    return db
      .select()
      .from(questionTemplates)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(questionTemplates.createdAt));
  }

  async getTemplateById(id: number): Promise<QuestionTemplate | undefined> {
    const [template] = await db
      .select()
      .from(questionTemplates)
      .where(eq(questionTemplates.id, id));
    return template;
  }
}

export const storage = new DatabaseStorage();