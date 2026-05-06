resource "aws_apigatewayv2_api" "securevault_http_api" {
  name          = "securevault-iac-dev-http-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = [
      "http://localhost:5173",
      "https://securevault-iac.vercel.app"
    ]

    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["Authorization", "Content-Type"]
    max_age       = 300
  }

  tags = {
    Project     = "SecureVault"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}

resource "aws_apigatewayv2_integration" "securevault_alb_root_integration" {
  api_id                 = aws_apigatewayv2_api.securevault_http_api.id
  integration_type       = "HTTP_PROXY"
  integration_method     = "ANY"
  integration_uri        = "http://${aws_lb.securevault_alb.dns_name}"
  payload_format_version = "1.0"
}

resource "aws_apigatewayv2_integration" "securevault_alb_proxy_integration" {
  api_id                 = aws_apigatewayv2_api.securevault_http_api.id
  integration_type       = "HTTP_PROXY"
  integration_method     = "ANY"
  integration_uri        = "http://${aws_lb.securevault_alb.dns_name}/{proxy}"
  payload_format_version = "1.0"
}

resource "aws_apigatewayv2_route" "securevault_root_route" {
  api_id    = aws_apigatewayv2_api.securevault_http_api.id
  route_key = "ANY /"
  target    = "integrations/${aws_apigatewayv2_integration.securevault_alb_root_integration.id}"
}

resource "aws_apigatewayv2_route" "securevault_proxy_route" {
  api_id    = aws_apigatewayv2_api.securevault_http_api.id
  route_key = "ANY /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.securevault_alb_proxy_integration.id}"
}

resource "aws_apigatewayv2_stage" "securevault_default_stage" {
  api_id      = aws_apigatewayv2_api.securevault_http_api.id
  name        = "$default"
  auto_deploy = true

  tags = {
    Project     = "SecureVault"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}