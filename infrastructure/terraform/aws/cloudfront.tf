# CloudFront Origin Access Identity for S3
resource "aws_cloudfront_origin_access_control" "uploads" {
  provider = aws.primary
  name                              = "${local.name_prefix}-uploads-oac"
  description                       = "OAC for S3 uploads bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# S3 bucket policy for CloudFront OAC
data "aws_iam_policy_document" "cloudfront_uploads" {
  provider = aws.primary
  statement {
    sid    = "AllowCloudFrontServicePrincipal"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    actions = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.uploads.arn}/*"]
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.main.arn]
    }
  }
}

# CloudFront distribution
resource "aws_cloudfront_distribution" "main" {
  provider = aws.primary
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Al Mokhtabar production CloudFront distribution"
  default_root_object = "index.html"
  price_class         = "PriceClass_100"
  http_version        = "http2and3"
  aliases             = ["almokhtabar.com", "www.almokhtabar.com", "api.almokhtabar.com", "uploads.almokhtabar.com"]

  # Origin 1: ALB for API/Web
  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = "ALB-Origin"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
      origin_read_timeout    = 60
      origin_keepalive_timeout = 5
    }

    origin_shield {
      enabled              = true
      origin_shield_region = "us-east-1"
    }
  }

  # Origin 2: S3 bucket for uploads
  origin {
    domain_name              = aws_s3_bucket.uploads.bucket_regional_domain_name
    origin_id                = "S3-Uploads"
    origin_access_control_id = aws_cloudfront_origin_access_control.uploads.id
  }

  # Default cache behavior for web
  default_cache_behavior {
    target_origin_id       = "ALB-Origin"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    compress               = true
    smooth_streaming       = false

    forwarded_values {
      query_string = true
      headers = [
        "Access-Control-Request-Headers",
        "Access-Control-Request-Method",
        "Authorization",
        "CloudFront-Forwarded-Proto",
        "Host",
        "Origin",
        "Referer",
      ]
      cookies {
        forward = "whitelist"
        whitelisted_names = ["session", "token", "csrf"]
      }
    }

    min_ttl     = 0
    default_ttl = 86400
    max_ttl     = 31536000

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.security_headers.arn
    }
  }

  # Cache behavior for API
  ordered_cache_behavior {
    path_pattern           = "/api/*"
    target_origin_id       = "ALB-Origin"
    viewer_protocol_policy = "https-only"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    compress               = true

    forwarded_values {
      query_string = true
      headers = [
        "Authorization",
        "Content-Type",
        "Origin",
        "X-API-Key",
      ]
      cookies {
        forward = "all"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  # Cache behavior for static uploads
  ordered_cache_behavior {
    path_pattern           = "/uploads/*"
    target_origin_id       = "S3-Uploads"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    compress               = true

    forwarded_values {
      query_string = false
      headers      = ["Origin"]
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 86400
    max_ttl     = 31536000

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.security_headers.arn
    }
  }

  # Custom error responses
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
    error_caching_min_ttl = 10
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
    error_caching_min_ttl = 10
  }

  custom_error_response {
    error_code         = 500
    response_code      = 502
    response_page_path = "/error.html"
    error_caching_min_ttl = 60
  }

  custom_error_response {
    error_code         = 502
    response_code      = 502
    response_page_path = "/error.html"
    error_caching_min_ttl = 60
  }

  custom_error_response {
    error_code         = 503
    response_code      = 502
    response_page_path = "/error.html"
    error_caching_min_ttl = 60
  }

  # Geo restriction
  restrictions {
    geo_restriction {
      restriction_type = "whitelist"
      locations = [
        "SA", "AE", "QA", "KW", "BH", "OM", "EG", "JO", "LB", "PS",
        "US", "GB", "DE", "FR", "CA", "AU", "SG", "MY", "IN", "PK",
      ]
    }
  }

  # Web ACL
  web_acl_id = aws_wafv2_web_acl.main.arn

  # Viewer certificate
  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.main.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  # Logging
  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.logs.bucket_domain_name
    prefix          = "cloudfront/"
  }

  tags = local.common_tags
}

# CloudFront Function for security headers
resource "aws_cloudfront_function" "security_headers" {
  provider = aws.primary
  name    = "${local.name_prefix}-security-headers"
  runtime = "cloudfront-js-2.0"
  comment = "Add security headers to CloudFront responses"
  code    = <<-EOT
function handler(event) {
  var response = event.response;
  var headers = response.headers;

  headers['strict-transport-security'] = { value: 'max-age=31536000; includeSubdomains; preload' };
  headers['content-security-policy'] = {
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-src 'none'; object-src 'none'"
  };
  headers['x-content-type-options'] = { value: 'nosniff' };
  headers['x-frame-options'] = { value: 'DENY' };
  headers['x-xss-protection'] = { value: '1; mode=block' };
  headers['referrer-policy'] = { value: 'strict-origin-when-cross-origin' };
  headers['permissions-policy'] = {
    value: 'camera=(), microphone=(), geolocation=(), payment=()'
  };

  return response;
}
EOT
}

# ACM Certificate (must be in us-east-1 for CloudFront)
resource "aws_acm_certificate" "main" {
  provider = aws.primary
  domain_name               = "almokhtabar.com"
  subject_alternative_names = ["*.almokhtabar.com"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = local.common_tags
}

resource "aws_acm_certificate_validation" "main" {
  provider = aws.primary
  certificate_arn         = aws_acm_certificate.main.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}
