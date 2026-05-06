output "files_bucket_name" {
  description = "Name of the SecureVault files bucket"
  value       = aws_s3_bucket.securevault_files.bucket
}

output "files_bucket_arn" {
  description = "ARN of the SecureVault files bucket"
  value       = aws_s3_bucket.securevault_files.arn
}

output "files_metadata_table_name" {
  description = "Name of the SecureVault files metadata DynamoDB table"
  value       = aws_dynamodb_table.securevault_files_metadata.name
}

output "files_metadata_table_arn" {
  description = "ARN of the SecureVault files metadata DynamoDB table"
  value       = aws_dynamodb_table.securevault_files_metadata.arn
}
output "cognito_user_pool_id" {
  description = "Cognito User Pool ID for SecureVault users"
  value       = aws_cognito_user_pool.securevault_users.id
}

output "cognito_user_pool_client_id" {
  description = "Cognito App Client ID for SecureVault frontend/backend"
  value       = aws_cognito_user_pool_client.securevault_app_client.id
}
output "backend_ecr_repository_url" {
  description = "ECR repository URL for SecureVault backend Docker image"
  value       = aws_ecr_repository.securevault_backend.repository_url
}
output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.securevault_cluster.name
}

output "ecs_service_name" {
  description = "ECS backend service name"
  value       = aws_ecs_service.securevault_backend_service.name
}