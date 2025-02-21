import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function UploadAnswers() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);

  const upload = useMutation({
    mutationFn: async () => {
      if (!file) return;
      
      const formData = new FormData();
      formData.append("answer", file);
      
      return apiRequest("POST", "/api/attempts/upload", formData);
    },
    onSuccess: () => {
      toast({
        title: "Upload Successful",
        description: "Your answers have been submitted for evaluation"
      });
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Upload Answer Sheet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <Button 
              onClick={() => upload.mutate()}
              disabled={!file || upload.isPending}
              className="w-full"
            >
              {upload.isPending ? "Uploading..." : "Submit Answers"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
