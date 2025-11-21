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
import {
  HelpCircle,
  Home,
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
  Copy,
  Clock,
  Bell,
  Check,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppContext } from '@/hooks/use-app-context';
import { ROLES, MODULES } from '@/lib/types';
import { ZoneSelector } from './zone-selector';
import { Badge } from '../ui/badge';
import { PERMISSIONS } from '@/lib/permissions';
import {
  Sheet,
  SheetContent,
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
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';

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
  const { user, operatorName, switchRole, logout, passwordRequests, resolvePasswordRequest } = useAppContext();
  const { toast } = useToast();
  

  if (!user) return null;

  const NotificationBell = () => {
    if (user.role !== ROLES.ADMIN || passwordRequests.length === 0) {
      return null;
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="relative h-9 w-9">
                    <Bell className="h-4 w-4" />
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                        {passwordRequests.length}
                    </span>
                    <span className="sr-only">Notificaciones</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
                <div className="flex items-center justify-between">
                    <p className="font-medium">Solicitudes de Contraseña</p>
                    <Badge variant="secondary">{passwordRequests.length}</Badge>
                </div>
                <div className="mt-4 space-y-4">
                    {passwordRequests.map(req => (
                         <div key={req.id} className="text-sm">
                            <p>Usuario: <span className="font-semibold">{req.username}</span></p>
                            <p>Correo: <span className="font-semibold">{req.email}</span></p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                                <span>hace {formatDistanceToNow(req.date, { locale: es })}</span>
                                <Button size="sm" variant="ghost" className="h-auto px-2 py-1 text-primary hover:text-primary" onClick={() => resolvePasswordRequest(req.id)}>
                                    <Check className="mr-1 h-3 w-3"/>
                                    Marcar resuelto
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-primary">
          <span className="text-2xl">⚡</span>
          <span className="font-headline text-xl">AERIS</span>
        </Link>
        <Button
          asChild
          variant={pathname === '/' ? 'secondary' : 'ghost'}
          size="sm"
          className="data-[active=true]:bg-accent data-[active=true]:text-accent-foreground hover:bg-accent/90 hover:text-accent-foreground"
        >
            <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Panel Principal
            </Link>
        </Button>
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
             <Link href="/" className="flex items-center gap-2 text-lg font-bold text-primary">
              <span className="text-2xl">⚡</span>
              <span className="font-headline text-xl">AERIS</span>
            </Link>
            <Button asChild variant={pathname === '/' ? 'secondary' : 'ghost'} className="data-[active=true]:bg-accent data-[active=true]:text-accent-foreground">
                <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Panel Principal
                </Link>
            </Button>
          </nav>
        </SheetContent>
      </Sheet>

      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex items-center gap-2">
            <Badge variant="outline" className="hidden lg:inline-flex">
            Ambiente: Producción
            </Badge>

            <ZoneSelector />

            <NotificationBell />

            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                variant="outline"
                className="flex h-9 items-center gap-2"
                >
                <UserIcon className="h-4 w-4" />
                <span className="hidden md:inline">{operatorName}</span>
                <ChevronDown className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Mi Cuenta ({user.role})</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user.role === ROLES.ADMIN && (
                  <>
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
                  </>
                )}
                <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar sesión</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
