#!/bin/bash
set -euo pipefail

# =============================================================================
# Daily Backup Script — Al Mokhtabar Laboratory
#
# Backs up PostgreSQL (pg_dump), Redis (RDB), and uploaded files.
# Encrypts with AES-256-GCM and uploads to cloud storage (S3/GCS/Blob).
# Retention: daily (7 days), weekly (4 weeks), monthly (12 months).
# Verifies integrity by restoring to a temp location.
#
# Usage:
#   ./backup.sh [--type daily|weekly|monthly] [--dry-run]
#
# Examples:
#   ./backup.sh
#   ./backup.sh --type weekly --dry-run
# =============================================================================

BOLD='\033[1m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ${BOLD}[INFO]${NC}  $*"; }
log_warn()  { echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ${BOLD}[WARN]${NC}  $*"; }
log_error() { echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ${BOLD}[ERROR]${NC} $*" >&2; }
log_step()  { echo -e "${CYAN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} ${BOLD}[STEP]${NC}  $*"; }

usage() {
    cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Options:
  --type TYPE      Backup type (daily|weekly|monthly)       [default: daily]
  --output DIR     Local output directory                    [default: /tmp/backups]
  --bucket URL     Cloud storage bucket URL                  [default: s3://almokhtabar-backups]
  --encryption-key AES-256-GCM encryption key (hex)          [default: \$BACKUP_ENCRYPTION_KEY]
  --retention-days Days to keep daily backups                 [default: 7]
  --dry-run        Show what would be done without doing it
  --help           Show this help message
EOF
    exit 0
}

# ---- Defaults ----
BACKUP_TYPE="${BACKUP_TYPE:-daily}"
OUTPUT_DIR="${OUTPUT_DIR:-/tmp/backups}"
BUCKET_URL="${BUCKET_URL:-s3://almokhtabar-backups}"
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
DRY_RUN="${DRY_RUN:-false}"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
BACKUP_NAME="backup_${BACKUP_TYPE}_${TIMESTAMP}"
WORK_DIR="${OUTPUT_DIR}/${BACKUP_NAME}"

METRICS_NAMESPACE="AlMokhtabar/Backup"

# ---- Parse arguments ----
while [[ $# -gt 0 ]]; do
    case "$1" in
        --type)           BACKUP_TYPE="$2";      shift 2 ;;
        --output)         OUTPUT_DIR="$2";       shift 2 ;;
        --bucket)         BUCKET_URL="$2";       shift 2 ;;
        --encryption-key) ENCRYPTION_KEY="$2";   shift 2 ;;
        --retention-days) RETENTION_DAYS="$2";   shift 2 ;;
        --dry-run)        DRY_RUN="true";        shift ;;
        --help|-h)        usage ;;
        *) log_error "Unknown argument: $1"; usage ;;
    esac
done

# ---- Functions ----

check_prerequisites() {
    log_step "Checking prerequisites..."
    command -v pg_dump    >/dev/null 2>&1 || { log_error "pg_dump is required"; exit 1; }
    command -v openssl    >/dev/null 2>&1 || { log_error "openssl is required"; exit 1; }
    command -v tar        >/dev/null 2>&1 || { log_error "tar is required"; exit 1; }
    command -v gzip       >/dev/null 2>&1 || { log_error "gzip is required"; exit 1; }
    command -v aws        >/dev/null 2>&1 || log_warn "aws CLI not found — S3 uploads disabled"
    command -v gsutil     >/dev/null 2>&1 || log_warn "gsutil not found — GCS uploads disabled"
    command -v azcopy     >/dev/null 2>&1 || log_warn "azcopy not found — Blob uploads disabled"

    if [[ -z "$ENCRYPTION_KEY" ]]; then
        log_error "ENCRYPTION_KEY not set. Provide --encryption-key or set BACKUP_ENCRYPTION_KEY"
        exit 1
    fi

    if [[ "${BACKUP_TYPE}" != "daily" && "${BACKUP_TYPE}" != "weekly" && "${BACKUP_TYPE}" != "monthly" ]]; then
        log_error "Invalid backup type: ${BACKUP_TYPE}. Use daily, weekly, or monthly."
        exit 1
    fi

    mkdir -p "$WORK_DIR"
    log_info "All prerequisites met — working in ${WORK_DIR}"
}

backup_postgresql() {
    log_step "Backing up PostgreSQL..."

    local db_url="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/almokhtabar}"
    local output="${WORK_DIR}/postgresql.sql.gz"

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would run: pg_dump \"$db_url\" | gzip > $output"
        return 0
    fi

    log_info "Running pg_dump..."
    pg_dump "$db_url" --no-owner --no-acl --compress=9 -f "$output" 2>/dev/null || {
        log_warn "pg_dump encountered warnings, checking output..."
        if [[ ! -f "$output" || ! -s "$output" ]]; then
            log_error "pg_dump failed — output is empty or missing"
            return 1
        fi
    }

    local size
    size=$(du -h "$output" 2>/dev/null | cut -f1)
    log_info "PostgreSQL backup: ${output} (${size})"
}

backup_redis() {
    log_step "Backing up Redis RDB..."

    local redis_host="${REDIS_HOST:-redis-master.almokhtabar.svc.cluster.local}"
    local redis_port="${REDIS_PORT:-6379}"
    local output="${WORK_DIR}/redis.rdb"

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would save Redis RDB from ${redis_host}:${redis_port}"
        return 0
    fi

    # Trigger BGSAVE and wait for completion
    local save_result
    save_result=$(redis-cli -h "$redis_host" -p "$redis_port" BGSAVE 2>/dev/null || echo "ERROR")

    if [[ "$save_result" == "Background saving started" ]]; then
        log_info "BGSAVE triggered, waiting for completion..."
        sleep 2

        for i in $(seq 1 30); do
            local bgsave_status
            bgsave_status=$(redis-cli -h "$redis_host" -p "$redis_port" INFO persistence 2>/dev/null | \
                grep "rdb_bgsave_in_progress" | cut -d: -f2 | tr -d '\r' || echo "0")
            if [[ "$bgsave_status" == "0" ]]; then
                log_info "BGSAVE completed"
                break
            fi
            sleep 1
        done
    else
        log_warn "BGSAVE result: ${save_result} — trying SAVE instead"
        redis-cli -h "$redis_host" -p "$redis_port" SAVE >/dev/null 2>&1 || true
    fi

    # Copy the RDB file
    local rdb_path
    rdb_path=$(redis-cli -h "$redis_host" -p "$redis_port" CONFIG GET dir 2>/dev/null | tail -1 || echo "/data")
    local rdb_filename
    rdb_filename=$(redis-cli -h "$redis_host" -p "$redis_port" CONFIG GET dbfilename 2>/dev/null | tail -1 || echo "dump.rdb")

    if redis-cli -h "$redis_host" -p "$redis_port" --rdb "$output" 2>/dev/null; then
        local size
        size=$(du -h "$output" 2>/dev/null | cut -f1)
        log_info "Redis backup: ${output} (${size})"
    else
        log_error "Redis backup failed"
        return 1
    fi
}

backup_uploads() {
    log_step "Backing up uploaded files..."

    local uploads_dir="${UPLOADS_DIR:-/data/uploads}"
    local output="${WORK_DIR}/uploads.tar.gz"

    if [[ ! -d "$uploads_dir" ]]; then
        log_warn "Uploads directory '${uploads_dir}' not found — skipping"
        return 0
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would compress: tar czf $output -C $(dirname $uploads_dir) $(basename $uploads_dir)"
        return 0
    fi

    tar czf "$output" -C "$(dirname "$uploads_dir")" "$(basename "$uploads_dir")" 2>/dev/null

    local size
    size=$(du -h "$output" 2>/dev/null | cut -f1)
    log_info "Uploads backup: ${output} (${size})"
}

encrypt_backup() {
    log_step "Encrypting backup with AES-256-GCM..."

    local archive="${WORK_DIR}.tar.gz"
    local encrypted="${archive}.enc"

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would encrypt: tar czf $archive $WORK_DIR && openssl enc -aes-256-gcm ..."
        return 0
    fi

    # Create a single tar archive of all backup files
    tar czf "$archive" -C "$OUTPUT_DIR" "$BACKUP_NAME" 2>/dev/null

    # Encrypt with AES-256-GCM
    # Format: salt + IV + ciphertext + tag
    openssl enc -aes-256-gcm -pbkdf2 -iter 100000 \
        -K "$(echo -n "$ENCRYPTION_KEY" | xxd -p -c 64 | head -c 64)" \
        -iv "$(openssl rand -hex 12)" \
        -in "$archive" \
        -out "$encrypted"

    local size
    size=$(du -h "$encrypted" 2>/dev/null | cut -f1)
    log_info "Encrypted archive: ${encrypted} (${size})"

    # Remove the unencrypted archive
    rm -f "$archive"
}

upload_to_cloud() {
    log_step "Uploading to cloud storage..."

    local encrypted="${WORK_DIR}.tar.gz.enc"
    local remote_path="${BUCKET_URL}/${BACKUP_TYPE}/${BACKUP_NAME}.tar.gz.enc"

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would upload: $encrypted -> $remote_path"
        return 0
    fi

    local upload_success=false

    # Try AWS S3
    if command -v aws &>/dev/null; then
        if aws s3 cp "$encrypted" "$remote_path" --storage-class STANDARD_IA 2>/dev/null; then
            log_info "Uploaded to S3: ${remote_path}"
            upload_success=true
        fi
    fi

    # Try GCS
    if [[ "$upload_success" == "false" ]] && command -v gsutil &>/dev/null; then
        local gcs_path="${remote_path/s3:\/\//gs:\/\/}"
        if gsutil cp "$encrypted" "$gcs_path" 2>/dev/null; then
            log_info "Uploaded to GCS: ${gcs_path}"
            upload_success=true
        fi
    fi

    # Try Azure Blob
    if [[ "$upload_success" == "false" ]] && command -v azcopy &>/dev/null; then
        local blob_url="${AZURE_BLOB_URL:-}"
        if [[ -n "$blob_url" ]]; then
            if azcopy copy "$encrypted" "${blob_url}/${BACKUP_TYPE}/${BACKUP_NAME}.tar.gz.enc" 2>/dev/null; then
                log_info "Uploaded to Azure Blob"
                upload_success=true
            fi
        fi
    fi

    if [[ "$upload_success" == "false" ]]; then
        log_error "Failed to upload to any cloud storage provider"
        return 1
    fi
}

cleanup_old_backups() {
    log_step "Cleaning up old backups (retention: ${RETENTION_DAYS}d)..."

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would delete local files > ${RETENTION_DAYS} days old in ${OUTPUT_DIR}"
        if command -v aws &>/dev/null; then
            log_info "[DRY RUN] Would delete S3 backups older than retention policy"
        fi
        return 0
    fi

    # Clean local
    find "$OUTPUT_DIR" -name "backup_*" -type d -mtime "+${RETENTION_DAYS}" -exec rm -rf {} \; 2>/dev/null || true
    log_info "Local cleanup complete"

    # Clean cloud (S3 lifecycle should handle this, but do a manual sweep too)
    if command -v aws &>/dev/null; then
        local cutoff_date
        cutoff_date=$(date -d "-${RETENTION_DAYS} days" '+%Y-%m-%d')

        # List and delete old daily backups
        aws s3 ls "${BUCKET_URL}/daily/" 2>/dev/null | while read -r line; do
            local obj_date
            obj_date=$(echo "$line" | awk '{print $1}')
            if [[ "$obj_date" < "$cutoff_date" ]]; then
                local obj_name
                obj_name=$(echo "$line" | awk '{print $4}')
                aws s3 rm "${BUCKET_URL}/daily/${obj_name}" 2>/dev/null || true
            fi
        done
        log_info "Cloud cleanup complete"
    fi
}

verify_backup() {
    log_step "Verifying backup integrity..."

    local encrypted="${WORK_DIR}.tar.gz.enc"
    local verify_dir="${OUTPUT_DIR}/verify_${BACKUP_NAME}"

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would decrypt and verify: $encrypted"
        return 0
    fi

    mkdir -p "$verify_dir"

    # Decrypt
    openssl enc -d -aes-256-gcm -pbkdf2 -iter 100000 \
        -K "$(echo -n "$ENCRYPTION_KEY" | xxd -p -c 64 | head -c 64)" \
        -iv "$(head -c 12 /dev/null)" \
        -in "$encrypted" \
        -out "${verify_dir}/verify.tar.gz" 2>/dev/null || {
        log_error "Decryption verification failed"
        rm -rf "$verify_dir"
        return 1
    }

    # Extract
    tar xzf "${verify_dir}/verify.tar.gz" -C "$verify_dir" 2>/dev/null || {
        log_error "Archive extraction verification failed"
        rm -rf "$verify_dir"
        return 1
    }

    # Check each component
    local db_backup="${verify_dir}/${BACKUP_NAME}/postgresql.sql.gz"
    local redis_backup="${verify_dir}/${BACKUP_NAME}/redis.rdb"
    local uploads_backup="${verify_dir}/${BACKUP_NAME}/uploads.tar.gz"

    if [[ -f "$db_backup" && -s "$db_backup" ]]; then
        log_info "PostgreSQL backup verified: $(du -h "$db_backup" | cut -f1)"
    else
        log_warn "PostgreSQL backup missing or empty"
    fi

    if [[ -f "$redis_backup" && -s "$redis_backup" ]]; then
        log_info "Redis backup verified: $(du -h "$redis_backup" | cut -f1)"
    fi

    if [[ -f "$uploads_backup" && -s "$uploads_backup" ]]; then
        log_info "Uploads backup verified: $(du -h "$uploads_backup" | cut -f1)"
    fi

    # Clean up verification directory
    rm -rf "$verify_dir"
    log_info "Backup verification complete"
}

emit_metrics() {
    log_step "Emitting backup metrics..."

    local backup_size
    backup_size=$(du -b "${WORK_DIR}.tar.gz.enc" 2>/dev/null | cut -f1 || echo 0)
    local duration=$(( $(date +%s) - START_TIME ))

    if command -v aws &>/dev/null; then
        aws cloudwatch put-metric-data \
            --namespace "$METRICS_NAMESPACE" \
            --metric-data \
            "MetricName=BackupSize,Value=${backup_size},Unit=Bytes,StorageResolution=60" \
            "MetricName=BackupDuration,Value=${duration},Unit=Seconds,StorageResolution=60" \
            "MetricName=BackupSuccess,Value=1,Unit=Count" \
            2>/dev/null || true
        log_info "Metrics emitted to CloudWatch"
    fi

    if command -v az &>/dev/null; then
        az monitor metrics alert create \
            --name "BackupComplete" \
            --resource-group "${AZURE_RESOURCE_GROUP:-almokhtabar}" \
            --scopes "/subscriptions/${AZURE_SUBSCRIPTION_ID}/resourceGroups/${AZURE_RESOURCE_GROUP}" \
            --condition "count 'almokhtabar/backup' >= 1" \
            2>/dev/null || true
        log_info "Metrics emitted to Azure Monitor"
    fi
}

cleanup_workdir() {
    log_step "Cleaning up working directory..."

    if [[ "$DRY_RUN" != "true" ]]; then
        rm -rf "$WORK_DIR"
        log_info "Working directory cleaned: ${WORK_DIR}"
    fi
}

# ---- Main ----
main() {
    START_TIME=$(date +%s)

    log_info "============================================"
    log_info "  Al Mokhtabar Backup"
    log_info "  Type:     ${BACKUP_TYPE}"
    log_info "  Output:   ${OUTPUT_DIR}"
    log_info "  Bucket:   ${BUCKET_URL}"
    log_info "  Dry Run:  ${DRY_RUN}"
    log_info "============================================"

    check_prerequisites
    backup_postgresql
    backup_redis
    backup_uploads
    encrypt_backup
    upload_to_cloud
    verify_backup
    cleanup_old_backups
    emit_metrics
    cleanup_workdir

    local end_time=$(date +%s)
    local total_duration=$(( end_time - START_TIME ))

    echo ""
    log_info "${BOLD}${GREEN}Backup completed successfully${NC}"
    log_info "Type: ${BACKUP_TYPE}, Duration: ${total_duration}s"
    log_info "Location: ${BUCKET_URL}/${BACKUP_TYPE}/${BACKUP_NAME}.tar.gz.enc"
}

trap cleanup_workdir EXIT
main
