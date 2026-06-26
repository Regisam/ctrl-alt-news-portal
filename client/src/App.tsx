import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { Suspense, lazy } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { RouteLoading } from "./components/RouteLoading";
import Onboarding from "./components/Onboarding";

const HomePage = lazy(() => import("./pages/HomePage"));
const ArticleDetail = lazy(() => import("./pages/ArticleDetail"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));

// Legacy pages (import fallbacks)
const Home = HomePage;
const AboutPage = lazy(() => import("./pages/AboutPage").catch(() => ({ default: HomePage })));
const ContactPage = lazy(() => import("./pages/ContactPage").catch(() => ({ default: HomePage })));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage").catch(() => ({ default: HomePage })));
const TermsPage = lazy(() => import("./pages/TermsPage").catch(() => ({ default: HomePage })));
const ShareAnalyticsDashboard = lazy(() => import("./pages/ShareAnalyticsDashboard").catch(() => ({ default: Dashboard })));
const GoogleSearchConsolePage = lazy(() => import("./pages/GoogleSearchConsolePage").catch(() => ({ default: Dashboard })));
const AnalyticsDashboardPage = lazy(() => import("./pages/AnalyticsDashboardPage").catch(() => ({ default: Dashboard })));
const ReadingListPage = lazy(() => import("./pages/ReadingListPage").catch(() => ({ default: HomePage })));
const SettingsPage = lazy(() => import("./pages/SettingsPage").catch(() => ({ default: UserProfile })));
const EngagementDashboardPage = lazy(() => import("./pages/EngagementDashboardPage").catch(() => ({ default: Dashboard })));
const ImpactReportPage = lazy(() => import("./pages/ImpactReportPage").catch(() => ({ default: Dashboard })));
const AuthorPage = lazy(() => import("./pages/AuthorPage").catch(() => ({ default: UserProfile })));
const TrendingDashboard = lazy(() => import("./pages/TrendingDashboard").catch(() => ({ default: HomePage })));
const TopicPage = lazy(() => import("./pages/TopicPage").catch(() => ({ default: HomePage })));
const RegisterPage = lazy(() => import("./pages/RegisterPage").catch(() => ({ default: HomePage })));
const LoginPage = lazy(() => import("./pages/LoginPage").catch(() => ({ default: HomePage })));
const DashboardPage = Dashboard;
const NotFound = lazy(() => import("./pages/NotFound").catch(() => ({ default: HomePage })));

function Router() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Switch>
        <Route path={"/"} component={HomePage} />
        <Route path={"/articles/:id"} component={ArticleDetail} />
        <Route path={"/article/:id"} component={ArticleDetail} />
        <Route path={"/category/:name"} component={CategoryPage} />
        <Route
          path={"/ai"}
          component={() => <CategoryPage category="AI" />}
        />
        <Route
          path={"/science"}
          component={() => <CategoryPage category="SCIENCE" />}
        />
        <Route
          path={"/robotics"}
          component={() => <CategoryPage category="ROBOTICS" />}
        />
        <Route
          path={"/gadgets"}
          component={() => <CategoryPage category="GADGETS" />}
        />
        <Route path={"/analytics"} component={ShareAnalyticsDashboard} />
        <Route path={"/search-console"} component={GoogleSearchConsolePage} />
        <Route path={"/dashboard"} component={AnalyticsDashboardPage} />
        <Route path={"/about"} component={AboutPage} />
        <Route path={"/contact"} component={ContactPage} />
        <Route path={"/privacy"} component={PrivacyPage} />
        <Route path={"/terms"} component={TermsPage} />
        <Route path={"/search"} component={SearchPage} />
        <Route path={"/profile"} component={UserProfile} />
        <Route path={"/reading-list"} component={ReadingListPage} />
        <Route path={"/settings"} component={SettingsPage} />
        <Route path={"/engagement"} component={EngagementDashboardPage} />
        <Route path={"/impact-report"} component={ImpactReportPage} />
        <Route path={"/authors/:slug"} component={AuthorPage} />
        <Route path={"/trending"} component={TrendingDashboard} />
        <Route path={"/topic/:topicId"} component={TopicPage} />
        <Route path={"/register"} component={() => <RegisterPage lang="en" />} />
        <Route path={"/login"} component={() => <LoginPage lang="en" />} />
        <Route path={"/dashboard"} component={Dashboard} />
        <Route path={"/ops/dashboard"} component={Dashboard} />
        <Route path={"/admin"} component={AdminPanel} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
          <Onboarding />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
