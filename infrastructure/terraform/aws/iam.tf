# KMS key for SSM parameters and secrets
resource "aws_kms_key" "ssm" {
  provider                = aws.primary
  description             = "KMS key for SSM Parameter Store"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = local.common_tags
}

resource "aws_kms_alias" "ssm" {
  provider      = aws.primary
  name          = "alias/ssm-parameter-key"
  target_key_id = aws_kms_key.ssm.key_id
}

# KMS key for CloudWatch logs
resource "aws_kms_key" "cloudwatch" {
  provider                = aws.primary
  description             = "KMS key for CloudWatch Logs encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = local.common_tags
}

resource "aws_kms_alias" "cloudwatch" {
  provider      = aws.primary
  name          = "alias/cloudwatch-logs-key"
  target_key_id = aws_kms_key.cloudwatch.key_id
}

# IAM role for VPC Flow Logs
data "aws_iam_policy_document" "vpc_flow_logs_assume" {
  provider = aws.primary
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["vpc-flow-logs.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "vpc_flow_logs" {
  provider = aws.primary
  name               = "${local.name_prefix}-vpc-flow-logs-role"
  assume_role_policy = data.aws_iam_policy_document.vpc_flow_logs_assume.json

  tags = local.common_tags
}

resource "aws_iam_role_policy" "vpc_flow_logs" {
  provider = aws.primary
  name  = "${local.name_prefix}-vpc-flow-logs-policy"
  role  = aws_iam_role.vpc_flow_logs.id
  policy = data.aws_iam_policy_document.vpc_flow_logs_policy.json
}

data "aws_iam_policy_document" "vpc_flow_logs_policy" {
  provider = aws.primary
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams",
    ]
    resources = ["*"]
  }
}

# IAM role for Backup
resource "aws_iam_role" "backup" {
  provider = aws.primary
  name               = "${local.name_prefix}-backup-role"
  assume_role_policy = data.aws_iam_policy_document.backup_assume.json

  tags = local.common_tags
}

data "aws_iam_policy_document" "backup_assume" {
  provider = aws.primary
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["backup.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy_attachment" "backup" {
  provider   = aws.primary
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
  role       = aws_iam_role.backup.name
}

resource "aws_iam_role_policy_attachment" "backup_restore" {
  provider   = aws.primary
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores"
  role       = aws_iam_role.backup.name
}

resource "aws_iam_role_policy_attachment" "backup_cw" {
  provider   = aws.primary
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
  role       = aws_iam_role.backup.name
}

# IAM role for CI/CD (GitHub Actions OIDC)
data "aws_iam_policy_document" "github_actions_assume" {
  provider = aws.primary
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/token.actions.githubusercontent.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:almokhtabar/almokhtabar-platform:ref:refs/heads/main"]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "cicd_deploy" {
  provider = aws.primary
  name               = "${local.name_prefix}-cicd-deploy-role"
  description        = "Role for GitHub Actions CI/CD deployments"
  max_session_duration = 3600
  assume_role_policy = data.aws_iam_policy_document.github_actions_assume.json

  tags = local.common_tags
}

resource "aws_iam_role_policy" "cicd_deploy" {
  provider = aws.primary
  name  = "${local.name_prefix}-cicd-deploy-policy"
  role  = aws_iam_role.cicd_deploy.id
  policy = data.aws_iam_policy_document.cicd_deploy_policy.json
}

data "aws_iam_policy_document" "cicd_deploy_policy" {
  provider = aws.primary
  statement {
    effect = "Allow"
    actions = [
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
      "ecr:BatchCheckLayerAvailability",
      "ecr:PutImage",
      "ecr:InitiateLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:CompleteLayerUpload",
      "ecr:GetAuthorizationToken",
    ]
    resources = ["*"]
  }

  statement {
    effect = "Allow"
    actions = [
      "eks:DescribeCluster",
      "eks:UpdateClusterVersion",
      "eks:CreateNodegroup",
      "eks:DescribeNodegroup",
      "eks:DeleteNodegroup",
      "eks:UpdateNodegroupConfig",
      "eks:TagResource",
      "eks:UntagResource",
    ]
    resources = ["arn:aws:eks:*:${data.aws_caller_identity.current.account_id}:cluster/${local.name_prefix}-cluster"]
  }

  statement {
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:GetObject",
      "s3:DeleteObject",
      "s3:ListBucket",
    ]
    resources = [
      "arn:aws:s3:::almokhtabar-terraform-state",
      "arn:aws:s3:::almokhtabar-terraform-state/*",
    ]
  }

  statement {
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:DeleteItem",
      "dynamodb:DescribeTable",
    ]
    resources = ["arn:aws:dynamodb:*:${data.aws_caller_identity.current.account_id}:table/almokhtabar-terraform-locks"]
  }

  statement {
    effect = "Allow"
    actions = [
      "ssm:GetParameter",
      "ssm:GetParameters",
      "ssm:PutParameter",
    ]
    resources = ["arn:aws:ssm:*:${data.aws_caller_identity.current.account_id}:parameter/almokhtabar/*"]
  }

  statement {
    effect = "Allow"
    actions = [
      "kms:Decrypt",
      "kms:Encrypt",
      "kms:GenerateDataKey",
    ]
    resources = ["*"]
  }

  statement {
    effect = "Allow"
    actions = [
      "iam:PassRole",
    ]
    resources = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${local.name_prefix}-*"]
  }
}

# IAM role for Monitoring (CloudWatch agent, Prometheus)
resource "aws_iam_role" "monitoring" {
  provider = aws.primary
  name               = "${local.name_prefix}-monitoring-role"
  description        = "Role for monitoring services (CloudWatch, Prometheus)"
  assume_role_policy = data.aws_iam_policy_document.monitoring_assume.json

  tags = local.common_tags
}

data "aws_iam_policy_document" "monitoring_assume" {
  provider = aws.primary
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.eks.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "${replace(aws_eks_cluster.main.identity[0].oidc[0].issuer, "https://", "")}:sub"
      values   = ["system:serviceaccount:monitoring:prometheus-sa"]
    }
  }
}

resource "aws_iam_role_policy" "monitoring" {
  provider = aws.primary
  name  = "${local.name_prefix}-monitoring-policy"
  role  = aws_iam_role.monitoring.id
  policy = data.aws_iam_policy_document.monitoring_policy.json
}

data "aws_iam_policy_document" "monitoring_policy" {
  provider = aws.primary
  statement {
    effect = "Allow"
    actions = [
      "cloudwatch:PutMetricData",
      "cloudwatch:GetMetricData",
      "cloudwatch:GetMetricStatistics",
      "cloudwatch:ListMetrics",
      "cloudwatch:DescribeAlarms",
    ]
    resources = ["*"]
  }

  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams",
    ]
    resources = ["*"]
  }

  statement {
    effect = "Allow"
    actions = [
      "ec2:DescribeTags",
      "ec2:DescribeInstances",
      "ec2:DescribeVolumes",
    ]
    resources = ["*"]
  }

  statement {
    effect = "Allow"
    actions = [
      "aps:GetMetrics",
      "aps:PutMetrics",
      "aps:RemoteWrite",
    ]
    resources = ["arn:aws:aps:*:${data.aws_caller_identity.current.account_id}:workspace/*"]
  }

  statement {
    effect = "Allow"
    actions = [
      "xray:PutTraceSegments",
      "xray:PutTelemetryRecords",
      "xray:GetTraceSummary",
      "xray:GetServiceGraph",
    ]
    resources = ["*"]
  }
}

# IAM role for Database backup to S3
resource "aws_iam_role" "db_backup" {
  provider = aws.primary
  name               = "${local.name_prefix}-db-backup-role"
  description        = "Role for database backups to S3"
  assume_role_policy = data.aws_iam_policy_document.db_backup_assume.json

  tags = local.common_tags
}

data "aws_iam_policy_document" "db_backup_assume" {
  provider = aws.primary
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["rds.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy" "db_backup" {
  provider = aws.primary
  name  = "${local.name_prefix}-db-backup-policy"
  role  = aws_iam_role.db_backup.id
  policy = data.aws_iam_policy_document.db_backup_policy.json
}

data "aws_iam_policy_document" "db_backup_policy" {
  provider = aws.primary
  statement {
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:GetObject",
      "s3:ListBucket",
      "s3:DeleteObject",
    ]
    resources = [
      "arn:aws:s3:::almokhtabar-backups",
      "arn:aws:s3:::almokhtabar-backups/*",
    ]
  }

  statement {
    effect = "Allow"
    actions = [
      "kms:Decrypt",
      "kms:GenerateDataKey",
    ]
    resources = [aws_kms_key.s3.arn]
  }
}

# IAM role for ALB Ingress Controller
data "aws_iam_policy_document" "alb_ingress_assume" {
  provider = aws.primary
  statement {
    effect = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.eks.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "${replace(aws_eks_cluster.main.identity[0].oidc[0].issuer, "https://", "")}:sub"
      values   = ["system:serviceaccount:kube-system:aws-load-balancer-controller"]
    }
  }
}

resource "aws_iam_role" "alb_ingress" {
  provider = aws.primary
  name               = "${local.name_prefix}-alb-ingress-role"
  assume_role_policy = data.aws_iam_policy_document.alb_ingress_assume.json

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "alb_ingress" {
  provider   = aws.primary
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSLoadBalancingPolicy"
  role       = aws_iam_role.alb_ingress.name
}

resource "aws_iam_role_policy" "alb_ingress_additional" {
  provider = aws.primary
  name  = "${local.name_prefix}-alb-ingress-additional"
  role  = aws_iam_role.alb_ingress.id
  policy = data.aws_iam_policy_document.alb_ingress_additional.json
}

data "aws_iam_policy_document" "alb_ingress_additional" {
  provider = aws.primary
  statement {
    effect = "Allow"
    actions = [
      "ec2:DescribeSubnets",
      "ec2:DescribeVpcs",
      "ec2:DescribeSecurityGroups",
      "ec2:DescribeInstances",
      "ec2:DescribeInternetGateways",
      "ec2:DescribeAccountAttributes",
      "elasticloadbalancing:*",
      "wafv2:GetWebACL",
      "wafv2:AssociateWebACL",
      "wafv2:DisassociateWebACL",
      "acm:DescribeCertificate",
      "acm:ListCertificates",
      "cognito-idp:DescribeUserPoolClient",
    ]
    resources = ["*"]
  }

  statement {
    effect = "Allow"
    actions = [
      "iam:CreateServiceLinkedRole",
    ]
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "iam:AWSServiceName"
      values   = ["elasticloadbalancing.amazonaws.com"]
    }
  }

  statement {
    effect = "Allow"
    actions = [
      "waf-regional:GetWebACLForResource",
      "waf-regional:AssociateWebACL",
      "waf-regional:DisassociateWebACL",
    ]
    resources = ["*"]
  }
}

# SES IAM role
resource "aws_iam_role" "ses" {
  provider = aws.primary
  name               = "${local.name_prefix}-ses-role"
  description        = "Role for SES sending"
  assume_role_policy = data.aws_iam_policy_document.ses_assume.json

  tags = local.common_tags
}

data "aws_iam_policy_document" "ses_assume" {
  provider = aws.primary
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ses.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy" "ses" {
  provider = aws.primary
  name  = "${local.name_prefix}-ses-policy"
  role  = aws_iam_role.ses.id
  policy = data.aws_iam_policy_document.ses_policy.json
}

data "aws_iam_policy_document" "ses_policy" {
  provider = aws.primary
  statement {
    effect = "Allow"
    actions = [
      "ses:SendEmail",
      "ses:SendRawEmail",
      "ses:SendTemplatedEmail",
    ]
    resources = ["*"]
  }
}
