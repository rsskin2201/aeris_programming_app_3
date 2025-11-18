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
import {
  HelpCircle,
  Home,
  Search,
  ChevronDown,
  User as UserIcon,
  Globe,
  Briefcase,
  Calendar,
  ListTodo,
  Settings,
  PieChart,
  Users,
  LogOut,
  Menu,
  Mail,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppContext } from '@/hooks/use-app-context';
import { ROLES, MODULES } from '@/lib/types';
import { ZoneSelector } from './zone-selector';
import { Badge } from '../ui/badge';
import { PERMISSIONS } from '@/lib/permissions';
import { Icons } from '../icons';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const moduleIcons = {
  [MODULES.INSPECTIONS]: Briefcase,
  [MODULES.CALENDAR]: Calendar,
  [MODULES.RECORDS]: ListTodo,
  [MODULES.ENTITIES]: Settings,
  [MODULES.STATISTICS]: PieChart,
  [MODULES.USERS]: Users,
  [MODULES.DASHBOARD]: Home,
};

export default function Header() {
  const pathname = usePathname();
  const { user, switchRole, logout } = useAppContext();

  if (!user) return null;

  const userPermissions = PERMISSIONS[user.role] || [];
  const visibleModules = Object.values(MODULES).filter(m => userPermissions.includes(m));

  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = '/' + pathSegments.slice(0, index + 1).join('/');
    const isLast = index === pathSegments.length - 1;
    const name = segment.charAt(0).toUpperCase() + segment.slice(1);
    return { href, name, isLast };
  });

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold md:text-base text-primary">
          <Icons.logo className="h-8 w-8" />
          <span className="sr-only">AERIS</span>
        </Link>
        <Link href="/" className={`transition-colors hover:text-foreground ${pathname === '/' ? 'text-foreground' : 'text-muted-foreground'}`}>
          Panel Principal
        </Link>
      </nav>

       <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <nav className="grid gap-6 text-lg font-medium">
             <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-primary">
              <Icons.logo className="h-8 w-8" />
              <span>AERIS</span>
            </Link>
            <Link href="/" className={pathname === '/' ? 'text-foreground' : 'text-muted-foreground'}>
              Panel Principal
            </Link>
            {/* You can add more mobile links here if needed */}
          </nav>
        </SheetContent>
      </Sheet>

      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
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
        
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                    <HelpCircle className="h-4 w-4" />
                    <span className="sr-only">Soporte</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Soporte</DialogTitle>
                    <DialogDescription>
                        Para dudas o aclaraciones, contacta al administrador.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href="mailto:admin@aeris.com" className="text-sm text-primary hover:underline">
                        admin@aeris.com
                    </a>
                </div>
            </DialogContent>
        </Dialog>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex h-9 items-center gap-2"
            >
              <UserIcon className="h-4 w-4" />
              <span className="hidden md:inline">{user?.name}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mi Cuenta ({user.role})</DropdownMenuLabel>
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
            <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
