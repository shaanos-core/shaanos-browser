'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-border mt-auto">
      <div className="container mx-auto flex items-center justify-center h-16 text-sm text-muted-foreground">
        <Link href="https://os.shaanvision.com.tr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
          ShaanOS
        </Link>
        <Heart className="w-4 h-4 text-red-500 mx-2 fill-current" />
        <Link href="https://shaanvision.com.tr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
          Shaan Vision
        </Link>
      </div>
    </footer>
  );
}
