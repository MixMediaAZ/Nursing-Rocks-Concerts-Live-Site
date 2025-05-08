import { Helmet } from "react-helmet";

export default function TermsPage() {
  return (
    <>
      <Helmet>
        <title>Terms of Service - Nursing Rocks! Concert Series</title>
        <meta name="description" content="Terms of Service for Nursing Rocks! Concert Series. Please read these terms carefully before using our services." />
      </Helmet>
      
      <div className="container max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">Terms of Service</h1>
        
        <div className="prose prose-slate max-w-none">
          <p className="text-muted-foreground">Last Updated: May 5, 2025</p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4">1. Agreement to Terms</h2>
          <p>
            By accessing or using the Nursing Rocks! Concert Series website, purchasing tickets, or
            participating in any of our events, you agree to be bound by these Terms of Service.
            If you do not agree to these terms, please do not use our services.
          </p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4">2. Description of Services</h2>
          <p>
            Nursing Rocks! Concert Series provides concert experiences, merchandise, and related
            services primarily for healthcare professionals. Our services include selling tickets,
            organizing events, and providing special offers and promotions.
          </p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4">3. User Accounts</h2>
          <p>
            When you create an account with us, you must provide accurate and complete information.
            You are responsible for safeguarding your account credentials and for all activities
            that occur under your account.
          </p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4">4. Ticket Purchases and Refunds</h2>
          <p>
            All ticket sales are final unless an event is canceled or rescheduled. If an event is
            canceled, we will issue a refund for the face value of the ticket. For rescheduled events,
            tickets will typically be valid for the new date, but refunds may be offered at our discretion.
          </p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4">5. License Verification</h2>
          <p>
            For special offers available to licensed healthcare professionals, we may require verification
            of professional licenses. By submitting license information, you affirm that it is accurate
            and current. We reserve the right to deny special offers if license verification cannot be completed.
          </p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4">6. Merchandise and Orders</h2>
          <p>
            Product descriptions and images are for illustrative purposes only. We strive for accuracy
            but cannot guarantee that colors, sizes, or other details will be exactly as shown. Orders
            are subject to availability and we reserve the right to cancel orders if products become unavailable.
          </p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4">7. Privacy Policy</h2>
          <p>
            Your use of our services is also governed by our Privacy Policy, which is incorporated by reference
            into these Terms of Service. Please review our Privacy Policy to understand our practices.
          </p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4">8. Intellectual Property</h2>
          <p>
            All content on the Nursing Rocks! Concert Series website, including text, graphics, logos,
            images, and software, is the property of Nursing Rocks! or its content suppliers and is protected
            by copyright and other intellectual property laws.
          </p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4">9. Limitation of Liability</h2>
          <p>
            Nursing Rocks! Concert Series will not be liable for any direct, indirect, incidental, special,
            consequential, or punitive damages resulting from your use of or inability to use our services.
          </p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4">10. Changes to Terms</h2>
          <p>
            We may modify these Terms of Service at any time. Changes will be effective immediately upon posting.
            Your continued use of our services after changes are posted constitutes your acceptance of the modified terms.
          </p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4">11. Contact Information</h2>
          <p>
            If you have any questions about these Terms of Service, please contact us at:
            <br />
            <a href="mailto:NursingRocksConcerts@gmail.com" className="text-primary hover:underline">NursingRocksConcerts@gmail.com</a>
            <br />
            732 S 6th St, Las Vegas, NV
          </p>
        </div>
      </div>
    </>
  );
}