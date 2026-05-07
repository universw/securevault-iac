# SecureVault IaC — Vercel Deployment Guide

## Quick Start Deployment to Vercel

This guide walks you through deploying the SecureVault frontend to Vercel with full multi-user authentication support.

---

## Prerequisites

Before starting, ensure you have:

1. **GitHub Account** — Repository already connected
2. **Vercel Account** — Free tier is sufficient
3. **AWS Cognito Configuration** — User Pool set up with:
   - User Pool ID (e.g., `ap-northeast-1_xxxxxxxxx`)
   - App Client ID (e.g., `xxxxxxxxxxxxxxxxxxxxxxxxxx`)
   - Email as username attribute
   - Email auto-verification enabled
4. **Backend API Running** — Deployed separately (AWS Lambda, Heroku, etc.)
   - API URL accessible (e.g., `https://api.example.com`)

---

## Step 1: Connect Repository to Vercel

1. Visit **[vercel.com](https://vercel.com)**
2. Click **"Add New"** → **"Project"**
3. Select **GitHub** as provider
4. Find and select `universw/securevault-iac` repository
5. Click **"Import"**

### Framework & Build Settings

When prompted:
- **Framework Preset**: `Vite` (auto-detected)
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `dist` (auto-detected)
- **Install Command**: `npm install` (auto-detected)
- **Root Directory**: `frontend/` (Must set this!)

---

## Step 2: Configure Environment Variables

1. After importing, you'll see the **"Configure Project"** page
2. Scroll to **"Environment Variables"** section
3. Add the following variables:

| Variable | Value | Example |
|----------|-------|---------|
| `VITE_API_BASE_URL` | Your backend API URL | `https://api.securevault.example.com` or `https://xxx.lambda-url.ap-northeast-1.on.aws` |
| `VITE_COGNITO_USER_POOL_ID` | From AWS Cognito | `ap-northeast-1_az257L9tk` |
| `VITE_COGNITO_CLIENT_ID` | From AWS Cognito | `5ps12ienscepvm6qbnlklnvtbj` |
| `VITE_AWS_REGION` | AWS Region | `ap-northeast-1` |

**Important**: Make sure variables are set for **"Production"** environment.

---

## Step 3: Deploy

1. Click **"Deploy"** button
2. Wait for build to complete (usually 1-3 minutes)
3. You'll get a deployment URL: `https://securevault-xxx.vercel.app`
4. Visit the URL to verify deployment

---

## Step 4: Test the Application

### Test Signup Flow

1. Navigate to your Vercel deployment URL
2. Click **"Create one"** to go to signup
3. Enter a test email address
4. Create a strong password (8+ chars, uppercase, lowercase, number, symbol)
5. Confirm password and submit
6. **Check your email** for a 6-digit verification code
7. Enter the code on the verification page
8. You should be redirected to login

### Test Login Flow

1. Enter your test email
2. Enter your password
3. Click **"Sign in"**
4. You should see the file vault dashboard
5. Verify you can upload and manage files

### Test Password Reset

1. On login page, click **"Forgot your password?"**
2. Enter your email
3. Click **"Send reset code"**
4. **Check your email** for the code
5. Enter new password (must meet requirements)
6. Confirm and submit
7. Sign in with new password

---

## Step 5: Custom Domain (Optional)

1. In Vercel project settings, go to **"Domains"**
2. Click **"Add"**
3. Enter your custom domain (e.g., `vault.example.com`)
4. Update DNS records as instructed by Vercel
5. Wait for SSL certificate (usually 24-48 hours)

---

## Step 6: Continuous Deployment

After initial setup, Vercel will automatically:

1. **Watch** the GitHub repository
2. **Rebuild** when you push to `main` branch
3. **Deploy** automatically to production
4. **Create preview URLs** for pull requests

To deploy a new version:

```bash
git push origin main
```

Vercel will deploy within minutes.

---

## Environment Variables Explanation

### `VITE_API_BASE_URL`
Backend API endpoint. Examples:
- Local: `http://localhost:3000/api`
- AWS Lambda: `https://xxx.lambda-url.ap-northeast-1.on.aws`
- Custom API: `https://api.example.com`

### `VITE_COGNITO_USER_POOL_ID`
Found in AWS Cognito console:
1. Open AWS Cognito
2. Click your User Pool
3. Copy the pool ID from **"General Settings"**

### `VITE_COGNITO_CLIENT_ID`
Found in AWS Cognito console:
1. Open AWS Cognito
2. Go to your User Pool
3. Click **"App Clients"** or **"App Integration"**
4. Copy the App Client ID

### `VITE_AWS_REGION`
AWS region where Cognito is deployed (e.g., `ap-northeast-1`)

---

## Troubleshooting

### Build Fails with "Command build failed"

**Issue**: Vercel build fails during `npm run build`

**Solutions**:
1. Check the build logs in Vercel dashboard
2. Ensure `VITE_*` variables are set
3. Verify root directory is set to `frontend/`
4. Try building locally: `cd frontend && npm run build`

### "Cognito configuration missing" Error

**Issue**: After deployment, see "Configure the frontend environment" message

**Solutions**:
1. Verify environment variables are set on Vercel
2. Redeploy: Click **"Redeploy"** in Vercel dashboard
3. Check variable names match exactly (case-sensitive)
4. Ensure variables are for "Production" environment

### Login / Signup Not Working

**Issue**: Auth forms appear but requests fail

**Solutions**:
1. Verify Cognito User Pool ID and Client ID are correct
2. Check that Cognito User Pool is in the same region as `VITE_AWS_REGION`
3. Verify backend API URL is correct in `VITE_API_BASE_URL`
4. Check browser console (F12) for error messages
5. Ensure CORS is enabled on backend API

### Email Not Received

**Issue**: Signup verification email not arriving

**Solutions**:
1. Check email spam/junk folder
2. Verify sender email configured in Cognito
3. Check Cognito console for email delivery failures
4. Ensure email is valid (not temporary email service)

### "Cannot POST /api/..." Errors

**Issue**: File upload/download fails with API 404 errors

**Solutions**:
1. Verify backend API is running and accessible
2. Check `VITE_API_BASE_URL` is correct
3. Verify API endpoints match backend implementation
4. Check CORS headers on backend API
5. Ensure JWT token is valid (re-login if needed)

---

## Vercel Dashboard Features

### Monitoring

- **Analytics**: View traffic and performance
- **Logs**: Check application and function logs
- **Bandwidth**: Monitor data usage
- **Build times**: Track deployment performance

### Configuration

- **Domains**: Manage custom domains and SSL
- **Environment Variables**: Update secrets without rebuilding
- **Integrations**: Connect GitHub, analytics tools, etc.
- **Edge Middleware**: Add request/response middleware

### Deployment Management

- **Automatic deployments**: Push to `main` → auto-deploy
- **Preview deployments**: PR → get preview URL
- **Rollbacks**: Revert to previous deployment
- **Promote**: Move preview to production

---

## Advanced Deployment Options

### Deploy from CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from project directory
vercel

# Deploy to production
vercel --prod
```

### GitHub Actions for Pre-deployment Tests

Add to `.github/workflows/test.yml`:

```yaml
name: Test and Build

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd frontend && npm install
      - run: cd frontend && npm run build
```

### Environment-Specific Configuration

Create separate Vercel projects for staging/production:

1. Create `staging` branch
2. Create second Vercel project for staging
3. Set different environment variables per project
4. Use branch deployments for testing

---

## Security Best Practices

✅ **Do**:
- Keep Cognito credentials in Vercel environment variables (not git)
- Use HTTPS only (Vercel enforces)
- Enable MFA in Cognito for user accounts
- Regularly rotate API keys and secrets
- Monitor Vercel deployment logs for errors
- Test password reset and email verification flows

❌ **Don't**:
- Commit `.env` files to git
- Expose API URLs in frontend code
- Use weak passwords for testing
- Share Cognito credentials via unencrypted channels
- Disable email verification in Cognito

---

## Monitoring in Production

### Enable Error Tracking

1. Set up Sentry for error tracking:
   - Create Sentry project
   - Add Sentry SDK to frontend
   - Set `VITE_SENTRY_DSN` environment variable

### Monitor Authentication Metrics

In AWS Cognito console:
- **User registrations**: New users per day
- **Failed logins**: Track attempted attacks
- **Email confirmations**: Verify delivery
- **Password resets**: Track support burden

### Monitor API Usage

In API Gateway or backend logs:
- Request volume and latency
- Error rates by endpoint
- User activity patterns

---

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Configure custom domain
3. ✅ Enable MFA in Cognito (optional)
4. ✅ Set up error tracking (Sentry)
5. ✅ Monitor user analytics
6. ✅ Plan scaling strategy

---

## Getting Help

- **Vercel Docs**: https://vercel.com/docs
- **Cognito Docs**: https://docs.aws.amazon.com/cognito/
- **GitHub Issues**: Ask in repository issues
- **AWS Support**: Use AWS support plan for infrastructure issues

---

**Deployed with ❤️ using Vercel and AWS**
