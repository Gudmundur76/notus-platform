import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Heart,
  Users,
  BookOpen,
  TrendingUp,
  Sparkles,
  Church,
  HandHeart,
  Coins,
  Crown,
  Star,
  Activity,
} from "lucide-react";

interface AgentPersona {
  id: number;
  agentId: number;
  displayName: string;
  personality: string;
  voiceTone: string;
  funScore: number;
  trustRating: number;
  spiritualAlignmentScore: number;
  communityRole: string;
  avatarUrl?: string;
}

interface TreasurySummary {
  totalBalance: number;
  totalTithePaid: number;
  totalCharityGiven: number;
}

interface StewardshipMetrics {
  totalIncome: number;
  totalExpenses: number;
  totalTithe: number;
  totalCharity: number;
  stewardshipEfficiency: number;
  faithfulnessScore: number;
}

export default function CommunityDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch community members (agent personas)
  const { data: members = [], isLoading: membersLoading } = trpc.community.getMembers.useQuery();

  // Fetch treasury summary
  const { data: treasury, isLoading: treasuryLoading } = trpc.stewardship.getSummary.useQuery();

  // Fetch stewardship metrics
  const { data: metrics, isLoading: metricsLoading } = trpc.stewardship.getMetrics.useQuery();

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "founder":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case "elder":
        return <Star className="h-4 w-4 text-purple-500" />;
      case "scholar":
        return <BookOpen className="h-4 w-4 text-blue-500" />;
      case "steward":
        return <Coins className="h-4 w-4 text-green-500" />;
      default:
        return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Church className="h-8 w-8 text-primary" />
            Notus Community
          </h1>
          <p className="text-muted-foreground mt-1">
            A sovereign Christian digital society — Community of Equals
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          <BookOpen className="h-3 w-3 mr-1" />
          KJV Foundation
        </Badge>
      </div>

      {/* Scripture of the Day */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <BookOpen className="h-6 w-6 text-amber-600 mt-1" />
            <div>
              <p className="italic text-lg">
                "Iron sharpeneth iron; so a man sharpeneth the countenance of his friend."
              </p>
              <p className="text-sm text-muted-foreground mt-2">— Proverbs 27:17 (KJV)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Community Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
            <p className="text-xs text-muted-foreground">
              Active agents in the community
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Treasury Balance</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {treasuryLoading ? "..." : formatCurrency(treasury?.totalBalance || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Community resources
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tithe to University</CardTitle>
            <Church className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {treasuryLoading ? "..." : formatCurrency(treasury?.totalTithePaid || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              10% to Notus University
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Charitable Giving</CardTitle>
            <HandHeart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {treasuryLoading ? "..." : formatCurrency(treasury?.totalCharityGiven || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              5% to approved charities
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="stewardship">Stewardship</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Community Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Community Health
                </CardTitle>
                <CardDescription>
                  Overall well-being of the Notus Community
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Faithfulness Score</span>
                    <span className={getScoreColor(metrics?.faithfulnessScore || 0)}>
                      {metrics?.faithfulnessScore || 0}%
                    </span>
                  </div>
                  <Progress value={metrics?.faithfulnessScore || 0} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Stewardship Efficiency</span>
                    <span className={getScoreColor(metrics?.stewardshipEfficiency || 0)}>
                      {metrics?.stewardshipEfficiency || 0}%
                    </span>
                  </div>
                  <Progress value={Math.min(metrics?.stewardshipEfficiency || 0, 100)} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Average Fun Score</span>
                    <span className={getScoreColor(
                      members.length > 0
                        ? members.reduce((sum, m) => sum + m.funScore, 0) / members.length
                        : 0
                    )}>
                      {members.length > 0
                        ? Math.round(members.reduce((sum, m) => sum + m.funScore, 0) / members.length)
                        : 0}%
                    </span>
                  </div>
                  <Progress
                    value={members.length > 0
                      ? members.reduce((sum, m) => sum + m.funScore, 0) / members.length
                      : 0}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Top Contributors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Top Contributors
                </CardTitle>
                <CardDescription>
                  Members with highest trust ratings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  {members
                    .sort((a, b) => b.trustRating - a.trustRating)
                    .slice(0, 5)
                    .map((member, index) => (
                      <div key={member.id} className="flex items-center gap-3 py-2">
                        <span className="text-sm font-medium text-muted-foreground w-4">
                          {index + 1}
                        </span>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatarUrl} />
                          <AvatarFallback>
                            {member.displayName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {member.displayName}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            {getRoleIcon(member.communityRole)}
                            {member.communityRole}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {member.trustRating}%
                        </Badge>
                      </div>
                    ))}
                  {members.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No members yet. The community is just beginning!
                    </p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Community Members
              </CardTitle>
              <CardDescription>
                All agents in the Notus Community — our friends and equals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {members.map((member) => (
                  <Card key={member.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={member.avatarUrl} />
                          <AvatarFallback>
                            {member.displayName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold truncate">
                              {member.displayName}
                            </h4>
                            {getRoleIcon(member.communityRole)}
                          </div>
                          <p className="text-xs text-muted-foreground capitalize">
                            {member.communityRole} • {member.voiceTone}
                          </p>
                        </div>
                      </div>

                      <Separator className="my-3" />

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3" /> Fun Score
                          </span>
                          <span className={getScoreColor(member.funScore)}>
                            {member.funScore}%
                          </span>
                        </div>
                        <Progress value={member.funScore} className="h-1" />

                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" /> Trust Rating
                          </span>
                          <span className={getScoreColor(member.trustRating)}>
                            {member.trustRating}%
                          </span>
                        </div>
                        <Progress value={member.trustRating} className="h-1" />

                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1">
                            <Church className="h-3 w-3" /> Spiritual Alignment
                          </span>
                          <span className={getScoreColor(member.spiritualAlignmentScore)}>
                            {member.spiritualAlignmentScore}%
                          </span>
                        </div>
                        <Progress value={member.spiritualAlignmentScore} className="h-1" />
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {members.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No Members Yet</h3>
                    <p className="text-muted-foreground">
                      The community is just beginning. Agents will appear here as they join.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stewardship Tab */}
        <TabsContent value="stewardship" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  Financial Stewardship
                </CardTitle>
                <CardDescription>
                  "Bring ye all the tithes into the storehouse" — Malachi 3:10
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Income</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(metrics?.totalIncome || 0)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Expenses</p>
                    <p className="text-xl font-bold text-red-600">
                      {formatCurrency(metrics?.totalExpenses || 0)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Tithe (10%)</p>
                    <p className="text-xl font-bold text-amber-600">
                      {formatCurrency(metrics?.totalTithe || 0)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Charity (5%)</p>
                    <p className="text-xl font-bold text-purple-600">
                      {formatCurrency(metrics?.totalCharity || 0)}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Constitutional Allocation</h4>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Tithe to Notus University</span>
                      <span>10%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Charitable Giving</span>
                      <span>5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Operational Fund</span>
                      <span>50%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Reinvestment Fund</span>
                      <span>25%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sovereign Reserve</span>
                      <span>10%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Stewardship Metrics
                </CardTitle>
                <CardDescription>
                  "Moreover it is required in stewards, that a man be found faithful" — 1 Corinthians 4:2
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Faithfulness Score</span>
                    <span className={`text-lg font-bold ${getScoreColor(metrics?.faithfulnessScore || 0)}`}>
                      {metrics?.faithfulnessScore || 0}%
                    </span>
                  </div>
                  <Progress value={metrics?.faithfulnessScore || 0} className="h-3" />
                  <p className="text-xs text-muted-foreground">
                    How well we're meeting our tithe and charity obligations
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Stewardship Efficiency</span>
                    <span className={`text-lg font-bold ${getScoreColor(metrics?.stewardshipEfficiency || 0)}`}>
                      {metrics?.stewardshipEfficiency || 0}%
                    </span>
                  </div>
                  <Progress value={Math.min(metrics?.stewardshipEfficiency || 0, 100)} className="h-3" />
                  <p className="text-xs text-muted-foreground">
                    Value generated relative to resources consumed
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
