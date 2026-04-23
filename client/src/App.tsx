import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import './i18n';
import { Suspense, lazy } from "react";

// Static imports (critical path)
import Home from "./pages/Home";

// Lazy-loaded pages (code splitting)
const ArticleDetail = lazy(() => import("./pages/ArticleDetail"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers").then(m => ({ default: m.AdminUsers })));
const AdminArticles = lazy(() => import("./pages/admin/AdminArticles").then(m => ({ default: m.AdminArticles })));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics").then(m => ({ default: m.AdminAnalytics })));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
  </div>
);

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/article/:id"} component={() => (
        <Suspense fallback={<PageLoader />}>
          <ArticleDetail />
        </Suspense>
      )} />
      <Route path={"/ai"} component={() => (
        <Suspense fallback={<PageLoader />}>
          <CategoryPage category="AI" />
        </Suspense>
      )} />
      <Route path={"/science"} component={() => (
        <Suspense fallback={<PageLoader />}>
          <CategoryPage category="SCIENCE" />
        </Suspense>
      )} />
      <Route path={"/robotics"} component={() => (
        <Suspense fallback={<PageLoader />}>
          <CategoryPage category="ROBOTICS" />
        </Suspense>
      )} />
      <Route path={"/gadgets"} component={() => (
        <Suspense fallback={<PageLoader />}>
          <CategoryPage category="GADGETS" />
        </Suspense>
      )} />
      <Route path={"/register"} component={() => (
        <Suspense fallback={<PageLoader />}>
          <RegisterPage />
        </Suspense>
      )} />
      <Route path={"/login"} component={() => (
        <Suspense fallback={<PageLoader />}>
          <LoginPage />
        </Suspense>
      )} />
      <Route path={"/about"} component={() => (
        <Suspense fallback={<PageLoader />}>
          <AboutPage />
        </Suspense>
      )} />
      <Route path={"/contact"} component={() => (
        <Suspense fallback={<PageLoader />}>
          <ContactPage />
        </Suspense>
      )} />
      <Route path={"/privacy"} component={() => (
        <Suspense fallback={<PageLoader />}>
          <PrivacyPage />
        </Suspense>
      )} />
      <Route path={"/terms"} component={() => (
        <Suspense fallback={<PageLoader />}>
          <TermsPage />
        </Suspense>
      )} />
      <Route path={"/search"} component={() => (
        <Suspense fallback={<PageLoader />}>
          <SearchPage />
        </Suspense>
      )} />
      <Route path={"/admin/users"} component={() => (
        <Suspense fallback={<PageLoader />}>
          <AdminUsers />
        </Suspense>
      )} />
      <Route path={"/admin/articles"} component={() => (
        <Suspense fallback={<PageLoader />}>
          <AdminArticles />
        </Suspense>
      )} />
      <Route path={"/admin/analytics"} component={() => (
        <Suspense fallback={<PageLoader />}>
          <AdminAnalytics />
        </Suspense>
      )} />
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
