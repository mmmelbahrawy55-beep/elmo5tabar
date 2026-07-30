locals {
  db_name     = "almokhtabar"
  db_username = "almokhtabar_admin"
}

# KMS key for RDS encryption
resource "aws_kms_key" "rds" {
  provider                = aws.primary
  description             = "KMS CMK for RDS encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = local.common_tags
}

resource "aws_kms_alias" "rds" {
  provider      = aws.primary
  name          = "alias/rds-encryption-key"
  target_key_id = aws_kms_key.rds.key_id
}

# DB subnet group
resource "aws_db_subnet_group" "main" {
  provider   = aws.primary
  name       = "${local.name_prefix}-db-subnet-group"
  subnet_ids = aws_subnet.database[*].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-group"
  })
}

# Parameter group
resource "aws_db_parameter_group" "postgres16" {
  provider = aws.primary
  name        = "${local.name_prefix}-postgres16-pg"
  family      = "postgres16"
  description = "Custom parameter group for PostgreSQL 16"

  parameter {
    name         = "shared_buffers"
    value        = "{DBInstanceClassMemory*3/4}"
    apply_method = "pending-reboot"
  }

  parameter {
    name         = "effective_cache_size"
    value        = "{DBInstanceClassMemory*3/4}"
    apply_method = "pending-reboot"
  }

  parameter {
    name         = "maintenance_work_mem"
    value        = "{DBInstanceClassMemory*1/16}"
    apply_method = "pending-reboot"
  }

  parameter {
    name         = "checkpoint_completion_target"
    value        = "0.9"
    apply_method = "pending-reboot"
  }

  parameter {
    name         = "wal_buffers"
    value        = "{DBInstanceClassMemory*1/128}"
    apply_method = "pending-reboot"
  }

  parameter {
    name         = "default_statistics_target"
    value        = "100"
    apply_method = "pending-reboot"
  }

  parameter {
    name         = "random_page_cost"
    value        = "1.1"
    apply_method = "immediate"
  }

  parameter {
    name         = "effective_io_concurrency"
    value        = "200"
    apply_method = "immediate"
  }

  parameter {
    name         = "work_mem"
    value        = "65536"
    apply_method = "immediate"
  }

  parameter {
    name         = "max_connections"
    value        = "200"
    apply_method = "immediate"
  }

  parameter {
    name         = "log_min_duration_statement"
    value        = "1000"
    apply_method = "immediate"
  }

  parameter {
    name         = "log_connections"
    value        = "1"
    apply_method = "immediate"
  }

  parameter {
    name         = "log_disconnections"
    value        = "1"
    apply_method = "immediate"
  }

  parameter {
    name         = "log_checkpoints"
    value        = "1"
    apply_method = "immediate"
  }

  parameter {
    name         = "log_lock_waits"
    value        = "1"
    apply_method = "immediate"
  }

  parameter {
    name         = "log_autovacuum_min_duration"
    value        = "1000"
    apply_method = "immediate"
  }

  parameter {
    name         = "auto_vacuum"
    value        = "1"
    apply_method = "pending-reboot"
  }

  parameter {
    name         = "autovacuum_vacuum_scale_factor"
    value        = "0.01"
    apply_method = "immediate"
  }

  parameter {
    name         = "autovacuum_analyze_scale_factor"
    value        = "0.05"
    apply_method = "immediate"
  }

  parameter {
    name         = "idle_in_transaction_session_timeout"
    value        = "300000"
    apply_method = "immediate"
  }

  parameter {
    name         = "statement_timeout"
    value        = "60000"
    apply_method = "immediate"
  }

  parameter {
    name         = "password_encryption"
    value        = "scram-sha-256"
    apply_method = "immediate"
  }

  parameter {
    name         = "ssl"
    value        = "1"
    apply_method = "immediate"
  }

  parameter {
    name         = "rds.force_ssl"
    value        = "1"
    apply_method = "immediate"
  }

  tags = local.common_tags
}

# Option group
resource "aws_db_option_group" "postgres16" {
  provider = aws.primary
  name                     = "${local.name_prefix}-postgres16-og"
  engine_name              = "postgres"
  major_engine_version     = "16"

  tags = local.common_tags
}

# CloudWatch log group for RDS logs
resource "aws_cloudwatch_log_group" "rds_postgres" {
  provider = aws.primary
  name              = "/aws/rds/almokhtabar/postgres"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.cloudwatch.arn

  tags = local.common_tags
}

# Security group for RDS
resource "aws_security_group" "rds" {
  provider    = aws.primary
  name        = "${local.name_prefix}-rds-sg"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_nodes.id]
    description     = "PostgreSQL from EKS nodes"
  }

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    cidr_blocks     = ["10.0.0.0/8"]
    description     = "PostgreSQL from VPC"
  }

  tags = local.common_tags
}

# Primary RDS instance
resource "aws_db_instance" "primary" {
  provider = aws.primary
  identifier = "${local.name_prefix}-postgres"

  engine         = "postgres"
  engine_version = "16.3"
  engine_version_actual = "16.3"

  instance_class    = "db.r6g.large"
  allocated_storage = 500
  storage_type      = "gp3"
  iops              = 3000
  storage_throughput = 125
  max_allocated_storage = 1000

  db_name  = local.db_name
  username = local.db_username
  password = random_password.rds.result
  port     = 5432

  db_subnet_group_name   = aws_db_subnet_group.main.name
  parameter_group_name   = aws_db_parameter_group.postgres16.name
  option_group_name      = aws_db_option_group.postgres16.name

  vpc_security_group_ids = [aws_security_group.rds.id]

  multi_az = true

  backup_retention_period = 35
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:06:00"
  copy_tags_to_snapshot   = true
  delete_automated_backups = false
  deletion_protection      = true
  skip_final_snapshot      = false
  final_snapshot_identifier = "${local.name_prefix}-postgres-final-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  storage_encrypted = true
  kms_key_id        = aws_kms_key.rds.arn

  auto_minor_version_upgrade = false
  allow_major_version_upgrade = false
  apply_immediately          = false

  performance_insights_enabled          = true
  performance_insights_retention_period = 7
  performance_insights_kms_key_id       = aws_kms_key.rds.arn

  enabled_cloudwatch_logs_exports = [
    "postgresql",
    "upgrade",
  ]

  monitoring_interval = 15
  monitoring_role_arn = aws_iam_role.rds_enhanced_monitoring.arn

  ca_cert_identifier = "rds-ca-rsa2048-g1"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-postgres-primary"
  })
}

# Read replica in DR region
resource "aws_db_instance" "dr_replica" {
  provider = aws.dr
  identifier = "${local.name_prefix}-postgres-dr"

  instance_class = "db.r6g.large"

  replicate_source_db = aws_db_instance.primary.arn

  vpc_security_group_ids = [aws_security_group.rds_dr.id]
  db_subnet_group_name   = aws_db_subnet_group.dr.name

  backup_retention_period = 35
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:06:00"
  copy_tags_to_snapshot   = true
  deletion_protection     = true
  skip_final_snapshot     = true

  storage_encrypted = true

  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  monitoring_interval = 15
  monitoring_role_arn = aws_iam_role.rds_enhanced_monitoring_dr.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-postgres-dr"
  })
}

# Random password
resource "random_password" "rds" {
  length  = 32
  special = false
}

# IAM role for enhanced monitoring
data "aws_iam_policy_document" "rds_monitoring_assume" {
  provider = aws.primary
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["monitoring.rds.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "rds_enhanced_monitoring" {
  provider = aws.primary
  name     = "${local.name_prefix}-rds-monitoring-role"
  assume_role_policy = data.aws_iam_policy_document.rds_monitoring_assume.json

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  provider   = aws.primary
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
  role       = aws_iam_role.rds_enhanced_monitoring.name
}

resource "aws_iam_role" "rds_enhanced_monitoring_dr" {
  provider = aws.dr
  name     = "${local.name_prefix}-rds-monitoring-role-dr"
  assume_role_policy = data.aws_iam_policy_document.rds_monitoring_assume.json

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring_dr" {
  provider   = aws.dr
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
  role       = aws_iam_role.rds_enhanced_monitoring_dr.name
}

# SSM parameter store for credentials
resource "aws_ssm_parameter" "rds_password" {
  provider = aws.primary
  name        = "/almokhtabar/production/rds/password"
  description = "RDS PostgreSQL password"
  type        = "SecureString"
  value       = random_password.rds.result
  key_id      = aws_kms_key.ssm.arn

  tags = local.common_tags
}

resource "aws_ssm_parameter" "rds_connection_string" {
  provider = aws.primary
  name        = "/almokhtabar/production/rds/connection_string"
  description = "RDS PostgreSQL connection string"
  type        = "SecureString"
  value       = "postgresql://${local.db_username}:${random_password.rds.result}@${aws_db_instance.primary.endpoint}/${local.db_name}?sslmode=require"
  key_id      = aws_kms_key.ssm.arn

  tags = local.common_tags
}

# Outputs
output "rds_endpoint" {
  value = aws_db_instance.primary.endpoint
}

output "rds_password_ssm" {
  value = "/almokhtabar/production/rds/password"
}
