resource "aws_security_group" "securevault_alb_sg" {
  name        = "securevault-iac-dev-alb-sg"
  description = "Allow HTTP access to ALB"
  vpc_id      = aws_vpc.securevault_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTP traffic"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow outbound traffic"
  }

  tags = {
    Project     = "SecureVault"
    Environment = "dev"
    ManagedBy   = "Terraform"
    Name        = "securevault-iac-dev-alb-sg"
  }
}

resource "aws_lb" "securevault_alb" {
  name               = "securevault-iac-dev-alb"
  load_balancer_type = "application"

  subnets = [
    aws_subnet.securevault_public_subnet.id,
    aws_subnet.securevault_public_subnet_2.id
  ]

  security_groups = [aws_security_group.securevault_alb_sg.id]

  tags = {
    Project     = "SecureVault"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}

resource "aws_lb_target_group" "securevault_backend_tg" {
  name        = "securevault-iac-dev-backend-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.securevault_vpc.id
  target_type = "ip"

  health_check {
    path                = "/health"
    protocol            = "HTTP"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }

  tags = {
    Project     = "SecureVault"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}

resource "aws_lb_listener" "securevault_http_listener" {
  load_balancer_arn = aws_lb.securevault_alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.securevault_backend_tg.arn
  }
}