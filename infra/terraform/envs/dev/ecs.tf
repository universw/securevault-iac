resource "aws_ecs_cluster" "securevault_cluster" {
  name = "securevault-iac-dev-cluster"

  tags = {
    Project     = "SecureVault"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}

resource "aws_cloudwatch_log_group" "securevault_backend_logs" {
  name              = "/ecs/securevault-backend"
  retention_in_days = 7
}

resource "aws_ecs_task_definition" "securevault_backend_task" {
  family                   = "securevault-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]

  cpu    = "256"
  memory = "512"

  execution_role_arn = aws_iam_role.securevault_backend_task_role.arn
  task_role_arn      = aws_iam_role.securevault_backend_task_role.arn

  container_definitions = jsonencode([
    {
      name  = "securevault-backend"
      image = "${aws_ecr_repository.securevault_backend.repository_url}:latest"

      essential = true

      environment = [
        {
          name  = "AWS_REGION"
          value = var.aws_region
        },
        {
          name  = "FILES_BUCKET"
          value = aws_s3_bucket.securevault_files.bucket
        },
        {
          name  = "FILES_TABLE"
          value = aws_dynamodb_table.securevault_files_metadata.name
        },
        {
          name  = "NODE_ENV"
          value = "dev"
        }
      ]

      portMappings = [
        {
          containerPort = 3000
          hostPort      = 3000
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"

        options = {
          awslogs-group         = aws_cloudwatch_log_group.securevault_backend_logs.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "securevault_backend_service" {
  name            = "securevault-iac-dev-backend-service"
  cluster         = aws_ecs_cluster.securevault_cluster.id
  task_definition = aws_ecs_task_definition.securevault_backend_task.arn
  launch_type     = "FARGATE"

  desired_count = 1

  network_configuration {
    subnets          = [aws_subnet.securevault_public_subnet.id]
    security_groups  = [aws_security_group.securevault_backend_sg.id]
    assign_public_ip = true
  }

  tags = {
    Project     = "SecureVault"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}