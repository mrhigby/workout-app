export type WorkoutCategory = "Strength" | "Cardio" | "Flexibility" | "HIIT" | "Sport";

export type TrackingType = "reps_weight" | "duration" | "distance";

export type MuscleGroup =
  | "Chest"
  | "Back"
  | "Shoulders"
  | "Biceps"
  | "Triceps"
  | "Legs"
  | "Core"
  | "Glutes"
  | "Full Body"
  | "Cardio";

export interface WorkoutType {
  id: string;
  name: string;
  category: WorkoutCategory;
  description: string;
  icon: string;
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  muscleGroup: MuscleGroup;
  workoutTypeId: string;
  isSystemExercise: boolean;
  trackingType: TrackingType;
}

export interface RoutineExercise {
  exerciseId: string;
  targetSets: number;
  targetReps: number;
}

export interface RoutineDay {
  dayLabel: string;
  exercises: RoutineExercise[];
}

export interface Routine {
  id: string;
  ownerId: string;
  ownerName: string;
  name: string;
  description: string;
  isPublic: boolean;
  days: RoutineDay[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutSet {
  reps?: number;
  weight?: number;
  duration?: number;
  distance?: number;
  completed: boolean;
}

export interface WorkoutLogExercise {
  exerciseId: string;
  sets: WorkoutSet[];
}

export interface WorkoutLog {
  id: string;
  userId: string;
  date: string;
  routineId?: string;
  routineName?: string;
  exercises: WorkoutLogExercise[];
  notes: string;
  duration: number; // seconds
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
}
