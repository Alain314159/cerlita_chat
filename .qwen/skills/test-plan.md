# 📋 Test Plan for Cerlita Chat

## Testing Strategy

### What We Test
1. **Pure functions** - Functions that don't need Android/Supabase dependencies
2. **Data classes** - Validation, serialization, equals/hashCode
3. **Utility functions** - Time formatting, crypto operations
4. **View logic** - State transitions, input validation
5. **Repository contracts** - Interface behavior (with mocks)

### What We DON'T Test (in unit tests)
- Network calls (use integration tests)
- Database operations (use Room in-memory)
- UI rendering (use Compose testing)
- Supabase API calls (mock them)

---

## Test Coverage Plan

### 1. MODEL LAYER (Pure data classes) ✅
| Test File | Tests | Purpose |
|-----------|-------|---------|
| `ModelsTest.kt` | 15+ | User, Chat, Message validation |
| `ThemeModelsTest.kt` | 5+ | ThemeColors, AvatarType |

### 2. CRYPTO LAYER (Pure functions) ✅
| Test File | Tests | Purpose |
|-----------|-------|---------|
| `E2ECipherTest.kt` | 8+ | Encrypt/decrypt roundtrip, key management |
| `MessageDecryptorTest.kt` | 6+ | Message encryption in context |

### 3. DATA LAYER - AUTH ✅
| Test File | Tests | Purpose |
|-----------|-------|---------|
| `AuthReadRepositoryTest.kt` | 6+ | Session state, email validation |
| `AuthWriteRepositoryTest.kt` | 8+ | Input validation (email, password) |

### 4. DATA LAYER - CHAT ✅
| Test File | Tests | Purpose |
|-----------|-------|---------|
| `ChatRepositoryTest.kt` | 5+ | Chat creation, direct chat ID generation |

### 5. DATA LAYER - MESSAGES ✅
| Test File | Tests | Purpose |
|-----------|-------|---------|
| `MessageRepositoryTest.kt` | 4+ | Message operations |

### 6. UTILS ✅
| Test File | Tests | Purpose |
|-----------|-------|---------|
| `TimeUtilsTest.kt` | 8+ | Date formatting, relative time |
| `ContactsUtilsTest.kt` | 3+ | Phone normalization |
| `RetryUtilsTest.kt` | 4+ | Retry logic with backoff |

### 7. VIEWMODEL ✅
| Test File | Tests | Purpose |
|-----------|-------|---------|
| `AuthViewModelTest.kt` | 5+ | Auth state management |
| `ChatViewModelTest.kt` | 5+ | Chat state, message loading |
| `AvatarViewModelTest.kt` | 5+ | Avatar selection state |
| `ChatListViewModelTest.kt` | 4+ | Chat list state management |

### 8. ROOM DATABASE ✅
| Test File | Tests | Purpose |
|-----------|-------|---------|
| `MessageDaoTest.kt` | 6+ | CRUD operations with in-memory DB |

### 9. NOT COVERED (Complex - needs more setup)
| File | Reason |
|------|--------|
| `NotificationRepositoryTest` | Depends on Firebase FCM |
| `FCM*RepositoryTest` | Depends on Firebase |
| `PresenceRepositoryTest` | Depends on Supabase Realtime |
| `StorageRepositoryTest` | Depends on Android Context |
| `MediaRepositoryTest` | Depends on Android Context |

---

## Test Quality Criteria

Each test MUST:
1. **Test real behavior** - Not just assert true
2. **Cover failure cases** - Invalid inputs, null values, empty strings
3. **Cover edge cases** - Boundary conditions, unicode, very long strings
4. **Actually catch bugs** - Tests should fail if behavior changes
5. **Be independent** - No test depends on another test
6. **Be fast** - Each test < 1 second (no real network calls)

## Anti-Patterns to AVOID

❌ `assertThat(true).isTrue()` - Tests nothing
❌ `assertThat(repo).isNotNull()` - Only tests instantiation
❌ Empty test bodies
❌ Tests that always pass regardless of code changes
❌ Mocking everything without verifying any real logic
