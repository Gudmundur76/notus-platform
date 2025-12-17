import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Globe, Code, Palette, MoreHorizontal, Loader2 } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Streamdown } from "streamdown";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [taskDescription, setTaskDescription] = useState("");
  const [selectedType, setSelectedType] = useState<"slides" | "website" | "app" | "design" | "general">("general");
  
  const createTaskMutation = trpc.tasks.create.useMutation({
    onSuccess: (data) => {
      toast.success("Task submitted successfully! Processing...");
      setTaskDescription("");
      // Redirect to dashboard to view task
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
      label: "Create slides",
      type: "slides" as const,
      description: "Generate presentations",
    },
    {
      icon: Globe,
      label: "Build website",
      type: "website" as const,
      description: "Create web applications",
    },
    {
      icon: Code,
      label: "Develop apps",
      type: "app" as const,
      description: "Build software solutions",
    },
    {
      icon: Palette,
      label: "Design",
      type: "design" as const,
      description: "Create visual designs",
    },
    {
      icon: MoreHorizontal,
      label: "More",
      type: "general" as const,
      description: "General AI assistance",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 flex flex-col items-center justify-center py-12 px-4">
        <div className="w-full max-w-4xl space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              What can I do for you?
            </h1>
            <p className="text-lg text-muted-foreground">
              AI-powered assistance for any task
            </p>
          </div>

          {/* Task Input */}
          <Card className="border-2 shadow-lg">
            <CardContent className="p-6 space-y-4">
              <Textarea
                placeholder="Assign a task or ask anything"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                className="min-h-[120px] text-lg resize-none"
                disabled={createTaskMutation.isPending}
              />
              <div className="flex justify-end">
                <Button
                  size="lg"
                  onClick={handleSubmit}
                  disabled={createTaskMutation.isPending || !taskDescription.trim()}
                >
                  {createTaskMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Submit Task"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Card
                  key={action.type}
                  className={`cursor-pointer transition-all hover:shadow-md hover:scale-105 ${
                    selectedType === action.type ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedType(action.type)}
                >
                  <CardContent className="p-6 flex flex-col items-center text-center space-y-2">
                    <Icon className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-semibold text-sm">{action.label}</p>
                      <p className="text-xs text-muted-foreground hidden md:block">
                        {action.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Feature Highlight */}
          {!isAuthenticated && (
            <Card className="bg-muted/50">
              <CardContent className="p-6 text-center space-y-4">
                <h3 className="text-xl font-semibold">Get Started with AI Assistance</h3>
                <p className="text-muted-foreground">
                  Sign in to submit tasks and access your AI-powered assistant
                </p>
                <a href={getLoginUrl()}>
                  <Button size="lg">Sign In to Continue</Button>
                </a>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
