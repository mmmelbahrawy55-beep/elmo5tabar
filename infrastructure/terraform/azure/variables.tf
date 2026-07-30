variable "azure_subscription_id" {
  description = "Azure subscription ID"
  type        = string
}

variable "azure_tenant_id" {
  description = "Azure tenant ID"
  type        = string
}

variable "admin_cidrs" {
  description = "Admin CIDRs for NSG rules"
  type        = list(string)
  default     = ["10.0.0.0/8"]
}

variable "primary_vnet_id" {
  description = "Primary VNet ID for peering"
  type        = string
  default     = null
}
