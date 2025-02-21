import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { insertExamSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { QuestionTemplate } from "@shared/schema";

const CURRICULA = ["ICSE", "CBSE", "Karnataka State Board"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const GRADES = ["8", "9", "10", "11", "12"];

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
  grade: string;
  difficulty: string;
  format: typeof defaultFormat;
  templateId?: number;
};

export default function CreateExam() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<string>("");

  const form = useForm<FormData>({
    resolver: zodResolver(insertExamSchema),
    defaultValues: {
      curriculum: CURRICULA[0],
      subject: "",
      grade: GRADES[2], // Default to grade 10
      difficulty: DIFFICULTIES[0],
      format: defaultFormat
    }
  });

  const { data: templates, isLoading: templatesLoading } = useQuery<QuestionTemplate[]>({
    queryKey: ["/api/templates/search", form.watch("curriculum"), form.watch("subject"), form.watch("grade")],
    queryFn: async () => {
      const params = new URLSearchParams({
        curriculum: form.watch("curriculum"),
        subject: form.watch("subject"),
        grade: form.watch("grade")
      });

      if (selectedInstitution) {
        params.append("institution", selectedInstitution);
      }

      const response = await fetch(`/api/templates/search?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }
      return response.json();
    },
    enabled: !!form.watch("curriculum") && !!form.watch("subject") && !!form.watch("grade")
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
        description: "Creating your exam using curriculum-specific templates...",
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
          <CardDescription>
            Fill in the details below to generate an exam. You can optionally select a specific institution's format.
          </CardDescription>
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
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GRADES.map((grade) => (
                          <SelectItem key={grade} value={grade}>Grade {grade}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

              <FormField
                control={form.control}
                name="templateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institution Template (Optional)</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value ? parseInt(value) : undefined);
                        const template = templates?.find(t => t.id === parseInt(value));
                        if (template) {
                          setSelectedInstitution(template.institution || "");
                        }
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an institution's format (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No specific format</SelectItem>
                        {templates?.map((template) => (
                          <SelectItem key={template.id} value={template.id.toString()}>
                            {template.institution} - {template.paperFormat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("templateId") && templates?.find(t => t.id === form.watch("templateId")) && (
                <Card className="bg-secondary/10">
                  <CardContent className="pt-4">
                    <h3 className="font-medium mb-2">Template Details</h3>
                    {(() => {
                      const template = templates.find(t => t.id === form.watch("templateId"));
                      const metadata = template?.formatMetadata as any;
                      return (
                        <div className="text-sm space-y-2">
                          <p><strong>Institution:</strong> {template?.institution}</p>
                          <p><strong>Format:</strong> {template?.paperFormat}</p>
                          {metadata?.totalMarks && (
                            <p><strong>Total Marks:</strong> {metadata.totalMarks}</p>
                          )}
                          {metadata?.duration && (
                            <p><strong>Duration:</strong> {metadata.duration} minutes</p>
                          )}
                          {metadata?.specialInstructions && (
                            <div>
                              <strong>Special Instructions:</strong>
                              <ul className="list-disc pl-4 mt-1">
                                {metadata.specialInstructions.map((instruction: string, i: number) => (
                                  <li key={i}>{instruction}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}

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