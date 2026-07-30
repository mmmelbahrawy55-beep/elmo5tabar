data "aws_iam_policy_document" "eks_assume_role" {
  provider = aws.primary
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["eks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "eks_cluster" {
  provider           = aws.primary
  name               = "${local.name_prefix}-eks-cluster-role"
  assume_role_policy = data.aws_iam_policy_document.eks_assume_role.json

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  provider   = aws.primary
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster.name
}

resource "aws_iam_role_policy_attachment" "eks_service_policy" {
  provider   = aws.primary
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSServicePolicy"
  role       = aws_iam_role.eks_cluster.name
}

resource "aws_iam_role_policy_attachment" "eks_cloudwatch_policy" {
  provider   = aws.primary
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
  role       = aws_iam_role.eks_cluster.name
}

resource "aws_kms_key" "eks" {
  provider                = aws.primary
  description             = "KMS key for EKS secrets encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "eks" {
  provider = aws.primary
  name              = "/aws/eks/almokhtabar/cluster"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.cloudwatch.arn

  tags = local.common_tags
}

resource "aws_eks_cluster" "main" {
  provider = aws.primary
  name     = "${local.name_prefix}-cluster"
  version  = "1.29"
  role_arn = aws_iam_role.eks_cluster.arn

  vpc_config {
    subnet_ids              = concat(aws_subnet.private[*].id, aws_subnet.public[*].id)
    endpoint_private_access = true
    endpoint_public_access  = true
    public_access_cidrs     = var.eks_public_access_cidrs
    security_group_ids      = [aws_security_group.eks_cluster.id]
  }

  encryption_config {
    provider {
      key_arn = aws_kms_key.eks.arn
    }
    resources = ["secrets"]
  }

  enabled_cluster_log_types = [
    "api",
    "audit",
    "authenticator",
    "controllerManager",
    "scheduler",
  ]

  kubernetes_network_config {
    service_ipv4_cidr = "10.100.0.0/16"
    ip_family         = "ipv4"
  }

  depends_on = [
    aws_cloudwatch_log_group.eks,
    aws_iam_role_policy_attachment.eks_cluster_policy,
    aws_iam_role_policy_attachment.eks_service_policy,
  ]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-eks-cluster"
  })
}

# OIDC Provider
data "tls_certificate" "eks" {
  provider = aws.primary
  url = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

resource "aws_iam_openid_connect_provider" "eks" {
  provider = aws.primary
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.main.identity[0].oidc[0].issuer

  tags = local.common_tags
}

# EKS Cluster Security Group
resource "aws_security_group" "eks_cluster" {
  provider    = aws.primary
  name        = "${local.name_prefix}-eks-cluster-sg"
  description = "EKS cluster security group"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8", var.admin_vpn_cidr]
    description = "Kubernetes API access"
  }

  ingress {
    from_port   = 10250
    to_port     = 10250
    protocol    = "tcp"
    cidr_blocks = [local.vpc_cidr]
    description = "kubelet access"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = local.common_tags
}

# IAM role for node groups
data "aws_iam_policy_document" "eks_node_assume" {
  provider = aws.primary
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "eks_node" {
  provider           = aws.primary
  name               = "${local.name_prefix}-eks-node-role"
  assume_role_policy = data.aws_iam_policy_document.eks_node_assume.json

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "eks_node_worker" {
  provider   = aws.primary
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_node.name
}

resource "aws_iam_role_policy_attachment" "eks_node_cni" {
  provider   = aws.primary
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_node.name
}

resource "aws_iam_role_policy_attachment" "eks_node_ecr" {
  provider   = aws.primary
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_node.name
}

resource "aws_iam_role_policy_attachment" "eks_node_ssm" {
  provider   = aws.primary
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
  role       = aws_iam_role.eks_node.name
}

resource "aws_iam_role_policy_attachment" "eks_node_cloudwatch" {
  provider   = aws.primary
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
  role       = aws_iam_role.eks_node.name
}

# Security group for node groups
resource "aws_security_group" "eks_nodes" {
  provider    = aws.primary
  name        = "${local.name_prefix}-eks-nodes-sg"
  description = "Security group for EKS node groups"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = [local.vpc_cidr]
    description = "Node to node traffic"
  }

  ingress {
    from_port   = 1025
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = [local.vpc_cidr]
    description = "Node traffic"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = local.common_tags
}

# Launch template for node groups
resource "aws_launch_template" "eks_nodes" {
  provider = aws.primary
  name_prefix = "${local.name_prefix}-eks-node-"
  description = "Launch template for EKS managed node groups"

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 100
      volume_type           = "gp3"
      iops                  = 3000
      throughput            = 125
      delete_on_termination = true
      encrypted             = true
      kms_key_id            = aws_kms_key.eks.arn
    }
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 2
  }

  monitoring {
    enabled = true
  }

  tag_specifications {
    resource_type = "instance"
    tags = local.common_tags
  }

  tag_specifications {
    resource_type = "volume"
    tags = local.common_tags
  }
}

# General purpose node group
resource "aws_eks_node_group" "general" {
  provider = aws.primary
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${local.name_prefix}-general"
  node_role_arn   = aws_iam_role.eks_node.arn
  subnet_ids      = aws_subnet.private[*].id
  version         = "1.29"
  instance_types  = ["t3.large", "t3.xlarge"]

  capacity_type  = "ON_DEMAND"
  disk_size      = 100

  scaling_config {
    desired_size = 3
    min_size     = 3
    max_size     = 20
  }

  update_config {
    max_unavailable = 1
  }

  launch_template {
    id      = aws_launch_template.eks_nodes.id
    version = "$Latest"
  }

  labels = {
    "nodegroup-type" = "general"
    "workload"       = "applications"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-eks-ng-general"
  })

  depends_on = [
    aws_iam_role_policy_attachment.eks_node_worker,
    aws_iam_role_policy_attachment.eks_node_cni,
    aws_iam_role_policy_attachment.eks_node_ecr,
  ]
}

# CPU-optimized node group (spot with OD fallback)
resource "aws_eks_node_group" "cpu_optimized" {
  provider = aws.primary
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${local.name_prefix}-cpu-optimized"
  node_role_arn   = aws_iam_role.eks_node.arn
  subnet_ids      = aws_subnet.private[*].id
  version         = "1.29"
  instance_types  = ["c6i.2xlarge", "c6i.4xlarge"]

  capacity_type  = "SPOT"
  disk_size      = 100

  scaling_config {
    desired_size = 2
    min_size     = 0
    max_size     = 10
  }

  update_config {
    max_unavailable = 1
  }

  launch_template {
    id      = aws_launch_template.eks_nodes.id
    version = "$Latest"
  }

  labels = {
    "nodegroup-type" = "cpu-optimized"
    "workload"       = "compute"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-eks-ng-cpu"
  })

  depends_on = [
    aws_iam_role_policy_attachment.eks_node_worker,
    aws_iam_role_policy_attachment.eks_node_cni,
    aws_iam_role_policy_attachment.eks_node_ecr,
  ]
}

# Memory-optimized node group
resource "aws_eks_node_group" "memory_optimized" {
  provider = aws.primary
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${local.name_prefix}-memory-optimized"
  node_role_arn   = aws_iam_role.eks_node.arn
  subnet_ids      = aws_subnet.private[*].id
  version         = "1.29"
  instance_types  = ["r6i.2xlarge", "r6i.4xlarge"]

  capacity_type  = "SPOT"
  disk_size      = 200

  scaling_config {
    desired_size = 2
    min_size     = 0
    max_size     = 10
  }

  update_config {
    max_unavailable = 1
  }

  launch_template {
    id      = aws_launch_template.eks_nodes.id
    version = "$Latest"
  }

  labels = {
    "nodegroup-type" = "memory-optimized"
    "workload"       = "database-cache"
  }

  taint {
    key    = "dedicated"
    value  = "memory-intensive"
    effect = "NO_SCHEDULE"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-eks-ng-memory"
  })

  depends_on = [
    aws_iam_role_policy_attachment.eks_node_worker,
    aws_iam_role_policy_attachment.eks_node_cni,
    aws_iam_role_policy_attachment.eks_node_ecr,
  ]
}

# EKS Addons
resource "aws_eks_addon" "vpc_cni" {
  provider = aws.primary
  cluster_name  = aws_eks_cluster.main.name
  addon_name    = "vpc-cni"
  addon_version = "v1.17.1-eksbuild.1"
  resolve_conflicts_on_create = "OVERWRITE"

  tags = local.common_tags
}

resource "aws_eks_addon" "coredns" {
  provider = aws.primary
  cluster_name  = aws_eks_cluster.main.name
  addon_name    = "coredns"
  addon_version = "v1.11.1-eksbuild.4"
  resolve_conflicts_on_create = "OVERWRITE"

  tags = local.common_tags
}

resource "aws_eks_addon" "kube_proxy" {
  provider = aws.primary
  cluster_name  = aws_eks_cluster.main.name
  addon_name    = "kube-proxy"
  addon_version = "v1.29.0-eksbuild.2"
  resolve_conflicts_on_create = "OVERWRITE"

  tags = local.common_tags
}

resource "aws_eks_addon" "aws_ebs_csi_driver" {
  provider = aws.primary
  cluster_name  = aws_eks_cluster.main.name
  addon_name    = "aws-ebs-csi-driver"
  addon_version = "v1.28.0-eksbuild.1"
  service_account_role_arn = aws_iam_role.ebs_csi.arn
  resolve_conflicts_on_create = "OVERWRITE"

  tags = local.common_tags
}

resource "aws_eks_addon" "aws_efs_csi_driver" {
  provider = aws.primary
  cluster_name  = aws_eks_cluster.main.name
  addon_name    = "aws-efs-csi-driver"
  addon_version = "v1.7.0-eksbuild.1"
  service_account_role_arn = aws_iam_role.efs_csi.arn
  resolve_conflicts_on_create = "OVERWRITE"

  tags = local.common_tags
}

# EBS CSI IAM Role (IRSA)
data "aws_iam_policy_document" "ebs_csi_assume" {
  provider = aws.primary
  statement {
    effect = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.eks.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "${replace(aws_eks_cluster.main.identity[0].oidc[0].issuer, "https://", "")}:sub"
      values   = ["system:serviceaccount:kube-system:ebs-csi-controller-sa"]
    }
  }
}

resource "aws_iam_role" "ebs_csi" {
  provider           = aws.primary
  name               = "${local.name_prefix}-ebs-csi-role"
  assume_role_policy = data.aws_iam_policy_document.ebs_csi_assume.json

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "ebs_csi" {
  provider   = aws.primary
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy"
  role       = aws_iam_role.ebs_csi.name
}

# EFS CSI IAM Role (IRSA)
data "aws_iam_policy_document" "efs_csi_assume" {
  provider = aws.primary
  statement {
    effect = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.eks.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "${replace(aws_eks_cluster.main.identity[0].oidc[0].issuer, "https://", "")}:sub"
      values   = ["system:serviceaccount:kube-system:efs-csi-controller-sa"]
    }
  }
}

resource "aws_iam_role" "efs_csi" {
  provider           = aws.primary
  name               = "${local.name_prefix}-efs-csi-role"
  assume_role_policy = data.aws_iam_policy_document.efs_csi_assume.json

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "efs_csi" {
  provider   = aws.primary
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEFSCSIDriverPolicy"
  role       = aws_iam_role.efs_csi.name
}

# EFS File System
resource "aws_efs_file_system" "main" {
  provider = aws.primary
  creation_token = "${local.name_prefix}-efs"
  encrypted      = true
  kms_key_id     = aws_kms_key.eks.arn

  performance_mode                = "generalPurpose"
  throughput_mode                 = "bursting"
  lifecycle_policy {
    transition_to_ia = "AFTER_30_DAYS"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-efs"
  })
}

resource "aws_efs_mount_target" "main" {
  provider = aws.primary
  count           = length(local.availability_zones)
  file_system_id  = aws_efs_file_system.main.id
  subnet_id       = aws_subnet.private[count.index].id
  security_groups = [aws_security_group.efs.id]
}

resource "aws_security_group" "efs" {
  provider = aws.primary
  name        = "${local.name_prefix}-efs-sg"
  description = "NFS access to EFS from EKS nodes"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 2049
    to_port         = 2049
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_nodes.id]
    description     = "NFS from EKS nodes"
  }

  tags = local.common_tags
}

# ConfigMap for cluster access
data "aws_eks_cluster_auth" "main" {
  provider = aws.primary
  name = aws_eks_cluster.main.name
}
