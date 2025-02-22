import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, CheckCircle2, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { AttemptWithExam } from "@shared/schema";

interface StrengthsWeaknessProps {
  attempts: AttemptWithExam[];
}

export function StrengthsWeaknessAnalysis({ attempts }: StrengthsWeaknessProps) {
  const { data: analysis, isLoading } = useQuery({
    queryKey: ["/api/analysis/student-skills", attempts.map(a => a.id)],
    enabled: attempts.length > 0,
  });

  if (!attempts.length) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Skills Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-pulse space-y-4 w-full">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </div>
          </div>
        ) : analysis ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Strengths
              </h3>
              <ScrollArea className="h-[120px] pr-4">
                <ul className="space-y-2">
                  {analysis.strengths.map((strength: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500 mt-2" />
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>

            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Areas for Improvement
              </h3>
              <ScrollArea className="h-[120px] pr-4">
                <ul className="space-y-2">
                  {analysis.areasForImprovement.map((area: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <div className="h-2 w-2 rounded-full bg-amber-500 mt-2" />
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>

            {analysis.recommendations && (
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Key Recommendations
                </h3>
                <ul className="space-y-2">
                  {analysis.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
