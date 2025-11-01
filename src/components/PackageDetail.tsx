import type { AlpinePackage } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from './ui/separator';
import { Box, Package, Server, Tag, FileText, Calendar, HardDrive, Download, User, Wrench, GitBranch, Terminal, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';

interface PackageDetailProps {
  pkg: AlpinePackage | null;
  onBack: () => void;
}

const DetailRow = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: React.ReactNode }) => (
  <div className="flex items-start gap-4 py-3">
    <div className="text-muted-foreground">{icon}</div>
    <div className="flex-1">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="text-sm text-foreground break-words">{value}</div>
    </div>
  </div>
);

function formatBytes(bytes: string | number, decimals = 2) {
  if (typeof bytes === 'string') {
    bytes = parseInt(bytes, 10);
  }
  if (!bytes || isNaN(bytes)) return 'N/A';
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function PackageDetail({ pkg, onBack }: PackageDetailProps) {
  if (!pkg) {
    return (
      <div className="hidden md:flex h-full items-center justify-center p-8">
        <div className="text-center text-muted-foreground">
          <Package className="mx-auto h-12 w-12" />
          <p className="mt-4 text-lg">Select a package to see details</p>
          <p>Search for a package or select one from the list on the left.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center gap-2 md:hidden">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold">Details</h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 md:p-8">
          <Card className="bg-transparent border-0 shadow-none">
            <CardHeader className="p-0">
              <CardTitle className="flex items-center gap-3 text-2xl font-bold text-primary">
                <Box className="h-7 w-7" />
                {pkg.name}
              </CardTitle>
              <CardDescription className="pt-2 text-base">{pkg.description}</CardDescription>
            </CardHeader>
            <CardContent className="p-0 mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                <DetailRow icon={<Tag className="h-5 w-5" />} label="Version" value={pkg.version} />
                <DetailRow icon={<Server className="h-5 w-5" />} label="Repository" value={<Badge variant="secondary" className="capitalize">{pkg.repo}</Badge>} />
                {pkg.package_size && <DetailRow icon={<HardDrive className="h-5 w-5" />} label="Package Size" value={formatBytes(pkg.package_size)} />}
                {pkg.installed_size && <DetailRow icon={<Download className="h-5 w-5" />} label="Installed Size" value={formatBytes(pkg.installed_size)} />}
                {pkg.license && <DetailRow icon={<FileText className="h-5 w-5" />} label="License" value={pkg.license} />}
                {pkg.origin && <DetailRow icon={<GitBranch className="h-5 w-5" />} label="Origin" value={pkg.origin} />}
                {pkg.maintainer && <DetailRow icon={<User className="h-5 w-5" />} label="Maintainer" value={pkg.maintainer} />}
                {pkg.build_time && <DetailRow icon={<Calendar className="h-5 w-5" />} label="Build Time" value={new Date(parseInt(pkg.build_time) * 1000).toLocaleString()} />}
                {pkg.architecture && <DetailRow icon={<Terminal className="h-5 w-5" />} label="Architecture" value={pkg.architecture} />}
                 {pkg.architectures && pkg.architectures.length > 0 && (
                     <DetailRow icon={<Terminal className="h-5 w-5" />} label="Supported Architectures" value={
                        <div className="flex flex-wrap gap-2">
                            {pkg.architectures.map((item) => (
                                <Badge key={item} variant="outline" className="font-mono">{item}</Badge>
                            ))}
                        </div>
                     } />
                 )}
              </div>
               {pkg.url && (
                <>
                  <Separator className="my-6" />
                  <DetailRow icon={<Wrench className="h-5 w-5" />} label="Website" value={<Link href={pkg.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{pkg.url}</Link>} />
                </>
              )}

              {pkg.provides && pkg.provides.length > 0 && (
                <>
                  <Separator className="my-6" />
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Provides</h3>
                    <div className="flex flex-wrap gap-2">
                      {pkg.provides.map((item) => (
                        <Badge key={item} variant="outline" className="font-mono">{item}</Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
