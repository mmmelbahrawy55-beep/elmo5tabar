# SES Domain Identity
resource "aws_ses_domain_identity" "main" {
  provider = aws.primary
  domain = "almokhtabar.com"
}

resource "aws_ses_domain_dkim" "main" {
  provider = aws.primary
  domain = aws_ses_domain_identity.main.domain
}

resource "aws_ses_domain_mail_from" "main" {
  provider = aws.primary
  domain           = aws_ses_domain_identity.main.domain
  mail_from_domain = "bounce.almokhtabar.com"
}

# SSM Parameters for infrastructure
resource "aws_ssm_parameter" "cloudfront_domain" {
  provider = aws.primary
  name        = "/almokhtabar/production/cloudfront/domain"
  type        = "String"
  value       = aws_cloudfront_distribution.main.domain_name
  key_id      = aws_kms_key.ssm.arn
  tags        = local.common_tags
}

resource "aws_ssm_parameter" "alb_dns" {
  provider = aws.primary
  name        = "/almokhtabar/production/alb/dns"
  type        = "String"
  value       = aws_lb.main.dns_name
  key_id      = aws_kms_key.ssm.arn
  tags        = local.common_tags
}

resource "aws_ssm_parameter" "eks_cluster_endpoint" {
  provider = aws.primary
  name        = "/almokhtabar/production/eks/endpoint"
  type        = "SecureString"
  value       = aws_eks_cluster.main.endpoint
  key_id      = aws_kms_key.ssm.arn
  tags        = local.common_tags
}

resource "aws_ssm_parameter" "sns_topic_arn" {
  provider = aws.primary
  name        = "/almokhtabar/production/sns/alarms"
  type        = "String"
  value       = aws_sns_topic.alarms.arn
  tags        = local.common_tags
}

# Security Hub integration
resource "aws_securityhub_account" "main" {
  provider = aws.primary
  enable_default_standards = true
  control_finding_generator = "STANDARD_CONTROL"
}

resource "aws_securityhub_standards_subscription" "cis" {
  provider      = aws.primary
  standards_arn = "arn:aws:securityhub:us-east-1::standards/cis-aws-foundations-benchmark/v/1.4.0"
}

resource "aws_securityhub_standards_subscription" "pci" {
  provider      = aws.primary
  standards_arn = "arn:aws:securityhub:us-east-1::standards/pci-dss/v/3.2.1"
}
