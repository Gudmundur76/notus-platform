import { useParams, Link } from 'wouter';
import { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, Clock, Tag, Share2, Twitter, Linkedin, Link as LinkIcon, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { getArticleBySlug, getRelatedArticles, BlogArticle as BlogArticleType } from '@/data/blogArticles';

export default function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<BlogArticleType | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<BlogArticleType[]>([]);
  

  useEffect(() => {
    if (slug) {
      const foundArticle = getArticleBySlug(slug);
      setArticle(foundArticle || null);
      
      if (foundArticle) {
        setRelatedArticles(getRelatedArticles(slug, 3));
        // Update document title for SEO
        document.title = `${foundArticle.title} | Notus AI Blog`;
      }
    }
  }, [slug]);

  const handleShare = async (platform: 'twitter' | 'linkedin' | 'copy') => {
    const url = window.location.href;
    const title = article?.title || '';

    switch (platform) {
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
          '_blank'
        );
        break;
      case 'linkedin':
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
          '_blank'
        );
        break;
      case 'copy':
        await navigator.clipboard.writeText(url);
        toast.success('Link copied!', {
          description: 'Article URL has been copied to clipboard.',
        });
        break;
    }
  };

  const renderMarkdown = (content: string) => {
    // Simple markdown rendering
    let html = content
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mt-8 mb-4">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-10 mb-4">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-8 mb-6">$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Code blocks
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => 
        `<pre class="bg-muted p-4 rounded-lg overflow-x-auto my-6"><code class="text-sm">${code.trim()}</code></pre>`
      )
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm">$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline">$1</a>')
      // Blockquotes
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground">$1</blockquote>')
      // Lists
      .replace(/^\- (.*$)/gim, '<li class="ml-6 list-disc">$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-6 list-decimal">$1</li>')
      // Tables
      .replace(/\|(.+)\|/g, (match) => {
        const cells = match.split('|').filter(c => c.trim());
        if (cells.every(c => c.trim().match(/^-+$/))) {
          return ''; // Skip separator row
        }
        const isHeader = match.includes('---');
        const cellTag = isHeader ? 'th' : 'td';
        const cellClass = isHeader ? 'font-semibold bg-muted' : '';
        return `<tr>${cells.map(c => `<${cellTag} class="border px-4 py-2 ${cellClass}">${c.trim()}</${cellTag}>`).join('')}</tr>`;
      })
      // Paragraphs
      .replace(/\n\n/g, '</p><p class="my-4">')
      // Line breaks
      .replace(/\n/g, '<br/>');

    // Wrap in paragraph
    html = `<p class="my-4">${html}</p>`;
    
    // Clean up empty paragraphs
    html = html.replace(/<p class="my-4"><\/p>/g, '');
    html = html.replace(/<p class="my-4"><br\/>/g, '<p class="my-4">');

    return html;
  };

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The article you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/blog">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const categoryColors: Record<string, string> = {
    'Announcement': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'Technical': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'Engineering': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'Tutorial': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    'Vision': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    'Product': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b">
        <div className="container max-w-4xl py-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/blog" className="hover:text-foreground">Blog</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground truncate max-w-[200px]">{article.title}</span>
          </nav>
        </div>
      </div>

      {/* Article Header */}
      <header className="container max-w-4xl pt-12 pb-8">
        <Link href="/blog">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Button>
        </Link>

        <Badge className={categoryColors[article.category] || 'bg-gray-100 text-gray-800'}>
          {article.category}
        </Badge>

        <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6 leading-tight">
          {article.title}
        </h1>

        <p className="text-xl text-muted-foreground mb-8">
          {article.excerpt}
        </p>

        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-semibold">
                {article.author.name.charAt(0)}
              </span>
            </div>
            <div>
              <p className="font-medium text-foreground">{article.author.name}</p>
              {article.author.role && (
                <p className="text-xs">{article.author.role}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{article.date}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{article.readTime}</span>
            </div>
          </div>
        </div>

        {/* Share buttons */}
        <div className="flex items-center gap-2 mt-6">
          <span className="text-sm text-muted-foreground mr-2">Share:</span>
          <Button variant="outline" size="icon" onClick={() => handleShare('twitter')}>
            <Twitter className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => handleShare('linkedin')}>
            <Linkedin className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => handleShare('copy')}>
            <LinkIcon className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <Separator />

      {/* Article Content */}
      <article className="container max-w-4xl py-12">
        <div 
          className="prose prose-lg dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content) }}
        />

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-12 pt-8 border-t">
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="w-4 h-4 text-muted-foreground" />
              {article.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Author Card */}
      <div className="container max-w-4xl pb-12">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold text-xl">
                  {article.author.name.charAt(0)}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-lg">{article.author.name}</h3>
                {article.author.role && (
                  <p className="text-muted-foreground text-sm mb-2">{article.author.role}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Building the future of AI at Notus. Passionate about quality-first development and autonomous agents.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <div className="bg-muted/30 py-16">
          <div className="container max-w-4xl">
            <h2 className="text-2xl font-bold mb-8">Related Articles</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedArticles.map((relatedArticle) => (
                <Link key={relatedArticle.slug} href={`/blog/${relatedArticle.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <Badge className={`${categoryColors[relatedArticle.category] || 'bg-gray-100 text-gray-800'} mb-3`}>
                        {relatedArticle.category}
                      </Badge>
                      <h3 className="font-semibold mb-2 line-clamp-2">
                        {relatedArticle.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {relatedArticle.excerpt}
                      </p>
                      <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{relatedArticle.readTime}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Newsletter CTA */}
      <div className="container max-w-4xl py-16">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Stay Updated</h2>
            <p className="mb-6 opacity-90">
              Get the latest articles and updates delivered to your inbox.
            </p>
            <Link href="/blog">
              <Button variant="secondary" size="lg">
                Subscribe to Newsletter
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
