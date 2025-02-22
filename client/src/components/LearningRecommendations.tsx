import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Video, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Attempt, Exam } from "@shared/schema";

type AttemptWithExam = Attempt & { exam: Exam };

interface Resource {
  type: string;
  title: string;
  description: string;
  link?: string;
}

interface TopicRecommendation {
  topic: string;
  performance: number;
  resources: Resource[];
  practiceQuestions?: string[];
}

export function LearningRecommendations({ attempts }: { attempts: AttemptWithExam[] }) {
  const recommendations = useMemo(() => {
    if (!attempts?.length) return [];

    const topicPerformance: Record<string, { total: number; count: number; resources: Resource[] }> = {};

    // Analyze performance by topic across all attempts
    attempts.forEach(attempt => {
      const feedback = attempt.feedback as any;
      if (!feedback?.questions) return;

      feedback.questions.forEach((q: any) => {
        if (!q.topic) return;

        if (!topicPerformance[q.topic]) {
          topicPerformance[q.topic] = { total: 0, count: 0, resources: [] };
        }

        // Calculate performance
        const performance = q.isCorrect ? 100 : 0;
        topicPerformance[q.topic].total += performance;
        topicPerformance[q.topic].count++;

        // Collect unique resources
        if (q.studyResources) {
          q.studyResources.forEach((resource: Resource) => {
            const resourceExists = topicPerformance[q.topic].resources.some(
              r => r.title === resource.title
            );
            if (!resourceExists) {
              topicPerformance[q.topic].resources.push(resource);
            }
          });
        }
      });
    });

    // Convert to sorted recommendations
    const recommendations: TopicRecommendation[] = Object.entries(topicPerformance)
      .map(([topic, data]) => ({
        topic,
        performance: Math.round(data.total / data.count),
        resources: data.resources
      }))
      .sort((a, b) => a.performance - b.performance) // Sort by performance ascending (worst first)
      .slice(0, 5); // Top 5 topics needing improvement

    return recommendations;
  }, [attempts]);

  if (!recommendations.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Learning Recommendations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {recommendations.map((rec) => (
            <div key={rec.topic} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{rec.topic}</h3>
                <span className={`px-2 py-1 rounded text-sm ${
                  rec.performance < 50 ? 'bg-red-100 text-red-700' :
                  rec.performance < 70 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {rec.performance}% Mastery
                </span>
              </div>
              
              {rec.resources.length > 0 && (
                <div className="grid gap-3">
                  {rec.resources.map((resource, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-secondary/10 rounded-lg">
                      {resource.type === 'video' ? (
                        <Video className="h-5 w-5 mt-1 text-primary" />
                      ) : resource.type === 'article' ? (
                        <FileText className="h-5 w-5 mt-1 text-primary" />
                      ) : (
                        <BookOpen className="h-5 w-5 mt-1 text-primary" />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium">{resource.title}</h4>
                        <p className="text-sm text-muted-foreground">{resource.description}</p>
                        {resource.link && (
                          <Button variant="link" className="px-0 mt-1" asChild>
                            <a href={resource.link} target="_blank" rel="noopener noreferrer">
                              View Resource <ArrowRight className="ml-1 h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
