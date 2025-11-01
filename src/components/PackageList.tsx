import type { AlpinePackage } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Box } from 'lucide-react';

interface PackageListProps {
  packages: AlpinePackage[];
  onSelectPackage: (pkg: AlpinePackage) => void;
  selectedPackage: AlpinePackage | null;
}

export function PackageList({ packages, onSelectPackage, selectedPackage }: PackageListProps) {
  if (packages.length === 0) {
    return <div className="p-4 text-center text-muted-foreground">No packages found.</div>;
  }
  return (
    <nav className="p-2">
      <ul>
        {packages.map((pkg) => (
          <li key={pkg.name}>
            <button
              onClick={() => onSelectPackage(pkg)}
              className={cn(
                'w-full text-left p-3 rounded-lg transition-colors flex items-start gap-3',
                selectedPackage?.name === pkg.name ? 'bg-primary/10' : 'hover:bg-primary/5'
              )}
            >
              <Box className={cn(
                'h-5 w-5 mt-1 shrink-0',
                selectedPackage?.name === pkg.name ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              <div className="flex-1 overflow-hidden">
                <p className={cn(
                  "font-semibold",
                  selectedPackage?.name === pkg.name ? 'text-primary' : 'text-foreground'
                )}>{pkg.name}</p>
                <p className="text-sm text-muted-foreground truncate">{pkg.description}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
