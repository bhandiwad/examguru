import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, CheckCircle2, AlertCircle, BookOpen, TrendingUp, Target } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { AttemptWithExam } from "@shared/schema";
import { Progress } from "@/components/ui/progress";
import { SharePerformanceInsights } from "./SharePerformanceInsights";

interface StrengthsWeaknessProps {
  attempts: AttemptWithExam[];
}

interface CognitiveSkill {
  skill: string;
  evidence: string;
  impactLevel: "High" | "Medium" | "Low";
}

interface ImprovementArea {
  skill: string;
  currentLevel: string;
  suggestedApproach: string;
}

interface MasteredConcept {
  concept: string;
  proficiencyLevel: "Expert" | "Proficient" | "Developing";
  evidence: string;
}

interface ChallengingArea {
  concept: string;
  gap: string;
  recommendedResources: string[];
}

interface ProgressItem {
  area: string;
  fromLevel: string;
  toLevel: string;
  timeframe: string;
}

interface Resource {
  type: "Video" | "Article" | "Practice" | "Tool";
  title: string;
  description: string;
  link: string;
}

interface Recommendation {
  focus: string;
  actionItems: string[];
  resources: Resource[];
  expectedOutcome: string;
}

interface AnalysisResponse {
  cognitiveSkills: {
    strengths: CognitiveSkill[];
    areasForImprovement: ImprovementArea[];
  };
  subjectSkills: {
    masteredConcepts: MasteredConcept[];
    challengingAreas: ChallengingArea[];
  };
  learningStyle: {
    primaryStyle: string;
    effectiveStrategies: string[];
    adaptationNeeds: string[];
  };
  progressAnalysis: {
    improvements: ProgressItem[];
    consistentStrengths: string[];
    growthAreas: string[];
  };
  personalizedRecommendations: Recommendation[];
}

function getProgressColor(level: string): string {
  switch (level) {
    case "Expert":
      return "bg-green-500";
    case "Proficient":
      return "bg-blue-500";
    case "Developing":
      return "bg-amber-500";
    default:
      return "bg-gray-500";
  }
}

function getImpactColor(level: "High" | "Medium" | "Low"): string {
  switch (level) {
    case "High":
      return "text-green-500";
    case "Medium":
      return "text-blue-500";
    case "Low":
      return "text-amber-500";
  }
}

export function StrengthsWeaknessAnalysis({ attempts }: StrengthsWeaknessProps) {
  const { data: analysis, isLoading } = useQuery<AnalysisResponse>({
    queryKey: ["/api/analysis/student-skills", attempts.map(a => a.id)],
    enabled: attempts.length > 0,
  });

  if (!attempts.length) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Comprehensive Skills Analysis
            </CardTitle>
            <SharePerformanceInsights attempts={attempts} />
          </div>
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
            <div className="space-y-8">
              {/* Cognitive Skills Section */}
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <Brain className="h-5 w-5 text-primary" />
                  Cognitive Skills
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-md font-medium mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Strong Areas
                    </h4>
                    <ScrollArea className="h-[200px] pr-4">
                      <div className="space-y-4">
                        {analysis.cognitiveSkills.strengths.map((strength, i) => (
                          <div key={i} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{strength.skill}</span>
                              <span className={`text-sm ${getImpactColor(strength.impactLevel)}`}>
                                {strength.impactLevel} Impact
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{strength.evidence}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                  <div>
                    <h4 className="text-md font-medium mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4 text-amber-500" />
                      Areas for Growth
                    </h4>
                    <ScrollArea className="h-[200px] pr-4">
                      <div className="space-y-4">
                        {analysis.cognitiveSkills.areasForImprovement.map((area, i) => (
                          <div key={i} className="space-y-2">
                            <span className="font-medium">{area.skill}</span>
                            <p className="text-sm text-muted-foreground">{area.suggestedApproach}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </div>

              {/* Subject Mastery Section */}
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Subject Mastery
                </h3>
                <div className="space-y-4">
                  {analysis.subjectSkills.masteredConcepts.map((concept, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{concept.concept}</span>
                        <span className={`text-sm ${getProgressColor(concept.proficiencyLevel)}`}>
                          {concept.proficiencyLevel}
                        </span>
                      </div>
                      <Progress
                        value={
                          concept.proficiencyLevel === "Expert" ? 100 :
                            concept.proficiencyLevel === "Proficient" ? 75 : 50
                        }
                        className={getProgressColor(concept.proficiencyLevel)}
                      />
                      <p className="text-sm text-muted-foreground">{concept.evidence}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress Analysis */}
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Progress & Improvements
                </h3>
                <div className="space-y-4">
                  {analysis.progressAnalysis.improvements.map((improvement, i) => (
                    <div key={i} className="space-y-2">
                      <span className="font-medium">{improvement.area}</span>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">{improvement.fromLevel}</span>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-green-500">{improvement.toLevel}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Timeline: {improvement.timeframe}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Personalized Recommendations */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Tailored Learning Path
                </h3>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-6">
                    {analysis.personalizedRecommendations.map((rec, i) => (
                      <div key={i} className="space-y-3 p-4 rounded-lg border">
                        <h4 className="font-medium">{rec.focus}</h4>
                        <ul className="space-y-2">
                          {rec.actionItems.map((item, j) => (
                            <li key={j} className="flex items-start gap-2">
                              <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                              <span className="text-sm">{item}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="space-y-2">
                          <span className="text-sm font-medium">Recommended Resources:</span>
                          <ul className="space-y-2">
                            {rec.resources.map((resource, k) => (
                              <li key={k} className="text-sm">
                                <span className="font-medium">{resource.title}</span>
                                <p className="text-muted-foreground">{resource.description}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}