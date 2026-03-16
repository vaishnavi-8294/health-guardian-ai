import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { FilePlus, FileText, Activity, AlertTriangle, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CHART_COLORS = ['hsl(199, 89%, 38%)', 'hsl(168, 65%, 42%)', 'hsl(38, 92%, 50%)', 'hsl(0, 72%, 51%)', 'hsl(280, 60%, 50%)'];

const AshaWorkerDashboard = () => {
  const { user } = useAuth();
  const [reportCount, setReportCount] = useState(0);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('disease_reports').select('*', { count: 'exact', head: true }).eq('reported_by', user.id)
      .then(({ count }) => setReportCount(count || 0));
    supabase.from('disease_reports').select('*, ai_suggestions(*)').eq('reported_by', user.id)
      .order('created_at', { ascending: false }).limit(5)
      .then(({ data }) => setRecentReports(data || []));
    supabase.from('alerts').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(3)
      .then(({ data }) => setAlerts(data || []));
  }, [user]);

  // Disease distribution from worker's own reports
  const diseaseData = recentReports.reduce((acc: Record<string, number>, r) => {
    const disease = r.suspected_disease || r.ai_suggestions?.[0]?.predicted_disease || 'Unknown';
    acc[disease] = (acc[disease] || 0) + 1;
    return acc;
  }, {});
  const diseaseBarData = Object.entries(diseaseData).map(([disease, count]) => ({ disease, count }));

  // Risk level distribution from AI suggestions
  const riskData = recentReports.reduce((acc: Record<string, number>, r) => {
    const risk = r.ai_suggestions?.[0]?.risk_level;
    if (risk) acc[risk] = (acc[risk] || 0) + 1;
    return acc;
  }, {});
  const riskColors: Record<string, string> = { low: 'hsl(152, 69%, 40%)', medium: 'hsl(38, 92%, 50%)', high: 'hsl(0, 84%, 60%)' };
  const riskBarData = Object.entries(riskData).map(([level, count]) => ({ level: level.charAt(0).toUpperCase() + level.slice(1), count, fill: riskColors[level] || CHART_COLORS[0] }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">ASHA Worker Dashboard</h1>
          <p className="text-muted-foreground">Submit disease reports and track patient data.</p>
        </div>
        <Link to="/report">
          <Button className="gradient-primary text-primary-foreground">
            <FilePlus className="mr-2 h-4 w-4" /> New Report
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{reportCount}</p>
                <p className="text-sm text-muted-foreground">Total Reports</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{recentReports.filter(r => r.ai_suggestions?.length > 0).length}</p>
                <p className="text-sm text-muted-foreground">AI Analyzed</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10 text-warning">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{alerts.length}</p>
                <p className="text-sm text-muted-foreground">Active Alerts</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {(diseaseBarData.length > 0 || riskBarData.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {diseaseBarData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Your Reports by Disease
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={diseaseBarData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="disease" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                    <YAxis stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {diseaseBarData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {riskBarData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading">
                  <BarChart3 className="h-5 w-5 text-destructive" />
                  AI Risk Level Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={riskBarData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="level" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                    <YAxis stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {riskBarData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {recentReports.length === 0 ? (
            <p className="text-muted-foreground">No reports yet. Submit your first report.</p>
          ) : (
            <div className="space-y-3">
              {recentReports.map(r => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="font-medium text-foreground">{r.patient_name}</p>
                    <p className="text-sm text-muted-foreground">{r.symptoms?.join(', ')} — {r.location}</p>
                  </div>
                  {r.ai_suggestions?.[0] && (
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                      r.ai_suggestions[0].risk_level === 'high' ? 'risk-high' :
                      r.ai_suggestions[0].risk_level === 'medium' ? 'risk-medium' : 'risk-low'
                    }`}>
                      {r.ai_suggestions[0].predicted_disease} ({r.ai_suggestions[0].confidence_score}%)
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AshaWorkerDashboard;
