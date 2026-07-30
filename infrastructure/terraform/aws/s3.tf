# KMS key for S3 encryption
resource "aws_kms_key" "s3" {
  provider                = aws.primary
  description             = "KMS CMK for S3 bucket encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = local.common_tags
}

resource "aws_kms_alias" "s3" {
  provider      = aws.primary
  name          = "alias/s3-encryption-key"
  target_key_id = aws_kms_key.s3.key_id
}

# Public Access Block - applies to all buckets
resource "aws_s3_account_public_access_block" "main" {
  provider = aws.primary
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Bucket 1: Logs (access logs, CloudTrail)
resource "aws_s3_bucket" "logs" {
  provider = aws.primary
  bucket        = "almokhtabar-logs"
  force_destroy = false

  tags = merge(local.common_tags, {
    Name = "almokhtabar-logs"
  })
}

resource "aws_s3_bucket_versioning" "logs" {
  provider = aws.primary
  bucket = aws_s3_bucket.logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  provider = aws.primary
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  provider = aws.primary
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "expire-logs"
    status = "Enabled"

    expiration {
      days = 365
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    transition {
      days          = 180
      storage_class = "DEEP_ARCHIVE"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "logs" {
  provider = aws.primary
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Bucket 2: Backups
resource "aws_s3_bucket" "backups" {
  provider = aws.primary
  bucket        = "almokhtabar-backups"
  force_destroy = false
  object_lock_enabled = true

  tags = merge(local.common_tags, {
    Name = "almokhtabar-backups"
  })
}

resource "aws_s3_bucket_versioning" "backups" {
  provider = aws.primary
  bucket = aws_s3_bucket.backups.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backups" {
  provider = aws.primary
  bucket = aws_s3_bucket.backups.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "backups" {
  provider = aws.primary
  bucket = aws_s3_bucket.backups.id

  rule {
    id     = "transition-to-glacier"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "GLACIER"
    }

    transition {
      days          = 90
      storage_class = "DEEP_ARCHIVE"
    }

    expiration {
      days = 365
    }
  }

  rule {
    id     = "expire-deleted-markers"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 90
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

resource "aws_s3_bucket_public_access_block" "backups" {
  provider = aws.primary
  bucket = aws_s3_bucket.backups.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "backups" {
  provider = aws.primary
  bucket = aws_s3_bucket.backups.id
  policy = data.aws_iam_policy_document.backup_bucket_policy.json
}

data "aws_iam_policy_document" "backup_bucket_policy" {
  provider = aws.primary
  statement {
    sid    = "DenyIncorrectEncryptionHeader"
    effect = "Deny"
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    actions = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.backups.arn}/*"]
    condition {
      test     = "StringNotEquals"
      variable = "s3:x-amz-server-side-encryption-aws:kms"
      values   = [aws_kms_key.s3.arn]
    }
  }

  statement {
    sid    = "DenyUnencryptedObjectUploads"
    effect = "Deny"
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    actions = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.backups.arn}/*"]
    condition {
      test     = "Null"
      variable = "s3:x-amz-server-side-encryption"
      values   = ["true"]
    }
  }
}

# Bucket 3: User Uploads
resource "aws_s3_bucket" "uploads" {
  provider = aws.primary
  bucket        = "almokhtabar-uploads"
  force_destroy = false

  tags = merge(local.common_tags, {
    Name = "almokhtabar-uploads"
  })
}

resource "aws_s3_bucket_versioning" "uploads" {
  provider = aws.primary
  bucket = aws_s3_bucket.uploads.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "uploads" {
  provider = aws.primary
  bucket = aws_s3_bucket.uploads.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_cors_configuration" "uploads" {
  provider = aws.primary
  bucket = aws_s3_bucket.uploads.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "HEAD"]
    allowed_origins = ["https://almokhtabar.com", "https://*.almokhtabar.com"]
    expose_headers  = ["ETag", "x-amz-request-id"]
    max_age_seconds = 3600
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "uploads" {
  provider = aws.primary
  bucket = aws_s3_bucket.uploads.id

  rule {
    id     = "expire-old-uploads"
    status = "Enabled"

    expiration {
      days = 90
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }
}

resource "aws_s3_bucket_public_access_block" "uploads" {
  provider = aws.primary
  bucket = aws_s3_bucket.uploads.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "uploads" {
  provider = aws.primary
  bucket = aws_s3_bucket.uploads.id
  policy = data.aws_iam_policy_document.upload_bucket_policy.json
}

data "aws_iam_policy_document" "upload_bucket_policy" {
  provider = aws.primary
  statement {
    sid    = "EnforceHttpsOnly"
    effect = "Deny"
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.uploads.arn,
      "${aws_s3_bucket.uploads.arn}/*",
    ]
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

# Bucket 4: Terraform State
resource "aws_s3_bucket" "terraform_state" {
  provider = aws.primary
  bucket        = "almokhtabar-terraform-state"
  force_destroy = false
  object_lock_enabled = true

  tags = merge(local.common_tags, {
    Name = "almokhtabar-terraform-state"
  })
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  provider = aws.primary
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  provider = aws.primary
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state" {
  provider = aws.primary
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "terraform_state" {
  provider = aws.primary
  bucket = aws_s3_bucket.terraform_state.id
  policy = data.aws_iam_policy_document.terraform_state_bucket_policy.json
}

data "aws_iam_policy_document" "terraform_state_bucket_policy" {
  provider = aws.primary
  statement {
    sid    = "EnforceHttpsEncryption"
    effect = "Deny"
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.terraform_state.arn,
      "${aws_s3_bucket.terraform_state.arn}/*",
    ]
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }

  statement {
    sid    = "AllowTerraformStateAccess"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${local.name_prefix}-cicd-deploy-role"]
    }
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucket",
    ]
    resources = [
      aws_s3_bucket.terraform_state.arn,
      "${aws_s3_bucket.terraform_state.arn}/*",
    ]
  }
}

# DynamoDB for Terraform state locking
resource "aws_dynamodb_table" "terraform_locks" {
  provider = aws.primary
  name         = "almokhtabar-terraform-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.s3.arn
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name = "almokhtabar-terraform-locks"
  })
}

data "aws_caller_identity" "current" {
  provider = aws.primary
}
