variable "gcp_project_id" {
  description = "GCP project ID"
  type        = string
}

variable "admin_vpn_cidr" {
  description = "Admin VPN CIDR"
  type        = string
  default     = "10.0.0.0/8"
}
