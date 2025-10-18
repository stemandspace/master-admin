import { z } from "zod";

// First define base schema:
const baseSchema = z.object({
    id: z.string().min(0),
    title: z.string().min(1),
    desc: z.string().min(1),
    type: z.enum(['easy', 'medium', 'hard']),
    date: z.string().min(10),
    variable_score: z.string().min(1),
    "question 1": z.string().min(1),
    "question 1 option 1": z.string().min(1),
    "question 1 option 2": z.string().min(1),
    "question 1 option 3": z.string().min(1),
    "question 1 option 4": z.string().min(1),
    "question 1 answer": z.string().min(1),
    "question 2": z.string().min(1),
    "question 2 option 1": z.string().min(1),
    "question 2 option 2": z.string().min(1),
    "question 2 option 3": z.string().min(1),
    "question 2 option 4": z.string().min(1),
    "question 2 answer": z.string().min(1),
    "question 3": z.string().min(1),
    "question 3 option 1": z.string().min(1),
    "question 3 option 2": z.string().min(1),
    "question 3 option 3": z.string().min(1),
    "question 3 option 4": z.string().min(1),
    "question 3 answer": z.string().min(1),
    "question 4": z.string().min(1),
    "question 4 option 1": z.string().min(1),
    "question 4 option 2": z.string().min(1),
    "question 4 option 3": z.string().min(1),
    "question 4 option 4": z.string().min(1),
    "question 4 answer": z.string().min(1),
    "question 5": z.string().min(1),
    "question 5 option 1": z.string().min(1),
    "question 5 option 2": z.string().min(1),
    "question 5 option 3": z.string().min(1),
    "question 5 option 4": z.string().min(1),
    "question 5 answer": z.string().min(1),
});

// Now we refine:
export const QuizSchema = baseSchema.superRefine((data, context) => {
    for (let i = 1; i <= 5; i++) {
        // @ts-ignore
        const answer = data[`question ${i} answer`] as string;
        const options = [
            // @ts-ignore
            data[`question ${i} option 1`] as string,
            // @ts-ignore
            data[`question ${i} option 2`] as string,
            // @ts-ignore
            data[`question ${i} option 3`] as string,
            // @ts-ignore
            data[`question ${i} option 4`] as string,
        ];

        if (!options.includes(answer)) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                message: `question ${i} answer must match one of its options`
            });
        }
    }
});

// Validate:
function validateRow(row: unknown) {
    return QuizSchema.parse(row);
}

function isEmptyRow(row: any) {
    return !row.title || row.title.length === 0;
}

export const normalize = (data: unknown[]) => {
    return data.filter(row => !isEmptyRow(row)).map(validateRow).filter(Boolean);
}