resource "azurerm_kubernetes_cluster" "main" {
  name                = "${local.name_prefix}-dr-aks"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  dns_prefix          = "${local.name_prefix}-dr"
  kubernetes_version  = "1.29"

  default_node_pool {
    name                = "default"
    node_count          = 3
    vm_size             = "Standard_D4s_v5"
    zones               = [1, 2, 3]
    vnet_subnet_id      = azurerm_subnet.public[0].id
    enable_auto_scaling = true
    min_count           = 3
    max_count           = 10
    max_pods            = 50
    os_disk_size_gb     = 100
    os_disk_type        = "Ephemeral"
    type                = "VirtualMachineScaleSets"
    node_labels = {
      "nodegroup-type" = "general"
    }
  }

  identity {
    type = "SystemAssigned"
  }

  network_profile {
    network_plugin     = "azure"
    network_policy     = "calico"
    load_balancer_sku  = "standard"
    outbound_type      = "loadBalancer"
    service_cidr       = "10.2.0.0/16"
    dns_service_ip     = "10.2.0.10"
    docker_bridge_cidr = "172.17.0.1/16"
  }

  oms_agent {
    log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  }

  key_vault_secrets_provider {
    secret_rotation_enabled = true
    secret_rotation_interval = "2m"
  }

  oidc_issuer_enabled = true
  open_service_mesh_enabled = false

  azure_policy_enabled = true
  http_application_routing_enabled = false

  role_based_access_control_enabled = true

  microsoft_defender {
    log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  }

  maintenance_window {
    allowed {
      day   = "Sunday"
      hours = [4, 5, 6]
    }
  }

  auto_scaler_profile {
    balance_similar_node_groups      = true
    expander                         = "priority"
    max_graceful_termination_sec     = 300
    max_node_provisioning_time       = "15m"
    max_unready_nodes                = 3
    max_unready_percentage           = 45
    new_pod_scale_up_delay           = "10s"
    scale_down_delay_after_add       = "10m"
    scale_down_delay_after_delete    = "10s"
    scale_down_delay_after_failure   = "3m"
    scale_down_unneeded              = "10m"
    scale_down_unready               = "20m"
    scanner_type                     = "cluster"
    skip_nodes_with_local_storage    = false
    skip_nodes_with_system_pods      = true
  }

  storage_profile {
    blob_driver_enabled         = true
    disk_driver_enabled         = true
    file_driver_enabled         = true
    snapshot_controller_enabled = true
  }

  tags = local.common_tags
}

resource "azurerm_kubernetes_cluster_node_pool" "cpu_optimized" {
  name                  = "cpuopt"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.main.id
  vm_size               = "Standard_F8s_v2"
  node_count            = 2
  zones                 = [1, 2, 3]
  vnet_subnet_id        = azurerm_subnet.private[0].id
  enable_auto_scaling   = true
  min_count             = 0
  max_count             = 8
  max_pods              = 50
  os_disk_size_gb       = 100
  priority              = "Spot"
  eviction_policy       = "Delete"
  spot_max_price        = -1

  node_labels = {
    "nodegroup-type" = "cpu-optimized"
    "workload"       = "compute"
  }

  node_taints = [
    "kubernetes.azure.com/scalesetpriority=spot:NoSchedule",
  ]

  tags = local.common_tags
}

resource "azurerm_kubernetes_cluster_node_pool" "memory_optimized" {
  name                  = "memopt"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.main.id
  vm_size               = "Standard_E8s_v5"
  node_count            = 2
  zones                 = [1, 2, 3]
  vnet_subnet_id        = azurerm_subnet.private[0].id
  enable_auto_scaling   = true
  min_count             = 0
  max_count               = 8
  max_pods              = 50
  os_disk_size_gb       = 200

  node_labels = {
    "nodegroup-type" = "memory-optimized"
    "workload"       = "database-cache"
  }

  node_taints = [
    "dedicated=memory-intensive:NoSchedule",
  ]

  tags = local.common_tags
}
