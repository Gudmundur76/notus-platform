import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Download, 
  Bell,
  Plus,
  Zap,
  Activity,
  TrendingUp,
  Bot,
  Sparkles
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Streamdown } from "streamdown";
import { useState } from "react";
import { Link } from "wouter";

export default function Dashboard() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const { data: tasks, isLoading: tasksLoading } = trpc.tasks.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: taskDetail } = trpc.tasks.get.useQuery(
    { taskId: selectedTaskId! },
    { enabled: !!selectedTaskId }
  );

  const { data: notifications } = trpc.notifications.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const markReadMutation = trpc.notifications.markRead.useMutation();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--neon-cyan)] to-[var(--neon-magenta)] flex items-center justify-center pulse-glow">
            <Zap className="w-8 h-8 text-black" />
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-[var(--neon-cyan)]" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-[var(--neon-lime)]" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-destructive" />;
      case "processing":
        return <Loader2 className="h-5 w-5 animate-spin text-[var(--neon-cyan)]" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: "bg-[var(--neon-lime)]/20 text-[var(--neon-lime)] border-[var(--neon-lime)]/30",
      failed: "bg-destructive/20 text-destructive border-destructive/30",
      processing: "bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] border-[var(--neon-cyan)]/30",
      pending: "bg-muted text-muted-foreground border-border",
    };
    return (
      <Badge variant="outline" className={styles[status] || styles.pending}>
        {status}
      </Badge>
    );
  };

  const unreadNotifications = notifications?.filter((n) => n.isRead === 0) || [];
  const completedTasks = tasks?.filter((t) => t.status === "completed").length || 0;
  const processingTasks = tasks?.filter((t) => t.status === "processing").length || 0;

  return (
    <div className="min-h-screen flex flex-col dark">
      <Header />

      <main className="flex-1 relative">
        {/* Background */}
        <div className="absolute inset-0 hero-gradient opacity-50" />
        <div className="absolute inset-0 grid-pattern" />
        
        <div className="container py-8 relative z-10">
          <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-4xl font-black mb-2">
                  Welcome back, <span className="gradient-text">{user?.name || "Agent"}</span>
                </h1>
                <p className="text-muted-foreground">Manage your AI agents and monitor task progress</p>
              </div>
              <Link href="/">
                <Button className="bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-magenta)] text-black font-bold hover:opacity-90">
                  <Plus className="w-4 h-4 mr-2" />
                  New Task
                </Button>
              </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Tasks", value: tasks?.length || 0, icon: Bot, color: "var(--neon-cyan)" },
                { label: "Completed", value: completedTasks, icon: CheckCircle2, color: "var(--neon-lime)" },
                { label: "Processing", value: processingTasks, icon: Activity, color: "var(--neon-magenta)" },
                { label: "Success Rate", value: tasks?.length ? `${Math.round((completedTasks / tasks.length) * 100)}%` : "0%", icon: TrendingUp, color: "var(--neon-purple)" },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.label} className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <Icon className="w-5 h-5" style={{ color: stat.color }} />
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                      </div>
                      <div className="text-3xl font-black" style={{ color: stat.color }}>{stat.value}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Notifications */}
            {unreadNotifications.length > 0 && (
              <Card className="bg-card/50 backdrop-blur-sm border-border/50 border-l-4 border-l-[var(--neon-orange)]">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Bell className="h-5 w-5 text-[var(--neon-orange)]" />
                    Notifications
                    <Badge className="bg-[var(--neon-orange)]/20 text-[var(--neon-orange)] border-[var(--neon-orange)]/30">
                      {unreadNotifications.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {unreadNotifications.slice(0, 3).map((notification) => (
                    <div
                      key={notification.id}
                      className="flex items-start justify-between p-3 bg-accent/30 rounded-lg border border-border/50"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{notification.title}</p>
                        <p className="text-xs text-muted-foreground">{notification.message}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => markReadMutation.mutate({ notificationId: notification.id })}
                      >
                        Dismiss
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Tasks Grid */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Tasks List */}
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[var(--neon-cyan)]" />
                    Your Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tasksLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-[var(--neon-cyan)]" />
                    </div>
                  ) : tasks && tasks.length > 0 ? (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          className={`
                            p-4 rounded-xl border cursor-pointer transition-all duration-200
                            ${selectedTaskId === task.id 
                              ? "bg-accent/50 border-[var(--neon-cyan)]/50 shadow-lg shadow-[var(--neon-cyan)]/10" 
                              : "bg-accent/20 border-border/50 hover:bg-accent/30 hover:border-border"
                            }
                          `}
                          onClick={() => setSelectedTaskId(task.id)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              {getStatusIcon(task.status)}
                              <h3 className="font-bold text-sm">{task.title}</h3>
                            </div>
                            {getStatusBadge(task.status)}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {task.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs bg-accent/50">
                              {task.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(task.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-2xl bg-accent/50 flex items-center justify-center mx-auto mb-4">
                        <Bot className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground mb-4">No tasks yet</p>
                      <Link href="/">
                        <Button variant="outline" size="sm">
                          Create Your First Task
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Task Details */}
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[var(--neon-magenta)]" />
                    Task Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedTaskId && taskDetail ? (
                    <div className="space-y-6">
                      <div className="p-4 rounded-xl bg-accent/30 border border-border/50">
                        <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">
                          Task Information
                        </h3>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Status</span>
                            {getStatusBadge(taskDetail.task?.status || "pending")}
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Type</span>
                            <Badge variant="outline" className="bg-accent/50">{taskDetail.task?.type}</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Created</span>
                            <span className="font-mono text-xs">
                              {taskDetail.task?.createdAt
                                ? new Date(taskDetail.task.createdAt).toLocaleString()
                                : "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {taskDetail.result && (
                        <div>
                          <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">
                            Result
                          </h3>
                          <div className="prose prose-sm prose-invert max-w-none bg-accent/30 p-4 rounded-xl border border-border/50">
                            <Streamdown>{taskDetail.result.content}</Streamdown>
                          </div>

                          {taskDetail.result.fileUrls && (
                            <div className="mt-4">
                              <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">
                                Generated Files
                              </h4>
                              <div className="space-y-2">
                                {JSON.parse(taskDetail.result.fileUrls).map(
                                  (url: string, index: number) => (
                                    <a
                                      key={index}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-3 p-3 rounded-lg bg-accent/30 border border-border/50 hover:border-[var(--neon-cyan)]/50 transition-colors group"
                                    >
                                      <Download className="h-5 w-5 text-[var(--neon-cyan)]" />
                                      <span className="text-sm group-hover:text-[var(--neon-cyan)] transition-colors">
                                        Download File {index + 1}
                                      </span>
                                    </a>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {taskDetail.task?.status === "processing" && (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 rounded-2xl bg-[var(--neon-cyan)]/20 flex items-center justify-center mx-auto mb-4 pulse-glow">
                            <Loader2 className="h-8 w-8 animate-spin text-[var(--neon-cyan)]" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Your agent is working on this task...
                          </p>
                        </div>
                      )}

                      {taskDetail.task?.status === "failed" && (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 rounded-2xl bg-destructive/20 flex items-center justify-center mx-auto mb-4">
                            <XCircle className="h-8 w-8 text-destructive" />
                          </div>
                          <p className="text-sm text-destructive">
                            Task processing failed. Please try again.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-2xl bg-accent/50 flex items-center justify-center mx-auto mb-4">
                        <Activity className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">Select a task to view details</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
