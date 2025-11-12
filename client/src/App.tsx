import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import BureauConfig from "./pages/BureauConfig";
import BureauMetrics from "./pages/BureauMetrics";
import Dashboard from "./pages/Dashboard";
import Tenants from "./pages/Tenants";
import Models from "./pages/Models";
import Predictions from "./pages/Predictions";
import DriftMonitoring from "./pages/DriftMonitoring";
import History from "./pages/History";
import PredictionDetails from "./pages/PredictionDetails";
import AIGenerative from "./pages/AIGenerative";
import FraudPrevention from "./pages/FraudPrevention";
import BankingAsService from "./pages/BankingAsService";
import Profile from "./pages/Profile";
import BatchUpload from "./pages/BatchUpload";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/bureau-config"} component={BureauConfig} />
      <Route path={"/bureau-metrics"} component={BureauMetrics} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/404"} component={NotFound} />
      <Route path={"/tenants"} component={Tenants} />
      <Route path={"/models"} component={Models} />
      <Route path={"/predictions"} component={Predictions} />
      <Route path={"/drift"} component={DriftMonitoring} />
      <Route path={"/history"} component={History} />
      <Route path={"/predictions/:id"} component={PredictionDetails} />
      <Route path={"/ai-generative"} component={AIGenerative} />
      <Route path={"/fraud-prevention"} component={FraudPrevention} />
      <Route path={"/baas"} component={BankingAsService} />
        <Route path="/profile" component={Profile} />
      <Route path="/batch-upload" component={BatchUpload} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
