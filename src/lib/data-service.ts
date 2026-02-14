import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { Routine, WorkoutLog, Exercise, WorkoutType, RoutineDay, WorkoutLogExercise } from "./types";
import { workoutTypes as seedWorkoutTypes, exercises as seedExercises } from "./seed-data";

const client = generateClient<Schema>();

// ---------------------------------------------------------------------------
// Workout Types (local seed data — no change)
// ---------------------------------------------------------------------------
export function getWorkoutTypes(): WorkoutType[] {
  return seedWorkoutTypes;
}

// ---------------------------------------------------------------------------
// Exercises (local seed data — no change)
// ---------------------------------------------------------------------------
export function getExercises(): Exercise[] {
  return seedExercises;
}

export function getExerciseById(id: string): Exercise | undefined {
  return getExercises().find((e) => e.id === id);
}

export function getExercisesByWorkoutType(workoutTypeId: string): Exercise[] {
  return getExercises().filter((e) => e.workoutTypeId === workoutTypeId);
}

export function addExercise(exercise: Omit<Exercise, "id">): Exercise {
  const newExercise: Exercise = { ...exercise, id: `ex-custom-${Date.now()}` };
  // For now custom exercises are stored in memory only.
  // TODO: persist custom exercises to Amplify if needed.
  seedExercises.push(newExercise);
  return newExercise;
}

// ---------------------------------------------------------------------------
// Helper: parse JSON fields that may come back as a string from AppSync
// ---------------------------------------------------------------------------
function parseJson<T>(value: unknown): T {
  if (typeof value === "string") return JSON.parse(value) as T;
  return value as T;
}

// ---------------------------------------------------------------------------
// Helpers: map Amplify record → local Routine / WorkoutLog type
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toRoutine(r: any): Routine {
  return {
    id: r.id,
    ownerId: r.ownerId,
    ownerName: r.ownerName ?? "",
    name: r.name,
    description: r.description ?? "",
    isPublic: r.isPublic,
    days: parseJson<RoutineDay[]>(r.days) ?? [],
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toWorkoutLog(l: any): WorkoutLog {
  return {
    id: l.id,
    userId: l.userId,
    date: l.date,
    routineId: l.routineId ?? undefined,
    routineName: l.routineName ?? undefined,
    exercises: parseJson<WorkoutLogExercise[]>(l.exercises) ?? [],
    notes: l.notes ?? "",
    duration: l.duration ?? 0,
    createdAt: l.createdAt,
  };
}

// ---------------------------------------------------------------------------
// Routines  (Amplify Data)
// ---------------------------------------------------------------------------
export async function getRoutines(): Promise<Routine[]> {
  const { data } = await client.models.Routine.list();
  return data.map(toRoutine);
}

export async function getRoutineById(id: string): Promise<Routine | undefined> {
  const { data } = await client.models.Routine.get({ id });
  return data ? toRoutine(data) : undefined;
}

export async function getRoutinesByUser(userId: string): Promise<Routine[]> {
  const { data } = await client.models.Routine.list({
    filter: { ownerId: { eq: userId } },
  });
  return data.map(toRoutine);
}

export async function getPublicRoutines(): Promise<Routine[]> {
  const { data } = await client.models.Routine.list({
    filter: { isPublic: { eq: true } },
  });
  return data.map(toRoutine);
}

export async function saveRoutine(
  routine: Omit<Routine, "id" | "createdAt" | "updatedAt">
): Promise<Routine> {
  const { data } = await client.models.Routine.create({
    ownerId: routine.ownerId,
    ownerName: routine.ownerName,
    name: routine.name,
    description: routine.description,
    isPublic: routine.isPublic,
    days: JSON.stringify(routine.days),
  });
  return toRoutine(data);
}

export async function updateRoutine(
  id: string,
  updates: Partial<Routine>
): Promise<Routine | undefined> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const input: any = { id };
  if (updates.name !== undefined) input.name = updates.name;
  if (updates.description !== undefined) input.description = updates.description;
  if (updates.isPublic !== undefined) input.isPublic = updates.isPublic;
  if (updates.days !== undefined) input.days = JSON.stringify(updates.days);
  if (updates.ownerName !== undefined) input.ownerName = updates.ownerName;

  const { data } = await client.models.Routine.update(input);
  return data ? toRoutine(data) : undefined;
}

export async function deleteRoutine(id: string): Promise<boolean> {
  const { data } = await client.models.Routine.delete({ id });
  return !!data;
}

// ---------------------------------------------------------------------------
// Workout Logs  (Amplify Data)
// ---------------------------------------------------------------------------
export async function getWorkoutLogs(): Promise<WorkoutLog[]> {
  const { data } = await client.models.WorkoutLog.list();
  return data.map(toWorkoutLog);
}

export async function getWorkoutLogsByUser(userId: string): Promise<WorkoutLog[]> {
  const { data } = await client.models.WorkoutLog.list({
    filter: { userId: { eq: userId } },
  });
  return data
    .map(toWorkoutLog)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getWorkoutLogById(id: string): Promise<WorkoutLog | undefined> {
  const { data } = await client.models.WorkoutLog.get({ id });
  return data ? toWorkoutLog(data) : undefined;
}

export async function saveWorkoutLog(
  log: Omit<WorkoutLog, "id" | "createdAt">
): Promise<WorkoutLog> {
  const { data } = await client.models.WorkoutLog.create({
    userId: log.userId,
    date: log.date,
    routineId: log.routineId,
    routineName: log.routineName,
    exercises: JSON.stringify(log.exercises),
    notes: log.notes,
    duration: log.duration,
  });
  return toWorkoutLog(data);
}

export async function deleteWorkoutLog(id: string): Promise<boolean> {
  const { data } = await client.models.WorkoutLog.delete({ id });
  return !!data;
}

// ---------------------------------------------------------------------------
// Progress data for charts
// ---------------------------------------------------------------------------
export async function getExerciseHistory(
  userId: string,
  exerciseId: string
): Promise<{ date: string; maxWeight: number; totalVolume: number }[]> {
  const logs = await getWorkoutLogsByUser(userId);
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
