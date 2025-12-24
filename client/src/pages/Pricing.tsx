import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Check, X, Zap, Building2, Rocket } from "lucide-react";

const plans = [
  {
    name: "Free",
    description: "Perfect for getting started",
    price: "$0",
    period: "forever",
    icon: Zap,
    features: [
      { name: "10 tasks per day", included: true },
      { name: "Basic AI agents", included: true },
      { name: "Memory system", included: true },
      { name: "Community support", included: true },
      { name: "Mirror agents", included: false },
      { name: "Knowledge graph", included: false },
      { name: "Training dashboard", included: false },
      { name: "API access", included: false },
      { name: "Priority support", included: false },
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    description: "For professionals and teams",
    price: "$29",
    period: "per month",
    icon: Rocket,
    features: [
      { name: "Unlimited tasks", included: true },
      { name: "Advanced AI agents", included: true },
      { name: "Memory system", included: true },
      { name: "Priority support", included: true },
      { name: "Mirror agents", included: true },
      { name: "Knowledge graph", included: true },
      { name: "Training dashboard", included: true },
      { name: "API access", included: true },
      { name: "Custom domains", included: false },
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    description: "For large organizations",
    price: "Custom",
    period: "contact us",
    icon: Building2,
    features: [
      { name: "Unlimited tasks", included: true },
      { name: "Advanced AI agents", included: true },
      { name: "Memory system", included: true },
      { name: "Dedicated support", included: true },
      { name: "Mirror agents", included: true },
      { name: "Knowledge graph", included: true },
      { name: "Training dashboard", included: true },
      { name: "Full API access", included: true },
      { name: "Custom domains", included: true },
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const faqs = [
  {
    question: "Can I change plans at any time?",
    answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, PayPal, and cryptocurrency (USDC, ETH, SOL).",
  },
  {
    question: "Is there a free trial?",
    answer: "Yes, Pro plan comes with a 14-day free trial. No credit card required.",
  },
  {
    question: "What happens if I exceed my task limit?",
    answer: "On the Free plan, you'll need to wait until the next day or upgrade. Pro and Enterprise have unlimited tasks.",
  },
  {
    question: "Do you offer refunds?",
    answer: "Yes, we offer a 30-day money-back guarantee for all paid plans.",
  },
  {
    question: "Can I use Notus for commercial projects?",
    answer: "Yes, all plans allow commercial use. Enterprise plan includes additional licensing options.",
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-primary/5 to-background">
          <div className="container max-w-6xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              Pricing
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Simple, transparent
              <span className="text-primary"> pricing</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your needs. Start free and scale as you grow.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-16 px-4">
          <div className="container max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {plans.map((plan) => (
                <Card 
                  key={plan.name} 
                  className={`relative hover:shadow-lg transition-shadow ${plan.popular ? 'border-primary shadow-lg' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <plan.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-6">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground ml-2">/{plan.period}</span>
                    </div>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature) => (
                        <li key={feature.name} className="flex items-center gap-2">
                          {feature.included ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className={feature.included ? '' : 'text-muted-foreground'}>
                            {feature.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full" 
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      {plan.cta}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {faqs.map((faq) => (
                <Card key={faq.question}>
                  <CardHeader>
                    <CardTitle className="text-lg">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{faq.answer}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="container max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-muted-foreground mb-8">
              Start with our free plan and upgrade when you're ready.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/">
                <Button size="lg">Start Free</Button>
              </Link>
              <Button size="lg" variant="outline">Contact Sales</Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
