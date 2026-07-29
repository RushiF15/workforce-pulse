export type Intent =
  | "department_most_time"
  | "employee_most_repetitive"
  | "top_automation"
  | "most_used_app"
  | "finance_summary"
  | "sales_summary"
  | "recoverable_hours"
  | "recoverable_cost";

interface IntentPattern {
  intent: Intent;
  keywords: string[];
}

const PATTERNS: IntentPattern[] = [
  {
    intent: "finance_summary",
    keywords: ["finance"],
  },
  {
    intent: "sales_summary",
    keywords: ["sales", "sale"],
  },
  {
    intent: "department_most_time",
    keywords: ["department", "dept", "wastes the most", "highest waste", "highest leakage", "leakage"],
  },
  {
    intent: "employee_most_repetitive",
    keywords: [
      "employee",
      "person",
      "who",
      "repetitive work",
      "most repetitive",
      "team member",
      "repetitive task",
    ],
  },
  {
    intent: "top_automation",
    keywords: ["automate", "automation", "opportunity", "roi", "priority", "candidate"],
  },
  {
    intent: "most_used_app",
    keywords: ["app", "application", "tool", "software", "consume", "most time"],
  },
  {
    intent: "recoverable_hours",
    keywords: ["recoverable hours", "waste hours", "total waste", "hours saved", "potential hours"],
  },
  {
    intent: "recoverable_cost",
    keywords: ["savings", "cost savings", "monthly cost", "recoverable cost", "money", "rupees", "save"],
  },
];

export function matchIntent(query: string): Intent | null {
  const cleaned = query.toLowerCase().trim();

  let bestIntent: Intent | null = null;
  let highestScore = 0;

  for (const pattern of PATTERNS) {
    let score = 0;
    for (const keyword of pattern.keywords) {
      if (cleaned.includes(keyword)) {
        // Higher weight for exact phrase matches
        score += keyword.split(" ").length;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestIntent = pattern.intent;
    }
  }

  // Ensure a threshold score of 1 to prevent false positive matching on random queries
  return highestScore > 0 ? bestIntent : null;
}
