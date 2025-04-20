import { useState } from "react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Gift, Ticket, Users, Calendar, Clock, Trophy, Loader2, CheckCircle2 } from "lucide-react";

// Sample giveaway data (would come from API in production)
const giveaways = [
  {
    id: 1,
    title: "Nursing Rocks VIP Experience",
    description: "Win VIP tickets to an upcoming concert plus exclusive backstage access and a gift bag filled with premium merchandise.",
    image: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    sponsor: "Memorial Health Partners",
    endDate: "May 30, 2025",
    entries: 1245,
    isActive: true,
  },
  {
    id: 2,
    title: "Merchandise Bundle Giveaway",
    description: "Enter for a chance to win our complete merchandise set including limited edition t-shirts, tote bags, and other exclusive items.",
    image: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    sponsor: "City Medical Center",
    endDate: "June 15, 2025",
    entries: 852,
    isActive: true,
  },
  {
    id: 3,
    title: "Nurses Grant Program",
    description: "Apply for our grant program supporting continued education for nursing professionals. Five winners will receive $1,000 each.",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
    sponsor: "Nursing Rocks Foundation",
    endDate: "July 1, 2025",
    entries: 437,
    isActive: true,
  }
];

export function Giveaways() {
  const [selectedGiveaway, setSelectedGiveaway] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    profession: "",
    message: "",
  });
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate form
    if (!formData.name || !formData.email) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // In a real app, you would send this data to your API
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsSuccess(true);
      toast({
        title: "Entry submitted!",
        description: "Your entry has been successfully submitted. Good luck!",
      });
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "There was an error submitting your entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      profession: "",
      message: "",
    });
    setIsSuccess(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center max-w-3xl mx-auto">
        <div className="flex justify-center mb-4">
          <div className="p-2 bg-primary/10 rounded-full">
            <Gift className="h-6 w-6 text-primary" />
          </div>
        </div>
        <h2 className="text-3xl font-bold mb-2">Giveaways & Promotions</h2>
        <p className="text-muted-foreground">
          Enter our exclusive giveaways for a chance to win concert tickets, merchandise, and more. Many promotions are exclusively for nursing professionals.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {giveaways.map((giveaway) => (
          <Card key={giveaway.id} className="overflow-hidden">
            <div 
              className="h-48 bg-cover bg-center" 
              style={{ backgroundImage: `url(${giveaway.image})` }}
            >
              <div className="p-2">
                <Badge variant="secondary" className="bg-white/90 hover:bg-white">
                  {giveaway.isActive ? "Active" : "Ended"}
                </Badge>
              </div>
            </div>
            <CardHeader>
              <CardTitle>{giveaway.title}</CardTitle>
              <CardDescription className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                <span>{giveaway.entries.toLocaleString()} entries</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {giveaway.description}
              </p>
              
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span>Sponsored by {giveaway.sponsor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>Ends: {giveaway.endDate}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      setSelectedGiveaway(giveaway);
                      resetForm();
                    }}
                  >
                    <Ticket className="mr-2 h-4 w-4" />
                    Enter Giveaway
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>{selectedGiveaway?.title}</DialogTitle>
                    <DialogDescription>
                      Enter your information below to participate in this giveaway.
                    </DialogDescription>
                  </DialogHeader>

                  {isSuccess ? (
                    <div className="space-y-4 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="bg-green-100 p-3 rounded-full">
                          <CheckCircle2 className="h-10 w-10 text-green-600" />
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold">Entry Submitted!</h3>
                      <p className="text-muted-foreground">
                        Thank you for participating in our giveaway. Winners will be notified via email after the drawing.
                      </p>
                      <div className="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Ticket className="h-4 w-4" />
                          <span>Entry ID: {Math.floor(100000 + Math.random() * 900000)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          <span>Submission Date: {new Date().toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Button 
                        className="mt-4 w-full" 
                        onClick={() => setIsSuccess(false)}
                      >
                        Close
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name *</Label>
                          <Input 
                            id="name" 
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input 
                            id="email" 
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone (Optional)</Label>
                          <Input 
                            id="phone" 
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="profession">Profession (Optional)</Label>
                          <Input 
                            id="profession" 
                            name="profession"
                            placeholder="e.g. Registered Nurse"
                            value={formData.profession}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Why are you excited about this giveaway? (Optional)</Label>
                        <Textarea 
                          id="message" 
                          name="message"
                          rows={3}
                          value={formData.message}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="text-xs text-muted-foreground">
                        By submitting this form, you agree to our Terms of Service and Privacy Policy.
                        <br />
                        Nursing professionals may be given higher priority for certain giveaways.
                      </div>

                      <DialogFooter>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            "Submit Entry"
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  )}
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Separator className="my-8" />

      <div className="bg-primary/5 rounded-lg p-6 max-w-3xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-2">Are you a registered nurse?</h3>
            <p className="text-muted-foreground mb-4">
              Register as a verified nursing professional to unlock exclusive merchandise, free concert tickets, giveaways, and special promotions just for healthcare professionals.
            </p>
          </div>
          <div className="flex-shrink-0">
            <Button asChild size="lg">
              <Link href="/register">Register as a Nurse</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}