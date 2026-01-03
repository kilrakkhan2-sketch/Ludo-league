"use server";

import { detectDuplicateScreenshots } from "@/ai/flows/detect-duplicate-screenshots";
import { z } from "zod";

const SubmitResultSchema = z.object({
  matchId: z.string(),
  position: z.coerce.number().min(1).max(4),
  status: z.enum(["win", "loss"]),
  screenshotDataUri: z.string().refine(val => val.startsWith('data:image/'), {
    message: 'Screenshot must be a data URI of an image.',
  }),
});

export type FormState = {
    message: string;
    isError: boolean;
} | undefined;


export async function submitResult(
    prevState: FormState,
    formData: FormData
): Promise<FormState> {
  try {
    const rawFormData = Object.fromEntries(formData.entries());
    const parsed = SubmitResultSchema.safeParse(rawFormData);
    
    if (!parsed.success) {
      console.error(parsed.error.flatten().fieldErrors);
      return { message: "Invalid form data.", isError: true };
    }
    
    const { screenshotDataUri, matchId } = parsed.data;

    console.log(`Submitting result for match ${matchId}...`);
    
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Automated Fraud Detection
    const fraudResult = await detectDuplicateScreenshots({
      screenshotDataUri,
      matchId,
    });
    
    if (fraudResult.isDuplicate) {
      const duplicateMatches = fraudResult.duplicateMatchIds.join(', ');
      const message = `Fraud Warning: This screenshot may have been used in other matches (${duplicateMatches}). Submission flagged for review.`;
      console.warn(message);
      // In a real app, you would save this flagged status to your database.
      return { message, isError: true };
    }

    // In a real app, you would save the result to your database here.
    console.log("Result submitted and verified:", parsed.data);
    
    return { message: "Result submitted successfully! Your submission is now under review.", isError: false };

  } catch (error) {
    console.error("Error submitting result:", error);
    return { message: "An unexpected error occurred. Please try again.", isError: true };
  }
}
