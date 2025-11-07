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
  ArrowRight
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
  description: "Powerful, privacy-friendly analytics features to help you understand your audience and grow your business. Real-time data, session replay, web vitals, and more.",
};

const featureCategories = [
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Analytics & Insights",
    description: "Get actionable insights with comprehensive analytics that are easy to understand",
    features: [
      "Real-time visitor tracking",
      "Pageview and event analytics",
      "Traffic source analysis",
      "Conversion tracking"
    ]
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "User Intelligence",
    description: "Understand your users better with detailed profiles and behavioral analysis",
    features: [
      "User profiles & segmentation",
      "Session recordings",
      "User journey mapping",
      "Behavior trend analysis"
    ]
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Performance",
    description: "Monitor your site's performance and ensure a great user experience",
    features: [
      "Core Web Vitals tracking",
      "Performance metrics",
      "Page load analysis",
      "Speed insights"
    ]
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Privacy First",
    description: "Cookieless tracking that respects user privacy and complies with regulations",
    features: [
      "GDPR & CCPA compliant",
      "No cookie banners needed",
      "Anonymous user tracking",
      "Data ownership"
    ]
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: "Global Reach",
    description: "Track visitors from around the world with geographic insights",
    features: [
      "Country & region data",
      "City-level tracking",
      "Language detection",
      "Timezone support"
    ]
  },
  {
    icon: <Filter className="w-6 h-6" />,
    title: "Powerful Filtering",
    description: "Drill down into your data with advanced filtering and segmentation",
    features: [
      "Advanced filters",
      "Custom segments",
      "Date range selection",
      "Multi-dimension analysis"
    ]
  }
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
              Powerful analytics without the complexity. Track, analyze, and optimize your website with privacy-friendly tools that just work.
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

      {/* Feature Categories Grid */}
      <section className="py-12 md:py-16 w-full bg-neutral-900/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureCategories.map((category, index) => (
              <div
                key={index}
                className="bg-neutral-800/20 border border-neutral-800/50 rounded-xl p-6 hover:border-neutral-700 transition-all hover:-translate-y-1"
              >
                <div className="text-emerald-400 mb-4">{category.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{category.title}</h3>
                <p className="text-neutral-300 mb-4 text-sm">{category.description}</p>
                <ul className="space-y-2">
                  {category.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2 text-sm text-neutral-400">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
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
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Features that grow with you
            </h2>
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
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Why choose Rybbit?
            </h2>
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
                  Add a simple script tag or install our npm package and start tracking immediately. No complex configuration required.
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
                  Cookieless tracking that&apos;s GDPR and CCPA compliant by default. No cookie banners needed, your users&apos; privacy protected.
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
                  Our tracking script is less than 2KB and doesn&apos;t slow down your site. Dashboard loads instantly with real-time updates.
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
                  No confusing metrics or overwhelming dashboards. See exactly what matters with clean, intuitive visualizations.
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
                  From startups to enterprises, our infrastructure scales with you. Start free and upgrade only when you need to.
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
                  100% open source under AGPL v3.0. Self-host on your infrastructure or use our cloud service. Your choice, your data.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 w-full bg-gradient-to-b from-neutral-900 to-neutral-950">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to get started?
          </h2>
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
