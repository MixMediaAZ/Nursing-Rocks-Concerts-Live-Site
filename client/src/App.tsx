import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import EventDetails from "@/pages/event-details";
import LicensePage from "@/pages/license";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

function Router() {
  return (
    <>
      <Header />
      <main>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/events/:id" component={EventDetails} />
          <Route path="/license" component={LicensePage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </>
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
