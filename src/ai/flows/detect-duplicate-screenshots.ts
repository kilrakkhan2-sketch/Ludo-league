'use server';

/**
 * @fileOverview Flow for detecting duplicate screenshots to identify potential fraud.
 *
 * - detectDuplicateScreenshots - Detects if a screenshot has been uploaded in multiple matches.
 * - DetectDuplicateScreenshotsInput - Input type for the detectDuplicateScreenshots function.
 * - DetectDuplicateScreenshotsOutput - Output type for the detectDuplicateScreenshots function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectDuplicateScreenshotsInputSchema = z.object({
  screenshotDataUri: z
    .string()
    .describe(
      "A screenshot as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  matchId: z.string().describe('The ID of the match the screenshot belongs to.'),
});
export type DetectDuplicateScreenshotsInput = z.infer<typeof DetectDuplicateScreenshotsInputSchema>;

const DetectDuplicateScreenshotsOutputSchema = z.object({
  isDuplicate: z
    .boolean()
    .describe('Whether the screenshot is a duplicate of one used in another match.'),
  duplicateMatchIds: z
    .array(z.string())
    .describe('The IDs of the matches where the duplicate screenshot was used.'),
});
export type DetectDuplicateScreenshotsOutput = z.infer<typeof DetectDuplicateScreenshotsOutputSchema>;

export async function detectDuplicateScreenshots(
  input: DetectDuplicateScreenshotsInput
): Promise<DetectDuplicateScreenshotsOutput> {
  return detectDuplicateScreenshotsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectDuplicateScreenshotsPrompt',
  input: {schema: DetectDuplicateScreenshotsInputSchema},
  output: {schema: DetectDuplicateScreenshotsOutputSchema},
  prompt: `You are an expert in fraud detection for online gaming platforms.

You are provided with a screenshot uploaded by a user for a specific match.
Your task is to determine if this screenshot has been used in any other matches to detect potential fraud.

Analyze the provided screenshot and compare it to a database of previously uploaded screenshots. Identify if the same image (or a very similar one) has been used in other matches.

Screenshot: {{media url=screenshotDataUri}}
Match ID: {{{matchId}}}

Based on your analysis, determine if the screenshot is a duplicate and, if so, list the IDs of the matches where the duplicate screenshot was used.
`,
});

const detectDuplicateScreenshotsFlow = ai.defineFlow(
  {
    name: 'detectDuplicateScreenshotsFlow',
    inputSchema: DetectDuplicateScreenshotsInputSchema,
    outputSchema: DetectDuplicateScreenshotsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
