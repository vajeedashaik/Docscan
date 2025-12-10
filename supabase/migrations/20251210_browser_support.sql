-- Create browser_support table to store browser compatibility data
CREATE TABLE public.browser_support (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  browser_name TEXT NOT NULL,
  browser_version TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'all', -- 'windows', 'mac', 'linux', 'ios', 'android', 'all'
  release_date DATE,
  eol_date DATE,
  market_share NUMERIC(5, 2), -- percentage
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(browser_name, browser_version, platform)
);

-- Create web_features table to store HTML/CSS/JS features
CREATE TABLE public.web_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_name TEXT NOT NULL UNIQUE,
  feature_category TEXT NOT NULL, -- 'html', 'css', 'javascript', 'api', 'svg'
  description TEXT,
  specification_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create feature_support table to store browser support for features
CREATE TABLE public.feature_support (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  browser_id UUID NOT NULL REFERENCES public.browser_support(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES public.web_features(id) ON DELETE CASCADE,
  support_status TEXT NOT NULL DEFAULT 'not_supported', -- 'supported', 'partial', 'not_supported', 'deprecated'
  prefix_required TEXT, -- e.g., 'webkit', 'moz', 'ms', or null for unprefixed
  min_version TEXT, -- minimum version that supports this feature
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(browser_id, feature_id)
);

-- Create browser_stats table for analytics
CREATE TABLE public.browser_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  browser_name TEXT NOT NULL,
  total_visitors INTEGER DEFAULT 0,
  supported_features_count INTEGER DEFAULT 0,
  average_support_percentage NUMERIC(5, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date, browser_name)
);

-- Enable RLS on all tables
ALTER TABLE public.browser_support ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_support ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.browser_stats ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access
-- Browser support - public read only
CREATE POLICY "Allow public read access to browser_support" 
  ON public.browser_support 
  FOR SELECT 
  USING (true);

-- Web features - public read only
CREATE POLICY "Allow public read access to web_features" 
  ON public.web_features 
  FOR SELECT 
  USING (true);

-- Feature support - public read only
CREATE POLICY "Allow public read access to feature_support" 
  ON public.feature_support 
  FOR SELECT 
  USING (true);

-- Browser stats - public read only
CREATE POLICY "Allow public read access to browser_stats" 
  ON public.browser_stats 
  FOR SELECT 
  USING (true);

-- Create indexes for performance
CREATE INDEX idx_browser_support_browser_name ON public.browser_support(browser_name);
CREATE INDEX idx_browser_support_platform ON public.browser_support(platform);
CREATE INDEX idx_web_features_category ON public.web_features(feature_category);
CREATE INDEX idx_feature_support_browser_id ON public.feature_support(browser_id);
CREATE INDEX idx_feature_support_feature_id ON public.feature_support(feature_id);
CREATE INDEX idx_browser_stats_date ON public.browser_stats(date);
CREATE INDEX idx_browser_stats_browser_name ON public.browser_stats(browser_name);
