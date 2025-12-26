import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Webhook, Trash2, RefreshCw, CheckCircle, XCircle, Clock, Download, Copy, Eye, EyeOff } from "lucide-react";

export default function Webhooks() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    name: "",
    url: "",
    secret: "",
    events: [] as string[],
  });
  const [selectedWebhookId, setSelectedWebhookId] = useState<number | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  const utils = trpc.useUtils();
  const { data: webhooks, isLoading } = trpc.webhooks.list.useQuery();
  const { data: availableEvents } = trpc.webhooks.getAvailableEvents.useQuery();
  const { data: deliveries } = trpc.webhooks.getDeliveries.useQuery(
    { webhookId: selectedWebhookId!, limit: 50 },
    { enabled: !!selectedWebhookId }
  );

  const createMutation = trpc.webhooks.create.useMutation({
    onSuccess: () => {
      toast.success("Webhook created successfully");
      setIsCreateOpen(false);
      setNewWebhook({ name: "", url: "", secret: "", events: [] });
      utils.webhooks.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.webhooks.delete.useMutation({
    onSuccess: () => {
      toast.success("Webhook deleted");
      utils.webhooks.list.invalidate();
    },
  });

  const toggleMutation = trpc.webhooks.toggleActive.useMutation({
    onSuccess: () => {
      utils.webhooks.list.invalidate();
    },
  });

  const retryMutation = trpc.webhooks.retryDelivery.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Delivery retried");
        utils.webhooks.getDeliveries.invalidate();
      } else {
        toast.error("Retry failed");
      }
    },
  });

  const { data: exportData, refetch: exportRefetch } = trpc.webhooks.exportData.useQuery(
    { format: "json", includeMemories: true, includeSkills: true },
    { enabled: false }
  );

  const handleExport = async () => {
    const result = await exportRefetch();
    if (result.data) {
      const blob = new Blob([result.data.data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `notus-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data exported successfully");
    }
  };

  const handleEventToggle = (event: string) => {
    setNewWebhook(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event],
    }));
  };

  const handleCreate = () => {
    if (!newWebhook.name || !newWebhook.url || newWebhook.events.length === 0) {
      toast.error("Please fill in all required fields and select at least one event");
      return;
    }
    createMutation.mutate(newWebhook as any);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Webhooks & Integrations</h1>
            <p className="text-muted-foreground mt-1">
              Connect Notus to external services with webhooks
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Webhook
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Webhook</DialogTitle>
                  <DialogDescription>
                    Configure a webhook to receive events from Notus
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      placeholder="My Webhook"
                      value={newWebhook.name}
                      onChange={(e) => setNewWebhook(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Endpoint URL</Label>
                    <Input
                      placeholder="https://your-server.com/webhook"
                      value={newWebhook.url}
                      onChange={(e) => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Secret (optional)</Label>
                    <div className="relative">
                      <Input
                        type={showSecret ? "text" : "password"}
                        placeholder="Signing secret for verification"
                        value={newWebhook.secret}
                        onChange={(e) => setNewWebhook(prev => ({ ...prev, secret: e.target.value }))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowSecret(!showSecret)}
                      >
                        {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Used to sign payloads with HMAC-SHA256
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Events</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {availableEvents?.map((event) => (
                        <div key={event.event} className="flex items-center space-x-2">
                          <Checkbox
                            id={event.event}
                            checked={newWebhook.events.includes(event.event)}
                            onCheckedChange={() => handleEventToggle(event.event)}
                          />
                          <label
                            htmlFor={event.event}
                            className="text-sm cursor-pointer"
                          >
                            {event.event}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={createMutation.isPending}>
                    Create Webhook
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="webhooks" className="space-y-4">
          <TabsList>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="deliveries">Delivery History</TabsTrigger>
            <TabsTrigger value="events">Available Events</TabsTrigger>
          </TabsList>

          <TabsContent value="webhooks" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading webhooks...</div>
            ) : webhooks?.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Webhook className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No webhooks configured</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Create a webhook to start receiving events
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {webhooks?.map((webhook) => (
                  <Card key={webhook.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Webhook className="h-5 w-5 text-primary" />
                          <div>
                            <CardTitle className="text-lg">{webhook.name}</CardTitle>
                            <CardDescription className="font-mono text-xs">
                              {webhook.url}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={webhook.isActive}
                            onCheckedChange={() => toggleMutation.mutate({ webhookId: webhook.id })}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedWebhookId(webhook.id)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate({ webhookId: webhook.id })}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1">
                        {webhook.events.map((event) => (
                          <Badge key={event} variant="secondary" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="deliveries" className="space-y-4">
            {!selectedWebhookId ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Select a webhook to view delivery history
                </CardContent>
              </Card>
            ) : deliveries?.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No deliveries yet
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {deliveries?.map((delivery) => (
                  <Card key={delivery.id}>
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(delivery.status)}
                          <div>
                            <div className="font-medium">{delivery.event}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(delivery.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {delivery.statusCode && (
                            <Badge variant={delivery.statusCode < 400 ? "default" : "destructive"}>
                              {delivery.statusCode}
                            </Badge>
                          )}
                          {delivery.status === "failed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => retryMutation.mutate({ deliveryId: delivery.id })}
                            >
                              Retry
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Available Webhook Events</CardTitle>
                <CardDescription>
                  Events that can trigger webhook deliveries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {availableEvents?.map((event) => (
                    <div key={event.event} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Badge variant="outline" className="font-mono">
                        {event.event}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {event.description}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
