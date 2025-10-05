import React, { useState } from "react";
import { Users, UserPlus, Mail, Lock, Shield, UserCheck, UserX, Edit3, Trash2 } from "lucide-react";
import { useToast } from "../../shared/ToastNotification";

interface User {
  id: string;
  email: string;
  role: 'admin' | 'conductor' | 'supervisor';
  name: string;
  createdAt: string;
  status: 'active' | 'inactive';
}

const UsersPage: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    name: '',
    role: 'conductor' as 'admin' | 'conductor' | 'supervisor'
  });
  const { addToast } = useToast();

  // Datos mock - en el futuro vendrán del backend
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      email: 'admin@fuelmanager.com',
      role: 'admin',
      name: 'Administrador Principal',
      createdAt: '2024-01-15',
      status: 'active'
    },
    {
      id: '2',
      email: 'conductor1@fuelmanager.com',
      role: 'conductor',
      name: 'Juan Pérez',
      createdAt: '2024-01-20',
      status: 'active'
    },
    {
      id: '3',
      email: 'supervisor1@fuelmanager.com',
      role: 'supervisor',
      name: 'María García',
      createdAt: '2024-01-25',
      status: 'active'
    }
  ]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!newUser.email || !newUser.password || !newUser.name) {
      addToast('Todos los campos son obligatorios', 'error');
      return;
    }

    if (newUser.password.length < 6) {
      addToast('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    // Aquí harías la llamada al backend
    try {
      const userToCreate = {
        ...newUser,
        id: Date.now().toString(),
        createdAt: new Date().toISOString().split('T')[0],
        status: 'active' as const
      };

      setUsers(prev => [...prev, userToCreate]);
      setIsCreateModalOpen(false);
      setNewUser({ email: '', password: '', name: '', role: 'conductor' });
      addToast('Usuario creado exitosamente', 'success');
    } catch (error) {
      addToast('Error al crear el usuario', 'error');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      setUsers(prev => prev.filter(user => user.id !== userId));
      addToast('Usuario eliminado exitosamente', 'success');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'supervisor': return <UserCheck className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-600/20 border-red-600/30 text-red-400';
      case 'supervisor': return 'bg-blue-600/20 border-blue-600/30 text-blue-400';
      default: return 'bg-green-600/20 border-green-600/30 text-green-400';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'supervisor': return 'Supervisor';
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
              <div className="text-2xl font-bold text-white">{users.filter(u => u.role === 'admin').length}</div>
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
              <div className="text-2xl font-bold text-white">{users.filter(u => u.role === 'supervisor').length}</div>
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
              <div className="text-2xl font-bold text-white">{users.filter(u => u.role === 'conductor').length}</div>
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

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Usuario</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Rol</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Estado</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Fecha Creación</th>
                <th className="text-center py-3 px-4 text-slate-400 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-700/30 hover:bg-slate-800/20 transition-colors">
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-medium text-white">{user.name}</div>
                      <div className="text-sm text-slate-400">{user.email}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                      {getRoleIcon(user.role)}
                      {getRoleLabel(user.role)}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      user.status === 'active' 
                        ? 'bg-green-600/20 text-green-400' 
                        : 'bg-red-600/20 text-red-400'
                    }`}>
                      {user.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-slate-400">{user.createdAt}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-2 rounded-lg bg-blue-600/20 border border-blue-600/30 text-blue-400 hover:bg-blue-600/30 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 rounded-lg bg-red-600/20 border border-red-600/30 text-red-400 hover:bg-red-600/30 transition-colors"
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
      </div>

      {/* Modal Crear Usuario */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="fuel-card p-6 w-full max-w-md">
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
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="fuel-input"
                  placeholder="Ingresa el nombre completo"
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
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Rol</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'admin' | 'conductor' | 'supervisor' })}
                  className="fuel-input"
                >
                  <option value="conductor">Conductor</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="fuel-button-secondary flex-1"
                >
                  Cancelar
                </button>
                <button type="submit" className="fuel-button flex-1">
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="fuel-card p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-600/30">
                <Edit3 className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Editar Usuario</h2>
            </div>

            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Nombre Completo</label>
                <input
                  type="text"
                  defaultValue={editingUser.name}
                  className="fuel-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                  <input
                    type="email"
                    defaultValue={editingUser.email}
                    className="fuel-input pl-10 pr-4"
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Rol</label>
                <select
                  defaultValue={editingUser.role}
                  className="fuel-input"
                >
                  <option value="conductor">Conductor</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Estado</label>
                <select
                  defaultValue={editingUser.status}
                  className="fuel-input"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="fuel-button-secondary flex-1"
                >
                  Cancelar
                </button>
                <button type="submit" className="fuel-button flex-1">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
