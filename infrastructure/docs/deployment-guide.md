# Al Mokhtabar Laboratory Platform - Production Deployment Guide

> **Version**: 1.0.0 | **Last Updated**: 2026-07-30 | **Audience**: DevOps / SRE Team

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Infrastructure Provisioning (Terraform)](#2-infrastructure-provisioning-terraform)
3. [Kubernetes Cluster Setup](#3-kubernetes-cluster-setup)
4. [Database Setup](#4-database-setup)
5. [Service Deployment](#5-service-deployment)
6. [DNS & CDN Configuration](#6-dns--cdn-configuration)
7. [CI/CD Pipeline Setup](#7-cicd-pipeline-setup)
8. [Monitoring Stack](#8-monitoring-stack)
9. [Backup & DR Validation](#9-backup--dr-validation)
10. [Post-Deployment Checklist](#10-post-deployment-checklist)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Prerequisites

### 1.1 Required Tools

```powershell
# Verify installed tools and versions
aws --version
# aws-cli/2.15.0 Python/3.11.8 Windows/10 exe/AMD64

terraform --version
# Terraform v1.7.0

kubectl version --client
# Client Version: v1.29.0

helm version
# version.BuildInfo{Version:"v3.14.0"}

gh --version
# gh version 2.45.0

node --version
# v20.11.0

npm --version
# 10.2.4

docker --version
# Docker version 25.0.2

dotnet --version  # if using .NET tools
```

### 1.2 Required Credentials & Access

```powershell
# AWS CLI configuration
aws configure --profile almokhtabar-prod
# AWS Access Key ID: [FROM_VAULT]
# AWS Secret Access Key: [FROM_VAULT]
# Default region: me-south-1
# Default output: json

# Verify identity
aws sts get-caller-identity --profile almokhtabar-prod
# Expected: {
#   "Account": "123456789012",
#   "Arn": "arn:aws:iam::123456789012:user/deploy-bot"
# }

# GitHub CLI authentication
gh auth login --with-token < token.txt
gh auth status

# HashiCorp Cloud (Terraform) token
# Set env var: TF_CLOUD_TOKEN
$env:TF_CLOUD_TOKEN = "xxxxx.atlasv1.xxxxx"

# Kubernetes kubeconfig (set after cluster creation)
$env:KUBECONFIG = "$PWD\kubeconfig-prod.yaml"

# Vault token (short-lived, human auth)
$env:VAULT_TOKEN = "hvs.xxxxx"
$env:VAULT_ADDR = "https://vault.almokhtabar.sa:8200"
```

### 1.3 Repository Structure

```
almokhtaber/
├── infrastructure/
│   ├── terraform/           # Terraform modules
│   │   ├── environments/
│   │   │   ├── dev/         # Development
│   │   │   ├── staging/     # Staging
│   │   │   └── prod/        # Production
│   │   └── modules/         # Reusable modules
│   ├── kubernetes/
│   │   ├── helm/            # Helm charts
│   │   └── manifests/       # Raw manifests
│   ├── security/            # WAF, Vault, Secrets
│   ├── docs/                # Documentation
│   └── scripts/             # Automation scripts
├── apps/
│   ├── web/                 # Next.js 14 frontend
│   ├── backend/             # NestJS backend
│   └── ai-service/          # Python FastAPI
└── .github/
    └── workflows/           # GitHub Actions
```

---

## 2. Infrastructure Provisioning (Terraform)

### 2.1 State Backend Configuration

Create `infrastructure/terraform/environments/prod/backend.tf`:

```hcl
terraform {
  backend "s3" {
    bucket         = "almokhtaber-terraform-state-prod"
    key            = "prod/terraform.tfstate"
    region         = "me-south-1"
    encrypt        = true
    kms_key_id     = "arn:aws:kms:me-south-1:123456789012:key/xxxxx"
    dynamodb_table = "almokhtaber-terraform-locks-prod"
  }
}
```

```powershell
# Initialize Terraform
cd infrastructure/terraform/environments/prod
terraform init -backend-config="profile=almokhtaber-prod"

# Expected output:
# Initializing the backend...
# Initializing provider plugins...
# Terraform has been successfully initialized!
```

### 2.2 Stage-by-Stage Deployment

#### Stage 1: VPC & Networking

```powershell
terraform workspace select prod

terraform plan -target=module.vpc -out=tfplan-vpc.plan
# Review: CIDR 10.0.0.0/16, 3 AZs, 6 subnets (public/private/data per AZ)
terraform apply tfplan-vpc.plan

# Verification
aws ec2 describe-vpcs --filters "Name=tag:Name,Values=almokhtaber-vpc-prod" --profile almokhtaber-prod
# Expected: VPC with CIDR 10.0.0.0/16, state: available
```

#### Stage 2: RDS & ElastiCache

```powershell
terraform plan -target=module.rds -target=module.elasticache -target=module.rds_proxy -out=tfplan-data.plan
terraform apply tfplan-data.plan

# Verification
aws rds describe-db-instances --db-instance-identifier almokhtaber-pg-prod --profile almokhtaber-prod
# Expected: DBInstanceStatus: available, MultiAZ: true

aws elasticache describe-replication-groups --replication-group-id almokhtaber-redis-prod --profile almokhtaber-prod
# Expected: Status: available, MultiAZ: enabled
```

#### Stage 3: EKS Cluster

```powershell
terraform plan -target=module.eks -out=tfplan-eks.plan
terraform apply tfplan-eks.plan

# Configure kubectl
aws eks update-kubeconfig --name almokhtaber-eks-prod --region me-south-1 --profile almokhtaber-prod
$env:KUBECONFIG = "$HOME\.kube\config"

# Verify cluster
kubectl cluster-info
# Expected: Kubernetes control plane is running at https://xxxxx.gr7.me-south-1.eks.amazonaws.com

kubectl get nodes
# Expected: 6 nodes (3 AZs x 2 node groups = system + workers)
```

#### Stage 4: EKS Addons

```powershell
terraform plan -target=module.eks_addons -out=tfplan-addons.plan
# Includes: cert-manager, nginx-ingress, external-dns, cluster-autoscaler, metrics-server
terraform apply tfplan-addons.plan
```

#### Stage 5: Monitoring & Storage

```powershell
terraform plan -target=module.monitoring -target=module.storage -out=tfplan-misc.plan
terraform apply tfplan-misc.plan
```

#### Stage 6: Application Deploy (Initial)

```powershell
terraform plan -target=module.app_deploy -out=tfplan-app.plan
terraform apply tfplan-app.plan
```

### 2.3 Complete Apply (After Review)

```powershell
# Full plan review
terraform plan -out=tfplan-full.plan

# Apply everything
terraform apply tfplan-full.plan

# Verify all outputs
terraform output
```

---

## 3. Kubernetes Cluster Setup

### 3.1 Namespaces

```powershell
kubectl create namespace almokhtaber
kubectl create namespace monitoring
kubectl create namespace cert-manager
kubectl create namespace vault

kubectl label namespace almokhtaber pod-security.kubernetes.io/enforce=restricted
kubectl label namespace almokhtaber pod-security.kubernetes.io/warn=restricted
```

### 3.2 cert-manager

```powershell
helm repo add jetstack https://charts.jetstack.io
helm repo update

helm upgrade --install cert-manager jetstack/cert-manager `
  --namespace cert-manager `
  --create-namespace `
  --set installCRDs=true `
  --set global.leaderElection.namespace=cert-manager `
  --set 'extraArgs={--dns01-recursive-nameservers-only,--dns01-recursive-nameservers=8.8.8.8:53\,1.1.1.1:53}'

# Verify
kubectl get pods -n cert-manager
# Expected: cert-manager-xxx, cert-manager-cainjector-xxx, cert-manager-webhook-xxx (all Running)

# Create ClusterIssuer for Let's Encrypt
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: devops@almokhtabar.sa
    privateKeySecretRef:
      name: letsencrypt-prod-private-key
    solvers:
      - dns01:
          cloudflare:
            apiTokenSecretRef:
              name: cloudflare-api-token
              key: api-token
EOF
```

### 3.3 NGINX Ingress Controller

```powershell
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx `
  --namespace almokhtaber `
  --set controller.replicaCount=2 `
  --set controller.service.type=LoadBalancer `
  --set controller.service.annotations."service\.beta\.kubernetes\.io/aws-load-balancer-type"="external" `
  --set controller.service.annotations."service\.beta\.kubernetes\.io/aws-load-balancer-scheme"="internet-facing" `
  --set controller.service.annotations."service\.beta\.kubernetes\.io/aws-load-balancer-nlb-target-type"="ip" `
  --set controller.service.annotations."service\.beta\.kubernetes\.io/aws-load-balancer-cross-zone-load-balancing-enabled"="true" `
  --set controller.service.annotations."service\.beta\.kubernetes\.io/aws-load-balancer-ssl-ports"="443" `
  --set controller.config.use-forwarded-headers="true" `
  --set controller.config.compress="true" `
  --set controller.config.enable-brotli="true" `
  --set controller.config.brotli-level="4" `
  --set controller.config.ssl-protocols="TLSv1.3 TLSv1.2" `
  --set controller.config.ssl-ciphers="ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384" `
  --set controller.config.hsts="true" `
  --set controller.config.hsts-preload="true" `
  --set controller.config.hsts-max-age="31536000" `
  --set controller.config.hsts-include-subdomains="true" `
  --set controller.resources.requests.cpu="100m" `
  --set controller.resources.requests.memory="256Mi" `
  --set controller.resources.limits.cpu="500m" `
  --set controller.resources.limits.memory="1Gi" `
  --set controller.autoscaling.enabled=true `
  --set controller.autoscaling.minReplicas=2 `
  --set controller.autoscaling.maxReplicas=5 `
  --set controller.autoscaling.targetCPUUtilizationPercentage=80

# Verify
kubectl get svc -n almokhtaber ingress-nginx-controller
# Expected: EXTERNAL-IP assigned (ALB DNS name)

kubectl get pods -n almokhtaber -l app.kubernetes.io/component=controller
# Expected: 2 pods Running
```

### 3.4 external-dns

```powershell
helm upgrade --install external-dns external-dns/external-dns `
  --namespace almokhtaber `
  --set provider=aws `
  --set aws.zoneType=public `
  --set txtOwnerId=almokhtaber-prod `
  --set policy=upsert-only `
  --set registry=txt `
  --set interval=1m `
  --set 'domainFilters[0]=almokhtabar.sa' `
  --set 'domainFilters[1]=api.almokhtabar.sa' `
  --set 'domainFilters[2]=admin.almokhtabar.sa'

# Create IAM role for external-dns (or use IRSA)
eksctl create iamserviceaccount `
  --name external-dns `
  --namespace almokhtaber `
  --cluster almokhtaber-eks-prod `
  --region me-south-1 `
  --attach-policy-arn arn:aws:iam::123456789012:policy/AllowExternalDNSUpdates `
  --approve
```

### 3.5 Cluster Autoscaler

```powershell
helm upgrade --install cluster-autoscaler autoscaler/cluster-autoscaler `
  --namespace kube-system `
  --set autoDiscovery.clusterName=almokhtaber-eks-prod `
  --set awsRegion=me-south-1 `
  --set rbac.serviceAccount.name=cluster-autoscaler `
  --set 'extraArgs.expander=least-waste' `
  --set 'extraArgs.skip-nodes-with-system-pods=false' `
  --set 'extraArgs.balance-similar-node-groups=true' `
  --set 'extraArgs.max-node-provision-time=15m' `
  --set resources.requests.cpu="100m" `
  --set resources.requests.memory="300Mi" `
  --set resources.limits.cpu="500m" `
  --set resources.limits.memory="1Gi"

# Verify
kubectl logs -n kube-system -l app.kubernetes.io/name=cluster-autoscaler --tail=50
# Expected: "1 unregistered nodes" or similar
```

### 3.6 Prometheus Stack

```powershell
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack `
  --namespace monitoring `
  --create-namespace `
  --set grafana.enabled=true `
  --set grafana.adminPassword=$env:GRAFANA_ADMIN_PASSWORD `
  --set grafana.ingress.enabled=true `
  --set grafana.ingress.hosts[0]="grafana.almokhtabar.sa" `
  --set grafana.ingress.tls[0].hosts[0]="grafana.almokhtabar.sa" `
  --set grafana.ingress.tls[0].secretName="grafana-tls" `
  --set grafana.sidecar.dashboards.enabled=true `
  --set grafana.sidecar.datasources.enabled=true `
  --set grafana."grafana\.ini".auth.oauth.enabled=true `
  --set prometheus.prometheusSpec.retention=15d `
  --set prometheus.prometheusSpec.retentionSize=50GB `
  --set prometheus.prometheusSpec.scrapeInterval=30s `
  --set prometheus.prometheusSpec.evaluationInterval=30s `
  --set prometheus.prometheusSpec.resources.requests.memory="2Gi" `
  --set prometheus.prometheusSpec.resources.limits.memory="4Gi" `
  --set alertmanager.enabled=true `
  --set alertmanager.config.receivers[0].name=default `
  --set alertmanager.config.receivers[0].pagerduty_configs[0].routing_key=$env:PAGERDUTY_ROUTING_KEY

# Verify
kubectl get pods -n monitoring
# Expected: prometheus-xxx, grafana-xxx, alertmanager-xxx all Running
```

---

## 4. Database Setup

### 4.1 RDS Creation (via Terraform)

The RDS instance is provisioned in Stage 2 of the Terraform deployment. Verify:

```powershell
aws rds describe-db-instances --db-instance-identifier almokhtaber-pg-prod --profile almokhtaber-prod | ConvertFrom-Json | Select-Object -ExpandProperty DBInstances

# Key properties to verify:
# - DBInstanceStatus: available
# - MultiAZ: true
# - StorageEncrypted: true
# - DeletionProtection: true
# - AutoMinorVersionUpgrade: true
# - BackupRetentionPeriod: 35
```

### 4.2 Database URL Setup

```powershell
# Retrieve RDS endpoint
$RDS_ENDPOINT = aws rds describe-db-instances `
  --db-instance-identifier almokhtaber-pg-prod `
  --profile almokhtaber-prod `
  --query "DBInstances[0].Endpoint.Address" `
  --output text

# Retrieve master password from Secrets Manager
$DB_PASSWORD = aws secretsmanager get-secret-value `
  --secret-id almokhtaber-db-password-prod `
  --profile almokhtaber-prod `
  --query SecretString `
  --output text

# Set connection string (not exported in production - use Vault)
$DATABASE_URL = "postgresql://almokhtaber_admin:$DB_PASSWORD@$RDS_ENDPOINT:5432/almokhtaber_prod?schema=public&connection_limit=20&pool_timeout=10"
```

### 4.3 Run Prisma Migrations

```powershell
# From the backend application directory
cd apps/backend

# Install dependencies if needed
npm ci

# Set env for migration
$env:DATABASE_URL = "postgresql://almokhtaber_admin:$DB_PASSWORD@$RDS_ENDPOINT:5432/almokhtaber_prod?schema=public"

# Run migrations
npx prisma migrate deploy

# Expected output:
# Prisma Migrate deployed the following migrations:
# 20260701000001_init
# 20260705000002_add_lab_orders
# 20260710000003_add_payments
# ...

# Verify migration status
npx prisma migrate status

# Expected: Database schema is up to date!
```

### 4.4 Seed Production Data

```powershell
# Run production seed script
npm run seed:prod

# This seeds:
# - Admin users (3 initial)
# - Lab test catalog (200+ tests)
# - Reference ranges
# - Insurance providers (10+)
# - Branch locations (5 initial)
# - Default configuration

# Verify seed data
npx prisma db execute --stdin <<SQL
SELECT COUNT(*) as "TestCount" FROM "LabTest";
SELECT COUNT(*) as "UserCount" FROM "User" WHERE role = 'ADMIN';
SELECT COUNT(*) as "BranchCount" FROM "Branch";
SQL
```

### 4.5 Verify Replication & Backups

```powershell
# Check automated backups
aws rds describe-db-automated-backups `
  --db-instance-identifier almokhtaber-pg-prod `
  --profile almokhtaber-prod `
  --query "DBInstanceAutomatedBackups[0].BackupRetentionPeriod" `
  --output text
# Expected: 35

# Check read replica lag
aws rds describe-db-instances `
  --db-instance-identifier almokhtaber-pg-replica-prod `
  --profile almokhtaber-prod `
  --query "DBInstances[0].ReadReplicaSourceDBInstanceIdentifier" `
  --output text

# Test manual snapshot
aws rds create-db-snapshot `
  --db-instance-identifier almokhtaber-pg-prod `
  --db-snapshot-identifier pre-deployment-snapshot-$(Get-Date -Format yyyyMMdd-HHmmss) `
  --profile almokhtaber-prod
```

---

## 5. Service Deployment

### 5.1 Build & Push Container Images

```powershell
# Authenticate with GHCR
echo $env:GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Build backend
docker build -t ghcr.io/almokhtaber/backend:latest -f apps/backend/Dockerfile .
docker tag ghcr.io/almokhtaber/backend:latest ghcr.io/almokhtaber/backend:$(Get-Date -Format yyyyMMdd.HHmmss)
docker push ghcr.io/almokhtaber/backend:latest

# Build web
docker build -t ghcr.io/almokhtaber/web:latest -f apps/web/Dockerfile .
docker tag ghcr.io/almokhtaber/web:latest ghcr.io/almokhtaber/web:$(Get-Date -Format yyyyMMdd.HHmmss)
docker push ghcr.io/almokhtaber/web:latest

# Build AI service
docker build -t ghcr.io/almokhtaber/ai-service:latest -f apps/ai-service/Dockerfile .
docker tag ghcr.io/almokhtaber/ai-service:latest ghcr.io/almokhtaber/ai-service:$(Get-Date -Format yyyyMMdd.HHmmss)
docker push ghcr.io/almokhtaber/ai-service:latest

# Create GHCR pull secret for K8s
kubectl create secret docker-registry ghcr-pull-secret `
  --namespace almokhtaber `
  --docker-server=ghcr.io `
  --docker-username=$env:GITHUB_USER `
  --docker-password=$env:GITHUB_TOKEN
```

### 5.2 Deploy with Helm

```powershell
# Set deployment tag
$DEPLOY_TAG = "20260730.120000"

# Deploy all services
helm upgrade --install almokhtaber ./infrastructure/kubernetes/helm/almokhtaber `
  --namespace almokhtaber `
  --values ./infrastructure/kubernetes/helm/values-production.yaml `
  --set global.environment=production `
  --set global.deployTag=$DEPLOY_TAG `
  --set backend.replicaCount=5 `
  --set backend.image.tag=$DEPLOY_TAG `
  --set web.replicaCount=5 `
  --set web.image.tag=$DEPLOY_TAG `
  --set aiService.replicaCount=2 `
  --set aiService.image.tag=$DEPLOY_TAG `
  --set worker.replicaCount=2 `
  --set socket.replicaCount=2 `
  --wait --timeout 10m0s

# Expected output:
# Release "almokhtaber" has been upgraded. Happy Helming!
```

### 5.3 Verify Deployment

```powershell
# Check all pods
kubectl get pods -n almokhtaber -o wide

# Expected: All pods Running, READY 1/1 or 2/2 (with sidecar)

# Check deployments
kubectl get deployments -n almokhtaber

# Check services
kubectl get svc -n almokhtaber

# Check ingress
kubectl get ingress -n almokhtaber

# Describe a problematic pod if any
kubectl describe pod -n almokhtaber -l app=backend
kubectl logs -n almokhtaber -l app=backend --tail=100
```

### 5.4 End-to-End API Verification

```powershell
# Test health endpoint
curl -s -o /dev/null -w "%{http_code}" "https://api.almokhtabar.sa/health"
# Expected: 200

# Full health check
curl -s "https://api.almokhtabar.sa/health" | ConvertFrom-Json | Format-List
# Expected: { status: "healthy", uptime: "...", db: "connected", redis: "connected" }

# Test authentication flow
$TOKEN = curl -s -X POST "https://api.almokhtabar.sa/auth/login" `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@almokhtabar.sa","password":"***"}' | ConvertFrom-Json | Select-Object -ExpandProperty accessToken

# Test authenticated endpoint
curl -s -H "Authorization: Bearer $TOKEN" "https://api.almokhtabar.sa/users/me" | ConvertFrom-Json

# Test search
curl -s "https://api.almokhtabar.sa/lab-tests/search?q=vitamin" | ConvertFrom-Json

# Test websocket
# (via WebSocket client or browser console)

# Verify rate limiting
for ($i=0; $i -lt 110; $i++) {
  $CODE = curl -s -o /dev/null -w "%{http_code}" "https://api.almokhtabar.sa/health"
  if ($i -eq 100) { Write-Host "Request $i: $CODE" }
}
# After 100 req/min, expected: 429 (Too Many Requests)
```

---

## 6. DNS & CDN Configuration

### 6.1 Cloudflare Setup

#### Configure Proxied DNS Records

In Cloudflare Dashboard for `almokhtabar.sa`:

| Type | Name | Value | Proxy |
|------|------|-------|-------|
| A | `@` | `<ALB_IP>` | Proxied |
| A | `api` | `<ALB_IP>` | Proxied |
| A | `admin` | `<ALB_IP>` | Proxied |
| A | `grafana` | `<ALB_IP>` | Proxied |
| CNAME | `www` | `almokhtabar.sa` | Proxied |
| CNAME | `cdn` | `almokhtabar.sa` | Proxied |
| CNAME | `ws` | `almokhtabar.sa` | Proxied |

```powershell
# Alternative: Use Cloudflare API
$CF_TOKEN = "..." # From env or vault

curl.exe -s -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records" `
  -H "Authorization: Bearer $CF_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"type":"A","name":"api","content":"'$ALB_IP'","proxied":true,"ttl":120}'
```

#### SSL/TLS Settings

| Setting | Value |
|---------|-------|
| SSL/TLS encryption mode | Full (strict) |
| Minimum TLS version | 1.2 |
| TLS 1.3 | Enabled |
| Opportunistic encryption | On |
| Always Use HTTPS | On |
| Automatic HTTPS Rewrites | On |
| Certificate type | Advanced (custom uploaded) |
| Edge certificates | Let's Encrypt |

#### Page Rules

```json
[
  {
    "target": "almokhtabar.sa/wp-content/*",
    "actions": {
      "cache_level": "cache_everything",
      "edge_cache_ttl": 604800
    }
  },
  {
    "target": "almokhtabar.sa/_next/static/*",
    "actions": {
      "cache_level": "cache_everything",
      "edge_cache_ttl": 31536000,
      "browser_cache_ttl": 31536000
    }
  },
  {
    "target": "api.almokhtabar.sa/*",
    "actions": {
      "cache_level": "standard",
      "disable_security": false,
      "browser_cache_ttl": 0
    }
  },
  {
    "target": "almokhtabar.sa/uploads/*",
    "actions": {
      "cache_level": "cache_everything",
      "edge_cache_ttl": 86400
    }
  }
]
```

#### Argo Smart Routing

```powershell
# Enable via Cloudflare API
curl.exe -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/argo/smart_routing" `
  -H "Authorization: Bearer $CF_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"value":"on"}'
```

### 6.2 DNSSEC

```powershell
# Enable DNSSEC at registrar level + Cloudflare
curl.exe -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dnssec" `
  -H "Authorization: Bearer $CF_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"status":"active"}'
```

---

## 7. CI/CD Pipeline Setup

### 7.1 GitHub Actions Secrets

Configure the following secrets in GitHub repo: **Settings > Secrets and variables > Actions**

| Secret Name | Description | Source |
|------------|-------------|--------|
| `AWS_ACCESS_KEY_ID` | Deploy IAM user access key | Vault |
| `AWS_SECRET_ACCESS_KEY` | Deploy IAM user secret key | Vault |
| `AWS_REGION` | `me-south-1` | Static |
| `EKS_CLUSTER_NAME` | `almokhtaber-eks-prod` | Static |
| `KUBECONFIG` | Base64-encoded kubeconfig | Generated |
| `GHCR_TOKEN` | GitHub token with packages:write | GitHub |
| `SLACK_WEBHOOK` | Slack deploy notifications | Vault |
| `PAGERDUTY_ROUTING_KEY` | PagerDuty events API | Vault |
| `SENTRY_AUTH_TOKEN` | Sentry release tracking | Vault |
| `DATADOG_API_KEY` | Datadog monitoring | Vault |
| `SONAR_TOKEN` | SonarQube analysis | Vault |
| `CLOUDFLARE_API_TOKEN` | Cloudflare management | Vault |
| `TF_API_TOKEN` | Terraform Cloud token | Vault |

### 7.2 GitHub Container Registry Setup

```powershell
# Ensure packages:write permission
gh api user/packages/container/almokhtaber-backend --method PUT --field visibility="private"

# Set package details
gh api -X PATCH /user/packages/container/almokhtaber-backend `
  --field permission='write' `
  --field description='Al Mokhtabar Backend Service'
```

### 7.3 Branch Protection Rules

Configure in GitHub: **Settings > Branches > Add rule**

| Rule | Value |
|------|-------|
| Branch name pattern | `main` |
| Require pull request reviews | 2 |
| Dismiss stale reviews | Yes |
| Require status checks | `build`, `test`, `lint`, `security-scan` |
| Require branches up to date | Yes |
| Require conversation resolution | Yes |
| Include administrators | Yes |
| Allow force pushes | Never |
| Allow deletions | Never |

### 7.4 Environment Approval Gates

```yaml
# .github/environments.yml (configured via GitHub UI)
environments:
  - name: production
    url: https://almokhtabar.sa
    protection_rules:
      - required_reviewers:
          - devops-lead
          - cto
      - wait_timer: 5  # 5 minute delay before deployment
  - name: staging
    url: https://staging.almokhtabar.sa
    protection_rules:
      - required_reviewers:
          - senior-developer
```

### 7.5 Workflow Files

`.github/workflows/deploy-prod.yml` (key sections):

```yaml
name: Deploy Production
on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: |
          npm ci
          npm run test
          npm run test:e2e

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Trivy scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'ghcr.io/${{ github.repository }}/backend:${{ github.sha }}'
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'
      - name: Upload results
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'

  deploy:
    needs: [test, security-scan]
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: me-south-1
      - name: Deploy with Helm
        run: |
          helm upgrade --install almokhtaber ./infrastructure/kubernetes/helm/almokhtaber \
            --namespace almokhtaber \
            --values ./infrastructure/kubernetes/helm/values-production.yaml \
            --set global.deployTag=${{ github.sha }} \
            --wait --timeout 10m0s
```

---

## 8. Monitoring Stack

### 8.1 Grafana OAuth Setup

```yaml
# Configure in grafana.ini (via Helm values)
grafana.ini:
  server:
    root_url: https://grafana.almokhtabar.sa
  auth.google:
    enabled: true
    allow_sign_up: true
    allowed_domains: almokhtabar.sa
    client_id: $GOOGLE_OAUTH_CLIENT_ID
    client_secret: $GOOGLE_OAUTH_CLIENT_SECRET
    scopes: https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile
    auth_url: https://accounts.google.com/o/oauth2/auth
    token_url: https://oauth2.googleapis.com/token
```

```powershell
# Update Grafana with OAuth
helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack `
  --namespace monitoring `
  --reuse-values `
  --set grafana."grafana\.ini".auth.google.enabled=true `
  --set grafana."grafana\.ini".auth.google.client_id="$GOOGLE_CLIENT_ID" `
  --set grafana."grafana\.ini".auth.google.client_secret="$GOOGLE_CLIENT_SECRET"
```

### 8.2 Import Dashboards

```powershell
# Deploy dashboards as ConfigMaps
kubectl apply -f infrastructure/kubernetes/manifests/grafana-dashboards/ -n monitoring

# Available dashboards:
# - 10000: Kubernetes Cluster Overview
# - 10001: Node Exporter Full
# - 10002: PostgreSQL Metrics
# - 10003: Redis Dashboard
# - 10004: Application Metrics (custom)
# - 10005: Business KPIs (custom)
# - 10006: API Gateway / Ingress
# - 10007: Cost & Usage
# - 10008: Compliance Audit Trail

# Or import via Grafana API
$GRAFANA_TOKEN = "..."

curl.exe -X POST "https://grafana.almokhtabar.sa/api/dashboards/import" `
  -H "Authorization: Bearer $GRAFANA_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"dashboard": {"title": "PostgreSQL", ...}, "overwrite": true}'
```

### 8.3 Configure Alert Notifications

```yaml
# Alertmanager config (via Helm values)
alertmanager:
  config:
    global:
      resolve_timeout: 5m
      pagerduty_url: https://events.pagerduty.com/v2/enqueue
    route:
      receiver: 'pagerduty-critical'
      routes:
        - receiver: 'pagerduty-critical'
          match:
            severity: critical
          continue: true
        - receiver: 'pagerduty-warning'
          match:
            severity: warning
        - receiver: 'slack-info'
          match:
            severity: info
    receivers:
      - name: 'pagerduty-critical'
        pagerduty_configs:
          - routing_key: $PAGERDUTY_ROUTING_KEY
            severity: critical
            description: '{{ template "pagerduty.default.description" . }}'
      - name: 'pagerduty-warning'
        pagerduty_configs:
          - routing_key: $PAGERDUTY_ROUTING_KEY
            severity: warning
      - name: 'slack-info'
        slack_configs:
          - api_url: $SLACK_WEBHOOK
            channel: '#deployments'
            title: '{{ template "slack.title" . }}'
            text: '{{ template "slack.text" . }}'
```

### 8.4 Alert Rules (Key Examples)

```yaml
# PrometheusRule: application-alerts.yaml
groups:
  - name: application
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High HTTP error rate ({{ $value | humanizePercentage }})"

      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "P95 latency above 2s"

      - alert: QueueBacklog
        expr: bull_queue_length > 1000
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Bull queue backlog > 1000 jobs"

      - alert: DBConnectionPoolExhaustion
        expr: pg_stat_database_numbackends > 80
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Database connection pool near exhaustion"
```

### 8.5 ELK Stack Log Shipping

```powershell
# Install Fluent Bit as DaemonSet
helm upgrade --install fluent-bit fluent/fluent-bit `
  --namespace logging `
  --create-namespace `
  --set backend.type=opensearch `
  --set backend.host=opensearch-cluster.almokhtaber.sa `
  --set backend.port=443 `
  --set backend.tls=on `
  --set 'filter.modify[0].condition=key_exists log' `
  --set 'filter.modify[0].set=service,almokhtaber' `
  --set 'filter.modify[0].set=environment,production'

# Verify log shipping
kubectl logs -n logging -l app.kubernetes.io/name=fluent-bit --tail=10

# Test log query in Kibana/OpenSearch Dashboards
# Expected: logs visible with @timestamp, kubernetes.* fields
```

### 8.6 Synthetic Monitoring

```powershell
# Create CloudWatch Synthetics canary
aws synthetics create-canary `
  --name almokhtaber-health-check `
  --runtime-version syn-1.0 `
  --schedule Expression="rate(5 minutes)" `
  --test "{
    Type: 'API',
    Config: {
      url: 'https://api.almokhtabar.sa/health',
      method: 'GET',
      expectedStatusCode: 200,
      expectedBodyText: 'healthy'
    }
  }" `
  --artifact-s3-location s3://almokhtaber-synthetics-prod/ `
  --execution-role-arn arn:aws:iam::123456789012:role/synthetics-canary-role `
  --profile almokhtaber-prod
```

---

## 9. Backup & DR Validation

### 9.1 Run Initial Backup

```powershell
# RDS automated backup (35-day retention - already active)
# Manual snapshot
aws rds create-db-snapshot `
  --db-instance-identifier almokhtaber-pg-prod `
  --db-snapshot-identifier initial-backup-$(Get-Date -Format yyyyMMdd) `
  --profile almokhtaber-prod

# Redis backup (AOF + RDB)
aws elasticache create-snapshot `
  --replication-group-id almokhtaber-redis-prod `
  --snapshot-name initial-backup-$(Get-Date -Format yyyyMMdd) `
  --profile almokhtaber-prod

# EBS snapshots for MeiliSearch data
aws ec2 create-snapshot `
  --volume-id vol-xxxxx `
  --description "MeiliSearch data - initial backup" `
  --tag-specifications 'ResourceType=snapshot,Tags=[{Key=Name,Value=meilisearch-backup}]' `
  --profile almokhtaber-prod

# S3 backup (already replicated cross-region)
aws s3 sync s3://almokhtaber-uploads-prod s3://almokhtaber-dr-backups/uploads `
  --profile almokhtaber-prod
```

### 9.2 Test Restore Procedure

```powershell
# Test RDS restore from snapshot
aws rds restore-db-instance-from-db-snapshot `
  --db-instance-identifier almokhtaber-restore-test `
  --db-snapshot-identifier initial-backup-20260730 `
  --db-instance-class db.r6g.large `
  --vpc-security-group-ids sg-xxxxx `
  --db-subnet-group-name almokhtaber-data-subnet-group `
  --profile almokhtaber-prod

# Wait for restore
aws rds wait db-instance-available `
  --db-instance-identifier almokhtaber-restore-test `
  --profile almokhtaber-prod

# Verify data
$RESTORE_ENDPOINT = aws rds describe-db-instances `
  --db-instance-identifier almokhtaber-restore-test `
  --query "DBInstances[0].Endpoint.Address" `
  --output text `
  --profile almokhtaber-prod

psql -h $RESTORE_ENDPOINT -U almokhtaber_admin -d almokhtaber_prod -c "SELECT COUNT(*) FROM users;"

# Clean up test instance
aws rds delete-db-instance `
  --db-instance-identifier almokhtaber-restore-test `
  --skip-final-snapshot `
  --profile almokhtaber-prod
```

### 9.3 Test Failover to DR (Azure)

```powershell
# Prerequisites: Azure PostgreSQL geo-replication configured
# Test read from DR
$AZ_PG_ENDPOINT = "almokhtaber-pg-dr.postgres.database.azure.com"
psql -h $AZ_PG_ENDPOINT -U almokhtaber_admin@almokhtaber-pg-dr -d almokhtaber_prod -c "SELECT pg_is_in_recovery();"
# Expected: t (true - read replica)

# Failover test steps:
# 1. Stop application traffic
# 2. Promote DR replica to primary
# 3. Update DNS to point to DR
# 4. Start application in DR mode
# 5. Verify functionality
# 6. Fail back to primary

# Record RTO
$FAILOVER_START = Get-Date
# ... execute failover script ...
$FAILOVER_END = Get-Date
$RTO = ($FAILOVER_END - $FAILOVER_START).TotalSeconds
Write-Host "Measured RTO: $RTO seconds"
# Expected: < 180 seconds
```

---

## 10. Post-Deployment Checklist

### 10.1 Lighthouse Audit

```powershell
# Install Lighthouse
npm install -g lighthouse

# Run audit
lighthouse https://almokhtabar.sa `
  --view `
  --preset=desktop `
  --output=json `
  --output-path=./reports/lighthouse-report.json

# Check scores (expected: all 90+)
$REPORT = Get-Content ./reports/lighthouse-report.json | ConvertFrom-Json
Write-Host "Performance: $($REPORT.categories.performance.score * 100)"
Write-Host "Accessibility: $($REPORT.categories.accessibility.score * 100)"
Write-Host "Best Practices: $($REPORT.categories.'best-practices'.score * 100)"
Write-Host "SEO: $($REPORT.categories.seo.score * 100)"
Write-Host "PWA: $($REPORT.categories.pwa.score * 100)"
```

### 10.2 SSL Labs A+ Rating

```powershell
# Test via SSL Labs API (command line)
# Using testssl.sh (run from any Linux host)
# Install: choco install testssl  (Windows alternative)

# Or check via curl
curl -s "https://api.ssllabs.com/api/v3/analyze?host=almokhtabar.sa" | ConvertFrom-Json -Depth 10
# Expected: grade: "A+"

# Manual verification:
# - TLS 1.3 enabled
# - TLS 1.2 enabled
# - TLS 1.1 disabled
# - TLS 1.0 disabled
# - HSTS enabled with preload
# - No RC4, 3DES, or other weak ciphers
```

### 10.3 Test All Integrations

```powershell
# Stripe - Test payment
curl -s -X POST "https://api.almokhtabar.sa/payments/create-intent" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"amount":100,"currency":"sar","paymentMethod":"card"}' | ConvertFrom-Json
# Expected: clientSecret returned

# Tap Payments - Test payment
curl -s -X POST "https://api.almokhtabar.sa/payments/tap/create" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"amount":100,"currency":"SAR","customer":{"first_name":"Test"}}' | ConvertFrom-Json
# Expected: transaction.url and transaction.status

# Twilio SMS - Test OTP
curl -s -X POST "https://api.almokhtabar.sa/auth/send-otp" `
  -H "Content-Type: application/json" `
  -d '{"phone":"+966500000000"}' | ConvertFrom-Json
# Expected: { success: true, messageId: "..." }

# WhatsApp - Test notification
curl -s -X POST "https://api.almokhtabar.sa/notifications/whatsapp/test" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"phone":"+966500000000","template":"appointment_reminder"}' | ConvertFrom-Json
# Expected: { success: true, whatsappMessageId: "..." }

# Firebase - Test push
curl -s -X POST "https://api.almokhtabar.sa/notifications/push/test" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"deviceToken":"...","title":"Test","body":"Hello"}' | ConvertFrom-Json
# Expected: { success: true, fcmMessageId: "..." }
```

### 10.4 Validate Arabic/RTL Rendering

```powershell
# Test Arabic content in API responses
curl -s "https://api.almokhtabar.sa/lab-tests?lang=ar" `
  -H "Authorization: Bearer $TOKEN" | ConvertFrom-Json | Select-Object -First 1 | Format-List
# Expected: Arabic text in nameAr, descriptionAr fields

# Browser test:
# - Open https://almokhtabar.sa/ar
# - Verify: dir="rtl" on html element
# - Verify: appropriate Arabic font (Cairo, Noto Naskh Arabic)
# - Verify: layout mirrors LTR properly
# - Verify: numbers still LTR (Arabic-Indic digits optional)
```

### 10.5 Security Scan

```powershell
# ZAP full scan (using Docker)
docker run --rm -v "$PWD/reports:/zap/wrk" owasp/zap2docker-stable zap-full-scan.py `
  -t https://almokhtabar.sa `
  -r zap-report.html `
  -w zap-report.md

# Verify no high/critical findings
# If findings exist:
#   1. Fix in code
#   2. Re-deploy
#   3. Re-scan

# Verify CSP headers
curl -s -I "https://almokhtabar.sa" | Select-String "content-security-policy"
# Expected: Content-Security-Policy header present with strict directives

# Verify HSTS header
curl -s -I "https://almokhtabar.sa" | Select-String "strict-transport-security"
# Expected: max-age=31536000; includeSubDomains; preload
```

---

## 11. Troubleshooting

### 11.1 Common Issues

| Issue | Symptom | Root Cause | Resolution |
|-------|---------|------------|------------|
| Pods stuck in Pending | `kubectl get pods` shows Pending | Insufficient cluster resources | `kubectl describe pod <name>` to see events; check cluster autoscaler; increase node group size |
| ImagePullBackOff | Pod status ImagePullBackOff | Invalid image tag or registry auth | `kubectl describe pod <name>` to see error; verify image exists in GHCR; verify pull secret |
| Crashing pods with OOMKilled | Pod restarting, OOMKilled in status | Memory limit too low | `kubectl logs --previous <pod>`; increase memory limits in values file |
| Database connection refused | API returns 503, backend logs show connection refused | RDS security group or proxy issue | Verify RDS security group allows EKS nodes; check RDS Proxy status; verify credentials |
| Redis connection timeout | Cache operations slow or failing | Redis cluster overloaded or network | Check Redis CPU/memory metrics; verify cluster mode settings; check VPC endpoints |
| SSL certificate error | Browser shows HTTPS warning | Certificate expired or not issued | Check cert-manager logs; verify DNS propagation; re-issue certificate |
| Cloudflare 521/522 errors | Web returns Cloudflare error page | Origin server unreachable from Cloudflare | Check ALB is accessible from Cloudflare IPs; verify security group allows Cloudflare IP ranges |
| WAF blocking legitimate traffic | Users getting 403 errors | WAF false positive | Check WAF logs; create exception rule; adjust sensitivity |
| Slow page loads | Lighthouse shows poor LCP/CLS | Large images or unoptimized bundles | Optimize images (WebP); code splitting; CDN caching |
| WebSocket disconnects | Socket.IO frequent reconnections | Sticky sessions misconfigured | Verify nginx ingress annotation for sticky sessions; check session affinity |

### 11.2 Debugging Commands

```powershell
# Get detailed pod status
kubectl describe pod -n almokhtaber <pod-name>

# Stream logs from all backend pods
kubectl logs -n almokhtaber -l app=backend --tail=50 -f

# Check events in namespace
kubectl get events -n almokhtaber --sort-by=.lastTimestamp

# Check resource usage
kubectl top pods -n almokhtaber
kubectl top nodes

# Check K8s API server for latency
kubectl get --raw /metrics | Select-String "apiserver_request_duration_seconds"

# Debug DNS resolution inside pod
kubectl exec -n almokhtaber <pod-name> -- nslookup api.almokhtabar.sa

# Check network policy connectivity
kubectl run -n almokhtaber test-pod --image=alpine -- sleep 3600
kubectl exec -n almokhtaber test-pod -- wget -O- http://backend-service:3000/health

# View Helm release status
helm list -n almokhtaber
helm status almokhtaber -n almokhtaber

# Rollback to specific revision
helm history almokhtaber -n almokhtaber
helm rollback almokhtaber 12 -n almokhtaber
```

### 11.3 Escalation Contacts

| Severity | Response Time | Contact | Method |
|----------|--------------|---------|--------|
| SEV1 (System Down) | 15 min | On-call SRE | PagerDuty + Phone |
| SEV2 (Degraded) | 30 min | DevOps Lead | PagerDuty + Slack |
| SEV3 (Minor Issue) | 4 hours | Engineering Team | Slack |
| SEV4 (Question) | 24 hours | DevOps Team | Email / Jira |

### 11.4 Health Check Endpoints

```
GET /health              -> { status, uptime, version, db, redis, meili }
GET /health/readiness    -> 200/503 (K8s readiness probe)
GET /health/liveness     -> 200/503 (K8s liveness probe)
GET /health/db           -> { status: "connected", poolSize, activeConnections }
GET /health/redis        -> { status: "connected", latencyMs }
GET /health/meili        -> { status: "connected", indexCount }
GET /metrics             -> Prometheus metrics
```

---

*End of Deployment Guide. For questions contact devops@almokhtabar.sa*
