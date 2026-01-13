/*
  # Field Data Collection Database Schema

  1. New Tables
    - `field_records`
      - `id` (uuid, primary key)
      - `field` (text, field name)
      - `value` (text, field value)
      - `location` (text, location description)
      - `timestamp` (timestamptz, when recorded)
      - `user_id` (uuid, foreign key to auth.users)
    
    - `chatbot_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `message` (text, user message)
      - `response` (text, AI response)
      - `timestamp` (timestamptz, when sent)
    
    - `activity_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `action` (text, action type)
      - `details` (text, action details)
      - `timestamp` (timestamptz, when occurred)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for reading shared data where appropriate
*/

-- Create field_records table
CREATE TABLE IF NOT EXISTS field_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field text NOT NULL,
  value text NOT NULL,
  location text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create chatbot_logs table
CREATE TABLE IF NOT EXISTS chatbot_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  response text NOT NULL,
  timestamp timestamptz DEFAULT now()
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  details text NOT NULL,
  timestamp timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE field_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for field_records
CREATE POLICY "Users can manage their own field records"
  ON field_records
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for chatbot_logs
CREATE POLICY "Users can manage their own chatbot logs"
  ON chatbot_logs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for activity_logs
CREATE POLICY "Users can view their own activity logs"
  ON activity_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity logs"
  ON activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS field_records_user_id_idx ON field_records(user_id);
CREATE INDEX IF NOT EXISTS field_records_timestamp_idx ON field_records(timestamp);
CREATE INDEX IF NOT EXISTS field_records_field_idx ON field_records(field);

CREATE INDEX IF NOT EXISTS chatbot_logs_user_id_idx ON chatbot_logs(user_id);
CREATE INDEX IF NOT EXISTS chatbot_logs_timestamp_idx ON chatbot_logs(timestamp);

CREATE INDEX IF NOT EXISTS activity_logs_user_id_idx ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS activity_logs_timestamp_idx ON activity_logs(timestamp);
