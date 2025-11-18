'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { mockUsers } from "@/lib/mock-data";
import { MoreHorizontal, UserPlus } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLES, ZONES } from "@/lib/types";
import { useAppContext } from "@/hooks/use-app-context";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function UsersPage() {
    const { user } = useAppContext();
    const router = useRouter();
    const [ newPassword, setNewPassword ] = useState('');

    useEffect(() => {
        if (user && user.role !== ROLES.ADMIN) {
            router.push('/');
        }
    }, [user, router]);

    const generatePassword = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
        let password = "";
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setNewPassword(password);
    }

    if (!user || user.role !== ROLES.ADMIN) {
        return <div className="flex h-full items-center justify-center"><p>Acceso denegado.</p></div>;
    }
  
  return (
    <div className="flex flex-col gap-6">
       <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-headline text-3xl font-semibold">Gestión de Usuarios</h1>
        
        <Dialog>
            <DialogTrigger asChild>
                <Button><UserPlus className="mr-2 h-4 w-4" /> Crear Usuario</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                    <DialogDescription>Completa el formulario para dar de alta un nuevo usuario en el sistema.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Nombre</Label>
                        <Input id="name" placeholder="Nombre completo" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="username" className="text-right">Usuario</Label>
                        <Input id="username" placeholder="alias.de.usuario" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">Rol</Label>
                        <Select>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Selecciona un rol" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.values(ROLES).map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="zone" className="text-right">Zona</Label>
                        <Select>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Selecciona una zona" />
                            </SelectTrigger>
                            <SelectContent>
                                {ZONES.map(zone => <SelectItem key={zone} value={zone}>{zone}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password" className="text-right">Contraseña</Label>
                         <div className="col-span-3 flex gap-2">
                             <Input id="password" value={newPassword} readOnly placeholder="Generada automáticamente" />
                             <Button variant="secondary" onClick={generatePassword}>Generar</Button>
                         </div>
                    </div>
                </div>
                 <DialogFooter>
                    <Button type="submit">Guardar Usuario</Button>
                </DialogFooter>
            </DialogContent>
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
                <TableHead>Estatus</TableHead>
                <TableHead><span className="sr-only">Acciones</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockUsers.map((userItem) => (
                <TableRow key={userItem.username}>
                  <TableCell className="font-medium">{userItem.name}</TableCell>
                  <TableCell>{userItem.username}</TableCell>
                  <TableCell>{userItem.role}</TableCell>
                  <TableCell><Badge variant="default">Activo</Badge></TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem>Resetear Contraseña</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Deshabilitar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
