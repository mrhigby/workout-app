"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  getRoutineById,
  getExerciseById,
  getRoutinesByUser,
} from "@/lib/data-service";
import { Routine } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Play, Dumbbell, ClipboardList } from "lucide-react";
import Link from "next/link";

function LogPageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const routineId = searchParams.get("routineId");
  const [routines, setRoutines] = useState<Routine[]>([]);

  useEffect(() => {
    if (user) {
      setRoutines(getRoutinesByUser(user.id));
    }
  }, [user]);

  // If routineId is provided, show day selection for that routine
  const selectedRoutine = routineId ? getRoutineById(routineId) : null;

  if (selectedRoutine) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Start: {selectedRoutine.name}</h1>
          <p className="text-muted-foreground">Choose which day to work out</p>
        </div>
        {selectedRoutine.days.map((day, dayIdx) => (
          <Card key={dayIdx} className="cursor-pointer hover:border-primary transition-colors">
            <Link href={`/log/active?routineId=${selectedRoutine.id}&day=${dayIdx}`}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{day.dayLabel}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {day.exercises.length} exercise{day.exercises.length !== 1 ? "s" : ""}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {day.exercises.slice(0, 4).map((ex, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {getExerciseById(ex.exerciseId)?.name || "Unknown"}
                        </Badge>
                      ))}
                      {day.exercises.length > 4 && (
                        <Badge variant="secondary" className="text-xs">
                          +{day.exercises.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Play className="h-5 w-5 text-primary" />
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Log Workout</h1>
        <p className="text-muted-foreground">Start from a routine or go freestyle</p>
      </div>

      {/* Freestyle */}
      <Button asChild className="w-full" size="lg">
        <Link href="/log/active">
          <Dumbbell className="h-5 w-5 mr-2" />
          Freestyle Workout
        </Link>
      </Button>

      <Separator />

      {/* From Routine */}
      <div>
        <h2 className="text-lg font-semibold mb-3">From a Routine</h2>
        {routines.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No routines yet.</p>
            <Button asChild variant="link" className="mt-2">
              <Link href="/routines/new">Create one</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {routines.map((r) => (
              <Card key={r.id} className="cursor-pointer hover:border-primary transition-colors">
                <Link href={`/log?routineId=${r.id}`}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{r.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {r.days.length} day{r.days.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <Play className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LogPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12 text-muted-foreground">Loading...</div>}>
      <LogPageContent />
    </Suspense>
  );
}
