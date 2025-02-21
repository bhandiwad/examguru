import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { FaGoogle } from "react-icons/fa";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      // Simulate successful login
      toast({
        title: "Login Successful",
        description: "Welcome to ExamGuru!",
      });
      setLocation("/dashboard");
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Could not sign in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <Card className="w-[350px]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">ExamGuru</CardTitle>
          <CardDescription>AI-Powered Exam Generator</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full flex items-center gap-2"
          >
            <FaGoogle className="h-4 w-4" />
            {isLoading ? "Signing in..." : "Sign in with Google"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
