'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
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
    <Link href={path} className="group block">
      <Card className="h-full transform-gpu transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-primary/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
              <Icon className="h-8 w-8" />
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1" />
          </div>
          <CardTitle className="font-headline text-xl">{name}</CardTitle>
        </CardHeader>
        <CardContent>
            <CardDescription>{description}</CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
}
