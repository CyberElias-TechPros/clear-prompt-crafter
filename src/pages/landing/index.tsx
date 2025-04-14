
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, Award, Brain, Code, Crown, Lightbulb, MessageSquare, Rocket, Share2, Sparkles, Users } from "lucide-react";

const LandingPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-20 sm:py-32">
          <div className="flex flex-col items-center text-center">
            <Badge className="mb-4 bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-200">
              <Sparkles className="mr-1 h-3 w-3" />
              The Ultimate Prompt Engineering Platform
            </Badge>
            <h1 className="mb-6 max-w-4xl bg-gradient-to-r from-purple-700 to-blue-500 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl md:text-6xl">
              Create Perfect AI Prompts with Prompt-Gineer
            </h1>
            <p className="mb-8 max-w-2xl text-lg text-muted-foreground">
              Engineer, optimize and share powerful prompts that get exactly what you need from AI. Join thousands of creators unlocking AI's full potential.
            </p>
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
              {user ? (
                <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700">
                  <Link to="/">
                    Go to Dashboard 
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700">
                    <Link to="/auth">
                      Get Started Free 
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link to="/community">
                      Browse Community Prompts 
                      <Users className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Abstract shapes for visual interest */}
        <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-purple-200 opacity-50 blur-3xl dark:bg-purple-800"></div>
        <div className="absolute -right-20 bottom-10 h-60 w-60 rounded-full bg-blue-200 opacity-40 blur-3xl dark:bg-blue-800"></div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Powerful Prompt Engineering Tools</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Everything you need to create, optimize, and share AI prompts that deliver exceptional results
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Lightbulb />}
              title="Structured Prompt Builder"
              description="Create powerful prompts with our guided builder that helps you craft context, tasks, and guidelines for optimal results."
            />
            <FeatureCard
              icon={<MessageSquare />}
              title="Conversational Mode"
              description="Draft prompts naturally through conversation and refine them iteratively with our AI assistant."
            />
            <FeatureCard
              icon={<Brain />}
              title="Meta Prompting"
              description="Use our CLEAR framework to analyze and refine prompts to be more Concise, Logical, Explicit, Adaptive, and Reflective."
            />
            <FeatureCard
              icon={<Award />}
              title="Template Library"
              description="Access our growing library of prompt templates for different use cases, or create and share your own."
            />
            <FeatureCard
              icon={<Share2 />}
              title="Community Sharing"
              description="Share your prompt creations with the community and discover prompts from other engineers."
            />
            <FeatureCard
              icon={<Code />}
              title="Multi-AI Support"
              description="Use your API keys to connect with multiple AI services including OpenAI, Anthropic, Perplexity, and more."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-gradient-to-b from-purple-50 to-white py-20 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Plans for Every Prompt Engineer</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Whether you're just getting started or building advanced AI workflows, we have a plan for you
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <PricingCard
              title="Free"
              price="$0"
              description="Perfect for beginners exploring prompt engineering"
              features={[
                "Basic prompt builder",
                "Community prompt access",
                "5 AI generations per day",
                "Connect 1 AI service",
                "Basic templates"
              ]}
              buttonText="Get Started Free"
              buttonLink="/auth"
              highlighted={false}
            />
            <PricingCard
              title="Pro"
              price="$12"
              description="For serious prompt engineers and creators"
              features={[
                "Advanced prompt builder",
                "Unlimited AI generations",
                "Connect up to 5 AI services",
                "Template creation",
                "Meta prompt analysis",
                "Priority support"
              ]}
              buttonText="Upgrade to Pro"
              buttonLink="/auth"
              highlighted={true}
            />
            <PricingCard
              title="Team"
              price="$49"
              description="For teams collaborating on prompt projects"
              features={[
                "Everything in Pro",
                "Team collaboration",
                "Private prompt library",
                "Analytics and insights",
                "Advanced integrations",
                "Custom onboarding"
              ]}
              buttonText="Contact Sales"
              buttonLink="/contact"
              highlighted={false}
            />
          </div>
        </div>
      </section>

      {/* Ad Banner Section */}
      <section className="border-y bg-muted py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-medium">Want ad-free experience?</h3>
              <p className="text-muted-foreground">Upgrade to Pro or Team plan to remove ads and get unlimited access</p>
            </div>
            <Button asChild className="bg-purple-600 hover:bg-purple-700">
              <Link to="/auth">
                Upgrade Now
                <Crown className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-purple-700 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-6 text-3xl font-bold">Ready to Master Prompt Engineering?</h2>
          <p className="mx-auto mb-8 max-w-2xl text-purple-100">
            Join thousands of creators, developers, and AI enthusiasts unlocking the full power of AI with better prompts.
          </p>
          <Button asChild size="lg" variant="outline" className="border-white bg-transparent text-white hover:bg-white hover:text-purple-700">
            <Link to="/auth">
              Get Started Now 
              <Rocket className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

// Feature Card Component
const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <Card className="h-full">
    <CardHeader>
      <div className="mb-3 inline-flex rounded-lg bg-purple-100 p-3 text-purple-600 dark:bg-purple-900 dark:text-purple-200">
        {icon}
      </div>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <CardDescription className="text-base">{description}</CardDescription>
    </CardContent>
  </Card>
);

// Pricing Card Component
const PricingCard = ({ 
  title, 
  price, 
  description, 
  features, 
  buttonText, 
  buttonLink, 
  highlighted 
}: { 
  title: string, 
  price: string, 
  description: string, 
  features: string[], 
  buttonText: string, 
  buttonLink: string, 
  highlighted: boolean 
}) => (
  <Card className={`relative flex h-full flex-col ${highlighted ? 'border-purple-500 shadow-lg dark:border-purple-400' : ''}`}>
    {highlighted && (
      <div className="absolute -top-4 left-0 right-0 mx-auto w-fit rounded-full bg-purple-600 px-3 py-1 text-sm font-medium text-white">
        Most Popular
      </div>
    )}
    <CardHeader>
      <CardTitle className="text-2xl">{title}</CardTitle>
      <div className="mt-2">
        <span className="text-3xl font-bold">{price}</span>
        <span className="text-muted-foreground">/month</span>
      </div>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent className="flex-grow">
      <ul className="space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-2 h-5 w-5 text-green-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            {feature}
          </li>
        ))}
      </ul>
    </CardContent>
    <div className="p-6 pt-0">
      <Button
        asChild
        className={`w-full ${highlighted ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
        variant={highlighted ? 'default' : 'outline'}
      >
        <Link to={buttonLink}>{buttonText}</Link>
      </Button>
    </div>
  </Card>
);

export default LandingPage;
