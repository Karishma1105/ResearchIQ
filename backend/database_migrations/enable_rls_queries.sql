-- Enable Row Level Security and add policy for queries table
ALTER TABLE queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own queries"
  ON queries
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
