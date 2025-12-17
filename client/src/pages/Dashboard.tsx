import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Clock, Download, Bell } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Streamdown } from "streamdown";
import { useState } from "react";

export default function Dashboard() {
  const { isAuthenticated, loading: authLoading } = useAuth();
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
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
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "processing":
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      failed: "destructive",
      processing: "secondary",
      pending: "outline",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const unreadNotifications = notifications?.filter((n) => n.isRead === 0) || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">Manage your AI tasks and view results</p>
            </div>
            <Button onClick={() => (window.location.href = "/")}>New Task</Button>
          </div>

          {/* Notifications */}
          {unreadNotifications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications ({unreadNotifications.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {unreadNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-semibold">{notification.title}</p>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markReadMutation.mutate({ notificationId: notification.id })}
                    >
                      Mark Read
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Tasks Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Tasks List */}
            <Card>
              <CardHeader>
                <CardTitle>Your Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                {tasksLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : tasks && tasks.length > 0 ? (
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          selectedTaskId === task.id ? "ring-2 ring-primary" : ""
                        }`}
                        onClick={() => setSelectedTaskId(task.id)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(task.status)}
                            <h3 className="font-semibold">{task.title}</h3>
                          </div>
                          {getStatusBadge(task.status)}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {task.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{task.taskType}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(task.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No tasks yet. Create your first task!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Task Details */}
            <Card>
              <CardHeader>
                <CardTitle>Task Details</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedTaskId && taskDetail ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Task Information</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          {getStatusBadge(taskDetail.task?.status || "pending")}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <Badge variant="outline">{taskDetail.task?.taskType}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Created:</span>
                          <span>
                            {taskDetail.task?.createdAt
                              ? new Date(taskDetail.task.createdAt).toLocaleString()
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {taskDetail.result && (
                      <div>
                        <h3 className="font-semibold mb-2">Result</h3>
                        <div className="prose prose-sm max-w-none bg-muted p-4 rounded-lg">
                          <Streamdown>{taskDetail.result.content}</Streamdown>
                        </div>

                        {taskDetail.result.fileUrls && (
                          <div className="mt-4">
                            <h4 className="font-semibold mb-2">Generated Files</h4>
                            {JSON.parse(taskDetail.result.fileUrls).map(
                              (url: string, index: number) => (
                                <div key={index} className="flex items-center gap-2 mb-2">
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-primary hover:underline"
                                  >
                                    <Download className="h-4 w-4" />
                                    Download File {index + 1}
                                  </a>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {taskDetail.task?.status === "processing" && (
                      <div className="text-center py-4">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Your task is being processed...
                        </p>
                      </div>
                    )}

                    {taskDetail.task?.status === "failed" && (
                      <div className="text-center py-4 text-destructive">
                        <XCircle className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">Task processing failed. Please try again.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Select a task to view details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
