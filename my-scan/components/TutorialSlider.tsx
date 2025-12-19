"use client";

import { useState } from "react";
import {
  GitBranch,
  Search,
  ShieldCheck,
  BarChart3,
  Rocket,
} from "lucide-react";

const steps = [
  {
    title: "Choose Scan Mode",
    description:
      "Select whether you want to scan source code only or scan with build pipeline.",
    icon: GitBranch,
  },
  {
    title: "Enter Repository URL",
    description: "Provide a GitHub repository URL that you want to analyze.",
    icon: Search,
  },
  {
    title: "Security Scanning",
    description:
      "The system scans for vulnerabilities, secrets, and misconfigurations.",
    icon: ShieldCheck,
  },
  {
    title: "Review Results",
    description: "Check the severity summary and detailed scan logs.",
    icon: BarChart3,
  },
  {
    title: "Build & Deploy",
    description:
      "Optionally build a secure container after passing security checks.",
    icon: Rocket,
  },
];

export default function TutorialSlider() {
  const [index, setIndex] = useState(0);
  const step = steps[index];
  const Icon = step.icon;

  return (
    <div className="w-full max-w-3xl mx-auto text-center space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Welcome to VisScan</h1>
        <p className="text-gray-500">
          Secure your code before deployment in simple steps
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl shadow-md p-8 space-y-6">
        <div className="flex justify-center">
          <div className="bg-blue-100 text-blue-600 p-4 rounded-full">
            <Icon size={40} />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold">{step.title}</h2>
          <p className="text-gray-600 mt-2">{step.description}</p>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setIndex((i) => Math.max(i - 1, 0))}
            disabled={index === 0}
            className="px-4 py-2 text-sm rounded border disabled:opacity-40"
          >
            Prev
          </button>

          <div className="flex gap-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full ${
                  i === index ? "bg-blue-600" : "bg-gray-300"
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => setIndex((i) => Math.min(i + 1, steps.length - 1))}
            disabled={index === steps.length - 1}
            className="px-4 py-2 text-sm rounded border disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {/*
      {index === steps.length - 1 && (
        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow">
          Get Started
        </button>
      )} */}
    </div>
  );
}
