import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Plus, Search } from "lucide-react";
import type { QuestionTemplate } from "@shared/schema";

export default function ManageTemplates() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: templates, isLoading } = useQuery<QuestionTemplate[]>({
    queryKey: ["/api/templates"],
    queryFn: async () => {
      const response = await fetch("/api/templates");
      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }
      return response.json();
    }
  });

  const filteredTemplates = templates?.filter(template => {
    const searchString = `${template.curriculum} ${template.subject} ${template.grade} ${template.institution || ''} ${template.paperFormat || ''}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <PageHeader title="Question Paper Templates" />
        <Link href="/add-template">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add New Template
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center">Loading templates...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates?.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{template.institution || 'Generic Template'}</CardTitle>
                    <CardDescription>{template.paperFormat}</CardDescription>
                  </div>
                  <Link href={`/edit-template/${template.id}`}>
                    <Button variant="ghost" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div><strong>Curriculum:</strong> {template.curriculum}</div>
                  <div><strong>Subject:</strong> {template.subject}</div>
                  <div><strong>Grade:</strong> {template.grade}</div>
                  <div><strong>Type:</strong> {template.type}</div>
                  {template.formatMetadata && typeof template.formatMetadata === 'object' && (
                    <>
                      <div><strong>Total Marks:</strong> {(template.formatMetadata as any).totalMarks}</div>
                      <div><strong>Duration:</strong> {(template.formatMetadata as any).duration} minutes</div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredTemplates?.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground">
              No templates found. Try adjusting your search or <Link href="/add-template" className="text-primary">create a new template</Link>.
            </div>
          )}
        </div>
      )}
    </div>
  );
}