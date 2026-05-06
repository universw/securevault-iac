terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

resource "aws_s3_bucket" "securevault_files" {
  bucket = var.files_bucket_name

  tags = {
    Project     = "SecureVault"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}

resource "aws_s3_bucket_public_access_block" "securevault_files" {
  bucket = aws_s3_bucket.securevault_files.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "securevault_files" {
  bucket = aws_s3_bucket.securevault_files.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "securevault_files" {
  bucket = aws_s3_bucket.securevault_files.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "securevault_files" {
  bucket = aws_s3_bucket.securevault_files.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_cors_configuration" "securevault_files_cors" {
  bucket = aws_s3_bucket.securevault_files.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = [
      "http://localhost:5173",
      "https://securevault-iac.vercel.app"
    ]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_policy" "securevault_files_tls_only" {
  bucket = aws_s3_bucket.securevault_files.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.securevault_files.arn,
          "${aws_s3_bucket.securevault_files.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}
