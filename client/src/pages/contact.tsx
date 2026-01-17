import { Helmet } from "react-helmet";
import { Mail } from "lucide-react";

export default function ContactPage() {
  return (
    <>
      <Helmet>
        <title>Contact Us - Nursing Rocks! Concert Series</title>
        <meta name="description" content="Contact Nursing Rocks! Concert Series for questions, support, or inquiries." />
      </Helmet>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-6 md:px-8 max-w-3xl">
          <h1 className="font-heading text-3xl font-bold mb-4 text-center">Contact Us</h1>

          <div className="rounded-xl border bg-background shadow-sm p-6">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <div className="font-semibold text-foreground">Bernd Haber</div>
                <a
                  href="mailto:worldstringspromotion@gmail.com"
                  className="hover:underline text-primary"
                >
                  worldstringspromotion@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
