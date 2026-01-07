import { config } from 'dotenv';
config();

import '@/ai/flows/detect-duplicate-screenshots';
import '@/ai/flows/calculate-win-rate';
import '@/ai/flows/distribute-tournament-winnings';
import '@/ai/flows/delete-old-records';
