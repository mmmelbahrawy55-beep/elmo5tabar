output "instance_id" {
  description = "RDS instance ID"
  value       = aws_db_instance.this.id
}

output "instance_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.this.endpoint
}

output "instance_address" {
  description = "RDS instance address"
  value       = aws_db_instance.this.address
}

output "instance_port" {
  description = "RDS instance port"
  value       = aws_db_instance.this.port
}

output "instance_arn" {
  description = "RDS instance ARN"
  value       = aws_db_instance.this.arn
}

output "master_username" {
  description = "Master username"
  value       = aws_db_instance.this.username
}

output "kms_key_arn" {
  description = "KMS key ARN"
  value       = aws_kms_key.this.arn
}

output "parameter_group_id" {
  description = "Parameter group ID"
  value       = aws_db_parameter_group.this.id
}

output "security_group_id" {
  description = "Security group ID"
  value       = aws_security_group.this.id
}

output "subnet_group_name" {
  description = "DB subnet group name"
  value       = aws_db_subnet_group.this.name
}

output "password_ssm_path" {
  description = "SSM path for the password"
  value       = var.store_in_ssm ? "/${var.ssm_path_prefix}/${var.identifier}/password" : null
}

output "connection_string_ssm_path" {
  description = "SSM path for the connection string"
  value       = var.store_in_ssm ? "/${var.ssm_path_prefix}/${var.identifier}/connection_string" : null
}
