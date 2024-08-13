# Outputs
output "api_load_balancer_dns" {
  description = "DNS name of the API load balancer"
  value       = aws_lb.api_load_balancer.dns_name
}

output "s3_load_balancer_dns" {
  description = "DNS name of the S3 load balancer"
  value       = aws_lb.s3_load_balancer.dns_name
}
