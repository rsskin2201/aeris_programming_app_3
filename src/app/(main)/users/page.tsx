'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, UserPlus, Pencil, KeyRound, Ban, Trash2, ShieldAlert, Filter, ChevronLeft, ChevronRight, Download, Users as UsersIcon, Upload } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ROLES, ZONES, USER_STATUS, User } from "@/lib/types";
import { useAppContext } from "@/hooks/use-app-context";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { UserForm } from "@/components/users/user-form";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import Papa from "papaparse";
import { format } from 'date-fns';
import Link from "next/link";
import { collection, doc } from "firebase/firestore";
import { useCollection, useFirestore } from "@/firebase";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";

const initialFilters = {
    name: '',
    username: '',
    role: '',
    zone: '',
    status: '',
};

const statusColors: Record<string, string> = {
  [USER_STATUS.ACTIVO]: 'bg-green-600/80 border-green-700 text-white',
  [USER_STATUS.INACTIVO]: 'bg-yellow-500/80 border-yellow-600 text-white',
};

export default function UsersPage() {
    const { user: currentUser } = useAppContext();
    const router = useRouter();
    const { toast } = useToast();
    const firestore = useFirestore();

    const usersQuery = useMemo(() => firestore ? collection(firestore, 'users') : null, [firestore]);
    const { data: users, isLoading } = useCollection<User>(usersQuery);

    const [dialogState, setDialogState] = useState({
        isCreateOpen: false,
        isEditOpen: false,
        isResetOpen: false,
        isDeleteOpen: false,
        isDisableOpen: false,
    });
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [filters, setFilters] = useState(initialFilters);
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        if (currentUser && currentUser.role !== ROLES.ADMIN) {
            router.push('/');
        }
    }, [currentUser, router]);
    
    const handleFilterChange = (key: keyof typeof initialFilters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value || '' }));
        setPage(1);
    }
    
    const clearFilters = () => {
        setFilters(initialFilters);
        setPage(1);
    }
    
    const filteredUsers = useMemo(() => {
        if (!users) return [];
        return users.filter(u => {
            if (filters.name && !u.name.toLowerCase().includes(filters.name.toLowerCase())) return false;
            if (filters.username && !u.username.toLowerCase().includes(filters.username.toLowerCase())) return false;
            if (filters.role && u.role !== filters.role) return false;
            if (filters.zone && u.zone !== filters.zone) return false;
            if (filters.status && u.status !== filters.status) return false;
            return true;
        });
    }, [users, filters]);

    const paginatedUsers = useMemo(() => {
        const startIndex = (page - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return filteredUsers.slice(startIndex, endIndex);
    }, [filteredUsers, page, rowsPerPage]);

    const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);

    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= totalPages) {
            setPage(newPage);
        }
    }

    const handleOpenDialog = (dialog: keyof typeof dialogState, user?: User) => {
        if (user) setSelectedUser(user);
        setDialogState(prev => ({...prev, [dialog]: true}));
    }

    const handleCloseDialog = (dialog: keyof typeof dialogState) => {
        setDialogState(prev => ({...prev, [dialog]: false}));
        setSelectedUser(null);
    }
    
    const handleGeneratePassword = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
        let password = "";
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setNewPassword(password);
    }
    
    const handleConfirmPasswordReset = () => {
        // This is a client-side simulation. A real implementation would use a backend function.
        // For now, we just show the password to the admin.
        toast({
            title: "Contraseña Restablecida (Simulado)",
            description: `Se ha generado una nueva contraseña para ${selectedUser?.name}.`,
        });
        setNewPassword('');
        handleCloseDialog('isResetOpen');
    }

    const handleConfirmDelete = () => {
        if (selectedUser && firestore) {
            const userDocRef = doc(firestore, 'users', selectedUser.id);
            deleteDocumentNonBlocking(userDocRef);
            toast({
                variant: 'destructive',
                title: "Usuario Eliminado",
                description: `El usuario ${selectedUser.name} ha sido eliminado.`,
            });
            handleCloseDialog('isDeleteOpen');
        }
    }
    
    const handleConfirmDisable = () => {
        if (selectedUser) {
            // Logic to disable user would go here. For now, just a toast.
            toast({
                title: "Usuario Deshabilitado (Simulado)",
                description: `El usuario ${selectedUser.name} ha sido deshabilitado.`,
            });
            handleCloseDialog('isDisableOpen');
        }
    }

    const handleExport = () => {
      const csv = Papa.unparse(filteredUsers);
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `usuarios_${format(new Date(), 'yyyyMMdd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      setIsExporting(false);
      toast({
          title: "Exportación Completa",
          description: "La lista de usuarios ha sido exportada a un archivo CSV."
      });
    };


    if (!currentUser || currentUser.role !== ROLES.ADMIN) {
        return <div className="flex h-full items-center justify-center"><p>Acceso denegado.</p></div>;
    }
  
  return (
    <div className="flex flex-col gap-6">
       <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="flex items-center gap-3 font-headline text-3xl font-semibold">
              <UsersIcon className="h-8 w-8 text-primary" />
              Gestión de Usuarios
            </h1>
            <div className='flex items-center gap-2'>
                <Button asChild variant="outline">
                    <Link href="/users/upload">
                        <Upload className="mr-2 h-4 w-4" />
                        Carga Masiva
                    </Link>
                </Button>
                <Dialog open={isExporting} onOpenChange={setIsExporting}>
                    <DialogTrigger asChild>
                        <Button
                            variant="outline"
                            className="bg-green-600 text-white hover:bg-green-700 hover:text-white border-green-700 active:bg-green-800"
                        >
                            <Download className="mr-2 h-4 w-4" /> Exportar .csv
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirmar Exportación</DialogTitle>
                            <DialogDescription>
                                Se exportarán {filteredUsers.length} usuarios a un archivo CSV. ¿Deseas continuar?
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
                            <Button onClick={handleExport} className="bg-green-600 hover:bg-green-700">Confirmar</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                <Dialog open={dialogState.isCreateOpen || dialogState.isEditOpen} onOpenChange={(isOpen) => {
                    if (!isOpen) {
                        handleCloseDialog('isCreateOpen');
                        handleCloseDialog('isEditOpen');
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog('isCreateOpen')}><UserPlus className="mr-2 h-4 w-4" /> Crear Usuario</Button>
                    </DialogTrigger>
                    <UserForm 
                        user={selectedUser} 
                        onClose={() => {
                            handleCloseDialog('isCreateOpen');
                            handleCloseDialog('isEditOpen');
                        }} 
                    />
                </Dialog>
            </div>
        </div>

        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <div className="flex items-center justify-between">
                <h3 className='text-xl font-semibold'>Filtros</h3>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    {filtersOpen ? 'Ocultar' : 'Mostrar'} Filtros
                    </Button>
                </CollapsibleTrigger>
            </div>
            <CollapsibleContent asChild>
                <Card className="mt-2 p-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input id="name" placeholder="Buscar por nombre..." value={filters.name} onChange={(e) => handleFilterChange('name', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="username">Usuario</Label>
                            <Input id="username" placeholder="Buscar por usuario..." value={filters.username} onChange={(e) => handleFilterChange('username', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">Rol</Label>
                            <Select value={filters.role} onValueChange={(v) => handleFilterChange('role', v)}>
                                <SelectTrigger id="role"><SelectValue placeholder="Todos" /></SelectTrigger>
                                <SelectContent>
                                    {Object.values(ROLES).map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="zone">Zona</Label>
                            <Select value={filters.zone} onValueChange={(v) => handleFilterChange('zone', v)}>
                                <SelectTrigger id="zone"><SelectValue placeholder="Todas" /></SelectTrigger>
                                <SelectContent>
                                    {Object.values(ZONES).map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="status">Estatus</Label>
                            <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
                                <SelectTrigger id="status"><SelectValue placeholder="Todos" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Activo">Activo</SelectItem>
                                    <SelectItem value="Inactivo">Inactivo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end">
                            <Button variant="ghost" className="w-full" onClick={clearFilters}>Limpiar Filtros</Button>
                        </div>
                    </div>
                </Card>
            </CollapsibleContent>
        </Collapsible>


        <Card>
            <CardHeader>
            <CardTitle>Listado de Usuarios</CardTitle>
            <CardDescription>Muestra todos los usuarios registrados en la aplicación.</CardDescription>
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Zona</TableHead>
                    <TableHead>Estatus</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {paginatedUsers.map((userItem) => (
                    <TableRow key={userItem.id} className="hover:bg-muted/60">
                    <TableCell className="py-2 px-4 font-medium">{userItem.name}</TableCell>
                    <TableCell className="py-2 px-4">{userItem.username}</TableCell>
                    <TableCell className="py-2 px-4">{userItem.role}</TableCell>
                    <TableCell className="py-2 px-4">{userItem.zone}</TableCell>
                    <TableCell className="py-2 px-4">
                        <Badge className={cn('whitespace-nowrap', statusColors[userItem.status] || 'bg-gray-400')}>{userItem.status}</Badge>
                    </TableCell>
                    <TableCell className="py-2 px-4 text-right">
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleOpenDialog('isEditOpen', userItem)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenDialog('isResetOpen', userItem)}>
                                <KeyRound className="mr-2 h-4 w-4" />
                                Resetear Contraseña
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenDialog('isDisableOpen', userItem)}>
                                <Ban className="mr-2 h-4 w-4" />
                                Deshabilitar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => handleOpenDialog('isDeleteOpen', userItem)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </CardContent>
             <CardFooter className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Registros por página</span>
                    <Select value={`${rowsPerPage}`} onValueChange={value => setRowsPerPage(+value)}>
                        <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue placeholder={rowsPerPage} />
                        </SelectTrigger>
                        <SelectContent>
                            {[10, 20, 50, 100].map(size => (
                                <SelectItem key={size} value={`${size}`}>{size}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Página {page} de {totalPages}</span>
                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handlePageChange(page - 1)} disabled={page === 1}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardFooter>
        </Card>
      
        {/* Password Reset Dialog */}
        <Dialog open={dialogState.isResetOpen} onOpenChange={() => handleCloseDialog('isResetOpen')}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Resetear Contraseña</DialogTitle>
                    <DialogDescription>
                        Se generará una nueva contraseña para el usuario <strong>{selectedUser?.name}</strong>. Esta acción es irreversible.
                    </DialogDescription>
                </DialogHeader>
                 <div className="py-4 space-y-4">
                    <Button type="button" onClick={handleGeneratePassword}>Generar Nueva Contraseña</Button>
                    {newPassword && (
                         <Alert>
                            <ShieldAlert className="h-4 w-4" />
                            <AlertTitle>¡Contraseña Generada!</AlertTitle>
                            <AlertDescription className="font-mono break-all">{newPassword}</AlertDescription>
                        </Alert>
                    )}
                 </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => handleCloseDialog('isResetOpen')}>Cancelar</Button>
                    <Button onClick={handleConfirmPasswordReset} disabled={!newPassword}>Confirmar y Resetear</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
        {/* Disable User Dialog */}
        <Dialog open={dialogState.isDisableOpen} onOpenChange={() => handleCloseDialog('isDisableOpen')}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirmar Deshabilitación</DialogTitle>
                    <DialogDescription>
                       ¿Estás seguro de que quieres deshabilitar al usuario <strong>{selectedUser?.name}</strong>? Podrá ser habilitado nuevamente más tarde.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => handleCloseDialog('isDisableOpen')}>Cancelar</Button>
                    <Button variant="destructive" onClick={handleConfirmDisable}>Sí, Deshabilitar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
        {/* Delete User Dialog */}
        <Dialog open={dialogState.isDeleteOpen} onOpenChange={() => handleCloseDialog('isDeleteOpen')}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>¿Estás absolutamente seguro?</DialogTitle>
                    <DialogDescription>
                       Esta acción no se puede deshacer. Esto eliminará permanentemente al usuario <strong>{selectedUser?.name}</strong> y sus datos del sistema.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => handleCloseDialog('isDeleteOpen')}>Cancelar</Button>
                    <Button variant="destructive" onClick={handleConfirmDelete}>Sí, Eliminar Usuario</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

    </div>
  );
}
