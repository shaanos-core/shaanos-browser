
import type { AlpinePackage, PackagesResponse } from '@/lib/types';

// The data is now fetched from the local file saved by `fetch-packages.js`
const PACKAGES_URL = '/packages.json';

async function fetchAllPackageData(): Promise<PackagesResponse> {
    // For a static site, we can fetch directly from the public path.
    const response = await fetch(PACKAGES_URL);
    
    if (!response.ok) {
      throw new Error('Failed to fetch packages:' + response.statusText);
    }
    return response.json();
}

export async function getPackagesAndMetadata(): Promise<{ packages: AlpinePackage[], metadata: PackagesResponse['metadata'] }> {
  try {
    const data = await fetchAllPackageData();
    const repoPriority = data.metadata.repo_priority || [];

    const packageMap = new Map<string, AlpinePackage>();

    const allRawPackages = data.packages.map(pkg => {
        const detail = data.details[pkg.name];
        return detail ? { ...pkg, ...detail } : pkg;
    });

    for (const pkg of allRawPackages) {
        if (!pkg || !pkg.name) continue;

        if (packageMap.has(pkg.name)) {
            const existingPkg = packageMap.get(pkg.name)!;
            const existingPriority = repoPriority.indexOf(existingPkg.source_repo || '');
            const newPriority = repoPriority.indexOf(pkg.source_repo || '');

            if (newPriority !== -1 && (existingPriority === -1 || newPriority < existingPriority)) {
                packageMap.set(pkg.name, pkg);
            }
        } else {
            packageMap.set(pkg.name, pkg);
        }
    }
    
    const packages = Array.from(packageMap.values())
        .sort((a, b) => a.name.localeCompare(b.name));

    return { packages, metadata: data.metadata };

  } catch (error) {
    console.error('Error fetching packages:', error);
    return { packages: [], metadata: { total_packages: 0, repositories: {}, source_repositories: {}, architectures: {}, repo_priority: [] }};
  }
}

export async function getPackageByName(name: string): Promise<AlpinePackage | null> {
  try {
    const data = await fetchAllPackageData();
    const pkgDetails = data.details[name];
    if (pkgDetails) {
       const basePackage = data.packages.find(p => p.name === name) || {};
       return { ...basePackage, ...pkgDetails };
    }
    return null;
  } catch (error) {
    console.error(`Error fetching package ${name}:`, error);
    return null;
  }
}
