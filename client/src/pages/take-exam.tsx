import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { Exam } from "@shared/schema";

type Question = {
  type: string;
  text: string;
  marks: number;
  choices?: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer?: string;
  rubric: string;
  section: string;
  image?: string;
};

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

  const questions = exam.questions as Question[];

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
          {questions.map((question, index) => (
            <div key={index} className="mb-8 p-4 border rounded-lg">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold mb-2">Question {index + 1}</h3>
                <span className="text-sm text-gray-500">Marks: {question.marks}</span>
              </div>

              <p className="mb-4">{question.text}</p>

              {question.image && (
                <div className="mb-4">
                  <img 
                    src={question.image} 
                    alt={`Diagram for question ${index + 1}`}
                    className="max-w-full h-auto rounded-lg shadow-md"
                  />
                </div>
              )}

              {question.type === "MCQ" && question.choices && (
                <RadioGroup className="space-y-2">
                  {Object.entries(question.choices).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <RadioGroupItem value={key} id={`q${index}-${key}`} />
                      <Label htmlFor={`q${index}-${key}`}>
                        {key}. {value}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}