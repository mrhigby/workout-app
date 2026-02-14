"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getWorkoutLogsByUser, getRoutinesByUser } from "@/lib/data-service";
import { WorkoutLog, Routine } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, ClipboardList, TrendingUp, Calendar, Dumbbell, Plus } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [recentLogs, setRecentLogs] = useState<WorkoutLog[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);

  useEffect(() => {
    if (user) {
      (async () => {
        const [logs, rts] = await Promise.all([
          getWorkoutLogsByUser(user.id),
          getRoutinesByUser(user.id),
        ]);
        setRecentLogs(logs.slice(0, 5));
        setRoutines(rts);
      })();
    }
  }, [user]);

  const thisWeekLogs = recentLogs.filter((log) => {
    const logDate = new Date(log.date);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return logDate >= weekAgo;
  });

  const totalExercisesThisWeek = thisWeekLogs.reduce(
    (sum, log) => sum + log.exercises.length,
    0
  );

  const totalMinutesThisWeek = thisWeekLogs.reduce(
    (sum, log) => sum + Math.round(log.duration / 60),
    0
  );

  function formatDuration(seconds: number) {
    const m = Math.floor(seconds / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hey, {user?.name?.split(" ")[0]}!</h1>
        <p className="text-muted-foreground">Let&apos;s crush it today.</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button asChild size="lg" className="h-auto py-4 flex-col gap-2">
          <Link href="/log">
            <Play className="h-6 w-6" />
            <span>Start Workout</span>
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="h-auto py-4 flex-col gap-2">
          <Link href="/routines/new">
            <Plus className="h-6 w-6" />
            <span>New Routine</span>
          </Link>
        </Button>
      </div>

      {/* Weekly Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Calendar className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{thisWeekLogs.length}</p>
            <p className="text-xs text-muted-foreground">Workouts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Dumbbell className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{totalExercisesThisWeek}</p>
            <p className="text-xs text-muted-foreground">Exercises</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{totalMinutesThisWeek}</p>
            <p className="text-xs text-muted-foreground">Minutes</p>
          </CardContent>
        </Card>
      </div>

      {/* My Routines */}
      {routines.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">My Routines</CardTitle>
              <Link href="/routines" className="text-sm text-primary hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {routines.slice(0, 3).map((routine) => (
              <Link
                key={routine.id}
                href={`/routines/${routine.id}`}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="font-medium">{routine.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {routine.days.length} day{routine.days.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Workouts */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recent Workouts</CardTitle>
            <Link href="/history" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Dumbbell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No workouts yet. Start your first one!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">
                      {log.routineName || "Freestyle Workout"}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {log.exercises.length} exercise{log.exercises.length !== 1 ? "s" : ""}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {formatDuration(log.duration)}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(log.date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
