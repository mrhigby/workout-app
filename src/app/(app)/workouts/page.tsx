"use client";

import { useState, useMemo } from "react";
import { getWorkoutTypes, getExercises } from "@/lib/data-service";
import { WorkoutCategory } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Dumbbell, Heart, Zap, PersonStanding, Trophy } from "lucide-react";

const categoryIcons: Record<WorkoutCategory, React.ReactNode> = {
  Strength: <Dumbbell className="h-5 w-5" />,
  Cardio: <Heart className="h-5 w-5" />,
  HIIT: <Zap className="h-5 w-5" />,
  Flexibility: <PersonStanding className="h-5 w-5" />,
  Sport: <Trophy className="h-5 w-5" />,
};

const trackingLabels = {
  reps_weight: "Reps & Weight",
  duration: "Duration",
  distance: "Distance",
};

export default function WorkoutsPage() {
  const workoutTypes = useMemo(() => getWorkoutTypes(), []);
  const allExercises = useMemo(() => getExercises(), []);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedMuscle, setSelectedMuscle] = useState<string>("all");

  const muscleGroups = useMemo(() => {
    const groups = new Set(allExercises.map((e) => e.muscleGroup));
    return Array.from(groups).sort();
  }, [allExercises]);

  const filteredExercises = useMemo(() => {
    return allExercises.filter((ex) => {
      const matchSearch =
        !search ||
        ex.name.toLowerCase().includes(search.toLowerCase()) ||
        ex.description.toLowerCase().includes(search.toLowerCase());
      const matchCategory =
        selectedCategory === "all" ||
        ex.workoutTypeId === selectedCategory;
      const matchMuscle =
        selectedMuscle === "all" || ex.muscleGroup === selectedMuscle;
      return matchSearch && matchCategory && matchMuscle;
    });
  }, [allExercises, search, selectedCategory, selectedMuscle]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Exercise Library</h1>
        <p className="text-muted-foreground">Browse exercises by category and muscle group</p>
      </div>

      {/* Workout Type Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {workoutTypes.map((wt) => (
          <Card
            key={wt.id}
            className={`cursor-pointer transition-all hover:border-primary ${
              selectedCategory === wt.id ? "border-primary bg-primary/5" : ""
            }`}
            onClick={() =>
              setSelectedCategory(selectedCategory === wt.id ? "all" : wt.id)
            }
          >
            <CardContent className="pt-4 pb-4 text-center">
              <div className="flex justify-center mb-2 text-primary">
                {categoryIcons[wt.category]}
              </div>
              <p className="font-medium text-sm">{wt.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {allExercises.filter((e) => e.workoutTypeId === wt.id).length} exercises
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedMuscle} onValueChange={setSelectedMuscle}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Muscle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Muscles</SelectItem>
            {muscleGroups.map((mg) => (
              <SelectItem key={mg} value={mg}>
                {mg}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Exercise List */}
      <div className="space-y-2">
        {filteredExercises.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Dumbbell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No exercises found. Try different filters.</p>
          </div>
        ) : (
          filteredExercises.map((ex) => (
            <Card key={ex.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{ex.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{ex.description}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary">{ex.muscleGroup}</Badge>
                      <Badge variant="outline">{trackingLabels[ex.trackingType]}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
