import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain } from 'lucide-react';

const PredictionsPage = () => {
  const [predictions, setPredictions] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('ai_suggestions').select('*, disease_reports(patient_name, location, symptoms)')
      .order('created_at', { ascending: false })
      .then(({ data }) => setPredictions(data || []));
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="font-heading text-3xl font-bold text-foreground">AI Predictions</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {predictions.map(p => (
            <Card key={p.id} className={`border-l-4 shadow-card ${
              p.risk_level === 'high' ? 'border-l-destructive' :
              p.risk_level === 'medium' ? 'border-l-warning' : 'border-l-success'
            }`}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    <span className="font-heading font-bold text-foreground">{p.predicted_disease}</span>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    p.risk_level === 'high' ? 'risk-high' :
                    p.risk_level === 'medium' ? 'risk-medium' : 'risk-low'
                  }`}>
                    {p.risk_level}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Confidence: <span className="font-semibold text-foreground">{p.confidence_score}%</span></p>
                  {p.disease_reports && (
                    <>
                      <p>Patient: {p.disease_reports.patient_name}</p>
                      <p>Location: {p.disease_reports.location}</p>
                    </>
                  )}
                </div>
                {p.recommendation && (
                  <div className="rounded bg-accent p-2 text-xs text-accent-foreground">{p.recommendation}</div>
                )}
              </CardContent>
            </Card>
          ))}
          {predictions.length === 0 && (
            <Card className="col-span-full"><CardContent className="p-8 text-center text-muted-foreground">No predictions yet.</CardContent></Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default PredictionsPage;
