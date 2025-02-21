import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Exam } from "@shared/schema";

export default function TakeExam() {
  const [, setLocation] = useLocation();
  const [timeLeft, setTimeLeft] = useState(7200); // 2 hours in seconds
  const [isRunning, setIsRunning] = useState(false);

  const { data: exam } = useQuery<Exam>({
    queryKey: ["/api/exams/current"]
  });

  useEffect(() => {
    let interval: number;
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

      {exam && (
        <Card>
          <CardContent className="prose max-w-none pt-6">
            <h2>Questions</h2>
            {exam.questions.map((q: any, i: number) => (
              <div key={i} className="mb-6">
                <h3>Question {i + 1}</h3>
                <p>{q.text}</p>
                <p className="text-sm text-gray-500">Marks: {q.marks}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
