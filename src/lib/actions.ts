"use server";

import { detectDuplicateScreenshots } from "@/ai/flows/detect-duplicate-screenshots";
import { z } from "zod";

// This file can be removed or repurposed. The logic has been moved to the client component `submit-result-form.tsx`
// to have better access to Firebase services and state management hooks.

export type FormState = {
    message: string;
    isError: boolean;
} | undefined;


// This server action is no longer in use.
export async function submitResult(
    prevState: FormState,
    formData: FormData
): Promise<FormState> {
  
  console.log("This server action is deprecated.");

  return {
    message: "This action is no longer in use.",
    isError: true
  };
}
