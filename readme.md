# SecureVault-IaC

<div align="center">

![AWS](https://img.shields.io/badge/AWS-Cloud-orange?style=for-the-badge&logo=amazonaws)
![Terraform](https://img.shields.io/badge/Terraform-IaC-623CE4?style=for-the-badge&logo=terraform)
![Serverless](https://img.shields.io/badge/Architecture-Serverless-blue?style=for-the-badge)
![Security](https://img.shields.io/badge/Security-First-green?style=for-the-badge)
![DevOps](https://img.shields.io/badge/DevOps-Automation-black?style=for-the-badge)

### Secure, scalable, serverless cloud storage infrastructure on AWS using Infrastructure as Code.

</div>

---

# Overview

SecureVault-IaC is the Infrastructure as Code (IaC) implementation for the SecureVault platform — a modern serverless cloud storage solution designed with security, scalability, and DevOps best practices in mind.

This project provisions and manages AWS infrastructure using Infrastructure as Code principles to ensure:

- Reproducible deployments
- Secure cloud architecture
- Automated infrastructure management
- Cost optimization
- Scalability
- High availability
- DevOps-ready workflows

The infrastructure is fully serverless and designed to support secure document and file management applications.

---

# Architecture

## Core AWS Services

| Service | Purpose |
|---|---|
| Amazon S3 | Secure encrypted object storage |
| AWS Lambda | Serverless backend processing |
| Amazon API Gateway | REST API management |
| Amazon DynamoDB | Metadata and application database |
| Amazon Cognito | Authentication & user management |
| Amazon CloudFront | CDN & secure content delivery |
| AWS IAM | Access control & least privilege security |
| AWS CloudWatch | Monitoring & logging |
| AWS KMS | Encryption key management |

---

# Features

## Security First Design

- Server-side encryption
- IAM least privilege policies
- Secure API access
- JWT authentication
- Optional client-side encryption
- MFA / 2FA support
- Presigned URL uploads
- Secure file access controls
- Audit logging

## Serverless Infrastructure

- Fully managed AWS services
- Auto-scaling architecture
- Low operational overhead
- Event-driven processing

## DevOps & Automation

- Infrastructure as Code
- CI/CD ready
- Environment-based deployments
- Automated provisioning
- Modular architecture

## Cost Optimized

- AWS Free Tier friendly
- Pay-as-you-go architecture
- Low idle costs
- Optimized resource usage

---

# Project Structure

```bash
securevault-iac/
│
├── modules/
│   ├── s3/
│   ├── lambda/
│   ├── dynamodb/
│   ├── api-gateway/
│   ├── cognito/
│   ├── cloudfront/
│   └── iam/
│
├── environments/
│   ├── dev/
│   ├── staging/
│   └── prod/
│
├── scripts/
│
├── policies/
│
├── .github/
│   └── workflows/
│
├── docs/
│
├── terraform.tfvars.example
├── variables.tf
├── outputs.tf
├── provider.tf
├── main.tf
└── README.md
```

---

# Infrastructure Components

## Authentication Layer

Amazon Cognito handles:

- User authentication
- Secure sign-up/sign-in
- JWT token generation
- MFA support
- User pools & identity pools

---

## Storage Layer

Amazon S3 provides:

- Encrypted file storage
- Lifecycle management
- Versioning
- Presigned uploads
- Secure bucket policies

---

## API Layer

Amazon API Gateway + AWS Lambda provide:

- RESTful APIs
- File upload/download handling
- Authorization middleware
- Serverless backend execution

---

## Database Layer

Amazon DynamoDB stores:

- File metadata
- User activity logs
- Access permissions
- Audit records

---

# Security Architecture

## Encryption

- S3 Server-Side Encryption (SSE)
- AWS KMS integration
- TLS/HTTPS enforced
- Optional end-to-end encryption

## IAM Best Practices

- Least privilege access
- Role separation
- Scoped permissions
- Service-specific policies

## Monitoring & Logging

- CloudWatch logs
- API monitoring
- Security event tracking
- Audit trail support

---

# Deployment

## Prerequisites

- AWS Account
- AWS CLI configured
- Terraform installed
- Git installed

---

## Clone Repository

```bash
git clone https://github.com/yourusername/securevault-iac.git

cd securevault-iac
```

---

## Configure Variables

```bash
cp terraform.tfvars.example terraform.tfvars
```

Update:

```hcl
aws_region = "ap-northeast-1"
project_name = "securevault"
environment = "dev"
```

---

## Initialize Terraform

```bash
terraform init
```

---

## Validate Configuration

```bash
terraform validate
```

---

## Preview Infrastructure

```bash
terraform plan
```

---

## Deploy Infrastructure

```bash
terraform apply
```

---

# CI/CD Pipeline

Planned CI/CD workflow includes:

- Terraform formatting checks
- Terraform validation
- Security scanning
- Automated deployment
- Infrastructure drift detection

Compatible with:

- GitHub Actions
- AWS CodePipeline
- Jenkins

---

# Future Improvements

- Kubernetes integration
- Multi-region deployment
- Disaster recovery automation
- WAF integration
- Advanced monitoring dashboards
- Automated backups
- Zero Trust architecture
- Infrastructure testing pipeline

---

# Learning Objectives

This project demonstrates practical experience with:

- Cloud Architecture
- Infrastructure as Code
- AWS Serverless Design
- Cloud Security
- DevOps Engineering
- CI/CD Automation
- Monitoring & Observability
- Scalable Distributed Systems

---

# Portfolio Value

SecureVault-IaC is designed as a portfolio-grade cloud engineering project to showcase:

- Real-world AWS architecture
- Production-style infrastructure
- Security-focused engineering
- DevOps automation skills
- Infrastructure design thinking

---

# Screenshots & Diagrams

> Add architecture diagrams, AWS console screenshots, and deployment workflow visuals here.

---

# Author

## Henry HoangQuan Nguyen

International Business IT Student  
Cloud / DevOps Engineer Path  
Japan

### Skills & Focus Areas

- AWS & Cloud Computing
- Infrastructure as Code
- DevOps Automation
- Serverless Architecture
- Cloud Security

---

# Authentication & User Management

## Overview

SecureVault now supports comprehensive multi-user authentication powered by AWS Cognito:

### Features
- **User Registration**: Self-service account creation with email verification
- **Secure Login**: Password-protected access to vault operations
- **Email Verification**: Automatic email confirmation flow after signup
- **Password Reset**: Secure password recovery mechanism
- **Optional MFA**: Multi-factor authentication support for enhanced security
- **JWT Tokens**: Secure token-based API authentication
- **Per-User Data Isolation**: File metadata partitioned by authenticated user

## Frontend Authentication Components

### Available Auth Flows

1. **Login Form** (`LoginForm.jsx`)
   - Email and password-based authentication
   - MFA support when required
   - Links to signup and forgot password flows

2. **Signup Form** (`SignupForm.jsx`)
   - Self-service registration
   - Real-time password strength validation
   - Automatic email verification flow initiation
   - Password confirmation matching

3. **Email Verification** (`EmailVerificationForm.jsx`)
   - 6-digit verification code input
   - Automatic code validation
   - Redirects to login after verification

4. **Password Reset** (`ForgotPasswordForm.jsx`)
   - Email-based password recovery
   - Security code verification
   - New password creation with strength validation

5. **MFA Verification** (`MFAVerificationForm.jsx`)
   - TOTP/SMS code entry
   - Fallback options
   - Seamless integration with login flow

## Password Requirements

Passwords must contain:
- Minimum 8 characters
- Uppercase letter (A-Z)
- Lowercase letter (a-z)
- Number (0-9)
- Special symbol (!@#$%^&*)

The frontend provides real-time validation feedback with visual strength indicators.

## Auth Context Architecture

The `AuthContext.jsx` provides centralized authentication state management:

```javascript
// Available methods
- signup(email, password, confirmPassword)
- confirmEmail(email, code)
- login(email, password)
- respondToMfa(cognitoUser, code, challengeName)
- forgotPassword(email)
- confirmNewPassword(email, code, newPassword)
- logout()
- validateEmail(email)
- validatePassword(password)
```

## Backend Integration

The backend (`backend/server.js`) validates all requests:

```javascript
// All file operations require:
1. Valid JWT token in Authorization header
2. Token issued by configured Cognito User Pool
3. User extracted from token claims (cognito:username)
```

Per-user file isolation ensures users only access their own files:

```javascript
// DynamoDB partition key
partitionKey: `${userId}#${fileId}`
```

## Deployment to Vercel

### Prerequisites
- Vercel account
- GitHub repository connected to Vercel
- AWS Cognito User Pool configured
- Backend API deployed (e.g., AWS Lambda)

### Environment Variables (Required on Vercel)

```env
VITE_API_BASE_URL=https://your-api.example.com
VITE_COGNITO_USER_POOL_ID=ap-northeast-1_xxxxxxxxx
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_AWS_REGION=ap-northeast-1
```

### Deployment Steps

1. **Connect GitHub Repository to Vercel**
   ```bash
   # Visit vercel.com, click "Import Project"
   # Select your GitHub repository
   ```

2. **Configure Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all VITE_* variables listed above
   - Ensure variables are available in "Production"

3. **Configure Build Settings**
   - Framework Preset: `Vite`
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `dist` (auto-detected)
   - Install Command: `npm install` (auto-detected)

4. **Deploy**
   ```bash
   # Push to main/production branch
   git push origin main
   # Vercel automatically deploys
   ```

5. **Verify Deployment**
   - Visit your Vercel deployment URL
   - Test signup and login flows
   - Verify API connectivity
   - Confirm file upload/download functionality

### Build Configuration

The `vercel.json` file in the frontend directory configures Vercel:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

### SPA Rewrite Configuration

Vercel automatically rewrites all non-file routes to `index.html` for Single Page Application (SPA) routing.

## Local Development

### Start Frontend Dev Server

```bash
cd frontend
npm install
npm run dev
```

Server runs on `http://localhost:5173/`

### Start Backend Dev Server

```bash
cd backend
npm install
npm start
```

Backend runs on `http://localhost:3000/`

### Frontend Environment File (`.env`)

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_COGNITO_USER_POOL_ID=your-user-pool-id
VITE_COGNITO_CLIENT_ID=your-client-id
VITE_AWS_REGION=ap-northeast-1
```

## Testing Authentication

### Test Signup Flow
1. Navigate to app
2. Click "Create one" to go to signup
3. Enter email and password (must meet requirements)
4. Submit form
5. Check email for verification code
6. Enter code on verification page
7. Redirected to login

### Test Login Flow
1. Navigate to app
2. Enter registered email
3. Enter password
4. Click "Sign in"
5. Verify JWT token in sessionStorage

### Test Password Reset
1. Click "Forgot your password?"
2. Enter registered email
3. Check email for reset code
4. Enter new password (must meet requirements)
5. Confirm password
6. Redirected to login with new password

### Test MFA (if enabled)
1. Enable MFA in Cognito User Pool
2. User sets up authenticator during signup
3. At login, MFA code is required
4. Enter 6-digit code from authenticator
5. Complete login

## Security Best Practices

- ✅ Passwords validated client and server side
- ✅ JWT tokens stored securely in sessionStorage (not localStorage)
- ✅ All API requests require valid JWT
- ✅ HTTPS enforced (Vercel default)
- ✅ Email verification prevents account takeover
- ✅ Per-user data isolation at database level
- ✅ AWS Cognito handles password hashing/salting
- ✅ Optional MFA provides second factor protection

## Troubleshooting

### "Cognito configuration missing" Error
- Check `.env` file in frontend directory
- Verify `VITE_COGNITO_USER_POOL_ID` and `VITE_COGNITO_CLIENT_ID` are set
- Restart dev server after changing `.env`

### Email verification code not received
- Check email spam/junk folders
- Verify Cognito User Pool email sender configuration
- Ensure email is valid and not already verified

### Login fails with "User not confirmed"
- User must complete email verification first
- Check email for verification code
- If code expired, use "Forgot password?" to get new code

### Password strength validation fails
- Password must meet all 5 requirements
- Check password strength indicator
- Common issues: missing uppercase, lowercase, number, or symbol

### API calls return 401 Unauthorized
- JWT token may have expired (session cleared)
- Re-login to get new token
- Check that API server is running

---

# License

Copyright (c) 2026 Henry HoangQuan Nguyen

All Rights Reserved.

This project and its source code are provided for portfolio and educational
viewing purposes only.

Unauthorized copying, modification, distribution, reproduction, or commercial
usage of this project, in whole or in part, is strictly prohibited without
explicit written permission from the author.

---

# Disclaimer

This project is intended for educational, portfolio, and learning purposes.

Always review AWS security and cost configurations before deploying to production environments.