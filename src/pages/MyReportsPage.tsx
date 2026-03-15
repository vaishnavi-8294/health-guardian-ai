import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

const MyReportsPage = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('disease_reports').select('*, ai_suggestions(*)').eq('reported_by', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setReports(data || []));
  }, [user]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="font-heading text-3xl font-bold text-foreground">My Reports</h1>
        {reports.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No reports yet.</CardContent></Card>
        ) : (
          <div className="space-y-4">
            {reports.map(r => (
              <Card key={r.id} className="shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-heading font-semibold text-foreground">{r.patient_name}</p>
                      <p className="text-sm text-muted-foreground">Age: {r.age} | {r.gender} | {r.location}</p>
                      <p className="text-sm text-muted-foreground">Symptoms: {r.symptoms?.join(', ')}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                    {r.ai_suggestions?.[0] && (
                      <div className="text-right">
                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                          r.ai_suggestions[0].risk_level === 'high' ? 'risk-high' :
                          r.ai_suggestions[0].risk_level === 'medium' ? 'risk-medium' : 'risk-low'
                        }`}>
                          {r.ai_suggestions[0].predicted_disease}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {r.ai_suggestions[0].confidence_score}% confidence
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default MyReportsPage;
