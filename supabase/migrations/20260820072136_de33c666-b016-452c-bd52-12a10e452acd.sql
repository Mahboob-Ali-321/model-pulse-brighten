CREATE TABLE public.models (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_name text NOT NULL,
  provider text,
  input_price_per_1m_tokens text,
  output_price_per_1m_tokens text,
  context_window text,
  max_output text,
  speed text,
  quality text,
  value text,
  source_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT models_model_name_key UNIQUE (model_name)
);

GRANT SELECT ON public.models TO anon;
GRANT SELECT ON public.models TO authenticated;
GRANT ALL ON public.models TO service_role;

ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Models are publicly readable" ON public.models FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.app_metadata (
  key text NOT NULL PRIMARY KEY,
  value text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.app_metadata TO anon;
GRANT SELECT ON public.app_metadata TO authenticated;
GRANT ALL ON public.app_metadata TO service_role;

ALTER TABLE public.app_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "App metadata is publicly readable" ON public.app_metadata FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_models_updated_at BEFORE UPDATE ON public.models
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_app_metadata_updated_at BEFORE UPDATE ON public.app_metadata
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();