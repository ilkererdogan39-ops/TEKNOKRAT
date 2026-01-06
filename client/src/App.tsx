import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/ThemeProvider";
import { AuthProvider } from "@/lib/AuthContext";
import Landing from "@/pages/Landing";
import AdminLogin from "@/pages/AdminLogin";
import ParticipantLogin from "@/pages/ParticipantLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import ParticipantDashboard from "@/pages/ParticipantDashboard";
import Maintenance from "@/pages/Maintenance";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/participant/login" component={ParticipantLogin} />
      <Route path="/participant/dashboard" component={ParticipantDashboard} />
      <Route path="/maintenance" component={Maintenance} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
