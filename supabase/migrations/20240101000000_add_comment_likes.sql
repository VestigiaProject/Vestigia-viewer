-- Add parent_id column to user_interactions table
ALTER TABLE user_interactions
ADD COLUMN parent_id UUID REFERENCES user_interactions(id);

-- Add a check constraint to ensure parent_id is only set for comment likes
ALTER TABLE user_interactions
ADD CONSTRAINT valid_parent_id CHECK (
  (type = 'comment_like' AND parent_id IS NOT NULL AND post_id IS NULL) OR
  (type != 'comment_like' AND parent_id IS NULL)
);

-- Update type enum to include comment_like
ALTER TABLE user_interactions
DROP CONSTRAINT IF EXISTS user_interactions_type_check;

ALTER TABLE user_interactions
ADD CONSTRAINT user_interactions_type_check 
CHECK (type IN ('like', 'comment', 'comment_like')); 