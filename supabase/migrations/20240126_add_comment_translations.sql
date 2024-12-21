-- Insert English translations
INSERT INTO ui_translations (id, key, fr, en)
VALUES 
  (uuid_generate_v4(), 'comments.write_reply', 'Écrire une réponse...', 'Write a reply...'),
  (uuid_generate_v4(), 'comments.reply', 'Répondre', 'Reply'),
  (uuid_generate_v4(), 'comments.cancel', 'Annuler', 'Cancel'),
  (uuid_generate_v4(), 'comments.like.title', 'Aimer ce commentaire', 'Like this comment');

-- Update existing translations if needed
UPDATE ui_translations 
SET 
  fr = 'Paramètres enregistrés',
  en = 'Settings saved'
WHERE key = 'success.settings_saved'; 