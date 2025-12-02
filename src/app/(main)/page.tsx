'use client';
import {
  Briefcase,
  Calendar,
  LayoutGrid,
  ListTodo,
  PieChart,
  Settings,
  Users,
} from 'lucide-react';

import { ModuleCard } from '@/components/dashboard/module-card';
import { useAppContext } from '@/hooks/use-app-context';
import { PERMISSIONS } from '@/lib/permissions';
import { MODULES, Module, ModuleInfo } from '@/lib/types';

const moduleList: ModuleInfo[] = [
  { id: MODULES.INSPECTIONS, name: 'Gestión de Inspecciones', path: '/inspections', icon: Briefcase, description: 'Programación de inspecciones' },
  { id: MODULES.CALENDAR, name: 'Calendario', path: '/calendar', icon: Calendar, description: 'Vista de agenda y horarios' },
  { id: MODULES.RECORDS, name: 'Gestión de Registros', path: '/records', icon: ListTodo, description: 'Listado de todas las inspecciones' },
  { id: MODULES.ENTITIES, name: 'Gestión de Entidades', path: '/entities', icon: Settings, description: 'Administrar empresas, inspectores, etc.' },
  { id: MODULES.STATISTICS, name: 'Estadísticas', path: '/statistics', icon: PieChart, description: 'Métricas y KPIs' },
  { id: MODULES.USERS, name: 'Gestión de Usuarios', path: '/users', icon: Users, description: 'Administrar accesos y roles' },
];

export default function DashboardPage() {
  const { userProfile, operatorName } = useAppContext();

  if (!userProfile) return null;

  const userPermissions = PERMISSIONS[userProfile.role] || [];
  // Exclude dashboard itself from the cards
  const visibleModules = moduleList.filter(module => userPermissions.includes(module.id) && module.id !== MODULES.DASHBOARD);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Bienvenido, {operatorName}</h1>
        <p className="text-muted-foreground">Tu rol actual es: {userProfile.role}. Estos son tus módulos disponibles.</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visibleModules.map((module) => (
          <ModuleCard
            key={module.id}
            name={module.name}
            description={module.description}
            path={module.path}
            icon={module.icon}
          />
        ))}
      </div>
    </div>
  );
}
