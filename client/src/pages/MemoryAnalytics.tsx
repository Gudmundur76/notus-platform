import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  TrendingUp,
  Activity,
  Star,
  Pin,
  BarChart3,
  Clock,
  Lightbulb,
  RefreshCw,
  Download,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

export default function MemoryAnalytics() {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: usageStats, isLoading: statsLoading } =
    trpc.memoryAnalytics.getUsageStats.useQuery();
  const { data: mostAccessed, isLoading: accessedLoading } =
    trpc.memoryAnalytics.getMostAccessed.useQuery({ limit: 10 });
  const { data: timeline, isLoading: timelineLoading } =
    trpc.memoryAnalytics.getAccessTimeline.useQuery({ days: 30 });
  const { data: growthTrend, isLoading: growthLoading } =
    trpc.memoryAnalytics.getGrowthTrend.useQuery({ days: 30 });
  const { data: relevanceDistribution } =
    trpc.memoryAnalytics.getRelevanceDistribution.useQuery();
  const { data: recentActivity } =
    trpc.memoryAnalytics.getRecentActivity.useQuery({ limit: 20 });
  const { data: insights } = trpc.memoryAnalytics.getInsights.useQuery();

  const createSnapshotMutation = trpc.memoryAnalytics.createSnapshot.useMutation({
    onSuccess: () => {
      toast.success("Analytics snapshot created");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getHealthLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Attention";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Memory Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Track and analyze your memory usage patterns
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => createSnapshotMutation.mutate()}
              disabled={createSnapshotMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${createSnapshotMutation.isPending ? "animate-spin" : ""}`} />
              Create Snapshot
            </Button>
          </div>
        </div>

        {/* Health Score Card */}
        {insights && (
          <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/20 rounded-full">
                    <Brain className="h-8 w-8 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Memory Health Score</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-4xl font-bold ${getHealthColor(insights.healthScore)}`}>
                        {insights.healthScore}
                      </span>
                      <span className="text-2xl text-muted-foreground">/100</span>
                      <Badge variant="outline" className={getHealthColor(insights.healthScore)}>
                        {getHealthLabel(insights.healthScore)}
                      </Badge>
                    </div>
                  </div>
                </div>
                {insights.topCategories.length > 0 && (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">Top Categories</p>
                    <div className="flex gap-2">
                      {insights.topCategories.map((cat) => (
                        <Badge key={cat} variant="secondary">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Memories</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : usageStats?.totalMemories || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all categories
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Accesses</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : usageStats?.totalAccesses || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Memory retrievals
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Importance</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : (usageStats?.avgImportance || 0).toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">
                Out of 10
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pinned</CardTitle>
              <Pin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : usageStats?.pinnedCount || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Priority memories
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="access">Access Patterns</TabsTrigger>
            <TabsTrigger value="growth">Growth</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* By Type */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Memories by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <div className="h-40 flex items-center justify-center text-muted-foreground">
                      Loading...
                    </div>
                  ) : usageStats?.byType && usageStats.byType.length > 0 ? (
                    <div className="space-y-3">
                      {usageStats.byType.map((item) => (
                        <div key={item.type} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                item.type === "fact"
                                  ? "bg-blue-500"
                                  : item.type === "preference"
                                  ? "bg-green-500"
                                  : "bg-purple-500"
                              }`}
                            />
                            <span className="capitalize">{item.type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  item.type === "fact"
                                    ? "bg-blue-500"
                                    : item.type === "preference"
                                    ? "bg-green-500"
                                    : "bg-purple-500"
                                }`}
                                style={{
                                  width: `${(item.count / usageStats.totalMemories) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground w-8 text-right">
                              {item.count}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-40 flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* By Category */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Memories by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <div className="h-40 flex items-center justify-center text-muted-foreground">
                      Loading...
                    </div>
                  ) : usageStats?.byCategory && usageStats.byCategory.length > 0 ? (
                    <div className="space-y-3">
                      {usageStats.byCategory.slice(0, 6).map((item, index) => (
                        <div key={item.category} className="flex items-center justify-between">
                          <span className="truncate max-w-[150px]">{item.category}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary"
                                style={{
                                  width: `${(item.count / usageStats.totalMemories) * 100}%`,
                                  opacity: 1 - index * 0.15,
                                }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground w-8 text-right">
                              {item.count}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-40 flex items-center justify-center text-muted-foreground">
                      No categories yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Most Accessed */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Most Accessed Memories</CardTitle>
                <CardDescription>
                  Memories that are frequently retrieved for context
                </CardDescription>
              </CardHeader>
              <CardContent>
                {accessedLoading ? (
                  <div className="h-40 flex items-center justify-center text-muted-foreground">
                    Loading...
                  </div>
                ) : mostAccessed && mostAccessed.length > 0 ? (
                  <div className="space-y-2">
                    {mostAccessed.map((memory, index) => (
                      <div
                        key={memory.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-muted-foreground w-6">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-medium">{memory.key}</p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {memory.type}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-medium">{memory.accessCount}</p>
                            <p className="text-xs text-muted-foreground">accesses</p>
                          </div>
                          <Badge variant="outline">
                            <Star className="h-3 w-3 mr-1" />
                            {memory.importance}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center text-muted-foreground">
                    No access data yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="access" className="space-y-4">
            {/* Access Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Access Timeline (Last 30 Days)</CardTitle>
                <CardDescription>
                  Daily memory access frequency
                </CardDescription>
              </CardHeader>
              <CardContent>
                {timelineLoading ? (
                  <div className="h-40 flex items-center justify-center text-muted-foreground">
                    Loading...
                  </div>
                ) : timeline && timeline.length > 0 ? (
                  <div className="h-40 flex items-end gap-1">
                    {timeline.map((day) => {
                      const maxCount = Math.max(...timeline.map((d) => d.count));
                      const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                      return (
                        <div
                          key={day.date}
                          className="flex-1 bg-primary/80 rounded-t hover:bg-primary transition-colors"
                          style={{ height: `${Math.max(height, 2)}%` }}
                          title={`${day.date}: ${day.count} accesses`}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center text-muted-foreground">
                    No access data yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Relevance Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Context Relevance Distribution</CardTitle>
                <CardDescription>
                  How relevant memories are when retrieved
                </CardDescription>
              </CardHeader>
              <CardContent>
                {relevanceDistribution && relevanceDistribution.length > 0 ? (
                  <div className="space-y-3">
                    {relevanceDistribution.map((item) => (
                      <div key={item.range} className="flex items-center justify-between">
                        <span>{item.range}%</span>
                        <div className="flex items-center gap-2">
                          <div className="w-48 h-3 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                              style={{
                                width: `${
                                  (item.count /
                                    Math.max(
                                      ...relevanceDistribution.map((d) => d.count),
                                      1
                                    )) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-12 text-right">
                            {item.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center text-muted-foreground">
                    No relevance data yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity && recentActivity.length > 0 ? (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {recentActivity.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded border"
                      >
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={
                              activity.accessType === "write"
                                ? "default"
                                : activity.accessType === "search"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {activity.accessType}
                          </Badge>
                          <span className="font-medium">{activity.memoryKey}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {activity.context && (
                            <span className="truncate max-w-[150px]">{activity.context}</span>
                          )}
                          <Clock className="h-3 w-3" />
                          {new Date(activity.accessedAt).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center text-muted-foreground">
                    No recent activity
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="growth" className="space-y-4">
            {/* Growth Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Memory Growth (Last 30 Days)</CardTitle>
                <CardDescription>
                  New memories added over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {growthLoading ? (
                  <div className="h-40 flex items-center justify-center text-muted-foreground">
                    Loading...
                  </div>
                ) : growthTrend && growthTrend.length > 0 ? (
                  <div className="space-y-4">
                    <div className="h-40 flex items-end gap-1">
                      {growthTrend.map((day) => {
                        const maxCount = Math.max(...growthTrend.map((d) => d.count));
                        const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                        return (
                          <div
                            key={day.date}
                            className="flex-1 bg-green-500/80 rounded-t hover:bg-green-500 transition-colors"
                            style={{ height: `${Math.max(height, 2)}%` }}
                            title={`${day.date}: ${day.count} new memories`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>30 days ago</span>
                      <span>Today</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center text-muted-foreground">
                    No growth data yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cumulative Growth */}
            {growthTrend && growthTrend.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Cumulative Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-3xl font-bold text-green-500">
                        +{growthTrend.reduce((sum, d) => sum + d.count, 0)}
                      </p>
                      <p className="text-sm text-muted-foreground">New memories this month</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold">
                        {(growthTrend.reduce((sum, d) => sum + d.count, 0) / 30).toFixed(1)}
                      </p>
                      <p className="text-sm text-muted-foreground">Avg per day</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold">
                        {growthTrend[growthTrend.length - 1]?.cumulative || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Total this period</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            {insights && (
              <>
                {/* Suggestions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-yellow-500" />
                      Suggestions
                    </CardTitle>
                    <CardDescription>
                      Ways to improve your memory system
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {insights.suggestions.length > 0 ? (
                      <div className="space-y-3">
                        {insights.suggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                          >
                            <ChevronRight className="h-5 w-5 text-primary mt-0.5" />
                            <p>{suggestion}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-lg font-medium text-green-500">
                          Great job! No suggestions at this time.
                        </p>
                        <p className="text-sm mt-1">
                          Your memory system is well-organized.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                        <Brain className="h-5 w-5" />
                        <span>Add Memory</span>
                      </Button>
                      <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                        <Pin className="h-5 w-5" />
                        <span>Pin Important</span>
                      </Button>
                      <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                        <BarChart3 className="h-5 w-5" />
                        <span>View All</span>
                      </Button>
                      <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                        <Download className="h-5 w-5" />
                        <span>Export</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
