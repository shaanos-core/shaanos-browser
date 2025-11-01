'use client';

import { useState, useMemo } from 'react';
import type { AlpinePackage, PackagesResponse } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Search, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { PackageList } from './PackageList';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";


interface PackageBrowserProps {
  initialPackages: AlpinePackage[];
  onSelectPackage: (pkg: AlpinePackage) => void;
  selectedPackage: AlpinePackage | null;
  metadata: PackagesResponse['metadata'] | null;
}

const PACKAGES_PER_PAGE = 50;

export function PackageBrowser({ initialPackages, onSelectPackage, selectedPackage, metadata }: PackageBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [selectedArches, setSelectedArches] = useState<string[]>([]);

  const filteredPackages = useMemo(() => {
    let packages = initialPackages;

    if (searchQuery) {
        packages = packages.filter(
        (pkg) =>
            pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (pkg.description && pkg.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }

    if (selectedRepos.length > 0) {
        packages = packages.filter(pkg => selectedRepos.includes(pkg.repo));
    }

    if (selectedArches.length > 0) {
        packages = packages.filter(pkg => pkg.architectures && pkg.architectures.some(arch => selectedArches.includes(arch)));
    }

    return packages;
  }, [searchQuery, initialPackages, selectedRepos, selectedArches]);

  const paginatedPackages = useMemo(() => {
    const startIndex = (currentPage - 1) * PACKAGES_PER_PAGE;
    const endIndex = startIndex + PACKAGES_PER_PAGE;
    return filteredPackages.slice(startIndex, endIndex);
  }, [filteredPackages, currentPage]);

  const totalPages = Math.ceil(filteredPackages.length / PACKAGES_PER_PAGE);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleRepoToggle = (repo: string) => {
    setSelectedRepos(prev => 
      prev.includes(repo) ? prev.filter(r => r !== repo) : [...prev, repo]
    );
    setCurrentPage(1);
  }

  const handleArchToggle = (arch: string) => {
    setSelectedArches(prev =>
      prev.includes(arch) ? prev.filter(a => a !== arch) : [...prev, arch]
    );
    setCurrentPage(1);
  }

  const activeFiltersCount = selectedRepos.length + selectedArches.length;

  return (
    <div className="w-full flex-1 flex flex-col h-full">
      <div className="p-4 border-b border-border space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search packages..."
            className="w-full rounded-lg bg-background pl-10"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex-1 md:flex-none">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filter
                  {activeFiltersCount > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs">
                        {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Repositories</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {metadata && Object.keys(metadata.repositories).map(repo => (
                  <DropdownMenuCheckboxItem
                    key={repo}
                    checked={selectedRepos.includes(repo)}
                    onCheckedChange={() => handleRepoToggle(repo)}
                  >
                    {repo}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Architectures</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {metadata && Object.keys(metadata.architectures).map(arch => (
                  <DropdownMenuCheckboxItem
                    key={arch}
                    checked={selectedArches.includes(arch)}
                    onCheckedChange={() => handleArchToggle(arch)}
                  >
                    {arch}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
      <ScrollArea className="flex-1">
          <PackageList
            packages={paginatedPackages}
            onSelectPackage={onSelectPackage}
            selectedPackage={selectedPackage}
          />
      </ScrollArea>
      <div className="p-4 border-t border-border flex justify-between items-center">
          <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
          </Button>
          <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
          </div>
          <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages}>
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
          </Button>
      </div>
    </div>
  );
}
