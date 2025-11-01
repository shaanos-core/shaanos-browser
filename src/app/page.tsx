'use client';

import { useEffect, useState } from 'react';
import { getPackagesAndMetadata } from '@/app/actions';
import { PackageBrowser } from '@/components/PackageBrowser';
import { Header } from '@/components/Header';
import type { AlpinePackage, PackagesResponse } from '@/lib/types';
import Loading from './loading';
import { PackageDetail } from '@/components/PackageDetail';
import { cn } from '@/lib/utils';
import { Stats } from '@/components/Stats';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { BarChart3 } from 'lucide-react';


export default function Home() {
  const [packages, setPackages] = useState<AlpinePackage[]>([]);
  const [metadata, setMetadata] = useState<PackagesResponse['metadata'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<AlpinePackage | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const { packages: pkgs, metadata: meta } = await getPackagesAndMetadata();
        setPackages(pkgs);
        setMetadata(meta);
        if (pkgs.length > 0 && window.innerWidth >= 768) {
             // setSelectedPackage(pkgs[0]);
        }
      } catch (error) {
        console.error("Failed to load package data", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);
  
  const handleSelectPackage = (pkg: AlpinePackage) => {
    setSelectedPackage(pkg);
  };

  const handleBack = () => {
    setSelectedPackage(null);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="flex w-full flex-col bg-background flex-1">
      <Header />
      <main className="flex flex-1 overflow-hidden">
        <div className="grid w-full flex-1 grid-cols-1 md:grid-cols-[350px_1fr]">
          <div className={cn(
              "md:flex flex-col border-r border-border h-full",
              selectedPackage && 'hidden'
          )}>
            <div className="p-4 border-b border-border">
              <Collapsible>
                <CollapsibleTrigger asChild>
                   <Button variant="outline" className="w-full">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Stats
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
                  {metadata && <Stats metadata={metadata} />}
                </CollapsibleContent>
              </Collapsible>
            </div>
            <PackageBrowser 
                initialPackages={packages} 
                onSelectPackage={handleSelectPackage}
                selectedPackage={selectedPackage}
                metadata={metadata}
            />
          </div>
          <div className={cn(
              "md:flex flex-col h-full",
              selectedPackage ? "flex" : "hidden"
            )}>
            <PackageDetail pkg={selectedPackage} onBack={handleBack} />
          </div>
        </div>
      </main>
    </div>
  );
}
