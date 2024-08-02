output "vpc_id" {
  value = module.vpc.vpc_id
}

output "ecs_cluster_id" {
  value = module.ecs.ecs_cluster_id
}

output "rds_endpoint" {
  value = module.rds.rds_endpoint
}

output "elasticache_endpoint" {
  value = module.elasticache.elasticache_endpoint
}

output "s3_bucket_name" {
  value = module.s3.bucket_name
}
