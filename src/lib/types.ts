export interface AlpinePackage {
  name: string;
  version: string;
  description: string;
  dependencies?: string[];
  repo: string;
  architecture?: string;
  architectures?: string[];
  url?: string;
  license?: string;
  package_size?: string;
  installed_size?: string;
  origin?: string;
  source_repo?: string;
  maintainer?: string;
  build_time?: string;
  provides?: string[];
  install_if?: string[];
  checksum?: string;
}

export type PackagesResponse = {
  packages: AlpinePackage[];
  details: {
    [key: string]: AlpinePackage;
  };
  metadata: {
    total_packages: number;
    repositories: {
        [key: string]: number;
    };
    source_repositories: {
        [key: string]: number;
    };
    architectures: {
        [key: string]: number;
    };
    repo_priority: string[];
  };
}
