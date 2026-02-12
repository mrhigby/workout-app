"use client";

import { useState, useMemo } from "react";
import { getExercises } from "@/lib/data-service";
import { Exercise } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Check } from "lucide-react";

interface ExercisePickerProps {
  onSelect: (exercise: Exercise) => void;
  selectedIds?: string[];
  trigger?: React.ReactNode;
}

export function ExercisePicker({ onSelect, selectedIds = [], trigger }: ExercisePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("all");
  const exercises = useMemo(() => getExercises(), []);

  const muscleGroups = useMemo(() => {
    const groups = new Set(exercises.map((e) => e.muscleGroup));
    return Array.from(groups).sort();
  }, [exercises]);

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      const matchSearch =
        !search ||
        ex.name.toLowerCase().includes(search.toLowerCase()) ||
        ex.muscleGroup.toLowerCase().includes(search.toLowerCase());
      const matchMuscle = muscleFilter === "all" || ex.muscleGroup === muscleFilter;
      return matchSearch && matchMuscle;
    });
  }, [exercises, search, muscleFilter]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Exercise
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Add Exercise</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={muscleFilter} onValueChange={setMuscleFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {muscleGroups.map((mg) => (
                <SelectItem key={mg} value={mg}>
                  {mg}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-1">
            {filtered.map((ex) => {
              const isSelected = selectedIds.includes(ex.id);
              return (
                <button
                  key={ex.id}
                  onClick={() => {
                    onSelect(ex);
                    setOpen(false);
                    setSearch("");
                  }}
                  disabled={isSelected}
                  className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{ex.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {ex.muscleGroup}
                      </p>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
