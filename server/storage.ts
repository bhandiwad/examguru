import { users, exams, attempts, questionTemplates, achievements, userAchievements } from "@shared/schema";
import type { User, Exam, Attempt, QuestionTemplate, InsertUser, InsertExam, InsertAttempt, InsertQuestionTemplate, Achievement, UserAchievement, InsertAchievement, InsertUserAchievement } from "@shared/schema";
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
  updateTemplate(id: number, template: InsertQuestionTemplate): Promise<QuestionTemplate>;
  getTemplates(params: {
    curriculum?: string;
    subject?: string;
    grade?: string;
    institution?: string;
    paperFormat?: string;
  }): Promise<QuestionTemplate[]>;
  getTemplateById(id: number): Promise<QuestionTemplate | undefined>;
  // Achievement methods
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  getAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: number): Promise<(UserAchievement & { achievement: Achievement })[]>;
  trackAchievementProgress(data: InsertUserAchievement): Promise<UserAchievement>;
  checkAndAwardAchievements(userId: number): Promise<Achievement[]>;
  getAttemptWithExam(id: number): Promise<(Attempt & { exam: Exam }) | null>;
  storeSharedAnalysis(token: string, analysis: any): Promise<void>;
  getSharedAnalysis(token: string): Promise<any | null>;
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
    // If there's a template, get its data first
    let templateSnapshot = null;
    if (insertExam.templateId) {
      const template = await this.getTemplateById(insertExam.templateId);
      if (template) {
        templateSnapshot = {
          id: template.id,
          format: template.paperFormat,
          structure: template.template.structure,
          rubric: template.template.rubric,
          formatMetadata: template.formatMetadata
        };
      }
    }

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
        templateData: templateSnapshot, // Store template snapshot
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

  async updateTemplate(id: number, template: InsertQuestionTemplate): Promise<QuestionTemplate> {
    const [updatedTemplate] = await db
      .update(questionTemplates)
      .set({
        ...template,
        updatedAt: new Date()
      })
      .where(eq(questionTemplates.id, id))
      .returning();
    return updatedTemplate;
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

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const [newAchievement] = await db
      .insert(achievements)
      .values(achievement)
      .returning();
    return newAchievement;
  }

  async getAchievements(): Promise<Achievement[]> {
    return db
      .select()
      .from(achievements)
      .orderBy(desc(achievements.points));
  }

  async getUserAchievements(userId: number): Promise<(UserAchievement & { achievement: Achievement })[]> {
    const results = await db
      .select({
        userAchievement: userAchievements,
        achievement: achievements
      })
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId))
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .orderBy(desc(userAchievements.earnedAt));

    return results.map(({ userAchievement, achievement }) => ({
      ...userAchievement,
      achievement
    }));
  }

  async trackAchievementProgress(data: InsertUserAchievement): Promise<UserAchievement> {
    const [userAchievement] = await db
      .insert(userAchievements)
      .values(data)
      .returning();
    return userAchievement;
  }

  async checkAndAwardAchievements(userId: number): Promise<Achievement[]> {
    // Get all achievements and user's current progress
    const [achievements, attempts, userAchievements] = await Promise.all([
      this.getAchievements(),
      this.getAttempts(userId),
      this.getUserAchievements(userId)
    ]);

    const earnedAchievementIds = new Set(userAchievements.map(ua => ua.achievementId));
    const newlyEarnedAchievements: Achievement[] = [];

    for (const achievement of achievements) {
      // Skip if already earned
      if (earnedAchievementIds.has(achievement.id)) continue;

      // Check if achievement requirements are met
      const req = achievement.requirement as any;
      let requirementsMet = false;

      switch (achievement.type) {
        case "EXAM_SCORE":
          requirementsMet = attempts.some(a => a.score >= req.score);
          break;
        case "STREAK":
          // TODO: Implement streak checking logic
          break;
        case "SUBJECT_MASTERY":
          const subjectScores = attempts.reduce((acc, attempt) => {
            const subject = attempt.exam.subject;
            if (!acc[subject]) {
              acc[subject] = [];
            }
            if (attempt.score) {
              acc[subject].push(attempt.score);
            }
            return acc;
          }, {} as Record<string, number[]>);

          requirementsMet = Object.values(subjectScores).some(scores => {
            const average = scores.reduce((a, b) => a + b, 0) / scores.length;
            return average >= req.subjectMasteryLevel;
          });
          break;
      }

      if (requirementsMet) {
        await this.trackAchievementProgress({
          userId,
          achievementId: achievement.id,
          progress: { completed: 1 }
        });
        newlyEarnedAchievements.push(achievement);
      }
    }

    return newlyEarnedAchievements;
  }
  async getAttemptWithExam(id: number): Promise<(Attempt & { exam: Exam }) | null> {
    const result = await db
      .select({
        attempt: attempts,
        exam: exams
      })
      .from(attempts)
      .where(eq(attempts.id, id))
      .innerJoin(exams, eq(attempts.examId, exams.id))
      .limit(1);

    if (!result.length) return null;

    const { attempt, exam } = result[0];
    return {
      ...attempt,
      exam
    };
  }
  private sharedAnalysisCache = new Map<string, { analysis: any, timestamp: number }>();
  private readonly CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

  async storeSharedAnalysis(token: string, analysis: any): Promise<void> {
    this.sharedAnalysisCache.set(token, {
      analysis,
      timestamp: Date.now()
    });

    // Clean up expired entries
    for (const [key, value] of this.sharedAnalysisCache.entries()) {
      if (Date.now() - value.timestamp > this.CACHE_EXPIRY) {
        this.sharedAnalysisCache.delete(key);
      }
    }
  }

  async getSharedAnalysis(token: string): Promise<any | null> {
    const cached = this.sharedAnalysisCache.get(token);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.CACHE_EXPIRY) {
      this.sharedAnalysisCache.delete(token);
      return null;
    }

    return cached.analysis;
  }
}

export const storage = new DatabaseStorage();