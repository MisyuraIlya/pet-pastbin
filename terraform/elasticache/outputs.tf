output "elasticache_endpoint" {
  value = aws_elasticache_cluster.hash_cache.configuration_endpoint_address
}
