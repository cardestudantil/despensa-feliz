CREATE TABLE public.despensa (
  user_id uuid PRIMARY KEY,
  itens jsonb NOT NULL DEFAULT '[]'::jsonb,
  prioridades jsonb NOT NULL DEFAULT '[]'::jsonb,
  datas jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.despensa TO authenticated;
GRANT ALL ON public.despensa TO service_role;
ALTER TABLE public.despensa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dono le" ON public.despensa FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Dono cria" ON public.despensa FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono atualiza" ON public.despensa FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
ALTER TABLE public.despensa REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.despensa;