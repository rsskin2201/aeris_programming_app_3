'use server';
/**
 * @fileOverview A flow for generating a CSV report of all inspection records.
 * 
 * - generateReport - A function that fetches all records and returns them as a CSV string.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import Papa from 'papaparse';
import { mockRecords } from '@/lib/mock-data';

const ReportInputSchema = z.string().describe('The zone to filter records by, or "Todas las zonas" for all.');
export type ReportInput = z.infer<typeof ReportInputSchema>;

const ReportOutputSchema = z.string().describe('The generated report in CSV format.');
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
    // NOTE: This flow uses mock data because Firebase is not integrated.
    // In a real application, this would fetch data from Firestore.
    let records = mockRecords;
    
    if (zone && zone !== 'Todas las zonas') {
        records = mockRecords.filter(record => record.zone === zone);
    }

    if (records.length === 0) {
      return "No records found for the selected criteria.";
    }

    // Convert JSON to CSV
    const csv = Papa.unparse(records);
    return csv;
  }
);
