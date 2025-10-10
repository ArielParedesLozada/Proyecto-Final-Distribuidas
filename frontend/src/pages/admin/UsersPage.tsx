import React, { useState, useEffect } from "react";
import { Users, UserPlus, Mail, Lock, Shield, UserCheck, Edit3, Trash2, Loader2 } from "lucide-react";
import { useToast } from "../../shared/ToastNotification";
import { api } from "../../api/api";
import Pagination from "../../shared/Pagination";

interface User {
  id: string;
  email: string;
  nombre: string;
  roles: 'ADMIN' | 'CONDUCTOR' | 'SUPERVISOR';
}

interface CreateUserData {
  email: string;
  password: string;
  nombre: string;
  roles: 'ADMIN' | 'CONDUCTOR' | 'SUPERVISOR';
}

const UsersPage: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [newUser, setNewUser] = useState<CreateUserData>({
    email: '',
    password: '',
    nombre: '',
    roles: 'CONDUCTOR'
  });
  const { addToast } = useToast();

  // Estado para usuarios reales del backend
  const [users, setUsers] = useState<User[]>([]);
  
  // Estado de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const usersPerPage = 4;

  // Función para cargar usuarios desde el backend
  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api<{ users: User[] }>('/admin/users');
      const allUsers = response.users || [];
      setTotalUsers(allUsers.length);
      
      // Aplicar paginación local
      const startIndex = (currentPage - 1) * usersPerPage;
      const endIndex = startIndex + usersPerPage;
      const paginatedUsers = allUsers.slice(startIndex, endIndex);
      setUsers(paginatedUsers);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      addToast('Error al cargar usuarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar cambio de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // No necesitamos recargar desde el servidor, solo cambiar la página
    // La paginación se maneja localmente
  };

  // Cargar usuarios al montar el componente
  useEffect(() => {
    loadUsers();
  }, []);

  // Recargar usuarios cuando cambie la página
  useEffect(() => {
    loadUsers();
  }, [currentPage]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!newUser.email || !newUser.password || !newUser.nombre) {
      addToast('Todos los campos son obligatorios', 'error');
      return;
    }

    if (newUser.password.length < 6) {
      addToast('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await api<{ user: User }>('/admin/users', {
        method: 'POST',
        body: JSON.stringify({ user: newUser })
      });

      setUsers(prev => [...prev, response.user]);
      setIsCreateModalOpen(false);
      setNewUser({ email: '', password: '', nombre: '', roles: 'CONDUCTOR' });
      addToast('Usuario creado exitosamente', 'success');
    } catch (error) {
      console.error('Error creando usuario:', error);
      addToast('Error al crear el usuario', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setLoading(true);
      const formData = new FormData(e.currentTarget);
      const password = formData.get('password') as string;
      
      const updatedUser = {
        email: formData.get('email') as string,
        nombre: formData.get('nombre') as string,
        roles: formData.get('roles') as 'ADMIN' | 'CONDUCTOR' | 'SUPERVISOR',
        ...(password && password.trim() !== '' && { password })
      };

      const response = await api<{ user: User }>(`/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ user: updatedUser })
      });

      if (!response || !response.user) {
        addToast('Error: Respuesta inválida del servidor', 'error');
        return;
      }

      setUsers(prev => prev.map(u => u.id === editingUser.id ? response.user : u));
      
      setIsEditModalOpen(false);
      setEditingUser(null);
      addToast('Usuario actualizado exitosamente', 'success');
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      addToast('Error al actualizar el usuario', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      try {
        setLoading(true);
        
        // Buscar el usuario para verificar su rol
        const userToDelete = users.find(user => user.id === userId);
        
        // Eliminar el usuario
        await api(`/admin/users/${userId}`, {
          method: 'DELETE'
        });

        // Si el usuario es CONDUCTOR, también eliminar su registro de conductor
        if (userToDelete && userToDelete.roles === 'CONDUCTOR') {
          try {
            console.log('Usuario CONDUCTOR detectado, buscando conductor asociado...');
            
            // Primero obtener la lista de conductores para encontrar el ID del conductor
            const driversResponse = await api('/drivers');
            console.log('Respuesta de conductores:', driversResponse);
            
            const driver = driversResponse.drivers?.find((d: any) => d.user_id === userId);
            console.log('Conductor encontrado:', driver);
            
            if (driver) {
              console.log(`Eliminando conductor con ID: ${driver.id}`);
              await api(`/drivers/${driver.id}`, {
                method: 'DELETE'
              });
              console.log('Conductor eliminado exitosamente de la base de datos');
            } else {
              console.log('No se encontró conductor asociado para este usuario');
            }
          } catch (driverError) {
            console.error('Error eliminando conductor asociado:', driverError);
            addToast('Usuario eliminado, pero hubo un problema eliminando el conductor asociado', 'warning');
          }
        }

        setUsers(prev => prev.filter(user => user.id !== userId));
        addToast('Usuario eliminado exitosamente', 'success');
      } catch (error) {
        console.error('Error eliminando usuario:', error);
        addToast('Error al eliminar el usuario', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Shield className="w-4 h-4" />;
      case 'SUPERVISOR': return <UserCheck className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-600/20 border-red-600/30 text-red-400';
      case 'SUPERVISOR': return 'bg-blue-600/20 border-blue-600/30 text-blue-400';
      default: return 'bg-green-600/20 border-green-600/30 text-green-400';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Administrador';
      case 'SUPERVISOR': return 'Supervisor';
      default: return 'Conductor';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Gestión de Usuarios
          </h1>
          <p className="text-slate-400">Administra los usuarios del sistema</p>
        </div>
        
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="fuel-button flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          Crear Usuario
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="fuel-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-600/30">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{users.length}</div>
              <div className="text-sm text-slate-400">Total Usuarios</div>
            </div>
          </div>
        </div>
        
        <div className="fuel-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-600/20 border border-red-600/30">
              <Shield className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{users.filter(u => u.roles === 'ADMIN').length}</div>
              <div className="text-sm text-slate-400">Administradores</div>
            </div>
          </div>
        </div>
        
        <div className="fuel-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-600/30">
              <UserCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{users.filter(u => u.roles === 'SUPERVISOR').length}</div>
              <div className="text-sm text-slate-400">Supervisores</div>
            </div>
          </div>
        </div>
        
        <div className="fuel-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-600/20 border border-green-600/30">
              <Users className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{users.filter(u => u.roles === 'CONDUCTOR').length}</div>
              <div className="text-sm text-slate-400">Conductores</div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de usuarios */}
      <div className="fuel-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-slate-600/20 border border-slate-600/30">
            <Users className="w-6 h-6 text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Lista de Usuarios</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-slate-400">Cargando usuarios...</p>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700 flex items-center justify-center">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-300 mb-2">No hay usuarios</h3>
              <p className="text-slate-400">No se encontraron usuarios registrados.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Usuario</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Email</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Rol</th>
                  <th className="text-center py-3 px-4 text-slate-300 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-white">{user.nombre}</div>
                        <div className="text-sm text-slate-400">ID: {user.id}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-slate-300">{user.email}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(user.roles)}`}>
                        {getRoleIcon(user.roles)}
                        {getRoleLabel(user.roles)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-2.5 rounded-lg border border-slate-600 bg-slate-800/50 text-slate-300 hover:border-blue-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20"
                          title="Editar usuario"
                          disabled={loading}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2.5 rounded-lg border border-slate-600 bg-slate-800/50 text-slate-300 hover:border-red-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 hover:shadow-lg hover:shadow-red-500/20"
                          title="Eliminar usuario"
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
         
         {/* Paginación - Siempre visible */}
         <div className="mt-6">
           <Pagination
             page={currentPage}
             perPage={usersPerPage}
             total={totalUsers}
             onPageChange={handlePageChange}
             className=""
           />
         </div>
       </div>

      {/* Modal Crear Usuario */}
      {isCreateModalOpen && (
        <>
          <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/30 backdrop-blur-sm z-40" style={{ left: '250px' }}></div>
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md max-h-[80vh] flex flex-col p-6 relative rounded-2xl shadow-xl bg-[#0b1a2f] border border-slate-800 text-white">
            {/* Cerrar */}
            <button
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
              onClick={() => setIsCreateModalOpen(false)}
              aria-label="Cerrar"
              title="Cerrar"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-600/30">
                <UserPlus className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Crear Nuevo Usuario</h2>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Nombre Completo</label>
                <input
                  type="text"
                  value={newUser.nombre}
                  onChange={(e) => setNewUser({ ...newUser, nombre: e.target.value })}
                  className="fuel-input"
                  placeholder="Ingresa el nombre completo"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="fuel-input pl-10 pr-4"
                    placeholder="usuario@ejemplo.com"
                    style={{ paddingLeft: '2.5rem' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="fuel-input pl-10 pr-4"
                    placeholder="Mínimo 6 caracteres"
                    style={{ paddingLeft: '2.5rem' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Rol</label>
                <select
                  value={newUser.roles}
                  onChange={(e) => setNewUser({ ...newUser, roles: e.target.value as 'ADMIN' | 'CONDUCTOR' | 'SUPERVISOR' })}
                  className="fuel-input"
                >
                  <option value="CONDUCTOR">Conductor</option>
                  <option value="SUPERVISOR">Supervisor</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="fuel-button-secondary flex-1"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button type="submit" className="fuel-button flex-1" disabled={loading}>
                  {loading ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
          </div>
        </>
      )}

      {/* Modal Editar Usuario */}
      {isEditModalOpen && editingUser && (
        <>
          <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/30 backdrop-blur-sm z-40" style={{ left: '250px' }}></div>
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md max-h-[80vh] flex flex-col p-6 relative rounded-2xl shadow-xl bg-[#0b1a2f] border border-slate-800 text-white">
            {/* Cerrar */}
            <button
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
              onClick={() => setIsEditModalOpen(false)}
              aria-label="Cerrar"
              title="Cerrar"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-600/30">
                <Edit3 className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Editar Usuario</h2>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Nombre Completo</label>
                <input
                  type="text"
                  name="nombre"
                  defaultValue={editingUser.nombre}
                  className="fuel-input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                  <input
                    type="email"
                    name="email"
                    defaultValue={editingUser.email}
                    className="fuel-input pl-10 pr-4"
                    style={{ paddingLeft: '2.5rem' }}
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Nueva Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                  <input
                    type="password"
                    name="password"
                    className="fuel-input pl-10 pr-4"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="Dejar vacío para mantener la contraseña actual"
                    autoComplete="new-password"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Si no ingresas una contraseña, se mantendrá la contraseña actual
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Rol</label>
                <select
                  name="roles"
                  defaultValue={editingUser.roles}
                  className="fuel-input"
                >
                  <option value="CONDUCTOR">Conductor</option>
                  <option value="SUPERVISOR">Supervisor</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="fuel-button-secondary flex-1"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button type="submit" className="fuel-button flex-1" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UsersPage;
