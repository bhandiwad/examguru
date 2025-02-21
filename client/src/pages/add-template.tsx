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
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Quick Template Creation</CardTitle>
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
        <CardHeader>
          <CardTitle>Add Question Paper Template</CardTitle>
          <CardDescription>
            Create a new template for your institution's exam paper format
          </CardDescription>
        </CardHeader>
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
              {/* ...rest of the form fields... */}
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