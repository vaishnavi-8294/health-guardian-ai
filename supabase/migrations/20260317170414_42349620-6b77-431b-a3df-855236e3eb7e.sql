CREATE POLICY "Citizens can view reports"
ON public.disease_reports
FOR SELECT
USING (has_role(auth.uid(), 'citizen'::app_role));