"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getRoutinesByUser, getPublicRoutines, deleteRoutine } from "@/lib/data-service";
import { Routine } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ClipboardList, Users, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function RoutinesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [myRoutines, setMyRoutines] = useState<Routine[]>([]);
  const [communityRoutines, setCommunityRoutines] = useState<Routine[]>([]);

  useEffect(() => {
    if (user) {
      (async () => {
        const [mine, pub] = await Promise.all([
          getRoutinesByUser(user.id),
          getPublicRoutines(),
        ]);
        setMyRoutines(mine);
        setCommunityRoutines(pub.filter((r) => r.ownerId !== user.id));
      })();
    }
  }, [user]);

  async function handleDelete(id: string) {
    const deleted = await deleteRoutine(id);
    if (deleted) {
      setMyRoutines((prev) => prev.filter((r) => r.id !== id));
      toast({ title: "Routine deleted" });
    }
  }

  function RoutineCard({ routine, showDelete }: { routine: Routine; showDelete?: boolean }) {
    const totalExercises = routine.days.reduce(
      (sum, day) => sum + day.exercises.length,
      0
    );

    return (
      <Card>
        <CardContent className="py-4">
          <div className="flex items-start justify-between">
            <Link href={`/routines/${routine.id}`} className="flex-1">
              <h3 className="font-medium hover:text-primary transition-colors">
                {routine.name}
              </h3>
              {routine.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {routine.description}
                </p>
              )}
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary">
                  {routine.days.length} day{routine.days.length !== 1 ? "s" : ""}
                </Badge>
                <Badge variant="secondary">
                  {totalExercises} exercise{totalExercises !== 1 ? "s" : ""}
                </Badge>
                {routine.isPublic && (
                  <Badge variant="outline">
                    <Users className="h-3 w-3 mr-1" />
                    Public
                  </Badge>
                )}
              </div>
              {!showDelete && (
                <p className="text-xs text-muted-foreground mt-2">
                  by {routine.ownerName}
                </p>
              )}
            </Link>
            {showDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete(routine.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Routines</h1>
          <p className="text-muted-foreground">Build and manage your workout routines</p>
        </div>
        <Button asChild>
          <Link href="/routines/new">
            <Plus className="h-4 w-4 mr-2" />
            New
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="mine">
        <TabsList className="w-full">
          <TabsTrigger value="mine" className="flex-1">
            <ClipboardList className="h-4 w-4 mr-2" />
            My Routines
          </TabsTrigger>
          <TabsTrigger value="community" className="flex-1">
            <Users className="h-4 w-4 mr-2" />
            Community
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mine" className="space-y-3 mt-4">
          {myRoutines.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No routines yet.</p>
              <Button asChild variant="link" className="mt-2">
                <Link href="/routines/new">Create your first routine</Link>
              </Button>
            </div>
          ) : (
            myRoutines.map((r) => (
              <RoutineCard key={r.id} routine={r} showDelete />
            ))
          )}
        </TabsContent>

        <TabsContent value="community" className="space-y-3 mt-4">
          {communityRoutines.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No community routines yet.</p>
              <p className="text-sm mt-1">Create a routine and make it public to share!</p>
            </div>
          ) : (
            communityRoutines.map((r) => (
              <RoutineCard key={r.id} routine={r} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
