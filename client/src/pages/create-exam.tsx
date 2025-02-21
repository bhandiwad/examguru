import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { insertExamSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const CURRICULA = ["ICSE", "CBSE", "Karnataka State Board"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];

const defaultFormat = {
  totalMarks: 100,
  sections: [
    { type: "theory", marks: 60 },
    { type: "problems", marks: 40 }
  ]
};

export default function CreateExam() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm({
    resolver: zodResolver(insertExamSchema.extend({
      subject: insertExamSchema.shape.subject.min(1, "Subject is required"),
      curriculum: insertExamSchema.shape.curriculum.min(1, "Curriculum is required"),
      difficulty: insertExamSchema.shape.difficulty.min(1, "Difficulty is required")
    })),
    defaultValues: {
      curriculum: "",
      subject: "",
      difficulty: "",
      format: defaultFormat
    }
  });

  const createExam = useMutation({
    mutationFn: async (data: any) => {
      console.log("Submitting exam data:", data);
      const response = await apiRequest("POST", "/api/exams", {
        ...data,
        format: defaultFormat // Ensure format is always included
      });
      const result = await response.json();
      console.log("Received response:", result);
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your exam has been generated successfully"
      });
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      console.error("Error creating exam:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create exam. Please try again.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = async (data: any) => {
    try {
      setIsGenerating(true);
      await createExam.mutateAsync(data);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create New Exam</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="curriculum"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Curriculum</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select curriculum" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRICULA.map((curr) => (
                          <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Mathematics" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DIFFICULTIES.map((diff) => (
                          <SelectItem key={diff} value={diff}>{diff}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isGenerating || !form.formState.isValid}
              >
                {isGenerating ? "Generating exam..." : "Generate Exam"}
              </Button>

              {Object.keys(form.formState.errors).length > 0 && (
                <p className="text-sm text-red-500 mt-2">
                  Please fill in all required fields
                </p>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}