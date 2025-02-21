import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import type { Attempt, Exam, EvaluationFeedback } from "@shared/schema";

type AttemptWithExam = Attempt & { exam: Exam };

export function PerformanceTrends({ attempts }: { attempts: AttemptWithExam[] }) {
  // Prepare data for score progression over time
  const scoreProgressData = useMemo(() => {
    return attempts
      .filter(attempt => attempt.score !== null)
      .map(attempt => ({
        date: new Date(attempt.startTime).toLocaleDateString(),
        score: attempt.score,
        subject: attempt.exam.subject
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [attempts]);

  // Prepare data for subject-wise performance
  const subjectPerformanceData = useMemo(() => {
    const subjectScores = attempts.reduce((acc, attempt) => {
      if (attempt.score === null) return acc;
      
      if (!acc[attempt.exam.subject]) {
        acc[attempt.exam.subject] = {
          scores: [],
          total: 0,
          count: 0
        };
      }
      
      acc[attempt.exam.subject].scores.push(attempt.score);
      acc[attempt.exam.subject].total += attempt.score;
      acc[attempt.exam.subject].count++;
      
      return acc;
    }, {} as Record<string, { scores: number[], total: number, count: number }>);

    return Object.entries(subjectScores).map(([subject, data]) => ({
      subject,
      averageScore: Math.round(data.total / data.count),
      attempts: data.count
    }));
  }, [attempts]);

  // Prepare data for concept mastery
  const conceptMasteryData = useMemo(() => {
    const conceptScores: Record<string, { total: number, count: number }> = {};
    
    attempts.forEach(attempt => {
      if (!attempt.feedback) return;
      
      const feedback = attempt.feedback as EvaluationFeedback;
      feedback.perQuestion.forEach(question => {
        question.keyConceptsCovered.forEach(concept => {
          if (!conceptScores[concept]) {
            conceptScores[concept] = { total: 0, count: 0 };
          }
          conceptScores[concept].total += question.conceptualUnderstanding.level === "Excellent" ? 100 :
            question.conceptualUnderstanding.level === "Good" ? 75 :
            question.conceptualUnderstanding.level === "Fair" ? 50 : 25;
          conceptScores[concept].count++;
        });
      });
    });

    return Object.entries(conceptScores)
      .map(([concept, data]) => ({
        concept,
        mastery: Math.round(data.total / data.count)
      }))
      .sort((a, b) => b.mastery - a.mastery)
      .slice(0, 6); // Show top 6 concepts
  }, [attempts]);

  const chartConfig = {
    score: {
      label: "Score",
      theme: {
        light: "hsl(var(--primary))",
        dark: "hsl(var(--primary))"
      }
    }
  };

  if (attempts.length === 0) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Score Progression */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Score Progression</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <LineChart data={scoreProgressData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="font-medium">Date:</div>
                      <div>{payload[0].payload.date}</div>
                      <div className="font-medium">Score:</div>
                      <div>{payload[0].value}%</div>
                      <div className="font-medium">Subject:</div>
                      <div>{payload[0].payload.subject}</div>
                    </div>
                  </div>
                );
              }} />
              <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Subject Performance */}
      <Card className="col-span-full md:col-span-1">
        <CardHeader>
          <CardTitle>Subject Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <BarChart data={subjectPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="subject" />
              <YAxis domain={[0, 100]} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="font-medium">Subject:</div>
                      <div>{payload[0].payload.subject}</div>
                      <div className="font-medium">Average Score:</div>
                      <div>{payload[0].value}%</div>
                      <div className="font-medium">Total Attempts:</div>
                      <div>{payload[0].payload.attempts}</div>
                    </div>
                  </div>
                );
              }} />
              <Bar dataKey="averageScore" fill="hsl(var(--primary))" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Concept Mastery */}
      <Card className="col-span-full md:col-span-2">
        <CardHeader>
          <CardTitle>Concept Mastery</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <RadarChart data={conceptMasteryData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="concept" />
              <PolarRadiusAxis domain={[0, 100]} />
              <Radar
                name="Mastery Level"
                dataKey="mastery"
                fill="hsl(var(--primary))"
                fillOpacity={0.2}
                stroke="hsl(var(--primary))"
              />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="font-medium">Concept:</div>
                      <div>{payload[0].payload.concept}</div>
                      <div className="font-medium">Mastery:</div>
                      <div>{payload[0].value}%</div>
                    </div>
                  </div>
                );
              }} />
            </RadarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
