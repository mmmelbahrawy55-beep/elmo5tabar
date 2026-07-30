resource "aws_kms_key" "this" {
  description             = "KMS CMK for RDS encryption - ${var.identifier}"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  tags                    = var.tags
}

resource "aws_kms_alias" "this" {
  name          = "alias/${var.identifier}-key"
  target_key_id = aws_kms_key.this.key_id
}

resource "aws_db_subnet_group" "this" {
  name       = "${var.identifier}-subnet-group"
  subnet_ids = var.subnet_ids
  tags       = var.tags
}

resource "aws_db_parameter_group" "this" {
  name        = "${var.identifier}-pg"
  family      = var.parameter_group_family
  description = "Custom parameter group for ${var.engine} ${var.engine_version}"

  dynamic "parameter" {
    for_each = var.parameters
    content {
      name         = parameter.value.name
      value        = parameter.value.value
      apply_method = lookup(parameter.value, "apply_method", "immediate")
    }
  }

  tags = var.tags
}

resource "aws_db_option_group" "this" {
  name                 = "${var.identifier}-og"
  engine_name          = var.engine
  major_engine_version = var.major_engine_version
  tags                 = var.tags
}

resource "aws_security_group" "this" {
  name        = "${var.identifier}-sg"
  description = "Security group for ${var.identifier} RDS"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = var.port
    to_port         = var.port
    protocol        = "tcp"
    security_groups = var.allowed_security_group_ids
    description     = "Database access from application"
  }

  ingress {
    from_port       = var.port
    to_port         = var.port
    protocol        = "tcp"
    cidr_blocks     = var.allowed_cidr_blocks
    description     = "Database access from VPC"
  }

  tags = var.tags
}

resource "aws_db_instance" "this" {
  identifier = var.identifier

  engine         = var.engine
  engine_version = var.engine_version
  instance_class = var.instance_class

  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = var.storage_type
  iops                  = var.iops
  storage_throughput    = var.storage_throughput

  db_name  = var.database_name
  username = var.master_username
  password = random_password.this.result
  port     = var.port

  db_subnet_group_name   = aws_db_subnet_group.this.name
  parameter_group_name   = aws_db_parameter_group.this.name
  option_group_name      = aws_db_option_group.this.name
  vpc_security_group_ids = [aws_security_group.this.id]

  multi_az = var.multi_az

  backup_retention_period = var.backup_retention_period
  backup_window           = var.backup_window
  maintenance_window      = var.maintenance_window
  copy_tags_to_snapshot   = true
  delete_automated_backups = false
  deletion_protection      = var.deletion_protection
  skip_final_snapshot      = !var.create_final_snapshot
  final_snapshot_identifier = var.create_final_snapshot ? "${var.identifier}-final-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null

  storage_encrypted = true
  kms_key_id        = aws_kms_key.this.arn

  auto_minor_version_upgrade  = var.auto_minor_version_upgrade
  allow_major_version_upgrade = false
  apply_immediately           = false

  performance_insights_enabled          = var.performance_insights_enabled
  performance_insights_retention_period = var.performance_insights_retention_period
  performance_insights_kms_key_id       = aws_kms_key.this.arn

  enabled_cloudwatch_logs_exports = var.cloudwatch_log_exports

  monitoring_interval = var.monitoring_interval
  monitoring_role_arn = var.monitoring_role_arn

  ca_cert_identifier = var.ca_cert_identifier

  tags = var.tags
}

resource "random_password" "this" {
  length  = 32
  special = false
}

resource "aws_ssm_parameter" "password" {
  count = var.store_in_ssm ? 1 : 0
  name        = "/${var.ssm_path_prefix}/${var.identifier}/password"
  description = "RDS ${var.identifier} password"
  type        = "SecureString"
  value       = random_password.this.result
  key_id      = var.ssm_kms_key_id
  tags        = var.tags
}

resource "aws_ssm_parameter" "connection_string" {
  count = var.store_in_ssm ? 1 : 0
  name        = "/${var.ssm_path_prefix}/${var.identifier}/connection_string"
  description = "RDS ${var.identifier} connection string"
  type        = "SecureString"
  value       = "${var.engine}://${var.master_username}:${random_password.this.result}@${aws_db_instance.this.endpoint}/${var.database_name}?sslmode=require"
  key_id      = var.ssm_kms_key_id
  tags        = var.tags
}
