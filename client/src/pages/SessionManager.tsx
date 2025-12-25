import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  Clock, 
  Download,
  FileText,
  History,
  Plus,
  RefreshCw,
  Save,
  Upload,
  Layers,
  ArrowRight
} from "lucide-react";

export default function SessionManager() {
  const [newSessionName, setNewSessionName] = useState("");
  const [newSessionDesc, setNewSessionDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  // Handoff document state
  const [handoffTitle, setHandoffTitle] = useState("");
  const [handoffOverview, setHandoffOverview] = useState("");
  const [handoffProgress, setHandoffProgress] = useState("");
  const [handoffNextSteps, setHandoffNextSteps] = useState("");

  const utils = trpc.useUtils();
  
  const { data: sessions, isLoading: sessionsLoading } = trpc.platform.sessions.list.useQuery();
  const { data: handoffs, isLoading: handoffsLoading } = trpc.platform.handoffs.list.useQuery();
  
  const createSession = trpc.platform.sessions.create.useMutation({
    onSuccess: () => {
      toast.success("Session created", { description: "Your session state has been saved." });
      utils.platform.sessions.list.invalidate();
      setNewSessionName("");
      setNewSessionDesc("");
      setIsCreating(false);
    },
    onError: (error) => {
      toast.error("Error", { description: error.message });
    }
  });

  const restoreSession = trpc.platform.sessions.restore.useMutation({
    onSuccess: (data) => {
      toast.success("Session restored", { 
        description: `Restored ${data.memories.length} memories and ${data.tasks.length} tasks.` 
      });
    },
    onError: (error) => {
      toast.error("Error", { description: error.message });
    }
  });

  const createHandoff = trpc.platform.handoffs.create.useMutation({
    onSuccess: () => {
      toast.success("Handoff document created", { description: "Ready for the next session." });
      utils.platform.handoffs.list.invalidate();
      setHandoffTitle("");
      setHandoffOverview("");
      setHandoffProgress("");
      setHandoffNextSteps("");
    },
    onError: (error) => {
      toast.error("Error", { description: error.message });
    }
  });

  const { refetch: exportDataRefetch } = trpc.platform.sessions.export.useQuery(undefined, {
    enabled: false,
  });
  
  const handleExport = async () => {
    const result = await exportDataRefetch();
    if (result.data) {
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `notus-session-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export complete", { description: "Your session data has been downloaded." });
    }
  };
  
  // Placeholder for backward compatibility
  const exportData = {
    mutate: handleExport,
    isPending: false
  };
  


  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Session Manager</h1>
            <p className="text-muted-foreground">
              Save, restore, and hand off session context across conversations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => exportData.mutate()}>
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Save Session
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Current Session</DialogTitle>
                  <DialogDescription>
                    Create a snapshot of your current session state including memories and active tasks.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Session Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Project Alpha - Phase 2"
                      value={newSessionName}
                      onChange={(e) => setNewSessionName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="What were you working on?"
                      value={newSessionDesc}
                      onChange={(e) => setNewSessionDesc(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => createSession.mutate({ 
                      name: newSessionName, 
                      description: newSessionDesc 
                    })}
                    disabled={!newSessionName || createSession.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Session
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="sessions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="sessions">
              <History className="h-4 w-4 mr-2" />
              Sessions
            </TabsTrigger>
            <TabsTrigger value="handoffs">
              <FileText className="h-4 w-4 mr-2" />
              Handoff Documents
            </TabsTrigger>
            <TabsTrigger value="create-handoff">
              <Plus className="h-4 w-4 mr-2" />
              Create Handoff
            </TabsTrigger>
          </TabsList>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sessionsLoading ? (
                <Card className="col-span-full">
                  <CardContent className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </CardContent>
                </Card>
              ) : sessions?.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <Layers className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold">No saved sessions</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Save your current session to continue later
                    </p>
                  </CardContent>
                </Card>
              ) : (
                sessions?.map((session) => (
                  <Card 
                    key={session.sessionId} 
                    className={`cursor-pointer transition-all ${
                      selectedSession === session.sessionId 
                        ? "ring-2 ring-primary" 
                        : "hover:shadow-md"
                    }`}
                    onClick={() => setSelectedSession(
                      selectedSession === session.sessionId ? null : session.sessionId
                    )}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{session.name}</CardTitle>
                        <Badge variant={session.isActive ? "default" : "secondary"}>
                          {session.isActive ? "Active" : "Archived"}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(session.createdAt)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {session.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {session.description}
                        </p>
                      )}
                    </CardContent>
                    {selectedSession === session.sessionId && (
                      <CardFooter className="pt-0">
                        <Button 
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            restoreSession.mutate({ sessionId: session.sessionId });
                          }}
                          disabled={restoreSession.isPending}
                        >
                          <RefreshCw className={`h-4 w-4 mr-2 ${restoreSession.isPending ? "animate-spin" : ""}`} />
                          Restore Session
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Handoff Documents Tab */}
          <TabsContent value="handoffs" className="space-y-4">
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {handoffsLoading ? (
                  <Card>
                    <CardContent className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    </CardContent>
                  </Card>
                ) : handoffs?.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                      <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="font-semibold">No handoff documents</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Create a handoff document to prepare for your next session
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  handoffs?.map((handoff) => (
                    <Card key={handoff.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle>{handoff.title}</CardTitle>
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(handoff.generatedAt)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Project Overview</h4>
                          <p className="text-sm text-muted-foreground">{handoff.projectOverview}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Current Progress</h4>
                          <p className="text-sm text-muted-foreground">{handoff.currentProgress}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Next Steps</h4>
                          <p className="text-sm text-muted-foreground">{handoff.nextSteps}</p>
                        </div>
                        {handoff.keyDecisions && (
                          <div>
                            <h4 className="font-semibold text-sm mb-1">Key Decisions</h4>
                            <ul className="text-sm text-muted-foreground list-disc list-inside">
                              {JSON.parse(handoff.keyDecisions).map((decision: string, i: number) => (
                                <li key={i}>{decision}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {handoff.blockers && (
                          <div>
                            <h4 className="font-semibold text-sm mb-1 text-yellow-600">Blockers</h4>
                            <ul className="text-sm text-muted-foreground list-disc list-inside">
                              {JSON.parse(handoff.blockers).map((blocker: string, i: number) => (
                                <li key={i}>{blocker}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {handoff.contextForNextSession && (
                          <div className="pt-2 border-t">
                            <h4 className="font-semibold text-sm mb-1">Context Summary</h4>
                            <pre className="text-xs text-muted-foreground bg-muted p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
                              {handoff.contextForNextSession}
                            </pre>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Create Handoff Tab */}
          <TabsContent value="create-handoff">
            <Card>
              <CardHeader>
                <CardTitle>Create Handoff Document</CardTitle>
                <CardDescription>
                  Prepare context for your next session or for another team member
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="handoff-title">Title</Label>
                  <Input
                    id="handoff-title"
                    placeholder="e.g., Project Alpha - End of Sprint 3"
                    value={handoffTitle}
                    onChange={(e) => setHandoffTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="handoff-overview">Project Overview</Label>
                  <Textarea
                    id="handoff-overview"
                    placeholder="Brief description of the project and its goals..."
                    value={handoffOverview}
                    onChange={(e) => setHandoffOverview(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="handoff-progress">Current Progress</Label>
                  <Textarea
                    id="handoff-progress"
                    placeholder="What has been accomplished so far..."
                    value={handoffProgress}
                    onChange={(e) => setHandoffProgress(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="handoff-next">Next Steps</Label>
                  <Textarea
                    id="handoff-next"
                    placeholder="What needs to be done next..."
                    value={handoffNextSteps}
                    onChange={(e) => setHandoffNextSteps(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full"
                  onClick={() => createHandoff.mutate({
                    title: handoffTitle,
                    projectOverview: handoffOverview,
                    currentProgress: handoffProgress,
                    nextSteps: handoffNextSteps,
                  })}
                  disabled={!handoffTitle || !handoffOverview || !handoffProgress || !handoffNextSteps || createHandoff.isPending}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Create Handoff Document
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
