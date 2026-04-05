# Project Setup & Best Practices

## Always Do This First

When starting work on this project, ALWAYS run these checks:

### 1. Build Verification
```bash
./gradlew clean assembleDebug --no-daemon --console=plain
```

### 2. Test Verification
```bash
./gradlew testDebugUnitTest --no-daemon --console=plain
```

### 3. Quality Checks (CI simulation)
```bash
./gradlew detekt ktlintCheck lintDebug --no-daemon
```

## Environment Setup

### Java Version
- **Local dev**: Java 21 (via sdkman: `/usr/local/sdkman/candidates/java/21.0.9-ms`)
- **CI/CD**: Java 17 (via `actions/setup-java@v4`)
- `gradle.properties` has `org.gradle.java.home` for local Java 21 override
- CI workflows ALWAYS generate clean `gradle.properties` (no `org.gradle.java.home`)

### Supabase Credentials
- `gradle.properties` contains real credentials (NEVER committed to git)
- `gradle.properties.example` has placeholders
- CI uses secrets if available, otherwise falls back to placeholders
- The GitHub MCP server is configured with PAT token in `settings.json`

### Never Commit
- `gradle.properties` (in `.gitignore`)
- Any file containing real API keys or tokens
- Build outputs (`build/`, `app/build/`)

## Testing Guidelines

### Test Organization
```
app/src/test/java/com/example/messageapp/
├── model/          # Data class validation tests
├── crypto/         # Encryption/decryption tests
├── utils/          # Utility function tests
├── data/           # Repository validation + Room tests
│   └── room/       # Mapper roundtrip + DAO tests
├── viewmodel/      # ViewModel state management tests
└── ui/chat/        # Pure logic from Compose helpers
```

### Testing Patterns
- **Pure Kotlin**: Direct tests, no mocking needed
- **ViewModels**: Mock repositories with `mockk(relaxed = true)`, use `StandardTestDispatcher`
- **Room DAO**: `Room.inMemoryDatabaseBuilder()`, requires `androidx.test:core`
- **Repo validation**: Copy `require()` logic to pure functions, test those
- **Never**: Mock Supabase client directly (extension properties can't be mocked)

### Key Dependencies
```kotlin
testImplementation("junit:junit:4.13.2")
testImplementation("com.google.truth:truth:1.4.2")
testImplementation("io.mockk:mockk:1.13.12")
testImplementation("app.cash.turbine:turbine:1.1.0")
testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.10.2")
testImplementation("org.robolectric:robolectric:4.14.1")
testImplementation("androidx.test:core:1.6.1")
```

## CI/CD Workflows

### ci.yml (Main CI)
- Triggers: push/PR to main, develop
- Jobs: quality (detekt, ktlint, lint) → build-and-test → report
- Node.js 24: `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true`

### strict-ci.yml
- Triggers: push to main, develop only
- Fails on ANY warning

### instrumented-tests.yml
- Triggers: push/PR to main, develop
- Runs on Android emulator (API 33)

## MCP Servers

### GitHub MCP
- Configured in `~/.qwen/settings.json`
- Uses PAT token for GitHub API access
- Provides: repo access, issues, PRs, workflows

### Context7 MCP
- Documentation lookup for libraries
- Command: `npx -y @upstash/context7-mcp`

### Sequential Thinking MCP
- Complex problem solving
- Command: `npx -y @modelcontextprotocol/server-sequential-thinking`

## Extensions Installed
- `github` - GitHub MCP integration (v0.32.0)
- `prompts.chat` - Prompts from awesome-chatgpt-prompts

## Architecture

### Repository Pattern
- Each repo has SINGLE responsibility (SRP enforced)
- All repos accept `SupabaseClient` via constructor with default
- Facades (`ChatRepository`, `AuthRepository`) are `@Deprecated` but functional

### ViewModel Pattern
- All ViewModels accept repositories via constructor with default
- State managed via `MutableStateFlow` → `StateFlow`
- Coroutines use `viewModelScope.launch`

### Crypto
- `E2ECipher`: AES-256-GCM via Android Keystore
- `MessageDecryptor`: Pure decryption logic
- `Crypto`: Legacy Base64-only (deprecated)

## Common Issues & Fixes

### Build fails with "25.0.1"
- Local: Need Java 21, set in `gradle.properties`
- CI: Generates clean `gradle.properties` with Java 17

### Workflow fails with YAML parse error
- Cannot use `<< EOF` heredoc with `${{ }}` in GitHub Actions
- Use `echo "..." >> file` instead

### Supabase project paused
- Reactivate at dashboard.supabase.com
- Free tier pauses inactive projects

### Token exposed in chat
- NEVER put real tokens in chat conversations
- Revoke immediately if exposed
- Use environment variables or secrets management
