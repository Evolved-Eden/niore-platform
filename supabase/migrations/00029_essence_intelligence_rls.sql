-- ============================================================
-- Migration 00029: Enable RLS + add policies for essence_intelligence
--
-- essence_intelligence was created without RLS policies,
-- so all authenticated operations are blocked by default.
-- ============================================================

-- Enable RLS on the table
ALTER TABLE public.essence_intelligence ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own essence intelligence rows
DROP POLICY IF EXISTS "Users can read their own essence intelligence" ON public.essence_intelligence;
CREATE POLICY "Users can read their own essence intelligence"
ON public.essence_intelligence
FOR SELECT
TO authenticated
USING (client_id = auth.uid());

-- Allow users to insert their own essence intelligence rows
DROP POLICY IF EXISTS "Users can insert their own essence intelligence" ON public.essence_intelligence;
CREATE POLICY "Users can insert their own essence intelligence"
ON public.essence_intelligence
FOR INSERT
TO authenticated
WITH CHECK (client_id = auth.uid());

-- Allow users to update their own essence intelligence rows
DROP POLICY IF EXISTS "Users can update their own essence intelligence" ON public.essence_intelligence;
CREATE POLICY "Users can update their own essence intelligence"
ON public.essence_intelligence
FOR UPDATE
TO authenticated
USING (client_id = auth.uid())
WITH CHECK (client_id = auth.uid());

-- Allow users to delete their own essence intelligence rows
DROP POLICY IF EXISTS "Users can delete their own essence intelligence" ON public.essence_intelligence;
CREATE POLICY "Users can delete their own essence intelligence"
ON public.essence_intelligence
FOR DELETE
TO authenticated
USING (client_id = auth.uid());

-- Allow service_role (admin client) full access
DROP POLICY IF EXISTS "Service role has full access to essence intelligence" ON public.essence_intelligence;
CREATE POLICY "Service role has full access to essence intelligence"
ON public.essence_intelligence
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================
-- Also fix client_twins RLS — missing policies block blueprint reads
-- ============================================================

ALTER TABLE public.client_twins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own twin" ON public.client_twins;
CREATE POLICY "Users can read own twin"
ON public.client_twins
FOR SELECT
TO authenticated
USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own twin" ON public.client_twins;
CREATE POLICY "Users can insert own twin"
ON public.client_twins
FOR INSERT
TO authenticated
WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own twin" ON public.client_twins;
CREATE POLICY "Users can update own twin"
ON public.client_twins
FOR UPDATE
TO authenticated
USING (client_id = auth.uid())
WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "Service role has full access to client_twins" ON public.client_twins;
CREATE POLICY "Service role has full access to client_twins"
ON public.client_twins
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);