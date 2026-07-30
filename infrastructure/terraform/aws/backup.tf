# AWS Backup Vault
resource "aws_backup_vault" "main" {
  provider = aws.primary
  name        = "${local.name_prefix}-backup-vault"
  description = "Backup vault for Al Mokhtabar production"
  kms_key_arn = aws_kms_key.s3.arn

  tags = local.common_tags
}

# Backup Vault notifications
resource "aws_backup_vault_notifications" "main" {
  provider = aws.primary
  backup_vault_name   = aws_backup_vault.main.name
  sns_topic_arn       = aws_sns_topic.alarms.arn
  backup_vault_events = [
    "BACKUP_JOB_STARTED",
    "BACKUP_JOB_COMPLETED",
    "BACKUP_JOB_FAILED",
    "BACKUP_JOB_EXPIRED",
    "RESTORE_JOB_STARTED",
    "RESTORE_JOB_COMPLETED",
    "RESTORE_JOB_FAILED",
    "COPY_JOB_STARTED",
    "COPY_JOB_COMPLETED",
    "COPY_JOB_FAILED",
  ]
}

# Backup Plan
resource "aws_backup_plan" "main" {
  provider = aws.primary
  name = "${local.name_prefix}-backup-plan"

  # Daily backup (35-day retention)
  rule {
    rule_name         = "${local.name_prefix}-daily-backup"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 3 * * ? *)"
    start_window      = 60
    completion_window = 120
    enable_continuous_backup = false

    lifecycle {
      delete_after = 35
    }

    copy_action {
      destination_vault_arn = aws_backup_vault.dr.arn
      lifecycle {
        delete_after = 35
      }
    }

    recovery_point_tags = merge(local.common_tags, {
      Frequency = "Daily"
    })
  }

  # Weekly backup (3-month retention)
  rule {
    rule_name         = "${local.name_prefix}-weekly-backup"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 4 ? * SUN *)"
    start_window      = 60
    completion_window = 120

    lifecycle {
      delete_after = 90
    }

    copy_action {
      destination_vault_arn = aws_backup_vault.dr.arn
      lifecycle {
        delete_after = 90
      }
    }

    recovery_point_tags = merge(local.common_tags, {
      Frequency = "Weekly"
    })
  }

  # Monthly backup (1-year retention)
  rule {
    rule_name         = "${local.name_prefix}-monthly-backup"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 5 1 * ? *)"
    start_window      = 60
    completion_window = 120

    lifecycle {
      delete_after = 365
    }

    copy_action {
      destination_vault_arn = aws_backup_vault.dr.arn
      lifecycle {
        delete_after = 365
      }
    }

    recovery_point_tags = merge(local.common_tags, {
      Frequency = "Monthly"
    })
  }

  tags = local.common_tags
}

# Backup Selection for RDS
resource "aws_backup_selection" "rds" {
  provider = aws.primary
  name         = "${local.name_prefix}-rds-backup-selection"
  plan_id      = aws_backup_plan.main.id
  iam_role_arn = aws_iam_role.backup.arn

  resources = [
    aws_db_instance.primary.arn,
  ]
}

# Backup Selection for EFS
resource "aws_backup_selection" "efs" {
  provider = aws.primary
  name         = "${local.name_prefix}-efs-backup-selection"
  plan_id      = aws_backup_plan.main.id
  iam_role_arn = aws_iam_role.backup.arn

  resources = [
    aws_efs_file_system.main.arn,
  ]
}

# Backup Selection for EBS volumes (by tags)
resource "aws_backup_selection" "ebs" {
  provider = aws.primary
  name         = "${local.name_prefix}-ebs-backup-selection"
  plan_id      = aws_backup_plan.main.id
  iam_role_arn = aws_iam_role.backup.arn

  selection_tag {
    type  = "STRING_EQUALS"
    key   = "Project"
    value = "AlMokhtabar"
  }

  resources = ["*"]
}

# DR backup vault (us-west-2)
resource "aws_backup_vault" "dr" {
  provider = aws.dr
  name        = "${local.name_prefix}-backup-vault-dr"
  description = "DR backup vault for cross-region backup copies"
  kms_key_arn = aws_kms_key.s3_dr.arn

  tags = local.common_tags
}

resource "aws_kms_key" "s3_dr" {
  provider                = aws.dr
  description             = "KMS key for DR backup vault encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = local.common_tags
}
