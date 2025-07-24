# Sample Data Directory

This directory contains sample data (users and PBN files) that are automatically loaded when the database is reset to a clean state.

## Structure

### Users
Define sample users in `sample-data.json`:
- `email`: User's email address (must be unique)
- `password`: Plain text password (will be hashed automatically)
- `firstName`: User's first name
- `lastName`: User's last name
- `displayName`: Display name shown in comments
- `userType`: Either "player" (regular user) or "test" (test user for cleanup)

Note: The admin user is always created by the system with credentials from environment variables or defaults.

### Games
Define PBN file metadata in `sample-data.json`:
- `file`: The filename of the PBN file
- `uploadedBy`: Email of the uploader (use "random" to randomly select a test user)
- `title`: Title to use for the game
- `date`: Date of the game (YYYY-MM-DD format)
- `location`: Location where the game was played

## How to Use

1. Place your PBN files in this directory
2. Update `sample-data.json` with:
   - User definitions in the `users` array
   - Game metadata in the `games` array
3. Run `tsx scripts/database-manager.ts clean` to reset the database and load all sample data

## Notes

- Users are created before games to ensure uploaders exist
- If the specified uploader email doesn't exist, it will fall back to the admin user
- Test users (userType: "test") can be cleaned up with the `cleanup` command
- The PBN files themselves should be valid PBN format
- Tournament and round information will be extracted from the PBN file if present