import { defineData, a, type ClientSchema } from "@aws-amplify/backend";

const schema = a.schema({
  WorkoutType: a
    .model({
      name: a.string().required(),
      category: a.enum(["Strength", "Cardio", "Flexibility", "HIIT", "Sport"]),
      description: a.string(),
      icon: a.string(),
    })
    .authorization((allow) => [allow.guest().to(["read"]), allow.authenticated().to(["read"])]),

  Exercise: a
    .model({
      name: a.string().required(),
      description: a.string(),
      muscleGroup: a.string().required(),
      workoutTypeId: a.string().required(),
      isSystemExercise: a.boolean().required(),
      trackingType: a.enum(["reps_weight", "duration", "distance"]),
    })
    .authorization((allow) => [
      allow.guest().to(["read"]),
      allow.authenticated().to(["create", "read"]),
    ]),

  Routine: a
    .model({
      ownerId: a.string().required(),
      ownerName: a.string(),
      name: a.string().required(),
      description: a.string(),
      isPublic: a.boolean().required(),
      days: a.json(),
    })
    .authorization((allow) => [allow.owner(), allow.authenticated().to(["read"])]),

  WorkoutLog: a
    .model({
      userId: a.string().required(),
      date: a.string().required(),
      routineId: a.string(),
      routineName: a.string(),
      exercises: a.json(),
      notes: a.string(),
      duration: a.integer(),
    })
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;
export const data = defineData({ schema });
