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