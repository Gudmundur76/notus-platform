import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Heart,
  Zap,
  Globe,
  Users,
  Coffee,
  Laptop,
} from "lucide-react";

const openPositions = [
  {
    title: "Senior AI Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    salary: "$150k - $200k",
    description: "Build and optimize autonomous AI agents, implement training pipelines, and scale our platform.",
  },
  {
    title: "Full Stack Developer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    salary: "$120k - $160k",
    description: "Develop features across our React frontend and Node.js backend with TypeScript.",
  },
  {
    title: "ML Research Scientist",
    department: "Research",
    location: "San Francisco, CA",
    type: "Full-time",
    salary: "$180k - $250k",
    description: "Research and develop novel approaches to agent learning, memory systems, and knowledge extraction.",
  },
  {
    title: "Product Designer",
    department: "Design",
    location: "Remote",
    type: "Full-time",
    salary: "$100k - $140k",
    description: "Design intuitive interfaces for complex AI systems, from wireframes to polished UI.",
  },
  {
    title: "DevOps Engineer",
    department: "Infrastructure",
    location: "Remote",
    type: "Full-time",
    salary: "$130k - $170k",
    description: "Build and maintain our cloud infrastructure, CI/CD pipelines, and monitoring systems.",
  },
  {
    title: "Technical Writer",
    department: "Documentation",
    location: "Remote",
    type: "Part-time",
    salary: "$60k - $80k",
    description: "Create clear, comprehensive documentation for our APIs, SDKs, and platform features.",
  },
];

const benefits = [
  {
    icon: Globe,
    title: "Remote First",
    description: "Work from anywhere in the world with flexible hours.",
  },
  {
    icon: DollarSign,
    title: "Competitive Salary",
    description: "Top-of-market compensation with equity options.",
  },
  {
    icon: Heart,
    title: "Health Benefits",
    description: "Comprehensive health, dental, and vision coverage.",
  },
  {
    icon: Laptop,
    title: "Equipment Budget",
    description: "$3,000 budget for your home office setup.",
  },
  {
    icon: Coffee,
    title: "Unlimited PTO",
    description: "Take the time you need to recharge and stay productive.",
  },
  {
    icon: Zap,
    title: "Learning Budget",
    description: "$2,000 annual budget for courses and conferences.",
  },
];

const values = [
  {
    title: "Quality First",
    description: "We prioritize quality over speed. Every feature is thoroughly tested and refined.",
  },
  {
    title: "Continuous Learning",
    description: "Just like our AI agents, we're always learning and improving.",
  },
  {
    title: "Transparency",
    description: "Open communication, honest feedback, and clear expectations.",
  },
  {
    title: "Impact",
    description: "We build technology that makes a real difference in people's lives.",
  },
];

export default function Careers() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-primary/5 to-background">
          <div className="container max-w-6xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              Careers
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Join us in building the
              <span className="text-primary"> future of AI</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              We're looking for passionate people who want to push the boundaries
              of what's possible with autonomous AI agents.
            </p>
            <Button size="lg">View Open Positions</Button>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 px-4">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value) => (
                <Card key={value.title} className="text-center">
                  <CardHeader>
                    <CardTitle className="text-lg">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{value.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Benefits & Perks</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit) => (
                <Card key={benefit.title} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <benefit.icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{benefit.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{benefit.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Open Positions */}
        <section className="py-16 px-4">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Open Positions</h2>
            <div className="space-y-4">
              {openPositions.map((position) => (
                <Card key={position.title} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl mb-2">{position.title}</CardTitle>
                        <CardDescription>{position.description}</CardDescription>
                      </div>
                      <Button>Apply Now</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        <span>{position.department}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{position.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{position.type}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span>{position.salary}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Don't see the right role?</h2>
            <p className="text-muted-foreground mb-8">
              We're always looking for talented people. Send us your resume and we'll keep you in mind.
            </p>
            <Button size="lg" variant="outline">Send General Application</Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
