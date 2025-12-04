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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
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
  FlaskConical,
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
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

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
  const { user, operatorName, logout, notifications, markNotificationAsRead, devModeEnabled, toggleDevMode } = useAppContext();
  const { toast } = useToast();
  

  if (!user) return null;

  const userNotifications = notifications.filter(n => n.recipientUsername === user.username || n.recipientRole === user.role);
  const unreadCount = userNotifications.filter(n => !n.read).length;


  const NotificationBell = () => {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="relative h-9 w-9">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                          {unreadCount}
                      </span>
                    )}
                    <span className="sr-only">Notificaciones</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-96">
                <div className="flex items-center justify-between">
                    <p className="font-medium">Notificaciones</p>
                    <Badge variant="secondary">{unreadCount} nuevas</Badge>
                </div>
                <ScrollArea className="mt-4 h-[300px]">
                  <div className="space-y-4 pr-2">
                    {userNotifications.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No tienes notificaciones.</p>
                    ) : (
                      userNotifications.map(n => (
                         <div key={n.id} className={cn("p-3 rounded-md border", !n.read ? "bg-accent/20 border-accent/50" : "bg-transparent")}>
                            <p className="text-sm font-medium">{n.message}</p>
                            <p className="text-xs text-muted-foreground break-words">{n.details}</p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                                <span>hace {formatDistanceToNow(n.date, { locale: es })}</span>
                                {!n.read && (
                                  <Button size="sm" variant="ghost" className="h-auto px-2 py-1 text-primary hover:text-primary" onClick={() => markNotificationAsRead(n.id)}>
                                      <Check className="mr-1 h-3 w-3"/>
                                      Marcar leído
                                  </Button>
                                )}
                            </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-primary">
          <span className="text-2xl">⚡</span>
          <span className="font-headline text-xl">Aeris Prog.</span>
        </Link>
        <Button
          asChild
          variant={pathname === '/' ? 'secondary' : 'ghost'}
          className={cn(
              "hover:bg-accent/90 hover:text-accent-foreground",
              pathname === '/' && "bg-accent text-accent-foreground"
          )}
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
              <span className="font-headline text-xl">Aeris Programming</span>
            </Link>
            <Button asChild variant={pathname === '/' ? 'secondary' : 'ghost'} className={cn(
              "hover:bg-accent/90 hover:text-accent-foreground",
              pathname === '/' && "bg-accent text-accent-foreground"
            )}>
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
                    <DropdownMenuCheckboxItem
                        checked={devModeEnabled}
                        onCheckedChange={toggleDevMode}
                    >
                        <FlaskConical className="mr-2 h-4 w-4" />
                        Modo Desarrollo
                    </DropdownMenuCheckboxItem>
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
