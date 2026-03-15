import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AllReportsPage = () => {
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('disease_reports').select('*, ai_suggestions(*)').order('created_at', { ascending: false })
      .then(({ data }) => setReports(data || []));
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="font-heading text-3xl font-bold text-foreground">All Disease Reports</h1>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-3">Patient</th>
                <th className="p-3">Age</th>
                <th className="p-3">Location</th>
                <th className="p-3">Symptoms</th>
                <th className="p-3">AI Prediction</th>
                <th className="p-3">Risk</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.id} className="border-b border-border">
                  <td className="p-3 font-medium text-foreground">{r.patient_name}</td>
                  <td className="p-3 text-muted-foreground">{r.age}</td>
                  <td className="p-3 text-muted-foreground">{r.location}</td>
                  <td className="p-3 text-muted-foreground">{r.symptoms?.slice(0, 3).join(', ')}</td>
                  <td className="p-3 font-medium text-foreground">{r.ai_suggestions?.[0]?.predicted_disease || '—'}</td>
                  <td className="p-3">
                    {r.ai_suggestions?.[0] && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.ai_suggestions[0].risk_level === 'high' ? 'risk-high' :
                        r.ai_suggestions[0].risk_level === 'medium' ? 'risk-medium' : 'risk-low'
                      }`}>
                        {r.ai_suggestions[0].risk_level}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
};

export default AllReportsPage;
