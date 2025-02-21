import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Exam } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

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
  const [startTime] = useState(new Date());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: exam, isLoading } = useQuery<Exam>({
    queryKey: [`/api/exams/${params.id}`],
    enabled: !!params.id
  });

  const submitMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest("POST", "/api/attempts/upload", formData, {
        isFormData: true
      });
      if (!response.ok) {
        throw new Error("Failed to submit exam");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attempts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      toast({
        title: "Success",
        description: "Your answers have been submitted successfully."
      });
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
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

  const finishExam = async () => {
    setIsRunning(false);

    if (!exam) return;

    const formData = new FormData();
    formData.append("examId", exam.id.toString());
    formData.append("userId", "1"); // TODO: Replace with actual user ID
    formData.append("startTime", startTime.toISOString());

    const examContent = document.querySelector(".prose")?.innerHTML;
    if (!examContent) {
      toast({
        title: "Error",
        description: "Could not capture exam content",
        variant: "destructive"
      });
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = examContent;

    canvas.toBlob((blob) => {
      if (!blob) {
        toast({
          title: "Error",
          description: "Failed to capture answers",
          variant: "destructive"
        });
        return;
      }
      formData.append("answer", blob, "answer.png");
      submitMutation.mutate(formData);
    });
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
              <Button 
                onClick={finishExam} 
                variant="destructive"
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? "Submitting..." : "Finish Exam"}
              </Button>
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