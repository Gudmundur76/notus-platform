import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Code, Copy, ExternalLink, Key, Zap, Database, Brain, MessageSquare } from "lucide-react";
import { toast } from "sonner";

const endpoints = [
  {
    category: "Tasks",
    icon: Zap,
    items: [
      { method: "POST", path: "/api/trpc/task.create", description: "Create a new task" },
      { method: "GET", path: "/api/trpc/task.list", description: "List all tasks" },
      { method: "GET", path: "/api/trpc/task.get", description: "Get task by ID" },
      { method: "POST", path: "/api/trpc/task.execute", description: "Execute a task" },
      { method: "DELETE", path: "/api/trpc/task.delete", description: "Delete a task" },
    ],
  },
  {
    category: "Memory",
    icon: Database,
    items: [
      { method: "GET", path: "/api/trpc/memory.list", description: "List memory entries" },
      { method: "POST", path: "/api/trpc/memory.create", description: "Create memory entry" },
      { method: "GET", path: "/api/trpc/memory.search", description: "Search memories" },
      { method: "DELETE", path: "/api/trpc/memory.delete", description: "Delete memory" },
    ],
  },
  {
    category: "Mirror Agents",
    icon: Brain,
    items: [
      { method: "GET", path: "/api/trpc/mirrorAgent.list", description: "List mirror agents" },
      { method: "POST", path: "/api/trpc/mirrorAgent.debate", description: "Start agent debate" },
      { method: "GET", path: "/api/trpc/mirrorAgent.getDialogue", description: "Get dialogue history" },
    ],
  },
  {
    category: "Knowledge",
    icon: MessageSquare,
    items: [
      { method: "GET", path: "/api/trpc/knowledge.graph", description: "Get knowledge graph" },
      { method: "GET", path: "/api/trpc/knowledge.search", description: "Search knowledge" },
      { method: "POST", path: "/api/trpc/knowledge.extract", description: "Extract knowledge" },
    ],
  },
];

const codeExamples = {
  javascript: `// Initialize the client
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';

const client = createTRPCProxyClient({
  links: [
    httpBatchLink({
      url: 'https://api.notus.ai/api/trpc',
      headers: {
        Authorization: \`Bearer \${API_KEY}\`,
      },
    }),
  ],
});

// Create a task
const task = await client.task.create.mutate({
  description: "Analyze the latest AI research papers",
  type: "research",
});

// Execute the task
const result = await client.task.execute.mutate({
  taskId: task.id,
});

console.log(result);`,
  python: `# Install: pip install httpx
import httpx

API_KEY = "your_api_key"
BASE_URL = "https://api.notus.ai/api/trpc"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Create a task
response = httpx.post(
    f"{BASE_URL}/task.create",
    headers=headers,
    json={
        "description": "Analyze the latest AI research papers",
        "type": "research"
    }
)
task = response.json()

# Execute the task
result = httpx.post(
    f"{BASE_URL}/task.execute",
    headers=headers,
    json={"taskId": task["id"]}
)

print(result.json())`,
  curl: `# Create a task
curl -X POST https://api.notus.ai/api/trpc/task.create \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "description": "Analyze the latest AI research papers",
    "type": "research"
  }'

# Execute the task
curl -X POST https://api.notus.ai/api/trpc/task.execute \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"taskId": "task_123"}'`,
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  toast.success("Copied to clipboard");
};

export default function ApiDocs() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-primary/5 to-background">
          <div className="container max-w-6xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              API Documentation
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Build with the
              <span className="text-primary"> Notus API</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Integrate autonomous AI agents into your applications with our
              powerful and easy-to-use API.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg">
                <Key className="mr-2 h-4 w-4" /> Get API Key
              </Button>
              <Button size="lg" variant="outline">
                <ExternalLink className="mr-2 h-4 w-4" /> View on GitHub
              </Button>
            </div>
          </div>
        </section>

        {/* Quick Start */}
        <section className="py-16 px-4">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Quick Start</h2>
            <Card>
              <CardHeader>
                <CardTitle>Authentication</CardTitle>
                <CardDescription>
                  All API requests require authentication using a Bearer token.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-4 font-mono text-sm relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard('Authorization: Bearer YOUR_API_KEY')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <code>Authorization: Bearer YOUR_API_KEY</code>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Code Examples */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Code Examples</h2>
            <Card>
              <CardContent className="pt-6">
                <Tabs defaultValue="javascript">
                  <TabsList className="mb-4">
                    <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                    <TabsTrigger value="python">Python</TabsTrigger>
                    <TabsTrigger value="curl">cURL</TabsTrigger>
                  </TabsList>
                  {Object.entries(codeExamples).map(([lang, code]) => (
                    <TabsContent key={lang} value={lang}>
                      <div className="bg-zinc-900 rounded-lg p-4 relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 text-zinc-400 hover:text-white"
                          onClick={() => copyToClipboard(code)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <pre className="text-sm text-zinc-100 overflow-x-auto">
                          <code>{code}</code>
                        </pre>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Endpoints */}
        <section className="py-16 px-4">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">API Endpoints</h2>
            <div className="space-y-8">
              {endpoints.map((category) => (
                <Card key={category.category}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <category.icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle>{category.category}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {category.items.map((endpoint) => (
                        <div
                          key={endpoint.path}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <Badge
                              variant={endpoint.method === "GET" ? "secondary" : "default"}
                              className="font-mono"
                            >
                              {endpoint.method}
                            </Badge>
                            <code className="text-sm">{endpoint.path}</code>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {endpoint.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Rate Limits */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Rate Limits</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Free</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold mb-2">100</p>
                  <p className="text-muted-foreground">requests per day</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Pro</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold mb-2">10,000</p>
                  <p className="text-muted-foreground">requests per day</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Enterprise</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold mb-2">Unlimited</p>
                  <p className="text-muted-foreground">custom limits available</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4">
          <div className="container max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to build?</h2>
            <p className="text-muted-foreground mb-8">
              Get your API key and start integrating Notus AI into your applications.
            </p>
            <Button size="lg">
              <Key className="mr-2 h-4 w-4" /> Get Your API Key
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
