'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import type { ElementType } from 'react';

interface ModuleCardProps {
  name: string;
  description: string;
  path: string;
  icon: ElementType;
}

export function ModuleCard({ name, description, path, icon: Icon }: ModuleCardProps) {
  return (
    <Link href={path} className="group">
      <Card className="h-full transition-all duration-300 hover:border-primary hover:shadow-lg hover:-translate-y-1">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-6 w-6" />
            </div>
            <CardTitle className="font-headline text-lg">{name}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </CardHeader>
      </Card>
    </Link>
  );
}
