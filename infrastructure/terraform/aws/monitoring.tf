# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  provider = aws.primary
  dashboard_name = "${local.name_prefix}-production"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", { stat = "Average" }],
            ["AWS/ElastiCache", "CPUUtilization", { stat = "Average" }],
            ["AWS/ApplicationELB", "TargetResponseTime", { stat = "p99" }],
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "Production Infrastructure Overview"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", { stat = "Sum" }],
            [".", "HTTPCode_Target_5XX_Count", { stat = "Sum" }],
            [".", "HTTPCode_Target_4XX_Count", { stat = "Sum" }],
          ]
          period = 300
          stat   = "Sum"
          region = "us-east-1"
          title  = "ALB Request Count & Errors"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "DatabaseConnections", { stat = "Average" }],
            [".", "ReadLatency", { stat = "Average" }],
            [".", "WriteLatency", { stat = "Average" }],
          ]
          period = 300
          region = "us-east-1"
          title  = "RDS PostgreSQL Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ElastiCache", "CacheHits", { stat = "Sum" }],
            [".", "CacheMisses", { stat = "Sum" }],
            [".", "CurrConnections", { stat = "Average" }],
          ]
          period = 300
          region = "us-east-1"
          title  = "ElastiCache Redis Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "ActiveConnectionCount", { stat = "Average" }],
            [".", "NewConnectionCount", { stat = "Average" }],
            [".", "RejectedConnectionCount", { stat = "Sum" }],
          ]
          period = 300
          region = "us-east-1"
          title  = "ALB Connection Metrics"
        }
      },
    ]
  })
}

# SNS Topic for alarms
resource "aws_sns_topic" "alarms" {
  provider = aws.primary
  name              = "${local.name_prefix}-alarms"
  display_name      = "Al Mokhtabar Production Alarms"
  kms_master_key_id = aws_kms_key.ssm.arn

  tags = local.common_tags
}

# SNS subscription to Slack (via Lambda)
resource "aws_sns_topic_subscription" "alarms_slack" {
  provider   = aws.primary
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.sns_to_slack.arn
}

# SNS subscription to PagerDuty (via SNS -> PagerDuty)
resource "aws_sns_topic_subscription" "alarms_pagerduty" {
  provider   = aws.primary
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "https"
  endpoint  = "https://events.pagerduty.com/integration/${var.pagerduty_integration_key}/enqueue"
}

# Lambda function to forward SNS to Slack
data "archive_file" "sns_to_slack" {
  provider    = aws.primary
  type        = "zip"
  output_path = "${path.module}/lambda/sns_to_slack.zip"

  source {
    content = <<-EOT
const https = require('https');
const url = require('url');

exports.handler = async (event) => {
  const message = JSON.parse(event.Records[0].Sns.Message);
  const alarmName = message.AlarmName;
  const newState = message.NewStateValue;
  const reason = message.NewStateReason;
  const region = event.Records[0].awsRegion;

  const color = newState === 'ALARM' ? 'danger' : newState === 'OK' ? 'good' : 'warning';

  const slackMessage = {
    channel: '#alarms',
    username: 'AWS CloudWatch',
    icon_emoji: ':aws:',
    attachments: [{
      color: color,
      title: alarmName,
      text: reason,
      fields: [
        { title: 'State', value: newState, short: true },
        { title: 'Region', value: region, short: true }
      ],
      footer: 'Al Mokhtabar Monitoring',
      ts: Math.floor(Date.now() / 1000)
    }]
  };

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  const parsed = url.parse(webhookUrl);

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, res => {
      resolve('OK');
    });
    req.write(JSON.stringify(slackMessage));
    req.end();
  });
};
EOT
    filename = "index.js"
  }
}

resource "aws_lambda_function" "sns_to_slack" {
  provider = aws.primary
  filename         = data.archive_file.sns_to_slack.output_path
  function_name    = "${local.name_prefix}-sns-to-slack"
  role             = aws_iam_role.monitoring.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  timeout          = 10
  memory_size      = 128
  source_code_hash = data.archive_file.sns_to_slack.output_base64sha256

  environment {
    variables = {
      SLACK_WEBHOOK_URL = var.slack_webhook_url
    }
  }

  tags = local.common_tags
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  provider = aws.primary
  alarm_name          = "${local.name_prefix}-rds-high-cpu"
  alarm_description   = "RDS CPU utilization above 80%"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_actions       = [aws_sns_topic.alarms.arn]
  ok_actions          = [aws_sns_topic.alarms.arn]
  insufficient_data_actions = [aws_sns_topic.alarms.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.id
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "rds_connections" {
  provider = aws.primary
  alarm_name          = "${local.name_prefix}-rds-high-connections"
  alarm_description   = "RDS database connections above 150"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 150
  alarm_actions       = [aws_sns_topic.alarms.arn]
  ok_actions          = [aws_sns_topic.alarms.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.id
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "rds_storage" {
  provider = aws.primary
  alarm_name          = "${local.name_prefix}-rds-low-storage"
  alarm_description   = "RDS free storage space below 20%"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 107374182400
  alarm_actions       = [aws_sns_topic.alarms.arn]
  ok_actions          = [aws_sns_topic.alarms.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.id
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  provider = aws.primary
  alarm_name          = "${local.name_prefix}-alb-high-5xx"
  alarm_description   = "ALB 5xx error rate above 1%"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_actions       = [aws_sns_topic.alarms.arn]
  ok_actions          = [aws_sns_topic.alarms.arn]

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "alb_latency" {
  provider = aws.primary
  alarm_name          = "${local.name_prefix}-alb-high-latency"
  alarm_description   = "ALB target response time above 2s"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "p99"
  threshold           = 2
  alarm_actions       = [aws_sns_topic.alarms.arn]
  ok_actions          = [aws_sns_topic.alarms.arn]

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_hosts" {
  provider = aws.primary
  alarm_name          = "${local.name_prefix}-alb-unhealthy-hosts"
  alarm_description   = "ALB has unhealthy target hosts"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Maximum"
  threshold           = 0
  alarm_actions       = [aws_sns_topic.alarms.arn]
  ok_actions          = [aws_sns_topic.alarms.arn]

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
    TargetGroup  = aws_lb_target_group.api.arn_suffix
  }

  tags = local.common_tags
}

# X-Ray Group and Sampling Rule
resource "aws_xray_group" "main" {
  provider = aws.primary
  group_name        = "${local.name_prefix}-xray-group"
  filter_expression = "service(\"backend\") { fault OR error }"

  tags = local.common_tags
}

resource "aws_xray_sampling_rule" "main" {
  provider = aws.primary
  rule_name      = "${local.name_prefix}-sampling-rule"
  priority       = 9999
  reservoir_size = 1
  fixed_rate     = 0.05
  host           = "*"
  http_method    = "*"
  url_path       = "/api/*"
  service_name   = "backend"
  service_type   = "*"

  tags = local.common_tags
}

# Application Load Balancer
resource "aws_lb" "main" {
  provider = aws.primary
  name               = "${local.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection       = true
  enable_http2                     = true
  enable_cross_zone_load_balancing = true
  idle_timeout                     = 60
  ip_address_type                  = "dualstack"

  access_logs {
    bucket  = aws_s3_bucket.logs.id
    prefix  = "alb"
    enabled = true
  }

  tags = local.common_tags
}

resource "aws_security_group" "alb" {
  provider = aws.primary
  name        = "${local.name_prefix}-alb-sg"
  description = "Security group for ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = local.common_tags
}

resource "aws_lb_target_group" "api" {
  provider = aws.primary
  name     = "${local.name_prefix}-api-tg"
  port     = 3001
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 15
    timeout             = 5
    path                = "/api/v1/health"
    port                = 3001
    protocol            = "HTTP"
    matcher             = "200"
  }

  stickiness {
    type = "lb_cookie"
    cookie_duration = 86400
    enabled = true
  }

  tags = local.common_tags
}

resource "aws_lb_listener" "http" {
  provider = aws.primary
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_listener" "https" {
  provider = aws.primary
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate.alb.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}

# ACM certificate for ALB (in us-east-1)
resource "aws_acm_certificate" "alb" {
  provider = aws.primary
  domain_name               = "*.almokhtabar.com"
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = local.common_tags
}
