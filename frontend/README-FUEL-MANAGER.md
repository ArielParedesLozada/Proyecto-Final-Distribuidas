# Fuel Manager - Frontend

Sistema de Gestión de Combustible con diseño moderno y glassmorphism.

## 🎨 Diseño

El proyecto implementa un diseño moderno con:
- **Glassmorphism**: Efectos de vidrio con `backdrop-blur-xl`
- **Gradientes azulados**: Fondos con degradados de azul a cyan
- **Efectos de glow**: Sombras y brillos en elementos interactivos
- **Animaciones suaves**: Transiciones de 300ms en todos los elementos

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.jsx          # Formulario de login
│   │   └── BackgroundEffects.jsx  # Efectos visuales de fondo
│   └── ProtectedRoute.jsx         # Componente para rutas protegidas
├── pages/
│   ├── auth/
│   │   └── LoginPage.jsx          # Página de login
│   └── DashboardPage.jsx          # Dashboard principal
├── api/
│   ├── api.js                     # Configuración de Axios
│   ├── auth.js                    # Servicios de autenticación
│   └── chofer.js                  # Servicios de choferes
├── hooks/
│   └── useAuth.js                 # Hook de autenticación
├── utils/
│   └── constants.js               # Constantes del proyecto
└── assets/
    └── icons/                     # Iconos del proyecto
```

## 🚀 Características

### Autenticación
- Login con email y contraseña
- Validación de formularios
- Manejo de tokens JWT
- Rutas protegidas
- Interceptores de API para autenticación automática

### Diseño
- **Paleta de colores**:
  - Fondo principal: `bg-slate-950`
  - Glassmorphism: `bg-slate-900/50 backdrop-blur-xl`
  - Acentos: `bg-blue-500`, `text-blue-400`
  - Gradientes: `from-blue-600 to-cyan-600`

### Componentes Reutilizables
- `LoginForm`: Formulario de login con validación
- `BackgroundEffects`: Efectos visuales de fondo
- `ProtectedRoute`: Componente para rutas que requieren autenticación

## 🛠️ Tecnologías

- **React 19** con Vite
- **Tailwind CSS** para estilos
- **React Router** para navegación
- **Axios** para peticiones HTTP
- **Lucide React** para iconos
- **Context API** para manejo de estado

## 📱 Responsive Design

- Mobile first approach
- Grid adaptativo: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
- Padding responsivo: `p-4 md:p-6`

## 🎯 Clases CSS Personalizadas

```css
.glassmorphism     # Efecto de vidrio
.fuel-gradient     # Gradiente principal
.fuel-card         # Tarjeta con glassmorphism
.fuel-input        # Input con estilos personalizados
.fuel-button       # Botón principal con gradiente
.fuel-button-secondary # Botón secundario
```

## 🔧 Configuración

1. Instalar dependencias:
```bash
npm install
```

2. Ejecutar en desarrollo:
```bash
npm run dev
```

3. Construir para producción:
```bash
npm run build
```

## 🌐 Variables de Entorno

```env
VITE_API_URL=http://localhost:4000
```

## 📋 Próximas Características

- [ ] Dashboard completo con métricas
- [ ] Gestión de vehículos
- [ ] Reportes de combustible
- [ ] Notificaciones en tiempo real
- [ ] Modo oscuro/claro
- [ ] PWA (Progressive Web App)
