import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import CitizenDashboard from '@/components/dashboards/CitizenDashboard';
import AshaWorkerDashboard from '@/components/dashboards/AshaWorkerDashboard';
import AdminDashboard from '@/components/dashboards/AdminDashboard';

const Index = () => {
  const { role } = useAuth();

  return (
    <AppLayout>
      {role === 'citizen' && <CitizenDashboard />}
      {role === 'asha_worker' && <AshaWorkerDashboard />}
      {role === 'health_authority' && <AdminDashboard />}
    </AppLayout>
  );
};

export default Index;
