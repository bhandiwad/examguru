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

export function TutorChat({ subject, grade }: { subject?: string; grade?: string }) {
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

  return (
    <Card className="flex flex-col min-h-[600px] max-h-[calc(100vh-8rem)]">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          {subject && grade ? `AI Tutor - ${subject} (Grade ${grade})` : 'ExamGuru AI Assistant'}
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
                Welcome to ExamGuru! I'm your AI assistant, ready to help with:
                {subject && grade 
                  ? `\n- Questions about ${subject}\n- Study guidance for Grade ${grade}\n- Exam preparation tips`
                  : "\n- Creating and managing exams\n- Study guidance\n- Performance analysis\n- Learning recommendations"}
              </div>
            )}
            {messages.map((message, i) => (
              <div
                key={i}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-secondary/50 shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`flex-shrink max-w-[80%] break-words ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/50"
                  } rounded-2xl px-4 py-2`}
                >
                  {message.content}
                </div>
                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary shrink-0">
                    <User className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AI assistant is thinking...</span>
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