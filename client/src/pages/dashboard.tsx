import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PlusCircle, Clock, FileText, BookOpen, Star } from "lucide-react";
import type { Attempt, Exam } from "@shared/schema";

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
        <Link href="/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Exam
          </Button>
        </Link>
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
                      <BookOpen className="h-4 w-4" />
                      <span>Curriculum: {exam.curriculum}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4" />
                      <span>Difficulty: {exam.difficulty}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4" />
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
              <Card key={attempt.id}>
                <CardHeader>
                  <CardTitle>{attempt.exam.subject}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>Attempted: {new Date(attempt.startTime).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <BookOpen className="h-4 w-4" />
                      <span>Curriculum: {attempt.exam.curriculum}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Star className="h-4 w-4" />
                      <span>Score: {attempt.score !== null ? `${attempt.score}%` : "Not evaluated"}</span>
                    </div>
                    {attempt.feedback && (
                      <div className="mt-2 text-sm">
                        <p className="font-medium">Feedback:</p>
                        <p className="text-gray-600">{attempt.feedback.overall}</p>
                      </div>
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