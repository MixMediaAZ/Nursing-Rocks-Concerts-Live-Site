import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import EventDetails from "@/pages/event-details";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import ProfilePage from "@/pages/profile";
import TicketsPage from "@/pages/tickets";
import FreeTicketsPage from "@/pages/free-tickets";
import LicenseVerificationPage from "@/pages/license-verification";
import CitiesPage from "@/pages/cities";
import CityDetailsPage from "@/pages/city-details";
import SponsorsPage from "@/pages/sponsors";
import AdminPage from "@/pages/admin";
import JobsPage from "@/pages/jobs";
import JobDetailsPage from "@/pages/job-details";
import StorePage from "@/pages/store";
import ProductDetailsPage from "@/pages/product-details";
import StoreCategoryPage from "@/pages/store-category";
import CartPage from "@/pages/cart";
import CheckoutPage from "@/pages/checkout";
import OrderConfirmationPage from "@/pages/order-confirmation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

// We use Zustand for cart management, no provider needed
import { AuthProvider } from "@/hooks/use-auth";

function Router() {
  return (
    <>
      <Header />
      <main>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/events/:id" component={EventDetails} />
          <Route path="/login" component={LoginPage} />
          <Route path="/register" component={RegisterPage} />
          {/* Redirect from old license page to new integrated registration flow */}
          <Route path="/license">
            {() => <Redirect to="/register" />}
          </Route>
          <Route path="/profile" component={ProfilePage} />
          <Route path="/tickets" component={TicketsPage} />
          <Route path="/free-tickets" component={FreeTicketsPage} />
          <Route path="/license-verification" component={LicenseVerificationPage} />
          <Route path="/cities" component={CitiesPage} />
          <Route path="/cities/:cityId" component={CityDetailsPage} />
          <Route path="/sponsors" component={SponsorsPage} />
          <Route path="/admin" component={AdminPage} />
          <Route path="/jobs" component={JobsPage} />
          <Route path="/jobs/:id" component={JobDetailsPage} />
          <Route path="/store" component={StorePage} />
          <Route path="/store/products/:id" component={ProductDetailsPage} />
          <Route path="/store/category/:category" component={StoreCategoryPage} />
          <Route path="/cart" component={CartPage} />
          <Route path="/checkout" component={CheckoutPage} />
          <Route path="/store/order-confirmation" component={OrderConfirmationPage} />
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
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
