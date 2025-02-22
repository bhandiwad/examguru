import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, User, Bot, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Message {
  role: "user" | "assistant";
  content: string;
  action?: {
    type: "create_template" | "create_exam" | "view_performance" | "help";
    data?: any;
  };
}

export function MainChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Welcome to ExamGuru! I can help you with:
      - Creating question templates
      - Generating exams from templates
      - Viewing performance analytics
      - Getting personalized learning assistance
      
      What would you like to do?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      try {
        setError(null);
        const response = await apiRequest("POST", "/api/chat/command", {
          message,
          history: messages.slice(-10) // Send last 10 messages for context
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

  // Format message content with code blocks, lists, and actions
  const formatMessage = (message: Message) => {
    let content = message.content;

    // Split content by code blocks and other formatting
    const parts = content.split(/(```[\s\S]*?```)|(\n- .*)/g);
    
    return parts.map((part, index) => {
      if (!part) return null;
      
      if (part.startsWith("```") && part.endsWith("```")) {
        const code = part.slice(3, -3).replace(/^[a-z]+\n/, '');
        return (
          <pre key={index} className="bg-muted p-4 rounded-md my-2 overflow-x-auto">
            <code>{code}</code>
          </pre>
        );
      }
      
      if (part.startsWith("\n- ")) {
        return (
          <li key={index} className="ml-4">
            {part.slice(3)}
          </li>
        );
      }
      
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Bot className="h-5 w-5" />
          ExamGuru AI Assistant
        </h2>
      </div>
      <div className="flex-1 flex flex-col p-0 overflow-hidden">
        {error && (
          <Alert variant="destructive" className="m-4 mb-0">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <ScrollArea className="flex-1">
          <div className="space-y-4 p-4">
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
                      <Bot className="w-4 h-4" />
                    )}
                  </div>
                  <div
                    className={`rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/50"
                    }`}
                  >
                    {formatMessage(message)}

                    {message.action && message.role === "assistant" && (
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => {
                            // Handle action click based on type
                            console.log("Action clicked:", message.action);
                          }}
                        >
                          {message.action.type === "create_template" && "Create Template"}
                          {message.action.type === "create_exam" && "Generate Exam"}
                          {message.action.type === "view_performance" && "View Performance"}
                          {message.action.type === "help" && "Show Help"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
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
        <form onSubmit={handleSubmit} className="p-4 mt-auto border-t">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
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
          </div>
        </form>
      </div>
    </div>
  );
}