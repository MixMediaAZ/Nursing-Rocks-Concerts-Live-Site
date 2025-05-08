import { Helmet } from "react-helmet";

export default function PrivacyPage() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy - Nursing Rocks! Concert Series</title>
        <meta name="description" content="Privacy Policy for Nursing Rocks! Concert Series. Learn how we collect, use, and protect your personal information." />
      </Helmet>
      
      <div className="container max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">Privacy Policy</h1>
        
        <div className="prose prose-slate max-w-none">
          <p className="text-muted-foreground">Last Updated: May 5, 2025</p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4">1. Introduction</h2>
          <p>
            Nursing Rocks! Concert Series ("we," "our," or "us") is committed to protecting your privacy.
            This Privacy Policy explains how we collect, use, and safeguard your information when you use
            our website, purchase tickets, or participate in our events.
          </p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4">2. Information We Collect</h2>
          <p>
            We may collect the following types of information:
          </p>
          <ul className="list-disc pl-6 my-4">
            <li><strong>Personal Information:</strong> Name, email address, phone number, and billing address when you create an account or make a purchase.</li>
            <li><strong>Professional Information:</strong> Nursing license numbers and related details for verification purposes when you request professional discounts.</li>
            <li><strong>Payment Information:</strong> Credit card details or other payment information when you make purchases (note: we do not store complete credit card information on our servers).</li>
            <li><strong>Usage Data:</strong> Information about how you interact with our website, including browsing history, clicks, and time spent on pages.</li>
            <li><strong>Device Information:</strong> Information about your device, operating system, browser type, and IP address.</li>
          </ul>
          
          <h2 className="text-xl font-semibold mt-8 mb-4">3. How We Use Your Information</h2>
          <p>
            We use your information for the following purposes:
          </p>
          <ul className="list-disc pl-6 my-4">
            <li>To provide and maintain our services</li>
            <li>To process transactions and send related information</li>
            <li>To verify professional credentials for special offers</li>
            <li>To send administrative information, such as updates, security alerts, and support messages</li>
            <li>To respond to your comments, questions, and requests</li>
            <li>To personalize your experience and deliver content relevant to your interests</li>
            <li>To improve our website and develop new products and services</li>
            <li>To monitor and analyze usage patterns</li>
            <li>To detect, prevent, and address technical issues</li>
          </ul>
          
          <h2 className="text-xl font-semibold mt-8 mb-4">4. Sharing Your Information</h2>
          <p>
            We may share your information with:
          </p>
          <ul className="list-disc pl-6 my-4">
            <li><strong>Service Providers:</strong> Third-party vendors who help us operate our business, such as payment processors, email delivery services, and hosting providers.</li>
            <li><strong>Event Partners:</strong> Venues and performers involved in events you attend.</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights.</li>
          </ul>
          <p>
            We do not sell your personal information to third parties for marketing purposes.
          </p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4">5. Data Security</h2>
          <p>
            We implement appropriate security measures to protect your personal information. However,
            no method of transmission over the Internet or electronic storage is 100% secure, and we
            cannot guarantee absolute security.
          </p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4">6. Your Rights</h2>
          <p>
            Depending on your location, you may have certain rights regarding your personal information, including:
          </p>
          <ul className="list-disc pl-6 my-4">
            <li>Access to your personal information</li>
            <li>Correction of inaccurate or incomplete information</li>
            <li>Deletion of your personal information</li>
            <li>Withdrawal of consent</li>
            <li>Object to or restrict the processing of your information</li>
          </ul>
          <p>
            To exercise these rights, please contact us using the information provided below.
          </p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4">7. Cookies and Tracking Technologies</h2>
          <p>
            We use cookies and similar tracking technologies to collect and track information about your
            browsing activities. You can set your browser to refuse cookies, but this may limit your ability
            to use some features of our website.
          </p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4">8. Children's Privacy</h2>
          <p>
            Our services are not directed to individuals under the age of 18. We do not knowingly collect
            personal information from children. If you are a parent or guardian and believe your child has
            provided us with personal information, please contact us.
          </p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4">9. Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting
            the new Privacy Policy on this page and updating the "Last Updated" date.
          </p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4">10. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at:
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