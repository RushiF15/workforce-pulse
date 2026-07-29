import { matchIntent } from "./intentMatcher";
import { generateAnswer } from "./answerGenerator";
import type { WorkforceDataset } from "@/data-pipeline";
import { computeDashboardData } from "@/components/dashboard/dashboard-view";

export interface AssistantResponse {
  content: string;
  intentMatched: string | null;
}

export function getAssistantResponse(
  query: string,
  filteredData: ReturnType<typeof computeDashboardData>,
  dataset: WorkforceDataset
): AssistantResponse {
  const intent = matchIntent(query);

  if (!intent) {
    return {
      content:
        "I'm currently able to answer questions about employees, departments, applications, repetitive work, automation opportunities, productivity, and workforce insights.",
      intentMatched: null,
    };
  }

  try {
    const answer = generateAnswer(intent, filteredData, dataset);
    return {
      content: answer,
      intentMatched: intent,
    };
  } catch (error) {
    console.error("Local Assistant generation error:", error);
    return {
      content: "I'm sorry, I encountered an error while calculating metrics for that request.",
      intentMatched: intent,
    };
  }
}
