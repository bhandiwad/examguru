import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { MainChatInterface } from "@/components/MainChatInterface";

function Router() {
  return (
    <Switch>
      <Route path="/" component={MainChatInterface} />
      <Route path="*" component={MainChatInterface} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background p-4">
        <Router />
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;