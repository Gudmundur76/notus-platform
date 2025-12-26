import { useState } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  Star,
  Code,
  Database,
  Briefcase,
  MessageSquare,
  Palette,
  Clock,
  Shield,
  MoreHorizontal,
  Check,
  Sparkles,
  FileText,
  Terminal,
  Users,
  ThumbsUp,
  History,
  Pin,
  GitBranch,
} from "lucide-react";

const categoryIcons: Record<string, React.ReactNode> = {
  development: <Code className="h-5 w-5" />,
  data_analysis: <Database className="h-5 w-5" />,
  business: <Briefcase className="h-5 w-5" />,
  communication: <MessageSquare className="h-5 w-5" />,
  creative: <Palette className="h-5 w-5" />,
  productivity: <Clock className="h-5 w-5" />,
  security: <Shield className="h-5 w-5" />,
  other: <MoreHorizontal className="h-5 w-5" />,
};

const categoryColors: Record<string, string> = {
  development: "bg-blue-500/10 text-blue-500",
  data_analysis: "bg-green-500/10 text-green-500",
  business: "bg-purple-500/10 text-purple-500",
  communication: "bg-yellow-500/10 text-yellow-500",
  creative: "bg-pink-500/10 text-pink-500",
  productivity: "bg-orange-500/10 text-orange-500",
  security: "bg-red-500/10 text-red-500",
  other: "bg-gray-500/10 text-gray-500",
};

export default function SkillDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  const { data: skill, isLoading } = trpc.skills.bySlug.useQuery({ slug: slug || "" });
  const { data: scripts } = trpc.skills.scripts.useQuery(
    { skillId: skill?.id || 0 },
    { enabled: !!skill?.id }
  );
  const { data: templates } = trpc.skills.templates.useQuery(
    { skillId: skill?.id || 0 },
    { enabled: !!skill?.id }
  );
  const { data: reviews } = trpc.skills.reviews.useQuery(
    { skillId: skill?.id || 0 },
    { enabled: !!skill?.id }
  );
  const { data: usageStats } = trpc.skills.usageStats.useQuery(
    { skillId: skill?.id || 0 },
    { enabled: !!skill?.id }
  );
  const { data: mySkills } = trpc.skills.mySkills.useQuery();
  const { data: versions } = trpc.skills.getVersions.useQuery(
    { skillId: skill?.id || 0 },
    { enabled: !!skill?.id }
  );
  
  const isInstalled = mySkills?.some((s) => s.skillId === skill?.id);
  
  const { data: pinnedVersion } = trpc.skills.getPinnedVersion.useQuery(
    { skillId: skill?.id || 0 },
    { enabled: !!skill?.id && !!isInstalled }
  );

  const installMutation = trpc.skills.install.useMutation({
    onSuccess: () => {
      toast.success("Skill installed successfully!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const uninstallMutation = trpc.skills.uninstall.useMutation({
    onSuccess: () => {
      toast.success("Skill uninstalled");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const pinVersionMutation = trpc.skills.pinVersion.useMutation({
    onSuccess: () => {
      toast.success("Version pinned successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const unpinVersionMutation = trpc.skills.unpinVersion.useMutation({
    onSuccess: () => {
      toast.success("Now using latest version");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const reviewMutation = trpc.skills.addReview.useMutation({
    onSuccess: () => {
      toast.success("Review submitted!");
      setReviewText("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleInstall = () => {
    if (!skill) return;
    if (isInstalled) {
      uninstallMutation.mutate({ skillId: skill.id });
    } else {
      installMutation.mutate({ skillId: skill.id });
    }
  };

  const handleSubmitReview = () => {
    if (!skill) return;
    reviewMutation.mutate({
      skillId: skill.id,
      rating: reviewRating,
      review: reviewText || undefined,
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-32 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </DashboardLayout>
    );
  }

  if (!skill) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Skill not found</h2>
          <p className="text-muted-foreground mt-2">
            The skill you're looking for doesn't exist.
          </p>
          <Link href="/skills">
            <Button className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Skills
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const tags = skill.tags ? JSON.parse(skill.tags) : [];
  const examples = skill.examples ? JSON.parse(skill.examples) : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <Link href="/skills">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Skills
          </Button>
        </Link>

        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className={`p-4 rounded-xl ${categoryColors[skill.category] || categoryColors.other}`}>
              {categoryIcons[skill.category] || categoryIcons.other}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold">{skill.name}</h1>
                {skill.isBuiltIn === 1 && (
                  <Badge variant="secondary">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Built-in
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-1">{skill.description}</p>
              <div className="flex items-center gap-4 mt-3">
                <Badge variant="outline" className="capitalize">
                  {skill.category.replace("_", " ")}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Download className="h-4 w-4" />
                  {skill.installCount} installs
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 text-yellow-500" />
                  {(skill.rating / 10).toFixed(1)} ({skill.ratingCount} reviews)
                </div>
              </div>
            </div>
          </div>
          <Button
            size="lg"
            onClick={handleInstall}
            disabled={installMutation.isPending || uninstallMutation.isPending}
            variant={isInstalled ? "secondary" : "default"}
          >
            {isInstalled ? (
              <>
                <Check className="h-5 w-5 mr-2" />
                Installed
              </>
            ) : (
              <>
                <Download className="h-5 w-5 mr-2" />
                Install Skill
              </>
            )}
          </Button>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag: string) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="instructions">Instructions</TabsTrigger>
            {scripts && scripts.length > 0 && (
              <TabsTrigger value="scripts">Scripts ({scripts.length})</TabsTrigger>
            )}
            {templates && templates.length > 0 && (
              <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
            )}
            <TabsTrigger value="reviews">Reviews ({reviews?.length || 0})</TabsTrigger>
            <TabsTrigger value="versions">Version History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About this Skill</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm">
                  {skill.content}
                </pre>
              </CardContent>
            </Card>

            {skill.whenToUse && (
              <Card>
                <CardHeader>
                  <CardTitle>When to Use</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{skill.whenToUse}</p>
                </CardContent>
              </Card>
            )}

            {examples.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Examples</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {examples.map((example: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <ThumbsUp className="h-4 w-4 mt-1 text-primary" />
                        <span>{example}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Usage Stats */}
            {usageStats && (
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Uses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{usageStats.totalUses}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Success Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{usageStats.successRate.toFixed(1)}%</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Avg. Execution Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {usageStats.avgExecutionTime > 0
                        ? `${(usageStats.avgExecutionTime / 1000).toFixed(1)}s`
                        : "N/A"}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="instructions">
            <Card>
              <CardHeader>
                <CardTitle>Instructions</CardTitle>
                <CardDescription>
                  Step-by-step guide for using this skill
                </CardDescription>
              </CardHeader>
              <CardContent className="prose prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm">
                  {skill.instructions || "No specific instructions provided."}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          {scripts && scripts.length > 0 && (
            <TabsContent value="scripts" className="space-y-4">
              {scripts.map((script) => (
                <Card key={script.id}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Terminal className="h-5 w-5" />
                      <CardTitle>{script.name}</CardTitle>
                      <Badge variant="outline">{script.language}</Badge>
                    </div>
                    {script.description && (
                      <CardDescription>{script.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{script.content}</code>
                    </pre>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          )}

          {templates && templates.length > 0 && (
            <TabsContent value="templates" className="space-y-4">
              {templates.map((template) => (
                <Card key={template.id}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      <CardTitle>{template.name}</CardTitle>
                      <Badge variant="outline">{template.format}</Badge>
                    </div>
                    {template.description && (
                      <CardDescription>{template.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{template.content}</code>
                    </pre>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          )}

          <TabsContent value="reviews" className="space-y-6">
            {/* Add Review */}
            <Card>
              <CardHeader>
                <CardTitle>Write a Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Rating:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= reviewRating
                            ? "text-yellow-500 fill-yellow-500"
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <Textarea
                  placeholder="Share your experience with this skill..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={3}
                />
                <Button onClick={handleSubmitReview} disabled={reviewMutation.isPending}>
                  Submit Review
                </Button>
              </CardContent>
            </Card>

            {/* Reviews List */}
            {reviews && reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= review.rating
                                  ? "text-yellow-500 fill-yellow-500"
                                  : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {review.review && <p>{review.review}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No reviews yet. Be the first to review this skill!
              </div>
            )}
          </TabsContent>

          {/* Version History Tab */}
          <TabsContent value="versions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Version History
                </CardTitle>
                <CardDescription>
                  Track changes and pin specific versions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pinnedVersion && (
                  <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Pin className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">Pinned to version {pinnedVersion.version}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => skill && unpinVersionMutation.mutate({ skillId: skill.id })}
                        disabled={unpinVersionMutation.isPending}
                      >
                        Use Latest
                      </Button>
                    </div>
                  </div>
                )}

                {versions && versions.length > 0 ? (
                  <div className="space-y-3">
                    {versions.map((version, index) => (
                      <div
                        key={version.id}
                        className={`p-4 rounded-lg border ${
                          index === 0 ? "border-green-500/50 bg-green-500/5" : ""
                        } ${pinnedVersion?.id === version.id ? "border-blue-500/50 bg-blue-500/5" : ""}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <GitBranch className="h-4 w-4 text-muted-foreground" />
                            <span className="font-mono font-medium">v{version.version}</span>
                            {index === 0 && (
                              <Badge variant="outline" className="text-green-500 border-green-500">
                                Latest
                              </Badge>
                            )}
                            {pinnedVersion?.id === version.id && (
                              <Badge variant="outline" className="text-blue-500 border-blue-500">
                                <Pin className="h-3 w-3 mr-1" />
                                Pinned
                              </Badge>
                            )}
                          </div>
                          {isInstalled && pinnedVersion?.id !== version.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => skill && pinVersionMutation.mutate({
                                skillId: skill.id,
                                versionId: version.id,
                              })}
                              disabled={pinVersionMutation.isPending}
                            >
                              <Pin className="h-3 w-3 mr-1" />
                              Pin Version
                            </Button>
                          )}
                        </div>
                        {version.changelog && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {version.changelog}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Released {new Date(version.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No version history available</p>
                    <p className="text-sm">This skill is at version {skill?.version || "1.0.0"}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
