"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getWorkoutLogsByUser, getRoutinesByUser } from "@/lib/data-service";
import { WorkoutLog, Routine } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { LogOut, Calendar, ClipboardList, Dumbbell } from "lucide-react";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);

  useEffect(() => {
    if (user) {
      (async () => {
        const [l, r] = await Promise.all([
          getWorkoutLogsByUser(user.id),
          getRoutinesByUser(user.id),
        ]);
        setLogs(l);
        setRoutines(r);
      })();
    }
  }, [user]);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const totalSets = logs.reduce(
    (sum, log) =>
      sum + log.exercises.reduce((s, ex) => s + ex.sets.length, 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="bg-primary text-primary-foreground text-xl">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{user?.name}</h1>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lifetime Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <Calendar className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{logs.length}</p>
              <p className="text-xs text-muted-foreground">Workouts</p>
            </div>
            <div>
              <ClipboardList className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{routines.length}</p>
              <p className="text-xs text-muted-foreground">Routines</p>
            </div>
            <div>
              <Dumbbell className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{totalSets}</p>
              <p className="text-xs text-muted-foreground">Total Sets</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardContent className="pt-6">
          <h3 className="font-medium mb-2">About</h3>
          <p className="text-sm text-muted-foreground mb-4">
            WorkoutTracker helps you build routines, log workouts, and track your
            fitness progress over time.
          </p>
          <p className="text-xs text-muted-foreground">
            Data syncs across devices via AWS Amplify.
          </p>
        </CardContent>
      </Card>

      <Button variant="destructive" className="w-full" onClick={signOut}>
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    </div>
  );
}
