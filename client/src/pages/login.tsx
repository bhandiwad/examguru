import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { loginWithGoogle, auth } from "@/lib/firebase";
import { FaGoogle } from "react-icons/fa";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log("Setting up auth state listener");
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log("Auth state changed:", user ? `User logged in: ${user.email}` : "No user");
      if (user) {
        console.log("Redirecting to dashboard...");
        setLocation("/dashboard");
      }
    });
    return () => {
      console.log("Cleaning up auth state listener");
      unsubscribe();
    };
  }, [setLocation]);

  const handleLogin = async () => {
    console.log("Login button clicked");
    setIsLoading(true);
    try {
      console.log("Starting Google sign-in process");
      await loginWithGoogle();
      console.log("Google sign-in successful");
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessage = "Could not sign in with Google. Please try again.";

      if (error.code === 'auth/popup-blocked') {
        errorMessage = "Please allow popups for this website to sign in with Google.";
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = "This domain is not authorized. Please ensure you've added it to Firebase console.";
      }

      toast({
        title: "Login Failed",
        description: errorMessage,
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
          <CardTitle className="text-2xl font-bold">ExamAI</CardTitle>
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