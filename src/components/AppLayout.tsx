import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Droplets, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import NotificationBell from '@/components/NotificationBell';

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = () => {
    const items: { label: string; to: string }[] = [];
    if (role === 'citizen') {
      items.push({ label: 'Dashboard', to: '/' });
      items.push({ label: 'Disease Map', to: '/disease-map' });
      items.push({ label: 'Awareness', to: '/awareness' });
      items.push({ label: 'Chat', to: '/chat' });
    } else if (role === 'asha_worker') {
      items.push({ label: 'Dashboard', to: '/' });
      items.push({ label: 'Disease Map', to: '/disease-map' });
      items.push({ label: 'New Report', to: '/report' });
      items.push({ label: 'My Reports', to: '/my-reports' });
    } else if (role === 'health_authority') {
      items.push({ label: 'Dashboard', to: '/' });
      items.push({ label: 'Disease Map', to: '/disease-map' });
      items.push({ label: 'Reports', to: '/all-reports' });
      items.push({ label: 'Alerts', to: '/alerts' });
      items.push({ label: 'AI Predictions', to: '/predictions' });
    }
    return items;
  };

  const roleLabel = role === 'citizen' ? 'Citizen' : role === 'asha_worker' ? 'ASHA Worker' : 'Health Authority';

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
              <Droplets className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-heading text-xl font-bold text-foreground">HydroTrim</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems().map(item => (
              <Link key={item.to} to={item.to}>
                <Button variant="ghost" size="sm">{item.label}</Button>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground md:inline-block">
              {roleLabel}
            </span>
            <NotificationBell />
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-border bg-card p-4 md:hidden">
            <div className="flex flex-col gap-2">
              {navItems().map(item => (
                <Link key={item.to} to={item.to} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">{item.label}</Button>
                </Link>
              ))}
              <span className="mt-2 rounded-full bg-accent px-3 py-1 text-center text-xs font-medium text-accent-foreground">
                {roleLabel}
              </span>
            </div>
          </div>
        )}
      </header>

      <main className="container py-6">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
