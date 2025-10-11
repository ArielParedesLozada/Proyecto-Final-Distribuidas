import React from 'react';
import { User, UserCheck } from 'lucide-react';

interface User {
  id: string;
  email: string;
  nombre: string;
  roles: 'ADMIN' | 'CONDUCTOR' | 'SUPERVISOR';
}

interface UserTableProps {
  users: User[];
  title: string;
  showStatus?: boolean;
  showHeaderIcon?: boolean;
  statusFilter?: (user: User) => boolean;
  statusLabel?: string;
  statusColor?: string;
  actionLabel: string;
  onAction: (user: User) => void;
  emptyStateIcon?: React.ComponentType<{ className?: string }>;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  emptyStateActionLabel?: string;
  onEmptyStateAction?: () => void;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  title,
  showStatus = true,
  showHeaderIcon = true,
  statusFilter,
  statusLabel = "Estado",
  statusColor = "yellow",
  actionLabel,
  onAction,
  emptyStateIcon: EmptyStateIcon = UserCheck,
  emptyStateTitle = "No hay usuarios",
  emptyStateDescription = "No se encontraron usuarios para mostrar",
  emptyStateActionLabel,
  onEmptyStateAction
}) => {
  const filteredUsers = statusFilter ? users.filter(statusFilter) : users;
  
  const getStatusColor = (color: string) => {
    const colors = {
      yellow: "bg-yellow-600/20 border border-yellow-600/30 text-yellow-400",
      green: "bg-green-600/20 border border-green-600/30 text-green-400",
      red: "bg-red-600/20 border border-red-600/30 text-red-400",
      blue: "bg-blue-600/20 border border-blue-600/30 text-blue-400"
    };
    return colors[color as keyof typeof colors] || colors.yellow;
  };

  if (filteredUsers.length === 0) {
    return (
      <div className="fuel-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {showHeaderIcon && (
              <div className="p-2 rounded-lg bg-slate-600/20 border border-slate-600/30">
                <EmptyStateIcon className="w-6 h-6 text-slate-400" />
              </div>
            )}
            <h2 className="text-xl font-semibold text-white">{title}</h2>
          </div>
        </div>
        
        <div className="text-center py-12">
          <div className="p-4 rounded-full bg-slate-700/50 border border-slate-600 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <EmptyStateIcon className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">{emptyStateTitle}</h3>
          <p className="text-slate-400 mb-4">{emptyStateDescription}</p>
          {emptyStateActionLabel && onEmptyStateAction && (
            <button
              onClick={onEmptyStateAction}
              className="px-4 py-2 bg-blue-600/20 border border-blue-600/30 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors text-sm font-medium"
            >
              {emptyStateActionLabel}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left py-3 px-4 text-slate-300 font-medium" style={{color: 'rgb(203 213 225)'}}>Nombre Completo</th>
            <th className="text-left py-3 px-4 text-slate-300 font-medium" style={{color: 'rgb(203 213 225)'}}>Email</th>
            {showStatus && (
              <th className="text-left py-3 px-4 text-slate-300 font-medium" style={{color: 'rgb(203 213 225)'}}>{statusLabel}</th>
            )}
            <th className="text-center py-3 px-4 text-slate-300 font-medium" style={{color: 'rgb(203 213 225)'}}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user) => (
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
              {showStatus && (
                <td className="py-4 px-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(statusColor)}`}>
                    {statusLabel}
                  </span>
                </td>
              )}
              <td className="py-4 px-4">
                <div className="flex justify-center">
                  <button
                    onClick={() => onAction(user)}
                    className="p-2.5 rounded-lg border border-slate-600 bg-slate-800/50 text-slate-300 hover:border-blue-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20"
                    title={actionLabel}
                  >
                    <UserCheck className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
