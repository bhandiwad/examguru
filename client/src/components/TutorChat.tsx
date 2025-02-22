import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, User, MessageSquare, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function TutorChat({ subject, grade }: { subject: string; grade: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      try {
        setError(null);
        const response = await apiRequest("POST", "/api/chat", {
          message,
          subject,
          grade,
          history: messages
        });
        return response.json();
      } catch (error: any) {
        setError(error.message || "Failed to send message. Please try again.");
        throw error;
      }
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, data]);
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message || "Failed to send message. Please try again.");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage: Message = {
      role: "user",
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate(input);
    setInput("");
  };

  // Format code blocks and mathematical expressions
  const formatMessage = (content: string) => {
    // Split content by code blocks (if any)
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        // Remove the backticks and language identifier
        const code = part.slice(3, -3).replace(/^[a-z]+\n/, '');
        return (
          <pre key={index} className="bg-muted p-4 rounded-md my-2 overflow-x-auto">
            <code>{code}</code>
          </pre>
        );
      }
      // Format inline math expressions (e.g., $x^2$)
      return part.split(/(\$[^$]+\$)/g).map((text, mathIndex) => {
        if (text.startsWith('$') && text.endsWith('$')) {
          return (
            <span key={`${index}-${mathIndex}`} className="font-mono text-primary">
              {text.slice(1, -1)}
            </span>
          );
        }
        return <span key={`${index}-${mathIndex}`}>{text}</span>;
      });
    });
  };

  return (
    <Card className="flex flex-col min-h-[600px] max-h-[calc(100vh-8rem)]">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          AI Tutor - {subject} (Grade {grade})
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        {error && (
          <Alert variant="destructive" className="m-4 mb-0">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <ScrollArea className="flex-1 h-full px-4">
          <div className="space-y-4 py-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                Ask me anything about {subject}! I'm here to help you learn and understand better.
              </div>
            )}
            {messages.map((message, i) => (
              <div
                key={i}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex gap-3 max-w-[80%] ${
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      message.role === "user" ? "bg-primary" : "bg-secondary"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="w-4 h-4 text-primary-foreground" />
                    ) : (
                      <MessageSquare className="w-4 h-4" />
                    )}
                  </div>
                  <div
                    className={`rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/50"
                    }`}
                  >
                    {formatMessage(message.content)}
                  </div>
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AI tutor is thinking...</span>
              </div>
            )}
          </div>
        </ScrollArea>
        <form onSubmit={handleSubmit} className="flex gap-2 p-4 mt-auto border-t">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your question..."
            disabled={chatMutation.isPending}
            className="flex-1"
          />
          <Button type="submit" disabled={chatMutation.isPending}>
            {chatMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Sending...
              </>
            ) : (
              'Send'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}