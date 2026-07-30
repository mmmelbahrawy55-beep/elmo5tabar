resource "azurerm_postgresql_flexible_server" "main" {
  name                 = "${local.name_prefix}-dr-postgres"
  resource_group_name  = azurerm_resource_group.main.name
  location             = azurerm_resource_group.main.location
  version              = "16"
  administrator_login  = "almokhtabar_admin"
  administrator_password = random_password.azure_postgres.result
  zone                 = "1"
  sku_name             = "GP_Standard_D4s_v3"
  storage_mb           = 524288
  storage_tier         = "P30"
  backup_retention_days = 35
  geo_redundant_backup_enabled = true
  auto_grow_enabled    = true
  delegated_subnet_id  = azurerm_subnet.database[0].id
  private_dns_zone_id  = azurerm_private_dns_zone.postgres.id

  high_availability {
    mode = "ZoneRedundant"
  }

  maintenance_window {
    day_of_week  = 0
    start_hour   = 4
    start_minute = 0
  }

  tags = local.common_tags
}

resource "azurerm_private_dns_zone" "postgres" {
  name                = "${local.name_prefix}.postgres.database.azure.com"
  resource_group_name = azurerm_resource_group.main.name

  tags = local.common_tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "postgres" {
  name                  = "${local.name_prefix}-postgres-dns-link"
  private_dns_zone_name = azurerm_private_dns_zone.postgres.name
  resource_group_name   = azurerm_resource_group.main.name
  virtual_network_id    = azurerm_virtual_network.main.id
  registration_enabled  = false

  tags = local.common_tags
}

resource "random_password" "azure_postgres" {
  length  = 32
  special = false
}

resource "azurerm_key_vault_secret" "postgres_password" {
  name         = "postgres-password"
  value        = random_password.azure_postgres.result
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_key_vault_secret" "postgres_connection_string" {
  name         = "postgres-connection-string"
  value        = "postgresql://almokhtabar_admin:${random_password.azure_postgres.result}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/almokhtabar?sslmode=require"
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_key_vault" "main" {
  name                = "${local.name_prefix}-dr-kv"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = "standard"
  soft_delete_retention_days = 7
  purge_protection_enabled   = true

  tags = local.common_tags
}

resource "azurerm_key_vault_access_policy" "terraform" {
  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = data.azurerm_client_config.current.object_id

  secret_permissions = [
    "Get",
    "List",
    "Set",
    "Delete",
    "Purge",
    "Recover",
  ]
}

data "azurerm_client_config" "current" {}
