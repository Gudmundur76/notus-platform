import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  ArrowLeft,
  Code,
  Database,
  Briefcase,
  MessageSquare,
  Palette,
  Clock,
  Shield,
  MoreHorizontal,
  Sparkles,
  Trash2,
  Zap,
  Plus,
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
  development: "bg-blue-500/10 text-blue-500",
  data_analysis: "bg-green-500/10 text-green-500",
  business: "bg-purple-500/10 text-purple-500",
  communication: "bg-yellow-500/10 text-yellow-500",
  creative: "bg-pink-500/10 text-pink-500",
  productivity: "bg-orange-500/10 text-orange-500",
  security: "bg-red-500/10 text-red-500",
  other: "bg-gray-500/10 text-gray-500",
};

export default function MySkills() {
  const { data: mySkills, isLoading, refetch } = trpc.skills.mySkills.useQuery();
  const { data: createdSkills } = trpc.skills.myCreatedSkills.useQuery();

  const toggleMutation = trpc.skills.toggle.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Skill updated");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const uninstallMutation = trpc.skills.uninstall.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Skill uninstalled");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleToggle = (skillId: number, enabled: boolean) => {
    toggleMutation.mutate({ skillId, enabled });
  };

  const handleUninstall = (skillId: number) => {
    if (confirm("Are you sure you want to uninstall this skill?")) {
      uninstallMutation.mutate({ skillId });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Link href="/skills">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-3xl font-bold tracking-tight">My Skills</h1>
            </div>
            <p className="text-muted-foreground mt-1">
              Manage your installed skills and create new ones
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/skills">
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Browse Skills
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

        {/* Installed Skills */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Installed Skills</h2>
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-16 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : mySkills && mySkills.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mySkills.map(({ skill, isEnabled }) => (
                <Card key={skill.id} className={isEnabled ? "" : "opacity-60"}>
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
                      <Switch
                        checked={isEnabled === 1}
                        onCheckedChange={(checked) => handleToggle(skill.id, checked)}
                      />
                    </div>
                    <CardDescription className="line-clamp-2 mt-2">
                      {skill.description}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="flex gap-2">
                    <Link href={`/skills/${skill.slug}`} className="flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        View Details
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUninstall(skill.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No skills installed</h3>
                <p className="text-muted-foreground mt-1">
                  Browse the marketplace to find skills that enhance your agent's capabilities.
                </p>
                <Link href="/skills">
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Browse Skills
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Created Skills */}
        {createdSkills && createdSkills.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Skills You Created</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {createdSkills.map((skill) => (
                <Card key={skill.id}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${categoryColors[skill.category] || categoryColors.other}`}>
                        {categoryIcons[skill.category] || categoryIcons.other}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{skill.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={skill.isPublic ? "default" : "secondary"}>
                            {skill.isPublic ? "Public" : "Private"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <CardDescription className="line-clamp-2 mt-2">
                      {skill.description}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="flex gap-2">
                    <Link href={`/skills/${skill.slug}`} className="flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        View
                      </Button>
                    </Link>
                    <Link href={`/skills/edit/${skill.slug}`}>
                      <Button variant="secondary" size="sm">
                        Edit
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Installed Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mySkills?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mySkills?.filter((s) => s.isEnabled === 1).length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Skills Created
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{createdSkills?.length || 0}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
