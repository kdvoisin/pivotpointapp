CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

CREATE TABLE public.onet_releases (
  version text PRIMARY KEY,
  source_url text NOT NULL,
  license text NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now(),
  record_counts jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE TABLE public.onet_occupations (
  code text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  embedding extensions.vector(768)
);
CREATE TABLE public.onet_titles (
  id bigserial PRIMARY KEY,
  code text NOT NULL REFERENCES public.onet_occupations(code),
  title text NOT NULL,
  kind text NOT NULL
);
CREATE INDEX onet_titles_code_idx ON public.onet_titles(code);
CREATE TABLE public.onet_tasks (
  task_id integer PRIMARY KEY,
  code text NOT NULL REFERENCES public.onet_occupations(code),
  task text NOT NULL,
  task_type text
);
CREATE INDEX onet_tasks_code_idx ON public.onet_tasks(code);
CREATE TABLE public.onet_elements (
  code text NOT NULL REFERENCES public.onet_occupations(code),
  element_id text NOT NULL,
  element_name text NOT NULL,
  kind text NOT NULL,
  importance numeric NOT NULL,
  PRIMARY KEY (code, element_id)
);

GRANT SELECT ON public.onet_releases, public.onet_occupations, public.onet_titles, public.onet_tasks, public.onet_elements TO anon, authenticated;
GRANT ALL ON public.onet_releases, public.onet_occupations, public.onet_titles, public.onet_tasks, public.onet_elements TO service_role;
GRANT USAGE ON SEQUENCE public.onet_titles_id_seq TO service_role;

ALTER TABLE public.onet_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onet_occupations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onet_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onet_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onet_elements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public catalog read" ON public.onet_releases FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public catalog read" ON public.onet_occupations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public catalog read" ON public.onet_titles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public catalog read" ON public.onet_tasks FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public catalog read" ON public.onet_elements FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.match_occupations(query_embedding extensions.vector(768), match_count integer, match_offset integer DEFAULT 0)
RETURNS TABLE (code text, title text, description text, similarity double precision)
LANGUAGE sql STABLE SET search_path = public, extensions AS $$
  SELECT o.code, o.title, o.description, 1 - (o.embedding <=> query_embedding) AS similarity
  FROM public.onet_occupations o
  WHERE o.embedding IS NOT NULL
  ORDER BY o.embedding <=> query_embedding
  LIMIT least(match_count, 50) OFFSET greatest(match_offset, 0);
$$;
GRANT EXECUTE ON FUNCTION public.match_occupations(extensions.vector, integer, integer) TO anon, authenticated, service_role;