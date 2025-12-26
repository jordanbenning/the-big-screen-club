-- Normalize all existing usernames to lowercase
UPDATE users SET username = LOWER(username);

