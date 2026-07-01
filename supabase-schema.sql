-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Shops table
CREATE TABLE IF NOT EXISTS shops (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  canteen TEXT NOT NULL CHECK (canteen IN ('一饭', '二饭', '三饭', 'D饭')),
  categories TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- RLS: anyone can read
CREATE POLICY "Public read access for shops"
  ON shops FOR SELECT USING (true);

CREATE POLICY "Public read access for categories"
  ON categories FOR SELECT USING (true);

-- RLS: only authenticated users can write
CREATE POLICY "Authenticated users can insert shops"
  ON shops FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update shops"
  ON shops FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete shops"
  ON shops FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert categories"
  ON categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update categories"
  ON categories FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete categories"
  ON categories FOR DELETE USING (auth.role() = 'authenticated');

-- Seed categories
INSERT INTO categories (name) VALUES
  ('饭类'),
  ('粉面/粿条'),
  ('麻辣烫'),
  ('汉堡/炸鸡')
ON CONFLICT (name) DO NOTHING;

-- Seed shops (26)
INSERT INTO shops (name, canteen, categories) VALUES
  -- 一饭
  ('一饭粿条', '一饭', ARRAY['粉面/粿条']),
  ('一饭渔粉', '一饭', ARRAY['粉面/粿条']),
  ('一饭南昌拌粉', '一饭', ARRAY['粉面/粿条']),
  ('一饭肠粉', '一饭', ARRAY['粉面/粿条']),
  ('一饭食堂餐', '一饭', ARRAY['饭类']),
  ('一饭烤肉饭', '一饭', ARRAY['饭类']),
  ('一饭烧腊', '一饭', ARRAY['饭类']),
  -- 二饭
  ('二饭陕西小吃', '二饭', ARRAY['粉面/粿条']),
  ('二饭QQ饭', '二饭', ARRAY['饭类']),
  ('二饭烧腊', '二饭', ARRAY['饭类']),
  ('二饭麻辣烫', '二饭', ARRAY['麻辣烫']),
  ('二饭云吞', '二饭', ARRAY['粉面/粿条']),
  ('二饭塔斯汀', '二饭', ARRAY['汉堡/炸鸡']),
  -- 三饭
  ('三饭肯德基', '三饭', ARRAY['汉堡/炸鸡']),
  ('三饭麻辣烫', '三饭', ARRAY['麻辣烫']),
  ('三饭陶罐饭', '三饭', ARRAY['饭类']),
  ('三饭粿条', '三饭', ARRAY['粉面/粿条']),
  ('三饭海南鸡饭', '三饭', ARRAY['饭类']),
  ('三饭食堂餐', '三饭', ARRAY['饭类']),
  -- D饭
  ('D饭牛饭', 'D饭', ARRAY['饭类']),
  ('D饭鸭血粉丝汤', 'D饭', ARRAY['粉面/粿条']),
  ('D饭酸菜鱼', 'D饭', ARRAY['饭类']),
  ('D饭牛肉粿条', 'D饭', ARRAY['粉面/粿条']),
  ('D饭砂锅粉', 'D饭', ARRAY['粉面/粿条']),
  ('D饭沙县小吃', 'D饭', ARRAY['饭类', '粉面/粿条']),
  ('D饭麻辣烫', 'D饭', ARRAY['麻辣烫'])
ON CONFLICT (name) DO NOTHING;
