import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PlusCircle, FilePlus, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SUBJECTS, GRADES, DIFFICULTIES } from "@shared/constants";
import type { Attempt, Exam, EvaluationFeedback } from "@shared/schema";
import { PerformanceTrends } from "@/components/PerformanceTrends";
import { AchievementDisplay } from "@/components/AchievementDisplay";
import { PageHeader } from "@/components/ui/page-header";
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

function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function QuestionFeedback({ feedback }: { feedback: any }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${feedback.isCorrect ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="font-medium">
          Question {feedback.questionNumber}
          {feedback.isCorrect ? ' (Correct)' : ' (Incorrect)'}
        </span>
      </div>

      <div className="ml-4 space-y-2">
        <p><strong>Chapter:</strong> {feedback.chapter}</p>
        <p><strong>Topic:</strong> {feedback.topic}</p>
        <p><strong>Understanding Level:</strong> {feedback.conceptualUnderstanding.level}</p>
        <p>{feedback.conceptualUnderstanding.details}</p>

        {feedback.misconceptions && feedback.misconceptions.length > 0 && (
          <div>
            <strong>Common Misconceptions:</strong>
            <ul className="list-disc pl-4">
              {feedback.misconceptions.map((m: string, i: number) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        )}

        {feedback.studyResources && feedback.studyResources.length > 0 && (
          <div>
            <strong>Study Resources:</strong>
            <ul className="list-none space-y-2 mt-2">
              {feedback.studyResources.map((resource: any, i: number) => (
                <li key={i} className="p-2 bg-secondary/10 rounded">
                  <div className="font-medium">{resource.title}</div>
                  <div className="text-sm text-muted-foreground">{resource.description}</div>
                  {resource.link && (
                    <a
                      href={resource.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      View Resource →
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

const ITEMS_PER_PAGE = 6;

export default function Dashboard() {
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: attempts, isLoading: attemptsLoading } = useQuery<AttemptWithExam[]>({
    queryKey: ["/api/attempts"]
  });

  const { data: exams, isLoading: examsLoading } = useQuery<Exam[]>({
    queryKey: ["/api/exams"]
  });

  const isLoading = attemptsLoading || examsLoading;

  const filteredExams = exams?.filter(exam => {
    if (selectedSubject && exam.subject !== selectedSubject) return false;
    if (selectedGrade && exam.grade !== selectedGrade) return false;
    if (selectedDifficulty && exam.difficulty !== selectedDifficulty) return false;
    return true;
  }) || [];

  const totalPages = Math.ceil(filteredExams.length / ITEMS_PER_PAGE);
  const paginatedExams = filteredExams.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <PageHeader title="Your Exams" />
        <div className="flex gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter Exams
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Exams</SheetTitle>
                <SheetDescription>
                  Filter exams by subject, grade, and difficulty level.
                </SheetDescription>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Subject</h4>
                  <Select
                    value={selectedSubject}
                    onValueChange={(value) => {
                      setSelectedSubject(value);
                      handleFilterChange();
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Subjects</SelectItem>
                      {SUBJECTS.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Grade</h4>
                  <Select
                    value={selectedGrade}
                    onValueChange={(value) => {
                      setSelectedGrade(value);
                      handleFilterChange();
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Grades</SelectItem>
                      {GRADES.map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          Grade {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Difficulty</h4>
                  <Select
                    value={selectedDifficulty}
                    onValueChange={(value) => {
                      setSelectedDifficulty(value);
                      handleFilterChange();
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Difficulties</SelectItem>
                      {DIFFICULTIES.map((diff) => (
                        <SelectItem key={diff} value={diff}>
                          {diff}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </SheetContent>
          </Sheet>
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

      {attempts && attempts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Performance Analytics</h2>
          <PerformanceTrends attempts={attempts} />
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Achievements & Badges</h2>
        <AchievementDisplay />
      </div>

      {exams && exams.length > 0 ? (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Available Exams</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="px-4 py-2 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedExams.map((exam) => (
              <Card key={exam.id} className="bg-primary/5">
                <CardHeader>
                  <CardTitle>{exam.subject}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpenIcon className="h-4 w-4" />
                      <span>Grade {exam.grade}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FileTextIcon className="h-4 w-4" />
                      <span>Difficulty: {exam.difficulty}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <ClockIcon className="h-4 w-4" />
                      <span>Created: {formatDateTime(exam.createdAt)}</span>
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
          {filteredExams.length === 0 && (
            <Card className="bg-muted/50">
              <CardContent className="py-8 text-center text-muted-foreground">
                No exams found matching the selected filters.
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}

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
                      <span>Started: {formatDateTime(attempt.startTime)}</span>
                    </div>

                    {attempt.endTime && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <ClockIcon className="h-4 w-4" />
                        <span>Completed: {formatDateTime(attempt.endTime)}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <BookOpenIcon className="h-4 w-4" />
                      <span>Curriculum: {attempt.exam.curriculum}</span>
                    </div>

                    {attempt.score !== null && (
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
                    )}

                    {attempt.feedback && (
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="feedback">
                          <AccordionTrigger className="text-sm font-medium">
                            Detailed Evaluation
                          </AccordionTrigger>
                          <AccordionContent>
                            {attempt.feedback && (
                              <div className="space-y-6 text-sm">
                                {(attempt.feedback as EvaluationFeedback).overall && (
                                  <>
                                    <div>
                                      <h4 className="font-medium mb-2">Overview</h4>
                                      <p className="text-gray-600">
                                        {(attempt.feedback as EvaluationFeedback).overall.summary}
                                      </p>
                                    </div>

                                    {(attempt.feedback as EvaluationFeedback).overall.strengths?.length > 0 && (
                                      <div>
                                        <h4 className="font-medium mb-2">Strengths</h4>
                                        <ul className="list-disc pl-4 space-y-1">
                                          {(attempt.feedback as EvaluationFeedback).overall.strengths.map((strength, i) => (
                                            <li key={i} className="text-gray-600">{strength}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {(attempt.feedback as EvaluationFeedback).overall.areas_for_improvement?.length > 0 && (
                                      <div>
                                        <h4 className="font-medium mb-2">Areas for Improvement</h4>
                                        <ul className="list-disc pl-4 space-y-1">
                                          {(attempt.feedback as EvaluationFeedback).overall.areas_for_improvement.map((area, i) => (
                                            <li key={i} className="text-gray-600">{area}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {(attempt.feedback as EvaluationFeedback).overall.learning_recommendations?.length > 0 && (
                                      <div>
                                        <h4 className="font-medium mb-2">Learning Recommendations</h4>
                                        <ul className="list-disc pl-4 space-y-1">
                                          {(attempt.feedback as EvaluationFeedback).overall.learning_recommendations.map((rec, i) => (
                                            <li key={i} className="text-gray-600">{rec}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {(attempt.feedback as EvaluationFeedback).performanceAnalytics?.difficultyAnalysis && (
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
                                    )}
                                  </>
                                )}
                                {attempt.feedback.questions && (
                                  <div className="mt-6">
                                    <h4 className="font-medium mb-4">Question-by-Question Analysis</h4>
                                    <div className="space-y-6">
                                      {attempt.feedback.questions.map((questionFeedback: any) => (
                                        <QuestionFeedback
                                          key={questionFeedback.questionNumber}
                                          feedback={questionFeedback}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {attempt.feedback.performanceAnalytics?.byChapter && (
                                  <div className="mt-6">
                                    <h4 className="font-medium mb-4">Chapter-wise Performance</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {Object.entries(attempt.feedback.performanceAnalytics.byChapter).map(([chapter, data]: [string, any]) => (
                                        <Card key={chapter} className="p-4">
                                          <h5 className="font-medium mb-2">{chapter}</h5>
                                          <Progress value={data.score} className="mb-2" />
                                          <p className="text-sm text-muted-foreground mb-2">Score: {data.score}%</p>
                                          {data.recommendations && (
                                            <div className="text-sm">
                                              <strong>Recommendations:</strong>
                                              <ul className="list-disc pl-4 mt-1">
                                                {data.recommendations.map((rec: string, i: number) => (
                                                  <li key={i}>{rec}</li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}
                                        </Card>
                                      ))}
                                    </div>
                                  </div>
                                )}
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