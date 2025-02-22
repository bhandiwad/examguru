import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { PageHeader } from "@/components/ui/page-header";
import { CURRICULA, GRADES, SUBJECTS } from "@shared/constants";

export default function EditTemplate({ params }: { params: { id: string } }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const templateId = parseInt(params.id);

  const { data: template, isLoading } = useQuery({
    queryKey: ["/api/templates", templateId],
    queryFn: async () => {
      const response = await fetch(`/api/templates/${templateId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch template");
      }
      return response.json();
    }
  });

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

  useEffect(() => {
    if (template) {
      form.reset(template);
    }
  }, [template, form]);

  const updateTemplate = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", `/api/templates/${templateId}`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update template");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({
        title: "Success",
        description: "Template updated successfully"
      });
      setLocation("/manage-templates");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  if (isLoading) {
    return <div>Loading template...</div>;
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <PageHeader title="Edit Template" />
      <Card>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => updateTemplate.mutate(data))} className="space-y-4">
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SUBJECTS.map((subject) => (
                          <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
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
                        placeholder="Describe the structure of questions"
                        {...field}
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
                disabled={updateTemplate.isPending}
              >
                {updateTemplate.isPending ? "Updating template..." : "Update Template"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
