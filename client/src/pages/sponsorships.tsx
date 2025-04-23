import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function SponsorshipsPage() {
  // Sponsorship tiers from the PDF
  const sponsorshipTiers = [
    {
      id: 'marquee',
      name: 'Marquee Sponsorship',
      price: '$250,000.00',
      description: 'Premium tier sponsorship with maximum brand exposure across the Nursing Rocks! Concert Series.',
      benefits: [
        'Branding – Marquee Logo Above "Nursing Rocks!" Logo on All Branding for Designated City',
        'Website – Primary Sponsor Branding for Designated City, Job Board Postings, Company Website Link on "Our Sponsors" for Designated City',
        'Banners – Company Logo on All Event Banners (Physical & Digital)',
        'Outreach – Company Logo and Website Link on All Email Campaigns for Designated City',
        'V.I.P. Experience – 100 V.I.P. Tickets Specifically for Your Company',
        'Tickets – Receive 40% of All Tickets for Event',
        'Social Media – Company# on All Social Media Postings for Designated City',
        'Promotion – Highlighted on All Nursing Rocks! Concert Series Merchandise and Promotions (T-Shirt, Socks, etc.) for Designated City',
        'Employee Red Carpet – Red Carpet V.I.P. Arrival for All Employees & Guests'
      ]
    },
    {
      id: 'premium',
      name: 'Premium Sponsorship',
      price: '$125,000.00',
      description: 'High-visibility sponsorship with significant brand presence at Nursing Rocks! events.',
      benefits: [
        'Branding – Secondary Logo Below "Nursing Rocks!" Logo on All Branding for Designated City',
        'Website – Secondary Sponsor Branding for Designated City, Job Board Postings, Company Website Link on "Our Sponsors" for Designated City',
        'Banner – Company Logo on All Event Banners (Physical & Digital)',
        'Outreach – Company Logo and Website Link on All Email Campaigns for Designated City',
        'V.I.P. Experience – 50 V.I.P. Tickets Specifically for Your Company',
        'Tickets – Receive 20% of All Tickets for Event',
        'Social Media – Company# on All Social Media Postings for Designated City',
        'Promotion – Highlighted on All Nursing Rocks! Concert Series Merchandise and Promotions (T-Shirt, Socks, etc.) for Designated City',
        'Employee Red Carpet – Red Carpet V.I.P. Arrival for All Employees & Guests'
      ]
    },
    {
      id: 'silent-auction',
      name: 'Silent Auction Sponsorship',
      price: '$25,000.00',
      description: 'Exclusive sponsorship of the Silent Auction portion of Nursing Rocks! events.',
      benefits: [
        'Branding – Logo on "Nursing Rocks! Silent Auction" (Branding for Designated City)',
        'Website – Silent Auction Sponsorship Branding for Designated City, Company Website Link on "Our Sponsors" for Designated City',
        'Banner – Company Logo on All Silent Auction Event Banners (Physical & Digital) for Designated City',
        'V.I.P. Experience – 10 V.I.P. Tickets Specifically for Your Company including Event T-Shirts and Lanyards'
      ]
    },
    {
      id: 'silent-auction-participant',
      name: 'Silent Auction Participation (Fundraiser)',
      price: '$1,500.00',
      description: 'Participate in the Silent Auction with your products or services to support healthcare professionals.',
      benefits: [
        '$1000.00 Worth of Products, Services or Items Required',
        'Presentation Table, Table Skirt, Digital Scrolling Banner',
        'Website – Silent Auction Participant Branding for Designated City on Website',
        'V.I.P. Experience – 4 V.I.P. Tickets Specifically for Your Company including Event T-Shirts and Lanyards'
      ]
    }
  ];

  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Nursing Rocks! Sponsorships</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Support healthcare professionals and gain valuable brand exposure by sponsoring
          the Nursing Rocks! Concert Series. Choose from our range of sponsorship packages.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 mb-16">
        {sponsorshipTiers.map((tier) => (
          <Card key={tier.id} className="group overflow-hidden transition-all border-2 hover:border-primary">
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <CardDescription className="text-lg mt-1">{tier.description}</CardDescription>
                </div>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-primary">{tier.price}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <h3 className="font-semibold text-lg mb-3">Benefits Include:</h3>
              <ul className="space-y-2">
                {tier.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <div className="mr-2 mt-1 h-4 w-4 flex-shrink-0 rounded-full bg-primary"></div>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <Separator />
            <CardFooter className="pt-6 pb-4">
              <Button className="w-full" size="lg">
                Become a {tier.name.split(' ')[0]} Sponsor
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="bg-muted rounded-xl p-8 mb-12">
        <h2 className="text-2xl font-bold mb-4">Custom Sponsorship Opportunities</h2>
        <p className="mb-6">
          Looking for a customized sponsorship package? We can create a bespoke sponsorship
          opportunity tailored to your organization's specific needs and goals.
        </p>
        <Button variant="outline" size="lg">
          Contact Us for Custom Sponsorships
        </Button>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Become Part of Something Special</h2>
        <p className="text-muted-foreground max-w-3xl mx-auto mb-8">
          By sponsoring Nursing Rocks! Concert Series, you're not just gaining valuable brand exposure – 
          you're supporting an incredible community of healthcare professionals who have dedicated 
          their lives to caring for others.
        </p>
        <Button variant="default" size="lg">Download Sponsorship Prospectus</Button>
      </div>
    </div>
  );
}