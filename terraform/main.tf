provider "aws" {
  region = "eu-central-1"
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index)
  map_public_ip_on_launch = true
  availability_zone       = element(data.aws_availability_zones.available.names, count.index)
}

data "aws_availability_zones" "available" {}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Database Subnet Group
resource "aws_db_subnet_group" "main" {
  name        = "main-db-subnet-group"
  subnet_ids  = aws_subnet.public.*.id
  description = "Main subnet group for RDS instances"
}

# ECR Repositories
resource "aws_ecr_repository" "api_service" {
  name = "671552989076.dkr.ecr.eu-central-1.amazonaws.com/public.ecr.aws/m5c8p2y7/paste-bin-api-service"
}

resource "aws_ecr_repository" "hash_service" {
  name = "671552989076.dkr.ecr.eu-central-1.amazonaws.com/public.ecr.aws/m5c8p2y7/paste-bin-hash-service"
}

# S3 Bucket
resource "aws_s3_bucket" "s3_bucket" {
  bucket = "pastebinbucketspetsar"
}

# RDS Instances
resource "aws_db_instance" "metadata_db" {
  allocated_storage      = 20
  storage_type           = "gp2"
  engine                 = "postgres"
  instance_class         = "db.t3.micro"
  db_name                = "metadata_db"
  username               = "metadata_db_user"
  password               = "metadata_db_password"
  parameter_group_name   = "default.postgres16" # Update to the correct parameter group
  skip_final_snapshot    = true
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
}

resource "aws_db_instance" "hash_db" {
  allocated_storage      = 20
  storage_type           = "gp2"
  engine                 = "postgres"
  instance_class         = "db.t3.micro"
  db_name                = "hash_db"
  username               = "hash_db_user"
  password               = "hash_db_password"
  parameter_group_name   = "default.postgres16" # Update to the correct parameter group
  skip_final_snapshot    = true
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
}

# ElastiCache Redis Clusters
resource "aws_elasticache_subnet_group" "main" {
  name       = "redis-subnet-group"
  subnet_ids = aws_subnet.public.*.id
}

resource "aws_elasticache_cluster" "block_cache_redis" {
  cluster_id         = "block-cache-redis"
  node_type          = "cache.t3.micro"
  num_cache_nodes    = 1
  engine             = "redis"
  security_group_ids = [aws_security_group.redis_sg.id]
  subnet_group_name  = aws_elasticache_subnet_group.main.name
}

resource "aws_elasticache_cluster" "metadata_cache_redis" {
  cluster_id         = "metadata-cache-redis"
  node_type          = "cache.t3.micro"
  num_cache_nodes    = 1
  engine             = "redis"
  security_group_ids = [aws_security_group.redis_sg.id]
  subnet_group_name  = aws_elasticache_subnet_group.main.name
}

resource "aws_elasticache_cluster" "hash_redis" {
  cluster_id         = "hash-redis"
  node_type          = "cache.t3.micro"
  num_cache_nodes    = 1
  engine             = "redis"
  security_group_ids = [aws_security_group.redis_sg.id]
  subnet_group_name  = aws_elasticache_subnet_group.main.name
}

# ECS Cluster
resource "aws_ecs_cluster" "main_cluster" {
  name = "main-cluster"
}

# Load Balancers
resource "aws_lb" "api_load_balancer" {
  name               = "api-load-balancer"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.lb_sg.id]
  subnets            = aws_subnet.public.*.id
}

resource "aws_lb" "s3_load_balancer" {
  name               = "s3-load-balancer"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.lb_sg.id]
  subnets            = aws_subnet.public.*.id
}

# Security Groups
resource "aws_security_group" "db_sg" {
  name        = "db_sg"
  description = "Allow inbound traffic for RDS instances"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "redis_sg" {
  name        = "redis_sg"
  description = "Allow inbound traffic for Redis clusters"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "lb_sg" {
  name        = "lb_sg"
  description = "Allow inbound traffic for load balancers"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ECS Task Definitions
resource "aws_ecs_task_definition" "api_service_task" {
  family = "api-service-task"
  container_definitions = jsonencode([{
    name      = "api-service"
    image     = "${aws_ecr_repository.api_service.repository_url}:latest"
    memory    = 512
    cpu       = 256
    essential = true
    portMappings = [{
      containerPort = 3000
      hostPort      = 3000
    }]
  }])
}

resource "aws_ecs_task_definition" "hash_service_task" {
  family = "hash-service-task"
  container_definitions = jsonencode([{
    name      = "hash-service"
    image     = "${aws_ecr_repository.hash_service.repository_url}:latest"
    memory    = 512
    cpu       = 256
    essential = true
    portMappings = [{
      containerPort = 3000
      hostPort      = 3000
    }]
  }])
}

# ECS Services
resource "aws_ecs_service" "api_service" {
  name            = "api-service"
  cluster         = aws_ecs_cluster.main_cluster.id
  task_definition = aws_ecs_task_definition.api_service_task.arn
  desired_count   = 2
  load_balancer {
    target_group_arn = aws_lb_target_group.api_target_group.arn
    container_name   = "api-service"
    container_port   = 3000
  }
}

resource "aws_ecs_service" "hash_service" {
  name            = "hash-service"
  cluster         = aws_ecs_cluster.main_cluster.id
  task_definition = aws_ecs_task_definition.hash_service_task.arn
  desired_count   = 1
  load_balancer {
    target_group_arn = aws_lb_target_group.hash_target_group.arn
    container_name   = "hash-service"
    container_port   = 3000
  }
}

# Target Groups
resource "aws_lb_target_group" "api_target_group" {
  name     = "api-target-group"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
}

resource "aws_lb_target_group" "hash_target_group" {
  name     = "hash-target-group"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
}

# ALB Listeners
resource "aws_lb_listener" "api_listener" {
  load_balancer_arn = aws_lb.api_load_balancer.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api_target_group.arn
  }
}

resource "aws_lb_listener" "hash_listener" {
  load_balancer_arn = aws_lb.s3_load_balancer.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.hash_target_group.arn
  }
}
