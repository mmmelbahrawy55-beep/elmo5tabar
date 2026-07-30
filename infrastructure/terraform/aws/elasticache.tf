# KMS key for ElastiCache encryption
resource "aws_kms_key" "elasticache" {
  provider                = aws.primary
  description             = "KMS key for ElastiCache Redis encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = local.common_tags
}

resource "aws_kms_alias" "elasticache" {
  provider      = aws.primary
  name          = "alias/elasticache-encryption-key"
  target_key_id = aws_kms_key.elasticache.key_id
}

# Subnet group
resource "aws_elasticache_subnet_group" "main" {
  provider = aws.primary
  name       = "${local.name_prefix}-redis-subnet-group"
  subnet_ids = aws_subnet.database[*].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-redis-subnet-group"
  })
}

# Parameter group
resource "aws_elasticache_parameter_group" "redis7" {
  provider = aws.primary
  name        = "${local.name_prefix}-redis7-pg"
  family      = "redis7"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  parameter {
    name  = "timeout"
    value = "300"
  }

  parameter {
    name  = "tcp-keepalive"
    value = "300"
  }

  parameter {
    name  = "activerehashing"
    value = "yes"
  }

  parameter {
    name  = "lfu-log-factor"
    value = "10"
  }

  parameter {
    name  = "lfu-decay-time"
    value = "1"
  }

  parameter {
    name  = "notify-keyspace-events"
    value = "Ex"
  }

  tags = local.common_tags
}

# Security group
resource "aws_security_group" "redis" {
  provider    = aws.primary
  name        = "${local.name_prefix}-redis-sg"
  description = "Security group for ElastiCache Redis"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_nodes.id]
    description     = "Redis from EKS nodes"
  }

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    cidr_blocks     = ["10.0.0.0/8"]
    description     = "Redis from VPC"
  }

  tags = local.common_tags
}

# Redis replication group (cluster mode)
resource "aws_elasticache_replication_group" "main" {
  provider = aws.primary
  replication_group_id          = "${local.name_prefix}-redis"
  replication_group_description = "Al Mokhtabar Redis cluster with Multi-AZ"

  engine         = "redis"
  engine_version = "7.1"
  node_type      = "cache.r6g.large"
  port           = 6379

  parameter_group_name = aws_elasticache_parameter_group.redis7.name
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]

  num_cache_clusters = 3

  multi_az_enabled          = true
  automatic_failover_enabled = true

  at_rest_encryption_enabled  = true
  at_rest_encryption_type     = "kms"
  kms_key_id                  = aws_kms_key.elasticache.arn
  transit_encryption_enabled  = true

  snapshot_retention_limit   = 14
  snapshot_window            = "05:00-07:00"
  snapshot_name              = "${local.name_prefix}-redis-snapshot"

  maintenance_window = "sun:06:00-sun:08:00"
  auto_minor_version_upgrade = true

  notification_topic_arn = aws_sns_topic.alarms.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-redis"
  })
}

# SSM parameter for Redis endpoint
resource "aws_ssm_parameter" "redis_endpoint" {
  provider = aws.primary
  name        = "/almokhtabar/production/redis/endpoint"
  description = "ElastiCache Redis primary endpoint"
  type        = "SecureString"
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
  key_id      = aws_kms_key.ssm.arn

  tags = local.common_tags
}

# CloudWatch alarms for Redis
resource "aws_cloudwatch_metric_alarm" "redis_cpu" {
  provider = aws.primary
  alarm_name          = "${local.name_prefix}-redis-high-cpu"
  alarm_description   = "Redis CPU utilization above 80%"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_actions       = [aws_sns_topic.alarms.arn]
  ok_actions          = [aws_sns_topic.alarms.arn]

  dimensions = {
    CacheClusterId = "${local.name_prefix}-redis-001"
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "redis_memory" {
  provider = aws.primary
  alarm_name          = "${local.name_prefix}-redis-high-memory"
  alarm_description   = "Redis memory usage above 80%"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseMemoryUsagePercentage"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_actions       = [aws_sns_topic.alarms.arn]
  ok_actions          = [aws_sns_topic.alarms.arn]

  dimensions = {
    CacheClusterId = "${local.name_prefix}-redis-001"
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "redis_curr_connections" {
  provider = aws.primary
  alarm_name          = "${local.name_prefix}-redis-high-connections"
  alarm_description   = "Redis high connection count"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CurrConnections"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = 500
  alarm_actions       = [aws_sns_topic.alarms.arn]
  ok_actions          = [aws_sns_topic.alarms.arn]

  dimensions = {
    CacheClusterId = "${local.name_prefix}-redis-001"
  }

  tags = local.common_tags
}
