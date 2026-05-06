resource "aws_dynamodb_table" "securevault_files_metadata" {
  name         = "securevault-iac-dev-files-metadata"
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "userId"
  range_key = "fileId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "fileId"
    type = "S"
  }

  tags = {
    Project     = "SecureVault"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}