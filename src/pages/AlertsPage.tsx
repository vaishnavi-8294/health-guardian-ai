import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

const AlertsPage = () => {
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('alerts').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setAlerts(data || []));
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="font-heading text-3xl font-bold text-foreground">Outbreak Alerts</h1>
        {alerts.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No alerts at this time.</CardContent></Card>
        ) : (
          <div className="space-y-4">
            {alerts.map(alert => (
              <Card key={alert.id} className={`border-l-4 ${
                alert.alert_level === 'emergency' ? 'border-l-emergency' :
                alert.alert_level === 'critical' ? 'border-l-critical' : 'border-l-warning'
              }`}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <AlertTriangle className={`h-6 w-6 ${
                      alert.alert_level === 'emergency' ? 'text-emergency' :
                      alert.alert_level === 'critical' ? 'text-critical' : 'text-warning'
                    }`} />
                    <div>
                      <p className="font-heading font-semibold text-foreground">{alert.disease}</p>
                      <p className="text-sm text-muted-foreground">{alert.location} — {alert.case_count} cases</p>
                      <p className="text-xs text-muted-foreground">{new Date(alert.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                      alert.alert_level === 'emergency' ? 'bg-emergency text-emergency-foreground' :
                      alert.alert_level === 'critical' ? 'bg-critical text-critical-foreground' : 'bg-warning text-warning-foreground'
                    }`}>
                      {alert.alert_level}
                    </span>
                    {!alert.is_active && <span className="text-xs text-muted-foreground">Resolved</span>}
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

export default AlertsPage;
