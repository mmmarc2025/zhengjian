import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Candidates from "./pages/Candidates";
import CandidateDetail from "./pages/CandidateDetail";
import News from "./pages/News";
import Compare from "./pages/Compare";
import Admin from "./pages/Admin";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/candidates"} component={Candidates} />
      <Route path={"/candidate/:id"} component={CandidateDetail} />
      <Route path={"/news"} component={News} />
      <Route path={"/compare"} component={Compare} />
      <Route path={"/admin"} component={Admin} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
