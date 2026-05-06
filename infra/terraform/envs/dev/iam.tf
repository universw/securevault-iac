resource "aws_iam_policy" "securevault_backend_policy" {
  name        = "securevault-iac-dev-backend-policy"
  description = "Allows SecureVault backend to access S3 and DynamoDB"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.securevault_files.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:DeleteItem",
          "dynamodb:UpdateItem"
        ]
        Resource = aws_dynamodb_table.securevault_files_metadata.arn
      }
    ]
  })
}
resource "aws_iam_role" "securevault_backend_task_role" {
  name = "securevault-iac-dev-backend-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role" "securevault_backend_execution_role" {
  name = "securevault-iac-dev-backend-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "securevault_backend_policy_attachment" {
  role       = aws_iam_role.securevault_backend_task_role.name
  policy_arn = aws_iam_policy.securevault_backend_policy.arn
}
resource "aws_iam_role_policy_attachment" "securevault_ecs_execution_policy_attachment" {
  role       = aws_iam_role.securevault_backend_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}
