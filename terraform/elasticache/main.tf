resource "aws_elasticache_cluster" "hash_cache" {
  cluster_id           = "hash-cache"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis3.2"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [module.vpc.default_security_group_id]
}

resource "aws_elasticache_cluster" "metadata_cache" {
  cluster_id           = "metadata-cache"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis3.2"
  port                 = 6380
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [module.vpc.default_security_group_id]
}

resource "aws_elasticache_subnet_group" "main" {
  name       = "main-subnet-group"
  subnet_ids = module.vpc.private_subnets
}
