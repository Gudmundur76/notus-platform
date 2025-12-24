import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Brain,
  Zap,
  Shield,
  Globe,
  MessageSquare,
  Database,
  GitBranch,
  Sparkles,
  Users,
  BarChart3,
  Clock,
  Lock,
  Cpu,
  Layers,
  RefreshCw,
  Target,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Autonomous AI Agents",
    description: "Self-learning agents that continuously improve through mirror dialogues and debates.",
    badge: "Core",
  },
  {
    icon: MessageSquare,
    title: "Memory System",
    description: "Cross-session memory persistence that remembers context and learns from interactions.",
    badge: "Core",
  },
  {
    icon: GitBranch,
    title: "Mirror Agents",
    description: "Agent pairs that debate and refine knowledge through thesis-antithesis-synthesis.",
    badge: "Advanced",
  },
  {
    icon: Database,
    title: "Knowledge Core",
    description: "Centralized knowledge repository with semantic search and cross-domain insights.",
    badge: "Advanced",
  },
  {
    icon: Zap,
    title: "Task Automation",
    description: "Execute complex tasks including slides, websites, apps, and designs automatically.",
    badge: "Core",
  },
  {
    icon: RefreshCw,
    title: "Continuous Learning",
    description: "Automated training pipeline with scheduled learning jobs and performance optimization.",
    badge: "Advanced",
  },
  {
    icon: BarChart3,
    title: "Training Dashboard",
    description: "Monitor agent performance, view training history, and manage learning schedules.",
    badge: "Analytics",
  },
  {
    icon: Layers,
    title: "Knowledge Graph",
    description: "Visual exploration of knowledge connections and domain relationships.",
    badge: "Visualization",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "OAuth authentication, encrypted storage, and role-based access control.",
    badge: "Security",
  },
  {
    icon: Globe,
    title: "Multi-Domain Support",
    description: "Specialized agents for biotech, finance, legal, marketing, and technology.",
    badge: "Domains",
  },
  {
    icon: Users,
    title: "Collaboration",
    description: "Share tasks, knowledge, and insights across teams and organizations.",
    badge: "Team",
  },
  {
    icon: Cpu,
    title: "GPU Acceleration",
    description: "RunPod integration for high-performance AI inference and processing.",
    badge: "Performance",
  },
];

const capabilities = [
  {
    title: "Create Presentations",
    description: "Generate professional slide decks with AI-powered content and design.",
    icon: Sparkles,
  },
  {
    title: "Build Websites",
    description: "Create responsive web applications with modern frameworks and best practices.",
    icon: Globe,
  },
  {
    title: "Develop Apps",
    description: "Build software solutions with clean architecture and comprehensive testing.",
    icon: Cpu,
  },
  {
    title: "Design Assets",
    description: "Create visual designs, logos, and graphics with AI image generation.",
    icon: Target,
  },
];

export default function Features() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-primary/5 to-background">
          <div className="container max-w-6xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              Platform Features
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Everything you need for
              <span className="text-primary"> autonomous AI</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              A comprehensive platform for building, training, and deploying AI agents
              that learn continuously and improve over time.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg">Get Started</Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline">View Pricing</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Capabilities Section */}
        <section className="py-16 px-4">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">What can Notus do?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {capabilities.map((cap) => (
                <Card key={cap.title} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <cap.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{cap.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{cap.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">Platform Features</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              Built with quality-first approach, every feature is designed for reliability,
              scalability, and continuous improvement.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <Card key={feature.title} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <feature.icon className="h-5 w-5 text-primary" />
                      </div>
                      <Badge variant="outline">{feature.badge}</Badge>
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
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
              Join thousands of users building with autonomous AI agents.
            </p>
            <Link href="/">
              <Button size="lg">Start Building</Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
