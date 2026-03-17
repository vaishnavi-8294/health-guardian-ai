
-- Allow health authorities to delete disease reports
CREATE POLICY "Health authorities can delete reports"
ON public.disease_reports
FOR DELETE
USING (public.has_role(auth.uid(), 'health_authority'));

-- Allow health authorities to delete AI suggestions
CREATE POLICY "Health authorities can delete suggestions"
ON public.ai_suggestions
FOR DELETE
USING (public.has_role(auth.uid(), 'health_authority'));

-- Allow health authorities to delete alerts
CREATE POLICY "Health authorities can delete alerts"
ON public.alerts
FOR DELETE
USING (public.has_role(auth.uid(), 'health_authority'));

-- Allow health authorities to delete notifications
CREATE POLICY "Health authorities can delete notifications"
ON public.notifications
FOR DELETE
USING (public.has_role(auth.uid(), 'health_authority'));

-- Allow health authorities to delete chat messages
CREATE POLICY "Health authorities can delete chat messages"
ON public.chat_messages
FOR DELETE
USING (public.has_role(auth.uid(), 'health_authority'));
