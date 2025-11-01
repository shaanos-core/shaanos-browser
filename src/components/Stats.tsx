'use client';

import type { PackagesResponse } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Server, Layers } from 'lucide-react';
import { Badge } from './ui/badge';

interface StatsProps {
    metadata: PackagesResponse['metadata'];
}

export function Stats({ metadata }: StatsProps) {
    if (!metadata) return null;

    const { total_packages, repositories, source_repositories } = metadata;

    return (
        <div className="grid gap-4 md:grid-cols-1">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Packages</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{total_packages.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Unique packages after conflict resolution</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Repositories</CardTitle>
                    <Server className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                     <div className="text-2xl font-bold">{Object.keys(repositories).length}</div>
                     <div className="text-xs text-muted-foreground flex flex-wrap gap-1 mt-1">
                        {Object.entries(repositories).map(([repo, count]) => (
                            <Badge key={repo} variant="secondary" className="font-normal">{repo}: {count.toLocaleString()}</Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Source Repositories</CardTitle>
                    <Layers className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{Object.keys(source_repositories).length}</div>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-1 mt-1">
                        {Object.entries(source_repositories).map(([repo, count]) => (
                             <Badge key={repo} variant="secondary" className="font-normal">{repo}: {count.toLocaleString()}</Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
