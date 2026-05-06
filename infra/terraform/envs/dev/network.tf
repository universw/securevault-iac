resource "aws_vpc" "securevault_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Project     = "SecureVault"
    Environment = "dev"
    ManagedBy   = "Terraform"
    Name        = "securevault-iac-dev-vpc"
  }
}

resource "aws_subnet" "securevault_public_subnet" {
  vpc_id                  = aws_vpc.securevault_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "ap-northeast-1a"
  map_public_ip_on_launch = true

  tags = {
    Project     = "SecureVault"
    Environment = "dev"
    ManagedBy   = "Terraform"
    Name        = "securevault-iac-dev-public-subnet"
  }
}

resource "aws_internet_gateway" "securevault_igw" {
  vpc_id = aws_vpc.securevault_vpc.id

  tags = {
    Project     = "SecureVault"
    Environment = "dev"
    ManagedBy   = "Terraform"
    Name        = "securevault-iac-dev-igw"
  }
}

resource "aws_route_table" "securevault_public_rt" {
  vpc_id = aws_vpc.securevault_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.securevault_igw.id
  }

  tags = {
    Project     = "SecureVault"
    Environment = "dev"
    ManagedBy   = "Terraform"
    Name        = "securevault-iac-dev-public-rt"
  }
}

resource "aws_route_table_association" "securevault_public_assoc" {
  subnet_id      = aws_subnet.securevault_public_subnet.id
  route_table_id = aws_route_table.securevault_public_rt.id
}

resource "aws_security_group" "securevault_backend_sg" {
  name        = "securevault-iac-dev-backend-sg"
  description = "Allow HTTP access to SecureVault backend"
  vpc_id      = aws_vpc.securevault_vpc.id

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow backend API access"
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
    Name        = "securevault-iac-dev-backend-sg"
  }
}