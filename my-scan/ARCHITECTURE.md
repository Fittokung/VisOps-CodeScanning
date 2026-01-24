# VisScan Code Scanning Platform - Architecture & Best Practices

## 🏗️ System Architecture

### Current Workflow (GitLab CI/CD Based)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User Authentication & Setup                              │
│    - Google OAuth 2.0 login                                 │
│    - Onboarding wizard validates & encrypts tokens          │
│    - Quota check (6 active projects max)                    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Scan Submission (API: /api/scan/start)                  │
│    - Validate user tokens & quota                           │
│    - Retrieve encrypted GitHub PAT & Docker Hub token       │
│    - Prepare GitLab pipeline variables                      │
│    - Create ScanHistory record (status: QUEUED)             │
│    - Trigger GitLab pipeline via API                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. GitLab CI/CD Pipeline Execution                         │
│    Stage 1: fetch_source - Clone user's repository         │
│    Stage 2: security_audit - Run Gitleaks & Semgrep        │
│    Stage 3: build_artifact - Build Docker image with Kaniko│
│    Stage 4: container_scan - Scan image with Trivy         │
│    Stage 5: release - Push to Docker Hub (if no critical)  │
│    Stage 6: cleanup - Remove temporary artifacts           │
│                                                             │
│    Each stage sends webhook to: /api/webhook                │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Webhook Handler (API: /api/webhook)                     │
│    - Receive pipeline status updates from GitLab           │
│    - Update ScanHistory record in database                  │
│    - Merge findings from multiple stages                    │
│    - Calculate vulnerability counts                         │
│    - Set final status: SUCCESS / FAILED_SECURITY / FAILED  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Results & History                                        │
│    - Frontend polls: /api/scan/status/active                │
│    - View detailed results: /api/scan/[id]                  │
│    - Compare scans: /api/scan/compare                       │
│    - History management: Latest vs Previous                 │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Key Components

### 1. Authentication & Onboarding

- **File**: `app/setup/page.tsx`, `lib/auth.ts`
- **Purpose**: Mandatory token validation before usage
- **Flow**: Google OAuth → Setup wizard → Token validation → AES-256 encryption → Database storage

### 2. Quota Management

- **File**: `lib/quotaManager.ts`
- **Purpose**: Enforce 6 active projects per user
- **Check Points**: Before creating project, before starting scan

### 3. Scan Triggering

- **File**: `app/api/scan/start/route.ts`
- **Purpose**: Trigger GitLab pipeline with user's encrypted tokens
- **Process**:
  - Decrypt user tokens from database
  - Prepare GitLab variables
  - Call GitLab API to trigger pipeline
  - Create ScanHistory record

### 4. GitLab Pipeline

- **File**: `.gitlab-ci.yml`
- **Stages**: Setup → Audit → Build → Scan → Release → Cleanup
- **Webhooks**: Sends status updates to backend at each stage
- **Security Tools**: Gitleaks, Semgrep, Trivy

### 5. Webhook Handler

- **File**: `app/api/webhook/route.ts`
- **Purpose**: Receive and process GitLab pipeline updates
- **Updates**: Status, vulnerability counts, findings, logs

### 6. Status Polling

- **File**: `lib/statusPoller.ts`, `app/api/scan/status/active/route.ts`
- **Purpose**: Real-time updates for frontend
- **Interval**: 5 seconds

## ✅ Best Practices Implemented

### Security

1. **Token Encryption**: All tokens encrypted with AES-256 before storage
2. **Token Validation**: Immediate validation against GitHub/Docker Hub APIs
3. **Scope Verification**: Ensure GitHub tokens have required permissions
4. **No Exposure**: Tokens never logged or exposed in responses
5. **Secure Pipeline**: Secrets passed as GitLab CI/CD variables

### Database

1. **Soft Delete**: `isActive` flag for projects (preserves history)
2. **Indexes**: Optimized queries with proper indexes
3. **Unique Constraints**: Prevent duplicate pipeline processing
4. **Connection Pooling**: Prisma handles connection management

### API Design

1. **Single Responsibility**: Each endpoint has one clear purpose
2. **Error Handling**: Consistent error responses
3. **Validation**: Input validation before processing
4. **Idempotency**: Webhook can be called multiple times safely

### GitLab Integration

1. **Variables**: Pass secrets securely as CI/CD variables
2. **Webhooks**: Async communication pattern
3. **Status Tracking**: Pipeline ID for tracing
4. **Retries**: Automatic retry on transient failures

## 🗑️ Removed Components

### 1. Custom Worker (`worker/scanWorker.ts`)

**Reason**: GitLab CI/CD handles all scanning logic
**Removed**: Entire worker directory

### 2. Queue Manager (`lib/queueManager.ts`)

**Reason**: GitLab manages job queue internally
**Simplified**: Database status tracking only

### 3. Dockerfile Generator (`lib/dockerfileGenerator.ts`)

**Reason**: Not needed - users provide their own Dockerfiles or we use templates
**Note**: Can be re-added if auto-generation is required

### 4. Duplicate APIs

**Removed**: `start-v2`, `compare-v2`
**Kept**: Original versions that work with GitLab

## 📝 File Organization

### Core Files (Keep)

```
app/api/scan/
├── start/route.ts          # Trigger GitLab pipeline
├── [id]/route.ts           # Get scan details
├── status/
│   └── active/route.ts     # Active scans for polling
├── compare/route.ts        # Compare scan results
├── history/route.ts        # Scan history
└── acknowledge/route.ts    # Acknowledge critical issues

app/api/webhook/route.ts    # Receive GitLab callbacks
app/api/user/
├── setup/                  # Onboarding wizard
└── settings/route.ts       # User settings

lib/
├── auth.ts                 # NextAuth configuration
├── crypto.ts               # AES-256 encryption
├── prisma.ts               # Database client
├── quotaManager.ts         # Quota enforcement
├── tokenValidator.ts       # Token validation
└── statusPoller.ts         # Frontend polling hook
```

### Support Files (Keep)

```
app/api/support/tickets/    # Support ticket system
app/api/admin/              # Admin functions
components/                 # React components
prisma/schema.prisma        # Database schema
.gitlab-ci.yml              # Pipeline definition
```

## 🔄 Workflow Best Practices

### 1. Scan Submission

```typescript
// Always check quota before triggering
const quotaCheck = await checkUserQuota(userId);
if (!quotaCheck.canCreate) {
  return error("Quota exceeded");
}

// Decrypt tokens only when needed
const githubToken = decrypt(user.githubPAT);
const dockerToken = decrypt(user.dockerToken);

// Create database record BEFORE triggering pipeline
const scan = await prisma.scanHistory.create({
  data: { status: "QUEUED", pipelineId: null },
});

// Trigger pipeline
const pipeline = await triggerGitLabPipeline(variables);

// Update with pipeline ID
await prisma.scanHistory.update({
  where: { id: scan.id },
  data: { pipelineId: pipeline.id },
});
```

### 2. Webhook Processing

```typescript
// Always validate pipeline ID
const scan = await prisma.scanHistory.findFirst({
  where: { pipelineId: body.pipelineId },
});

if (!scan) {
  return error("Scan not found");
}

// Merge findings (GitLab sends multiple updates)
const mergedFindings = [...currentDetails.findings, ...newFindings];

// Update atomically
await prisma.scanHistory.update({
  where: { id: scan.id },
  data: { status, details, vulnCritical },
});
```

### 3. Status Polling

```typescript
// Frontend: Poll every 5 seconds
const { data } = useScanStatus(5000);

// Backend: Return only active scans
const activeScans = await prisma.scanHistory.findMany({
  where: {
    userId,
    status: { in: ["QUEUED", "RUNNING"] },
  },
});
```

## 🚀 Performance Optimizations

1. **Database Queries**: Use `select` to fetch only needed fields
2. **Indexes**: Added on frequently queried fields
3. **Connection Pooling**: Prisma handles automatically
4. **Caching**: Consider Redis for active scan status
5. **Pagination**: Implement for history lists

## 🔐 Security Checklist

- [x] Tokens encrypted at rest (AES-256)
- [x] Tokens validated before storage
- [x] Tokens never logged or exposed
- [x] GitLab secrets passed as CI/CD variables
- [x] Webhook validates pipeline ID
- [x] Quota enforcement prevents abuse
- [x] User authentication required (NextAuth)
- [x] HTTPS required for production

## 📊 Monitoring & Debugging

### Logs to Monitor

1. GitLab pipeline execution logs
2. Webhook reception logs
3. Database query performance
4. API error rates
5. Token validation failures

### Debug Workflow

1. Check database: Is scan record created?
2. Check GitLab: Did pipeline start?
3. Check webhook: Are updates being received?
4. Check status: Is frontend polling correctly?

## 🎓 Development Tips

1. **Local Testing**: Use GitLab webhook simulator
2. **Token Security**: Never commit .env to git
3. **Database Migrations**: Always test before production
4. **Pipeline Testing**: Test with public repos first
5. **Error Handling**: Always return meaningful error messages

---

**Status**: ✅ Production-Ready Architecture
**Updated**: January 1, 2026
