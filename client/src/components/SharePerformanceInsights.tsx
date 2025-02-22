import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Share2, Mail, Check, Copy, Loader2 } from "lucide-react";
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
      if (!attempts.length) {
        throw new Error("Please complete at least one exam before sharing results");
      }

      const res = await apiRequest("POST", "/api/share/performance", {
        attemptIds: attempts.map(a => a.id),
        shareMethod: "email",
        recipientEmail: email
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to share via email");
      }

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
      if (!attempts.length) {
        throw new Error("Please complete at least one exam before sharing results");
      }

      const res = await apiRequest("POST", "/api/share/performance", {
        attemptIds: attempts.map(a => a.id),
        shareMethod: "link"
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to generate share link");
      }

      const data = await res.json();
      if (!data.shareLink) {
        throw new Error("No share link received from server");
      }

      return data;
    },
    onSuccess: async (data) => {
      try {
        // Try using the modern Clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(data.shareLink);
        } else {
          // Fallback for older browsers or non-HTTPS contexts
          const textArea = document.createElement("textarea");
          textArea.value = data.shareLink;
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          textArea.style.top = "-999999px";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();

          try {
            document.execCommand('copy');
          } finally {
            textArea.remove();
          }
        }

        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
          title: "Link copied to clipboard",
          description: "Share this link with parents or guardians",
        });
      } catch (error) {
        console.error('Copy failed:', error);
        // Show the link in the toast so users can copy manually
        toast({
          title: "Couldn't copy automatically",
          description: `Please copy this link manually: ${data.shareLink}`,
          variant: "destructive",
        });
      }
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
      if (!email.includes('@')) {
        toast({
          title: "Invalid email",
          description: "Please enter a valid email address",
          variant: "destructive",
        });
        return;
      }
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
        {shareByEmailMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Mail className="h-4 w-4" />
        )}
        Share via Email
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={handleCopyLink}
        disabled={generateShareLinkMutation.isPending}
      >
        {generateShareLinkMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : copied ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
        Copy Share Link
      </Button>
    </div>
  );
}