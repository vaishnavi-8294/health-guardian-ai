import { useEffect, useState, useMemo } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, ArrowLeft, Activity, AlertTriangle, BarChart3 } from 'lucide-react';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const INDIA_TOPO_URL = '/india-topo.json';

const CHART_COLORS = [
  'hsl(199, 89%, 38%)', 'hsl(168, 65%, 42%)', 'hsl(38, 92%, 50%)',
  'hsl(0, 72%, 51%)', 'hsl(280, 60%, 50%)', 'hsl(210, 70%, 50%)',
  'hsl(150, 60%, 40%)', 'hsl(30, 80%, 55%)',
];

const getHeatColor = (count: number, max: number) => {
  if (max === 0) return 'hsl(var(--muted))';
  const ratio = count / max;
  if (ratio > 0.7) return 'hsl(0, 72%, 51%)';
  if (ratio > 0.4) return 'hsl(38, 92%, 50%)';
  if (ratio > 0.1) return 'hsl(168, 65%, 42%)';
  if (count > 0) return 'hsl(199, 89%, 38%)';
  return 'hsl(var(--muted))';
};

interface Report {
  id: string;
  location: string;
  suspected_disease: string | null;
  symptoms: string[];
  created_at: string;
  age: number;
  gender: string;
}

interface Alert {
  id: string;
  disease: string;
  location: string;
  case_count: number;
  alert_level: string;
  is_active: boolean;
}

const DiseaseMapPage = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    supabase.from('disease_reports').select('*').then(({ data }) => setReports(data || []));
    supabase.from('alerts').select('*').eq('is_active', true).then(({ data }) => setAlerts(data || []));
  }, []);

  // Aggregate reports by location (match state names)
  const stateCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach(r => {
      const loc = r.location.toLowerCase().trim();
      counts[loc] = (counts[loc] || 0) + 1;
    });
    return counts;
  }, [reports]);

  const maxCount = useMemo(() => Math.max(1, ...Object.values(stateCounts)), [stateCounts]);

  const getCountForGeo = (geoName: string) => {
    const name = geoName.toLowerCase().trim();
    let total = 0;
    Object.entries(stateCounts).forEach(([loc, count]) => {
      if (loc.includes(name) || name.includes(loc)) {
        total += count;
      }
    });
    return total;
  };

  // Filter reports for selected state
  const filteredReports = useMemo(() => {
    if (!selectedState) return reports;
    const stateLower = selectedState.toLowerCase();
    return reports.filter(r => {
      const loc = r.location.toLowerCase();
      return loc.includes(stateLower) || stateLower.includes(loc);
    });
  }, [reports, selectedState]);

  const filteredAlerts = useMemo(() => {
    if (!selectedState) return alerts;
    const stateLower = selectedState.toLowerCase();
    return alerts.filter(a => {
      const loc = a.location.toLowerCase();
      return loc.includes(stateLower) || stateLower.includes(loc);
    });
  }, [alerts, selectedState]);

  // Disease distribution for the selected region
  const diseaseData = useMemo(() => {
    const acc: Record<string, number> = {};
    filteredReports.forEach(r => {
      const d = r.suspected_disease || 'Unknown';
      acc[d] = (acc[d] || 0) + 1;
    });
    return Object.entries(acc).map(([name, value]) => ({ name, value }));
  }, [filteredReports]);

  // Location breakdown within the state
  const locationBreakdown = useMemo(() => {
    const acc: Record<string, number> = {};
    filteredReports.forEach(r => {
      acc[r.location] = (acc[r.location] || 0) + 1;
    });
    return Object.entries(acc).slice(0, 10).map(([location, cases]) => ({ location, cases }));
  }, [filteredReports]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-2">
              <MapPin className="h-7 w-7 text-primary" />
              Disease Map — India
            </h1>
            <p className="text-muted-foreground">
              {selectedState
                ? `Viewing disease data for ${selectedState}`
                : 'Click on a state to see district-level disease data'}
            </p>
          </div>
          {selectedState && (
            <Button variant="outline" onClick={() => setSelectedState(null)} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to India
            </Button>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Map */}
          <Card className="lg:col-span-2 overflow-hidden">
            <CardContent className="p-0 relative">
              {hoveredState && (
                <div
                  className="pointer-events-none absolute z-10 rounded-lg border bg-popover px-3 py-2 text-sm shadow-md"
                  style={{ left: tooltipPos.x, top: tooltipPos.y, transform: 'translate(-50%, -120%)' }}
                >
                  <p className="font-semibold text-foreground">{hoveredState}</p>
                  <p className="text-muted-foreground">{getCountForGeo(hoveredState)} cases reported</p>
                </div>
              )}
              <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                  scale: 1000,
                  center: [82, 22],
                }}
                style={{ width: '100%', height: '500px' }}
              >
                <ZoomableGroup
                  center={selectedState ? [82, 22] : [82, 22]}
                  zoom={selectedState ? 2 : 1}
                >
                  <Geographies geography={INDIA_TOPO_URL}>
                    {({ geographies }) =>
                      geographies.map((geo) => {
                        const stateName = geo.properties.st_nm || geo.properties.NAME_1 || geo.properties.name || geo.properties.ST_NM || '';
                        const count = getCountForGeo(stateName);
                        const isSelected = selectedState?.toLowerCase() === stateName.toLowerCase();
                        const isHovered = hoveredState === stateName;

                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            onClick={() => setSelectedState(stateName)}
                            onMouseEnter={(e) => {
                              setHoveredState(stateName);
                              const rect = (e.target as SVGElement).closest('svg')?.getBoundingClientRect();
                              if (rect) {
                                setTooltipPos({
                                  x: e.clientX - rect.left,
                                  y: e.clientY - rect.top,
                                });
                              }
                            }}
                            onMouseMove={(e) => {
                              const rect = (e.target as SVGElement).closest('svg')?.getBoundingClientRect();
                              if (rect) {
                                setTooltipPos({
                                  x: e.clientX - rect.left,
                                  y: e.clientY - rect.top,
                                });
                              }
                            }}
                            onMouseLeave={() => setHoveredState(null)}
                            style={{
                              default: {
                                fill: isSelected ? 'hsl(199, 89%, 30%)' : getHeatColor(count, maxCount),
                                stroke: 'hsl(var(--border))',
                                strokeWidth: 0.5,
                                outline: 'none',
                                cursor: 'pointer',
                                transition: 'fill 0.2s',
                              },
                              hover: {
                                fill: 'hsl(199, 89%, 48%)',
                                stroke: 'hsl(var(--foreground))',
                                strokeWidth: 1,
                                outline: 'none',
                                cursor: 'pointer',
                              },
                              pressed: {
                                fill: 'hsl(199, 89%, 30%)',
                                outline: 'none',
                              },
                            }}
                          />
                        );
                      })
                    }
                  </Geographies>
                </ZoomableGroup>
              </ComposableMap>

              {/* Legend */}
              <div className="absolute bottom-4 left-4 rounded-lg border bg-card/90 p-3 backdrop-blur-sm">
                <p className="text-xs font-semibold text-foreground mb-2">Case Density</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="h-3 w-3 rounded" style={{ background: 'hsl(var(--muted))' }} /> None
                  <div className="h-3 w-3 rounded" style={{ background: 'hsl(199, 89%, 38%)' }} /> Low
                  <div className="h-3 w-3 rounded" style={{ background: 'hsl(168, 65%, 42%)' }} /> Medium
                  <div className="h-3 w-3 rounded" style={{ background: 'hsl(38, 92%, 50%)' }} /> High
                  <div className="h-3 w-3 rounded" style={{ background: 'hsl(0, 72%, 51%)' }} /> Critical
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Side panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  {selectedState || 'All India'} Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-primary/10 p-3 text-center">
                    <p className="text-2xl font-bold text-primary">{filteredReports.length}</p>
                    <p className="text-xs text-muted-foreground">Total Cases</p>
                  </div>
                  <div className="rounded-lg bg-destructive/10 p-3 text-center">
                    <p className="text-2xl font-bold text-destructive">{filteredAlerts.length}</p>
                    <p className="text-xs text-muted-foreground">Active Alerts</p>
                  </div>
                  <div className="rounded-lg bg-warning/10 p-3 text-center">
                    <p className="text-2xl font-bold text-warning">{diseaseData.length}</p>
                    <p className="text-xs text-muted-foreground">Diseases</p>
                  </div>
                  <div className="rounded-lg bg-secondary/10 p-3 text-center">
                    <p className="text-2xl font-bold text-secondary">{locationBreakdown.length}</p>
                    <p className="text-xs text-muted-foreground">Locations</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active alerts for the region */}
            {filteredAlerts.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="font-heading text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Active Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {filteredAlerts.slice(0, 5).map(alert => (
                    <div key={alert.id} className={`rounded-lg border p-2.5 text-sm ${
                      alert.alert_level === 'emergency' ? 'alert-emergency' :
                      alert.alert_level === 'critical' ? 'alert-critical' : 'alert-warning'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{alert.disease}</span>
                        <Badge variant="outline" className="text-xs uppercase">{alert.alert_level}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{alert.location} — {alert.case_count} cases</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Charts Section */}
          {(diseaseData.length > 0 || locationBreakdown.length > 0) && (
            <div
              className="grid gap-6 lg:grid-cols-2"
            >
              {diseaseData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Disease Distribution {selectedState ? `in ${selectedState}` : ''}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={diseaseData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {diseaseData.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {locationBreakdown.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-secondary" />
                      Cases by Location {selectedState ? `in ${selectedState}` : ''}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={locationBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="location" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <RechartsTooltip />
                        <Bar dataKey="cases" radius={[4, 4, 0, 0]}>
                          {locationBreakdown.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
      </div>
    </AppLayout>
  );
};

export default DiseaseMapPage;
