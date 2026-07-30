# =============================================================================
# Al Mokhtabar Laboratory - HashiCorp Vault Configuration
# Version: 1.0.0 | Last Updated: 2026-07-30 | Confidential
# =============================================================================

# ===== STORAGE BACKEND =====
# Using Integrated Storage (Raft) for production
# 3-node cluster for high availability

storage "raft" {
  path = "/vault/data"
  node_id = "vault-node-1"

  retry_join {
    leader_api_addr = "https://vault-0.vault-internal:8200"
  }
  retry_join {
    leader_api_addr = "https://vault-1.vault-internal:8200"
  }
  retry_join {
    leader_api_addr = "https://vault-2.vault-internal:8200"
  }

  autopilot {
    cleanup_dead_servers = true
    last_contact_threshold = "200ms"
    max_trailing_logs = 100000
    min_quorum = 2
  }
}

# ===== SEAL CONFIGURATION =====
# Auto-unseal using AWS KMS
seal "awskms" {
  region     = "me-south-1"
  kms_key_id = "arn:aws:kms:me-south-1:123456789012:key/almokhtaber-vault-unseal"
  endpoint   = "kms.me-south-1.amazonaws.com"
}

# ===== LISTENER =====
listener "tcp" {
  address          = "0.0.0.0:8200"
  cluster_address  = "0.0.0.0:8201"
  tls_disable      = false
  tls_cert_file    = "/vault/certs/vault-cert.pem"
  tls_key_file     = "/vault/certs/vault-key.pem"
  tls_client_ca_file = "/vault/certs/vault-ca.pem"

  tls_min_version = "tls12"
  tls_cipher_suites = "TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305,TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305"

  # Strict client certificate verification for mTLS
  tls_require_and_verify_client_cert = true
}

# ===== API CONFIGURATION =====
api_addr         = "https://vault.almokhtabar.sa:8200"
cluster_addr     = "https://vault-active.vault-internal:8201"

# ===== TELEMETRY (Prometheus) =====
telemetry {
  statsite_address     = "statsite.monitoring.svc:8125"
  disable_hostname     = false
  prometheus_retention_time = "12h"
  usage_gauge_period   = "5m"
  maximum_gauge_cardinality = 10000
}

# ===== AUDIT BACKEND =====
audit "file" {
  path         = "/vault/logs/audit.log"
  log_raw      = false
  format       = "json"
  prefix       = "vault-audit:"
  elapsed_ms   = true
}

audit "syslog" {
  facility     = "AUTH"
  tag          = "vault-audit"
  format       = "json"
}

# ===== PLUGIN DIRECTORY =====
plugin_directory = "/vault/plugins"
disable_cache = false
log_level = "Info"
ui = true

# =============================================================================
# POST-UNSEAL CONFIGURATION (Applied via CLI or Terraform Provider)
# =============================================================================

# ---- 1. Enable Secrets Engines ----

# KV v2 secrets engine (for static secrets)
# PATH: secret/
# vault secrets enable -path=secret -version=2 kv

# Database secrets engine (for dynamic PostgreSQL credentials)
# PATH: database/
# vault secrets enable -path=database database

# PKI secrets engine (for internal TLS certificates)
# PATH: pki/
# vault secrets enable -path=pki pki
# vault secrets tune -max-lease-ttl=87600h pki

# Transit secrets engine (for encryption-as-a-service)
# PATH: transit/
# vault secrets enable -path=transit transit

# ---- 2. Enable Authentication Methods ----

# Kubernetes auth method
# PATH: kubernetes/
# vault auth enable -path=kubernetes kubernetes

# JWT/OIDC auth method (for CI/CD pipelines)
# vault auth enable jwt

# AppRole (for machine-to-machine authentication)
# vault auth enable approle

# ---- 3. KV Secrets ----

# Backend secrets
# vault kv put secret/almokhtaber/database \
#   engine=postgresql \
#   host=almokhtaber-pg-prod.xxxxx.me-south-1.rds.amazonaws.com \
#   port=5432 \
#   database=almokhtaber_prod \
#   username=almokhtaber_admin \
#   password=<initial-password>

# vault kv put secret/almokhtaber/redis \
#   host=almokhtaber-redis-prod.xxxxx.ng.0001.me-south-1.cache.amazonaws.com \
#   port=6379 \
#   password=<redis-auth-token>

# vault kv put secret/almokhtaber/meilisearch \
#   host=meilisearch.almokhtaber.svc \
#   port=7700 \
#   master_key=<meili-master-key>

# vault kv put secret/almokhtaber/stripe \
#   publishable_key=pk_live_xxxxx \
#   secret_key=sk_live_xxxxx \
#   webhook_secret=whsec_xxxxx

# vault kv put secret/almokhtaber/tap-payments \
#   api_key=<tap-api-key> \
#   merchant_id=<tap-merchant-id> \
#   webhook_secret=<tap-webhook-secret>

# vault kv put secret/almokhtaber/twilio \
#   account_sid=ACxxxxx \
#   auth_token=<twilio-auth-token> \
#   messaging_service_sid=MGxxxxx \
#   verify_service_sid=VAxxxxx

# vault kv put secret/almokhtaber/whatsapp \
#   phone_number_id=<waba-phone-id> \
#   access_token=<waba-token> \
#   business_account_id=<waba-account-id>

# vault kv put secret/almokhtaber/firebase \
#   server_key=<fcm-server-key> \
#   service_account=<base64-encoded-sa-json>

# vault kv put secret/almokhtaber/auth0 \
#   domain=almokhtaber.auth0.com \
#   client_id=<auth0-client-id> \
#   client_secret=<auth0-client-secret> \
#   api_audience=https://api.almokhtabar.sa

# vault kv put secret/almokhtaber/jwt \
#   access_token_secret=<256-bit-hex> \
#   refresh_token_secret=<256-bit-hex>

# vault kv put secret/almokhtaber/cloudflare \
#   api_token=<cf-api-token> \
#   zone_id=<cf-zone-id> \
#   account_id=<cf-account-id>

# vault kv put secret/almokhtaber/sentry \
#   dsn=https://xxxxx@o123456.ingest.sentry.io/123456 \
#   auth_token=<sentry-auth-token>

# vault kv put secret/almokhtaber/datadog \
#   api_key=<dd-api-key> \
#   app_key=<dd-app-key>

# ---- 4. Database Secrets Engine ----

# Configure PostgreSQL connection
# vault write database/config/almokhtaber-pg \
#   plugin_name=postgresql-database-plugin \
#   allowed_roles="*" \
#   connection_url="postgresql://{{username}}:{{password}}@almokhtaber-pg-prod.xxxxx.me-south-1.rds.amazonaws.com:5432/almokhtaber_prod?sslmode=verify-full" \
#   username="vault_admin" \
#   password="<initial-admin-password>"

# Dynamic role for backend service (1h TTL)
# vault write database/roles/backend-dynamic-role \
#   db_name=almokhtaber-pg \
#   creation_statements="CREATE USER \"{{name}}\" WITH PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
#   default_ttl="1h" \
#   max_ttl="24h"

# Dynamic role for reporting (read-only, 4h TTL)
# vault write database/roles/reporting-dynamic-role \
#   db_name=almokhtaber-pg \
#   creation_statements="CREATE USER \"{{name}}\" WITH PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; GRANT SELECT ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
#   default_ttl="4h" \
#   max_ttl="24h"

# Static role for admin (rotated every 24h)
# vault write database/static-roles/almokhtaber-admin \
#   db_name=almokhtaber-pg \
#   username=almokhtaber_admin \
#   rotation_period="86400s"

# ---- 5. PKI Secrets Engine ----

# Generate internal root CA
# vault write pki/root/generate/internal \
#   common_name="almokhtabar.sa Internal CA" \
#   ttl=87600h

# Configure CA and CRL URLs
# vault write pki/config/urls \
#   issuing_certificates="https://vault.almokhtabar.sa:8200/v1/pki/ca" \
#   crl_distribution_points="https://vault.almokhtabar.sa:8200/v1/pki/crl"

# PKI role for service mesh (mTLS)
# vault write pki/roles/service-mesh \
#   allowed_domains=almokhtabar.sa \
#   allow_subdomains=true \
#   allow_any_name=true \
#   allow_localhost=true \
#   max_ttl=720h \
#   key_type=ec \
#   key_bits=256 \
#   server_flag=true \
#   client_flag=true \
#   require_cn=false

# PKI role for PostgreSQL client certs
# vault write pki/roles/postgresql \
#   allowed_domains=postgres.database.azure.com,amazonaws.com \
#   allow_subdomains=true \
#   max_ttl=720h \
#   key_type=ec \
#   key_bits=256 \
#   server_flag=true \
#   client_flag=true \
#   require_cn=false

# ---- 6. Transit Key Configuration ----

# Create encryption keys
# vault write -f transit/keys/backend-key
# vault write -f transit/keys/web-key
# vault write -f transit/keys/ai-key
# vault write -f transit/keys/phi-key      # For PHI encryption
# vault write -f transit/keys/audit-key    # For audit log encryption

# Configure PHI key rotation (90 days)
# vault write transit/keys/phi-key/config auto_rotate_period=7776000

# ---- 7. Kubernetes Auth ----

# vault write auth/kubernetes/config \
#   kubernetes_host="https://kubernetes.default.svc" \
#   token_reviewer_jwt="(cat /var/run/secrets/kubernetes.io/serviceaccount/token)"

# ---- 8. Policies ----

# Backend service policy
path "secret/data/almokhtaber/database" {
  capabilities = ["read"]
}
path "secret/data/almokhtaber/redis" {
  capabilities = ["read"]
}
path "secret/data/almokhtaber/meilisearch" {
  capabilities = ["read"]
}
path "secret/data/almokhtaber/stripe" {
  capabilities = ["read"]
}
path "secret/data/almokhtaber/tap-payments" {
  capabilities = ["read"]
}
path "secret/data/almokhtaber/twilio" {
  capabilities = ["read"]
}
path "secret/data/almokhtaber/whatsapp" {
  capabilities = ["read"]
}
path "secret/data/almokhtaber/firebase" {
  capabilities = ["read"]
}
path "secret/data/almokhtaber/auth0" {
  capabilities = ["read"]
}
path "secret/data/almokhtaber/jwt" {
  capabilities = ["read"]
}
path "secret/data/almokhtaber/sentry" {
  capabilities = ["read"]
}
path "secret/data/almokhtaber/datadog" {
  capabilities = ["read"]
}
path "database/creds/backend-dynamic-role" {
  capabilities = ["read"]
}
path "database/creds/reporting-dynamic-role" {
  capabilities = ["read"]
}
path "pki/issue/service-mesh" {
  capabilities = ["create", "update"]
}
path "transit/encrypt/backend-key" {
  capabilities = ["create", "update"]
}
path "transit/decrypt/backend-key" {
  capabilities = ["create", "update"]
}

# Web service policy
path "secret/data/almokhtaber/auth0" {
  capabilities = ["read"]
}
path "secret/data/almokhtaber/sentry" {
  capabilities = ["read"]
}
path "secret/data/almokhtaber/datadog" {
  capabilities = ["read"]
}
path "transit/encrypt/web-key" {
  capabilities = ["create", "update"]
}
path "transit/decrypt/web-key" {
  capabilities = ["create", "update"]
}

# AI service policy
path "secret/data/almokhtaber/database" {
  capabilities = ["read"]
}
path "secret/data/almokhtaber/redis" {
  capabilities = ["read"]
}
path "secret/data/almokhtaber/meilisearch" {
  capabilities = ["read"]
}
path "secret/data/almokhtaber/vertex-ai" {
  capabilities = ["read"]
}
path "database/creds/reporting-dynamic-role" {
  capabilities = ["read"]
}
path "transit/encrypt/ai-key" {
  capabilities = ["create", "update"]
}
path "transit/decrypt/ai-key" {
  capabilities = ["create", "update"]
}

# Backup service policy
path "secret/data/almokhtaber/database" {
  capabilities = ["read"]
}
path "secret/data/almokhtaber/cloudflare" {
  capabilities = ["read"]
}
path "database/static-roles/*" {
  capabilities = ["read"]
}
path "pki/issue/postgresql" {
  capabilities = ["create", "update"]
}

# ---- 9. Roles (Bound to K8s Service Accounts) ----

# vault write auth/kubernetes/role/backend-service \
#   bound_service_account_names=backend-service-account \
#   bound_service_account_namespaces=almokhtaber \
#   policies=backend-service \
#   ttl=1h

# vault write auth/kubernetes/role/web-service \
#   bound_service_account_names=web-service-account \
#   bound_service_account_namespaces=almokhtaber \
#   policies=web-service \
#   ttl=1h

# vault write auth/kubernetes/role/ai-service \
#   bound_service_account_names=ai-service-account \
#   bound_service_account_namespaces=almokhtaber \
#   policies=ai-service \
#   ttl=1h

# vault write auth/kubernetes/role/backup-service \
#   bound_service_account_names=backup-service-account \
#   bound_service_account_namespaces=almokhtaber \
#   policies=backup-service \
#   ttl=4h

# ---- 10. DR Replication ----

# Enable performance replication to DR region (Azure)
# Primary: vault.almokhtabar.sa (AWS, me-south-1)
# Secondary: vault-dr.almokhtabar.sa (Azure, UAENorth)

# On primary:
# vault write -f sys/replication/performance/primary/enable

# On secondary:
# vault write sys/replication/performance/secondary/enable \
#   token=<primary-replication-token>

# ---- 11. Emergency Commands ----

# Seal all nodes:
# vault operator seal

# Check seal status:
# curl https://vault.almokhtabar.sa:8200/v1/sys/seal-status

# Check health:
# curl https://vault.almokhtabar.sa:8200/v1/sys/health

# Generate root token (requires 3 unseal key shards):
# vault operator generate-root -init
# vault operator generate-root -nonce=<nonce> <shard-1>
# vault operator generate-root -nonce=<nonce> <shard-2>
# vault operator generate-root -nonce=<nonce> <shard-3>
