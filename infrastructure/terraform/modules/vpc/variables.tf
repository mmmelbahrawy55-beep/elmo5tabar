variable "name" {
  description = "Name prefix for resources"
  type        = string
}

variable "cidr_block" {
  description = "CIDR block for the VPC"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

variable "single_nat_gateway" {
  description = "Use a single NAT Gateway instead of one per AZ"
  type        = bool
  default     = false
}

variable "enable_flow_logs" {
  description = "Enable VPC Flow Logs"
  type        = bool
  default     = true
}

variable "flow_logs_role_arn" {
  description = "IAM role ARN for flow logs"
  type        = string
  default     = null
}

variable "flow_logs_destination_arn" {
  description = "CloudWatch log group ARN for flow logs"
  type        = string
  default     = null
}

variable "flow_logs_traffic_type" {
  description = "Traffic type for flow logs (ALL, ACCEPT, REJECT)"
  type        = string
  default     = "ALL"
}

variable "enable_vpc_endpoints" {
  description = "Enable VPC endpoints"
  type        = bool
  default     = true
}
