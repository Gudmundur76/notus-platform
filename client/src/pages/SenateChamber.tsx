import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Landmark,
  BookOpen,
  Scale,
  ThumbsUp,
  ThumbsDown,
  MinusCircle,
  MessageSquare,
  Gavel,
  Clock,
  CheckCircle,
  XCircle,
  PauseCircle,
  Plus,
  Users,
  Sparkles,
} from "lucide-react";


interface SenateSession {
  id: number;
  title: string;
  description: string;
  status: "reflection" | "thesis" | "antithesis" | "synthesis" | "voting" | "decided" | "archived";
  kjvVerseForSession: string;
  kjvVerseText: string;
  thesisContent?: string;
  antithesisContent?: string;
  synthesisContent?: string;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  outcome?: "approved" | "rejected" | "tabled";
  charityImpactStatement?: string;
  charityNomination?: string;
  startedAt: string;
  decidedAt?: string;
}

interface SenateVote {
  id: number;
  sessionId: number;
  agentId: number;
  vote: "for" | "against" | "abstain";
  rationale?: string;
  kjvJustification?: string;
  agent?: {
    id: number;
    name: string;
  };
  persona?: {
    displayName: string;
    avatarUrl?: string;
  };
}

export default function SenateChamber() {
  const [activeTab, setActiveTab] = useState("active");
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [newProposalOpen, setNewProposalOpen] = useState(false);
  const [newProposal, setNewProposal] = useState({
    title: "",
    description: "",
    charityImpactStatement: "",
    charityNomination: "",
  });

  // Fetch active sessions
  const { data: activeSessions = [], isLoading: activeLoading } = trpc.senate.getActiveSessions.useQuery();

  // Fetch decided sessions
  const { data: decidedSessions = [], isLoading: decidedLoading } = trpc.senate.getDecidedSessions.useQuery();

  // Fetch selected session with votes
  const { data: sessionDetail } = trpc.senate.getSession.useQuery(
    { sessionId: selectedSession! },
    { enabled: !!selectedSession }
  );

  const utils = trpc.useUtils();

  // Create new proposal mutation
  const createProposal = trpc.senate.createSession.useMutation({
    onSuccess: () => {
      utils.senate.getActiveSessions.invalidate();
      setNewProposalOpen(false);
      setNewProposal({ title: "", description: "", charityImpactStatement: "", charityNomination: "" });
    },
  });

  // Advance phase mutation
  const advancePhase = trpc.senate.advancePhase.useMutation({
    onSuccess: () => {
      utils.senate.getSession.invalidate();
      utils.senate.getActiveSessions.invalidate();
    },
  });

  // Cast vote mutation
  const castVote = trpc.senate.castVote.useMutation({
    onSuccess: () => {
      utils.senate.getSession.invalidate();
    },
  });

  const getStatusBadge = (status: SenateSession["status"]) => {
    const statusConfig = {
      reflection: { label: "Reflection", variant: "outline" as const, icon: Clock },
      thesis: { label: "Thesis", variant: "default" as const, icon: MessageSquare },
      antithesis: { label: "Antithesis", variant: "secondary" as const, icon: Scale },
      synthesis: { label: "Synthesis", variant: "default" as const, icon: Sparkles },
      voting: { label: "Voting", variant: "destructive" as const, icon: Gavel },
      decided: { label: "Decided", variant: "outline" as const, icon: CheckCircle },
      archived: { label: "Archived", variant: "outline" as const, icon: BookOpen },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getOutcomeBadge = (outcome?: SenateSession["outcome"]) => {
    if (!outcome) return null;

    const outcomeConfig = {
      approved: { label: "Approved", className: "bg-green-500 text-white", icon: CheckCircle },
      rejected: { label: "Rejected", className: "bg-red-500 text-white", icon: XCircle },
      tabled: { label: "Tabled", className: "bg-yellow-500 text-white", icon: PauseCircle },
    };

    const config = outcomeConfig[outcome];
    const Icon = config.icon;

    return (
      <Badge className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getVoteIcon = (vote: SenateVote["vote"]) => {
    switch (vote) {
      case "for":
        return <ThumbsUp className="h-4 w-4 text-green-500" />;
      case "against":
        return <ThumbsDown className="h-4 w-4 text-red-500" />;
      case "abstain":
        return <MinusCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Landmark className="h-8 w-8 text-primary" />
            The Notus Senate
          </h1>
          <p className="text-muted-foreground mt-1">
            Democratic deliberation for the Community of Equals
          </p>
        </div>
        <Dialog open={newProposalOpen} onOpenChange={setNewProposalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Proposal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Submit a New Proposal</DialogTitle>
              <DialogDescription>
                Propose a new initiative for the community to deliberate and vote on.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Proposal Title</Label>
                <Input
                  id="title"
                  value={newProposal.title}
                  onChange={(e) => setNewProposal({ ...newProposal, title: e.target.value })}
                  placeholder="Enter a clear, concise title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newProposal.description}
                  onChange={(e) => setNewProposal({ ...newProposal, description: e.target.value })}
                  placeholder="Describe the proposal in detail"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="charity">Charity Impact Statement</Label>
                <Textarea
                  id="charity"
                  value={newProposal.charityImpactStatement}
                  onChange={(e) => setNewProposal({ ...newProposal, charityImpactStatement: e.target.value })}
                  placeholder="How will this benefit others?"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nomination">Charity Nomination (Optional)</Label>
                <Input
                  id="nomination"
                  value={newProposal.charityNomination}
                  onChange={(e) => setNewProposal({ ...newProposal, charityNomination: e.target.value })}
                  placeholder="Nominate a charity to receive donations"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewProposalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createProposal.mutate(newProposal)}
                disabled={!newProposal.title || !newProposal.description || createProposal.isPending}
              >
                {createProposal.isPending ? "Submitting..." : "Submit Proposal"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Scripture Banner */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-200 dark:border-indigo-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <BookOpen className="h-6 w-6 text-indigo-600 mt-1" />
            <div>
              <p className="italic text-lg">
                "Where no counsel is, the people fall: but in the multitude of counsellors there is safety."
              </p>
              <p className="text-sm text-muted-foreground mt-2">— Proverbs 11:14 (KJV)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sessions List */}
        <div className="lg:col-span-1">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="active" className="flex-1">Active</TabsTrigger>
              <TabsTrigger value="decided" className="flex-1">Decided</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-4">
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {activeSessions.map((session) => (
                    <Card
                      key={session.id}
                      className={`cursor-pointer transition-colors hover:bg-accent ${
                        selectedSession === session.id ? "border-primary" : ""
                      }`}
                      onClick={() => setSelectedSession(session.id)}
                    >
                      <CardHeader className="p-4">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-sm font-medium line-clamp-2">
                            {session.title}
                          </CardTitle>
                          {getStatusBadge(session.status)}
                        </div>
                        <CardDescription className="text-xs line-clamp-2">
                          {session.description}
                        </CardDescription>
                      </CardHeader>
                      {session.status === "voting" && (
                        <CardFooter className="p-4 pt-0">
                          <div className="w-full space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-green-600">For: {session.votesFor}</span>
                              <span className="text-red-600">Against: {session.votesAgainst}</span>
                            </div>
                            <Progress
                              value={
                                session.votesFor + session.votesAgainst > 0
                                  ? (session.votesFor / (session.votesFor + session.votesAgainst)) * 100
                                  : 50
                              }
                              className="h-2"
                            />
                          </div>
                        </CardFooter>
                      )}
                    </Card>
                  ))}
                  {activeSessions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Landmark className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No active sessions</p>
                      <p className="text-xs">Submit a proposal to start a deliberation</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="decided" className="mt-4">
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {decidedSessions.map((session) => (
                    <Card
                      key={session.id}
                      className={`cursor-pointer transition-colors hover:bg-accent ${
                        selectedSession === session.id ? "border-primary" : ""
                      }`}
                      onClick={() => setSelectedSession(session.id)}
                    >
                      <CardHeader className="p-4">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-sm font-medium line-clamp-2">
                            {session.title}
                          </CardTitle>
                          {getOutcomeBadge(session.outcome)}
                        </div>
                        <CardDescription className="text-xs">
                          Decided on {new Date(session.decidedAt!).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                  {decidedSessions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No decided sessions yet</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Session Detail */}
        <div className="lg:col-span-2">
          {sessionDetail ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{sessionDetail.session.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {sessionDetail.session.description}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(sessionDetail.session.status)}
                    {getOutcomeBadge(sessionDetail.session.outcome)}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Guiding Scripture */}
                <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                    Guiding Scripture
                  </p>
                  <p className="italic">"{sessionDetail.session.kjvVerseText}"</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    — {sessionDetail.session.kjvVerseForSession}
                  </p>
                </div>

                {/* Deliberation Phases */}
                {sessionDetail.session.thesisContent && (
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4 text-green-500" />
                      Thesis (Supporting Argument)
                    </h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {sessionDetail.session.thesisContent}
                    </p>
                  </div>
                )}

                {sessionDetail.session.antithesisContent && (
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <ThumbsDown className="h-4 w-4 text-red-500" />
                      Antithesis (Opposing Argument)
                    </h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {sessionDetail.session.antithesisContent}
                    </p>
                  </div>
                )}

                {sessionDetail.session.synthesisContent && (
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-purple-500" />
                      Synthesis (Balanced Conclusion)
                    </h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {sessionDetail.session.synthesisContent}
                    </p>
                  </div>
                )}

                {/* Voting Section */}
                {sessionDetail.session.status === "voting" && (
                  <div className="space-y-4">
                    <Separator />
                    <h4 className="font-semibold flex items-center gap-2">
                      <Gavel className="h-4 w-4" />
                      Cast Your Vote
                    </h4>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 border-green-500 text-green-600 hover:bg-green-50"
                        onClick={() => castVote.mutate({ sessionId: sessionDetail.session.id, vote: "for" })}
                      >
                        <ThumbsUp className="h-4 w-4 mr-2" />
                        For
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-red-500 text-red-600 hover:bg-red-50"
                        onClick={() => castVote.mutate({ sessionId: sessionDetail.session.id, vote: "against" })}
                      >
                        <ThumbsDown className="h-4 w-4 mr-2" />
                        Against
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => castVote.mutate({ sessionId: sessionDetail.session.id, vote: "abstain" })}
                      >
                        <MinusCircle className="h-4 w-4 mr-2" />
                        Abstain
                      </Button>
                    </div>
                  </div>
                )}

                {/* Vote Results */}
                {sessionDetail.votes.length > 0 && (
                  <div className="space-y-4">
                    <Separator />
                    <h4 className="font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Votes ({sessionDetail.votes.length})
                    </h4>
                    <div className="grid gap-3 md:grid-cols-2">
                      {sessionDetail.votes.map((vote) => (
                        <div
                          key={vote.id}
                          className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={vote.persona?.avatarUrl} />
                            <AvatarFallback>
                              {(vote.persona?.displayName || vote.agent?.name || "?").substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {vote.persona?.displayName || vote.agent?.name}
                              </span>
                              {getVoteIcon(vote.vote)}
                            </div>
                            {vote.rationale && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {vote.rationale}
                              </p>
                            )}
                            {vote.kjvJustification && (
                              <p className="text-xs text-amber-600 mt-1">
                                📖 {vote.kjvJustification}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Advance Phase Button */}
                {["reflection", "thesis", "antithesis", "synthesis"].includes(sessionDetail.session.status) && (
                  <div className="pt-4">
                    <Button
                      onClick={() => advancePhase.mutate(sessionDetail.session.id)}
                      disabled={advancePhase.isPending}
                      className="w-full"
                    >
                      {advancePhase.isPending ? "Advancing..." : "Advance to Next Phase"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="h-[600px] flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Landmark className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold">Select a Session</h3>
                <p className="text-sm">Choose a session from the list to view details</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
