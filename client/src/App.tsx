import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import CreateExam from "@/pages/create-exam";
import AddTemplate from "@/pages/add-template";
import ManageTemplates from "@/pages/manage-templates";
import EditTemplate from "@/pages/edit-template";
import TakeExam from "@/pages/take-exam";
import UploadAnswers from "@/pages/upload-answers";
import NotFound from "@/pages/not-found";

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
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;