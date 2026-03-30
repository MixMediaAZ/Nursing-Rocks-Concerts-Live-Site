import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Music, Calendar, MapPin, Star, Loader2 } from "lucide-react";

const registrationSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100).trim(),
  lastName: z.string().min(1, "Last name is required").max(100).trim(),
  email: z.string().email("Please enter a valid email address").toLowerCase().trim(),
  employer: z.string().max(255).optional(),
});

type RegistrationForm = z.infer<typeof registrationSchema>;

export default function PhoenixRegisterPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const form = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: { firstName: "", lastName: "", email: "", employer: "" },
  });

  const onSubmit = async (data: RegistrationForm) => {
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/nrpx/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      let json;
      try {
        json = await res.json();
      } catch {
        // If response isn't JSON, create a default error object
        json = { success: false, message: "Invalid response from server" };
      }

      if (res.ok && json.success) {
        setStatus("success");
        setMessage(json.message || "Check your email for your ticket!");
      } else {
        setStatus("error");
        setMessage(json.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      setStatus("error");
      const message = err instanceof Error ? err.message : "Network error. Please check your connection and try again.";
      setMessage(message);
    }
  };

  if (status === "success") {
    return (
      <>
        <Helmet>
          <title>Registered! — Nursing Rocks Phoenix</title>
        </Helmet>
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md text-center space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 p-6">
                <CheckCircle2 className="h-16 w-16 text-green-600" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">You're in! 🎸</h1>
              <p className="mt-2 text-lg text-gray-600">
                Check your email for your QR ticket.
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 text-left space-y-3">
              <p className="font-semibold text-gray-800 text-center mb-4">Event Details</p>
              <div className="flex items-center gap-3 text-gray-700">
                <Calendar className="h-5 w-5 text-red-500 flex-shrink-0" />
                <span>Friday, May 16, 2026</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <MapPin className="h-5 w-5 text-red-500 flex-shrink-0" />
                <a href="https://walterstudios.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">The Walter Studio, Phoenix, AZ</a>
              </div>
              <div className="space-y-2">
                <p className="flex items-center gap-3 text-gray-700 font-semibold">
                  <Music className="h-5 w-5 text-red-500 flex-shrink-0" />
                  Featuring:
                </p>
                <ul className="ml-8 space-y-1 text-gray-700">
                  <li>The Black Moods</li>
                  <li>The Central Line</li>
                  <li>Jane 'N The Jungle</li>
                  <li>PsychoStar</li>
                  <li>My Upside Down + Casual Alien</li>
                  <li>Oppsie Daisey</li>
                </ul>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Didn't get the email? Check your spam folder or{" "}
              <button
                onClick={() => setStatus("idle")}
                className="text-blue-600 underline hover:no-underline"
              >
                register again
              </button>
              .
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Register — Nursing Rocks Phoenix 2026</title>
        <meta name="description" content="Register for free tickets to Nursing Rocks Phoenix — Friday, May 16, 2026 at The Walter Studio." />
      </Helmet>

      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
        {/* Hero */}
        <div className="text-center mb-8 max-w-lg">
          <div className="flex justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 leading-tight">
            Nursing Rocks Phoenix
          </h1>

          <div className="mt-6 w-full bg-white rounded-lg p-6 space-y-4 shadow-sm border border-gray-200">
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">Friday, May 16, 2026</p>
              <p className="text-lg text-gray-700">The Walter Studio, Phoenix AZ</p>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p className="font-semibold text-gray-800 text-center mb-3">Featuring:</p>
              <p className="text-gray-700 text-center whitespace-nowrap overflow-x-auto" style={{ fontSize: '0.625rem', lineHeight: '1rem' }}>
                The Black Moods, The Central Line, Jane 'N The Jungle, PsychoStar, My Upside Down + Casual Alien and Oppsie Daisey
              </p>
            </div>

            <p className="text-center text-sm text-gray-600 pt-2">
              A free concert for nurses 🤘
            </p>
          </div>
        </div>

        {/* Form */}
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-center">Claim Your Free Ticket</CardTitle>
            <CardDescription className="text-center">
              For registered nurses. Limited to 500 tickets — first come, first served.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    placeholder="Jane"
                    autoComplete="given-name"
                    disabled={status === "loading"}
                    {...form.register("firstName")}
                  />
                  {form.formState.errors.firstName && (
                    <p className="text-xs text-red-600">{form.formState.errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    placeholder="Smith"
                    autoComplete="family-name"
                    disabled={status === "loading"}
                    {...form.register("lastName")}
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-xs text-red-600">{form.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jane@hospital.com"
                  autoComplete="email"
                  disabled={status === "loading"}
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-red-600">{form.formState.errors.email.message}</p>
                )}
                <p className="text-xs text-gray-500">Your QR ticket will be sent here.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="employer">Employer <span className="text-gray-400">(optional)</span></Label>
                <Input
                  id="employer"
                  placeholder="Banner Health, HonorHealth…"
                  autoComplete="organization"
                  disabled={status === "loading"}
                  {...form.register("employer")}
                />
              </div>

              {status === "error" && (
                <Alert variant="destructive" className="py-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold"
                disabled={status === "loading"}
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering…
                  </>
                ) : (
                  "Get My Free Ticket 🎸"
                )}
              </Button>

              <p className="text-center text-xs text-gray-500">
                By registering you confirm you are a licensed nurse. Benefiting Gateway Community College Scholarships.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
