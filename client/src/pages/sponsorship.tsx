import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle, Loader2, Heart } from 'lucide-react';
import { z } from 'zod';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

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

const sponsorshipSchema = z.object({
  amountCents: z.number().int().min(100).max(500000000),
  tier: z.enum(['marquee', 'premium', 'silent-auction', 'donation', 'custom']),
  donor_name: z.string().trim().min(1).max(200),
  donor_email: z.string().trim().email(),
  is_anonymous: z.boolean(),
  company_name: z.string().optional().default(''),
  message: z.string().optional().default(''),
});

type SponsorshipFormData = z.infer<typeof sponsorshipSchema>;

const PRESET_AMOUNTS = [
  { label: '$10', cents: 1000 },
  { label: '$50', cents: 5000 },
  { label: '$100', cents: 10000 },
  { label: '$500', cents: 50000 },
  { label: '$1,000', cents: 100000 },
  { label: '$5,000', cents: 500000 },
  { label: '$10,000', cents: 1000000 },
];

function SponsorshipForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [formData, setFormData] = useState<Partial<SponsorshipFormData>>({
    donor_name: '',
    donor_email: '',
    is_anonymous: false,
    company_name: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleAmountSelect = (cents: number) => {
    setSelectedAmount(cents);
    setCustomAmount('');
    setErrors({ ...errors, amountCents: '' });
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomAmount(value);
    if (value) {
      setSelectedAmount(null);
    }
    setErrors({ ...errors, amountCents: '' });
  };

  const handleFormChange = (field: keyof SponsorshipFormData, value: any) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: '' });
  };

  const getAmountCents = (): number => {
    if (selectedAmount) return selectedAmount;
    if (customAmount) {
      const cents = Math.round(parseFloat(customAmount) * 100);
      return cents > 0 ? cents : 0;
    }
    return 0;
  };

  const validateAndPrepareData = (): SponsorshipFormData | null => {
    const amountCents = getAmountCents();

    const data = {
      amountCents,
      tier: amountCents > 500000 ? 'marquee' : amountCents > 100000 ? 'premium' : 'donation',
      donor_name: formData.donor_name || '',
      donor_email: formData.donor_email || '',
      is_anonymous: formData.is_anonymous || false,
      company_name: formData.company_name || '',
      message: formData.message || '',
    };

    try {
      return sponsorshipSchema.parse(data);
    } catch (error: any) {
      const newErrors: Record<string, string> = {};
      error.errors?.forEach((err: any) => {
        newErrors[err.path[0]] = err.message;
      });
      setErrors(newErrors);
      return null;
    }
  };

  const handlePaymentIntent = async (data: SponsorshipFormData) => {
    try {
      const response = await fetch('/api/sponsorship/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountCents: data.amountCents,
          tier: data.tier,
          donor_name: data.donor_name,
          donor_email: data.donor_email,
          is_anonymous: data.is_anonymous,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create payment intent');
      }

      const result = await response.json();
      setClientSecret(result.clientSecret);
      setPaymentIntentId(result.paymentIntentId);
      return result;
    } catch (error: any) {
      setPaymentError(error.message || 'Failed to initialize payment');
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);
    setErrors({});

    const validatedData = validateAndPrepareData();
    if (!validatedData) return;

    setIsProcessing(true);

    try {
      // Create payment intent
      const intentResult = await handlePaymentIntent(validatedData);
      if (!intentResult) {
        setIsProcessing(false);
        return;
      }

      // If no Stripe key (development mode), skip card processing
      if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
        // Confirm payment with simulated success
        const confirmResponse = await fetch('/api/sponsorship/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId: intentResult.paymentIntentId,
            donor_name: validatedData.donor_name,
            donor_email: validatedData.donor_email,
            tier: validatedData.tier,
            is_anonymous: validatedData.is_anonymous,
            amountCents: validatedData.amountCents,
            message: validatedData.message,
            company_name: validatedData.company_name,
          }),
        });

        if (!confirmResponse.ok) {
          throw new Error('Failed to confirm payment');
        }

        setIsSuccess(true);
        toast({
          title: 'Success!',
          description: 'Thank you for your sponsorship!',
        });
        return;
      }

      // Process payment with Stripe
      if (!stripe || !elements) {
        throw new Error('Stripe not initialized');
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        setPaymentError(error.message || 'Payment failed');
        setIsProcessing(false);
        return;
      }

      // Confirm card payment
      const confirmResult = await stripe.confirmCardPayment(intentResult.clientSecret, {
        payment_method: paymentMethod?.id,
      });

      if (confirmResult.error) {
        setPaymentError(confirmResult.error.message || 'Payment failed');
        setIsProcessing(false);
        return;
      }

      if (confirmResult.paymentIntent?.status === 'succeeded') {
        // Confirm on backend
        const backendConfirm = await fetch('/api/sponsorship/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId: intentResult.paymentIntentId,
            donor_name: validatedData.donor_name,
            donor_email: validatedData.donor_email,
            message: validatedData.message,
            company_name: validatedData.company_name,
          }),
        });

        if (!backendConfirm.ok) {
          throw new Error('Failed to confirm sponsorship');
        }

        setIsSuccess(true);
        toast({
          title: 'Success!',
          description: 'Thank you for your sponsorship!',
        });
      }
    } catch (error: any) {
      setPaymentError(error.message || 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-12 pb-8">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
              <p className="text-gray-600 mb-6">
                Your sponsorship has been received. We appreciate your support in making our nursing events special.
              </p>
              <Button asChild className="w-full">
                <a href="/">Return to Home</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-red-500" />
              Support Our Mission
            </CardTitle>
            <CardDescription>
              Help us empower nurses through live music, education, and community support
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Amount Selection */}
              <div>
                <label className="block text-sm font-medium mb-3">Select Amount</label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-4">
                  {PRESET_AMOUNTS.map((preset) => (
                    <button
                      key={preset.cents}
                      type="button"
                      onClick={() => handleAmountSelect(preset.cents)}
                      className={`p-2 rounded text-sm font-semibold transition-colors ${
                        selectedAmount === preset.cents
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <span className="text-sm font-medium py-2">Custom:</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="1"
                    max="50000"
                    placeholder="Amount in dollars"
                    value={customAmount}
                    onChange={handleCustomAmountChange}
                    className="flex-1"
                  />
                </div>
                {errors.amountCents && (
                  <p className="text-red-500 text-sm mt-1">{errors.amountCents}</p>
                )}
              </div>

              {/* Donor Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Your Information</h3>
                <Input
                  type="text"
                  placeholder="Full Name or Organization"
                  value={formData.donor_name || ''}
                  onChange={(e) => handleFormChange('donor_name', e.target.value)}
                  className={errors.donor_name ? 'border-red-500' : ''}
                />
                {errors.donor_name && (
                  <p className="text-red-500 text-sm">{errors.donor_name}</p>
                )}

                <Input
                  type="email"
                  placeholder="Email Address"
                  value={formData.donor_email || ''}
                  onChange={(e) => handleFormChange('donor_email', e.target.value)}
                  className={errors.donor_email ? 'border-red-500' : ''}
                />
                {errors.donor_email && (
                  <p className="text-red-500 text-sm">{errors.donor_email}</p>
                )}

                <Input
                  type="text"
                  placeholder="Company/Organization (Optional)"
                  value={formData.company_name || ''}
                  onChange={(e) => handleFormChange('company_name', e.target.value)}
                />

                <textarea
                  placeholder="Message of support (Optional)"
                  value={formData.message || ''}
                  onChange={(e) => handleFormChange('message', e.target.value)}
                  className="w-full p-2 border rounded text-sm resize-none"
                  rows={3}
                />
              </div>

              {/* Anonymous Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={formData.is_anonymous || false}
                  onChange={(e) => handleFormChange('is_anonymous', e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="anonymous" className="text-sm">
                  Make this donation anonymous (will not appear on sponsors list)
                </label>
              </div>

              {/* Payment Card */}
              {clientSecret && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <label className="block text-sm font-medium mb-2">Card Details</label>
                  <CardElement options={CARD_ELEMENT_OPTIONS} />
                </div>
              )}

              {/* Error Message */}
              {paymentError && (
                <div className="flex gap-2 p-4 rounded-lg bg-red-50 border border-red-200">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-900">Payment Failed</h4>
                    <p className="text-red-700 text-sm">{paymentError}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isProcessing || !stripe}
                className="w-full h-12 bg-gradient-to-r from-[#F61D7A] to-[#FF3366] hover:from-[#FF3366] hover:to-[#F61D7A]"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Complete Sponsorship'
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Your payment information is secure and encrypted
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SponsorshipPage() {
  return (
    <Elements stripe={stripePromise}>
      <SponsorshipForm />
    </Elements>
  );
}
