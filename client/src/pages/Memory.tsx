import { useAuth } from "@/_core/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Brain, MessageSquare, Settings, Search, Trash2, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function Memory() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [newMemoryKey, setNewMemoryKey] = useState("");
  const [newMemoryValue, setNewMemoryValue] = useState("");

  // Fetch data
  const { data: memories, refetch: refetchMemories } = trpc.memory.entries.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: conversations } = trpc.memory.conversations.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: preferences } = trpc.memory.preferences.get.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Mutations
  const createMemory = trpc.memory.entries.create.useMutation({
    onSuccess: () => {
      toast.success("Memory created successfully");
      refetchMemories();
      setNewMemoryKey("");
      setNewMemoryValue("");
    },
    onError: (error) => {
      toast.error(`Failed to create memory: ${error.message}`);
    },
  });

  const deleteMemory = trpc.memory.entries.delete.useMutation({
    onSuccess: () => {
      toast.success("Memory deleted");
      refetchMemories();
    },
    onError: (error) => {
      toast.error(`Failed to delete memory: ${error.message}`);
    },
  });

  const handleCreateMemory = () => {
    if (!newMemoryKey || !newMemoryValue) {
      toast.error("Please provide both key and value");
      return;
    }

    createMemory.mutate({
      type: "fact",
      key: newMemoryKey,
      value: newMemoryValue,
      importance: 7,
    });
  };

  const handleDeleteMemory = (memoryId: number) => {
    if (confirm("Are you sure you want to delete this memory?")) {
      deleteMemory.mutate({ memoryId });
    }
  };

  // Filter memories based on search
  const filteredMemories = memories?.filter(
    (m) =>
      m.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-12">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>
                Please log in to access your memory and conversation history.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => (window.location.href = getLoginUrl())} className="w-full">
                Log In
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      <Header />

      <main className="flex-1 container py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Memory & Context</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              View and manage your AI's memory, conversation history, and learned preferences.
              This helps the AI provide more personalized and context-aware responses.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Memories</CardDescription>
                <CardTitle className="text-3xl">{memories?.length || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Conversations</CardDescription>
                <CardTitle className="text-3xl">{conversations?.length || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Preferences Set</CardDescription>
                <CardTitle className="text-3xl">
                  {preferences ? Object.keys(preferences).length : 0}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="memories" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="memories">
                <Brain className="h-4 w-4 mr-2" />
                Memories
              </TabsTrigger>
              <TabsTrigger value="conversations">
                <MessageSquare className="h-4 w-4 mr-2" />
                Conversations
              </TabsTrigger>
              <TabsTrigger value="preferences">
                <Settings className="h-4 w-4 mr-2" />
                Preferences
              </TabsTrigger>
            </TabsList>

            {/* Memories Tab */}
            <TabsContent value="memories" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Memory Entries</CardTitle>
                  <CardDescription>
                    Facts, preferences, and context the AI has learned about you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search memories..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Add New Memory */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Memory key (e.g., favorite_color)"
                      value={newMemoryKey}
                      onChange={(e) => setNewMemoryKey(e.target.value)}
                    />
                    <Input
                      placeholder="Memory value (e.g., blue)"
                      value={newMemoryValue}
                      onChange={(e) => setNewMemoryValue(e.target.value)}
                    />
                    <Button
                      onClick={handleCreateMemory}
                      disabled={createMemory.isPending}
                      size="icon"
                    >
                      {createMemory.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Memory List */}
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {filteredMemories && filteredMemories.length > 0 ? (
                        filteredMemories.map((memory) => (
                          <Card key={memory.id} className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{memory.type}</Badge>
                                  <span className="font-medium">{memory.key}</span>
                                </div>
                                <p className="text-sm text-muted-foreground">{memory.value}</p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span>Importance: {memory.importance}/10</span>
                                  <span>Accessed: {memory.accessCount} times</span>
                                  {memory.source && <span>Source: {memory.source}</span>}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteMemory(memory.id)}
                                disabled={deleteMemory.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </Card>
                        ))
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No memories found. Start a conversation to build your memory!</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Conversations Tab */}
            <TabsContent value="conversations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Conversation History</CardTitle>
                  <CardDescription>
                    Your past conversations with the AI assistant
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {conversations && conversations.length > 0 ? (
                        conversations.map((conv) => (
                          <Card key={conv.id} className="p-4 cursor-pointer hover:bg-accent/50">
                            <div className="space-y-2">
                              <div className="flex items-start justify-between">
                                <h3 className="font-medium">
                                  {conv.title || `Conversation #${conv.id}`}
                                </h3>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(conv.lastMessageAt).toLocaleDateString()}
                                </span>
                              </div>
                              {conv.summary && (
                                <p className="text-sm text-muted-foreground">{conv.summary}</p>
                              )}
                            </div>
                          </Card>
                        ))
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No conversations yet. Start chatting to build your history!</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>User Preferences</CardTitle>
                  <CardDescription>
                    Settings and preferences the AI has learned about you
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    {preferences && Object.keys(preferences).length > 0 ? (
                      <div className="space-y-4">
                        {Object.entries(preferences).map(([key, value]) => (
                          <div
                            key={key}
                            className="flex items-center justify-between p-4 border rounded-lg"
                          >
                            <div>
                              <p className="font-medium">{key}</p>
                              <p className="text-sm text-muted-foreground">
                                {JSON.stringify(value)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No preferences set yet. Use the AI to learn your preferences!</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
