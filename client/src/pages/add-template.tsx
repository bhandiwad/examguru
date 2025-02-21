import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { insertQuestionTemplateSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Upload } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

const CURRICULA = ["ICSE", "CBSE", "Karnataka State Board"];
const GRADES = ["8", "9", "10", "11", "12"];
const QUESTION_TYPES = ["Theory", "Numerical", "MCQ", "Mixed"];

export default function AddTemplate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [sections, setSections] = useState([{ name: "", questionCount: 0, marksPerQuestion: 0, questionType: "", format: "" }]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const form = useForm({
    resolver: zodResolver(insertQuestionTemplateSchema),
    defaultValues: {
      curriculum: "",
      subject: "",
      grade: "",
      type: "",
      institution: "",
      paperFormat: "",
      template: {
        structure: "",
        marks: 100,
        rubric: "",
        examples: []
      },
      formatMetadata: {
        sections: [],
        totalMarks: 100,
        duration: 180,
        specialInstructions: []
      }
    }
  });

  const createTemplate = useMutation({
    mutationFn: async (data: any) => {
      const formattedData = {
        ...data,
        formatMetadata: {
          ...data.formatMetadata,
          duration: Number(data.formatMetadata.duration),
          sections
        }
      };

      const response = await apiRequest("POST", "/api/templates", formattedData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create template");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates/search"] });
      toast({
        title: "Success",
        description: "Template created successfully"
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

  const analyzePaper = useMutation({
    mutationFn: async (file: File) => {
      setIsAnalyzing(true);
      const formData = new FormData();
      formData.append("questionPaper", file);

      const response = await fetch("/api/templates/analyze-image", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to analyze paper");
      }

      return response.json();
    },
    onSuccess: (data) => {
      form.setValue("formatMetadata.sections", data.sections);
      form.setValue("formatMetadata.totalMarks", data.totalMarks);
      form.setValue("formatMetadata.duration", data.duration);
      form.setValue("formatMetadata.specialInstructions", data.specialInstructions);
      setSections(data.sections);

      toast({
        title: "Template Analyzed",
        description: "Question paper format has been extracted successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive"
      });
    },
    onSettled: () => {
      setIsAnalyzing(false);
    }
  });

  const addSection = () => {
    setSections([...sections, { name: "", questionCount: 0, marksPerQuestion: 0, questionType: "", format: "" }]);
  };

  const updateSection = (index: number, field: string, value: string | number) => {
    const newSections = [...sections];
    newSections[index] = { ...newSections[index], [field]: value };
    setSections(newSections);
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <PageHeader title="Add Question Paper Template" />
      <Card className="mb-4">
        <CardHeader>
          <CardDescription>
            Upload a previous year's question paper to automatically extract its format
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  analyzePaper.mutate(file);
                }
              }}
            />
            <div className="text-sm text-muted-foreground">
              Upload a clear image of a question paper to extract its template structure
            </div>
            {isAnalyzing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Upload className="h-4 w-4 animate-pulse" />
                Analyzing question paper...
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createTemplate.mutate(data))} className="space-y-4">
              <FormField
                control={form.control}
                name="institution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institution Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Vidyashilp Academy" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                      <Input placeholder="e.g. Physics" {...field} />
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
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select question type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {QUESTION_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paperFormat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paper Format Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Annual Examination Format" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="template.structure"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Structure</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the structure of questions (e.g. 'Each theory question should have sub-parts a, b, c')"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Sections</h3>
                  <Button type="button" variant="outline" onClick={addSection}>
                    Add Section
                  </Button>
                </div>

                {sections.map((section, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormItem>
                          <FormLabel>Section Name</FormLabel>
                          <Input
                            value={section.name}
                            onChange={(e) => updateSection(index, "name", e.target.value)}
                            placeholder="e.g. Section A"
                          />
                        </FormItem>
                        <FormItem>
                          <FormLabel>Question Type</FormLabel>
                          <Select onValueChange={(value) => updateSection(index, "questionType", value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {QUESTION_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormItem>
                          <FormLabel>Number of Questions</FormLabel>
                          <Input
                            type="number"
                            value={section.questionCount}
                            onChange={(e) => updateSection(index, "questionCount", parseInt(e.target.value))}
                          />
                        </FormItem>
                        <FormItem>
                          <FormLabel>Marks per Question</FormLabel>
                          <Input
                            type="number"
                            value={section.marksPerQuestion}
                            onChange={(e) => updateSection(index, "marksPerQuestion", parseInt(e.target.value))}
                          />
                        </FormItem>
                      </div>
                      <FormItem>
                        <FormLabel>Format Instructions</FormLabel>
                        <Input
                          value={section.format}
                          onChange={(e) => updateSection(index, "format", e.target.value)}
                          placeholder="e.g. 'Answer any 5 questions'"
                        />
                      </FormItem>
                    </div>
                  </Card>
                ))}
              </div>

              <FormField
                control={form.control}
                name="formatMetadata.duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="template.rubric"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>General Rubric</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="General marking guidelines for the paper"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={createTemplate.isPending}
              >
                {createTemplate.isPending ? "Creating template..." : "Create Template"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}