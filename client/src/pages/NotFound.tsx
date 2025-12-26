import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { useLocation, Link } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Card className="w-full max-w-lg mx-4 shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-red-100 dark:bg-red-900/30 rounded-full animate-pulse" />
              <AlertCircle className="relative h-16 w-16 text-red-500" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">404</h1>

          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-4">
            Page Not Found
          </h2>

          <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
            Sorry, the page you are looking for doesn't exist.
            <br />
            It may have been moved or deleted.
          </p>

          <div
            id="not-found-button-group"
            className="flex flex-col sm:flex-row gap-3 justify-center mb-6"
          >
            <Button
              onClick={handleGoHome}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="px-6 py-2.5"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>

          {/* Quick Links */}
          <div className="border-t dark:border-slate-700 pt-6">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Or try one of these popular pages:
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/mirror-agents">Mirror Agents</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/skills">Skills</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/blog">Blog</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
