import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  Cloud,
  Copy,
  Download,
  ExternalLink,
  FileCode,
  Plus,
  RefreshCw,
  Rocket,
  Server,
  Settings,
  Trash2
} from "lucide-react";

const platformIcons: Record<string, React.ReactNode> = {
  vercel: <Cloud className="h-5 w-5" />,
  railway: <Server className="h-5 w-5" />,
  render: <Cloud className="h-5 w-5" />,
  docker: <FileCode className="h-5 w-5" />,
  aws: <Cloud className="h-5 w-5" />,
  gcp: <Cloud className="h-5 w-5" />,
  custom: <Settings className="h-5 w-5" />,
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  ready: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  deployed: "bg-green-500/10 text-green-500 border-green-500/20",
  failed: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function DeploymentManager() {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("vercel");
  const [configName, setConfigName] = useState("");
  const [generatedConfig, setGeneratedConfig] = useState<{ config: string; readme: string } | null>(null);

  const utils = trpc.useUtils();
  
  const { data: deployments, isLoading } = trpc.platform.deployments.list.useQuery();

  const createDeployment = trpc.platform.deployments.create.useMutation({
    onSuccess: () => {
      toast.success("Deployment config created", { description: "Your deployment configuration is ready." });
      utils.platform.deployments.list.invalidate();
      setConfigName("");
      setIsCreating(false);
    },
    onError: (error) => {
      toast.error("Error", { description: error.message });
    }
  });

  const deleteDeployment = trpc.platform.deployments.delete.useMutation({
    onSuccess: () => {
      toast.success("Deployment deleted", { description: "The deployment configuration has been removed." });
      utils.platform.deployments.list.invalidate();
    },
    onError: (error) => {
      toast.error("Error", { description: error.message });
    }
  });

  const generateVercelConfig = trpc.platform.deployments.generateVercel.useMutation({
    onSuccess: (data) => {
      setGeneratedConfig(data);
    },
    onError: (error) => {
      toast.error("Error", { description: error.message });
    }
  });

  const generateRailwayConfig = trpc.platform.deployments.generateRailway.useMutation({
    onSuccess: (data) => {
      setGeneratedConfig(data);
    },
    onError: (error) => {
      toast.error("Error", { description: error.message });
    }
  });

  const generateDockerConfig = trpc.platform.deployments.generateDocker.useMutation({
    onSuccess: (data) => {
      setGeneratedConfig(data);
    },
    onError: (error) => {
      toast.error("Error", { description: error.message });
    }
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const downloadConfig = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDefaultConfig = (platform: string) => {
    switch (platform) {
      case "vercel":
        return { framework: "vite", buildCommand: "pnpm build", outputDirectory: "dist", installCommand: "pnpm install", nodeVersion: "20.x" };
      case "railway":
        return { buildCommand: "pnpm build", startCommand: "node dist/index.js", healthcheckPath: "/api/health", restartPolicyType: "ON_FAILURE" };
      case "render":
        return { buildCommand: "pnpm build", startCommand: "node dist/index.js", healthCheckPath: "/api/health", envVarsFromGroups: [] };
      case "docker":
        return { baseImage: "node:20-alpine", exposePort: 3000, buildArgs: {}, healthCheck: "curl -f http://localhost:3000/api/health || exit 1" };
      case "aws":
        return { service: "ecs", region: "us-east-1" };
      case "gcp":
        return { service: "cloud-run", region: "us-central1" };
      default:
        return {};
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Deployment Manager</h1>
            <p className="text-muted-foreground">
              Generate deployment configurations for external platforms
            </p>
          </div>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Deployment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Deployment Configuration</DialogTitle>
                <DialogDescription>
                  Set up a new deployment configuration for your preferred platform.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="deploy-name">Configuration Name</Label>
                  <Input
                    id="deploy-name"
                    placeholder="e.g., Production Deployment"
                    value={configName}
                    onChange={(e) => setConfigName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deploy-platform">Platform</Label>
                  <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vercel">Vercel</SelectItem>
                      <SelectItem value="railway">Railway</SelectItem>
                      <SelectItem value="render">Render</SelectItem>
                      <SelectItem value="docker">Docker</SelectItem>
                      <SelectItem value="aws">AWS</SelectItem>
                      <SelectItem value="gcp">Google Cloud</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => createDeployment.mutate({
                    name: configName,
                    platform: selectedPlatform as any,
                    config: getDefaultConfig(selectedPlatform),
                  })}
                  disabled={!configName || createDeployment.isPending}
                >
                  <Rocket className="h-4 w-4 mr-2" />
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="configs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="configs">Configurations</TabsTrigger>
            <TabsTrigger value="generate">Generate Config</TabsTrigger>
          </TabsList>

          {/* Configurations Tab */}
          <TabsContent value="configs" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {isLoading ? (
                <Card className="col-span-full">
                  <CardContent className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </CardContent>
                </Card>
              ) : deployments?.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <Rocket className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold">No deployment configurations</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Create your first deployment configuration to get started
                    </p>
                  </CardContent>
                </Card>
              ) : (
                deployments?.map((deployment) => (
                  <Card key={deployment.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {platformIcons[deployment.platform]}
                          <CardTitle className="text-lg">{deployment.name}</CardTitle>
                        </div>
                        <Badge variant="outline" className={statusColors[deployment.status]}>
                          {deployment.status}
                        </Badge>
                      </div>
                      <CardDescription className="capitalize">
                        {deployment.platform}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Created: {formatDate(deployment.createdAt)}</p>
                        {deployment.lastDeployedAt && (
                          <p>Last deployed: {formatDate(deployment.lastDeployedAt)}</p>
                        )}
                        {deployment.deploymentUrl && (
                          <a 
                            href={deployment.deploymentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View deployment
                          </a>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const config = JSON.parse(deployment.config);
                          copyToClipboard(JSON.stringify(config, null, 2));
                        }}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => deleteDeployment.mutate({ deploymentId: deployment.id })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Generate Config Tab */}
          <TabsContent value="generate" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => generateVercelConfig.mutate()}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Cloud className="h-6 w-6" />
                    <CardTitle>Vercel</CardTitle>
                  </div>
                  <CardDescription>
                    Generate vercel.json and deployment instructions
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button variant="outline" className="w-full" disabled={generateVercelConfig.isPending}>
                    {generateVercelConfig.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FileCode className="h-4 w-4 mr-2" />
                    )}
                    Generate
                  </Button>
                </CardFooter>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => generateRailwayConfig.mutate()}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Server className="h-6 w-6" />
                    <CardTitle>Railway</CardTitle>
                  </div>
                  <CardDescription>
                    Generate railway.toml and deployment instructions
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button variant="outline" className="w-full" disabled={generateRailwayConfig.isPending}>
                    {generateRailwayConfig.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FileCode className="h-4 w-4 mr-2" />
                    )}
                    Generate
                  </Button>
                </CardFooter>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => generateDockerConfig.mutate()}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <FileCode className="h-6 w-6" />
                    <CardTitle>Docker</CardTitle>
                  </div>
                  <CardDescription>
                    Generate Dockerfile and docker-compose.yml
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button variant="outline" className="w-full" disabled={generateDockerConfig.isPending}>
                    {generateDockerConfig.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FileCode className="h-4 w-4 mr-2" />
                    )}
                    Generate
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Generated Config Display */}
            {generatedConfig && (
              <Card>
                <CardHeader>
                  <CardTitle>Generated Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Configuration File</Label>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => copyToClipboard(generatedConfig.config)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => downloadConfig("config.json", generatedConfig.config)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                    <ScrollArea className="h-[200px]">
                      <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto">
                        {generatedConfig.config}
                      </pre>
                    </ScrollArea>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Deployment Instructions</Label>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => downloadConfig("DEPLOYMENT.md", generatedConfig.readme)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                    <ScrollArea className="h-[300px]">
                      <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                        {generatedConfig.readme}
                      </pre>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Platform Info */}
        <Card className="bg-muted/50">
          <CardContent className="py-4">
            <h3 className="font-semibold mb-2">Supported Platforms</h3>
            <div className="grid gap-2 md:grid-cols-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                <span><strong>Vercel</strong> - Serverless deployment</span>
              </div>
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                <span><strong>Railway</strong> - Container platform</span>
              </div>
              <div className="flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                <span><strong>Render</strong> - Cloud platform</span>
              </div>
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4" />
                <span><strong>Docker</strong> - Container images</span>
              </div>
              <div className="flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                <span><strong>AWS</strong> - ECS, Lambda, EC2</span>
              </div>
              <div className="flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                <span><strong>GCP</strong> - Cloud Run, App Engine</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
