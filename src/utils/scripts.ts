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

export async function cleanBouties() {
  // Read the CSV file
  fs.readFile(csvFilePath, 'utf8', async (err, data) => {
    if (err) {
      console.error('Error reading the CSV file:', err);
      return;
    }

    // Parse the CSV data using Papa Parse
    const cleanSkills = Papa.parse<CSVData>(data, {
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
              JSON.parse(editedSkills);

              // Log the parsed skills
              // console.log('Valid JSON:', parsedSkills);
            } catch (error) {
              invalidJSONs.push({
                id,
                editedSkills,
              });
              // Log the error if parsing fails
              // console.error('Invalid JSON:', editedSkills);
            }
          } else {
            console.log('Empty editedSkills field');
          }
        });
      },
    });

    console.log('length of clean-skills', cleanSkills.data.length);

    // console.log('skill - ', cleanSkills.data[0]!.editedSkills)

    // await prisma.bounties.update({
    //   where: {
    //     id: cleanSkills.data[0]!.id
    //   },
    //   data: {
    //     skills: JSON.parse(cleanSkills.data[0]!.editedSkills) as Prisma.JsonValue ?? undefined,
    //   }
    // }).then(d => {
    //   console.log('yo d - ', d)
    // }).catch(c => {
    //   console.log('yo c - ', c)
    // })
    // console.log('please work')

    // console.log('we starting')
    // for (let d of cleanSkills.data) {
    //   console.log('we at - ', d.id)
    //   console.log('we have - ', d.editedSkills)
    //   try {
    //     const a = await prisma.bounties.update({
    //       where: {
    //         id: d.id,
    //       },
    //       data: {
    //         skills: JSON.parse(d.editedSkills) as Prisma.JsonValue ?? undefined
    //       }
    //     })
    //     console.log('is a done?')
    //     console.log('yo boi done - ', d.id, ' - ', a.skills)
    //   } catch (err) {
    //     console.log('Error - ', err)
    //   }
    // }

    console.log('we done??');
    // console.log('resp - ', resp)
  });
}
