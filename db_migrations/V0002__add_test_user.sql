INSERT INTO users (username, email, password_hash, avatar_url) 
VALUES ('Test User', 'test@timessenger.com', 'dummy_hash', 'https://api.dicebear.com/7.x/avataaars/svg?seed=testuser')
ON CONFLICT (email) DO NOTHING;