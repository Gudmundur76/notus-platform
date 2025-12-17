import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users, Sparkles, MessageSquare, Database, TrendingUp, Loader2, Plus, Clock, Brain } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

export default function MirrorAgents() {
  const { user, loading: authLoading } = useAuth();
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [createAgentOpen, setCreateAgentOpen] = useState(false);
  const [runDebateOpen, setRunDebateOpen] = useState(false);
  const [runResearchOpen, setRunResearchOpen] = useState(false);

  // Queries
  const { data: agents, isLoading: agentsLoading, refetch: refetchAgents } = trpc.mirrorAgents.listAgents.useQuery();
  const { data: scheduledJobs, isLoading: jobsLoading, refetch: refetchJobs } = trpc.mirrorAgents.getScheduledJobs.useQuery();
  const { data: knowledgeStats } = trpc.mirrorAgents.getKnowledgeStats.useQuery();

  // Mutations
  const createAgentMutation = trpc.mirrorAgents.createAgent.useMutation({
    onSuccess: () => {
      toast.success("Agent created successfully");
      setCreateAgentOpen(false);
      refetchAgents();
    },
    onError: (error) => {
      toast.error(`Failed to create agent: ${error.message}`);
    },
  });

  const runDebateMutation = trpc.mirrorAgents.runDebate.useMutation({
    onSuccess: (result) => {
      toast.success("Debate completed successfully");
      setRunDebateOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to run debate: ${error.message}`);
    },
  });

  const runResearchMutation = trpc.mirrorAgents.runResearch.useMutation({
    onSuccess: (result) => {
      toast.success("Research completed successfully");
      setRunResearchOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to run research: ${error.message}`);
    },
  });

  const runContinuousLearningMutation = trpc.mirrorAgents.runContinuousLearning.useMutation({
    onSuccess: (result) => {
      toast.success(`Continuous learning completed: ${result.newInsights} new insights, ${result.crossDomainConnections} cross-domain connections`);
    },
    onError: (error) => {
      toast.error(`Failed to run continuous learning: ${error.message}`);
    },
  });

  const seedAgentsMutation = trpc.mirrorAgents.seedAgents.useMutation({
    onSuccess: (result) => {
      toast.success(`Agents seeded: ${result.agentPairs} pairs, ${result.debates} debates, ${result.insights} insights`);
      refetchAgents();
    },
    onError: (error) => {
      toast.error(`Failed to seed agents: ${error.message}`);
    },
  });

  const triggerJobMutation = trpc.mirrorAgents.triggerJob.useMutation({
    onSuccess: () => {
      toast.success("Job triggered successfully");
      refetchJobs();
    },
    onError: (error) => {
      toast.error(`Failed to trigger job: ${error.message}`);
    },
  });

  const setJobEnabledMutation = trpc.mirrorAgents.setJobEnabled.useMutation({
    onSuccess: () => {
      toast.success("Job status updated");
      refetchJobs();
    },
    onError: (error) => {
      toast.error(`Failed to update job: ${error.message}`);
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to access the Mirror Agent System</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const filteredAgents = selectedDomain === "all" 
    ? agents 
    : agents?.filter((a: any) => a.domain === selectedDomain);

  const primaryAgents = filteredAgents?.filter((a: any) => a.type === "primary") || [];
  const mirrorAgents = filteredAgents?.filter((a: any) => a.type === "mirror") || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold">Mirror Agent System</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Self-learning architecture with agent-to-agent dialogue, debate, and cross-domain knowledge refinement
          </p>
        </div>

        {/* Stats Overview */}
        {knowledgeStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{agents?.length || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {primaryAgents.length} primary, {mirrorAgents.length} mirror
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Knowledge Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{knowledgeStats.totalInsights}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg confidence: {knowledgeStats.averageConfidence.toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Domains</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{knowledgeStats.topDomains.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Top: {knowledgeStats.topDomains[0]?.domain || "None"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Cross-Domain Learning</CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => runContinuousLearningMutation.mutate()}
                  disabled={runContinuousLearningMutation.isPending}
                  className="w-full"
                >
                  {runContinuousLearningMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Run Now
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Button
            onClick={() => seedAgentsMutation.mutate()}
            disabled={seedAgentsMutation.isPending}
            variant="default"
            size="lg"
          >
            {seedAgentsMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Seeding Agents...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Seed Initial Agents
              </>
            )}
          </Button>

          <Dialog open={createAgentOpen} onOpenChange={setCreateAgentOpen}>
            <DialogTrigger asChild>
              <Button>
                <Users className="mr-2 h-4 w-4" />
                Create Agent
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Agent</DialogTitle>
                <DialogDescription>Create a primary or mirror agent for a specific domain</DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  createAgentMutation.mutate({
                    name: formData.get("name") as string,
                    domain: formData.get("domain") as string,
                    type: formData.get("type") as "primary" | "mirror",
                    systemPrompt: formData.get("systemPrompt") as string,
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="name">Agent Name</Label>
                  <Input id="name" name="name" placeholder="e.g., Biotech Primary Agent" required />
                </div>
                <div>
                  <Label htmlFor="domain">Domain</Label>
                  <Input id="domain" name="domain" placeholder="e.g., biotech, finance, legal" required />
                </div>
                <div>
                  <Label htmlFor="type">Agent Type</Label>
                  <Select name="type" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Primary Agent</SelectItem>
                      <SelectItem value="mirror">Mirror Agent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="systemPrompt">System Prompt</Label>
                  <Textarea
                    id="systemPrompt"
                    name="systemPrompt"
                    placeholder="Define the agent's role, expertise, and behavior..."
                    rows={4}
                    required
                  />
                </div>
                <Button type="submit" disabled={createAgentMutation.isPending} className="w-full">
                  {createAgentMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Agent"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={runDebateOpen} onOpenChange={setRunDebateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <MessageSquare className="mr-2 h-4 w-4" />
                Run Debate
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Run Agent Debate</DialogTitle>
                <DialogDescription>Start a debate between an agent pair on a specific topic</DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  runDebateMutation.mutate({
                    agentPairId: parseInt(formData.get("agentPairId") as string),
                    topic: formData.get("topic") as string,
                    rounds: parseInt(formData.get("rounds") as string),
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="agentPairId">Agent Pair ID</Label>
                  <Input id="agentPairId" name="agentPairId" type="number" placeholder="1" required />
                </div>
                <div>
                  <Label htmlFor="topic">Debate Topic</Label>
                  <Textarea
                    id="topic"
                    name="topic"
                    placeholder="e.g., Should CRISPR gene editing be used for human enhancement?"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="rounds">Number of Rounds</Label>
                  <Input id="rounds" name="rounds" type="number" min="1" max="10" defaultValue="3" required />
                </div>
                <Button type="submit" disabled={runDebateMutation.isPending} className="w-full">
                  {runDebateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running...
                    </>
                  ) : (
                    "Start Debate"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={runResearchOpen} onOpenChange={setRunResearchOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Database className="mr-2 h-4 w-4" />
                Run Research
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Run Agent Research</DialogTitle>
                <DialogDescription>Start a research dialogue between an agent pair</DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  runResearchMutation.mutate({
                    agentPairId: parseInt(formData.get("agentPairId") as string),
                    researchQuestion: formData.get("researchQuestion") as string,
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="agentPairId">Agent Pair ID</Label>
                  <Input id="agentPairId" name="agentPairId" type="number" placeholder="1" required />
                </div>
                <div>
                  <Label htmlFor="researchQuestion">Research Question</Label>
                  <Textarea
                    id="researchQuestion"
                    name="researchQuestion"
                    placeholder="e.g., What are the most promising biotech startups in 2024?"
                    rows={3}
                    required
                  />
                </div>
                <Button type="submit" disabled={runResearchMutation.isPending} className="w-full">
                  {runResearchMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running...
                    </>
                  ) : (
                    "Start Research"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="agents" className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge Core</TabsTrigger>
            <TabsTrigger value="jobs">Scheduled Jobs</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="agents" className="space-y-4">
            {agentsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : agents && agents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((agent) => (
                  <Card key={agent.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{agent.name}</CardTitle>
                          <CardDescription>{agent.domain}</CardDescription>
                        </div>
                        <Badge variant={agent.type === "primary" ? "default" : "secondary"}>
                          {agent.type}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge variant={agent.status === "active" ? "default" : "outline"}>
                            {agent.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p className="line-clamp-3">{agent.systemPrompt}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No agents created yet. Create your first agent to get started.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="knowledge" className="space-y-4">
            <KnowledgeCoreView />
          </TabsContent>

          <TabsContent value="jobs" className="space-y-4">
            {jobsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : scheduledJobs && scheduledJobs.length > 0 ? (
              <div className="space-y-4">
                {scheduledJobs.map((job: any) => (
                  <Card key={job.name}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {job.name.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </CardTitle>
                          <CardDescription>Schedule: {job.schedule}</CardDescription>
                        </div>
                        <Badge variant={job.status === "running" ? "default" : job.status === "failed" ? "destructive" : "secondary"}>
                          {job.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {job.nextRun && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Next run:</span>
                            <span>{new Date(job.nextRun).toLocaleString()}</span>
                          </div>
                        )}
                        {job.lastRun && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Last run:</span>
                            <span>{new Date(job.lastRun).toLocaleString()}</span>
                          </div>
                        )}
                        {job.errorMessage && (
                          <div className="text-sm text-destructive">
                            Error: {job.errorMessage}
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => triggerJobMutation.mutate({ name: job.name })}
                            disabled={triggerJobMutation.isPending || job.status === "running"}
                          >
                            {triggerJobMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Run Now
                          </Button>
                          <Button
                            size="sm"
                            variant={job.enabled ? "destructive" : "default"}
                            onClick={() => setJobEnabledMutation.mutate({ name: job.name, enabled: !job.enabled })}
                            disabled={setJobEnabledMutation.isPending}
                          >
                            {job.enabled ? "Disable" : "Enable"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No scheduled jobs configured</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <AnalyticsView stats={knowledgeStats} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function KnowledgeCoreView() {
  const [selectedDomain, setSelectedDomain] = useState<string>("biotech");
  const { data: knowledge, isLoading } = trpc.mirrorAgents.getKnowledgeByDomain.useQuery({ domain: selectedDomain });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Label>Domain:</Label>
        <Select value={selectedDomain} onValueChange={setSelectedDomain}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="biotech">Biotech</SelectItem>
            <SelectItem value="finance">Finance</SelectItem>
            <SelectItem value="legal">Legal</SelectItem>
            <SelectItem value="cross-domain">Cross-Domain</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : knowledge && knowledge.length > 0 ? (
        <div className="space-y-4">
          {knowledge.map((k) => (
            <Card key={k.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{k.topic}</CardTitle>
                    <CardDescription>Version {k.version}</CardDescription>
                  </div>
                  <Badge>{k.confidence}% confidence</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <Streamdown>{k.insight}</Streamdown>
                </div>
                <div className="flex gap-2 mt-4">
                  {k.tags.map((tag: string, i: number) => (
                    <Badge key={i} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No knowledge insights for this domain yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AnalyticsView({ stats }: { stats: any }) {
  if (!stats) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Knowledge Distribution by Domain</CardTitle>
          <CardDescription>Total insights across all domains</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.topDomains.map((domain: { domain: string; count: number }) => (
              <div key={domain.domain} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{domain.domain}</span>
                  <span className="text-muted-foreground">{domain.count} insights</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${(domain.count / stats.totalInsights) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Performance</CardTitle>
          <CardDescription>Overall knowledge core metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold">{stats.totalInsights}</div>
              <p className="text-xs text-muted-foreground">Total Insights</p>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.averageConfidence.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Avg Confidence</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
