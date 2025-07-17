# Deployment Guide - Production Ready

## Overview

TableTalk is now configured with a dual-database architecture that separates development and production environments. This ensures your users will see a clean, professional application without any test data.

## Database Architecture

### ✅ Development Database
- **Contains**: Rich test data for development and testing
- **Users**: 4 test users with different roles
- **Games**: 2 sample bridge games with realistic data
- **Hands**: Sample hands with bidding sequences and contracts
- **Comments**: Example discussions and interactions

### ✅ Production Database
- **Contains**: Clean database with only admin user
- **State**: Ready for real users
- **Admin**: craig@craigandlee.com with secure credentials
- **Schema**: Fully synchronized with development

## Pre-Deployment Checklist

### ✅ Environment Setup
- [x] Production database created and configured
- [x] Admin user setup completed
- [x] Email service (SendGrid) configured
- [x] Environment variables properly set
- [x] Migration scripts tested and ready

### ✅ Database Management
- [x] Development database with test data preserved
- [x] Production database clean and ready
- [x] Admin user created: craig@craigandlee.com
- [x] Schema synchronization working
- [x] Migration system implemented

### ✅ Security & Authentication
- [x] Password reset functionality
- [x] Email verification system
- [x] Admin user management
- [x] Session management
- [x] Soft-delete user system

## Deployment Steps

### 1. Deploy to Replit
```bash
# Click "Deploy" in Replit
# The application will automatically use production database
```

### 2. Environment Variables (Set in Replit Secrets)
```bash
NODE_ENV=production
ADMIN_EMAIL=craig@craigandlee.com
ADMIN_PASSWORD=TabletalkAdmin2025!
SENDGRID_API_KEY=your_sendgrid_key
BASE_URL=https://yourdomain.replit.app
```

### 3. Post-Deployment Verification
1. **Admin Login**: Test admin access with craig@craigandlee.com
2. **Clean Database**: Verify no test data visible
3. **User Registration**: Test new user signup flow
4. **Email Verification**: Confirm email system works
5. **PBN Upload**: Test file upload and game creation
6. **Admin Dashboard**: Verify user management functions

## What Users Will See

### ✅ Clean Production Environment
- No test data or sample games
- Professional, empty dashboard ready for their content
- Working registration and login system
- Email verification process
- Clean, focused interface

### ✅ Full Functionality
- User registration with email verification
- Password reset functionality
- PBN file upload and game management
- Hand viewing and analysis
- Comment system for discussions
- Admin user management (for you)

## Admin Features Available

### User Management
- View all registered users
- Search and filter users
- Deactivate/reactivate user accounts
- View user statistics and activity
- Role-based access control

### System Monitoring
- User registration metrics
- Game upload statistics
- System health monitoring
- Email delivery status

## Future Schema Changes

### Development Workflow
1. Make changes to `shared/schema.ts` in development
2. Test thoroughly with development database
3. Run `npx drizzle-kit generate` to create migration files
4. Apply to production via migration script

### Production Deployment
1. Set `NODE_ENV=production`
2. Run `tsx scripts/migrate-production.ts`
3. Verify schema changes applied successfully
4. Test functionality with real data

## Emergency Procedures

### Database Issues
- Development database can be reset anytime using seed script
- Production database should only be modified via migrations
- Admin can be recreated using setup script if needed

### User Support
- Check user status in admin dashboard
- Reactivate deactivated users if needed
- Monitor email delivery for verification issues

## Success Metrics

Your deployment is ready when:
- [x] Production database contains only admin user
- [x] Development database preserves test data
- [x] Email verification system works
- [x] Admin dashboard accessible
- [x] New users can register and upload games
- [x] All authentication flows function correctly

## Support Information

- **Admin Access**: craig@craigandlee.com
- **Database**: PostgreSQL with automatic schema management
- **Email Service**: SendGrid for production email delivery
- **Monitoring**: Admin dashboard for user and system metrics

Your TableTalk application is now ready for production deployment with a clean, professional user experience!