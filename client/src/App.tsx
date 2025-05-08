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
import DashboardPage from "@/pages/dashboard";
import TicketsPage from "@/pages/tickets";
import FreeTicketsPage from "@/pages/free-tickets";
import LicenseVerificationPage from "@/pages/license-verification";
import CitiesPage from "@/pages/cities";
import CityDetailsPage from "@/pages/city-details";
import SponsorsPage from "@/pages/sponsors";
import AdminPage from "@/pages/admin";
import JobsPage from "@/pages/jobs";
import JobDetailsPage from "@/pages/job-details";
import GalleryPage from "@/pages/gallery";
import VideosPage from "@/pages/videos";
import StorePage from "@/pages/store";
import ProductDetailsPage from "@/pages/product-details";
import StoreCategoryPage from "@/pages/store-category";
import CartPage from "@/pages/cart";
import CheckoutPage from "@/pages/checkout";
import OrderConfirmationPage from "@/pages/order-confirmation";
import DemoReplacePage from "@/pages/demo-replace";
import SponsorshipsPage from "@/pages/sponsorships";
import EditDemoPage from "@/pages/edit-demo-page";
import ProductSyncPage from "@/pages/product-sync";
import UploadUtilityPage from "@/pages/upload-utility";

// Import the pages that were previously lazy loaded
import TermsPage from "@/pages/terms";
import PrivacyPage from "@/pages/privacy";
import FAQPage from "@/pages/faq";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AdminEditingProvider } from "@/components/admin/admin-editing-provider";
import { FloatingAdminControl } from "@/components/admin/floating-admin-control";

// We use Zustand for cart management, no provider needed
import { AuthProvider } from "@/hooks/use-auth";

function Router() {
  // Use window.location to check if we're on the admin page
  const isAdminPage = window.location.pathname === '/admin';
  
  return (
    <>
      {!isAdminPage && <Header />}
      <main className="page-container content-wrapper">
        <div className="w-full max-w-6xl mx-auto">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/admin" component={AdminPage} />
            <Route path="/events/:id" component={EventDetails} />
            <Route path="/login" component={LoginPage} />
            <Route path="/register" component={RegisterPage} />
            {/* Redirect from old license page to new integrated registration flow */}
            <Route path="/license">
              {() => <Redirect to="/register" />}
            </Route>
            <Route path="/profile" component={ProfilePage} />
            <Route path="/dashboard" component={DashboardPage} />
            <Route path="/tickets" component={TicketsPage} />
            <Route path="/free-tickets" component={FreeTicketsPage} />
            <Route path="/license-verification" component={LicenseVerificationPage} />
            <Route path="/cities" component={CitiesPage} />
            <Route path="/cities/:cityId" component={CityDetailsPage} />
            <Route path="/sponsors" component={SponsorsPage} />
            <Route path="/sponsorships" component={SponsorshipsPage} />
            <Route path="/jobs" component={JobsPage} />
            <Route path="/jobs/:id" component={JobDetailsPage} />
            <Route path="/gallery" component={GalleryPage} />
            <Route path="/videos" component={VideosPage} />
            <Route path="/store" component={StorePage} />
            <Route path="/store/products/:id" component={ProductDetailsPage} />
            <Route path="/store/category/:category" component={StoreCategoryPage} />
            <Route path="/cart" component={CartPage} />
            <Route path="/checkout" component={CheckoutPage} />
            <Route path="/store/order-confirmation" component={OrderConfirmationPage} />
            <Route path="/demo-replace" component={DemoReplacePage} />
            <Route path="/edit-demo" component={EditDemoPage} />
            <Route path="/admin/product-sync" component={ProductSyncPage} />
            <Route path="/upload-utility" component={UploadUtilityPage} />
            {/* Legal and information pages */}
            <Route path="/terms" component={TermsPage} />
            <Route path="/privacy" component={PrivacyPage} />
            <Route path="/faq" component={FAQPage} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
      {!isAdminPage && <Footer />}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AdminEditingProvider>
          <Router />
          <FloatingAdminControl />
          <Toaster />
        </AdminEditingProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
