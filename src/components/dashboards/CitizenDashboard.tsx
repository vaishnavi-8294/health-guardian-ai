import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { MessageCircle, BookOpen, Bell, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const CitizenDashboard = () => {
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('alerts').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(5)
      .then(({ data }) => setAlerts(data || []));
  }, []);

  const features = [
    { icon: MessageCircle, title: 'AI Health Assistant', desc: 'Chat with our AI for health tips', to: '/chat', color: 'bg-primary/10 text-primary' },
    { icon: BookOpen, title: 'Awareness', desc: 'Learn about disease prevention', to: '/awareness', color: 'bg-secondary/10 text-secondary' },
    { icon: Bell, title: 'Symptom Checker', desc: 'Report your symptoms', to: '/chat', color: 'bg-warning/10 text-warning' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Welcome, Citizen</h1>
        <p className="text-muted-foreground">Stay informed about your health and local outbreaks.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {features.map((f, i) => (
          <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Link to={f.to}>
              <Card className="cursor-pointer transition-all hover:shadow-card hover:-translate-y-1">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${f.color}`}>
                    <f.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-foreground">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <Shield className="h-5 w-5 text-destructive" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map(alert => (
              <div key={alert.id} className={`rounded-lg border p-3 ${
                alert.alert_level === 'emergency' ? 'alert-emergency' :
                alert.alert_level === 'critical' ? 'alert-critical' : 'alert-warning'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{alert.disease}</span>
                  <span className="rounded-full bg-background/50 px-2 py-0.5 text-xs font-medium uppercase">{alert.alert_level}</span>
                </div>
                <p className="text-sm">{alert.location} — {alert.case_count} cases</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CitizenDashboard;
