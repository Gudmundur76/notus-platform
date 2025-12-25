import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Search,
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
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { Link } from "wouter";

const categoryIcons: Record<string, React.ReactNode> = {
  development: <Code className="h-4 w-4" />,
  data_analysis: <Database className="h-4 w-4" />,
  business: <Briefcase className="h-4 w-4" />,
  communication: <MessageSquare className="h-4 w-4" />,
  creative: <Palette className="h-4 w-4" />,
  productivity: <Clock className="h-4 w-4" />,
  security: <Shield className="h-4 w-4" />,
  other: <MoreHorizontal className="h-4 w-4" />,
};

const categoryColors: Record<string, string> = {
  development: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  data_analysis: "bg-green-500/10 text-green-500 border-green-500/20",
  business: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  communication: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  creative: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  productivity: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  security: "bg-red-500/10 text-red-500 border-red-500/20",
  other: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

export default function SkillsMarketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: skillsData, isLoading } = trpc.skills.list.useQuery({
    search: searchQuery || undefined,
    category: selectedCategory || undefined,
    limit: 50,
  });

  const { data: popularSkills } = trpc.skills.popular.useQuery({ limit: 6 });
  const { data: categories } = trpc.skills.categories.useQuery();
  const { data: mySkills } = trpc.skills.mySkills.useQuery();

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

  const isInstalled = (skillId: number) => {
    return mySkills?.some((s) => s.skillId === skillId);
  };

  const handleInstall = (skillId: number) => {
    if (isInstalled(skillId)) {
      uninstallMutation.mutate({ skillId });
    } else {
      installMutation.mutate({ skillId });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Skills Marketplace</h1>
            <p className="text-muted-foreground mt-1">
              Discover and install AI skills to enhance your agent's capabilities
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/skills/my">
              <Button variant="outline">
                <Sparkles className="mr-2 h-4 w-4" />
                My Skills
              </Button>
            </Link>
            <Link href="/skills/create">
              <Button>
                <Zap className="mr-2 h-4 w-4" />
                Create Skill
              </Button>
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Button>
            {categories?.map((cat) => (
              <Button
                key={cat.category}
                variant={selectedCategory === cat.category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat.category)}
              >
                {categoryIcons[cat.category]}
                <span className="ml-1 capitalize">{cat.category.replace("_", " ")}</span>
                <Badge variant="secondary" className="ml-1">
                  {cat.count}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList>
            <TabsTrigger value="browse">Browse All</TabsTrigger>
            <TabsTrigger value="popular">Popular</TabsTrigger>
            <TabsTrigger value="builtin">Built-in</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-full mt-2" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-20 bg-muted rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {skillsData?.skills.map((skill) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    isInstalled={isInstalled(skill.id) ?? false}
                    onInstall={() => handleInstall(skill.id)}
                    installing={installMutation.isPending || uninstallMutation.isPending}
                  />
                ))}
              </div>
            )}

            {skillsData?.skills.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No skills found matching your criteria</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="popular" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {popularSkills?.map((skill) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  isInstalled={isInstalled(skill.id) ?? false}
                  onInstall={() => handleInstall(skill.id)}
                  installing={installMutation.isPending || uninstallMutation.isPending}
                  showStats
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="builtin" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {skillsData?.skills
                .filter((s) => s.isBuiltIn)
                .map((skill) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    isInstalled={isInstalled(skill.id) ?? false}
                    onInstall={() => handleInstall(skill.id)}
                    installing={installMutation.isPending || uninstallMutation.isPending}
                  />
                ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{skillsData?.total || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Installed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mySkills?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Built-in
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {skillsData?.skills.filter((s) => s.isBuiltIn).length || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

interface SkillCardProps {
  skill: {
    id: number;
    name: string;
    slug: string;
    description: string;
    category: string;
    isBuiltIn: number;
    installCount: number;
    rating: number;
    ratingCount: number;
  };
  isInstalled: boolean;
  onInstall: () => void;
  installing: boolean;
  showStats?: boolean;
}

function SkillCard({ skill, isInstalled, onInstall, installing, showStats }: SkillCardProps) {
  return (
    <Card className="flex flex-col hover:border-primary/50 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${categoryColors[skill.category] || categoryColors.other}`}>
              {categoryIcons[skill.category] || categoryIcons.other}
            </div>
            <div>
              <CardTitle className="text-lg">{skill.name}</CardTitle>
              {skill.isBuiltIn === 1 && (
                <Badge variant="secondary" className="mt-1">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Built-in
                </Badge>
              )}
            </div>
          </div>
        </div>
        <CardDescription className="line-clamp-2 mt-2">
          {skill.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {showStats && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              {skill.installCount}
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-500" />
              {(skill.rating / 10).toFixed(1)}
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {skill.ratingCount} reviews
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Link href={`/skills/${skill.slug}`} className="flex-1">
          <Button variant="outline" className="w-full">
            View Details
          </Button>
        </Link>
        <Button
          onClick={onInstall}
          disabled={installing}
          variant={isInstalled ? "secondary" : "default"}
        >
          {isInstalled ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              Installed
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-1" />
              Install
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
