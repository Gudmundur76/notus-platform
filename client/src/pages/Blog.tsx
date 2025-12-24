import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Calendar, Clock, User, ArrowRight } from "lucide-react";

const featuredPost = {
  title: "Introducing Notus AI: A Quality-First Approach to Autonomous Agents",
  description: "Today we're excited to announce the launch of Notus AI, a platform built from the ground up with quality as the primary focus. Learn about our vision, architecture, and what makes us different.",
  author: "Gudmundur Kristjansson",
  date: "December 24, 2024",
  readTime: "8 min read",
  category: "Announcement",
  image: "/api/placeholder/800/400",
};

const posts = [
  {
    title: "Understanding Mirror Agents: How AI Debates Lead to Better Knowledge",
    description: "Deep dive into our mirror agent architecture and how thesis-antithesis-synthesis leads to refined, high-quality knowledge extraction.",
    author: "AI Research Team",
    date: "December 20, 2024",
    readTime: "12 min read",
    category: "Technical",
  },
  {
    title: "Building a Memory System for AI Agents",
    description: "How we implemented cross-session memory persistence that allows agents to learn and remember context across interactions.",
    author: "Engineering Team",
    date: "December 15, 2024",
    readTime: "10 min read",
    category: "Engineering",
  },
  {
    title: "The Case for Quality-First AI Development",
    description: "Why we chose to prioritize quality over growth, and how this decision shapes every aspect of our platform.",
    author: "Gudmundur Kristjansson",
    date: "December 10, 2024",
    readTime: "6 min read",
    category: "Vision",
  },
  {
    title: "Deploying AI Agents on RunPod: A Complete Guide",
    description: "Step-by-step tutorial on deploying Notus agents on RunPod for GPU-accelerated inference and processing.",
    author: "DevOps Team",
    date: "December 5, 2024",
    readTime: "15 min read",
    category: "Tutorial",
  },
  {
    title: "Knowledge Graphs for AI: Connecting the Dots",
    description: "How we use knowledge graphs to visualize and navigate the connections between concepts learned by our agents.",
    author: "AI Research Team",
    date: "December 1, 2024",
    readTime: "9 min read",
    category: "Technical",
  },
  {
    title: "Mobile Next Integration: Automated Testing for Mobile Apps",
    description: "Introducing our Mobile Next integration for automated mobile testing with AI-powered quality assurance.",
    author: "Mobile Team",
    date: "November 28, 2024",
    readTime: "7 min read",
    category: "Product",
  },
];

const categories = ["All", "Announcement", "Technical", "Engineering", "Tutorial", "Vision", "Product"];

export default function Blog() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-primary/5 to-background">
          <div className="container max-w-6xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              Blog
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Insights, Updates, and
              <span className="text-primary"> Ideas</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Stay up to date with the latest developments in autonomous AI,
              tutorials, and insights from our team.
            </p>
          </div>
        </section>

        {/* Categories */}
        <section className="py-8 px-4 border-b">
          <div className="container max-w-6xl mx-auto">
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={category === "All" ? "default" : "outline"}
                  size="sm"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Post */}
        <section className="py-12 px-4">
          <div className="container max-w-6xl mx-auto">
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="md:flex">
                <div className="md:w-2/5 bg-gradient-to-br from-primary/20 to-primary/5 p-8 flex items-center justify-center">
                  <div className="text-6xl">🚀</div>
                </div>
                <div className="md:w-3/5 p-6">
                  <Badge className="mb-4">{featuredPost.category}</Badge>
                  <CardTitle className="text-2xl mb-4">{featuredPost.title}</CardTitle>
                  <CardDescription className="text-base mb-6">
                    {featuredPost.description}
                  </CardDescription>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{featuredPost.author}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{featuredPost.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{featuredPost.readTime}</span>
                    </div>
                  </div>
                  <Button>
                    Read Article <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className="py-12 px-4">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">Latest Posts</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Card key={post.title} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{post.category}</Badge>
                      <span className="text-xs text-muted-foreground">{post.readTime}</span>
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{post.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="line-clamp-3 mb-4">
                      {post.description}
                    </CardDescription>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{post.author}</span>
                      <span>{post.date}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Load More */}
        <section className="py-8 px-4">
          <div className="container max-w-6xl mx-auto text-center">
            <Button variant="outline" size="lg">Load More Posts</Button>
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Subscribe to our newsletter</h2>
            <p className="text-muted-foreground mb-8">
              Get the latest posts delivered directly to your inbox.
            </p>
            <div className="flex gap-4 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button>Subscribe</Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
