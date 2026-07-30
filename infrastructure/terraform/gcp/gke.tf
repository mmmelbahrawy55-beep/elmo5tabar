resource "google_container_cluster" "main" {
  provider = google-beta
  name     = "${local.name_prefix}-gke"
  location = local.region

  remove_default_node_pool = true
  initial_node_count       = 1

  network    = google_compute_network.main.name
  subnetwork = google_compute_subnetwork.private.name

  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  master_auth {
    client_certificate_config {
      issue_client_certificate = false
    }
  }

  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "10.5.0.0/28"
  }

  master_authorized_networks_config {
    cidr_blocks {
      cidr_block   = "10.0.0.0/8"
      display_name = "VPC"
    }
    cidr_blocks {
      cidr_block   = var.admin_vpn_cidr
      display_name = "Admin VPN"
    }
  }

  release_channel {
    channel = "REGULAR"
  }

  min_master_version = "1.29"

  cluster_autoscaling {
    enabled = true
    resource_limits {
      resource_type = "cpu"
      minimum       = 3
      maximum       = 50
    }
    resource_limits {
      resource_type = "memory"
      minimum       = 12
      maximum       = 200
    }
  }

  addons_config {
    http_load_balancing {
      disabled = false
    }
    horizontal_pod_autoscaling {
      disabled = false
    }
    network_policy_config {
      disabled = false
    }
    gce_persistent_disk_csi_driver_config {
      enabled = true
    }
    gcp_filestore_csi_driver_config {
      enabled = true
    }
  }

  network_policy {
    enabled  = true
    provider = "CALICO"
  }

  pod_security_policy_config {
    enabled = true
  }

  vertical_pod_autoscaling {
    enabled = true
  }

  workload_identity_config {
    workload_pool = "${var.gcp_project_id}.svc.id.goog"
  }

  logging_service    = "logging.googleapis.com/kubernetes"
  monitoring_service = "monitoring.googleapis.com/kubernetes"

  maintenance_policy {
    daily_maintenance_window {
      start_time = "04:00"
    }
  }

  resource_usage_export_config {
    enable_network_egress_metering = true
    enable_resource_consumption_metering = true
    bigquery_destination {
      dataset_id = google_bigquery_dataset.usage.dataset_id
    }
  }

  depends_on = [
    google_project_service.required,
  ]
}

resource "google_container_node_pool" "general" {
  provider   = google-beta
  name       = "${local.name_prefix}-gke-general"
  location   = local.region
  cluster    = google_container_cluster.main.name
  node_count = 3

  node_config {
    machine_type = "e2-standard-4"
    disk_size_gb = 100
    disk_type    = "pd-ssd"
    image_type   = "COS_CONTAINERD"
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
    service_account = google_service_account.gke.email
    labels = {
      "nodegroup-type" = "general"
    }
    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }
    workload_metadata_config {
      mode = "GKE_METADATA"
    }
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }

  autoscaling {
    min_node_count = 3
    max_node_count = 20
  }
}

resource "google_container_node_pool" "gpu" {
  provider   = google-beta
  name       = "${local.name_prefix}-gke-gpu"
  location   = local.region
  cluster    = google_container_cluster.main.name
  node_count = 0

  node_config {
    machine_type = "n1-standard-8"
    disk_size_gb = 200
    disk_type    = "pd-ssd"
    image_type   = "COS_CONTAINERD"
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
    service_account = google_service_account.gke.email

    guest_accelerator {
      type  = "nvidia-tesla-t4"
      count = 1
      gpu_driver_installation_config {
        gpu_driver_version = "LATEST"
      }
    }

    labels = {
      "nodegroup-type" = "gpu"
      "workload"       = "ai-ml"
    }

    taint {
      key    = "nvidia.com/gpu"
      value  = "present"
      effect = "NO_SCHEDULE"
    }

    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }

  autoscaling {
    min_node_count = 0
    max_node_count = 5
  }
}

resource "google_container_node_pool" "cpu_optimized" {
  provider   = google-beta
  name       = "${local.name_prefix}-gke-cpu"
  location   = local.region
  cluster    = google_container_cluster.main.name
  node_count = 0

  node_config {
    machine_type = "c2-standard-8"
    disk_size_gb = 100
    disk_type    = "pd-ssd"
    image_type   = "COS_CONTAINERD"
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
    service_account = google_service_account.gke.email
    labels = {
      "nodegroup-type" = "cpu-optimized"
    }
    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }
  }

  autoscaling {
    min_node_count = 0
    max_node_count = 10
  }
}

resource "google_service_account" "gke" {
  account_id   = "${local.name_prefix}-gke-sa"
  display_name = "GKE Service Account"
}

resource "google_compute_network" "main" {
  name                    = "${local.name_prefix}-gke-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "private" {
  name          = "${local.name_prefix}-gke-subnet"
  ip_cidr_range = "10.4.0.0/16"
  region        = local.region
  network       = google_compute_network.main.id

  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = "10.4.1.0/16"
  }
  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = "10.4.2.0/20"
  }

  private_ip_google_access = true
}

resource "google_compute_router" "main" {
  name    = "${local.name_prefix}-gke-router"
  region  = local.region
  network = google_compute_network.main.id
}

resource "google_compute_router_nat" "main" {
  name   = "${local.name_prefix}-gke-nat"
  router = google_compute_router.main.name
  region = local.region

  nat_ip_allocate_option = "AUTO_ONLY"

  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
}

resource "google_bigquery_dataset" "usage" {
  dataset_id = "${local.name_prefix}_gke_usage"
  location   = local.region
}

resource "google_project_iam_member" "gke_logging" {
  project = var.gcp_project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.gke.email}"
}

resource "google_project_iam_member" "gke_monitoring" {
  project = var.gcp_project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.gke.email}"
}

resource "google_project_iam_member" "gke_cloudtrace" {
  project = var.gcp_project_id
  role    = "roles/cloudtrace.agent"
  member  = "serviceAccount:${google_service_account.gke.email}"
}
