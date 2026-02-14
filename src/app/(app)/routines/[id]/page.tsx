"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getRoutineById, getExerciseById, deleteRoutine, updateRoutine } from "@/lib/data-service";
import { Routine } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Play, Trash2, Users, Lock, ArrowLeft } from "lucide-react";

export default function RoutineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [routine, setRoutine] = useState<Routine | null>(null);

  useEffect(() => {
    getRoutineById(params.id as string).then((r) => {
      if (r) setRoutine(r);
    });
  }, [params.id]);

  if (!routine) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Routine not found.</p>
        <Button asChild variant="link" className="mt-2">
          <Link href="/routines">Back to routines</Link>
        </Button>
      </div>
    );
  }

  const isOwner = user?.id === routine.ownerId;

  async function handleDelete() {
    await deleteRoutine(routine!.id);
    toast({ title: "Routine deleted" });
    router.push("/routines");
  }

  async function togglePublic() {
    const updated = await updateRoutine(routine!.id, { isPublic: !routine!.isPublic });
    if (updated) setRoutine(updated);
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{routine.name}</h1>
            {routine.description && (
              <p className="text-muted-foreground mt-1">{routine.description}</p>
            )}
          </div>
          <Badge variant={routine.isPublic ? "default" : "secondary"}>
            {routine.isPublic ? (
              <>
                <Users className="h-3 w-3 mr-1" />
                Public
              </>
            ) : (
              <>
                <Lock className="h-3 w-3 mr-1" />
                Private
              </>
            )}
          </Badge>
        </div>
        {!isOwner && (
          <p className="text-sm text-muted-foreground mt-2">by {routine.ownerName}</p>
        )}
      </div>

      <Button asChild className="w-full" size="lg">
        <Link href={`/log?routineId=${routine.id}`}>
          <Play className="h-5 w-5 mr-2" />
          Start Workout with this Routine
        </Link>
      </Button>

      {/* Days */}
      {routine.days.map((day, dayIdx) => (
        <Card key={dayIdx}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{day.dayLabel}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {day.exercises.length === 0 ? (
              <p className="text-sm text-muted-foreground">No exercises</p>
            ) : (
              day.exercises.map((ex, exIdx) => {
                const exerciseData = getExerciseById(ex.exerciseId);
                return (
                  <div
                    key={exIdx}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {exerciseData?.name || "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {exerciseData?.muscleGroup}
                      </p>
                    </div>
                    <p className="text-sm font-medium">
                      {ex.targetSets} x {ex.targetReps}
                    </p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      ))}

      {/* Owner Actions */}
      {isOwner && (
        <>
          <Separator />
          <div className="space-y-3">
            <Button variant="outline" className="w-full" onClick={togglePublic}>
              {routine.isPublic ? (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Make Private
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 mr-2" />
                  Share with Community
                </>
              )}
            </Button>
            <Button variant="destructive" className="w-full" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Routine
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
