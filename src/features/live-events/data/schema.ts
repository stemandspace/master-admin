import { z } from 'zod'

const liveEventSchema = z.object({
    id: z.string(),
    title: z.string(),
    winners_rewards: z.array(z.any()).optional(),
    participation_rewards: z.array(z.any()).optional(),
    winners: z.array(z.any()).optional(),
    participants: z.array(z.any()).optional(),
    winners_rewarded: z.boolean().optional(),
    participations_rewarded: z.boolean().optional(),
    live: z.any().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    publishedAt: z.string().nullable().optional(),
})

export type LiveEvent = z.infer<typeof liveEventSchema>
export const liveEventListSchema = z.array(liveEventSchema)

