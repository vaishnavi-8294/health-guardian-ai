import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { MessageCircle, BookOpen, Bell, Shield, BarChart3, Activity, MapPin, Users } from 'lucide-react';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

const CHART_COLORS = ['hsl(199, 89%, 38%)', 'hsl(168, 65%, 42%)', 'hsl(38, 92%, 50%)', 'hsl(0, 72%, 51%)', 'hsl(280, 60%, 50%)'];

const CitizenDashboard = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('alerts').select('*').eq('is_active', true).order('created_at', { ascending: false })
      .then(({ data }) => setAlerts(data || []));
    supabase.from('disease_reports').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setReports(data || []));
  }, []);

  const features = [
    { icon: MessageCircle, title: 'AI Health Assistant', desc: 'Chat with our AI for health tips', to: '/chat', color: 'bg-primary/10 text-primary' },
    { icon: BookOpen, title: 'Awareness', desc: 'Learn about disease prevention', to: '/awareness', color: 'bg-secondary/10 text-secondary' },
    { icon: Bell, title: 'Symptom Checker', desc: 'Report your symptoms', to: '/chat', color: 'bg-warning/10 text-warning' },
  ];

  // Stats
  const totalCases = reports.length;
  const totalAlerts = alerts.length;
  const uniqueDiseases = new Set(reports.map(r => r.suspected_disease).filter(Boolean)).size;
  const uniqueLocations = new Set(reports.map(r => r.location)).size;

  // Disease-wise report counts
  const diseaseData = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach(r => {
      const d = r.suspected_disease || 'Unknown';
      counts[d] = (counts[d] || 0) + 1;
    });
    return Object.entries(counts).map(([disease, cases]) => ({ disease, cases }));
  }, [reports]);

  // Location-wise report counts
  const locationData = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach(r => {
      counts[r.location] = (counts[r.location] || 0) + 1;
    });
    return Object.entries(counts).slice(0, 8).map(([location, cases]) => ({ location, cases }));
  }, [reports]);

  // Disease-wise alert bar chart
  const diseaseAlertData = alerts.reduce((acc: Record<string, number>, a) => {
    acc[a.disease] = (acc[a.disease] || 0) + a.case_count;
    return acc;
  }, {});
  const barData = Object.entries(diseaseAlertData).map(([disease, cases]) => ({ disease, cases }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Welcome, Citizen</h1>
        <p className="text-muted-foreground">Stay informed about your health and local outbreaks.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {features.map((f) => (
          <div key={f.title}>
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
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalCases}</p>
              <p className="text-xs text-muted-foreground">Total Cases</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <Shield className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalAlerts}</p>
              <p className="text-xs text-muted-foreground">Active Alerts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
              <BarChart3 className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{uniqueDiseases}</p>
              <p className="text-xs text-muted-foreground">Diseases Reported</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
              <MapPin className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{uniqueLocations}</p>
              <p className="text-xs text-muted-foreground">Affected Locations</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {diseaseData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading">
                <BarChart3 className="h-5 w-5 text-primary" />
                Reported Cases by Disease
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={diseaseData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="disease" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Bar dataKey="cases" radius={[4, 4, 0, 0]}>
                    {diseaseData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {locationData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading">
                <MapPin className="h-5 w-5 text-secondary" />
                Cases by Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={locationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="location" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Bar dataKey="cases" fill="hsl(168, 65%, 42%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Alert charts */}
      {barData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <Shield className="h-5 w-5 text-destructive" />
              Alert Cases by Disease
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="disease" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Bar dataKey="cases" radius={[4, 4, 0, 0]}>
                  {barData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

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
