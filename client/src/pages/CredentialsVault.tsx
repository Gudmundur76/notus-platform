import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  AlertTriangle,
  Clock, 
  Eye,
  EyeOff,
  Key,
  Lock,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  ExternalLink
} from "lucide-react";

const categoryIcons: Record<string, React.ReactNode> = {
  api_key: <Key className="h-4 w-4" />,
  oauth_token: <Lock className="h-4 w-4" />,
  database: <Shield className="h-4 w-4" />,
  service: <ExternalLink className="h-4 w-4" />,
  other: <Key className="h-4 w-4" />,
};

const categoryColors: Record<string, string> = {
  api_key: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  oauth_token: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  database: "bg-green-500/10 text-green-500 border-green-500/20",
  service: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  other: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

export default function CredentialsVault() {
  const [isAdding, setIsAdding] = useState(false);
  const [showValue, setShowValue] = useState<number | null>(null);
  const [revealedValue, setRevealedValue] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("api_key");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [serviceUrl, setServiceUrl] = useState("");

  const utils = trpc.useUtils();
  
  const { data: credentials, isLoading } = trpc.platform.credentials.list.useQuery();
  const { data: needsRotation } = trpc.platform.credentials.needingRotation.useQuery();
  const { data: expiring } = trpc.platform.credentials.expiring.useQuery({ daysUntilExpiry: 30 });

  const storeCredential = trpc.platform.credentials.store.useMutation({
    onSuccess: () => {
      toast.success("Credential stored", { description: "Your credential has been securely encrypted and saved." });
      utils.platform.credentials.list.invalidate();
      resetForm();
      setIsAdding(false);
    },
    onError: (error) => {
      toast.error("Error", { description: error.message });
    }
  });

  const deleteCredential = trpc.platform.credentials.delete.useMutation({
    onSuccess: () => {
      toast.success("Credential deleted", { description: "The credential has been removed." });
      utils.platform.credentials.list.invalidate();
    },
    onError: (error) => {
      toast.error("Error", { description: error.message });
    }
  });



  const rotateCredential = trpc.platform.credentials.rotate.useMutation({
    onSuccess: () => {
      toast.success("Credential rotated", { description: "The credential value has been updated." });
      utils.platform.credentials.list.invalidate();
      utils.platform.credentials.needingRotation.invalidate();
    },
    onError: (error) => {
      toast.error("Error", { description: error.message });
    }
  });

  const resetForm = () => {
    setName("");
    setCategory("api_key");
    setValue("");
    setDescription("");
    setServiceUrl("");
  };

  const handleReveal = async (credentialId: number) => {
    if (showValue === credentialId) {
      setShowValue(null);
      setRevealedValue(null);
    } else {
      setShowValue(credentialId);
      // Fetch credential value directly via tRPC client
      try {
        const result = await utils.client.platform.credentials.get.query({ credentialId });
        if (result) {
          setRevealedValue(result.value);
        }
      } catch (error) {
        toast.error("Error", { description: "Failed to retrieve credential" });
      }
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Credentials Vault</h1>
            <p className="text-muted-foreground">
              Securely store and manage API keys, tokens, and secrets
            </p>
          </div>
          <Dialog open={isAdding} onOpenChange={setIsAdding}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Credential
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Credential</DialogTitle>
                <DialogDescription>
                  Store a new credential securely with AES-256 encryption.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="cred-name">Name</Label>
                  <Input
                    id="cred-name"
                    placeholder="e.g., OpenAI API Key"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cred-category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="api_key">API Key</SelectItem>
                      <SelectItem value="oauth_token">OAuth Token</SelectItem>
                      <SelectItem value="database">Database Credential</SelectItem>
                      <SelectItem value="service">Service Account</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cred-value">Value</Label>
                  <Input
                    id="cred-value"
                    type="password"
                    placeholder="Enter the secret value"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cred-desc">Description (optional)</Label>
                  <Textarea
                    id="cred-desc"
                    placeholder="What is this credential used for?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cred-url">Service URL (optional)</Label>
                  <Input
                    id="cred-url"
                    placeholder="https://api.example.com"
                    value={serviceUrl}
                    onChange={(e) => setServiceUrl(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { resetForm(); setIsAdding(false); }}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => storeCredential.mutate({
                    name,
                    category: category as "api_key" | "oauth_token" | "database" | "service" | "other",
                    value,
                    description: description || undefined,
                    serviceUrl: serviceUrl || undefined,
                  })}
                  disabled={!name || !value || storeCredential.isPending}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Store Securely
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Alerts */}
        {((needsRotation && needsRotation.length > 0) || (expiring && expiring.length > 0)) && (
          <div className="space-y-2">
            {needsRotation && needsRotation.length > 0 && (
              <Card className="border-yellow-500/50 bg-yellow-500/5">
                <CardContent className="flex items-center gap-3 py-3">
                  <RefreshCw className="h-5 w-5 text-yellow-500" />
                  <div className="flex-1">
                    <p className="font-medium text-yellow-600">
                      {needsRotation.length} credential{needsRotation.length > 1 ? "s" : ""} need rotation
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {needsRotation.map(c => c.name).join(", ")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            {expiring && expiring.length > 0 && (
              <Card className="border-red-500/50 bg-red-500/5">
                <CardContent className="flex items-center gap-3 py-3">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <div className="flex-1">
                    <p className="font-medium text-red-600">
                      {expiring.length} credential{expiring.length > 1 ? "s" : ""} expiring soon
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {expiring.map(c => `${c.name} (${c.daysUntilExpiry} days)`).join(", ")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Credentials List */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Credentials</TabsTrigger>
            <TabsTrigger value="api_key">API Keys</TabsTrigger>
            <TabsTrigger value="oauth_token">OAuth Tokens</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
          </TabsList>

          {["all", "api_key", "oauth_token", "database"].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-4">
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {isLoading ? (
                    <Card>
                      <CardContent className="flex items-center justify-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                      </CardContent>
                    </Card>
                  ) : (
                    credentials
                      ?.filter((c) => tab === "all" || c.category === tab)
                      .map((credential) => (
                        <Card key={credential.id}>
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                {categoryIcons[credential.category]}
                                <CardTitle className="text-lg">{credential.name}</CardTitle>
                              </div>
                              <Badge variant="outline" className={categoryColors[credential.category]}>
                                {credential.category.replace("_", " ")}
                              </Badge>
                            </div>
                            {credential.description && (
                              <CardDescription>{credential.description}</CardDescription>
                            )}
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Last used: {formatDate(credential.lastUsedAt)}
                              </div>
                              {credential.serviceUrl && (
                                <a 
                                  href={credential.serviceUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 hover:text-primary"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Service
                                </a>
                              )}
                            </div>
                            
                            {showValue === credential.id && revealedValue && (
                              <div className="mt-3 p-3 bg-muted rounded-lg font-mono text-sm break-all">
                                {revealedValue}
                              </div>
                            )}
                          </CardContent>
                          <CardFooter className="pt-0 gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleReveal(credential.id)}
                            >
                              {showValue === credential.id ? (
                                <>
                                  <EyeOff className="h-4 w-4 mr-1" />
                                  Hide
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-1" />
                                  Reveal
                                </>
                              )}
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <RefreshCw className="h-4 w-4 mr-1" />
                                  Rotate
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Rotate Credential</DialogTitle>
                                  <DialogDescription>
                                    Enter the new value for "{credential.name}"
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                  <Label htmlFor="new-value">New Value</Label>
                                  <Input
                                    id="new-value"
                                    type="password"
                                    placeholder="Enter new secret value"
                                    className="mt-2"
                                  />
                                </div>
                                <DialogFooter>
                                  <Button 
                                    onClick={() => {
                                      const input = document.getElementById("new-value") as HTMLInputElement;
                                      if (input?.value) {
                                        rotateCredential.mutate({
                                          credentialId: credential.id,
                                          newValue: input.value,
                                        });
                                      }
                                    }}
                                  >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Rotate
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Credential</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{credential.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-500 hover:bg-red-600"
                                    onClick={() => deleteCredential.mutate({ credentialId: credential.id })}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </CardFooter>
                        </Card>
                      ))
                  )}
                  {!isLoading && credentials?.filter(c => tab === "all" || c.category === tab).length === 0 && (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                        <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="font-semibold">No credentials stored</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Add your first credential to get started
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>

        {/* Security Info */}
        <Card className="bg-muted/50">
          <CardContent className="flex items-start gap-3 py-4">
            <Shield className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Your credentials are secure</p>
              <p className="text-sm text-muted-foreground">
                All credentials are encrypted using AES-256-GCM encryption before storage. 
                Values are only decrypted when you explicitly request access, and all access is logged for audit purposes.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
