# Cloud SQL PostgreSQL (read replica of AWS primary)
resource "google_sql_database_instance" "main" {
  name                = "${local.name_prefix}-cloudsql"
  database_version    = "POSTGRES_16"
  region              = local.region
  deletion_protection = true

  settings {
    tier              = "db-custom-4-15360"
    disk_size         = 500
    disk_type         = "PD_SSD"
    disk_autoresize   = true
    disk_autoresize_limit = 1000

    availability_type = "ZONAL"

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
      transaction_log_retention_days = 7
      backup_retention_settings {
        retained_backups = 35
        retention_unit   = "COUNT"
      }
      start_time = "03:00"
    }

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.main.id
      require_ssl     = true
    }

    database_flags {
      name  = "max_connections"
      value = "200"
    }

    database_flags {
      name  = "shared_buffers"
      value = "{3325440}"
    }

    database_flags {
      name  = "effective_cache_size"
      value = "9953280"
    }

    database_flags {
      name  = "maintenance_work_mem"
      value = "665088"
    }

    database_flags {
      name  = "checkpoint_completion_target"
      value = "0.9"
    }

    database_flags {
      name  = "log_min_duration_statement"
      value = "1000"
    }

    database_flags {
      name  = "idle_in_transaction_session_timeout"
      value = "300000"
    }

    database_flags {
      name  = "ssl"
      value = "on"
    }

    insights_config {
      query_insights_enabled  = true
      query_string_length     = 4500
      record_application_tags = true
      record_client_address   = true
    }

    maintenance_window {
      day          = 1
      hour         = 4
      update_track = "stable"
    }
  }

  depends_on = [
    google_project_service.required,
  ]
}

resource "google_sql_database" "main" {
  name     = "almokhtabar"
  instance = google_sql_database_instance.main.name
}

resource "google_sql_user" "admin" {
  name     = "almokhtabar_admin"
  instance = google_sql_database_instance.main.name
  password = random_password.cloudsql.result
}

resource "random_password" "cloudsql" {
  length  = 32
  special = false
}

# Cloud Memorystore for Redis
resource "google_redis_instance" "main" {
  name           = "${local.name_prefix}-redis"
  tier           = "STANDARD_HA"
  memory_size_gb = 10
  region         = local.region
  location_id    = "us-central1-a"
  alternative_location_id = "us-central1-f"

  redis_version     = "REDIS_7"
  display_name      = "Al Mokhtabar AI Redis"
  reserved_ip_range = "10.4.3.0/29"
  connect_mode      = "PRIVATE_SERVICE_ACCESS"
  authorized_network = google_compute_network.main.id

  transit_encryption_enabled = true
  auth_enabled               = true

  maintenance_policy {
    weekly_maintenance_window {
      day        = "SUNDAY"
      start_time {
        hours   = 6
        minutes = 0
      }
    }
  }

  persistence_config {
    persistence_mode = "RDB"
    rdb_snapshot_period = "ONE_HOUR"
    rdb_snapshot_start_time = "03:00"
  }

  depends_on = [
    google_project_service.required,
  ]
}

# Vertex AI for model training
resource "google_vertex_ai_dataset" "main" {
  display_name          = "${local.name_prefix}-dataset"
  metadata_schema_uri   = "gs://google-cloud-aiplatform/schema/dataset/metadata/image_1.0.0.yaml"
  region                = local.region
}

resource "google_vertex_ai_endpoint" "main" {
  name         = "${local.name_prefix}-endpoint"
  display_name = "Al Mokhtabar AI Endpoint"
  region       = local.region
  description  = "Endpoint for serving AI/ML models"
}

# Cloud Storage for AI artifacts
resource "google_storage_bucket" "ai_artifacts" {
  name                        = "${local.name_prefix}-ai-artifacts"
  location                    = "US"
  storage_class               = "STANDARD"
  uniform_bucket_level_access = true
  versioning {
    enabled = true
  }
  encryption {
    default_kms_key_name = google_kms_crypto_key.ai.id
  }

  lifecycle_rule {
    action {
      type = "SetStorageClass"
      storage_class = "NEARLINE"
    }
    condition {
      age = 30
    }
  }

  lifecycle_rule {
    action {
      type = "SetStorageClass"
      storage_class = "COLDLINE"
    }
    condition {
      age = 90
    }
  }

  depends_on = [
    google_project_service.required,
  ]
}

resource "google_kms_key_ring" "ai" {
  name     = "${local.name_prefix}-ai-keyring"
  location = "global"
}

resource "google_kms_crypto_key" "ai" {
  name     = "${local.name_prefix}-ai-key"
  key_ring = google_kms_key_ring.ai.id
  rotation_period = "7776000s"

  version_template {
    algorithm = "GOOGLE_SYMMETRIC_ENCRYPTION"
  }
}

# Secret Manager for credentials
resource "google_secret_manager_secret" "cloudsql_password" {
  secret_id = "cloudsql-password"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "cloudsql_password" {
  secret      = google_secret_manager_secret.cloudsql_password.id
  secret_data = random_password.cloudsql.result
}

resource "google_secret_manager_secret" "cloudsql_connection" {
  secret_id = "cloudsql-connection-string"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "cloudsql_connection" {
  secret      = google_secret_manager_secret.cloudsql_connection.id
  secret_data = "postgresql://almokhtabar_admin:${random_password.cloudsql.result}@${google_sql_database_instance.main.private_ip_address}:5432/almokhtabar?sslmode=require"
}

output "cloudsql_private_ip" {
  value = google_sql_database_instance.main.private_ip_address
}

output "redis_host" {
  value = google_redis_instance.main.host
}

output "gke_cluster_name" {
  value = google_container_cluster.main.name
}
