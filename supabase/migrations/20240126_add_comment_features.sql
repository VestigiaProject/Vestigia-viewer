-- Add parent_comment_id column to allow for comment replies
ALTER TABLE user_interactions ADD COLUMN parent_comment_id UUID REFERENCES user_interactions(id);

-- Add likes_count column to store the number of likes for comments
ALTER TABLE user_interactions ADD COLUMN likes_count INTEGER DEFAULT 0;

-- Create index for parent_comment_id for better query performance
CREATE INDEX idx_user_interactions_parent_comment_id ON user_interactions(parent_comment_id);

-- Create index for likes_count for better sorting performance
CREATE INDEX idx_user_interactions_likes_count ON user_interactions(likes_count);

-- Add trigger to update likes_count when a comment receives a like
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.type = 'like' THEN
    -- If this is a like on a comment, increment the likes_count
    IF EXISTS (
      SELECT 1 FROM user_interactions 
      WHERE id = NEW.post_id AND type = 'comment'
    ) THEN
      UPDATE user_interactions 
      SET likes_count = likes_count + 1 
      WHERE id = NEW.post_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.type = 'like' THEN
    -- If a like is removed from a comment, decrement the likes_count
    IF EXISTS (
      SELECT 1 FROM user_interactions 
      WHERE id = OLD.post_id AND type = 'comment'
    ) THEN
      UPDATE user_interactions 
      SET likes_count = likes_count - 1 
      WHERE id = OLD.post_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_comment_likes_count_trigger
AFTER INSERT OR DELETE ON user_interactions
FOR EACH ROW
EXECUTE FUNCTION update_comment_likes_count(); 