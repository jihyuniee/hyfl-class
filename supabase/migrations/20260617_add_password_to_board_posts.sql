-- board_posts.password was added to the app code (PR #10) but never
-- migrated into the live Supabase table, causing
-- "Could not find the 'password' column of 'board_posts' in the schema cache"
-- when submitting a 선생님께 post. Run this in the Supabase SQL editor
-- (or via `supabase db push` if the project is linked to the CLI).
alter table board_posts
  add column if not exists password text;
