import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { insertExamSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

const CURRICULA = ["ICSE", "CBSE", "Karnataka State Board"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];

const defaultFormat = {
  totalMarks: 100,
  sections: [
    { type: "theory", marks: 60 },
    { type: "problems", marks: 40 }
  ]
};

type FormData = {
  curriculum: string;
  subject: string;
  difficulty: string;
  format: typeof defaultFormat;
};

export default function CreateExam() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(insertExamSchema),
    defaultValues: {
      curriculum: CURRICULA[0],
      subject: "",
      difficulty: DIFFICULTIES[0],
      format: defaultFormat
    }
  });

  const createExam = useMutation({
    mutationFn: async (data: FormData) => {
      console.log("Creating exam with data:", data);
      const response = await apiRequest("POST", "/api/exams", data);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create exam");
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log("Exam created successfully:", data);
      // Invalidate the queries so the dashboard will refetch fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attempts"] });

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

  async function onSubmit(formData: FormData) {
    console.log("Form submission started with values:", formData);
    try {
      setIsGenerating(true);
      toast({
        title: "Generating",
        description: "Creating your exam...",
      });

      await createExam.mutateAsync(formData);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsGenerating(false);
    }
  }

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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <FormMessage />
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isGenerating}
              >
                {isGenerating ? "Generating exam..." : "Generate Exam"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}