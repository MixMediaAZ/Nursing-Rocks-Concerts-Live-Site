import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type FormValues = z.infer<typeof formSchema>;

const Newsletter = () => {
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });
  
  const subscribe = useMutation({
    mutationFn: async (values: FormValues) => {
      const res = await apiRequest("POST", "/api/subscribe", values);
      return res.json();
    },
    onSuccess: () => {
      setIsSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["/api/subscribers"] });
      toast({
        title: "Successfully subscribed!",
        description: "You'll receive our latest concert updates.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Subscription failed",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: FormValues) => {
    subscribe.mutate(values);
  };

  return (
    <section className="py-16 bg-gradient-to-r from-[#5D3FD3] to-[#FF3366] text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">Stay Connected with Nursing Rocks!</h2>
          <p className="mb-8 text-white/90">
            Subscribe to our newsletter and be the first to know about upcoming healthcare heroes concerts, presale access, special discounts for medical professionals, and exclusive offers.
          </p>
          
          {isSuccess ? (
            <div className="bg-white/20 rounded-lg p-6">
              <h3 className="font-heading text-xl font-bold mb-2">Thank You for Supporting Healthcare Heroes!</h3>
              <p>
                You'll now receive updates about our latest concerts celebrating nursing professionals.
                Get ready for amazing music while supporting the healthcare community!
              </p>
            </div>
          ) : (
            <Form {...form}>
              <form 
                onSubmit={form.handleSubmit(onSubmit)} 
                className="flex flex-col md:flex-row gap-4 max-w-xl mx-auto"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input 
                          placeholder="Your email address" 
                          className="py-3 px-6 rounded-full text-[#333333] focus:outline-none focus:ring-2 focus:ring-white/30 h-12"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-white/90 mt-1" />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  disabled={subscribe.isPending}
                  className="bg-white text-[#5D3FD3] hover:bg-white/90 font-accent font-semibold py-3 px-8 rounded-full h-12"
                >
                  {subscribe.isPending ? "Subscribing..." : "Subscribe"}
                </Button>
              </form>
            </Form>
          )}
          
          <p className="mt-4 text-sm text-white/80">
            By subscribing, you agree to receive marketing emails from us. Don't worry, we respect your privacy.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
