# Versioning Policy

## Al Mokhtabar Laboratory Platform

| Metadata | Value |
|---|---|
| **Document Version** | 1.0.0 |
| **Last Updated** | 2026-07-30 |
| **Classification** | Internal - Confidential |
| **Owner** | Release Management |

---

## 1. Semantic Versioning

This project follows [Semantic Versioning 2.0.0](https://semver.org/) with the format:

```
v{MAJOR}.{MINOR}.{PATCH}
```

Optionally with a **pre-release** suffix:

```
v{MAJOR}.{MINOR}.{PATCH}-{alpha|beta|rc}.{N}
```

Or a **hotfix** suffix:

```
v{MAJOR}.{MINOR}.{PATCH}-hotfix.{N}
```

### Examples

| Version | Description |
|---|---|
| `v1.0.0` | Initial production release |
| `v1.1.0` | New features added |
| `v1.1.1` | Bug fixes in v1.1.x |
| `v2.0.0` | Major breaking changes |
| `v1.2.0-alpha.1` | First alpha pre-release for v1.2.0 |
| `v1.2.0-beta.1` | First beta pre-release for v1.2.0 |
| `v1.2.0-rc.1` | First release candidate for v1.2.0 |
| `v1.1.3-hotfix.1` | First hotfix on v1.1.3 |

---

## 2. Version Bump Rules

### 2.1 MAJOR Version (vX.0.0)

**Increment when:** Introducing breaking changes that require coordinated upgrades.

**Examples of breaking changes:**
- API endpoint removal or URL restructuring
- Request/response schema changes (removing or renaming fields)
- Database migrations requiring downtime
- Removal of deprecated features
- Framework version upgrade with breaking changes
- Dropping browser support (e.g., dropping IE11)
- Changes to authentication/authorization flows
- Changes to encryption or data format

**Process:**
- Requires Architectural Decision Record (ADR)
- Requires migration guide for all consumers
- Requires communication to all B2B clients 30 days in advance
- All API versions maintained for at least 3 months after deprecation notice

### 2.2 MINOR Version (v1.X.0)

**Increment when:** Adding new functionality in a backward-compatible manner.

**Examples of non-breaking additions:**
- New API endpoints (addition only, no modification)
- New optional fields in request/response
- New pages or features
- New integrations with external services
- New notification channels
- New animation components
- Performance improvements

**Process:**
- Feature must be behind a feature flag (if significant)
- No breaking changes to existing consumers
- Backward-compatible database migrations (additive only)

### 2.3 PATCH Version (v1.1.X)

**Increment when:** Making backward-compatible bug fixes.

**Examples:**
- Bug fixes
- Security patches
- Performance improvements (non-breaking)
- Dependency updates with no breaking changes
- Documentation updates
- Minor UI fixes

**Process:**
- Minimal changes, focused scope
- No new features
- No schema changes
- No migrations (unless urgent security fix)

### 2.4 Pre-Release Suffixes

| Suffix | Purpose | Audience | Stability |
|---|---|---|---|
| `-alpha.N` | Internal testing, early feedback | Engineering team | Unstable, features may change |
| `-beta.N` | External testing, feature complete | QA + Stakeholders | Feature-complete, bug fixes ongoing |
| `-rc.N` | Release candidate, final validation | All (pre-prod) | Stable, release-ready unless bugs found |

**Pre-release version comparison (ascending order):**
`1.0.0-alpha.1 < 1.0.0-alpha.2 < 1.0.0-beta.1 < 1.0.0-beta.2 < 1.0.0-rc.1 < 1.0.0-rc.2 < 1.0.0`

### 2.5 Hotfix Suffix

See [hotfix-process.md](./hotfix-process.md) for details. Hotfix versions are always based on the current production version:

```
v1.2.3 (production) → hotfix needed → v1.2.3-hotfix.1
```

---

## 3. Version Locations

Version numbers must be updated in ALL of the following locations:

| File | Location | Example |
|---|---|---|
| `package.json` | `version` field | `"version": "1.2.3"` |
| `src/config/version.ts` | `export const VERSION = 'v1.2.3'` | `export const VERSION = 'v1.2.3'` |
| `helm/Chart.yaml` | `version` and `appVersion` fields | `version: 1.2.3`, `appVersion: "1.2.3"` |
| `k8s/overlays/production/kustomization.yaml` | `images.tag` | `tag: v1.2.3` |
| `docker-compose.yml` | service image tags | `image: almokhtabar/backend:v1.2.3` |
| `CHANGELOG.md` | Release header | `## v1.2.3 - 2026-01-15` |
| `README.md` | Badge or version line | `Current version: v1.2.3` |
| API response header | `X-App-Version` | Returned on all API responses |

### Update Script

```bash
# scripts/update-version.sh
# Usage: ./scripts/update-version.sh 1.2.3

VERSION=$1

# Update package.json
sed -i "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" package.json

# Update version.ts
sed -i "s/export const VERSION = 'v.*'/export const VERSION = 'v$VERSION'/" src/config/version.ts

# Update Helm chart
sed -i "s/version: .*/version: $VERSION/" helm/Chart.yaml
sed -i "s/appVersion: \".*\"/appVersion: \"$VERSION\"/" helm/Chart.yaml

# Update Docker Compose
sed -i "s/image: almokhtabar\/backend:v.*/image: almokhtabar\/backend:v$VERSION/" docker-compose.yml

echo "Version updated to v$VERSION in all files"
```

---

## 4. Version Compatibility

### 4.1 API Versioning

The REST API is versioned via URL path:

```
/api/v1/appointments
/api/v2/appointments  (when v2 exists)
```

**API Version Policy:**
- All API versions maintain backward compatibility within MAJOR version
- Deprecated versions continue to operate for at least 3 months
- Deprecation notice communicated via:
  - Response header `Sunset: Sat, 01 Nov 2026 00:00:00 GMT`
  - Email notification to registered API consumers
  - Documentation notice
- Version removal only after deprecation period and confirmation of zero traffic

### 4.2 Database Migration Compatibility

| Migration Type | Forward Compatible | Backward Compatible |
|---|---|---|
| **Add table** | Yes | Yes |
| **Add column (nullable, default)** | Yes | Yes |
| **Add column (NOT NULL, no default)** | **No** (requires app change first) | Yes |
| **Rename column** | **No** | **No** |
| **Drop column** | **No** | **No** |
| **Add index** | Yes | Yes |
| **Drop index** | Yes | **No** |
| **Change column type** | **No** | **No** |
| **Add foreign key** | Yes | Yes |
| **Drop table** | **No** | **No** |

**Rule:** All database migrations must be forward-compatible (old app version can run against new schema) for at least one release cycle. This enables safe blue-green deployments.

### 4.3 Frontend-Backend Compatibility

| Frontend Version | Backend Version | Compatibility |
|---|---|---|
| Same MAJOR | Same MAJOR | Fully compatible |
| Same MAJOR, same MINOR | Same MAJOR, same MINOR | Fully compatible |
| Same MAJOR, older MINOR | Same MAJOR, newer MINOR | Compatible (newer endpoints not available) |
| Same MAJOR, newer MINOR | Same MAJOR, older MINOR | Compatible (if no new API dependencies) |
| Different MAJOR | Different MAJOR | **Not compatible** |

---

## 5. Version Display

### 5.1 In Application

The current version is displayed in:
- **Footer:** `© 2026 Al Mokhtabar Laboratory - v1.2.3`
- **Settings/About page:** Full version including commit SHA
- **API response header:** `X-App-Version: v1.2.3`
- **API health endpoint:** `GET /api/v1/health` returns `{ "version": "v1.2.3", "commit": "a1b2c3d" }`
- **Sentry events:** Tagged with `release: v1.2.3`

### 5.2 In CI/CD

- All CI run artifacts tagged with version
- Docker images tagged with version
- Helm releases named with version
- Git tags created for all releases and release candidates

---

## 6. Version Bump Automation

### GitHub Actions Version Bump Workflow

```yaml
name: Bump Version

on:
  workflow_dispatch:
    inputs:
      version_type:
        description: 'Version bump type'
        required: true
        default: 'patch'
        type: choice
        options:
          - patch
          - minor
          - major
      pre_release:
        description: 'Pre-release suffix (optional)'
        required: false
        type: choice
        options:
          - none
          - alpha
          - beta
          - rc

jobs:
  bump-version:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Determine new version
        id: semver
        uses: paulhatch/semver@v5
        with:
          tag_prefix: "v"
          major_pattern: "BREAKING CHANGE"
          minor_pattern: "feat:"
          version_format: "${major}.${minor}.${patch}"
      
      - name: Update version files
        run: ./scripts/update-version.sh ${{ steps.semver.outputs.version }}
      
      - name: Create commit and tag
        run: |
          git config user.name "CI Bot"
          git config user.email "ci@almokhtabar.com"
          git add .
          git commit -m "chore: bump version to v${{ steps.semver.outputs.version }}"
          git tag -a "v${{ steps.semver.outputs.version }}" -m "Version v${{ steps.semver.outputs.version }}"
          git push origin main --tags
```

---

## 7. Version History & Change Log

All version changes are documented in `CHANGELOG.md` following the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format:

### Changelog Format

```markdown
# Changelog

All notable changes to the Al Mokhtabar Laboratory Platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.2.3] - 2026-07-30

### Added
- New feature description (#PR-number)
- Another new feature (#PR-number)

### Changed
- Existing feature modification (#PR-number)

### Deprecated
- Feature being deprecated (#PR-number)

### Removed
- Removed feature (#PR-number)

### Fixed
- Bug fix description (#PR-number)

### Security
- Security fix description (#PR-number)

### Performance
- Performance improvement description (#PR-number)

### Dependencies
- dependency-name updated from v1.0.0 to v1.1.0

## [v1.2.2] - 2026-07-15
...
```

---

## 8. Version Policy Summary

| Aspect | Policy |
|---|---|
| **Versioning scheme** | Semantic Versioning 2.0.0 |
| **Format** | `v{MAJOR}.{MINOR}.{PATCH}` |
| **Pre-release** | `-alpha.N`, `-beta.N`, `-rc.N` |
| **Hotfix** | `-hotfix.N` |
| **Breaking changes** | MAJOR version bump |
| **New features** | MINOR version bump |
| **Bug fixes** | PATCH version bump |
| **API versioning** | URL path (`/api/v1/`) |
| **Deprecation notice** | 3 months minimum |
| **Database migrations** | Forward and backward compatible |
| **Changelog** | Keep a Changelog format |
| **Version locations** | 8 files must be updated |
| **Automation** | CI workflow for version bump |
