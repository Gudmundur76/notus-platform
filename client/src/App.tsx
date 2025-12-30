import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import MirrorAgents from "./pages/MirrorAgents";
import TrainingDashboard from "./pages/TrainingDashboard";
import Dashboard from "./pages/Dashboard";
import Memory from "./pages/Memory";
import Features from "./pages/Features";
import Resources from "./pages/Resources";
import Events from "./pages/Events";
import Pricing from "./pages/Pricing";
import Careers from "./pages/Careers";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Blog from "./pages/Blog";
import BlogArticle from "./pages/BlogArticle";
import ApiDocs from "./pages/ApiDocs";
import MonitoringDashboard from "./pages/MonitoringDashboard";
import SessionManager from "./pages/SessionManager";
import CredentialsVault from "./pages/CredentialsVault";
import DeploymentManager from "./pages/DeploymentManager";
import SkillsMarketplace from "./pages/SkillsMarketplace";
import SkillDetail from "./pages/SkillDetail";
import MySkills from "./pages/MySkills";
import CreateSkill from "./pages/CreateSkill";
import Webhooks from "./pages/Webhooks";
import MemoryAnalytics from "./pages/MemoryAnalytics";
import CommunityDashboard from "./pages/CommunityDashboard";
import SenateChamber from "./pages/SenateChamber";
import SharedHistory from "./pages/SharedHistory";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Lazy load KnowledgeGraph to avoid AFRAME dependency issue on initial load
const KnowledgeGraph = lazy(() => import("./pages/KnowledgeGraph"));

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      {/* Main Pages */}
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      
      {/* AI Features */}
      <Route path={"/memory"} component={Memory} />
      <Route path={"/memory/analytics"} component={MemoryAnalytics} />
      <Route path={"/mirror-agents"} component={MirrorAgents} />
      <Route path="/knowledge-graph">
        <Suspense fallback={<LoadingFallback />}>
          <KnowledgeGraph />
        </Suspense>
      </Route>
      <Route path="/training" component={TrainingDashboard} />
      
      {/* Platform Tools */}
      <Route path="/monitoring" component={MonitoringDashboard} />
      <Route path="/sessions" component={SessionManager} />
      <Route path="/credentials" component={CredentialsVault} />
      <Route path="/deployments" component={DeploymentManager} />
      <Route path="/webhooks" component={Webhooks} />
      
      {/* Community of Equals */}
      <Route path="/community" component={CommunityDashboard} />
      <Route path="/senate" component={SenateChamber} />
      <Route path="/history" component={SharedHistory} />
      
      {/* Skills System */}
      <Route path="/skills" component={SkillsMarketplace} />
      <Route path="/skills/my" component={MySkills} />
      <Route path="/skills/create" component={CreateSkill} />
      <Route path="/skills/:slug" component={SkillDetail} />
      
      {/* Marketing Pages */}
      <Route path="/features" component={Features} />
      <Route path="/resources" component={Resources} />
      <Route path="/events" component={Events} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/careers" component={Careers} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogArticle} />
      
      {/* Documentation */}
      <Route path="/api-docs" component={ApiDocs} />
      
      {/* Legal */}
      <Route path="/privacy" component={PrivacyPolicy} />
      
      {/* Error Pages */}
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
