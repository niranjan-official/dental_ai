'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';
import { Button } from './ui/button';
import { Stethoscope } from 'lucide-react';

export function MainNav() {
  const pathname = usePathname();

  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-4">
          <Stethoscope className="h-6 w-6" />
          <h1 className="text-xl font-bold">DentalAI Assistant</h1>
        </div>
        <nav className="flex items-center space-x-6 ml-6">
          <Link
            href="/"
            className={cn(
              'text-sm font-medium transition-colors hover:text-primary',
              pathname === '/' ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            Patients
          </Link>
          <Link
            href="/analytics"
            className={cn(
              'text-sm font-medium transition-colors hover:text-primary',
              pathname === '/analytics' ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            Analytics
          </Link>
        </nav>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeToggle />
          <Button variant="outline" size="sm">
            Dr. Smith
          </Button>
        </div>
      </div>
    </div>
  );
}