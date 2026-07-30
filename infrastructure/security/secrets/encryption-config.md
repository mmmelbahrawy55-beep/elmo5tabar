# Al Mokhtabar Laboratory - Secrets Management & Encryption Configuration

> **Version**: 1.0.0 | **Last Updated**: 2026-07-30 | **Classification**: CONFIDENTIAL

---

## Table of Contents

1. [Encryption at Rest](#1-encryption-at-rest)
2. [Encryption in Transit](#2-encryption-in-transit)
3. [Key Management](#3-key-management)
4. [Secrets Storage](#4-secrets-storage)
5. [Key Rotation Schedule](#5-key-rotation-schedule)
6. [Emergency Key Access](#6-emergency-key-access)
7. [Offline Master Key Backup](#7-offline-master-key-backup)

---

## 1. Encryption at Rest

### 1.1 Encryption Standards

| Data Type | Algorithm | Key Size | Mode | Implementation |
|-----------|-----------|----------|------|----------------|
| Database (RDS) | AES-256 | 256-bit | CBC | AWS KMS CMK + RDS encryption |
| Redis (ElastiCache) | AES-256 | 256-bit | CBC | AWS KMS CMK |
| EBS volumes | AES-256 | 256-bit | XTS | AWS KMS CMK (default) |
| S3 objects | AES-256 | 256-bit | GCM | SSE-KMS with CMK |
| EFS | AES-256 | 256-bit | GCM | AWS KMS CMK |
| Application secrets | AES-256 | 256-bit | GCM | Vault Transit + KMS |
| PHI fields (in DB) | AES-256 | 256-bit | GCM | Application-level encryption via Vault Transit |
| Audit logs | AES-256 | 256-bit | GCM | Vault Transit + ELK encryption |
| Backups (S3) | AES-256 | 256-bit | GCM | SSE-KMS with dedicated backup CMK |
| TLS certificates | RSA 4096 / ECDSA P-384 | 4096/384 | - | cert-manager + Let's Encrypt |
| JWT signing | RS256 / ES384 | 2048/384 | - | Application-level with Vault-stored keys |

### 1.2 Database Column-Level Encryption

SQL schema for encrypted PHI fields:

- patient_name_encrypted TEXT (AES-256-GCM via Vault Transit)
- national_id_encrypted TEXT (AES-256-GCM via Vault Transit)
- phone_encrypted TEXT (AES-256-GCM via Vault Transit)
- email_encrypted TEXT (AES-256-GCM via Vault Transit)
- national_id_hash TEXT (SHA-256 for indexed lookups)
- phone_hash TEXT (SHA-256 for indexed lookups)

Indexes are created on hash fields for search performance.
Encryption is performed at the application layer using Vault Transit encryption-as-a-service.
Database stores only base64-encoded ciphertext and SHA-256 hashes.

### 1.3 S3 Encryption Configuration

All S3 buckets use SSE-KMS with dedicated KMS CMKs:
- Uploads bucket: Separate KMS key with S3 + Backend access
- Backups bucket: Separate KMS key with backup role access
- Logs bucket: Shared key with CloudWatch/CloudTrail access
- Bucket key enabled to reduce KMS API costs

## 2. Encryption in Transit

### 2.1 TLS Configuration Summary

| Route | Protocol | Min Version | Certificate |
|-------|----------|-------------|-------------|
| User -> Cloudflare | HTTPS | TLS 1.2 | EV (DigiCert) |
| Cloudflare -> ALB | HTTPS | TLS 1.2 | Let's Encrypt (cert-manager) |
| ALB -> Ingress | HTTPS | TLS 1.2 | Internal (cert-manager) |
| Ingress -> Pod | HTTP (within mesh) | - | mTLS (linkerd/istio) |
| Pod -> RDS | PostgreSQL over TLS | TLS 1.2 | RDS certificate |
| Pod -> ElastiCache | Redis over TLS | TLS 1.2 | Amazon certificate |
| Pod -> External API | HTTPS | TLS 1.2 | Public CA |

### 2.2 mTLS for Service Mesh

mTLS is enforced for all service-to-service communication:
- Linkerd or Istio service mesh with automatic mTLS
- Certificate rotation every 24 hours
- Strict mTLS mode (permissive mode disabled in production)
- Verification: linkerd viz edges -n almokhtaber shows "mutual TLS"

### 2.3 Database TLS Configuration

PostgreSQL connection requires:
- sslmode=verify-full
- SSL root certificate validation
- TLS 1.2 minimum
- Strong cipher suites only (ECDHE + AES-GCM)

## 3. Key Management

### 3.1 AWS KMS Key Hierarchy

Root KMS CMK (auto-rotated yearly) generates:
- RDS Encryption Key (no auto-rotation)
- S3 Uploads Key (no auto-rotation)
- Vault Unseal Key (no auto-rotation)
- EBS Default Key (no auto-rotation)
- S3 Backup Key (no auto-rotation)
- Cosign Signing Key (no auto-rotation)

### 3.2 Key Configuration

- All keys: AES-256, deletion window 30 days
- Root key: auto-rotation enabled (annual)
- Service-specific keys: no auto-rotation (controlled by root key rotation)
- Key policies follow least-privilege (only required services can access)
- Cross-account access explicitly denied

### 3.3 Key Usage Permissions

| Key | Services | Access |
|-----|----------|--------|
| platform_root | CloudTrail | Encrypt only |
| s3_uploads | S3, Backend service | Encrypt/Decrypt |
| s3_backups | S3, Backup service | Encrypt/Decrypt |
| vault_unseal | Vault only | Encrypt/Decrypt/GenerateDataKey |
| rds_encryption | RDS service | Encrypt/Decrypt |
| ebs_default | EC2/EBS service | Encrypt/Decrypt |

## 4. Secrets Storage

### 4.1 Secrets Inventory

| Secret | Location | Access Pattern | Rotation | Audit |
|--------|----------|---------------|----------|-------|
| Database master password | Vault (static) | Backend pods via Vault sidecar | 90 days | Yes |
| Dynamic DB credentials | Vault (dynamic) | Auto-generated, 1h TTL | Auto | Yes |
| Redis auth token | Vault (static) | Backend + AI pods | 90 days | Yes |
| Stripe API key | Vault (static) | Backend pods | 90 days | Yes |
| Tap Payments key | Vault (static) | Backend pods | 90 days | Yes |
| Twilio auth token | Vault (static) | Backend pods | 90 days | Yes |
| WhatsApp token | Vault (static) | Backend pods | 90 days | Yes |
| Firebase server key | Vault (static) | Backend pods | 90 days | Yes |
| Auth0 client secret | Vault (static) | Backend + Web pods | 90 days | Yes |
| JWT signing keys | Vault (static) | Backend pods | 30 days | Yes |
| Cloudflare API token | Vault (static) | CI/CD + Backup pods | 90 days | Yes |
| GitHub token | Vault (static) | CI/CD only | 90 days | Yes |
| Sentry auth token | Vault (static) | Backend + Web pods | 90 days | Yes |
| Datadog API key | Vault (static) | Monitoring + All pods | 90 days | Yes |
| MeiliSearch master key | Vault (static) | Backend + AI pods | 90 days | Yes |
| PagerDuty routing key | Vault (static) | Monitoring pods | 90 days | Yes |
| Slack webhook URL | Vault (static) | Monitoring pods | 90 days | Yes |

### 4.2 No Secrets in Git Policy

- .gitignore excludes all .env, .pem, .key, .cert, credential files
- pre-commit hooks run detect-secrets and detect-private-key
- GitHub secret scanning enabled on repository
- Terraform state encrypted in S3 (never local)
- CI/CD secrets injected via environment, never written to files

### 4.3 Encryption in CI/CD

- All secrets stored in GitHub Actions encrypted secrets
- Or fetched dynamically from Vault using vault-action
- Secrets never logged or printed in CI output
- Container images signed with cosign using KMS key
- SBOM generated and signed for each build

## 5. Key Rotation Schedule

### 5.1 Rotation Calendar

| Secret | Rotation Period | Method |
|--------|----------------|--------|
| JWT access token signing key | 30 days | Vault transit key rotation |
| JWT refresh token signing key | 90 days | Vault transit key rotation |
| Database static password | 90 days | Vault static role rotation |
| Redis auth token | 90 days | Vault + ElastiCache update |
| Stripe API keys | 90 days | Stripe dashboard + Vault |
| Cloudflare API tokens | 90 days | Cloudflare dashboard |
| GitHub tokens | 90 days | GitHub settings |
| Twilio auth token | 90 days | Twilio console |
| Auth0 client secret | 90 days | Auth0 dashboard |
| Vault root token | 180 days | Vault regenerate |
| KMS CMK | 1 year (auto) | AWS automatic |
| TLS certs (public) | 1 year | cert-manager / manual |
| TLS certs (Let's Encrypt) | 90 days (auto) | cert-manager |
| SSH keys | 180 days | Manual rotation |
| PHI transit key | 90 days | Vault rotate |
| HSM backup key | Annual | Physical access |

### 5.2 Rotation Automation

- Vault transit keys: Automatic via cronjob in K8s
- Database passwords: Automatic via Vault static roles
- Let's Encrypt certs: Automatic via cert-manager
- KMS CMK: Automatic via AWS (yearly)
- All other manual keys: Calendar reminders + runbook

### 5.3 Rotation Compliance (HIPAA)

- Audit logs MUST show key rotation events
- Key rotation must not cause data loss
- Old keys retained for decryption of existing data
- Monthly compliance report includes key age
- Automated PagerDuty reminders before rotation deadline

## 6. Emergency Key Access

### 6.1 Emergency Scenarios

| Scenario | Method | Approval | Time |
|----------|--------|----------|------|
| Vault sealed | AWS KMS manual trigger | DevOps Lead | 5 min |
| Root token lost | Generate with 3 of 5 shards | 2-of-3 authorized | 15 min |
| KMS key disabled | AWS support + IAM fix | CTO | 1 hour |
| Team member absent | Backup key holder | Security Officer | 30 min |
| Full compromise | Revoke all, restore offline backup | CTO + Security | 4 hours |

### 6.2 Emergency Access Procedure - SOP-EMERGENCY-001

1. Determine scope (what is affected, what is accessible)
2. If Vault accessible: rotate compromised keys, revoke leaked credentials
3. If Vault unreachable: use KMS to generate unseal key, manually unseal
4. If root token lost: collect 3 of 5 key shards, generate new root
5. Post-recovery: log all actions, rotate all credentials, schedule post-mortem

### 6.3 Emergency Contact Tree

Primary Contacts:
- Vault/Security: Faisal Al-Qahtani
- DevOps/K8s: Ahmed Al-Zahrani
- Database: Khaled Al-Otaibi
- CTO: Marwan Al-Abdulkarim

Key Holder Locations:
- Shard 1: Riyadh office (Security Officer safe)
- Shard 2: Jeddah office (DevOps Lead safe)
- Shard 3: Khobar office (CTO safe)
- Shard 4: Al Rajhi Bank safe deposit box #837 (Riyadh)
- Shard 5: Al-Suwaiket & Partners law firm (Riyadh, sealed envelope)

## 7. Offline Master Key Backup

### 7.1 Backup Location: Al Rajhi Bank Safe Deposit Box #837

Contents:
1. YubiHSM2 (anti-static bag) - Vault master key + KMS backup
2. Encrypted USB (Trezor passphrase) - Recovery keys, Terraform state
3. Paper documents (fireproof safe):
   - Shamir Secret Shares (5 of 7 format, 3 required to reconstruct)
   - Emergency recovery procedure
   - Hardware inventory with serial numbers
   - Cryptographic material checksums
4. Printed QR codes for GPG key, emergency wallet, security PGP

Access Requirements:
- 2 of 3 authorized signatories: CTO, Security Officer, Board legal rep
- Bank logs all access
- All access recorded in company audit log
- Quarterly visual inspection, annual full inventory

### 7.2 Backup Verification Schedule

| Check | Frequency | Responsible |
|-------|-----------|-------------|
| Visual inspection | Quarterly | Security Officer |
| Full inventory audit | Annual | CTO + Security Officer |
| Key reconstruction test | Annual | DevOps Lead |
| USB readability | Annual | Security Officer |
| HSM test | Annual | DevOps Lead |
| Recovery drill | Semi-annual | DevOps Team |

### 7.3 Recovery Procedure Summary

1. Collect 3 of 5 key shards from holders
2. Reconstruct master key using Shamir algorithm
3. Authenticate with restored root token
4. Verify all keys and certificates
5. Rotate all keys (post-compromise precaution)
6. Restart services with new credentials
7. Document recovery in incident log

---

## Appendix A: Encryption Quick Reference

| Operation | Algorithm | Key | Tool |
|-----------|-----------|-----|------|
| Encrypt S3 object | AES-256-GCM | KMS CMK | AWS SDK |
| Encrypt EBS volume | AES-256-XTS | KMS CMK | AWS API |
| Encrypt RDS instance | AES-256-CBC | KMS CMK | RDS encryption |
| Encrypt DB column | AES-256-GCM | Vault Transit | Application SDK |
| Sign JWT | RS256/ES384 | Vault | jsonwebtoken |
| Sign container | ECDSA P-384 | KMS/HSM | cosign |
| Hash password | bcrypt (cost 12) | N/A | bcrypt |
| Hash lookup | SHA-256 + pepper | App config | Node crypto |
| mTLS cert | ECDSA P-256 | Vault PKI | linkerd/istio |
| SSH key | Ed25519 | N/A | ssh-keygen |

## Appendix B: Key Size Recommendations

| Key Type | Minimum | Recommended |
|----------|---------|-------------|
| RSA signing | 2048-bit | 4096-bit |
| ECDSA signing | P-256 | P-384 |
| Symmetric encryption | 128-bit | 256-bit |
| HMAC | 256-bit | 256-bit |
| bcrypt hash | cost 10 | cost 12 |
| HSM backup | P-256 | P-384 |
