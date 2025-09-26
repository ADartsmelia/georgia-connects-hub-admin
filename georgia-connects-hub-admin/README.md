# Georgia Connects Hub - Admin Dashboard

A comprehensive admin dashboard for managing the Georgia Connects Hub platform.

## Features

### User Management

- View all users with filtering and search
- Assign user types (attendee, speaker, sponsor, volunteer, organizer, admin)
- Assign pass types (day pass, full pass)
- View detailed user profiles with statistics
- Track user activity and engagement

### Post Approval System

- Review and approve/reject user posts
- Filter posts by approval status
- View post content, author information, and engagement metrics
- Provide rejection reasons for rejected posts

### Sponsor Management

- View all sponsors and their information
- Issue sponsor passes to users
- Track issued passes per sponsor
- Manage day passes and full passes

### Check-in Analytics

- View comprehensive check-in statistics
- Track attendance by day and agenda item
- Identify most popular sessions
- Monitor unique user participation

### Dashboard Overview

- Real-time statistics and metrics
- User type and pass type distribution
- Recent user registrations
- Recent posts awaiting approval

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: shadcn/ui, Radix UI, Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Notifications**: Sonner
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+
- npm 8+

### Installation

1. Clone the repository and navigate to the admin dashboard:

```bash
cd georgia-connects-hub-admin
```

2. Install dependencies:

```bash
npm install
```

3. Create environment file:

```bash
cp .env.example .env.local
```

4. Configure environment variables in `.env.local`:

```
VITE_API_URL=http://localhost:3000/api/v1
VITE_SOCKET_URL=http://localhost:3000
VITE_NODE_ENV=development
```

### Development

Start the development server:

```bash
npm run dev
```

The admin dashboard will be available at `http://localhost:8081`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Authentication

The admin dashboard requires admin-level access. Users must have either:

- `isAdmin: true` for regular admin access
- `isSuperAdmin: true` for super admin access

## API Integration

The admin dashboard integrates with the existing Georgia Connects Hub backend API:

- **Base URL**: Configured via `VITE_API_URL` environment variable
- **Authentication**: JWT token-based authentication
- **Endpoints**: Uses existing backend routes with admin-specific endpoints

### Key API Endpoints

- `GET /admin/dashboard` - Dashboard statistics
- `GET /admin/users` - User management
- `PUT /admin/users/:id/assign-type` - Assign user type
- `GET /admin/posts` - Post approval management
- `PUT /admin/posts/:id/approve` - Approve/reject posts
- `GET /admin/sponsors` - Sponsor management
- `POST /admin/sponsors/:id/passes` - Issue sponsor passes
- `GET /admin/checkins/stats` - Check-in analytics

## Deployment

### DigitalOcean App Platform

1. Connect your repository to DigitalOcean App Platform
2. Configure build settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**: Set `VITE_API_URL` to your backend URL

### Environment Variables

Required environment variables for production:

```
VITE_API_URL=https://your-backend-url.com/api/v1
VITE_SOCKET_URL=https://your-backend-url.com
VITE_NODE_ENV=production
```

## Security Considerations

- Admin authentication is required for all routes
- JWT tokens are stored in localStorage
- Automatic logout on token expiration
- Role-based access control (admin vs super admin)
- Input validation and sanitization

## Contributing

1. Follow the existing code structure and patterns
2. Use TypeScript for type safety
3. Follow the component naming conventions
4. Add proper error handling and loading states
5. Include proper documentation for new features

## Support

For issues or questions regarding the admin dashboard, please contact the development team or create an issue in the repository.

