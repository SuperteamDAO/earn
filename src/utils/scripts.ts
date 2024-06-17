// import { prisma } from "@/prisma";

import * as fs from 'fs';
import * as Papa from 'papaparse';
import * as path from 'path';

const baseDir = process.cwd();
const csvFilePath = path.join(baseDir, 'public', 'clean-skills.csv');

interface CSVData {
  id: string;
  editedSkills: string;
}

const invalidJSONs: CSVData[] = [];

// Read the CSV file
fs.readFile(csvFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading the CSV file:', err);
    return;
  }

  // Parse the CSV data using Papa Parse
  Papa.parse<CSVData>(data, {
    header: true,
    complete: (results) => {
      // Iterate over each row
      results.data.forEach((row) => {
        const editedSkills = row.editedSkills;
        const id = row.id;

        // Check if editedSkills is not empty
        if (editedSkills && id) {
          try {
            // Attempt to parse editedSkills as JSON
            if (editedSkills === `""`)
              throw new Error('Empty editedSkills field');
            const parsedSkills = JSON.parse(editedSkills);

            // Log the parsed skills
            console.log('Valid JSON:', parsedSkills);
          } catch (error) {
            invalidJSONs.push({
              id,
              editedSkills,
            });
            // Log the error if parsing fails
            console.error('Invalid JSON:', editedSkills);
          }
        } else {
          console.log('Empty editedSkills field');
        }
      });
    },
  });

  console.log('invalid JSONs', invalidJSONs.map((c) => c.id).join('\n'));
  console.log('length of invalid JSONs', invalidJSONs.length);
});
