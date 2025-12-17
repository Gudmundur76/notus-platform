import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Network, TrendingUp, Brain, Sparkles } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { ForceGraph2D } from "react-force-graph";
import { getLoginUrl } from "@/const";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface GraphNode {
  id: string;
  name: string;
  domain: string;
  type: "agent" | "knowledge" | "domain";
  value: number;
  color: string;
}

interface GraphLink {
  source: string;
  target: string;
  value: number;
  type: "creates" | "contributes" | "connects";
}

export default function KnowledgeGraph() {
  const { user, loading: authLoading } = useAuth();
  const [selectedView, setSelectedView] = useState<"network" | "timeline" | "contributions">("network");
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const graphRef = useRef<any>(null);

  const { data: agents } = trpc.mirrorAgents.listAgents.useQuery(undefined, { enabled: !!user });
  const { data: knowledgeStats } = trpc.mirrorAgents.getKnowledgeStats.useQuery();
  const { data: biotechKnowledge } = trpc.mirrorAgents.getKnowledgeByDomain.useQuery({ domain: "biotech" });
  const { data: financeKnowledge } = trpc.mirrorAgents.getKnowledgeByDomain.useQuery({ domain: "finance" });
  const { data: legalKnowledge } = trpc.mirrorAgents.getKnowledgeByDomain.useQuery({ domain: "legal" });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>Please log in to access the Knowledge Visualization Dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <a href={getLoginUrl()}>Log In</a>
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // Build graph data from agents and knowledge
  const graphData = buildGraphData(agents || [], biotechKnowledge || [], financeKnowledge || [], legalKnowledge || [], selectedDomain);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      <Header />
      
      <div className="flex-1 container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Knowledge Visualization
          </h1>
          <p className="text-muted-foreground text-lg">
            Explore knowledge connections, domain relationships, and agent contributions
          </p>
        </div>

        {/* Stats Overview */}
        {knowledgeStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{knowledgeStats.totalInsights}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Domains</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{knowledgeStats.topDomains.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{agents?.length || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Cross-Domain Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{graphData.links.filter(l => l.type === "connects").length}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* View Controls */}
        <div className="flex items-center gap-4 mb-6">
          <Select value={selectedView} onValueChange={(v: any) => setSelectedView(v)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="network">Network Graph</SelectItem>
              <SelectItem value="timeline">Timeline View</SelectItem>
              <SelectItem value="contributions">Agent Contributions</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedDomain} onValueChange={setSelectedDomain}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              <SelectItem value="biotech">Biotech</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
              <SelectItem value="legal">Legal</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="tech">Tech</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Main Visualization */}
        {selectedView === "network" && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Knowledge Network Graph
              </CardTitle>
              <CardDescription>
                Interactive visualization of agents, knowledge, and cross-domain connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full h-[600px] border rounded-lg overflow-hidden bg-muted/10">
                <ForceGraph2D
                  ref={graphRef}
                  graphData={graphData}
                  nodeLabel="name"
                  nodeColor="color"
                  nodeVal="value"
                  linkWidth={(link: any) => link.value}
                  linkDirectionalParticles={2}
                  linkDirectionalParticleWidth={(link: any) => link.value}
                  onNodeClick={(node: any) => {
                    console.log("Node clicked:", node);
                  }}
                  backgroundColor="#00000000"
                />
              </div>
              <div className="mt-4 flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500" />
                  <span>Agents</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500" />
                  <span>Knowledge</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-purple-500" />
                  <span>Domains</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedView === "timeline" && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Knowledge Evolution Timeline
              </CardTitle>
              <CardDescription>
                Track how insights evolve and grow over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {knowledgeStats?.topDomains.map((domain: any, index: number) => (
                  <div key={domain.domain} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge>{domain.domain}</Badge>
                        <span className="text-sm text-muted-foreground">{domain.count} insights</span>
                      </div>
                      <span className="text-sm font-medium">{Math.round((domain.count / knowledgeStats.totalInsights) * 100)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-primary to-purple-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${(domain.count / knowledgeStats.totalInsights) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {selectedView === "contributions" && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Agent Contribution Metrics
              </CardTitle>
              <CardDescription>
                Analyze which agents are contributing most to the knowledge base
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents?.map((agent: any) => (
                  <Card key={agent.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{agent.name}</CardTitle>
                        <Badge variant={agent.type === "primary" ? "default" : "secondary"}>
                          {agent.type}
                        </Badge>
                      </div>
                      <CardDescription>{agent.domain}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge variant={agent.status === "active" ? "default" : "outline"}>
                            {agent.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Contributions:</span>
                          <span className="font-medium">
                            {getAgentContributions(agent, biotechKnowledge, financeKnowledge, legalKnowledge)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Footer />
    </div>
  );
}

function buildGraphData(
  agents: any[],
  biotechKnowledge: any[],
  financeKnowledge: any[],
  legalKnowledge: any[],
  selectedDomain: string
): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  // Filter agents by domain
  const filteredAgents = selectedDomain === "all" ? agents : agents.filter(a => a.domain === selectedDomain);

  // Add agent nodes
  filteredAgents.forEach(agent => {
    nodes.push({
      id: `agent-${agent.id}`,
      name: agent.name,
      domain: agent.domain,
      type: "agent",
      value: 10,
      color: agent.type === "primary" ? "#3b82f6" : "#60a5fa",
    });
  });

  // Add domain nodes
  const domainSet = new Set(filteredAgents.map(a => a.domain));
  const domains = Array.from(domainSet);
  domains.forEach(domain => {
    nodes.push({
      id: `domain-${domain}`,
      name: domain,
      domain,
      type: "domain",
      value: 20,
      color: "#a855f7",
    });
  });

  // Add knowledge nodes
  const allKnowledge = [
    ...(selectedDomain === "all" || selectedDomain === "biotech" ? biotechKnowledge : []),
    ...(selectedDomain === "all" || selectedDomain === "finance" ? financeKnowledge : []),
    ...(selectedDomain === "all" || selectedDomain === "legal" ? legalKnowledge : []),
  ];

  allKnowledge.slice(0, 20).forEach((knowledge: any, index) => {
    nodes.push({
      id: `knowledge-${knowledge.id}`,
      name: knowledge.insight.substring(0, 30) + "...",
      domain: knowledge.domain,
      type: "knowledge",
      value: knowledge.confidence * 10,
      color: "#22c55e",
    });

    // Link knowledge to its domain
    links.push({
      source: `knowledge-${knowledge.id}`,
      target: `domain-${knowledge.domain}`,
      value: 2,
      type: "contributes",
    });
  });

  // Link agents to their domains
  filteredAgents.forEach(agent => {
    links.push({
      source: `agent-${agent.id}`,
      target: `domain-${agent.domain}`,
      value: 3,
      type: "creates",
    });
  });

  // Add cross-domain connections
  if (selectedDomain === "all") {
    domains.forEach((domain1, i) => {
      domains.forEach((domain2, j) => {
        if (i < j) {
          links.push({
            source: `domain-${domain1}`,
            target: `domain-${domain2}`,
            value: 1,
            type: "connects",
          });
        }
      });
    });
  }

  return { nodes, links };
}

function getAgentContributions(
  agent: any,
  biotechKnowledge: any[] | undefined,
  financeKnowledge: any[] | undefined,
  legalKnowledge: any[] | undefined
): number {
  const allKnowledge = [...(biotechKnowledge || []), ...(financeKnowledge || []), ...(legalKnowledge || [])];
  
  // Count knowledge entries that mention this agent
  return allKnowledge.filter(k => 
    k.contributingAgents && k.contributingAgents.includes(agent.id)
  ).length;
}
