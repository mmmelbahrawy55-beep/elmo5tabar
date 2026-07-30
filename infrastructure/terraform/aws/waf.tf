# WAFv2 Web ACL for CloudFront
resource "aws_wafv2_web_acl" "main" {
  provider = aws.primary
  name        = "${local.name_prefix}-waf-web-acl"
  description = "WAF Web ACL for Al Mokhtabar CloudFront"
  scope       = "CLOUDFRONT"

  default_action {
    allow {}
  }

  # Rate-based rule
  rule {
    name     = "rate-limit"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "RateLimitRule"
      sampled_requests_enabled  = true
    }
  }

  # AWS Managed Rules - Core Rule Set (OWASP Top 10)
  rule {
    name     = "aws-managed-core-rule-set"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"

        rule_action_override {
          name = "SizeRestrictions_BODY"
          action_to_use {
            count {}
          }
        }

        rule_action_override {
          name = "NoUserAgent_HEADER"
          action_to_use {
            count {}
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "AWSManagedCoreRuleSet"
      sampled_requests_enabled  = true
    }
  }

  # SQL injection protection
  rule {
    name     = "sql-injection-protection"
    priority = 3

    action {
      block {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "SQLInjectionRule"
      sampled_requests_enabled  = true
    }
  }

  # XSS protection
  rule {
    name     = "xss-protection"
    priority = 4

    action {
      block {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "XSSRule"
      sampled_requests_enabled  = true
    }
  }

  # IP reputation lists
  rule {
    name     = "ip-reputation-lists"
    priority = 5

    action {
      block {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAmazonIpReputationList"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "IPReputationRule"
      sampled_requests_enabled  = true
    }
  }

  # Anonymous IP list (VPN, proxy, Tor)
  rule {
    name     = "anonymous-ip-list"
    priority = 6

    action {
      block {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAnonymousIpList"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "AnonymousIPRule"
      sampled_requests_enabled  = true
    }
  }

  # Bot control
  rule {
    name     = "bot-control"
    priority = 7

    action {
      captcha {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesBotControlRuleSet"
        vendor_name = "AWS"

        managed_rule_group_configs {
          aws_managed_rules_bot_control_rule_set {
            inspection_level = "COMMON"
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "BotControlRule"
      sampled_requests_enabled  = true
    }
  }

  # Captcha for suspicious requests
  rule {
    name     = "captcha-challenge"
    priority = 8

    action {
      captcha {}
    }

    statement {
      and_statement {
        statement {
          byte_match_statement {
            positional_constraint = "CONTAINS"
            search_string        = "/api/"
            field_to_match {
              uri_path {}
            }
            text_transformations {
              priority = 0
              type     = "NONE"
            }
          }
        }

        statement {
          not_statement {
            statement {
              byte_match_statement {
                positional_constraint = "CONTAINS"
                search_string        = "application/json"
                field_to_match {
                  headers {
                    name     = "content-type"
                    match_scope = "ALL"
                  }
                }
                text_transformations {
                  priority = 0
                  type     = "LOWERCASE"
                }
              }
            }
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "CaptchaChallengeRule"
      sampled_requests_enabled  = true
    }
  }

  # Custom response for blocked requests
  custom_response_body {
    key          = "blocked-response"
    content_type = "APPLICATION_JSON"
    content      = "{\"status\":403,\"message\":\"Access denied by WAF. If you believe this is a mistake, please contact support@almokhtabar.com.\",\"requestId\":\"${aws_wafv2_web_acl.main.id}\"}"
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name               = "AlMokhtabarWebACL"
    sampled_requests_enabled  = true
  }

  tags = local.common_tags
}

# WAF logging configuration
resource "aws_wafv2_web_acl_logging_configuration" "main" {
  provider = aws.primary
  log_destination_configs = [
    aws_s3_bucket.logs.arn,
    "arn:aws:logs:us-east-1:${data.aws_caller_identity.current.account_id}:log-group:/aws/waf/almokhtabar:*",
  ]
  resource_arn = aws_wafv2_web_acl.main.arn

  logging_filter {
    default_behavior = "KEEP"

    filter {
      behavior = "KEEP"
      condition {
        action_condition {
          action = "BLOCK"
        }
      }
      requirement = "MEETS_ANY"
    }

    filter {
      behavior = "KEEP"
      condition {
        action_condition {
          action = "CAPTCHA"
        }
      }
      requirement = "MEETS_ANY"
    }

    filter {
      behavior = "DROP"
      condition {
        label_name_condition {
          label_name = "awswaf:managed:aws:bot-control:bot:signal:non_human"
        }
      }
      requirement = "MEETS_ANY"
    }
  }

  redacted_fields {
    single_header {
      name = "authorization"
    }
  }

  redacted_fields {
    single_header {
      name = "cookie"
    }
  }
}

# CloudWatch log group for WAF
resource "aws_cloudwatch_log_group" "waf" {
  provider = aws.primary
  name              = "/aws/waf/almokhtabar"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.cloudwatch.arn

  tags = local.common_tags
}

# WAF IP sets for whitelist/blacklist
resource "aws_wafv2_ip_set" "whitelist" {
  provider = aws.primary
  name        = "${local.name_prefix}-whitelist"
  description = "IP whitelist for internal access"
  scope       = "CLOUDFRONT"
  ip_address_version = "IPV4"
  addresses   = var.whitelisted_ips

  tags = local.common_tags
}

resource "aws_wafv2_ip_set" "blocklist" {
  provider = aws.primary
  name        = "${local.name_prefix}-blocklist"
  description = "IP blocklist for known bad actors"
  scope       = "CLOUDFRONT"
  ip_address_version = "IPV4"
  addresses   = var.blocklisted_ips

  tags = local.common_tags
}
