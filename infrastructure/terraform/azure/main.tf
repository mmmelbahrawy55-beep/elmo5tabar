terraform {
  required_version = ">= 1.7.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.90"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  backend "azurerm" {
    resource_group_name  = "almokhtabar-terraform-state"
    storage_account_name = "almokhtabartfstate"
    container_name       = "terraform-state"
    key                  = "azure/production/terraform.tfstate"
  }
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy    = false
      recover_soft_deleted_key_vaults = true
    }
    resource_group {
      prevent_deletion_if_contains_resources = true
    }
    log_analytics_workspace {
      permanently_delete_on_destroy = false
    }
  }

  subscription_id = var.azure_subscription_id
  tenant_id       = var.azure_tenant_id

  default_tags {
    tags = {
      Project     = "AlMokhtabar"
      Environment = "Production-DR"
      ManagedBy   = "Terraform"
    }
  }
}

locals {
  name_prefix  = "almokhtabar"
  location     = "westus2"
  common_tags = {
    Project     = "AlMokhtabar"
    Environment = "Production-DR"
    ManagedBy   = "Terraform"
    Region      = "westus2"
  }
}
