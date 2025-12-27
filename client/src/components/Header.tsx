import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Menu, X, Zap, Sparkles } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const { user, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="relative w-10 h-10 bg-gradient-to-br from-[var(--neon-cyan)] to-[var(--neon-magenta)] rounded-lg flex items-center justify-center overflow-hidden group-hover:neon-glow transition-all duration-300">
                <Zap className="w-6 h-6 text-black" />
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl tracking-tight gradient-text">AGENTFLOW</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">AI Orchestration</span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {[
              { href: "/features", label: "Features" },
              { href: "/skills-marketplace", label: "Marketplace" },
              { href: "/mirror-agents", label: "Agents" },
              { href: "/knowledge-graph", label: "Knowledge" },
              { href: "/pricing", label: "Pricing" },
            ].map((item) => (
              <Link key={item.href} href={item.href}>
                <span className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-all duration-200 cursor-pointer">
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="font-semibold">
                    Dashboard
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-magenta)] text-black font-bold hover:opacity-90 transition-opacity"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {user?.name || "Profile"}
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <a href={getLoginUrl()}>
                  <Button variant="ghost" size="sm" className="font-semibold">
                    Sign in
                  </Button>
                </a>
                <a href={getLoginUrl()}>
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-magenta)] text-black font-bold hover:opacity-90 transition-opacity px-6"
                  >
                    Get Started
                  </Button>
                </a>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 hover:bg-accent rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-6 border-t border-border/50 animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col gap-2">
              {[
                { href: "/features", label: "Features" },
                { href: "/skills-marketplace", label: "Marketplace" },
                { href: "/mirror-agents", label: "Agents" },
                { href: "/knowledge-graph", label: "Knowledge" },
                { href: "/pricing", label: "Pricing" },
                { href: "/resources", label: "Resources" },
              ].map((item) => (
                <Link key={item.href} href={item.href}>
                  <span className="block px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-all cursor-pointer">
                    {item.label}
                  </span>
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-4 mt-2 border-t border-border/50">
                {isAuthenticated ? (
                  <>
                    <Link href="/dashboard">
                      <Button variant="ghost" size="sm" className="w-full justify-start font-semibold">
                        Dashboard
                      </Button>
                    </Link>
                    <Link href="/profile">
                      <Button 
                        size="sm" 
                        className="w-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-magenta)] text-black font-bold"
                      >
                        {user?.name || "Profile"}
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <a href={getLoginUrl()}>
                      <Button variant="ghost" size="sm" className="w-full justify-start font-semibold">
                        Sign in
                      </Button>
                    </a>
                    <a href={getLoginUrl()}>
                      <Button 
                        size="sm" 
                        className="w-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-magenta)] text-black font-bold"
                      >
                        Get Started
                      </Button>
                    </a>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
