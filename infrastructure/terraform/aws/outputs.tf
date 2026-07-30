output "vpc_id" {
  description = "Primary VPC ID"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "Primary VPC CIDR"
  value       = aws_vpc.main.cidr_block
}

output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = aws_eks_cluster.main.name
}

output "eks_cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = aws_eks_cluster.main.endpoint
}

output "rds_endpoint" {
  description = "RDS primary endpoint"
  value       = aws_db_instance.primary.endpoint
}

output "redis_endpoint" {
  description = "Redis primary endpoint"
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
}

output "cloudfront_domain" {
  description = "CloudFront distribution domain"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "route53_zone_id" {
  description = "Route53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "waf_acl_id" {
  description = "WAF Web ACL ID"
  value       = aws_wafv2_web_acl.main.id
}

output "backup_vault_arn" {
  description = "Backup vault ARN"
  value       = aws_backup_vault.main.arn
}

output "sns_topic_arn" {
  description = "SNS topic for alarms"
  value       = aws_sns_topic.alarms.arn
}

output "dr_vpc_id" {
  description = "DR VPC ID"
  value       = aws_vpc.dr.id
}

output "oidc_provider_arn" {
  description = "EKS OIDC provider ARN"
  value       = aws_iam_openid_connect_provider.eks.arn
}

output "monitoring_role_arn" {
  description = "Monitoring IAM role ARN"
  value       = aws_iam_role.monitoring.arn
}

output "cicd_role_arn" {
  description = "CI/CD deploy role ARN"
  value       = aws_iam_role.cicd_deploy.arn
}

output "terraform_state_bucket" {
  description = "Terraform state S3 bucket"
  value       = aws_s3_bucket.terraform_state.id
}

output "terraform_locks_table" {
  description = "Terraform state lock DynamoDB table"
  value       = aws_dynamodb_table.terraform_locks.name
}
