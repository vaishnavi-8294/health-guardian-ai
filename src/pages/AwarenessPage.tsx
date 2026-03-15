import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Droplets, Shield, Heart } from 'lucide-react';

const STATIC_CONTENT = [
  {
    title: 'Safe Drinking Water',
    category: 'Water Safety',
    icon: Droplets,
    content: 'Always boil water before drinking or use water purification tablets. Avoid drinking from open sources like rivers or ponds without treatment. Store water in clean, covered containers.',
  },
  {
    title: 'Hand Hygiene',
    category: 'Hygiene',
    icon: Heart,
    content: 'Wash hands with soap for at least 20 seconds before eating, after using the toilet, and after handling waste. Use hand sanitizer when soap is unavailable.',
  },
  {
    title: 'Cholera Prevention',
    category: 'Disease Prevention',
    icon: Shield,
    content: 'Cholera spreads through contaminated water and food. Symptoms include watery diarrhea and vomiting. Prevent by drinking clean water, proper sanitation, and ORS for treatment.',
  },
  {
    title: 'Typhoid Awareness',
    category: 'Disease Prevention',
    icon: Shield,
    content: 'Typhoid fever is caused by Salmonella typhi. Symptoms include high fever, headache, and stomach pain. Get vaccinated and maintain food hygiene to prevent it.',
  },
];

const AwarenessPage = () => {
  const [dbContent, setDbContent] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('awareness_content').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setDbContent(data || []));
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Health Awareness</h1>
          <p className="text-muted-foreground">Learn about disease prevention and healthy living.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {STATIC_CONTENT.map((item, i) => (
            <Card key={i} className="transition-all hover:shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading text-lg">
                  <item.icon className="h-5 w-5 text-primary" />
                  {item.title}
                </CardTitle>
                <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground w-fit">
                  {item.category}
                </span>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.content}</p>
              </CardContent>
            </Card>
          ))}

          {dbContent.map(item => (
            <Card key={item.id} className="transition-all hover:shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading text-lg">
                  <BookOpen className="h-5 w-5 text-primary" />
                  {item.title}
                </CardTitle>
                <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground w-fit">
                  {item.category}
                </span>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default AwarenessPage;
