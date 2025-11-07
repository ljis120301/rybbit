import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart3,
  Users,
  Eye,
  Shield,
  Zap,
  Globe,
  TrendingUp,
  Filter,
  Clock,
  CheckCircle,
  ArrowRight,
  Smartphone,
  Languages,
  Share2,
  PieChart,
  UserPlus,
  Link2,
  Grid3x3,
  Layers,
  Tag,
  ChartLine,
  Activity,
  ArrowLeftRight,
  Sparkles,
  Target,
  UserCheck,
  DollarSign,
  Route,
  TrendingDown,
  ShieldCheck,
  UserX,
  Cookie,
  Database,
  Settings,
  Download,
  Upload,
  Mail,
} from "lucide-react";
import { EventTracking } from "@/components/Cards/EventTracking";
import { GoalConversion } from "@/components/Cards/GoalConversion";
import { RealTimeAnalytics } from "@/components/Cards/RealTimeAnalytics";
import { UserBehaviorTrends } from "@/components/Cards/UserBehaviorTrends";
import { UserFlowAnalysis } from "@/components/Cards/UserFlowAnalysis";
import { UserProfiles } from "@/components/Cards/UserProfiles";
import { UserSessions } from "@/components/Cards/UserSessions";
import { SessionReplay } from "@/components/Cards/SessionReplay";
import { WebVitals } from "@/components/Cards/WebVitals";
import { TrackedButton } from "@/components/TrackedButton";
import { DEFAULT_EVENT_LIMIT } from "@/lib/const";

export const metadata: Metadata = {
  title: "Features - Rybbit Analytics",
  description:
    "Powerful, privacy-friendly analytics features to help you understand your audience and grow your business. Real-time data, session replay, web vitals, and more.",
};

const analyticsFeatures = [
  {
    icon: <Eye className="w-5 h-5" />,
    title: "Page views",
    description: "Knowing which of your pages gets the most traffic is essential to improving your website content.",
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: "Visitors",
    description: "Get detailed information about your visitors like their device, browser, OS and location.",
  },
  {
    icon: <TrendingUp className="w-5 h-5" />,
    title: "Bounce rate",
    description: "See which pages keep your visitors engaged versus those they are abandoning.",
  },
  {
    icon: <Layers className="w-5 h-5" />,
    title: "Traffic sources",
    description: "See where your traffic is coming from to better understand where you should be spending your effort.",
  },
  {
    icon: <Globe className="w-5 h-5" />,
    title: "Location",
    description: "Find out where your visitors are coming from including the city, region and country.",
  },
  {
    icon: <Smartphone className="w-5 h-5" />,
    title: "Devices",
    description: "See the most popular devices used by visitors to help you optimize your pages.",
  },
  {
    icon: <Languages className="w-5 h-5" />,
    title: "Languages",
    description: "Know which languages are the most popular among your visitors to help you tailor your content.",
  },
  {
    icon: <Filter className="w-5 h-5" />,
    title: "Filtering",
    description: "Gain further insight into your data by applying filters like country, browser, and URL.",
  },
  {
    icon: <Activity className="w-5 h-5" />,
    title: "Realtime data",
    description:
      "Data available in seconds, not days. The data that Rybbit collects is immediately available on your dashboard",
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: "Organizations",
    description: "The organizations feature allows you to securely share websites access with different team members.",
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Custom events",
    description: "Track everything that happens on your website like signups and cart checkouts using custom events.",
  },
  {
    icon: <Layers className="w-5 h-5" />,
    title: "Custom data",
    description: "Use custom data properties to help you further analyze your data.",
  },
  {
    icon: <Tag className="w-5 h-5" />,
    title: "UTM tracking",
    description:
      "Measure the effectiveness of your campaign by analyzing UTM query parameters that are automatically collected.",
  },
  {
    icon: <Share2 className="w-5 h-5" />,
    title: "Sharing",
    description: "Easily share your stats with others through a secure, uniquely generated URL.",
  },
  {
    icon: <Link2 className="w-5 h-5" />,
    title: "Links",
    description:
      "Monitor and record clicks on URLs to show where visitors come from and how they interact with your links.",
  },
  {
    icon: <Grid3x3 className="w-5 h-5" />,
    title: "Pixels",
    description: "Embed a tracking pixel anywhere to start collecting data.",
  },
];

const insightsFeatures = [
  {
    icon: <ArrowLeftRight className="w-5 h-5" />,
    title: "Compare",
    description: "See your metric performance compared against previous date ranges.",
  },
  {
    icon: <Sparkles className="w-5 h-5" />,
    title: "Breakdown",
    description: "Dive deeper into your data by using segments and filters.",
  },
  {
    icon: <TrendingDown className="w-5 h-5" />,
    title: "Funnels",
    description: "Understand the conversion and drop-off rate of users.",
  },
  {
    icon: <UserCheck className="w-5 h-5" />,
    title: "Retention",
    description: "Measure your website stickiness by tracking how often users return.",
  },
  {
    icon: <Tag className="w-5 h-5" />,
    title: "UTM",
    description: "Track your campaigns through UTM parameters.",
  },
  {
    icon: <Target className="w-5 h-5" />,
    title: "Goals",
    description: "Track your goals for pageviews and events.",
  },
  {
    icon: <Route className="w-5 h-5" />,
    title: "Journey",
    description: "Look into your revenue data and how users are spending.",
  },
];

const privacyFeatures = [
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: "GDPR & CCPA",
    description:
      "Rybbit never collects any personal information from your visitors so it is fully compliant with GDPR and CCPA.",
  },
  {
    icon: <UserX className="w-5 h-5" />,
    title: "Data anonymization",
    description: "All visitor data is anonymized to protect your visitors' privacy.",
  },
  {
    icon: <Cookie className="w-5 h-5" />,
    title: "No cookies",
    description: "Rybbit does not use any cookies so no annoying cookie banner is required.",
  },
  {
    icon: <Database className="w-5 h-5" />,
    title: "Data ownership",
    description:
      "Data is always in your control with Rybbit. You can self-host on your own infrastructure or export your data from Rybbit Cloud.",
  },
];

const cloudFeatures = [
  {
    icon: <Settings className="w-5 h-5" />,
    title: "Fully managed",
    description: "Leave the upgrades, backups and performance tuning to us while you focus on your results.",
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "High performance",
    description:
      "Whether you have millions or billions of records, our platform is designed for speed and will deliver fast results.",
  },
  {
    icon: <Upload className="w-5 h-5" />,
    title: "Data import",
    description: "Want to migrate your existing data to Rybbit? Just use our built-in import tool.",
  },
  {
    icon: <Download className="w-5 h-5" />,
    title: "Data export",
    description: "Don't settle for summarized data. Get a full data export of all your data.",
  },
  {
    icon: <Mail className="w-5 h-5" />,
    title: "Email reports",
    description:
      "Send scheduled email reports to anyone. Send out website summaries in a compact and digestable email.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="flex flex-col items-center justify-center overflow-x-hidden">
      {/* Hero Section */}
      <section className="py-16 md:py-24 w-full">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block bg-emerald-900/30 text-emerald-400 px-3 py-1 rounded-full text-sm font-medium mb-6">
              Features
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Everything you need to understand your audience
            </h1>
            <p className="text-lg md:text-xl text-neutral-300 mb-8 font-light">
              Powerful analytics without the complexity. Track, analyze, and optimize your website with privacy-friendly
              tools that just work.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-base md:text-lg">
              <TrackedButton
                href="https://app.rybbit.io/signup"
                eventName="signup"
                eventProps={{ location: "features_hero", button_text: "Get started for free" }}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-6 py-3 rounded-lg shadow-lg shadow-emerald-900/20 transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 cursor-pointer"
              >
                Get started for free
              </TrackedButton>
              <TrackedButton
                href="https://demo.rybbit.com/21"
                eventName="demo"
                eventProps={{ location: "features_hero", button_text: "View live demo" }}
                className="w-full sm:w-auto bg-neutral-800 hover:bg-neutral-700 text-white font-medium px-6 py-3 rounded-lg border border-neutral-600 transform hover:-translate-y-0.5 transition-all duration-200 hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-opacity-50 cursor-pointer"
              >
                View live demo
              </TrackedButton>
            </div>
            <p className="text-neutral-400 text-sm flex items-center justify-center gap-2 mt-6">
              <CheckCircle className="w-4 h-4" />
              First {DEFAULT_EVENT_LIMIT.toLocaleString()} pageviews/m free • No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* Analytics Features Grid */}
      <section className="py-12 md:py-16 w-full">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Analytics</h2>
            <p className="text-lg text-neutral-400">
              Rybbit collects all the metrics you care about to help you make better decisions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {analyticsFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-neutral-800/20 border border-neutral-800/50 rounded-lg p-5 hover:border-neutral-700 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="text-neutral-400 mt-0.5">{feature.icon}</div>
                  <div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-neutral-400 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Insights Section */}
      <section className="py-12 md:py-16 w-full bg-neutral-900/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Insights</h2>
            <p className="text-lg text-neutral-400">
              Rybbit comes with out of the box insights that enables you to gain deep understanding of all your website
              data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {insightsFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-neutral-800/20 border border-neutral-800/50 rounded-lg p-5 hover:border-neutral-700 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="text-neutral-400 mt-0.5">{feature.icon}</div>
                  <div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-neutral-400 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section className="py-12 md:py-16 w-full">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Privacy</h2>
            <p className="text-lg text-neutral-400">
              Rybbit is private by default and helps you stay compliant with data privacy laws.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {privacyFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-neutral-800/20 border border-neutral-800/50 rounded-lg p-5 hover:border-neutral-700 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="text-neutral-400 mt-0.5">{feature.icon}</div>
                  <div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-neutral-400 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cloud Section */}
      <section className="py-12 md:py-16 w-full bg-neutral-900/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Cloud</h2>
            <p className="text-lg text-neutral-400">Rybbit Cloud is a reliable, high-performance hosted solution.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {cloudFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-neutral-800/20 border border-neutral-800/50 rounded-lg p-5 hover:border-neutral-700 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="text-neutral-400 mt-0.5">{feature.icon}</div>
                  <div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-neutral-400 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Feature Demos */}
      <section className="py-14 md:py-20 w-full">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-block bg-emerald-900/30 text-emerald-400 px-3 py-1 rounded-full text-sm font-medium mb-4">
              See It In Action
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Features that grow with you</h2>
            <p className="text-lg text-neutral-300 max-w-2xl mx-auto font-light">
              From basic analytics to advanced user insights, Rybbit has everything you need
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            <RealTimeAnalytics />
            <SessionReplay />
            <WebVitals />
            <UserProfiles />
            <UserSessions />
            <UserFlowAnalysis />
            <UserBehaviorTrends />
            <EventTracking />
            <GoalConversion />
          </div>
        </div>
      </section>

      {/* Why Choose Rybbit Section */}
      <section className="py-14 md:py-20 w-full bg-neutral-900/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Why choose Rybbit?</h2>
            <p className="text-lg text-neutral-300 max-w-2xl mx-auto font-light">
              Built for teams who value privacy, simplicity, and powerful insights
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-400">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Set up in minutes</h3>
                <p className="text-neutral-300 text-sm">
                  Add a simple script tag or install our npm package and start tracking immediately. No complex
                  configuration required.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-400">
                  <Shield className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Privacy-focused</h3>
                <p className="text-neutral-300 text-sm">
                  Cookieless tracking that&apos;s GDPR and CCPA compliant by default. No cookie banners needed, your
                  users&apos; privacy protected.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-400">
                  <Zap className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Lightning fast</h3>
                <p className="text-neutral-300 text-sm">
                  Our tracking script is less than 2KB and doesn&apos;t slow down your site. Dashboard loads instantly
                  with real-time updates.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-400">
                  <Eye className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Crystal clear insights</h3>
                <p className="text-neutral-300 text-sm">
                  No confusing metrics or overwhelming dashboards. See exactly what matters with clean, intuitive
                  visualizations.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-400">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Grow with confidence</h3>
                <p className="text-neutral-300 text-sm">
                  From startups to enterprises, our infrastructure scales with you. Start free and upgrade only when you
                  need to.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-400">
                  <Globe className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Open source</h3>
                <p className="text-neutral-300 text-sm">
                  100% open source under AGPL v3.0. Self-host on your infrastructure or use our cloud service. Your
                  choice, your data.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 w-full bg-gradient-to-b from-neutral-900 to-neutral-950">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to get started?</h2>
          <p className="text-lg md:text-xl text-neutral-300 mb-10 font-light">
            Join thousands of companies using Rybbit to understand their audience
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-base md:text-lg">
            <TrackedButton
              href="https://app.rybbit.io/signup"
              eventName="signup"
              eventProps={{ location: "features_bottom_cta", button_text: "Start tracking for free" }}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-8 py-4 rounded-lg shadow-lg shadow-emerald-900/20 transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 cursor-pointer"
            >
              Start tracking for free
            </TrackedButton>
            <Link href="/pricing" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto bg-neutral-800 hover:bg-neutral-700 text-white font-medium px-8 py-4 rounded-lg border border-neutral-600 transform hover:-translate-y-0.5 transition-all duration-200 hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-opacity-50 flex items-center justify-center gap-2">
                View pricing
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
          <p className="text-neutral-400 text-sm flex items-center justify-center gap-2 mt-8">
            <CheckCircle className="w-4 h-4" />
            No credit card required • Cancel anytime • {DEFAULT_EVENT_LIMIT.toLocaleString()} events/month free
          </p>
        </div>
      </section>
    </div>
  );
}
