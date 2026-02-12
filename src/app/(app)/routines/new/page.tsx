"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { saveRoutine, getExerciseById } from "@/lib/data-service";
import { RoutineDay, Exercise } from "@/lib/types";
import { ExercisePicker } from "@/components/workout/exercise-picker";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save } from "lucide-react";

export default function NewRoutinePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [days, setDays] = useState<RoutineDay[]>([
    { dayLabel: "Day 1", exercises: [] },
  ]);

  function addDay() {
    setDays((prev) => [
      ...prev,
      { dayLabel: `Day ${prev.length + 1}`, exercises: [] },
    ]);
  }

  function removeDay(dayIdx: number) {
    setDays((prev) => prev.filter((_, i) => i !== dayIdx));
  }

  function updateDayLabel(dayIdx: number, label: string) {
    setDays((prev) =>
      prev.map((d, i) => (i === dayIdx ? { ...d, dayLabel: label } : d))
    );
  }

  function addExerciseToDay(dayIdx: number, exercise: Exercise) {
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIdx
          ? {
              ...d,
              exercises: [
                ...d.exercises,
                { exerciseId: exercise.id, targetSets: 3, targetReps: 10 },
              ],
            }
          : d
      )
    );
  }

  function removeExerciseFromDay(dayIdx: number, exIdx: number) {
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIdx
          ? { ...d, exercises: d.exercises.filter((_, j) => j !== exIdx) }
          : d
      )
    );
  }

  function updateExercise(
    dayIdx: number,
    exIdx: number,
    field: "targetSets" | "targetReps",
    value: number
  ) {
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIdx
          ? {
              ...d,
              exercises: d.exercises.map((ex, j) =>
                j === exIdx ? { ...ex, [field]: value } : ex
              ),
            }
          : d
      )
    );
  }

  function handleSave() {
    if (!name.trim()) {
      toast({ variant: "destructive", title: "Please enter a routine name" });
      return;
    }
    if (!user) return;

    saveRoutine({
      ownerId: user.id,
      ownerName: user.name,
      name: name.trim(),
      description: description.trim(),
      isPublic,
      days,
    });

    toast({ title: "Routine saved!" });
    router.push("/routines");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Routine</h1>
        <p className="text-muted-foreground">Build your workout plan</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Routine Name</Label>
            <Input
              id="name"
              placeholder="e.g. Push Pull Legs"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              placeholder="Brief description of your routine"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="public">Share with community</Label>
              <p className="text-xs text-muted-foreground">Others can view and copy this routine</p>
            </div>
            <Switch id="public" checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
        </CardContent>
      </Card>

      {/* Days */}
      {days.map((day, dayIdx) => (
        <Card key={dayIdx}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Input
                value={day.dayLabel}
                onChange={(e) => updateDayLabel(dayIdx, e.target.value)}
                className="text-lg font-semibold border-none px-0 h-auto focus-visible:ring-0"
              />
              {days.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => removeDay(dayIdx)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {day.exercises.map((ex, exIdx) => {
              const exerciseData = getExerciseById(ex.exerciseId);
              return (
                <div
                  key={exIdx}
                  className="flex items-center gap-3 p-3 rounded-lg border"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {exerciseData?.name || "Unknown Exercise"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {exerciseData?.muscleGroup}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-center">
                      <Input
                        type="number"
                        min={1}
                        value={ex.targetSets}
                        onChange={(e) =>
                          updateExercise(dayIdx, exIdx, "targetSets", parseInt(e.target.value) || 1)
                        }
                        className="w-14 h-8 text-center text-sm"
                      />
                      <span className="text-[10px] text-muted-foreground">sets</span>
                    </div>
                    <span className="text-muted-foreground">x</span>
                    <div className="text-center">
                      <Input
                        type="number"
                        min={1}
                        value={ex.targetReps}
                        onChange={(e) =>
                          updateExercise(dayIdx, exIdx, "targetReps", parseInt(e.target.value) || 1)
                        }
                        className="w-14 h-8 text-center text-sm"
                      />
                      <span className="text-[10px] text-muted-foreground">reps</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeExerciseFromDay(dayIdx, exIdx)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
            <ExercisePicker
              onSelect={(exercise) => addExerciseToDay(dayIdx, exercise)}
              selectedIds={day.exercises.map((e) => e.exerciseId)}
            />
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" className="w-full" onClick={addDay}>
        <Plus className="h-4 w-4 mr-2" />
        Add Day
      </Button>

      <Button className="w-full" size="lg" onClick={handleSave}>
        <Save className="h-4 w-4 mr-2" />
        Save Routine
      </Button>
    </div>
  );
}
