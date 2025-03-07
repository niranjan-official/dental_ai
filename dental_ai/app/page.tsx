import { MainNav } from '@/components/main-nav';
import { PatientList } from '@/components/patient-list';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <main className="container mx-auto p-8">
        <PatientList />
      </main>
    </div>
  );
}