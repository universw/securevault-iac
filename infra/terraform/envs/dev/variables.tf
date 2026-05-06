variable "aws_region" {
  description = "AWS region for SecureVault dev environment"
  type        = string
  default     = "ap-northeast-1"
}

variable "files_bucket_name" {
  description = "S3 bucket name for encrypted SecureVault files"
  type        = string
  default     = "securevault-iac-dev-files-henry-001"
}