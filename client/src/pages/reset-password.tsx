import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ResetPasswordPage() {
  const [_, setLocation] = useLocation();

  return (
    <div className="container max-w-md py-8">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">
            Password reset is not yet available. Please contact support or sign in with your existing password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center">
            If you need help accessing your account, reach out through our contact page.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="outline" onClick={() => setLocation("/login")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
