import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Brain, TrendingUp, Clock, Play, Pause, RefreshCw, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TrainingDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState("");

  // Queries
  const { data: feedbackStats } = trpc.feedback.getStats.useQuery({});
  const { data: trainingHistory } = trpc.feedback.getAllTrainingHistory.useQuery({ limit: 20 });
  const { data: jobsStatus } = trpc.feedback.getJobsStatus.useQuery();
  const { data: tasks } = trpc.tasks.list.useQuery();

  // Mutations
  const submitFeedbackMutation = trpc.feedback.submit.useMutation({
    onSuccess: () => {
      toast.success("Feedback submitted successfully");
      setFeedbackText("");
      setSelectedTaskId(null);
    },
    onError: (error) => {
      toast.error(`Failed to submit feedback: ${error.message}`);
    },
  });

  const triggerJobMutation = trpc.feedback.triggerJob.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(`Failed to trigger job: ${error.message}`);
    },
  });

  const enableJobMutation = trpc.feedback.enableJob.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
    },
  });

  const disableJobMutation = trpc.feedback.disableJob.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
    },
  });

  const applyTrainingMutation = trpc.feedback.applyTraining.useMutation({
    onSuccess: () => {
      toast.success("Training applied successfully");
    },
    onError: (error) => {
      toast.error(`Failed to apply training: ${error.message}`);
    },
  });

  const rollbackTrainingMutation = trpc.feedback.rollbackTraining.useMutation({
    onSuccess: () => {
      toast.success("Training rolled back successfully");
    },
    onError: (error) => {
      toast.error(`Failed to rollback training: ${error.message}`);
    },
  });

  const handleSubmitFeedback = () => {
    if (!selectedTaskId) {
      toast.error("Please select a task");
      return;
    }

    submitFeedbackMutation.mutate({
      taskId: selectedTaskId,
      rating: feedbackRating,
      feedbackText: feedbackText || undefined,
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to access the training dashboard</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Agent Training Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage automated agent training pipeline</p>
        </div>

        <Tabs defaultValue="feedback" className="space-y-6">
          <TabsList>
            <TabsTrigger value="feedback">Submit Feedback</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="training">Training History</TabsTrigger>
            <TabsTrigger value="jobs">Scheduled Jobs</TabsTrigger>
          </TabsList>

          {/* Submit Feedback Tab */}
          <TabsContent value="feedback" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Submit Task Feedback</CardTitle>
                <CardDescription>Help agents learn from your experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="task-select">Select Task</Label>
                  <Select
                    value={selectedTaskId?.toString() || ""}
                    onValueChange={(value) => setSelectedTaskId(parseInt(value))}
                  >
                    <SelectTrigger id="task-select">
                      <SelectValue placeholder="Choose a task to review" />
                    </SelectTrigger>
                    <SelectContent>
                      {tasks?.map((task) => (
                        <SelectItem key={task.id} value={task.id.toString()}>
                          {task.title} - {task.status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="rating">Rating (1-5)</Label>
                  <Select value={feedbackRating.toString()} onValueChange={(value) => setFeedbackRating(parseInt(value))}>
                    <SelectTrigger id="rating">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <SelectItem key={rating} value={rating.toString()}>
                          {rating} {rating === 5 ? "⭐⭐⭐⭐⭐" : rating === 4 ? "⭐⭐⭐⭐" : rating === 3 ? "⭐⭐⭐" : rating === 2 ? "⭐⭐" : "⭐"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="feedback-text">Feedback (Optional)</Label>
                  <Textarea
                    id="feedback-text"
                    placeholder="What did you like or dislike? How could the agent improve?"
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    rows={4}
                  />
                </div>

                <Button onClick={handleSubmitFeedback} disabled={!selectedTaskId || submitFeedbackMutation.isPending}>
                  {submitFeedbackMutation.isPending ? "Submitting..." : "Submit Feedback"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
                  <Brain className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{feedbackStats?.totalFeedback || 0}</div>
                  <p className="text-xs text-muted-foreground">Submitted by users</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{feedbackStats?.averageRating.toFixed(2) || "0.00"} / 5</div>
                  <p className="text-xs text-muted-foreground">
                    {feedbackStats?.positiveCount || 0} positive, {feedbackStats?.negativeCount || 0} negative
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Training Iterations</CardTitle>
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{trainingHistory?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">Agent improvements</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Training History Tab */}
          <TabsContent value="training" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Training History</CardTitle>
                <CardDescription>Recent agent training iterations and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trainingHistory && trainingHistory.length > 0 ? (
                    trainingHistory.map((training) => (
                      <Card key={training.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant={training.status === "applied" ? "default" : training.status === "pending" ? "secondary" : "destructive"}>
                                  {training.status}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  Agent ID: {training.agentId} | {new Date(training.createdAt).toLocaleDateString()}
                                </span>
                              </div>

                              <div className="text-sm">
                                <p className="font-medium">Feedback Count: {training.feedbackCount}</p>
                                {training.performanceBeforeTraining && (
                                  <p>Performance Before: {training.performanceBeforeTraining}/100</p>
                                )}
                                {training.performanceAfterTraining && (
                                  <p>Performance After: {training.performanceAfterTraining}/100</p>
                                )}
                              </div>

                              {training.improvementNotes && (
                                <p className="text-sm text-muted-foreground">{training.improvementNotes}</p>
                              )}
                            </div>

                            <div className="flex gap-2">
                              {training.status === "pending" && (
                                <Button size="sm" onClick={() => applyTrainingMutation.mutate({ trainingId: training.id })}>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Apply
                                </Button>
                              )}
                              {training.status === "applied" && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => rollbackTrainingMutation.mutate({ trainingId: training.id })}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Rollback
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No training history yet. Submit feedback to start training agents!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scheduled Jobs Tab */}
          <TabsContent value="jobs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Automated Training Jobs</CardTitle>
                <CardDescription>Scheduled jobs for continuous agent improvement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {jobsStatus && jobsStatus.length > 0 ? (
                    jobsStatus.map((job) => (
                      <Card key={job.name}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span className="font-medium">{job.name.replace(/_/g, " ").toUpperCase()}</span>
                                <Badge variant={job.enabled ? "default" : "secondary"}>{job.enabled ? "Enabled" : "Disabled"}</Badge>
                                <Badge variant={job.status === "idle" ? "outline" : job.status === "running" ? "default" : "destructive"}>
                                  {job.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">Schedule: {job.schedule}</p>
                              {job.lastRun && <p className="text-sm text-muted-foreground">Last Run: {new Date(job.lastRun).toLocaleString()}</p>}
                            </div>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => triggerJobMutation.mutate({ jobName: job.name })}
                                disabled={job.status === "running"}
                              >
                                <Play className="h-4 w-4 mr-1" />
                                Run Now
                              </Button>

                              {job.enabled ? (
                                <Button size="sm" variant="outline" onClick={() => disableJobMutation.mutate({ jobName: job.name })}>
                                  <Pause className="h-4 w-4 mr-1" />
                                  Disable
                                </Button>
                              ) : (
                                <Button size="sm" onClick={() => enableJobMutation.mutate({ jobName: job.name })}>
                                  <Play className="h-4 w-4 mr-1" />
                                  Enable
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No scheduled jobs configured</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
