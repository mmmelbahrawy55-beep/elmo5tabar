resource "azurerm_resource_group" "main" {
  name     = "${local.name_prefix}-dr-rg"
  location = local.location

  tags = local.common_tags
}

resource "azurerm_virtual_network" "main" {
  name                = "${local.name_prefix}-dr-vnet"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  address_space       = ["10.1.0.0/16"]

  tags = local.common_tags
}

resource "azurerm_subnet" "public" {
  count                = 3
  name                 = "${local.name_prefix}-dr-public-${count.index}"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.1.${count.index + 1}.0/24"]

  delegation {
    name = "aks-delegation"
    service_delegation {
      name = "Microsoft.ContainerService/managedClusters"
      actions = [
        "Microsoft.Network/virtualNetworks/subnets/join/action",
      ]
    }
  }
}

resource "azurerm_subnet" "private" {
  count                = 3
  name                 = "${local.name_prefix}-dr-private-${count.index}"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.1.${count.index + 10}.0/24"]

  service_endpoints = [
    "Microsoft.Sql",
    "Microsoft.Storage",
    "Microsoft.KeyVault",
  ]
}

resource "azurerm_subnet" "database" {
  count                = 3
  name                 = "${local.name_prefix}-dr-database-${count.index}"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.1.${count.index + 20}.0/24"]

  service_endpoints = [
    "Microsoft.Sql",
    "Microsoft.Storage",
  ]
}

resource "azurerm_network_security_group" "main" {
  name                = "${local.name_prefix}-dr-nsg"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  security_rule {
    name                       = "AllowHTTPS"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "AllowKubeAPI"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "6443"
    source_address_prefixes    = var.admin_cidrs
    destination_address_prefix = "*"
  }

  tags = local.common_tags
}

resource "azurerm_subnet_network_security_group_association" "public" {
  count                     = 3
  subnet_id                 = azurerm_subnet.public[count.index].id
  network_security_group_id = azurerm_network_security_group.main.id
}

resource "azurerm_public_ip" "nat_gw" {
  count               = 3
  name                = "${local.name_prefix}-dr-nat-gw-pip-${count.index}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  allocation_method   = "Static"
  sku                 = "Standard"
  zones               = [count.index]

  tags = local.common_tags
}

resource "azurerm_nat_gateway" "main" {
  count               = 3
  name                = "${local.name_prefix}-dr-nat-gw-${count.index}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku_name            = "Standard"
  zones               = [count.index]

  tags = local.common_tags
}

resource "azurerm_nat_gateway_public_ip_association" "main" {
  count                = 3
  nat_gateway_id       = azurerm_nat_gateway.main[count.index].id
  public_ip_address_id = azurerm_public_ip.nat_gw[count.index].id
}

resource "azurerm_subnet_nat_gateway_association" "private" {
  count          = 3
  subnet_id      = azurerm_subnet.private[count.index].id
  nat_gateway_id = azurerm_nat_gateway.main[count.index].id
}

resource "azurerm_log_analytics_workspace" "main" {
  name                = "${local.name_prefix}-dr-logs"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 90

  tags = local.common_tags
}

resource "azurerm_virtual_network_peering" "primary_to_dr" {
  name                         = "${local.name_prefix}-to-primary"
  resource_group_name          = azurerm_resource_group.main.name
  virtual_network_name         = azurerm_virtual_network.main.name
  remote_virtual_network_id    = var.primary_vnet_id
  allow_virtual_network_access = true
  allow_forwarded_traffic      = true
  allow_gateway_transit        = false
  use_remote_gateways          = false
}
