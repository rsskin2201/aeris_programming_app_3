'use client';

import Image from 'next/image';
import { HardHat, PieChart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function StatisticsPage() {
    const constructionImage = PlaceHolderImages.find(img => img.id === 'stats-construction');

  return (
    <div className="flex flex-col gap-6">
      <h1 className="flex items-center gap-3 font-headline text-3xl font-semibold">
        <PieChart className="h-8 w-8 text-primary" />
        Estadísticas y Métricas
      </h1>
      
      <div className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed bg-card p-8">
        <div className="text-center">
            <div className='flex justify-center mb-6'>
                {constructionImage && (
                    <div className='w-full max-w-md'>
                        <Image 
                            src={constructionImage.imageUrl}
                            alt={constructionImage.description}
                            width={800}
                            height={600}
                            className="rounded-lg object-cover"
                            data-ai-hint={constructionImage.imageHint}
                        />
                    </div>
                )}
            </div>
          <HardHat className="mx-auto h-16 w-16 text-primary/70" />
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
            Módulo en Construcción
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Estamos trabajando para traerte métricas y KPIs detallados. ¡Vuelve pronto!
          </p>
        </div>
      </div>

    </div>
  );
}
