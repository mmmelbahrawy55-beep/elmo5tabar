resource "aws_vpc" "main" {
  provider             = aws.primary
  cidr_block           = local.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  provider          = aws.primary
  count             = length(local.public_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.public_subnet_cidrs[count.index]
  availability_zone = local.availability_zones[count.index]

  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-${local.availability_zones[count.index]}"
    Tier = "public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  provider          = aws.primary
  count             = length(local.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnet_cidrs[count.index]
  availability_zone = local.availability_zones[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-${local.availability_zones[count.index]}"
    Tier = "private"
  })
}

# Database Subnets
resource "aws_subnet" "database" {
  provider          = aws.primary
  count             = length(local.database_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.database_subnet_cidrs[count.index]
  availability_zone = local.availability_zones[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database-${local.availability_zones[count.index]}"
    Tier = "database"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  provider = aws.primary
  vpc_id   = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw"
  })
}

# Elastic IPs for NAT Gateways (one per AZ for HA)
resource "aws_eip" "nat" {
  provider = aws.primary
  count    = length(local.availability_zones)
  domain   = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-eip-${local.availability_zones[count.index]}"
  })
}

# NAT Gateways (one per AZ)
resource "aws_nat_gateway" "main" {
  provider        = aws.primary
  count           = length(local.availability_zones)
  allocation_id   = aws_eip.nat[count.index].id
  subnet_id       = aws_subnet.public[count.index].id
  connectivity_type = "public"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-${local.availability_zones[count.index]}"
  })

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  provider = aws.primary
  vpc_id   = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-rt"
  })
}

resource "aws_route_table_association" "public" {
  provider       = aws.primary
  count          = length(local.public_subnet_cidrs)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Route Tables (one per AZ)
resource "aws_route_table" "private" {
  provider = aws.primary
  count    = length(local.availability_zones)
  vpc_id   = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-rt-${local.availability_zones[count.index]}"
  })
}

resource "aws_route_table_association" "private" {
  provider       = aws.primary
  count          = length(local.private_subnet_cidrs)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Database Route Table
resource "aws_route_table" "database" {
  provider = aws.primary
  count    = length(local.availability_zones)
  vpc_id   = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database-rt-${local.availability_zones[count.index]}"
  })
}

resource "aws_route_table_association" "database" {
  provider       = aws.primary
  count          = length(local.database_subnet_cidrs)
  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.database[count.index].id
}

# VPC Flow Logs
resource "aws_flow_log" "main" {
  provider = aws.primary

  iam_role_arn    = aws_iam_role.vpc_flow_logs.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  destination_options {
    file_format                = "parquet"
    per_hour_partition         = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc-flow-logs"
  })
}

resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  provider = aws.primary
  name              = "/aws/vpc-flow-logs/almokhtabar"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.cloudwatch.arn

  tags = local.common_tags
}

# VPN Gateway
resource "aws_vpn_gateway" "main" {
  provider = aws.primary
  vpc_id   = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpn-gw"
  })
}

resource "aws_customer_gateway" "admin" {
  provider   = aws.primary
  bgp_asn    = 65000
  ip_address = var.admin_vpn_ip
  type       = "ipsec.1"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cgw-admin"
  })
}

resource "aws_vpn_connection" "admin" {
  provider            = aws.primary
  customer_gateway_id = aws_customer_gateway.admin.id
  vpn_gateway_id      = aws_vpn_gateway.main.id
  type                = "ipsec.1"
  static_routes_only  = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpn-admin"
  })
}

# Transit Gateway
resource "aws_ec2_transit_gateway" "main" {
  provider = aws.primary
  description = "Multi-region peering for Al Mokhtabar"
  amazon_side_asn = 64512
  auto_accept_shared_attachments = "enable"
  default_route_table_association = "enable"
  default_route_table_propagation = "enable"
  dns_support = "enable"
  vpn_ecmp_support = "enable"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-tgw"
  })
}

resource "aws_ec2_transit_gateway_vpc_attachment" "main" {
  provider = aws.primary
  subnet_ids         = aws_subnet.private[*].id
  transit_gateway_id = aws_ec2_transit_gateway.main.id
  vpc_id             = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-tgw-attach"
  })
}

# VPC Peering to DR
resource "aws_vpc_peering_connection" "dr" {
  provider    = aws.primary
  peer_vpc_id = aws_vpc.dr.id
  peer_region = "us-west-2"
  vpc_id      = aws_vpc.main.id
  auto_accept = false

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-peering-dr"
  })
}

# VPC Endpoints for Private Access
resource "aws_vpc_endpoint" "s3" {
  provider = aws.primary
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.us-east-1.s3"
  route_table_ids = aws_route_table.private[*].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpce-s3"
  })
}

resource "aws_vpc_endpoint" "ecr_api" {
  provider = aws.primary
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.us-east-1.ecr.api"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpce-ecr-api"
  })
}

resource "aws_vpc_endpoint" "ecr_dkr" {
  provider = aws.primary
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.us-east-1.ecr.dkr"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpce-ecr-dkr"
  })
}

resource "aws_vpc_endpoint" "cloudwatch" {
  provider = aws.primary
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.us-east-1.logs"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpce-logs"
  })
}

# Security Groups
resource "aws_security_group" "vpc_endpoints" {
  provider    = aws.primary
  name        = "${local.name_prefix}-vpce"
  description = "Security group for VPC endpoints"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [local.vpc_cidr]
    description = "HTTPS from VPC"
  }

  tags = local.common_tags
}
