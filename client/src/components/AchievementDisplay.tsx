import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import type { Achievement, UserAchievement } from "@shared/schema";
import { Trophy, Award, Star } from "lucide-react";

type AchievementWithProgress = Achievement & {
  earned: boolean;
  progress: number;
};

export function AchievementDisplay() {
  const { data: achievements, isLoading } = useQuery<AchievementWithProgress[]>({
    queryKey: ["/api/achievements"],
  });

  if (isLoading || !achievements) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="relative overflow-hidden">
            <CardHeader className="animate-pulse bg-muted h-24" />
            <CardContent className="animate-pulse bg-muted h-16 mt-2" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Achievement Progress
          </CardTitle>
          <CardDescription>
            Track your learning journey through achievements and badges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-2">
              <Award className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">
                  {achievements.filter(a => a.earned).length}
                </p>
                <p className="text-sm text-muted-foreground">
                  Achievements Earned
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">
                  {achievements.reduce((sum, a) => sum + (a.earned ? a.points : 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Total Points
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {achievements.map((achievement) => (
          <Card 
            key={achievement.id}
            className={`relative overflow-hidden ${
              achievement.earned ? 'border-primary' : 'opacity-75'
            }`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8"
                      dangerouslySetInnerHTML={{ __html: achievement.badgeIcon }}
                    />
                    {achievement.name}
                  </CardTitle>
                  <CardDescription>{achievement.description}</CardDescription>
                </div>
                {achievement.earned && (
                  <Badge variant="default" className="bg-primary">
                    Earned!
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{Math.round(achievement.progress * 100)}%</span>
                </div>
                <Progress value={achievement.progress * 100} />
                <p className="text-sm text-muted-foreground text-right">
                  {achievement.points} points
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
