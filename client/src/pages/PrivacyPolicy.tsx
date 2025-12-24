import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 px-4 bg-gradient-to-b from-primary/5 to-background">
          <div className="container max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              Legal
            </Badge>
            <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground">
              Last updated: December 24, 2024
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-12 px-4">
          <div className="container max-w-4xl mx-auto prose prose-neutral dark:prose-invert">
            <h2>1. Introduction</h2>
            <p>
              Notus AI ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform and services.
            </p>

            <h2>2. Information We Collect</h2>
            <h3>2.1 Information You Provide</h3>
            <p>We collect information you provide directly to us, including:</p>
            <ul>
              <li>Account information (name, email, password)</li>
              <li>Profile information (bio, avatar, preferences)</li>
              <li>Task content and instructions you submit</li>
              <li>Feedback and communications with us</li>
              <li>Payment information (processed securely by third-party providers)</li>
            </ul>

            <h3>2.2 Information Collected Automatically</h3>
            <p>When you use our platform, we automatically collect:</p>
            <ul>
              <li>Usage data (features used, time spent, interactions)</li>
              <li>Device information (browser type, operating system)</li>
              <li>Log data (IP address, access times, pages viewed)</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>

            <h2>3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, maintain, and improve our services</li>
              <li>Process your tasks and deliver results</li>
              <li>Train and improve our AI agents (with anonymized data)</li>
              <li>Communicate with you about updates and support</li>
              <li>Detect and prevent fraud and abuse</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2>4. AI Training and Data Usage</h2>
            <p>
              Our platform uses AI agents that learn and improve over time. We want to be transparent about how your data is used in this process:
            </p>
            <ul>
              <li>Task content may be used to improve AI performance</li>
              <li>Personal identifiers are removed before training</li>
              <li>You can opt out of AI training in your account settings</li>
              <li>Enterprise customers have additional data isolation options</li>
            </ul>

            <h2>5. Information Sharing</h2>
            <p>We do not sell your personal information. We may share information with:</p>
            <ul>
              <li>Service providers who assist in our operations</li>
              <li>Professional advisors (lawyers, accountants)</li>
              <li>Law enforcement when required by law</li>
              <li>Business partners with your consent</li>
            </ul>

            <h2>6. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your information, including:
            </p>
            <ul>
              <li>Encryption in transit and at rest</li>
              <li>Regular security assessments</li>
              <li>Access controls and authentication</li>
              <li>Employee training on data protection</li>
            </ul>

            <h2>7. Data Retention</h2>
            <p>
              We retain your information for as long as your account is active or as needed to provide services. You can request deletion of your data at any time through your account settings or by contacting us.
            </p>

            <h2>8. Your Rights</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul>
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Delete your data</li>
              <li>Export your data</li>
              <li>Opt out of certain processing</li>
              <li>Withdraw consent</li>
            </ul>

            <h2>9. International Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers.
            </p>

            <h2>10. Children's Privacy</h2>
            <p>
              Our services are not intended for children under 13. We do not knowingly collect information from children under 13.
            </p>

            <h2>11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
            </p>

            <h2>12. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at:
            </p>
            <ul>
              <li>Email: privacy@notus.ai</li>
              <li>Address: 123 AI Street, San Francisco, CA 94105</li>
            </ul>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
