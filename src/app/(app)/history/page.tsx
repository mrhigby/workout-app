"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getWorkoutLogsByUser,
  getExerciseById,
  getExerciseHistory,
  deleteWorkoutLog,
} from "@/lib/data-service";
import { WorkoutLog } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, Trash2, Dumbbell, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function HistoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string>("");

  useEffect(() => {
    if (user) {
      setLogs(getWorkoutLogsByUser(user.id));
    }
  }, [user]);

  // Get exercises that have logged data
  const loggedExerciseIds = useMemo(() => {
    const ids = new Set<string>();
    logs.forEach((log) => log.exercises.forEach((ex) => ids.add(ex.exerciseId)));
    return Array.from(ids);
  }, [logs]);

  const progressData = useMemo(() => {
    if (!user || !selectedExercise) return [];
    return getExerciseHistory(user.id, selectedExercise);
  }, [user, selectedExercise]);

  function handleDelete(id: string) {
    deleteWorkoutLog(id);
    setLogs((prev) => prev.filter((l) => l.id !== id));
    toast({ title: "Workout deleted" });
  }

  function formatDuration(seconds: number) {
    const m = Math.floor(seconds / 60);
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  // Calendar data: group logs by date
  const logsByDate = useMemo(() => {
    const map: Record<string, number> = {};
    logs.forEach((log) => {
      const dateKey = new Date(log.date).toISOString().split("T")[0];
      map[dateKey] = (map[dateKey] || 0) + 1;
    });
    return map;
  }, [logs]);

  // Simple month calendar
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startPad = firstDay.getDay();
    const days: (number | null)[] = [];
    for (let i = 0; i < startPad; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
    return days;
  }, [viewMonth, viewYear]);

  const monthName = new Date(viewYear, viewMonth).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Workout History</h1>
        <p className="text-muted-foreground">View your past workouts and track progress</p>
      </div>

      <Tabs defaultValue="list">
        <TabsList className="w-full">
          <TabsTrigger value="list" className="flex-1">History</TabsTrigger>
          <TabsTrigger value="calendar" className="flex-1">Calendar</TabsTrigger>
          <TabsTrigger value="progress" className="flex-1">Progress</TabsTrigger>
        </TabsList>

        {/* List View */}
        <TabsContent value="list" className="space-y-3 mt-4">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Dumbbell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No workouts logged yet.</p>
            </div>
          ) : (
            logs.map((log) => (
              <Card key={log.id}>
                <CardContent className="py-4">
                  <div
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() =>
                      setExpandedLog(expandedLog === log.id ? null : log.id)
                    }
                  >
                    <div>
                      <h3 className="font-medium">
                        {log.routineName || "Freestyle Workout"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(log.date)}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary">
                          {log.exercises.length} exercise{log.exercises.length !== 1 ? "s" : ""}
                        </Badge>
                        <Badge variant="secondary">{formatDuration(log.duration)}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(log.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {expandedLog === log.id ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Expanded details */}
                  {expandedLog === log.id && (
                    <div className="mt-4 space-y-3 pt-3 border-t">
                      {log.exercises.map((ex, i) => {
                        const exerciseData = getExerciseById(ex.exerciseId);
                        return (
                          <div key={i}>
                            <p className="text-sm font-medium">
                              {exerciseData?.name || "Unknown"}
                            </p>
                            <div className="space-y-1 mt-1">
                              {ex.sets.map((set, j) => (
                                <p key={j} className="text-xs text-muted-foreground">
                                  Set {j + 1}:{" "}
                                  {set.weight ? `${set.weight} lbs x ` : ""}
                                  {set.reps ? `${set.reps} reps` : ""}
                                  {set.duration ? `${set.duration}s` : ""}
                                  {set.distance ? `${set.distance} mi` : ""}
                                  {set.completed ? " ✓" : ""}
                                </p>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      {log.notes && (
                        <p className="text-sm text-muted-foreground italic">
                          Notes: {log.notes}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Calendar View */}
        <TabsContent value="calendar" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (viewMonth === 0) {
                      setViewMonth(11);
                      setViewYear((y) => y - 1);
                    } else {
                      setViewMonth((m) => m - 1);
                    }
                  }}
                >
                  &lt;
                </Button>
                <CardTitle className="text-base">{monthName}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (viewMonth === 11) {
                      setViewMonth(0);
                      setViewYear((y) => y + 1);
                    } else {
                      setViewMonth((m) => m + 1);
                    }
                  }}
                >
                  &gt;
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                  <div key={d} className="text-xs text-muted-foreground py-1">
                    {d}
                  </div>
                ))}
                {calendarDays.map((day, i) => {
                  if (day === null)
                    return <div key={i} />;
                  const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const count = logsByDate[dateKey] || 0;
                  const isToday =
                    day === now.getDate() &&
                    viewMonth === now.getMonth() &&
                    viewYear === now.getFullYear();
                  return (
                    <div
                      key={i}
                      className={`py-2 rounded text-sm ${
                        count > 0
                          ? "bg-primary text-primary-foreground font-medium"
                          : ""
                      } ${isToday && count === 0 ? "ring-1 ring-primary" : ""}`}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress View */}
        <TabsContent value="progress" className="mt-4 space-y-4">
          <Select value={selectedExercise} onValueChange={setSelectedExercise}>
            <SelectTrigger>
              <SelectValue placeholder="Select an exercise to view progress" />
            </SelectTrigger>
            <SelectContent>
              {loggedExerciseIds.map((id) => {
                const ex = getExerciseById(id);
                return (
                  <SelectItem key={id} value={id}>
                    {ex?.name || id}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {selectedExercise && progressData.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  {getExerciseById(selectedExercise)?.name} Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Simple text-based progress display */}
                <div className="space-y-2">
                  {progressData.map((d, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground">
                        {new Date(d.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <div className="flex gap-4">
                        <span>
                          Max: <strong>{d.maxWeight} lbs</strong>
                        </span>
                        <span>
                          Vol: <strong>{d.totalVolume.toLocaleString()} lbs</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Visual bar chart */}
                {progressData.length > 1 && (
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-2">Max Weight Over Time</p>
                    <div className="flex items-end gap-1 h-24">
                      {progressData.map((d, i) => {
                        const maxVal = Math.max(...progressData.map((p) => p.maxWeight));
                        const height = maxVal > 0 ? (d.maxWeight / maxVal) * 100 : 0;
                        return (
                          <div
                            key={i}
                            className="flex-1 bg-primary rounded-t min-h-[4px]"
                            style={{ height: `${height}%` }}
                            title={`${d.maxWeight} lbs on ${new Date(d.date).toLocaleDateString()}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : selectedExercise ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No data for this exercise yet.</p>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Select an exercise to view your progress over time.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
