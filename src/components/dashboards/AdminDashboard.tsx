import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, AlertTriangle, Users, FileText, TrendingUp, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const CHART_COLORS = ['hsl(199, 89%, 38%)', 'hsl(168, 65%, 42%)', 'hsl(38, 92%, 50%)', 'hsl(0, 72%, 51%)', 'hsl(280, 60%, 50%)'];

const AdminDashboard = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('disease_reports').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setReports(data || []));
    supabase.from('alerts').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setAlerts(data || []));
    supabase.from('ai_suggestions').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setPredictions(data || []));
  }, []);

  const totalCases = reports.length;
  const activeAlerts = alerts.filter(a => a.is_active).length;
  const highRisk = predictions.filter(p => p.risk_level === 'high').length;

  // Disease distribution for pie chart
  const diseaseDistribution = reports.reduce((acc: Record<string, number>, r) => {
    const disease = r.suspected_disease || 'Unknown';
    acc[disease] = (acc[disease] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(diseaseDistribution).map(([name, value]) => ({ name, value }));

  // Location bar chart
  const locationData = reports.reduce((acc: Record<string, number>, r) => {
    acc[r.location] = (acc[r.location] || 0) + 1;
    return acc;
  }, {});
  const barData = Object.entries(locationData).slice(0, 8).map(([location, cases]) => ({ location, cases }));

  // Daily trend line chart
  const dailyData = reports.reduce((acc: Record<string, number>, r) => {
    const day = new Date(r.created_at).toLocaleDateString();
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});
  const lineData = Object.entries(dailyData).slice(-14).map(([date, cases]) => ({ date, cases }));

  const stats = [
    { icon: FileText, label: 'Total Reports', value: totalCases, color: 'bg-primary/10 text-primary' },
    { icon: AlertTriangle, label: 'Active Alerts', value: activeAlerts, color: 'bg-warning/10 text-warning' },
    { icon: TrendingUp, label: 'High Risk', value: highRisk, color: 'bg-destructive/10 text-destructive' },
    { icon: Activity, label: 'AI Predictions', value: predictions.length, color: 'bg-secondary/10 text-secondary' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Health Authority Dashboard</h1>
        <p className="text-muted-foreground">National disease surveillance overview.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${s.color}`}>
                  <s.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="font-heading">Disease Trend (14 Days)</CardTitle></CardHeader>
          <CardContent>
            {lineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Line type="monotone" dataKey="cases" stroke="hsl(199, 89%, 38%)" strokeWidth={2} dot={{ fill: 'hsl(199, 89%, 38%)' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground py-8 text-center">No data yet</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-heading">Disease Distribution</CardTitle></CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground py-8 text-center">No data yet</p>}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="font-heading">Cases by Location</CardTitle></CardHeader>
          <CardContent>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="location" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Bar dataKey="cases" fill="hsl(199, 89%, 38%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground py-8 text-center">No data yet</p>}
          </CardContent>
        </Card>
      </div>

      {alerts.filter(a => a.is_active).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <Shield className="h-5 w-5 text-destructive" /> Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.filter(a => a.is_active).map(alert => (
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

export default AdminDashboard;
