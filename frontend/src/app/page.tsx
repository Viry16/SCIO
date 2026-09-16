"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  MessageSquare,
  Brain,
  Shield,
  Zap,
  BookOpen,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Server,
  Cpu,
  Users,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Dynamically import PixelBlast to avoid SSR issues with Three.js
const PixelBlast = dynamic(() => import("@/components/ui/PixelBlast"), {
  ssr: false,
});

// PixelBlast shader background wrapper
const AnimatedBackground = () => (
  <div className="fixed inset-0 -z-10 bg-dark-950">
    <PixelBlast
      variant="circle"
      pixelSize={4}
      color="#06b6d4"
      patternScale={2.5}
      patternDensity={0.9}
      enableRipples={true}
      rippleIntensityScale={1.2}
      rippleThickness={0.15}
      rippleSpeed={0.4}
      speed={0.4}
      edgeFade={0.3}
      transparent={false}
    />
    {/* Overlay gradient for better text readability */}
    <div className="absolute inset-0 bg-gradient-to-b from-dark-950/30 via-transparent to-dark-950/50 pointer-events-none" />
  </div>
);

// Feature card component
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}

const FeatureCard = ({
  icon,
  title,
  description,
  gradient,
}: FeatureCardProps) => (
  <div className="group relative p-6 rounded-2xl bg-dark-900/40 backdrop-blur-xl border border-white/10 hover:border-accent-500/50 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-lg hover:shadow-accent-500/10">
    <div
      className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-lg",
        gradient,
      )}
    >
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
    <p className="text-dark-300 text-sm leading-relaxed">{description}</p>
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
  </div>
);

// Stat card component
interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
}

const StatCard = ({ icon, value, label }: StatCardProps) => (
  <div className="text-center p-6 rounded-xl bg-dark-900/20 backdrop-blur-sm border border-white/5 hover:border-accent-500/30 transition-all">
    <div className="flex justify-center mb-3 text-accent-400">{icon}</div>
    <div className="text-3xl font-bold text-white mb-1 bg-gradient-to-r from-white to-accent-200 bg-clip-text text-transparent">
      {value}
    </div>
    <div className="text-sm text-dark-300">{label}</div>
  </div>
);

// Demo conversations for interactive hero preview
const DEMO_CONVERSATIONS = [
  {
    question: "How do I reset my Windows password?",
    intro: "I can help you with that! Here are the steps:",
    steps: [
      "Click Start → Settings → Accounts",
      'Select "Sign-in options"',
      'Click "Password" then "Change"',
    ],
  },
  {
    question: "My WiFi keeps disconnecting on Windows 11",
    intro: "Here are quick troubleshooting steps to restore your connection:",
    steps: [
      "Open Settings → Network & internet → Troubleshoot",
      "Restart your router and wait 30 seconds",
      "Update your network adapter driver in Device Manager",
    ],
  },
];

// Interactive demo chat for hero preview
const HeroDemoChat = () => {
  const [convIndex, setConvIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [status, setStatus] = useState<"typing" | "thinking" | "answered">("typing");

  const currentConv = DEMO_CONVERSATIONS[convIndex];

  useEffect(() => {
    let isCancelled = false;
    let charIndex = 0;
    setTypedText("");
    setStatus("typing");

    const timers: NodeJS.Timeout[] = [];

    const typingInterval = setInterval(() => {
      if (isCancelled) return;
      charIndex++;
      setTypedText(currentConv.question.slice(0, charIndex));

      if (charIndex >= currentConv.question.length) {
        clearInterval(typingInterval);

        const thinkingTimer = setTimeout(() => {
          if (isCancelled) return;
          setStatus("thinking");

          const answeredTimer = setTimeout(() => {
            if (isCancelled) return;
            setStatus("answered");

            const nextTimer = setTimeout(() => {
              if (isCancelled) return;
              setConvIndex((prev) => (prev + 1) % DEMO_CONVERSATIONS.length);
            }, 5000);
            timers.push(nextTimer);
          }, 1100);
          timers.push(answeredTimer);
        }, 500);
        timers.push(thinkingTimer);
      }
    }, 55);

    timers.push(typingInterval);

    return () => {
      isCancelled = true;
      timers.forEach(clearTimeout);
      clearInterval(typingInterval);
    };
  }, [convIndex, currentConv.question]);

  return (
    <div className="space-y-4 min-h-[170px]">
      {/* User message */}
      <div className="flex justify-end">
        <div className="bg-accent-500/20 border border-accent-500/30 text-accent-100 px-4 py-2.5 rounded-2xl rounded-br-md max-w-sm text-sm shadow-sm">
          <span>{typedText}</span>
          {status === "typing" && (
            <span className="inline-block w-1.5 h-4 ml-1 bg-accent-400 align-middle animate-pulse" />
          )}
        </div>
      </div>

      {/* Assistant Thinking / Typing indicator */}
      {status === "thinking" && (
        <div className="flex justify-start animate-fade-in">
          <div className="bg-dark-800 text-dark-200 px-4 py-3 rounded-2xl rounded-bl-md border border-white/5">
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}

      {/* Assistant Answer - shown only after user finishes typing */}
      {status === "answered" && (
        <div className="flex justify-start animate-fade-in">
          <div className="bg-dark-800 text-dark-200 px-4 py-3 rounded-2xl rounded-bl-md max-w-md text-sm border border-white/5 shadow-lg">
            <p className="mb-2 text-dark-100 font-medium">
              {currentConv.intro}
            </p>
            <ol className="list-decimal list-inside space-y-1 text-dark-300">
              {currentConv.steps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default function HomePage() {
  return (
    <div className="min-h-screen text-white relative overflow-x-hidden overflow-y-auto">
      <AnimatedBackground />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <img
            src="/scio-logo.png"
            alt="Scio Logo"
            className="w-10 h-10 object-contain"
          />
          <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-teal-400 to-purple-500 bg-clip-text text-transparent">
            Scio
          </span>
        </div>
        <Link
          href="/chat"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-500/20 hover:bg-accent-500/30 text-accent-300 transition-all"
        >
          <span>Launch App</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-500/10 border border-accent-500/20 text-accent-300 text-sm mb-8">
            <Sparkles className="w-4 h-4" />
            <span>Powered by RAG Technology</span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-white via-white to-dark-400 bg-clip-text text-transparent">
              Your AI-Powered
            </span>
            <br />
            <span className="bg-gradient-to-r from-accent-400 via-accent-300 to-purple-400 bg-clip-text text-transparent">
              IT Helpdesk
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-dark-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Get instant, accurate answers to your IT questions. Scio uses
            advanced RAG technology to provide expert-level support 24/7.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/chat"
              className="group flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-accent-500 to-accent-600 text-white font-semibold hover:from-accent-600 hover:to-accent-700 transition-all shadow-lg shadow-accent-500/25 hover:shadow-accent-500/40"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Start Chatting</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#features"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-dark-200 font-semibold hover:bg-white/10 hover:border-white/20 transition-all"
            >
              <BookOpen className="w-5 h-5" />
              <span>Learn More</span>
            </Link>
          </div>

          {/* Demo Preview */}
          <div className="relative max-w-3xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-accent-500/30 to-purple-500/30 rounded-3xl blur-2xl" />
            <div className="relative bg-dark-900/60 backdrop-blur-2xl rounded-2xl border border-white/10 p-6 shadow-2xl">
              {/* Mock chat header */}
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-dark-700">
                <div className="w-8 h-8 rounded-lg bg-accent-500/20 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-accent-400" />
                </div>
                <span className="font-medium text-dark-200">
                  Scio Assistant
                </span>
                <span className="ml-auto flex items-center gap-1.5 text-xs text-green-400">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Online
                </span>
              </div>

              {/* Mock chat messages */}
              <HeroDemoChat />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-dark-900/20 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl">
          <StatCard
            icon={<Clock className="w-6 h-6" />}
            value="24/7"
            label="Available"
          />
          <StatCard
            icon={<Zap className="w-6 h-6" />}
            value="<10s"
            label="Response Time"
          />
          <StatCard
            icon={<BookOpen className="w-6 h-6" />}
            value="1000+"
            label="Knowledge Articles"
          />
          <StatCard
            icon={<Users className="w-6 h-6" />}
            value="100%"
            label="Local & Private"
          />
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="relative z-10 max-w-7xl mx-auto px-6 py-20"
      >
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-dark-400 bg-clip-text text-transparent">
              Why Choose Scio?
            </span>
          </h2>
          <p className="text-dark-400 max-w-2xl mx-auto">
            Built with cutting-edge technology to provide the best IT support
            experience
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Brain className="w-6 h-6 text-purple-300" />}
            title="RAG-Powered Intelligence"
            description="Retrieval-Augmented Generation ensures accurate, contextual answers from your knowledge base."
            gradient="bg-gradient-to-br from-purple-500/30 to-purple-600/30"
          />
          <FeatureCard
            icon={<Zap className="w-6 h-6 text-yellow-300" />}
            title="Lightning Fast"
            description="Get instant responses to your IT queries with real-time streaming technology."
            gradient="bg-gradient-to-br from-yellow-500/30 to-orange-500/30"
          />
          <FeatureCard
            icon={<Shield className="w-6 h-6 text-green-300" />}
            title="Secure & Private"
            description="Runs locally with Ollama. Your data never leaves your machine."
            gradient="bg-gradient-to-br from-green-500/30 to-emerald-500/30"
          />
          <FeatureCard
            icon={<Cpu className="w-6 h-6 text-accent-300" />}
            title="Custom Models"
            description="Create and fine-tune custom models optimized for your specific IT environment."
            gradient="bg-gradient-to-br from-accent-500/30 to-cyan-500/30"
          />
          <FeatureCard
            icon={<BookOpen className="w-6 h-6 text-pink-300" />}
            title="Learning System"
            description="The chatbot learns from your feedback to provide better answers over time."
            gradient="bg-gradient-to-br from-pink-500/30 to-rose-500/30"
          />
          <FeatureCard
            icon={<Server className="w-6 h-6 text-blue-300" />}
            title="IT Expertise"
            description="Trained on comprehensive IT documentation covering hardware, software, and networking."
            gradient="bg-gradient-to-br from-blue-500/30 to-indigo-500/30"
          />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-dark-400 bg-clip-text text-transparent">
              How It Works
            </span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "Ask Your Question",
              desc: "Type your IT-related question or describe your problem",
            },
            {
              step: "02",
              title: "AI Retrieves Context",
              desc: "Scio searches the knowledge base for relevant information",
            },
            {
              step: "03",
              title: "Get Expert Answer",
              desc: "Receive accurate, step-by-step solutions instantly",
            },
          ].map((item, i) => (
            <div key={i} className="relative text-center">
              <div className="text-6xl font-bold text-dark-800 mb-4">
                {item.step}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {item.title}
              </h3>
              <p className="text-dark-400">{item.desc}</p>
              {i < 2 && (
                <div className="hidden md:block absolute top-8 right-0 transform translate-x-1/2">
                  <ArrowRight className="w-6 h-6 text-dark-700" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-20">
        <div className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-accent-600 to-purple-600" />
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
          <div className="relative p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              Experience the future of IT support. Get instant answers to your
              technical questions.
            </p>
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-dark-900 font-semibold hover:bg-dark-100 transition-all shadow-lg"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Launch Scio Chat</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-dark-800 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-dark-500">
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm">Scio IT Helpdesk © 2024</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-dark-500">
            <span>Powered by Ollama + RAG</span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              100% Local
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
