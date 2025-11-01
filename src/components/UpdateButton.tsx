'use client';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export function UpdateButton() {
  const { pending } = useFormStatus();

  return (
    <Button variant="outline" disabled={pending} type="submit">
      {pending ? (
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="mr-2 h-4 w-4" />
      )}
      {pending ? 'Updating...' : 'Update Packages'}
    </Button>
  );
}
