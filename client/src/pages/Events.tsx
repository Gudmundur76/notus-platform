import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Video,
  ExternalLink,
} from "lucide-react";

const upcomingEvents = [
  {
    title: "Notus AI Launch Event",
    description: "Join us for the official launch of Notus AI platform. Learn about autonomous agents, mirror dialogues, and continuous learning.",
    date: "January 15, 2025",
    time: "10:00 AM PST",
    location: "Virtual",
    type: "Launch",
    attendees: 500,
    featured: true,
  },
  {
    title: "Building Autonomous Agents Workshop",
    description: "Hands-on workshop covering agent configuration, training pipelines, and deployment strategies.",
    date: "January 22, 2025",
    time: "2:00 PM PST",
    location: "Virtual",
    type: "Workshop",
    attendees: 150,
    featured: false,
  },
  {
    title: "Mirror Agents Deep Dive",
    description: "Technical session exploring the mirror agent architecture, debate protocols, and knowledge extraction.",
    date: "February 5, 2025",
    time: "11:00 AM PST",
    location: "Virtual",
    type: "Technical",
    attendees: 200,
    featured: false,
  },
  {
    title: "AI Ethics & Quality-First Development",
    description: "Panel discussion on building responsible AI systems with quality-first approach.",
    date: "February 12, 2025",
    time: "3:00 PM PST",
    location: "San Francisco, CA",
    type: "Panel",
    attendees: 100,
    featured: false,
  },
];

const pastEvents = [
  {
    title: "Introduction to Notus Platform",
    date: "December 10, 2024",
    type: "Webinar",
    recording: true,
  },
  {
    title: "Memory Systems in AI Agents",
    date: "December 3, 2024",
    type: "Technical",
    recording: true,
  },
  {
    title: "RunPod Deployment Workshop",
    date: "November 28, 2024",
    type: "Workshop",
    recording: true,
  },
];

export default function Events() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-primary/5 to-background">
          <div className="container max-w-6xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              Events
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Learn, Connect, and
              <span className="text-primary"> Grow</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join our community events, workshops, and webinars to learn from experts
              and connect with other AI enthusiasts.
            </p>
          </div>
        </section>

        {/* Featured Event */}
        {upcomingEvents.filter(e => e.featured).map((event) => (
          <section key={event.title} className="py-8 px-4">
            <div className="container max-w-6xl mx-auto">
              <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge>Featured Event</Badge>
                    <Badge variant="outline">{event.type}</Badge>
                  </div>
                  <CardTitle className="text-2xl">{event.title}</CardTitle>
                  <CardDescription className="text-base">{event.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-6 mb-6">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{event.attendees}+ registered</span>
                    </div>
                  </div>
                  <Button size="lg">Register Now</Button>
                </CardContent>
              </Card>
            </div>
          </section>
        ))}

        {/* Upcoming Events */}
        <section className="py-16 px-4">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Upcoming Events</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {upcomingEvents.filter(e => !e.featured).map((event) => (
                <Card key={event.title} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{event.type}</Badge>
                      <span className="text-sm text-muted-foreground">{event.date}</span>
                    </div>
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <CardDescription>{event.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4 mb-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{event.attendees} spots</span>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">Register</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Past Events */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Past Events</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {pastEvents.map((event) => (
                <Card key={event.title} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary">{event.type}</Badge>
                      <span className="text-sm text-muted-foreground">{event.date}</span>
                    </div>
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {event.recording && (
                      <Button variant="ghost" className="w-full">
                        <Video className="mr-2 h-4 w-4" /> Watch Recording
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="py-20 px-4">
          <div className="container max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Never miss an event</h2>
            <p className="text-muted-foreground mb-8">
              Subscribe to our newsletter to get notified about upcoming events and workshops.
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
