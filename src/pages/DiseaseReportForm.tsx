import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { FileText, Brain } from 'lucide-react';

const SYMPTOMS = [
  'Watery diarrhea', 'Vomiting', 'Dehydration', 'Fever', 'Abdominal pain',
  'Bloody stool', 'Nausea', 'Headache', 'Fatigue', 'Loss of appetite',
  'Jaundice', 'Dark urine', 'Muscle pain', 'Skin rash',
];

const DiseaseReportForm = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  const [form, setForm] = useState({
    patientName: '', age: '', gender: '', location: '',
    waterSource: '', sanitationCondition: '', symptoms: [] as string[],
  });

  const toggleSymptom = (symptom: string) => {
    setForm(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.patientName || !form.age || !form.gender || !form.location || form.symptoms.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setPrediction(null);

    try {
      // 1. Save report
      const { data: report, error: reportError } = await supabase.from('disease_reports').insert({
        patient_name: form.patientName,
        age: parseInt(form.age),
        gender: form.gender,
        symptoms: form.symptoms,
        location: form.location,
        water_source: form.waterSource || null,
        sanitation_condition: form.sanitationCondition || null,
        reported_by: user.id,
      }).select().single();

      if (reportError) throw reportError;

      // 2. Call AI analyzer
      const { data: aiResult, error: aiError } = await supabase.functions.invoke('analyze-disease', {
        body: {
          symptoms: form.symptoms,
          age: parseInt(form.age),
          gender: form.gender,
          location: form.location,
          waterSource: form.waterSource,
          sanitationCondition: form.sanitationCondition,
          reportId: report.id,
        },
      });

      if (aiError) {
        console.error('AI analysis error:', aiError);
        toast.warning('Report saved but AI analysis failed');
      } else {
        setPrediction(aiResult);
        toast.success('Report submitted and analyzed!');
      }

      // Reset form
      setForm({ patientName: '', age: '', gender: '', location: '', waterSource: '', sanitationCondition: '', symptoms: [] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Submit Disease Report</h1>
          <p className="text-muted-foreground">Enter patient data for AI-powered disease analysis.</p>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <FileText className="h-5 w-5 text-primary" /> Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Patient Name *</Label>
                  <Input value={form.patientName} onChange={e => setForm(p => ({ ...p, patientName: e.target.value }))} placeholder="Full name" />
                </div>
                <div className="space-y-2">
                  <Label>Age *</Label>
                  <Input type="number" value={form.age} onChange={e => setForm(p => ({ ...p, age: e.target.value }))} placeholder="Age" min="0" max="150" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Gender *</Label>
                  <Select value={form.gender} onValueChange={v => setForm(p => ({ ...p, gender: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Location *</Label>
                  <Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="Village/Town/City" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Water Source</Label>
                  <Select value={form.waterSource} onValueChange={v => setForm(p => ({ ...p, waterSource: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select water source" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tap">Tap Water</SelectItem>
                      <SelectItem value="well">Well Water</SelectItem>
                      <SelectItem value="borewell">Borewell</SelectItem>
                      <SelectItem value="river">River/Lake</SelectItem>
                      <SelectItem value="tanker">Tanker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sanitation Condition</Label>
                  <Select value={form.sanitationCondition} onValueChange={v => setForm(p => ({ ...p, sanitationCondition: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                      <SelectItem value="very_poor">Very Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Symptoms * (select all that apply)</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {SYMPTOMS.map(symptom => (
                    <div key={symptom} className="flex items-center gap-2">
                      <Checkbox checked={form.symptoms.includes(symptom)} onCheckedChange={() => toggleSymptom(symptom)} />
                      <span className="text-sm text-foreground">{symptom}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Analyzing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2"><Brain className="h-4 w-4" /> Submit & Analyze</span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {prediction && (
          <Card className={`border-2 shadow-card ${
            prediction.risk_level === 'high' ? 'border-destructive' :
            prediction.risk_level === 'medium' ? 'border-warning' : 'border-success'
          }`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading">
                <Brain className="h-5 w-5 text-primary" /> AI Prediction Result
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Predicted Disease</p>
                  <p className="text-lg font-bold text-foreground">{prediction.predictedDisease}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Confidence</p>
                  <p className="text-lg font-bold text-foreground">{prediction.confidence}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Risk Level</p>
                  <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
                    prediction.risk_level === 'high' ? 'risk-high' :
                    prediction.risk_level === 'medium' ? 'risk-medium' : 'risk-low'
                  }`}>
                    {prediction.risk_level?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Severity</p>
                  <p className="text-lg font-bold text-foreground">{prediction.severity}</p>
                </div>
              </div>
              {prediction.recommendation && (
                <div className="rounded-lg bg-accent p-4">
                  <p className="text-sm font-medium text-accent-foreground">Recommendation</p>
                  <p className="text-sm text-foreground">{prediction.recommendation}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default DiseaseReportForm;
