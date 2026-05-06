resource "aws_cognito_user_pool" "securevault_users" {
  name = "securevault-iac-dev-users"

  username_attributes = ["email"]

  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }

  tags = {
    Project     = "SecureVault"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}

resource "aws_cognito_user_pool_client" "securevault_app_client" {
  name         = "securevault-iac-dev-app-client"
  user_pool_id = aws_cognito_user_pool.securevault_users.id

  generate_secret = false

  prevent_user_existence_errors = "ENABLED"

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]
}
