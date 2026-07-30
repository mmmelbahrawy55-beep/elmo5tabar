# Primary hosted zone
resource "aws_route53_zone" "main" {
  provider = aws.primary
  name          = "almokhtabar.com"
  comment       = "Al Mokhtabar production hosted zone"
  force_destroy = false

  tags = local.common_tags
}

# NS records for subdomain delegation
resource "aws_route53_record" "ns" {
  provider = aws.primary
  zone_id = aws_route53_zone.main.zone_id
  name    = "almokhtabar.com"
  type    = "NS"
  ttl     = 172800
  records = aws_route53_zone.main.name_servers
}

# A records with CloudFront alias
resource "aws_route53_record" "root" {
  provider = aws.primary
  zone_id = aws_route53_zone.main.zone_id
  name    = "almokhtabar.com"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }

  failover_routing_policy {
    type = "PRIMARY"
  }

  set_identifier = "primary"
}

resource "aws_route53_record" "www" {
  provider = aws.primary
  zone_id = aws_route53_zone.main.zone_id
  name    = "www.almokhtabar.com"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "api" {
  provider = aws.primary
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.almokhtabar.com"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "uploads" {
  provider = aws.primary
  zone_id = aws_route53_zone.main.zone_id
  name    = "uploads.almokhtabar.com"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}

# Failover routing to DR
resource "aws_route53_record" "root_failover" {
  provider = aws.primary
  zone_id = aws_route53_zone.main.zone_id
  name    = "almokhtabar.com"
  type    = "A"

  failover_routing_policy {
    type = "SECONDARY"
  }

  set_identifier = "dr"

  alias {
    name                   = aws_cloudfront_distribution.dr.domain_name
    zone_id                = aws_cloudfront_distribution.dr.hosted_zone_id
    evaluate_target_health = true
  }
}

# MX records for email
resource "aws_route53_record" "mx" {
  provider = aws.primary
  zone_id = aws_route53_zone.main.zone_id
  name    = "almokhtabar.com"
  type    = "MX"
  ttl     = 3600
  records = [
    "10 inbound-smtp.us-east-1.amazonaws.com",
    "20 inbound-smtp.us-west-2.amazonaws.com",
  ]
}

# TXT records
resource "aws_route53_record" "spf" {
  provider = aws.primary
  zone_id = aws_route53_zone.main.zone_id
  name    = "almokhtabar.com"
  type    = "TXT"
  ttl     = 3600
  records = [
    "v=spf1 include:amazonses.com include:_spf.google.com ~all"
  ]
}

resource "aws_route53_record" "dkim" {
  provider = aws.primary
  zone_id = aws_route53_zone.main.zone_id
  name    = "_domainkey.almokhtabar.com"
  type    = "TXT"
  ttl     = 3600
  records = [
    "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCIpBHR4XK6C0KqBdYB6q2F1cPm8H4d7Y8a0N0C5b9B6d4G6D7e8f9g0h1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9A0B1C2D3E4F5G6H7I8J9K0L1M2N3O4P5Q6R7S8T9U0V1W2X3Y4Z5a6b7c8d9e0f1g2h3i4j5k6l7m8n9o0p1q2r3s4t5u6v7w8x9y0z1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7a8b9c0d1e2f3g4h5i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9"
  ]
}

resource "aws_route53_record" "dmarc" {
  provider = aws.primary
  zone_id = aws_route53_zone.main.zone_id
  name    = "_dmarc.almokhtabar.com"
  type    = "TXT"
  ttl     = 3600
  records = [
    "v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc@almokhtabar.com; ruf=mailto:dmarc-ruf@almokhtabar.com; fo=1"
  ]
}

# Domain verification for SES
resource "aws_route53_record" "ses_verification" {
  provider = aws.primary
  zone_id = aws_route53_zone.main.zone_id
  name    = "_amazonses.almokhtabar.com"
  type    = "TXT"
  ttl     = 3600
  records = [aws_ses_domain_identity.main.verification_token]
}

# Certificate validation records
resource "aws_route53_record" "cert_validation" {
  provider = aws.primary
  for_each = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name           = each.value.name
  records        = [each.value.record]
  ttl            = 60
  type           = each.value.type
  zone_id        = aws_route53_zone.main.zone_id
}

# Health checks
resource "aws_route53_health_check" "api" {
  provider = aws.primary
  fqdn              = "api.almokhtabar.com"
  port              = 443
  type              = "HTTPS"
  resource_path     = "/api/v1/health"
  failure_threshold = 3
  request_interval  = 30

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-health-api"
  })
}

resource "aws_route53_health_check" "web" {
  provider = aws.primary
  fqdn              = "almokhtabar.com"
  port              = 443
  type              = "HTTPS"
  resource_path     = "/"
  failure_threshold = 3
  request_interval  = 30

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-health-web"
  })
}

resource "aws_route53_health_check" "api_dr" {
  provider = aws.dr
  fqdn              = "api.dr.almokhtabar.com"
  port              = 443
  type              = "HTTPS"
  resource_path     = "/api/v1/health"
  failure_threshold = 3
  request_interval  = 30

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-health-api-dr"
  })
}

# Latency-based routing
resource "aws_route53_record" "api_latency" {
  provider = aws.primary
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.almokhtabar.com"
  type    = "A"

  latency_routing_policy {
    region = "us-east-1"
  }

  set_identifier = "api-primary-us-east-1"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "api_latency_dr" {
  provider = aws.primary
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.almokhtabar.com"
  type    = "A"

  latency_routing_policy {
    region = "us-west-2"
  }

  set_identifier = "api-dr-us-west-2"

  alias {
    name                   = aws_cloudfront_distribution.dr.domain_name
    zone_id                = aws_cloudfront_distribution.dr.hosted_zone_id
    evaluate_target_health = true
  }
}
