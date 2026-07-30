resource "aws_vpc" "dr" {
  provider             = aws.dr
  cidr_block           = var.dr_vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc-dr"
  })
}

resource "aws_subnet" "dr_public" {
  provider          = aws.dr
  count             = length(var.dr_public_subnet_cidrs)
  vpc_id            = aws_vpc.dr.id
  cidr_block        = var.dr_public_subnet_cidrs[count.index]
  availability_zone = var.dr_availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-dr-public-${var.dr_availability_zones[count.index]}"
    Tier = "public"
  })
}

resource "aws_subnet" "dr_private" {
  provider          = aws.dr
  count             = length(var.dr_private_subnet_cidrs)
  vpc_id            = aws_vpc.dr.id
  cidr_block        = var.dr_private_subnet_cidrs[count.index]
  availability_zone = var.dr_availability_zones[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-dr-private-${var.dr_availability_zones[count.index]}"
    Tier = "private"
  })
}

resource "aws_subnet" "dr_database" {
  provider          = aws.dr
  count             = length(var.dr_database_subnet_cidrs)
  vpc_id            = aws_vpc.dr.id
  cidr_block        = var.dr_database_subnet_cidrs[count.index]
  availability_zone = var.dr_availability_zones[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-dr-database-${var.dr_availability_zones[count.index]}"
    Tier = "database"
  })
}

resource "aws_internet_gateway" "dr" {
  provider = aws.dr
  vpc_id   = aws_vpc.dr.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-dr-igw"
  })
}

resource "aws_eip" "dr_nat" {
  provider = aws.dr
  count    = length(var.dr_availability_zones)
  domain   = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-dr-nat-eip-${var.dr_availability_zones[count.index]}"
  })
}

resource "aws_nat_gateway" "dr" {
  provider          = aws.dr
  count             = length(var.dr_availability_zones)
  allocation_id     = aws_eip.dr_nat[count.index].id
  subnet_id         = aws_subnet.dr_public[count.index].id
  connectivity_type = "public"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-dr-nat-${var.dr_availability_zones[count.index]}"
  })

  depends_on = [aws_internet_gateway.dr]
}

resource "aws_route_table" "dr_public" {
  provider = aws.dr
  vpc_id   = aws_vpc.dr.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.dr.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-dr-public-rt"
  })
}

resource "aws_route_table_association" "dr_public" {
  provider       = aws.dr
  count          = length(var.dr_public_subnet_cidrs)
  subnet_id      = aws_subnet.dr_public[count.index].id
  route_table_id = aws_route_table.dr_public.id
}

resource "aws_route_table" "dr_private" {
  provider = aws.dr
  count    = length(var.dr_availability_zones)
  vpc_id   = aws_vpc.dr.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.dr[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-dr-private-rt-${var.dr_availability_zones[count.index]}"
  })
}

resource "aws_route_table_association" "dr_private" {
  provider       = aws.dr
  count          = length(var.dr_private_subnet_cidrs)
  subnet_id      = aws_subnet.dr_private[count.index].id
  route_table_id = aws_route_table.dr_private[count.index].id
}

# Transit Gateway peering to primary
resource "aws_ec2_transit_gateway_peering_attachment" "dr" {
  provider = aws.dr
  peer_region             = "us-east-1"
  peer_transit_gateway_id = aws_ec2_transit_gateway.main.id
  transit_gateway_id      = aws_ec2_transit_gateway.dr.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-tgw-peering-dr"
  })
}

resource "aws_ec2_transit_gateway" "dr" {
  provider = aws.dr
  description = "DR Transit Gateway for Al Mokhtabar"
  amazon_side_asn = 64513
  auto_accept_shared_attachments = "enable"
  default_route_table_association = "enable"
  default_route_table_propagation = "enable"
  dns_support = "enable"
  vpn_ecmp_support = "enable"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-tgw-dr"
  })
}

# DR Security Group for RDS
resource "aws_security_group" "rds_dr" {
  provider = aws.dr
  name        = "${local.name_prefix}-rds-sg-dr"
  description = "Security group for DR RDS"
  vpc_id      = aws_vpc.dr.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"]
    description = "PostgreSQL from VPC"
  }

  tags = local.common_tags
}

# DR DB subnet group
resource "aws_db_subnet_group" "dr" {
  provider   = aws.dr
  name       = "${local.name_prefix}-db-subnet-group-dr"
  subnet_ids = aws_subnet.dr_database[*].id

  tags = local.common_tags
}
