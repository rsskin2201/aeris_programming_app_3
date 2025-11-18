'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { useAppContext } from '@/hooks/use-app-context';
import { mockRecords } from '@/lib/mock-data';
import { useMemo } from 'react';

const chartData = [
  { month: 'Enero', inspections: 186, approved: 160 },
  { month: 'Febrero', inspections: 305, approved: 280 },
  { month: 'Marzo', inspections: 237, approved: 210 },
  { month: 'Abril', inspections: 273, approved: 250 },
  { month: 'Mayo', inspections: 209, approved: 190 },
  { month: 'Junio', inspections: 214, approved: 200 },
];

const chartConfig = {
  inspections: {
    label: 'Inspecciones Solicitadas',
    color: 'hsl(var(--chart-2))',
  },
  approved: {
    label: 'Inspecciones Aprobadas',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

const inspectorPerformanceData = [
 { name: 'Juan Pérez', inspections: 45, zone: 'Zona Norte'},
 { name: 'Maria Garcia', inspections: 38, zone: 'Zona Centro'},
 { name: 'Carlos Ruiz', inspections: 35, zone: 'Bajio Norte' },
 { name: 'Ana Torres', inspections: 29, zone: 'Bajio Sur' },
 { name: 'Luis Fernandez', inspections: 25, zone: 'Zona Norte' },
];


export default function StatisticsPage() {
  const { zone } = useAppContext();

  const filteredRecords = useMemo(() => 
    mockRecords.filter(record => zone === 'Todas las zonas' || record.zone === zone),
    [zone]
  );
  
  const filteredInspectorPerformance = useMemo(() =>
    inspectorPerformanceData.filter(item => zone === 'Todas las zonas' || item.zone === zone),
    [zone]
  );

  const kpis = useMemo(() => {
    const total = filteredRecords.length;
    const approved = filteredRecords.filter(r => r.status === 'Aprobado').length;
    const pending = filteredRecords.filter(r => r.status === 'Pendiente Aprobación').length;
    const approvalRate = total > 0 ? (approved / total) * 100 : 0;

    return [
      { title: `Total Inspecciones (${zone})`, value: total.toLocaleString(), change: '' },
      { title: 'Tasa de Aprobación', value: `${approvalRate.toFixed(1)}%`, change: '' },
      { title: 'Tiempo Prom. de Asignación', value: '1.2 días', change: 'Estable' }, // Static for now
      { title: 'Inspecciones Pendientes', value: pending.toLocaleString(), change: '' },
    ]
  }, [filteredRecords, zone]);


  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-headline text-3xl font-semibold">Estadísticas y Métricas</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map(kpi => (
          <Card key={kpi.title}>
            <CardHeader className="pb-2">
              <CardDescription>{kpi.title}</CardDescription>
              <CardTitle className="text-4xl">{kpi.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{kpi.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Inspecciones por Mes</CardTitle>
            <CardDescription>Solicitadas vs. Aprobadas en los últimos 6 meses (datos de ejemplo).</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <YAxis />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar dataKey="inspections" fill="var(--color-inspections)" radius={4} />
                <Bar dataKey="approved" fill="var(--color-approved)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Rendimiento de Inspectores</CardTitle>
            <CardDescription>Top 5 inspectores por inspecciones completadas este mes.</CardDescription>
          </CardHeader>
          <CardContent>
             <ChartContainer config={{}} className="h-[300px] w-full">
               <BarChart layout="vertical" accessibilityLayer data={filteredInspectorPerformance}>
                <CartesianGrid horizontal={false} />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={10} width={100} />
                <XAxis type="number" hide />
                <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                <Bar dataKey="inspections" fill="var(--color-primary)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
