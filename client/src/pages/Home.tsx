import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { 
  FileText, 
  Globe, 
  Code, 
  Palette, 
  MoreHorizontal, 
  Loader2, 
  Zap, 
  Bot, 
  Sparkles,
  ArrowRight,
  Play,
  Shield,
  Cpu,
  Network,
  Brain
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "wouter";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [taskDescription, setTaskDescription] = useState("");
  const [selectedType, setSelectedType] = useState<"slides" | "website" | "app" | "design" | "general">("general");
  
  const createTaskMutation = trpc.tasks.create.useMutation({
    onSuccess: (data) => {
      toast.success("Task submitted successfully! Processing...");
      setTaskDescription("");
      window.location.href = "/dashboard";
    },
    onError: (error) => {
      toast.error(`Failed to submit task: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to submit tasks");
      window.location.href = getLoginUrl();
      return;
    }

    if (!taskDescription.trim()) {
      toast.error("Please enter a task description");
      return;
    }

    createTaskMutation.mutate({
      title: taskDescription.slice(0, 100),
      description: taskDescription,
      taskType: selectedType,
    });
  };

  const quickActions = [
    {
      icon: FileText,
      label: "Slides",
      type: "slides" as const,
      description: "Generate presentations",
      gradient: "from-[var(--neon-cyan)] to-[var(--neon-purple)]",
    },
    {
      icon: Globe,
      label: "Website",
      type: "website" as const,
      description: "Build web apps",
      gradient: "from-[var(--neon-magenta)] to-[var(--neon-orange)]",
    },
    {
      icon: Code,
      label: "Code",
      type: "app" as const,
      description: "Develop software",
      gradient: "from-[var(--neon-lime)] to-[var(--neon-cyan)]",
    },
    {
      icon: Palette,
      label: "Design",
      type: "design" as const,
      description: "Create visuals",
      gradient: "from-[var(--neon-purple)] to-[var(--neon-magenta)]",
    },
    {
      icon: MoreHorizontal,
      label: "More",
      type: "general" as const,
      description: "General tasks",
      gradient: "from-[var(--neon-orange)] to-[var(--neon-lime)]",
    },
  ];

  const features = [
    {
      icon: Bot,
      title: "Autonomous Agents",
      description: "Self-learning AI agents that evolve with your business needs",
    },
    {
      icon: Brain,
      title: "Mirror Learning",
      description: "Agents that debate and refine knowledge through dialogue",
    },
    {
      icon: Network,
      title: "Knowledge Graph",
      description: "Interconnected insights that grow smarter over time",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-grade encryption and data protection",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col dark">
      <Header />
      
      <main className="flex-1 relative">
        {/* Hero Background */}
        <div className="absolute inset-0 hero-gradient grid-pattern" />
        
        {/* Floating orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-[var(--neon-cyan)] rounded-full blur-[120px] opacity-20 float" />
        <div className="absolute bottom-40 right-10 w-96 h-96 bg-[var(--neon-magenta)] rounded-full blur-[150px] opacity-15" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-[var(--neon-purple)] rounded-full blur-[100px] opacity-10 float" style={{ animationDelay: "4s" }} />
        
        {/* Hero Section */}
        <section className="relative z-10 pt-20 pb-16 px-4">
          <div className="container max-w-6xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/50 border border-border/50 mb-8">
              <div className="w-2 h-2 rounded-full bg-[var(--neon-lime)] animate-pulse" />
              <span className="text-sm font-medium text-muted-foreground">Now in Public Beta</span>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6">
              <span className="gradient-text-animated">AI Agents</span>
              <br />
              <span className="text-foreground">That Actually Work</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12">
              Deploy autonomous AI agents that learn, adapt, and execute complex tasks. 
              No coding required. Just describe what you need.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <a href={getLoginUrl()}>
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-magenta)] text-black font-bold text-lg px-8 py-6 hover:opacity-90 transition-all hover:scale-105"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start Building Free
                </Button>
              </a>
              <Button 
                size="lg" 
                variant="outline" 
                className="font-semibold text-lg px-8 py-6 border-2 hover:bg-accent/50"
              >
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mb-20">
              {[
                { value: "10K+", label: "Active Agents" },
                { value: "99.9%", label: "Uptime" },
                { value: "50ms", label: "Avg Response" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl md:text-4xl font-black gradient-text">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Task Input Section */}
        <section className="relative z-10 py-16 px-4">
          <div className="container max-w-4xl mx-auto">
            <div className="relative">
              {/* Gradient border effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-[var(--neon-cyan)] via-[var(--neon-magenta)] to-[var(--neon-purple)] rounded-2xl blur-sm opacity-50" />
              
              <Card className="relative bg-card/80 backdrop-blur-xl border-0 shadow-2xl">
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--neon-cyan)] to-[var(--neon-magenta)] flex items-center justify-center">
                      <Zap className="w-5 h-5 text-black" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">What can I build for you?</h2>
                      <p className="text-sm text-muted-foreground">Describe your task in natural language</p>
                    </div>
                  </div>
                  
                  <Textarea
                    placeholder="e.g., Create a landing page for my SaaS startup with a hero section, features grid, and pricing table..."
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    className="min-h-[140px] text-lg resize-none bg-background/50 border-border/50 focus:border-[var(--neon-cyan)] transition-colors"
                    disabled={createTaskMutation.isPending}
                  />
                  
                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-3">
                    {quickActions.map((action) => {
                      const Icon = action.icon;
                      const isSelected = selectedType === action.type;
                      return (
                        <button
                          key={action.type}
                          onClick={() => setSelectedType(action.type)}
                          className={`
                            flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200
                            ${isSelected 
                              ? `bg-gradient-to-r ${action.gradient} text-black border-transparent` 
                              : 'bg-accent/30 border-border/50 hover:border-border text-muted-foreground hover:text-foreground'
                            }
                          `}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{action.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="flex justify-end pt-2">
                    <Button
                      size="lg"
                      onClick={handleSubmit}
                      disabled={createTaskMutation.isPending || !taskDescription.trim()}
                      className="bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-magenta)] text-black font-bold px-8 hover:opacity-90 transition-opacity"
                    >
                      {createTaskMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Deploy Agent
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="relative z-10 py-20 px-4">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black mb-4">
                <span className="gradient-text">Powered by</span> Advanced AI
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Our agents use cutting-edge technology to deliver results that exceed expectations
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card 
                    key={feature.title} 
                    className="bg-card/50 backdrop-blur-sm border-border/50 card-hover group"
                  >
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--neon-cyan)]/20 to-[var(--neon-magenta)]/20 flex items-center justify-center mb-4 group-hover:neon-glow transition-all duration-300">
                        <Icon className="w-6 h-6 text-[var(--neon-cyan)]" />
                      </div>
                      <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        {!isAuthenticated && (
          <section className="relative z-10 py-20 px-4">
            <div className="container max-w-4xl mx-auto">
              <Card className="bg-gradient-to-br from-[var(--neon-cyan)]/10 to-[var(--neon-magenta)]/10 border-border/50 overflow-hidden relative">
                <div className="absolute inset-0 grid-pattern opacity-50" />
                <CardContent className="p-12 text-center relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--neon-cyan)] to-[var(--neon-magenta)] flex items-center justify-center mx-auto mb-6">
                    <Cpu className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="text-3xl md:text-4xl font-black mb-4">
                    Ready to <span className="gradient-text">Transform</span> Your Workflow?
                  </h3>
                  <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                    Join thousands of businesses using AgentFlow to automate complex tasks and scale their operations.
                  </p>
                  <a href={getLoginUrl()}>
                    <Button 
                      size="lg" 
                      className="bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-magenta)] text-black font-bold text-lg px-10 py-6 hover:opacity-90 transition-all hover:scale-105"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      Get Started for Free
                    </Button>
                  </a>
                </CardContent>
              </Card>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
