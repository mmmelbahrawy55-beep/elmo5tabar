terraform {
  required_version = ">= 1.7.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }

  backend "s3" {
    bucket         = "almokhtabar-terraform-state"
    key            = "aws/production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "almokhtabar-terraform-locks"
    kms_key_id     = "alias/terraform-state-key"
  }
}

provider "aws" {
  region = "us-east-1"
  alias  = "primary"

  default_tags {
    tags = {
      Project     = "AlMokhtabar"
      Environment = "Production"
      ManagedBy   = "Terraform"
      Region      = "us-east-1"
      Contact     = "platform@almokhtabar.com"
    }
  }
}

provider "aws" {
  region = "us-west-2"
  alias  = "dr"

  default_tags {
    tags = {
      Project     = "AlMokhtabar"
      Environment = "Production-DR"
      ManagedBy   = "Terraform"
      Region      = "us-west-2"
      Contact     = "platform@almokhtabar.com"
    }
  }
}

locals {
  name_prefix = "almokhtabar"
  common_tags = {
    Project     = "AlMokhtabar"
    Environment = "Production"
    ManagedBy   = "Terraform"
  }

  vpc_cidr         = "10.0.0.0/16"
  availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24", "10.0.12.0/24"]
  database_subnet_cidrs = ["10.0.20.0/24", "10.0.21.0/24", "10.0.22.0/24"]
}
