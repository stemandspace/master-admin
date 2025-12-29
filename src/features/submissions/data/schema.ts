import { z } from 'zod'

const SubmissionSchema = z.object({
    id: z.string(),
    label: z.string().optional(),
    content_id: z.string(),
    text: z.string().optional(),
    content_type: z.enum(['diy', 'course', 'ana']),
    status: z.enum(['pending', 'selected', 'rejected']).default('pending'),
    rewarded: z.boolean().default(false),
    createdAt: z.string(),
    updatedAt: z.string(),
    media: z.array(z.object({
        id: z.number(),
        url: z.string(),
        mime: z.string().optional(),
    })).optional(),
    user: z.object({
        id: z.string(),
        firstname: z.string().optional(),
        lastname: z.string().optional(),
        username: z.string().optional(),
        email: z.string(),
        mobile: z.string().optional(),
    }),
    live_event: z.object({
        id: z.string(),
        title: z.string().optional(),
    }).optional(),
})

export type Submission = z.infer<typeof SubmissionSchema>
export const submissionSchema = z.array(SubmissionSchema)

