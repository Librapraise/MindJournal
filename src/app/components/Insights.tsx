"use client";

import { ArrowRight } from "lucide-react";

type InsightItem = {
  icon: React.ReactNode;
  title: string;
  description: string;
  percentage: string;
  trend: "positive" | "neutral" | "negative";
};

export default function Insights() {
  const insights: InsightItem[] = [
    {
      icon: "✨",
      title: "Gratitude Focus",
      description: "You mention gratitude frequently",
      percentage: "+15%",
      trend: "positive"
    },
    {
      icon: "🌿",
      title: "Nature Connection",
      description: "Time in nature improves your mood",
      percentage: "+23%",
      trend: "positive"
    },
    {
      icon: "💤",
      title: "Sleep Quality",
      description: "Mood correlation with sleep",
      percentage: "+8%",
      trend: "positive"
    },
    {
      icon: "🏃‍♂️",
      title: "Exercise Impact",
      description: "Physical activity boosts mood",
      percentage: "+19%",
      trend: "positive"
    }
  ];

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-gray-800">Insights</h2>
        <a href="#" className="text-blue-500 text-sm hover:underline">
          More
        </a>
      </div>

      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-xl mr-3">{insight.icon}</span>
              <div>
                <h3 className="font-medium text-gray-800">{insight.title}</h3>
                <p className="text-sm text-gray-500">{insight.description}</p>
              </div>
            </div>
            <div className={`text-sm font-medium text-green-500`}>
              {insight.percentage}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}