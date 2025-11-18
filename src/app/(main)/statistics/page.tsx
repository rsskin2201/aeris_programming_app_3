'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

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

const kpis = [
  { title: 'Total de Inspecciones (Año)', value: '1,424', change: '+15.2% vs año anterior' },
  { title: 'Tasa de Aprobación', value: '89.7%', change: '+1.2% vs mes anterior' },
  { title: 'Tiempo Prom. de Asignación', value: '1.2 días', change: '-4.5% vs mes anterior' },
  { title: 'Inspecciones Pendientes', value: '42', change: 'Estable' },
]

export default function StatisticsPage() {
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
            <CardDescription>Solicitadas vs. Aprobadas en los últimos 6 meses.</CardDescription>
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
               <BarChart layout="vertical" accessibilityLayer data={[
                 { name: 'Juan Pérez', inspections: 45 },
                 { name: 'Maria Garcia', inspections: 38 },
                 { name: 'Carlos Ruiz', inspections: 35 },
                 { name: 'Ana Torres', inspections: 29 },
                 { name: 'Luis Fernandez', inspections: 25 },
               ]}>
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
