# Pumpkin CMS Admin

A modern, Next.js-based admin interface for Pumpkin CMS with light backgrounds and soft colors.

## Features

- ✅ **Next.js 14** with App Router
- ✅ **TypeScript** for type safety
- ✅ **Tailwind CSS** with custom soft color palette
- ✅ **API Authentication** through pumpkin-api
- ✅ **Protected Routes** with auth context
- ✅ **Responsive Dashboard** layout
- ✅ **Light backgrounds** and soft color scheme

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Running instance of `pumpkin-api`

### Installation

1. Install dependencies:

```bash
cd apps/admin
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Configure your `.env` file:

For local development:

```env
NEXT_PUBLIC_API_URL=http://localhost:5064
NEXT_PUBLIC_API_KEY=your-api-key-here
```

For production:

```env
NEXT_PUBLIC_API_URL=https://api.pumpkincms.com
NEXT_PUBLIC_API_KEY=your-api-key-here
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

Build for production:

```bash
npm run build
npm start
```

## Project Structure

```
apps/admin/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── dashboard/          # Dashboard pages
│   │   ├── login/              # Login page
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page
│   ├── components/             # React components
│   │   └── ProtectedRoute.tsx  # Auth guard component
│   ├── contexts/               # React contexts
│   │   └── AuthContext.tsx     # Authentication context
│   └── lib/                    # Utilities
│       └── api.ts              # API client
├── public/                     # Static assets
├── next.config.js              # Next.js configuration
├── tailwind.config.js          # Tailwind configuration
└── tsconfig.json               # TypeScript configuration
```

## Color Palette

The admin uses a soft, light color palette:

- **Primary (Pumpkin Orange)**: `#f97316` with soft variants
- **Secondary (Green)**: Soft green accents
- **Neutral**: Light grays for backgrounds
- **Accent (Purple)**: For special highlights

## Authentication

The admin authenticates through the Pumpkin API:

1. User enters email and password on login page
2. Credentials sent to `/api/auth/login`
3. API returns JWT token and user info
4. Token stored in localStorage
5. Protected routes check authentication state
6. Token included in all API requests

### User Roles

- **SuperAdmin**: Full system access
- **TenantAdmin**: Tenant management
- **Editor**: Content editing
- **Viewer**: Read-only access

## API Integration

The admin uses the `pumpkin-ts-models` package for type-safe API communication:

```typescript
import { User, UserRole, LoginRequest } from 'pumpkin-ts-models'
import { apiClient } from '@/lib/api'

// Login
const response = await apiClient.login(email, password)

// Make authenticated requests
const client = apiClient.withAuth(token)
const data = await client.authenticatedRequest('/api/pages')
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler check

## Pages

### Current Pages

- **/** - Root page (redirects to dashboard or login)
- **/login** - Authentication page
- **/dashboard** - Main dashboard with stats and quick actions
- **/dashboard/pages** - Page management (coming soon)
- **/dashboard/media** - Media library (coming soon)
- **/dashboard/users** - User management (coming soon)
- **/dashboard/settings** - Settings (coming soon)

## Customization

### Colors

Edit `tailwind.config.js` to customize the color palette:

```javascript
colors: {
  primary: { /* your colors */ },
  secondary: { /* your colors */ },
}
```

### Layout

The dashboard layout is defined in `src/app/dashboard/layout.tsx`. Customize:
- Sidebar navigation
- Top bar
- User menu
- Branding

## Development Roadmap

- [ ] Page editor with block-based content
- [ ] Media library with upload
- [ ] User management interface
- [ ] Settings and configuration
- [ ] Real-time preview
- [ ] Version history
- [ ] Bulk operations
- [ ] Search and filter

## Technologies

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **React Context** - State management
- **pumpkin-ts-models** - Shared TypeScript models

## License

MIT - See LICENSE file for details.
