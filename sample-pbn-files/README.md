# Sample PBN Files

This directory contains sample PBN files that are automatically loaded when the database is reset to a clean state.

## How to Use

1. Place your PBN files in this directory
2. Update `sample-data.json` with an entry for each file:
   - `file`: The filename of the PBN file
   - `uploadedBy`: Email of the uploader (use "random" to randomly select a test user)
   - `title`: Title to use for the game
   - `date`: Date of the game (YYYY-MM-DD format)
   - `location`: Location where the game was played

3. Run `tsx scripts/database-manager.ts clean` to reset the database and load the sample files

## Notes

- If the specified uploader email doesn't exist, it will fall back to the admin user
- The PBN files themselves should be valid PBN format
- Tournament and round information will be extracted from the PBN file if present