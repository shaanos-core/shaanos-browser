'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Header() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-center border-b border-border px-4 md:px-6">
      <Link href="/" className="flex items-center gap-2">
        <div className="flex items-center gap-4">
            <pre className="text-[0.4rem] md:text-[0.5rem] text-primary leading-tight">
{`███████╗██╗  ██╗ █████╗  █████╗ ███╗   ██╗ ██████╗ ███████╗
██╔════╝██║  ██║██╔══██╗██╔══██╗████╗  ██║██╔═══██╗██╔════╝
███████╗███████║███████║███████║██╔██╗ ██║██║   ██║███████╗
╚════██║██╔══██║██╔══██╗██╔══██║██║╚██╗██║██║   ██║╚════██║
███████║██║  ██║██║  ██║██║  ██║██║ ╚████║╚██████╔╝███████║
╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝`}
            </pre>
        </div>
      </Link>
    </header>
  );
}
