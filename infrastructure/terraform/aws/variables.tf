variable "admin_vpn_ip" {
  description = "IP address for VPN connection"
  type        = string
  sensitive   = true
}

variable "admin_vpn_cidr" {
  description = "CIDR range for admin VPN"
  type        = string
}

variable "eks_public_access_cidrs" {
  description = "CIDRs allowed to access EKS public endpoint"
  type        = list(string)
  default     = ["10.0.0.0/8"]
}

variable "whitelisted_ips" {
  description = "IP whitelist for WAF"
  type        = list(string)
  default     = []
}

variable "blocklisted_ips" {
  description = "IP blocklist for WAF"
  type        = list(string)
  default     = []
}

variable "slack_webhook_url" {
  description = "Slack webhook URL for notifications"
  type        = string
  sensitive   = true
}

variable "pagerduty_integration_key" {
  description = "PagerDuty integration key"
  type        = string
  sensitive   = true
}

variable "dr_vpc_cidr" {
  description = "CIDR block for DR VPC"
  type        = string
  default     = "10.2.0.0/16"
}

variable "dr_availability_zones" {
  description = "Availability zones for DR region"
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b", "us-west-2c"]
}

variable "dr_public_subnet_cidrs" {
  description = "Public subnet CIDRs for DR VPC"
  type        = list(string)
  default     = ["10.2.1.0/24", "10.2.2.0/24", "10.2.3.0/24"]
}

variable "dr_private_subnet_cidrs" {
  description = "Private subnet CIDRs for DR VPC"
  type        = list(string)
  default     = ["10.2.10.0/24", "10.2.11.0/24", "10.2.12.0/24"]
}

variable "dr_database_subnet_cidrs" {
  description = "Database subnet CIDRs for DR VPC"
  type        = list(string)
  default     = ["10.2.20.0/24", "10.2.21.0/24", "10.2.22.0/24"]
}
