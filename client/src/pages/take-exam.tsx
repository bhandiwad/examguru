import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Exam } from "@shared/schema";

export default function TakeExam() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const [timeLeft, setTimeLeft] = useState(7200); // 2 hours in seconds
  const [isRunning, setIsRunning] = useState(false);

  const { data: exam, isLoading } = useQuery<Exam>({
    queryKey: [`/api/exams/${params.id}`],
    enabled: !!params.id
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startExam = () => {
    setIsRunning(true);
  };

  const finishExam = () => {
    setIsRunning(false);
    setLocation("/upload");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 text-center">
        Loading exam...
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="container mx-auto py-8 text-center">
        Exam not found.
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Time Remaining: {formatTime(timeLeft)}</span>
            {!isRunning ? (
              <Button onClick={startExam}>Start Exam</Button>
            ) : (
              <Button onClick={finishExam} variant="destructive">Finish Exam</Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={(timeLeft / 7200) * 100} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="prose max-w-none pt-6">
          <h2>Questions</h2>
          {exam.questions.map((question: any, index: number) => (
            <div key={index} className="mb-6">
              <h3>Question {index + 1}</h3>
              <p>{question.text}</p>
              <p className="text-sm text-gray-500">Marks: {question.marks}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}