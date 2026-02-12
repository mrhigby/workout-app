import { Routine, WorkoutLog, Exercise, WorkoutType } from "./types";
import { workoutTypes as seedWorkoutTypes, exercises as seedExercises } from "./seed-data";

const ROUTINES_KEY = "workout_app_routines";
const LOGS_KEY = "workout_app_logs";
const EXERCISES_KEY = "workout_app_exercises";
const WORKOUT_TYPES_KEY = "workout_app_workout_types";

function initializeData() {
  if (typeof window === "undefined") return;

  if (!localStorage.getItem(WORKOUT_TYPES_KEY)) {
    localStorage.setItem(WORKOUT_TYPES_KEY, JSON.stringify(seedWorkoutTypes));
  }
  if (!localStorage.getItem(EXERCISES_KEY)) {
    localStorage.setItem(EXERCISES_KEY, JSON.stringify(seedExercises));
  }
}

// Workout Types
export function getWorkoutTypes(): WorkoutType[] {
  initializeData();
  if (typeof window === "undefined") return seedWorkoutTypes;
  const data = localStorage.getItem(WORKOUT_TYPES_KEY);
  return data ? JSON.parse(data) : seedWorkoutTypes;
}

// Exercises
export function getExercises(): Exercise[] {
  initializeData();
  if (typeof window === "undefined") return seedExercises;
  const data = localStorage.getItem(EXERCISES_KEY);
  return data ? JSON.parse(data) : seedExercises;
}

export function getExerciseById(id: string): Exercise | undefined {
  return getExercises().find((e) => e.id === id);
}

export function getExercisesByWorkoutType(workoutTypeId: string): Exercise[] {
  return getExercises().filter((e) => e.workoutTypeId === workoutTypeId);
}

export function addExercise(exercise: Omit<Exercise, "id">): Exercise {
  const exercises = getExercises();
  const newExercise: Exercise = { ...exercise, id: `ex-custom-${Date.now()}` };
  exercises.push(newExercise);
  localStorage.setItem(EXERCISES_KEY, JSON.stringify(exercises));
  return newExercise;
}

// Routines
export function getRoutines(): Routine[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(ROUTINES_KEY);
  return data ? JSON.parse(data) : [];
}

export function getRoutineById(id: string): Routine | undefined {
  return getRoutines().find((r) => r.id === id);
}

export function getRoutinesByUser(userId: string): Routine[] {
  return getRoutines().filter((r) => r.ownerId === userId);
}

export function getPublicRoutines(): Routine[] {
  return getRoutines().filter((r) => r.isPublic);
}

export function saveRoutine(routine: Omit<Routine, "id" | "createdAt" | "updatedAt">): Routine {
  const routines = getRoutines();
  const newRoutine: Routine = {
    ...routine,
    id: `routine-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  routines.push(newRoutine);
  localStorage.setItem(ROUTINES_KEY, JSON.stringify(routines));
  return newRoutine;
}

export function updateRoutine(id: string, updates: Partial<Routine>): Routine | undefined {
  const routines = getRoutines();
  const idx = routines.findIndex((r) => r.id === id);
  if (idx === -1) return undefined;
  routines[idx] = { ...routines[idx], ...updates, updatedAt: new Date().toISOString() };
  localStorage.setItem(ROUTINES_KEY, JSON.stringify(routines));
  return routines[idx];
}

export function deleteRoutine(id: string): boolean {
  const routines = getRoutines();
  const filtered = routines.filter((r) => r.id !== id);
  if (filtered.length === routines.length) return false;
  localStorage.setItem(ROUTINES_KEY, JSON.stringify(filtered));
  return true;
}

// Workout Logs
export function getWorkoutLogs(): WorkoutLog[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(LOGS_KEY);
  return data ? JSON.parse(data) : [];
}

export function getWorkoutLogsByUser(userId: string): WorkoutLog[] {
  return getWorkoutLogs()
    .filter((l) => l.userId === userId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getWorkoutLogById(id: string): WorkoutLog | undefined {
  return getWorkoutLogs().find((l) => l.id === id);
}

export function saveWorkoutLog(log: Omit<WorkoutLog, "id" | "createdAt">): WorkoutLog {
  const logs = getWorkoutLogs();
  const newLog: WorkoutLog = {
    ...log,
    id: `log-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  logs.push(newLog);
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  return newLog;
}

export function deleteWorkoutLog(id: string): boolean {
  const logs = getWorkoutLogs();
  const filtered = logs.filter((l) => l.id !== id);
  if (filtered.length === logs.length) return false;
  localStorage.setItem(LOGS_KEY, JSON.stringify(filtered));
  return true;
}

// Progress data for charts
export function getExerciseHistory(
  userId: string,
  exerciseId: string
): { date: string; maxWeight: number; totalVolume: number }[] {
  const logs = getWorkoutLogsByUser(userId);
  const history: { date: string; maxWeight: number; totalVolume: number }[] = [];

  for (const log of logs) {
    const exerciseLog = log.exercises.find((e) => e.exerciseId === exerciseId);
    if (exerciseLog) {
      let maxWeight = 0;
      let totalVolume = 0;
      for (const set of exerciseLog.sets) {
        if (set.weight && set.weight > maxWeight) maxWeight = set.weight;
        if (set.weight && set.reps) totalVolume += set.weight * set.reps;
      }
      history.push({ date: log.date, maxWeight, totalVolume });
    }
  }

  return history.reverse();
}
