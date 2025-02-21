import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PlusCircle, FilePlus } from "lucide-react";
import type { Attempt, Exam, EvaluationFeedback } from "@shared/schema";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen as BookOpenIcon,
  Clock as ClockIcon,
  FileText as FileTextIcon,
  Star as StarIcon,
} from "lucide-react";

type AttemptWithExam = Attempt & { exam: Exam };

export default function Dashboard() {
  const { data: attempts, isLoading: attemptsLoading } = useQuery<AttemptWithExam[]>({
    queryKey: ["/api/attempts"]
  });

  const { data: exams, isLoading: examsLoading } = useQuery<Exam[]>({
    queryKey: ["/api/exams"]
  });

  const isLoading = attemptsLoading || examsLoading;

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Exams</h1>
        <div className="flex gap-4">
          <Link href="/add-template">
            <Button variant="outline">
              <FilePlus className="mr-2 h-4 w-4" />
              Add Template
            </Button>
          </Link>
          <Link href="/create">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Exam
            </Button>
          </Link>
        </div>
      </div>

      {exams && exams.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Available Exams</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map((exam) => (
              <Card key={exam.id} className="bg-primary/5">
                <CardHeader>
                  <CardTitle>{exam.subject}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpenIcon className="h-4 w-4" />
                      <span>Curriculum: {exam.curriculum}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FileTextIcon className="h-4 w-4" />
                      <span>Difficulty: {exam.difficulty}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <ClockIcon className="h-4 w-4" />
                      <span>Created: {new Date(exam.createdAt).toLocaleDateString()}</span>
                    </div>
                    <Link href={`/take/${exam.id}`}>
                      <Button className="w-full mt-4">
                        Take Exam
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-4">Previous Attempts</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-[200px]" />
              </Card>
            ))}
          </div>
        ) : attempts && attempts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {attempts.map((attempt) => (
              <Card key={attempt.id} className="relative">
                <CardHeader>
                  <CardTitle>{attempt.exam.subject}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <ClockIcon className="h-4 w-4" />
                      <span>Attempted: {new Date(attempt.startTime).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <BookOpenIcon className="h-4 w-4" />
                      <span>Curriculum: {attempt.exam.curriculum}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <StarIcon className="h-4 w-4 text-primary" />
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Score</span>
                          <span className="text-sm font-medium">{attempt.score}%</span>
                        </div>
                        <Progress value={attempt.score} />
                      </div>
                    </div>

                    {attempt.feedback && (
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="feedback">
                          <AccordionTrigger className="text-sm font-medium">
                            Detailed Evaluation
                          </AccordionTrigger>
                          <AccordionContent>
                            {attempt.feedback && (
                              <div className="space-y-4 text-sm">
                                <div>
                                  <h4 className="font-medium mb-2">Overview</h4>
                                  <p className="text-gray-600">
                                    {(attempt.feedback as EvaluationFeedback).overall.summary}
                                  </p>
                                </div>

                                <div>
                                  <h4 className="font-medium mb-2">Strengths</h4>
                                  <ul className="list-disc pl-4 space-y-1">
                                    {(attempt.feedback as EvaluationFeedback).overall.strengths.map((strength: string, i: number) => (
                                      <li key={i} className="text-gray-600">{strength}</li>
                                    ))}
                                  </ul>
                                </div>

                                <div>
                                  <h4 className="font-medium mb-2">Areas for Improvement</h4>
                                  <ul className="list-disc pl-4 space-y-1">
                                    {(attempt.feedback as EvaluationFeedback).overall.areas_for_improvement.map((area: string, i: number) => (
                                      <li key={i} className="text-gray-600">{area}</li>
                                    ))}
                                  </ul>
                                </div>

                                <div>
                                  <h4 className="font-medium mb-2">Learning Recommendations</h4>
                                  <ul className="list-disc pl-4 space-y-1">
                                    {(attempt.feedback as EvaluationFeedback).overall.learning_recommendations.map((rec: string, i: number) => (
                                      <li key={i} className="text-gray-600">{rec}</li>
                                    ))}
                                  </ul>
                                </div>

                                <div>
                                  <h4 className="font-medium mb-2">Performance Analytics</h4>
                                  <div className="grid grid-cols-3 gap-2 mt-2">
                                    <div className="text-center p-2 bg-secondary/10 rounded">
                                      <div className="text-2xl font-bold text-primary">
                                        {(attempt.feedback as EvaluationFeedback).performanceAnalytics.difficultyAnalysis.easy}%
                                      </div>
                                      <div className="text-xs text-gray-500">Easy Questions</div>
                                    </div>
                                    <div className="text-center p-2 bg-secondary/10 rounded">
                                      <div className="text-2xl font-bold text-primary">
                                        {(attempt.feedback as EvaluationFeedback).performanceAnalytics.difficultyAnalysis.medium}%
                                      </div>
                                      <div className="text-xs text-gray-500">Medium Questions</div>
                                    </div>
                                    <div className="text-center p-2 bg-secondary/10 rounded">
                                      <div className="text-2xl font-bold text-primary">
                                        {(attempt.feedback as EvaluationFeedback).performanceAnalytics.difficultyAnalysis.hard}%
                                      </div>
                                      <div className="text-xs text-gray-500">Hard Questions</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-muted/50">
            <CardContent className="py-8 text-center text-muted-foreground">
              No attempts yet. Take an exam to see your results here.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}