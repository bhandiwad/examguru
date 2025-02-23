import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TutorChat } from "@/components/TutorChat";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Bot } from "lucide-react";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import CreateExam from "@/pages/create-exam";
import AddTemplate from "@/pages/add-template";
import ManageTemplates from "@/pages/manage-templates";
import EditTemplate from "@/pages/edit-template";
import TakeExam from "@/pages/take-exam";
import UploadAnswers from "@/pages/upload-answers";
import NotFound from "@/pages/not-found";

const ChatButton = () => (
  <Dialog>
    <DialogTrigger asChild>
      <Button 
        size="lg" 
        className="fixed bottom-4 right-4 rounded-full w-14 h-14 p-0 shadow-lg hover:shadow-xl transition-shadow"
      >
        <Bot className="w-6 h-6" />
      </Button>
    </DialogTrigger>
    <DialogContent className="max-w-[90vw] w-[800px] h-[90vh] p-0 overflow-hidden">
      <TutorChat />
    </DialogContent>
  </Dialog>
);

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/create" component={CreateExam} />
      <Route path="/add-template" component={AddTemplate} />
      <Route path="/manage-templates" component={ManageTemplates} />
      <Route path="/edit-template/:id" component={EditTemplate} />
      <Route path="/take/:id" component={TakeExam} />
      <Route path="/upload" component={UploadAnswers} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <Router />
        <ChatButton />
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;