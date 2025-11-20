'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, UserPlus, Pencil, KeyRound, Ban, Trash2, ShieldAlert } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ROLES } from "@/lib/types";
import { useAppContext } from "@/hooks/use-app-context";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { UserForm } from "@/components/users/user-form";
import type { User } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


export default function UsersPage() {
    const { user, zone, users, deleteUser } = useAppContext();
    const router = useRouter();
    const { toast } = useToast();

    const [dialogState, setDialogState] = useState({
        isCreateOpen: false,
        isEditOpen: false,
        isResetOpen: false,
        isDeleteOpen: false,
        isDisableOpen: false,
    });
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        if (user && user.role !== ROLES.ADMIN) {
            router.push('/');
        }
    }, [user, router]);

    const filteredUsers = useMemo(() => 
        users.filter(u => zone === 'Todas las zonas' || u.zone === zone),
        [zone, users]
    );

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
        // Here you would typically call an API to update the user's password.
        toast({
            title: "Contraseña Restablecida",
            description: `Se ha generado una nueva contraseña para ${selectedUser?.name}.`,
        });
        setNewPassword('');
        handleCloseDialog('isResetOpen');
    }

    const handleConfirmDelete = () => {
        if (selectedUser) {
            deleteUser(selectedUser.username);
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
                title: "Usuario Deshabilitado",
                description: `El usuario ${selectedUser.name} ha sido deshabilitado.`,
            });
            handleCloseDialog('isDisableOpen');
        }
    }


    if (!user || user.role !== ROLES.ADMIN) {
        return <div className="flex h-full items-center justify-center"><p>Acceso denegado.</p></div>;
    }
  
  return (
    <div className="flex flex-col gap-6">
       <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-headline text-3xl font-semibold">Gestión de Usuarios</h1>
        
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
              {filteredUsers.map((userItem) => (
                <TableRow key={userItem.username} className="hover:bg-muted/60">
                  <TableCell className="py-2 px-4 font-medium">{userItem.name}</TableCell>
                  <TableCell className="py-2 px-4">{userItem.username}</TableCell>
                  <TableCell className="py-2 px-4">{userItem.role}</TableCell>
                  <TableCell className="py-2 px-4">{userItem.zone}</TableCell>
                  <TableCell className="py-2 px-4"><Badge variant="default">Activo</Badge></TableCell>
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
