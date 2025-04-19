import { useState, useEffect } from 'react';
import { useLocation } from "wouter";
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, AlertTriangle } from "lucide-react";

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render.
// This is your test publishable API key.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

// Display a warning if the Stripe key is missing
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  console.warn('Missing Stripe publishable key. Payment functionality will not work.');
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a',
    },
  },
};

type PaymentFormProps = {
  onSuccess: () => void;
  customerDetails: {
    name: string;
    email: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
};

function PaymentForm({ onSuccess, customerDetails }: PaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const { items, totalPrice } = useCart();
  const [, navigate] = useLocation();

  useEffect(() => {
    // Create a payment intent when the page loads
    if (items.length === 0) return;

    async function createPaymentIntent() {
      try {
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: items.map(item => ({
              id: item.productId,
              quantity: item.quantity,
              price: item.price
            })),
            amount: parseFloat(totalPrice) * 100, // Convert to cents
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create payment intent');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error('Error creating payment intent:', error);
        setPaymentError('Unable to initialize payment. Please try again later.');
      }
    }

    // If we don't have an API yet, simulate a successful payment
    if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
      console.log('Stripe key not found, simulating payment success');
      setClientSecret('simulated_client_secret');
      return;
    }

    createPaymentIntent();
  }, [items, totalPrice]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // If Stripe.js hasn't loaded yet or we're already processing, return
    if (!stripe || !elements || isProcessing) return;

    // If no Stripe API key, simulate success
    if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        onSuccess();
      }, 1500);
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setIsProcessing(false);
      setPaymentError('An error occurred. Please refresh and try again.');
      return;
    }

    try {
      // Use clientSecret from the PaymentIntent and the CardElement
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret!, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: customerDetails.name,
              email: customerDetails.email,
              address: {
                line1: customerDetails.address.line1,
                line2: customerDetails.address.line2,
                city: customerDetails.address.city,
                state: customerDetails.address.state,
                postal_code: customerDetails.address.postal_code,
                country: customerDetails.address.country,
              },
            },
          },
        }
      );

      if (error) {
        setPaymentError(error.message || 'An error occurred during payment processing');
      } else if (paymentIntent.status === 'succeeded') {
        toast({
          title: "Payment successful!",
          description: "Your payment has been processed successfully.",
        });
        onSuccess();
      } else {
        setPaymentError('Payment processing failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setPaymentError(err.message || 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-4">
        <label className="block mb-2 text-sm font-medium">Card Details</label>
        <div className="p-3 border rounded-md shadow-sm bg-white">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>

      {paymentError && (
        <div className="flex items-center gap-2 p-3 rounded bg-destructive/10 text-destructive text-sm">
          <AlertTriangle className="h-4 w-4" />
          {paymentError}
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Pay ${totalPrice}
          </>
        )}
      </Button>
    </form>
  );
}

export function StripePaymentForm(props: PaymentFormProps) {
  return (
    <div className="my-6">
      {stripePromise ? (
        <Elements stripe={stripePromise}>
          <PaymentForm {...props} />
        </Elements>
      ) : (
        <div className="flex items-center gap-2 p-4 rounded border border-amber-300 bg-amber-50 text-amber-800">
          <AlertTriangle className="h-5 w-5" />
          <div>
            <p className="font-medium">Payment system unavailable</p>
            <p className="text-sm">The payment system could not be initialized. Please try again later.</p>
          </div>
        </div>
      )}
    </div>
  );
}