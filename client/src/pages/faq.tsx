import { Helmet } from "react-helmet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function FAQPage() {
  return (
    <>
      <Helmet>
        <title>Frequently Asked Questions - Nursing Rocks! Concert Series</title>
        <meta name="description" content="Find answers to common questions about Nursing Rocks! Concert Series, tickets, events, and more." />
      </Helmet>
      
      <div className="container max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h1>
        
        <p className="text-center text-muted-foreground mb-8">
          Find answers to common questions about Nursing Rocks! Concert Series.
          If you don't see your question here, please <a href="mailto:NursingRocksConcerts@gmail.com" className="text-primary hover:underline">contact us</a>.
        </p>
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>What is Nursing Rocks! Concert Series?</AccordionTrigger>
            <AccordionContent>
              Nursing Rocks! Concert Series is a special event series celebrating healthcare professionals through the power of music. 
              We host concerts across the country featuring renowned artists, with special benefits and free tickets for verified nursing professionals.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-2">
            <AccordionTrigger>How do I get tickets to concerts?</AccordionTrigger>
            <AccordionContent>
              Nursing professionals can receive free tickets by registering on our site and verifying their nursing credentials. 
              General admission tickets are also available for purchase for friends and family of nurses. 
              Visit our <Link href="/register"><span className="text-primary hover:underline">registration page</span></Link> to get started.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-3">
            <AccordionTrigger>How does the nursing license verification work?</AccordionTrigger>
            <AccordionContent>
              During registration, you'll be prompted to enter your nursing license number and state. 
              Our system will verify this information against state licensing databases. 
              This process typically takes 1-2 business days. Once verified, you'll receive an email 
              confirmation and be eligible for free concert tickets and special promotions.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-4">
            <AccordionTrigger>Where can I buy Nursing Rocks! merchandise?</AccordionTrigger>
            <AccordionContent>
              Our official merchandise is available through our online store at <a href="https://rgwrvu-sq.myshopify.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">rgwrvu-sq.myshopify.com</a>. 
              We offer a variety of nursing-themed apparel, accessories, and collectibles. 
              A portion of all merchandise sales goes to support healthcare scholarships.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-5">
            <AccordionTrigger>What cities host Nursing Rocks! concerts?</AccordionTrigger>
            <AccordionContent>
              We currently host concerts in several major cities across the United States, including 
              Las Vegas, Chicago, Dallas, Atlanta, and more. Visit our <Link href="/cities"><span className="text-primary hover:underline">cities page</span></Link> to 
              see our current and upcoming concert locations.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-6">
            <AccordionTrigger>Can I submit my own video of appreciation?</AccordionTrigger>
            <AccordionContent>
              Yes! We encourage nursing professionals to share their stories and experiences. 
              You can upload your video of appreciation through our <a href="https://nursingrocksconcerts3.replit.app/thanks" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">video upload page</a>. 
              Selected videos may be featured on our website and during concert events.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-7">
            <AccordionTrigger>Are there refunds if I can't attend a concert?</AccordionTrigger>
            <AccordionContent>
              For free nursing professional tickets, we ask that you notify us at least 48 hours in advance if you cannot attend 
              so we can offer your ticket to another nursing professional. For purchased tickets, our refund policy allows for 
              refunds up to 7 days before the event. After that, tickets are non-refundable but can be transferred to another person.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-8">
            <AccordionTrigger>How can my organization become a sponsor?</AccordionTrigger>
            <AccordionContent>
              We offer various sponsorship opportunities for organizations that want to support and connect with healthcare professionals. 
              Sponsorship packages include brand visibility at events, digital promotion, and VIP experiences. 
              Visit our <Link href="/sponsorships"><span className="text-primary hover:underline">sponsorships page</span></Link> or contact us at 
              <a href="mailto:NursingRocksConcerts@gmail.com" className="text-primary hover:underline ml-1">NursingRocksConcerts@gmail.com</a> for more information.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-9">
            <AccordionTrigger>How can I stay updated on upcoming concerts and events?</AccordionTrigger>
            <AccordionContent>
              The best way to stay informed is to subscribe to our newsletter and follow us on social media. 
              We regularly post updates about upcoming concerts, special promotions, and featured artists. 
              You can also check our website's home page for the latest announcements.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-10">
            <AccordionTrigger>I'm an artist interested in performing. Who should I contact?</AccordionTrigger>
            <AccordionContent>
              We're always looking for talented artists who are passionate about supporting healthcare heroes through music. 
              Please send your information, including links to your music and performance history, to 
              <a href="mailto:NursingRocksConcerts@gmail.com" className="text-primary hover:underline ml-1">NursingRocksConcerts@gmail.com</a>.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        <div className="mt-12 text-center">
          <h2 className="text-xl font-semibold mb-4">Still have questions?</h2>
          <p className="text-muted-foreground mb-6">
            We're here to help. Contact our support team for assistance.
          </p>
          <Button asChild>
            <a href="mailto:NursingRocksConcerts@gmail.com">Contact Support</a>
          </Button>
        </div>
      </div>
    </>
  );
}