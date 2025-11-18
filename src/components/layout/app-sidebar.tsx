'use client';

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Briefcase,
  Calendar,
  LayoutGrid,
  ListTodo,
  LogOut,
  PieChart,
  Settings,
  Users,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

import { useAppContext } from '@/hooks/use-app-context';
import { PERMISSIONS } from '@/lib/permissions';
import type { Module, ModuleInfo } from '@/lib/types';
import { MODULES } from '@/lib/types';

const moduleList: ModuleInfo[] = [
  { id: MODULES.DASHBOARD, name: 'Panel Principal', path: '/', icon: LayoutGrid, description: 'Vista general y módulos' },
  { id: MODULES.INSPECTIONS, name: 'Gestión de Inspecciones', path: '/inspections', icon: Briefcase, description: 'Programación de inspecciones' },
  { id: MODULES.CALENDAR, name: 'Calendario', path: '/calendar', icon: Calendar, description: 'Vista de agenda y horarios' },
  { id: MODULES.RECORDS, name: 'Gestión de Registros', path: '/records', icon: ListTodo, description: 'Listado de todas las inspecciones' },
  { id: MODULES.ENTITIES, name: 'Gestión de Entidades', path: '/entities', icon: Settings, description: 'Administrar empresas, inspectores, etc.' },
  { id: MODULES.STATISTICS, name: 'Estadísticas', path: '/statistics', icon: PieChart, description: 'Métricas y KPIs' },
  { id: MODULES.USERS, name: 'Gestión de Usuarios', path: '/users', icon: Users, description: 'Administrar accesos y roles' },
];

export function AppSidebar() {
  const { user, logout } = useAppContext();
  const pathname = usePathname();
  
  if (!user) return null;

  const userPermissions = PERMISSIONS[user.role] || [];
  const visibleModules = moduleList.filter(module => userPermissions.includes(module.id));

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="items-center justify-center gap-2 text-primary group-data-[collapsible=icon]:justify-center">
        <Icons.logo className="size-8 shrink-0" />
        <span className="font-headline text-2xl font-semibold group-data-[collapsible=icon]:hidden">
          AERIS
        </span>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {visibleModules.map((module) => (
            <SidebarMenuItem key={module.id}>
              <Link href={module.path} passHref legacyBehavior>
                <SidebarMenuButton
                  isActive={pathname === module.path}
                  tooltip={{ children: module.name, side: 'right' }}
                  asChild
                >
                  <a>
                    <module.icon />
                    <span>{module.name}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <div className="flex items-center gap-3 p-2 group-data-[collapsible=icon]:justify-center">
          <Avatar className="size-8">
            <AvatarImage src={`https://i.pravatar.cc/150?u=${user.username}`} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-sidebar-foreground">{user.name}</span>
            <span className="text-xs text-sidebar-foreground/70">{user.role}</span>
          </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout} tooltip={{ children: 'Cerrar sesión', side: 'right' }}>
              <LogOut />
              <span>Cerrar sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
