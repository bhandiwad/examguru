import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Share2, Mail, Check, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import type { AttemptWithExam } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface SharePerformanceProps {
  attempts: AttemptWithExam[];
}

export function SharePerformanceInsights({ attempts }: SharePerformanceProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const shareByEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("POST", "/api/share/performance", {
        attemptIds: attempts.map(a => a.id),
        shareMethod: "email",
        recipientEmail: email
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Performance insights shared",
        description: "An email has been sent to the specified address.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to share insights",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const generateShareLinkMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/share/performance", {
        attemptIds: attempts.map(a => a.id),
        shareMethod: "link"
      });
      return res.json();
    },
    onSuccess: (data) => {
      navigator.clipboard.writeText(data.shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Link copied to clipboard",
        description: "Share this link with parents or guardians",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to generate link",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleEmailShare = () => {
    const email = prompt("Enter parent/guardian's email address:");
    if (email) {
      shareByEmailMutation.mutate(email);
    }
  };

  const handleCopyLink = () => {
    generateShareLinkMutation.mutate();
  };

  if (!attempts.length) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={handleEmailShare}
        disabled={shareByEmailMutation.isPending}
      >
        <Mail className="h-4 w-4" />
        Share via Email
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={handleCopyLink}
        disabled={generateShareLinkMutation.isPending}
      >
        {copied ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
        Copy Share Link
      </Button>
    </div>
  );
}
