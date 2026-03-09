# 🐆 ITJAGUARS FC Stats

<p align="center">
  <img src="https://vpl0mb2pgnbucvy2.public.blob.vercel-storage.com/logo.png" width="150" alt="ITJAGUARS FC Logo">
</p>

<p align="center">
  <strong>Dashboard de estadísticas premium para el equipo ITJAGUARS FC.</strong><br>
  Construido con un stack moderno, optimizado para el rendimiento y con una interfaz visualmente impactante.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.1.6-black?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Supabase-DB-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase">
  <img src="https://img.shields.io/badge/Docker-Standalone-2496ED?style=for-the-badge&logo=docker" alt="Docker">
  <img src="https://img.shields.io/badge/Vercel-Optimized-black?style=for-the-badge&logo=vercel" alt="Vercel">
</p>

---

## ✨ Características Principales

- 🚀 **Performance Extremo**: Optimizado con Next.js Standalone, compresión y formatos de imagen de última generación (AVIF/WebP).
- 🎨 **Interfaz Premium**: Diseño basado en **Glassmorphism**, animaciones suaves y un sistema de diseño oscuro con gradientes dinámicos.
- 📊 **Estadísticas en Tiempo Real**: Sincronización directa con Supabase para mostrar resultados, goleadores y récords al instante.
- ⚽ **Gestión Multi-Club**: Soporte para visualizar estadísticas de diferentes clubes dentro de la misma plataforma.
- 💰 **Control de Finanzas**: Rastreador de deudas y pagos pendientes por jugador y evento.
- 🤖 **CI/CD Robusto**: Automatización completa con GitHub Actions para Linting, Type-checking, Builds de pre-despliegue y publicación en GHCR.

---

## 🛠️ Stack Tecnológico

| Componente | Tecnología |
| :--- | :--- |
| **Framework** | [Next.js 16 (App Router)](https://nextjs.org/) |
| **Frontend** | [React 19](https://react.dev/), [Tailwind CSS 4](https://tailwindcss.com/) |
| **Base de Datos** | [Supabase (PostgreSQL)](https://supabase.com/) |
| **Gráficos** | [Chart.js](https://www.chartjs.org/) |
| **Iconografía** | [Lucide React](https://lucide.dev/) |
| **Monitoreo** | Vercel Analytics & Speed Insights |
| **Infraestructura** | Docker (Standalone mode), GitHub Actions |

---

## 🚀 Despliegue y CI/CD

El proyecto cuenta con una infraestructura de automatización completa:

1. **`CI`**: Valida cada Pull Request ejecutando Lint, Type-check y una build de prueba.
2. **`Pre-deploy Checks`**: Asegura que la rama `main` esté siempre sana antes de que Vercel inicie el despliegue.
3. **`Docker Hub / GHCR`**: Compila y publica automáticamente una imagen de Docker optimizada (`linux/arm64`) en cada push a `main`.

### Docker Standalone
La aplicación está configurada para ejecutarse en modo **Standalone**, lo que reduce drásticamente el tamaño de la imagen y mejora la eficiencia en producción.
> Forzado mediante `NEXT_PRIVATE_STANDALONE=true` en el Dockerfile.

---

## 💻 Desarrollo Local

### 1. Clonar y configurar
```bash
git clone https://github.com/fabianshady/football.git
cd football
npm install
```

### 2. Variables de Entorno
Crea un archivo `.env` con las credenciales de Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=tu_anon_key
```

### 3. Ejecutar
```bash
npm run dev
```

---

## 🐳 Docker (Standalone)

Para construir y ejecutar localmente con Docker:

```bash
# Construir imagen
docker build -t itjaguars-fc .

# Ejecutar contenedor
docker run -p 3001:3001 \
  -e NEXT_PUBLIC_SUPABASE_URL="tu_url" \
  -e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY="tu_key" \
  itjaguars-fc
```

---

## 📄 Licencia

Este proyecto es privado y mantenido por **[fabianshady](https://github.com/fabianshady)**. Todos los derechos reservados.
