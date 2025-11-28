'use server';
/**
 * @fileOverview A flow for generating a CSV report of all inspection records.
 * 
 * - generateReport - A function that fetches all records and returns them as a CSV string.
 * - ReportInputSchema - The input type (zone filter).
 * - ReportOutputSchema - The output type (CSV string).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import Papa from 'papaparse';

export const ReportInputSchema = z.string().describe('The zone to filter records by, or "Todas las zonas" for all.');
export type ReportInput = z.infer<typeof ReportInputSchema>;

export const ReportOutputSchema = z.string().describe('The generated report in CSV format.');
export type ReportOutput = z.infer<typeof ReportOutputSchema>;

export async function generateReport(input: ReportInput): Promise<ReportOutput> {
  return generateReportFlow(input);
}

const generateReportFlow = ai.defineFlow(
  {
    name: 'generateReportFlow',
    inputSchema: ReportInputSchema,
    outputSchema: ReportOutputSchema,
  },
  async (zone) => {
    // This flow runs on the server, so we can use server-side Firebase access
    const { firestore } = initializeFirebase();
    const recordsCol = collection(firestore, 'inspection_requests');
    
    let recordsQuery;
    if (zone && zone !== 'Todas las zonas') {
        recordsQuery = query(recordsCol, where("zone", "==", zone));
    } else {
        recordsQuery = query(recordsCol);
    }

    const snapshot = await getDocs(recordsQuery);
    const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (records.length === 0) {
      return "No records found for the selected criteria.";
    }

    // Convert JSON to CSV
    const csv = Papa.unparse(records);
    return csv;
  }
);
