import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { Suspense, lazy } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { RouteLoading } from "./components/RouteLoading";

const Home = lazy(() => import("./pages/Home"));
const ArticleDetail = lazy(() => import("./pages/ArticleDetail"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const ShareAnalyticsDashboard = lazy(() => import("./pages/ShareAnalyticsDashboard"));
const GoogleSearchConsolePage = lazy(() => import("./pages/GoogleSearchConsolePage"));
const AnalyticsDashboardPage = lazy(() => import("./pages/AnalyticsDashboardPage"));
const ReadingListPage = lazy(() => import("./pages/ReadingListPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const EngagementDashboardPage = lazy(() => import("./pages/EngagementDashboardPage"));
const ImpactReportPage = lazy(() => import("./pages/ImpactReportPage"));
const AuthorPage = lazy(() => import("./pages/AuthorPage"));
const TrendingDashboard = lazy(() => import("./pages/TrendingDashboard"));
const TopicPage = lazy(() => import("./pages/TopicPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

function Router() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/article/:id"} component={ArticleDetail} />
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
        <Route path={"/reading-list"} component={ReadingListPage} />
        <Route path={"/settings"} component={SettingsPage} />
        <Route path={"/engagement"} component={EngagementDashboardPage} />
        <Route path={"/impact-report"} component={ImpactReportPage} />
        <Route path={"/authors/:slug"} component={AuthorPage} />
        <Route path={"/trending"} component={TrendingDashboard} />
        <Route path={"/topic/:topicId"} component={TopicPage} />
        <Route path={"/register"} component={() => <RegisterPage lang="en" />} />
        <Route path={"/login"} component={() => <LoginPage lang="en" />} />
        <Route path={"/ops/dashboard"} component={DashboardPage} />
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
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
