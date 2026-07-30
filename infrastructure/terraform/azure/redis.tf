resource "azurerm_redis_cache" "main" {
  name                = "${local.name_prefix}-dr-redis"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  capacity            = 2
  family              = "P"
  sku_name            = "Premium"
  enable_non_ssl_port = false
  minimum_tls_version = "1.2"
  shard_count         = 1
  zones               = [1, 2, 3]
  redis_configuration {
    maxmemory_policy              = "allkeys-lru"
    maxmemory_reserved            = 100
    maxfragmentationmemory_reserved = 100
    enable_authentication         = true
    notify_keyspace_events        = "Ex"
    aof_backup_enabled            = true
    aof_storage_connection_string_0 = azurerm_storage_account.redis_backup.primary_connection_string
    rdb_backup_enabled            = true
    rdb_backup_frequency          = 60
    rdb_backup_max_snapshot_count = 1
    rdb_storage_connection_string = azurerm_storage_account.redis_backup.primary_connection_string
  }

  patch_schedule {
    day_of_week    = "Sunday"
    start_hour_utc = 6
    maintenance_window = "PT2H"
  }

  tags = local.common_tags
}

resource "azurerm_redis_firewall_rule" "main" {
  name                = "${local.name_prefix}-dr-redis-fw"
  redis_cache_name    = azurerm_redis_cache.main.name
  resource_group_name = azurerm_resource_group.main.name
  start_ip            = "10.1.0.0"
  end_ip              = "10.1.255.255"
}

resource "azurerm_redis_linked_server" "primary" {
  name                      = "${local.name_prefix}-redis-link"
  target_redis_cache_name   = azurerm_redis_cache.main.name
  resource_group_name       = azurerm_resource_group.main.name
  linked_redis_cache_id     = aws_elasticache_replication_group.main.id
  linked_redis_cache_location = "westus2"
  server_role               = "Secondary"
}

resource "azurerm_storage_account" "redis_backup" {
  name                     = "${local.name_prefix}drredisbackup"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "GRS"
  min_tls_version          = "TLS1_2"

  blob_properties {
    versioning_enabled = true
  }

  tags = local.common_tags
}

resource "azurerm_storage_container" "redis_backup" {
  name                  = "redis-backups"
  storage_account_name  = azurerm_storage_account.redis_backup.name
  container_access_type = "private"
}

resource "azurerm_key_vault_secret" "redis_key" {
  name         = "redis-access-key"
  value        = azurerm_redis_cache.main.primary_access_key
  key_vault_id = azurerm_key_vault.main.id
}

# Azure Monitor diagnostics
resource "azurerm_monitor_diagnostic_setting" "redis" {
  name                       = "${local.name_prefix}-redis-diagnostics"
  target_resource_id         = azurerm_redis_cache.main.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}

resource "azurerm_monitor_diagnostic_setting" "aks" {
  name                       = "${local.name_prefix}-aks-diagnostics"
  target_resource_id         = azurerm_kubernetes_cluster.main.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  enabled_log {
    category = "kube-apiserver"
  }

  enabled_log {
    category = "kube-audit"
  }

  enabled_log {
    category = "kube-controller-manager"
  }

  enabled_log {
    category = "kube-scheduler"
  }

  enabled_log {
    category = "cluster-autoscaler"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}

resource "azurerm_monitor_diagnostic_setting" "postgres" {
  name                       = "${local.name_prefix}-postgres-diagnostics"
  target_resource_id         = azurerm_postgresql_flexible_server.main.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  enabled_log {
    category = "PostgreSQLLogs"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}

# Azure Backup
resource "azurerm_recovery_services_vault" "main" {
  name                = "${local.name_prefix}-dr-rsv"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "Standard"
  soft_delete_enabled = true

  tags = local.common_tags
}

resource "azurerm_backup_policy_vm" "main" {
  name                = "${local.name_prefix}-dr-backup-policy"
  resource_group_name = azurerm_resource_group.main.name
  recovery_vault_name = azurerm_recovery_services_vault.main.name
  timezone            = "Asia/Riyadh"

  backup {
    frequency = "Daily"
    time      = "03:00"
  }

  retention_daily {
    count = 35
  }

  retention_weekly {
    count    = 12
    weekdays = ["Sunday"]
  }

  retention_monthly {
    count    = 12
    weekdays = ["Sunday"]
    weeks    = ["First"]
  }

  retention_yearly {
    count    = 5
    weekdays = ["Sunday"]
    weeks    = ["First"]
    months   = ["January"]
  }
}

# Azure DNS as secondary
resource "azurerm_dns_zone" "main" {
  name                = "almokhtabar.com"
  resource_group_name = azurerm_resource_group.main.name

  tags = local.common_tags
}

resource "azurerm_dns_ns_record" "main" {
  name                = "@"
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = azurerm_resource_group.main.name
  ttl                 = 172800
  records             = azurerm_dns_zone.main.name_servers
}

resource "azurerm_dns_a_record" "main" {
  name                = "@"
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = azurerm_resource_group.main.name
  ttl                 = 300
  records             = [azurerm_public_ip.aks.ip_address]

  tags = local.common_tags
}

resource "azurerm_public_ip" "aks" {
  name                = "${local.name_prefix}-dr-aks-pip"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  allocation_method   = "Static"
  sku                 = "Standard"

  tags = local.common_tags
}
