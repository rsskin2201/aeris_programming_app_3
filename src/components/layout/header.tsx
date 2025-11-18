'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  HelpCircle,
  Home,
  PanelLeft,
  Search,
  ChevronDown,
  User as UserIcon,
  Globe,
  Check,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppSidebar } from './app-sidebar';
import { useAppContext } from '@/hooks/use-app-context';
import { ROLES, ZONES } from '@/lib/types';
import { ZoneSelector } from './zone-selector';
import { Badge } from '../ui/badge';

export default function Header() {
  const pathname = usePathname();
  const { user, zone, switchRole } = useAppContext();

  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = '/' + pathSegments.slice(0, index + 1).join('/');
    const isLast = index === pathSegments.length - 1;
    const name = segment.charAt(0).toUpperCase() + segment.slice(1);
    return { href, name, isLast };
  });

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs p-0 bg-sidebar text-sidebar-foreground border-r-0">
          <AppSidebar />
        </SheetContent>
      </Sheet>

      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">
                <Home className="h-4 w-4" />
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {breadcrumbs.length > 0 ? (
            breadcrumbs.map((crumb) => (
              <BreadcrumbItem key={crumb.href}>
                {crumb.isLast ? (
                  <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.name}</Link>
                  </BreadcrumbLink>
                )}
                {!crumb.isLast && <BreadcrumbSeparator />}
              </BreadcrumbItem>
            ))
          ) : (
            <BreadcrumbItem>
              <BreadcrumbPage>Panel Principal</BreadcrumbPage>
            </BreadcrumbItem>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="relative ml-auto flex-1 md:grow-0">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar..."
          className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
        />
      </div>

      <Badge variant="outline" className="hidden lg:inline-flex">
        Ambiente: Producción
      </Badge>

      <ZoneSelector />

      <Button variant="outline" size="icon" className="h-8 w-8">
        <HelpCircle className="h-4 w-4" />
        <span className="sr-only">Soporte</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center gap-2"
          >
            <UserIcon className="h-4 w-4" />
            <span className="hidden md:inline">{user?.name}</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Cambiar Rol (Demo)</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
                <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup value={user?.role} onValueChange={(value) => switchRole(value as any)}>
                        {Object.values(ROLES).map((role) => (
                            <DropdownMenuRadioItem key={role} value={role}>
                                {role}
                            </DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Cerrar sesión</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
