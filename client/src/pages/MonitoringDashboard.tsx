import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  RefreshCw,
  Zap,
  Server,
  Database,
  Users,
  TrendingUp
} from "lucide-react";

interface MonitoringEvent {
  id: number;
  userId: number | null;
  eventType: string;
  severity: string;
  source: string;
  message: string;
  metadata: string | null;
  taskId: number | null;
  agentId: number | null;
  createdAt: Date;
}

const severityColors: Record<string, string> = {
  info: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  warning: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  error: "bg-red-500/10 text-red-500 border-red-500/20",
  critical: "bg-red-600/10 text-red-600 border-red-600/20",
};

const eventTypeIcons: Record<string, React.ReactNode> = {
  task_started: <Zap className="h-4 w-4" />,
  task_completed: <CheckCircle2 className="h-4 w-4" />,
  task_failed: <AlertCircle className="h-4 w-4" />,
  agent_started: <Server className="h-4 w-4" />,
  agent_completed: <CheckCircle2 className="h-4 w-4" />,
  agent_error: <AlertCircle className="h-4 w-4" />,
  memory_access: <Database className="h-4 w-4" />,
  credential_access: <Users className="h-4 w-4" />,
  session_created: <Activity className="h-4 w-4" />,
  session_restored: <RefreshCw className="h-4 w-4" />,
  system_health: <TrendingUp className="h-4 w-4" />,
  error: <AlertCircle className="h-4 w-4" />,
};

export default function MonitoringDashboard() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const { data: status, refetch: refetchStatus } = trpc.platform.monitoring.status.useQuery();
  const { data: events, refetch: refetchEvents } = trpc.platform.monitoring.events.useQuery({
    limit: 50,
  });

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      refetchStatus();
      refetchEvents();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, refetchStatus, refetchEvents]);

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Real-Time Monitoring</h1>
            <p className="text-muted-foreground">
              Live system status and event stream
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
              {autoRefresh ? "Live" : "Paused"}
            </Button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{status?.activeTasks ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                Currently processing
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{status?.completedTasksToday ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                Tasks finished successfully
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Today</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{status?.failedTasksToday ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                Tasks with errors
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{status?.activeAgents ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                Running instances
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Event Stream */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Events</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Event Stream
                </CardTitle>
                <CardDescription>
                  Real-time events from all system components
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-2">
                    {events?.map((event: MonitoringEvent) => (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="mt-0.5">
                          {eventTypeIcons[event.eventType] || <Activity className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge 
                              variant="outline" 
                              className={severityColors[event.severity] || severityColors.info}
                            >
                              {event.severity}
                            </Badge>
                            <Badge variant="secondary" className="font-mono text-xs">
                              {event.source}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(event.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm">{event.message}</p>
                          {event.metadata && (
                            <pre className="mt-2 text-xs text-muted-foreground bg-muted p-2 rounded overflow-x-auto">
                              {JSON.stringify(JSON.parse(event.metadata), null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    ))}
                    {(!events || events.length === 0) && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No events yet</p>
                        <p className="text-sm">Events will appear here as they occur</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <CardTitle>Task Events</CardTitle>
                <CardDescription>Task lifecycle events</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-2">
                    {events
                      ?.filter((e: MonitoringEvent) => e.eventType.startsWith("task_"))
                      .map((event: MonitoringEvent) => (
                        <div
                          key={event.id}
                          className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                        >
                          <div className="mt-0.5">
                            {eventTypeIcons[event.eventType]}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={severityColors[event.severity]}>
                                {event.eventType.replace("task_", "")}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatTime(event.createdAt)}
                              </span>
                            </div>
                            <p className="mt-1 text-sm">{event.message}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agents">
            <Card>
              <CardHeader>
                <CardTitle>Agent Events</CardTitle>
                <CardDescription>Agent lifecycle and activity events</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-2">
                    {events
                      ?.filter((e: MonitoringEvent) => e.eventType.startsWith("agent_"))
                      .map((event: MonitoringEvent) => (
                        <div
                          key={event.id}
                          className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                        >
                          <div className="mt-0.5">
                            {eventTypeIcons[event.eventType]}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={severityColors[event.severity]}>
                                {event.eventType.replace("agent_", "")}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatTime(event.createdAt)}
                              </span>
                            </div>
                            <p className="mt-1 text-sm">{event.message}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="errors">
            <Card>
              <CardHeader>
                <CardTitle>Errors & Warnings</CardTitle>
                <CardDescription>Issues requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-2">
                    {events
                      ?.filter((e: MonitoringEvent) => 
                        e.severity === "error" || e.severity === "critical" || e.severity === "warning"
                      )
                      .map((event: MonitoringEvent) => (
                        <div
                          key={event.id}
                          className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                        >
                          <AlertCircle className={`h-4 w-4 mt-0.5 ${
                            event.severity === "critical" ? "text-red-600" :
                            event.severity === "error" ? "text-red-500" : "text-yellow-500"
                          }`} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={severityColors[event.severity]}>
                                {event.severity}
                              </Badge>
                              <Badge variant="secondary" className="font-mono text-xs">
                                {event.source}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatTime(event.createdAt)}
                              </span>
                            </div>
                            <p className="mt-1 text-sm">{event.message}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
