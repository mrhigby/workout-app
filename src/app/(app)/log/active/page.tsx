"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  getRoutineById,
  getExerciseById,
  saveWorkoutLog,
} from "@/lib/data-service";
import { WorkoutLogExercise, WorkoutSet, Exercise } from "@/lib/types";
import { ExercisePicker } from "@/components/workout/exercise-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Check,
  Plus,
  Trash2,
  Timer,
  Square,
  Save,
} from "lucide-react";

function ActiveWorkoutContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const routineId = searchParams.get("routineId");
  const dayParam = searchParams.get("day");

  const [exercises, setExercises] = useState<WorkoutLogExercise[]>([]);
  const [notes, setNotes] = useState("");
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [restTime, setRestTime] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const restInterval = useRef<NodeJS.Timeout | null>(null);
  const [routineName, setRoutineName] = useState<string | undefined>();

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  // Initialize from routine if provided
  useEffect(() => {
    if (routineId && dayParam !== null) {
      getRoutineById(routineId).then((routine) => {
        if (routine) {
          setRoutineName(routine.name);
          const dayIdx = parseInt(dayParam);
          const day = routine.days[dayIdx];
          if (day) {
            const logExercises: WorkoutLogExercise[] = day.exercises.map((ex) => ({
              exerciseId: ex.exerciseId,
              sets: Array.from({ length: ex.targetSets }, () => ({
                reps: ex.targetReps,
                weight: 0,
                completed: false,
              })),
            }));
            setExercises(logExercises);
          }
        }
      });
    }
  }, [routineId, dayParam]);

  // Rest timer
  useEffect(() => {
    if (isResting && restTime > 0) {
      restInterval.current = setInterval(() => {
        setRestTime((prev) => {
          if (prev <= 1) {
            setIsResting(false);
            toast({ title: "Rest over!", description: "Time for the next set." });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (restInterval.current) clearInterval(restInterval.current);
    };
  }, [isResting, restTime, toast]);

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function addExercise(exercise: Exercise) {
    setExercises((prev) => [
      ...prev,
      {
        exerciseId: exercise.id,
        sets: [{ reps: 10, weight: 0, completed: false }],
      },
    ]);
  }

  function removeExercise(idx: number) {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  }

  function addSet(exIdx: number) {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx
          ? {
              ...ex,
              sets: [
                ...ex.sets,
                {
                  reps: ex.sets[ex.sets.length - 1]?.reps || 10,
                  weight: ex.sets[ex.sets.length - 1]?.weight || 0,
                  completed: false,
                },
              ],
            }
          : ex
      )
    );
  }

  function updateSet(
    exIdx: number,
    setIdx: number,
    field: keyof WorkoutSet,
    value: number | boolean
  ) {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx
          ? {
              ...ex,
              sets: ex.sets.map((s, j) =>
                j === setIdx ? { ...s, [field]: value } : s
              ),
            }
          : ex
      )
    );
  }

  function toggleSetComplete(exIdx: number, setIdx: number) {
    const newCompleted = !exercises[exIdx].sets[setIdx].completed;
    updateSet(exIdx, setIdx, "completed", newCompleted);
    if (newCompleted) {
      // Start rest timer
      setRestTime(90);
      setIsResting(true);
    }
  }

  function stopRest() {
    setIsResting(false);
    setRestTime(0);
  }

  async function handleFinish() {
    if (!user) return;
    if (exercises.length === 0) {
      toast({ variant: "destructive", title: "Add at least one exercise" });
      return;
    }

    const duration = Math.floor((Date.now() - startTime) / 1000);
    await saveWorkoutLog({
      userId: user.id,
      date: new Date().toISOString(),
      routineId: routineId || undefined,
      routineName,
      exercises,
      notes,
      duration,
    });

    toast({ title: "Workout saved!", description: `Great work! ${formatTime(duration)} total.` });
    router.push("/history");
  }

  const completedSets = exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
    0
  );
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);

  return (
    <div className="space-y-4">
      {/* Timer Bar */}
      <div className="sticky top-14 z-40 -mx-4 px-4 py-3 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {routineName || "Freestyle Workout"}
            </p>
            <div className="flex items-center gap-3">
              <span className="font-mono text-lg font-bold">{formatTime(elapsed)}</span>
              <Badge variant="secondary">
                {completedSets}/{totalSets} sets
              </Badge>
            </div>
          </div>
          <Button size="sm" onClick={handleFinish}>
            <Save className="h-4 w-4 mr-2" />
            Finish
          </Button>
        </div>
      </div>

      {/* Rest Timer */}
      {isResting && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Timer className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Rest Timer</p>
                  <p className="text-2xl font-mono font-bold text-primary">
                    {formatTime(restTime)}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={stopRest}>
                <Square className="h-4 w-4 mr-1" />
                Skip
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exercises */}
      {exercises.map((ex, exIdx) => {
        const exerciseData = getExerciseById(ex.exerciseId);
        return (
          <Card key={exIdx}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    {exerciseData?.name || "Unknown Exercise"}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {exerciseData?.muscleGroup}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => removeExercise(exIdx)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-[1fr_4rem_4rem_2.5rem] gap-2 text-xs text-muted-foreground px-1">
                <span>Set</span>
                {exerciseData?.trackingType === "reps_weight" && (
                  <>
                    <span className="text-center">lbs</span>
                    <span className="text-center">Reps</span>
                  </>
                )}
                {exerciseData?.trackingType === "duration" && (
                  <>
                    <span className="text-center">Min</span>
                    <span className="text-center">Sec</span>
                  </>
                )}
                {exerciseData?.trackingType === "distance" && (
                  <>
                    <span className="text-center">Miles</span>
                    <span className="text-center">Min</span>
                  </>
                )}
                <span></span>
              </div>

              {ex.sets.map((set, setIdx) => (
                <div
                  key={setIdx}
                  className={`grid grid-cols-[1fr_4rem_4rem_2.5rem] gap-2 items-center p-2 rounded ${
                    set.completed ? "bg-primary/10" : ""
                  }`}
                >
                  <span className="text-sm font-medium">{setIdx + 1}</span>
                  <Input
                    type="number"
                    min={0}
                    step={exerciseData?.trackingType === "distance" ? 0.1 : 1}
                    value={set.weight || ""}
                    onChange={(e) =>
                      updateSet(exIdx, setIdx, "weight", parseFloat(e.target.value) || 0)
                    }
                    className="h-8 text-center text-sm"
                  />
                  <Input
                    type="number"
                    min={0}
                    value={set.reps || ""}
                    onChange={(e) =>
                      updateSet(exIdx, setIdx, "reps", parseInt(e.target.value) || 0)
                    }
                    className="h-8 text-center text-sm"
                  />
                  <Button
                    variant={set.completed ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => toggleSetComplete(exIdx, setIdx)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={() => addSet(exIdx)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Set
              </Button>
            </CardContent>
          </Card>
        );
      })}

      {/* Add Exercise */}
      <ExercisePicker
        onSelect={addExercise}
        selectedIds={exercises.map((e) => e.exerciseId)}
        trigger={
          <Button variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Exercise
          </Button>
        }
      />

      {/* Notes */}
      <Card>
        <CardContent className="pt-4">
          <Input
            placeholder="Workout notes (optional)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Finish Button */}
      <Button className="w-full" size="lg" onClick={handleFinish}>
        <Save className="h-5 w-5 mr-2" />
        Finish Workout
      </Button>
    </div>
  );
}

export default function ActiveWorkoutPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12 text-muted-foreground">Loading workout...</div>}>
      <ActiveWorkoutContent />
    </Suspense>
  );
}
