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
  const { user, operatorName, switchRole, logout } = useAppContext();
  const { toast } = useToast();

  if (!user) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copiado', description: 'El correo electrónico se ha copiado al portapapeles.' });
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-primary">
          <Icons.logo className="h-8 w-8" />
          <span className="font-headline text-xl">AERIS</span>
        </Link>
        <Button asChild variant={pathname === '/' ? 'secondary' : 'ghost'} size="sm">
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
              <Icons.logo className="h-8 w-8" />
              <span className="font-headline text-xl">AERIS</span>
            </Link>
            <Button asChild variant={pathname === '/' ? 'secondary' : 'ghost'}>
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
            
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9">
                        <HelpCircle className="h-4 w-4" />
                        <span className="sr-only">Soporte</span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Soporte Técnico</DialogTitle>
                        <DialogDescription>
                            Para dudas o aclaraciones, contacta al administrador.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between rounded-md border bg-muted px-3 py-2">
                            <a href="mailto:jorge.ricardo.seichi.gonzalez.garcia@nttdata.com" className="truncate text-sm font-medium text-primary hover:underline">
                                jorge.ricardo.seichi.gonzalez.garcia@nttdata.com
                            </a>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopy('jorge.ricardo.seichi.gonzalez.garcia@nttdata.com')}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                        <div>
                            <h4 className="mb-2 font-medium text-sm">Horarios de Atención</h4>
                            <div className="space-y-1 text-sm text-muted-foreground">
                                <p className="flex items-center"><Clock className="mr-2 h-4 w-4" /> Lunes a Viernes: 09:00 a.m. - 06:00 p.m.</p>
                                <p className="flex items-center"><Clock className="mr-2 h-4 w-4" /> Sábados: 09:00 a.m. - 01:00 p.m.</p>
                            </div>
                        </div>
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
                <span className="hidden md:inline">{operatorName}</span>
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
      </div>
    </header>
  );
}
