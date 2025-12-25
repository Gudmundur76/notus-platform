import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Calendar, Clock, User, ArrowRight } from "lucide-react";
import { blogArticles, getFeaturedArticle, BlogArticle } from "@/data/blogArticles";

const categories = ["All", "Announcement", "Technical", "Engineering", "Tutorial", "Vision", "Product"];

const categoryColors: Record<string, string> = {
  'Announcement': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'Technical': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'Engineering': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'Tutorial': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'Vision': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  'Product': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
};

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const featuredPost = getFeaturedArticle();
  
  const filteredPosts = selectedCategory === "All" 
    ? blogArticles.filter(post => !post.featured)
    : blogArticles.filter(post => post.category === selectedCategory && !post.featured);

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
                  variant={category === selectedCategory ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Post */}
        {featuredPost && selectedCategory === "All" && (
          <section className="py-12 px-4">
            <div className="container max-w-6xl mx-auto">
              <Link href={`/blog/${featuredPost.slug}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="md:flex">
                    <div className="md:w-2/5 bg-gradient-to-br from-primary/20 to-primary/5 p-8 flex items-center justify-center">
                      <div className="text-6xl">🚀</div>
                    </div>
                    <div className="md:w-3/5 p-6">
                      <Badge className={categoryColors[featuredPost.category] || ''}>
                        {featuredPost.category}
                      </Badge>
                      <CardTitle className="text-2xl mb-4 mt-4">{featuredPost.title}</CardTitle>
                      <CardDescription className="text-base mb-6">
                        {featuredPost.excerpt}
                      </CardDescription>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{featuredPost.author.name}</span>
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
              </Link>
            </div>
          </section>
        )}

        {/* Blog Posts Grid */}
        <section className="py-12 px-4">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">
              {selectedCategory === "All" ? "Latest Posts" : `${selectedCategory} Posts`}
            </h2>
            {filteredPosts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No posts found in this category.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPosts.map((post) => (
                  <Link key={post.slug} href={`/blog/${post.slug}`}>
                    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <Badge 
                            variant="outline" 
                            className={categoryColors[post.category] || ''}
                          >
                            {post.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{post.readTime}</span>
                        </div>
                        <CardTitle className="text-lg line-clamp-2">{post.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="line-clamp-3 mb-4">
                          {post.excerpt}
                        </CardDescription>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{post.author.name}</span>
                          <span>{post.date}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
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
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
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
