import { Link } from "wouter";
import { Zap, Github, Twitter, MessageCircle, ArrowUpRight } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background/50 backdrop-blur-sm mt-auto relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 hero-gradient opacity-30 pointer-events-none" />
      
      <div className="container py-16 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-[var(--neon-cyan)] to-[var(--neon-magenta)] rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-black" />
              </div>
              <span className="font-black text-xl gradient-text">AGENTFLOW</span>
            </div>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              The next generation AI agent orchestration platform. Build, deploy, and scale autonomous agents for your business.
            </p>
            <div className="flex gap-3">
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-lg bg-accent/50 hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-all hover:neon-glow"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-lg bg-accent/50 hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
              >
                <Github className="w-5 h-5" />
              </a>
              <a 
                href="https://discord.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-lg bg-accent/50 hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-foreground">Product</h3>
            <ul className="space-y-3">
              {[
                { href: "/features", label: "Features" },
                { href: "/pricing", label: "Pricing" },
                { href: "/skills-marketplace", label: "Marketplace" },
                { href: "/api-docs", label: "API" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>
                    <span className="text-sm text-muted-foreground hover:text-[var(--neon-cyan)] transition-colors cursor-pointer flex items-center gap-1 group">
                      {item.label}
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* AI Features */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-foreground">AI Features</h3>
            <ul className="space-y-3">
              {[
                { href: "/mirror-agents", label: "Mirror Agents" },
                { href: "/knowledge-graph", label: "Knowledge Graph" },
                { href: "/memory", label: "Memory System" },
                { href: "/training", label: "Training" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>
                    <span className="text-sm text-muted-foreground hover:text-[var(--neon-cyan)] transition-colors cursor-pointer flex items-center gap-1 group">
                      {item.label}
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-foreground">Resources</h3>
            <ul className="space-y-3">
              {[
                { href: "/resources", label: "Documentation" },
                { href: "/blog", label: "Blog" },
                { href: "/api-docs", label: "API Docs" },
                { href: "/events", label: "Events" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>
                    <span className="text-sm text-muted-foreground hover:text-[var(--neon-cyan)] transition-colors cursor-pointer flex items-center gap-1 group">
                      {item.label}
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-foreground">Company</h3>
            <ul className="space-y-3">
              {[
                { href: "/careers", label: "Careers" },
                { href: "/privacy", label: "Privacy" },
                { href: "mailto:hello@agentflow.ai", label: "Contact", external: true },
              ].map((item) => (
                <li key={item.href}>
                  {item.external ? (
                    <a href={item.href}>
                      <span className="text-sm text-muted-foreground hover:text-[var(--neon-cyan)] transition-colors cursor-pointer flex items-center gap-1 group">
                        {item.label}
                        <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                    </a>
                  ) : (
                    <Link href={item.href}>
                      <span className="text-sm text-muted-foreground hover:text-[var(--neon-cyan)] transition-colors cursor-pointer flex items-center gap-1 group">
                        {item.label}
                        <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 AgentFlow · Autonomous AI for Everyone
          </p>
          <div className="flex items-center gap-6">
            <span className="text-xs text-muted-foreground/60 uppercase tracking-wider">
              Built with
            </span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--neon-lime)] animate-pulse" />
              <span className="text-xs font-mono text-muted-foreground">v2.0.0</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
