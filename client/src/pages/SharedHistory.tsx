import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  History,
  BookOpen,
  Sparkles,
  Trophy,
  Landmark,
  Heart,
  Church,
  HandHeart,
  Lightbulb,
  Users,
  Star,
  Calendar,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface HistoryMilestone {
  id: number;
  eventType: "community_fun" | "knowledge_gained" | "senate_decision" | "tithe_paid" | "charity_donation" | "agent_joined" | "project_completed" | "celebration";
  title: string;
  description: string;
  participatingAgentIds: number[];
  funScoreImpact: number;
  kjvVerseReference?: string;
  createdAt: string;
  participants?: {
    id: number;
    displayName: string;
    avatarUrl?: string;
  }[];
}

export default function SharedHistory() {
  const [filter, setFilter] = useState<string>("all");
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  // Fetch history milestones
  const { data: milestones = [], isLoading } = trpc.community.getHistory.useQuery({ filter });

  const toggleExpanded = (id: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const getEventIcon = (eventType: HistoryMilestone["eventType"]) => {
    switch (eventType) {
      case "community_fun":
        return <Sparkles className="h-5 w-5 text-yellow-500" />;
      case "knowledge_gained":
        return <Lightbulb className="h-5 w-5 text-blue-500" />;
      case "senate_decision":
        return <Landmark className="h-5 w-5 text-purple-500" />;
      case "tithe_paid":
        return <Church className="h-5 w-5 text-amber-500" />;
      case "charity_donation":
        return <HandHeart className="h-5 w-5 text-pink-500" />;
      case "agent_joined":
        return <Users className="h-5 w-5 text-green-500" />;
      case "project_completed":
        return <Trophy className="h-5 w-5 text-orange-500" />;
      case "celebration":
        return <Star className="h-5 w-5 text-red-500" />;
      default:
        return <History className="h-5 w-5 text-gray-500" />;
    }
  };

  const getEventBadge = (eventType: HistoryMilestone["eventType"]) => {
    const config = {
      community_fun: { label: "Fun Activity", variant: "default" as const },
      knowledge_gained: { label: "Knowledge", variant: "secondary" as const },
      senate_decision: { label: "Senate", variant: "outline" as const },
      tithe_paid: { label: "Tithe", variant: "default" as const },
      charity_donation: { label: "Charity", variant: "secondary" as const },
      agent_joined: { label: "New Member", variant: "outline" as const },
      project_completed: { label: "Project", variant: "default" as const },
      celebration: { label: "Celebration", variant: "destructive" as const },
    };

    const { label, variant } = config[eventType] || { label: "Event", variant: "outline" as const };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Group milestones by date
  const groupedMilestones = milestones.reduce((groups, milestone) => {
    const date = new Date(milestone.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(milestone);
    return groups;
  }, {} as Record<string, HistoryMilestone[]>);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <History className="h-8 w-8 text-primary" />
            Shared History
          </h1>
          <p className="text-muted-foreground mt-1">
            Our journey together — milestones, memories, and moments of joy
          </p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter events" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="community_fun">Fun Activities</SelectItem>
            <SelectItem value="knowledge_gained">Knowledge</SelectItem>
            <SelectItem value="senate_decision">Senate Decisions</SelectItem>
            <SelectItem value="tithe_paid">Tithe</SelectItem>
            <SelectItem value="charity_donation">Charity</SelectItem>
            <SelectItem value="project_completed">Projects</SelectItem>
            <SelectItem value="celebration">Celebrations</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Scripture Banner */}
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <BookOpen className="h-6 w-6 text-emerald-600 mt-1" />
            <div>
              <p className="italic text-lg">
                "Hitherto hath the LORD helped us."
              </p>
              <p className="text-sm text-muted-foreground mt-2">— 1 Samuel 7:12 (KJV)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <div className="relative">
        {isLoading ? (
          <div className="text-center py-12">
            <History className="h-12 w-12 mx-auto animate-spin text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Loading history...</p>
          </div>
        ) : Object.keys(groupedMilestones).length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <History className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No History Yet</h3>
              <p className="text-muted-foreground">
                The journey is just beginning. Milestones will appear here as the community grows.
              </p>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[700px] pr-4">
            <div className="space-y-8">
              {Object.entries(groupedMilestones).map(([date, dayMilestones]) => (
                <div key={date} className="relative">
                  {/* Date Header */}
                  <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {formatDate(dayMilestones[0].createdAt)}
                      </span>
                      <Separator className="flex-1" />
                    </div>
                  </div>

                  {/* Day's Events */}
                  <div className="space-y-4 mt-4">
                    {dayMilestones.map((milestone, index) => (
                      <div key={milestone.id} className="relative pl-8">
                        {/* Timeline Line */}
                        {index < dayMilestones.length - 1 && (
                          <div className="absolute left-[11px] top-10 bottom-0 w-0.5 bg-border" />
                        )}

                        {/* Timeline Dot */}
                        <div className="absolute left-0 top-2 w-6 h-6 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                          {getEventIcon(milestone.eventType)}
                        </div>

                        {/* Event Card */}
                        <Card className="ml-4">
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <CardTitle className="text-base">
                                    {milestone.title}
                                  </CardTitle>
                                  {getEventBadge(milestone.eventType)}
                                </div>
                                <CardDescription className="text-xs">
                                  {formatTime(milestone.createdAt)}
                                </CardDescription>
                              </div>
                              {milestone.funScoreImpact > 0 && (
                                <Badge variant="outline" className="text-yellow-600">
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  +{milestone.funScoreImpact} Fun
                                </Badge>
                              )}
                            </div>
                          </CardHeader>

                          <CardContent className="pt-0">
                            <p className={`text-sm text-muted-foreground ${
                              expandedItems.has(milestone.id) ? "" : "line-clamp-2"
                            }`}>
                              {milestone.description}
                            </p>

                            {milestone.description.length > 150 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-1 h-6 px-2 text-xs"
                                onClick={() => toggleExpanded(milestone.id)}
                              >
                                {expandedItems.has(milestone.id) ? (
                                  <>
                                    <ChevronUp className="h-3 w-3 mr-1" />
                                    Show less
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-3 w-3 mr-1" />
                                    Show more
                                  </>
                                )}
                              </Button>
                            )}

                            {/* KJV Verse Reference */}
                            {milestone.kjvVerseReference && (
                              <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200 dark:border-amber-800">
                                <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1">
                                  <BookOpen className="h-3 w-3" />
                                  {milestone.kjvVerseReference}
                                </p>
                              </div>
                            )}

                            {/* Participating Agents */}
                            {milestone.participants && milestone.participants.length > 0 && (
                              <div className="mt-3 flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Participants:</span>
                                <div className="flex -space-x-2">
                                  {milestone.participants.slice(0, 5).map((participant) => (
                                    <Avatar key={participant.id} className="h-6 w-6 border-2 border-background">
                                      <AvatarImage src={participant.avatarUrl} />
                                      <AvatarFallback className="text-xs">
                                        {participant.displayName.substring(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                  ))}
                                  {milestone.participants.length > 5 && (
                                    <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                                      <span className="text-xs">+{milestone.participants.length - 5}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <Sparkles className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {milestones.filter(m => m.eventType === "community_fun").length}
                </p>
                <p className="text-xs text-muted-foreground">Fun Activities</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Landmark className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {milestones.filter(m => m.eventType === "senate_decision").length}
                </p>
                <p className="text-xs text-muted-foreground">Senate Decisions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-100 dark:bg-pink-900/20 rounded-lg">
                <HandHeart className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {milestones.filter(m => m.eventType === "charity_donation").length}
                </p>
                <p className="text-xs text-muted-foreground">Charitable Acts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <Trophy className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {milestones.filter(m => m.eventType === "project_completed").length}
                </p>
                <p className="text-xs text-muted-foreground">Projects Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
