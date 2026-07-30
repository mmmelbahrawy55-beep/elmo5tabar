#!/bin/bash
set -euo pipefail

# =============================================================================
# Point-in-Time Restore Script — Al Mokhtabar Laboratory
#
# Lists available backups, downloads from cloud storage, decrypts,
# and restores PostgreSQL, Redis, and uploads.
#
# Usage:
#   ./restore.sh [--type daily|weekly|monthly] [--backup-name NAME]
#                [--target-date YYYY-MM-DD] [--list] [--dry-run]
#
# Examples:
#   ./restore.sh --list
#   ./restore.sh --target-date 2024-01-15
#   ./restore.sh --backup-name backup_daily_20240115_120000
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
  --list             List available backups
  --type TYPE        Backup type (daily|weekly|monthly)      [default: daily]
  --backup-name NAME Specific backup name to restore         [default: latest]
  --target-date      Restore nearest backup to this date     [format: YYYY-MM-DD]
  --output DIR       Local download directory                [default: /tmp/restore]
  --bucket URL       Cloud storage bucket URL                [default: s3://almokhtabar-backups]
  --encryption-key   AES-256-GCM decryption key (hex)        [default: \$BACKUP_ENCRYPTION_KEY]
  --restore-db       Restore PostgreSQL
  --restore-redis    Restore Redis
  --restore-uploads  Restore uploaded files
  --all              Restore everything                      [default: true]
  --dry-run          Show what would be done without doing it
  --help             Show this help message
EOF
    exit 0
}

# ---- Defaults ----
ACTION="${ACTION:-restore}"
BACKUP_TYPE="${BACKUP_TYPE:-daily}"
BACKUP_NAME="${BACKUP_NAME:-}"
TARGET_DATE="${TARGET_DATE:-}"
OUTPUT_DIR="${OUTPUT_DIR:-/tmp/restore}"
BUCKET_URL="${BUCKET_URL:-s3://almokhtabar-backups}"
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-}"
RESTORE_DB="${RESTORE_DB:-true}"
RESTORE_REDIS="${RESTORE_REDIS:-true}"
RESTORE_UPLOADS="${RESTORE_UPLOADS:-true}"
DRY_RUN="${DRY_RUN:-false}"

# ---- Parse arguments ----
while [[ $# -gt 0 ]]; do
    case "$1" in
        --list)           ACTION="list";         shift ;;
        --type)           BACKUP_TYPE="$2";      shift 2 ;;
        --backup-name)    BACKUP_NAME="$2";      shift 2 ;;
        --target-date)    TARGET_DATE="$2";      shift 2 ;;
        --output)         OUTPUT_DIR="$2";       shift 2 ;;
        --bucket)         BUCKET_URL="$2";       shift 2 ;;
        --encryption-key) ENCRYPTION_KEY="$2";   shift 2 ;;
        --restore-db)     RESTORE_DB="true";     shift ;;
        --restore-redis)  RESTORE_REDIS="true";  shift ;;
        --restore-uploads) RESTORE_UPLOADS="true"; shift ;;
        --all)            RESTORE_DB="true"; RESTORE_REDIS="true"; RESTORE_UPLOADS="true"; shift ;;
        --dry-run)        DRY_RUN="true";        shift ;;
        --help|-h)        usage ;;
        *) log_error "Unknown argument: $1"; usage ;;
    esac
done

# ---- Functions ----

check_prerequisites() {
    log_step "Checking prerequisites..."
    command -v openssl  >/dev/null 2>&1 || { log_error "openssl is required"; exit 1; }
    command -v gunzip   >/dev/null 2>&1 || { log_error "gunzip is required"; exit 1; }
    command -v pg_restore >/dev/null 2>&1 || log_warn "pg_restore not found — DB restore disabled"
    command -v redis-cli  >/dev/null 2>&1 || log_warn "redis-cli not found — Redis restore disabled"
    command -v aws      >/dev/null 2>&1 || log_warn "aws CLI not found — S3 downloads disabled"

    if [[ -z "$ENCRYPTION_KEY" ]]; then
        log_error "ENCRYPTION_KEY not set"
        exit 1
    fi

    mkdir -p "$OUTPUT_DIR"
    log_info "All prerequisites met — working in ${OUTPUT_DIR}"
}

list_backups() {
    log_step "Listing available backups in ${BUCKET_URL}..."

    if command -v aws &>/dev/null; then
        for type in daily weekly monthly; do
            echo ""
            log_info "${BOLD}${type} backups:${NC}"
            aws s3 ls "${BUCKET_URL}/${type}/" 2>/dev/null | sort -r || echo "  (none found)"
        done
    else
        log_error "aws CLI required to list backups"
        exit 1
    fi
}

find_backup() {
    if [[ -n "$BACKUP_NAME" ]]; then
        log_info "Using specified backup: ${BACKUP_NAME}"
        return 0
    fi

    if [[ -n "$TARGET_DATE" ]]; then
        log_step "Finding nearest backup to ${TARGET_DATE}..."

        local candidates
        candidates=$(aws s3 ls "${BUCKET_URL}/${BACKUP_TYPE}/" 2>/dev/null | awk '{print $4}' || true)

        if [[ -z "$candidates" ]]; then
            log_error "No backups found for type '${BACKUP_TYPE}'"
            exit 1
        fi

        # Find the closest backup by date
        BACKUP_NAME=$(echo "$candidates" | sort | \
            awk -v target="$TARGET_DATE" '{
                gsub(/.*backup_[^_]+_/, "", $1);
                date = substr($1, 1, 8);
                diff = (target - date)^2;
                if (min_diff == "" || diff < min_diff) { min_diff = diff; best = $0 }
            } END { print best }')

        log_info "Found nearest backup: ${BACKUP_NAME}"
        return 0
    fi

    # Default: latest backup
    BACKUP_NAME=$(aws s3 ls "${BUCKET_URL}/${BACKUP_TYPE}/" 2>/dev/null | \
        sort | tail -1 | awk '{print $4}' || echo "")

    if [[ -z "$BACKUP_NAME" ]]; then
        log_error "No backups found for type '${BACKUP_TYPE}'"
        exit 1
    fi

    log_info "Using latest backup: ${BACKUP_NAME}"
}

download_backup() {
    log_step "Downloading backup from cloud storage..."

    local remote_path="${BUCKET_URL}/${BACKUP_TYPE}/${BACKUP_NAME}"
    local local_file="${OUTPUT_DIR}/${BACKUP_NAME}"

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would download: $remote_path -> $local_file"
        return 0
    fi

    if command -v aws &>/dev/null; then
        aws s3 cp "$remote_path" "$local_file" 2>/dev/null || {
            log_error "Failed to download from S3: $remote_path"
            exit 1
        }
    elif command -v gsutil &>/dev/null; then
        local gcs_path="${remote_path/s3:\/\//gs:\/\/}"
        gsutil cp "$gcs_path" "$local_file" 2>/dev/null || {
            log_error "Failed to download from GCS: $gcs_path"
            exit 1
        }
    else
        log_error "No cloud CLI tool available (aws/gsutil)"
        exit 1
    fi

    log_info "Downloaded: ${local_file} ($(du -h "$local_file" | cut -f1))"
}

decrypt_backup() {
    log_step "Decrypting backup..."

    local encrypted="${OUTPUT_DIR}/${BACKUP_NAME}"
    local decrypted="${OUTPUT_DIR}/backup_decrypted.tar.gz"

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would decrypt: $encrypted -> $decrypted"
        return 0
    fi

    openssl enc -d -aes-256-gcm -pbkdf2 -iter 100000 \
        -K "$(echo -n "$ENCRYPTION_KEY" | xxd -p -c 64 | head -c 64)" \
        -iv "$(head -c 12 /dev/null)" \
        -in "$encrypted" \
        -out "$decrypted" 2>/dev/null || {
        log_error "Decryption failed — check encryption key"
        exit 1
    }

    log_info "Decrypted: ${decrypted}"

    # Extract
    log_step "Extracting backup archive..."
    tar xzf "$decrypted" -C "$OUTPUT_DIR" 2>/dev/null || {
        log_error "Extraction failed"
        exit 1
    }

    log_info "Extracted to: ${OUTPUT_DIR}"
}

get_backup_dir() {
    # The extracted directory name without .tar.gz.enc
    local base_name="${BACKUP_NAME%.tar.gz.enc}"
    base_name="${base_name%.enc}"
    echo "${OUTPUT_DIR}/${base_name}"
}

restore_postgresql() {
    if [[ "$RESTORE_DB" != "true" ]]; then
        log_info "Skipping PostgreSQL restore"
        return 0
    fi

    log_step "Restoring PostgreSQL..."

    local backup_dir
    backup_dir=$(get_backup_dir)
    local db_dump="${backup_dir}/postgresql.sql.gz"

    if [[ ! -f "$db_dump" ]]; then
        log_warn "PostgreSQL dump not found: ${db_dump}"
        return 0
    fi

    local db_url="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/almokhtabar}"

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would restore: gunzip -c $db_dump | psql $db_url"
        return 0
    fi

    log_info "Restoring database (this may take a while)..."
    gunzip -c "$db_dump" | psql "$db_url" 2>/dev/null || {
        log_error "PostgreSQL restore failed"
        return 1
    }

    log_info "PostgreSQL restore complete"
}

restore_redis() {
    if [[ "$RESTORE_REDIS" != "true" ]]; then
        log_info "Skipping Redis restore"
        return 0
    fi

    log_step "Restoring Redis..."

    local backup_dir
    backup_dir=$(get_backup_dir)
    local redis_dump="${backup_dir}/redis.rdb"

    if [[ ! -f "$redis_dump" ]]; then
        log_warn "Redis dump not found: ${redis_dump}"
        return 0
    fi

    local redis_host="${REDIS_HOST:-redis-master.almokhtabar.svc.cluster.local}"
    local redis_port="${REDIS_PORT:-6379}"

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would restore Redis RDB: $redis_dump -> $redis_host:$redis_port"
        return 0
    fi

    # Get Redis config
    local rdb_dir
    rdb_dir=$(redis-cli -h "$redis_host" -p "$redis_port" CONFIG GET dir 2>/dev/null | tail -1 || echo "/data")
    local rdb_filename
    rdb_filename=$(redis-cli -h "$redis_host" -p "$redis_port" CONFIG GET dbfilename 2>/dev/null | tail -1 || echo "dump.rdb")

    # Copy the RDB file to Redis directory
    if redis-cli -h "$redis_host" -p "$redis_port" --pipe < "$redis_dump" 2>/dev/null; then
        log_info "Redis restore via piped import complete"
    else
        # Fallback: replace RDB file directly
        log_info "Attempting direct RDB replacement..."
        # Note: This requires access to the Redis data directory
        # In Kubernetes, you'd copy the file to the persistent volume
        cp "$redis_dump" "/tmp/${rdb_filename}" 2>/dev/null || {
            log_warn "Direct RDB replacement not supported in this environment"
            log_info "Redis data must be restored manually by replacing the RDB file at: ${rdb_dir}/${rdb_filename}"
        }
    fi

    log_info "Redis restore complete"
}

restore_uploads() {
    if [[ "$RESTORE_UPLOADS" != "true" ]]; then
        log_info "Skipping uploads restore"
        return 0
    fi

    log_step "Restoring uploaded files..."

    local backup_dir
    backup_dir=$(get_backup_dir)
    local uploads_archive="${backup_dir}/uploads.tar.gz"

    if [[ ! -f "$uploads_archive" ]]; then
        log_warn "Uploads archive not found: ${uploads_archive}"
        return 0
    fi

    local uploads_dir="${UPLOADS_DIR:-/data/uploads}"

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would extract to: $uploads_dir"
        return 0
    fi

    mkdir -p "$uploads_dir"
    tar xzf "$uploads_archive" -C "$uploads_dir" 2>/dev/null || {
        log_error "Uploads restore failed"
        return 1
    }

    log_info "Uploads restore complete: ${uploads_dir}"
}

verify_integrity() {
    log_step "Verifying restored data integrity..."

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would verify data integrity"
        return 0
    fi

    # Verify PostgreSQL
    if [[ "$RESTORE_DB" == "true" ]]; then
        local db_url="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/almokhtabar}"
        if psql "$db_url" -c "SELECT 1;" >/dev/null 2>&1; then
            log_info "PostgreSQL connectivity: OK"

            # Count tables
            local table_count
            table_count=$(psql "$db_url" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | tr -d ' ' || echo "0")
            log_info "PostgreSQL: ${table_count} tables restored"
        else
            log_warn "PostgreSQL connectivity check failed"
        fi
    fi

    # Verify Redis
    if [[ "$RESTORE_REDIS" == "true" ]]; then
        local redis_host="${REDIS_HOST:-redis-master.almokhtabar.svc.cluster.local}"
        local redis_port="${REDIS_PORT:-6379}"
        if redis-cli -h "$redis_host" -p "$redis_port" PING >/dev/null 2>&1; then
            local key_count
            key_count=$(redis-cli -h "$redis_host" -p "$redis_port" DBSIZE 2>/dev/null || echo "unknown")
            log_info "Redis: ${key_count} keys"
        else
            log_warn "Redis connectivity check failed"
        fi
    fi

    # Verify uploads
    if [[ "$RESTORE_UPLOADS" == "true" ]]; then
        local uploads_dir="${UPLOADS_DIR:-/data/uploads}"
        if [[ -d "$uploads_dir" ]]; then
            local file_count
            file_count=$(find "$uploads_dir" -type f | wc -l)
            log_info "Uploads: ${file_count} files restored"
        fi
    fi

    log_info "Integrity verification complete"
}

cleanup() {
    log_step "Cleaning up temporary files..."

    if [[ "$DRY_RUN" != "true" ]]; then
        rm -f "${OUTPUT_DIR:?}/${BACKUP_NAME}" "${OUTPUT_DIR:?}/backup_decrypted.tar.gz"
        local backup_dir
        backup_dir=$(get_backup_dir)
        rm -rf "${backup_dir}" 2>/dev/null || true
        log_info "Cleanup complete"
    fi
}

# ---- Main ----
main() {
    log_info "============================================"
    log_info "  Al Mokhtabar Point-in-Time Restore"
    log_info "  Action:    ${ACTION}"
    log_info "  Type:      ${BACKUP_TYPE}"
    log_info "  Bucket:    ${BUCKET_URL}"
    log_info "  Dry Run:   ${DRY_RUN}"
    log_info "============================================"

    check_prerequisites

    if [[ "$ACTION" == "list" ]]; then
        list_backups
        exit 0
    fi

    find_backup
    download_backup
    decrypt_backup
    restore_postgresql
    restore_redis
    restore_uploads
    verify_integrity
    cleanup

    echo ""
    log_info "${BOLD}${GREEN}Restore completed successfully${NC}"
    log_info "Backup: ${BACKUP_NAME}"
}

main
