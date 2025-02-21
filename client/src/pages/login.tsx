import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { loginWithGoogle, auth } from "@/lib/firebase";
import { FaGoogle } from "react-icons/fa";

export default function Login() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setLocation("/dashboard");
      }
    });
    return () => unsubscribe();
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <Card className="w-[350px]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">ExamAI</CardTitle>
          <CardDescription>AI-Powered Exam Generator</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={loginWithGoogle}
            className="w-full flex items-center gap-2"
          >
            <FaGoogle className="h-4 w-4" />
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
