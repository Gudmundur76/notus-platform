import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  BookOpen,
  FileText,
  Video,
  Code,
  MessageCircle,
  HelpCircle,
  ExternalLink,
  Download,
  Github,
  Newspaper,
} from "lucide-react";

const documentation = [
  {
    icon: BookOpen,
    title: "Getting Started Guide",
    description: "Learn the basics of using Notus AI platform in under 10 minutes.",
    link: "#",
    badge: "Beginner",
  },
  {
    icon: Code,
    title: "API Reference",
    description: "Complete API documentation with examples and code snippets.",
    link: "/api-docs",
    badge: "Developer",
  },
  {
    icon: FileText,
    title: "Agent Configuration",
    description: "How to configure and customize AI agents for your use case.",
    link: "#",
    badge: "Advanced",
  },
  {
    icon: Video,
    title: "Video Tutorials",
    description: "Step-by-step video guides for common tasks and workflows.",
    link: "#",
    badge: "Visual",
  },
];

const resources = [
  {
    icon: Github,
    title: "GitHub Repository",
    description: "Access the open-source codebase, contribute, and report issues.",
    link: "https://github.com/Gudmundur76/notus-platform",
    external: true,
  },
  {
    icon: Newspaper,
    title: "Blog",
    description: "Latest updates, tutorials, and insights from the Notus team.",
    link: "/blog",
    external: false,
  },
  {
    icon: MessageCircle,
    title: "Community Forum",
    description: "Connect with other users, share ideas, and get help.",
    link: "#",
    external: true,
  },
  {
    icon: HelpCircle,
    title: "Help Center",
    description: "FAQs, troubleshooting guides, and support resources.",
    link: "#",
    external: false,
  },
];

const downloads = [
  {
    title: "Notus Mobile App",
    description: "React Native app for iOS and Android",
    version: "1.0.0",
    size: "26MB",
  },
  {
    title: "RunPod Deployment Kit",
    description: "Docker and deployment scripts for GPU compute",
    version: "1.0.0",
    size: "5MB",
  },
  {
    title: "Mobile Next Integration",
    description: "Mobile automation testing framework",
    version: "1.0.0",
    size: "3MB",
  },
];

export default function Resources() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-primary/5 to-background">
          <div className="container max-w-6xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              Resources
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Learn, Build, and
              <span className="text-primary"> Succeed</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to get the most out of Notus AI platform.
              Documentation, tutorials, and community resources.
            </p>
          </div>
        </section>

        {/* Documentation Section */}
        <section className="py-16 px-4">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Documentation</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {documentation.map((doc) => (
                <Card key={doc.title} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <doc.icon className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg">{doc.title}</CardTitle>
                      </div>
                      <Badge variant="outline">{doc.badge}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">{doc.description}</CardDescription>
                    <Button variant="outline" size="sm" asChild>
                      <a href={doc.link}>
                        Read More <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Resources Grid */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Community & Support</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {resources.map((resource) => (
                <Card key={resource.title} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <resource.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{resource.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <CardDescription className="mb-4">{resource.description}</CardDescription>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={resource.link} target={resource.external ? "_blank" : undefined} rel={resource.external ? "noopener noreferrer" : undefined}>
                        Visit {resource.external && <ExternalLink className="ml-1 h-3 w-3" />}
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Downloads Section */}
        <section className="py-16 px-4">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Downloads</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {downloads.map((download) => (
                <Card key={download.title} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{download.title}</CardTitle>
                    <CardDescription>{download.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <span>Version {download.version}</span>
                      <span>{download.size}</span>
                    </div>
                    <Button variant="outline" className="w-full">
                      <Download className="mr-2 h-4 w-4" /> Download
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
