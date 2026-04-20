import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import ArticleDetail from "./pages/ArticleDetail";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import SearchPage from "./pages/SearchPage";
import CategoryPage from "./pages/CategoryPage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { AdminArticles } from "./pages/admin/AdminArticles";
import { AdminAnalytics } from "./pages/admin/AdminAnalytics";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/article/:id"} component={ArticleDetail} />
      <Route path={"/ai"} component={() => <CategoryPage category="AI" />} />
      <Route path={"/science"} component={() => <CategoryPage category="SCIENCE" />} />
      <Route path={"/robotics"} component={() => <CategoryPage category="ROBOTICS" />} />
      <Route path={"/gadgets"} component={() => <CategoryPage category="GADGETS" />} />
      <Route path={"/register"} component={RegisterPage} />
      <Route path={"/login"} component={LoginPage} />
      <Route path={"/about"} component={AboutPage} />
      <Route path={"/contact"} component={ContactPage} />
      <Route path={"/privacy"} component={PrivacyPage} />
      <Route path={"/terms"} component={TermsPage} />
      <Route path={"/search"} component={SearchPage} />
      <Route path={"/admin/users"} component={AdminUsers} />
      <Route path={"/admin/articles"} component={AdminArticles} />
      <Route path={"/admin/analytics"} component={AdminAnalytics} />
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
