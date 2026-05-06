resource "aws_ecr_repository" "securevault_backend" {
  name = "securevault-iac-dev-backend"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Project     = "SecureVault"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}