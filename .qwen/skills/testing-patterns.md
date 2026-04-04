---
title: Android/Kotlin Unit Testing - Official Patterns
description: Official testing patterns from developer.android.com and kotlinlang.org
source: Official Android + Kotlin documentation + community best practices (MockK, Truth, Turbine)
---

# Android/Kotlin Unit Testing - Official Patterns

## 1. Dependencies (build.gradle.kts)

```kotlin
dependencies {
    // JUnit 4
    testImplementation("junit:junit:4.13.2")
    
    // Kotlinx Coroutines Test (runTest, TestDispatcher)
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.10.2")
    
    // MockK for mocking
    testImplementation("io.mockk:mockk:1.13.12")
    testImplementation("io.mockk:mockk-android:1.13.12")
    
    // Google Truth for assertions
    testImplementation("com.google.truth:truth:1.4.2")
    
    // Turbine for testing Flows
    testImplementation("app.cash.turbine:turbine:1.1.0")
    
    // Robolectric for Android framework mocks
    testImplementation("org.robolectric:robolectric:4.12.1")
    
    // AndroidX test core
    testImplementation("androidx.arch.core:core-testing:2.2.0")
    testImplementation("androidx.room:room-testing:2.6.1")
}
```

## 2. Kotlinx Coroutines Test

```kotlin
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle

@Test
fun basicSuspendingTest() = runTest {
    val data = fetchData() // delay() is automatically skipped
    assertThat(data).isEqualTo("Hello world")
}

@Test
fun concurrentCoroutineTest() = runTest {
    val repo = UserRepository()
    launch { repo.register("Alice") }
    launch { repo.register("Bob") }
    advanceUntilIdle() // Executes all pending coroutines
    assertThat(repo.getAllUsers()).containsExactly("Alice", "Bob")
}
```

## 3. MockK Patterns

```kotlin
import io.mockk.mockk
import io.mockk.every
import io.mockk.verify
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.slot

// Basic mock
val mockApi = mockk<ApiService>()

// Mock with relaxUnitFun (auto-returns Unit for void functions)
val mockApi = mockk<ApiService>(relaxUnitFun = true)

// Stub suspending functions
coEvery { mockApi.getUser("123") } returns User("John")
coEvery { mockApi.deleteUser(any()) } just Runs

// Stub regular functions
every { mockApi.getName() } returns "Test"

// Verify calls
coVerify(exactly = 1) { mockApi.getUser("123") }
verify { mockApi.getName() }

// Capture arguments
val slot = slot<String>()
coEvery { mockApi.getUser(capture(slot)) } returns User("Test")
assertThat(slot.captured).isEqualTo("123")
```

## 4. Truth Assertions

```kotlin
import com.google.common.truth.Truth.assertThat

// Basic assertions
assertThat(value).isEqualTo(expected)
assertThat(value).isNotEqualTo(other)
assertThat(booleanValue).isTrue()
assertThat(booleanValue).isFalse()
assertThat(stringValue).contains("substring")
assertThat(stringValue).startsWith("prefix")
assertThat(list).containsExactly("A", "B").inOrder()
assertThat(list).isEmpty()
assertThat(list).hasSize(2)
assertThat(null as String?).isNull()
assertThat(value).isNotNull()
assertThat(number).isGreaterThan(0)
assertThat(number).isLessThan(100)

// Result assertions
val result = runCatching { someOperation() }
assertThat(result.isSuccess).isTrue()
assertThat(result.getOrNull()).isEqualTo(expected)
assertThat(result.exceptionOrNull()).isNull()

// Exception testing
assertThat(assertFailsWith<IllegalArgumentException> { 
    someOperation() 
}).hasMessageThat().contains("invalid")
```

## 5. Repository Tests Pattern

```kotlin
// Pattern: Test repository with mocked dependencies
class MessageRepositoryTest {
    
    private lateinit var repository: MessageRepository
    private val mockClient = mockk<SupabaseClient>(relaxUnitFun = true)
    
    @Before
    fun setup() {
        repository = MessageRepository(mockClient)
    }
    
    @Test
    fun `sendMessage should return success`() = runTest {
        // Given
        val chatId = "chat-123"
        val senderId = "user-456"
        val textEnc = "encrypted-text"
        val iv = "iv-value"
        
        // When
        val result = repository.sendText(chatId, senderId, textEnc, iv)
        
        // Then
        assertThat(result.isSuccess).isTrue()
        coVerify { /* verify Supabase calls */ }
    }
    
    @Test
    fun `loadMessages should return empty list when no messages`() = runTest {
        // Given
        coEvery { mockClient.from("messages").select() } returns emptyList()
        
        // When
        val messages = repository.loadMessages("chat-123")
        
        // Then
        assertThat(messages).isEmpty()
    }
}
```

## 6. Flow Testing with Turbine

```kotlin
import app.cash.turbine.test
import app.cash.turbine.awaitItem
import app.cash.turbine.awaitComplete

@Test
fun `observeMessages should emit messages`() = runTest {
    val flow = repository.observeMessages("chat-123", "user-456")
    
    flow.test {
        assertThat(awaitItem()).hasSize(0) // Initial empty state
        // Trigger some action that emits
        repository.sendMessage("chat-123", "user-456", "test", "iv")
        assertThat(awaitItem()).hasSize(1)
        cancelAndIgnoreRemainingEvents()
    }
}

@Test
fun `flow should complete without errors`() = runTest {
    val flow = repository.observeChats("user-456")
    
    flow.test {
        awaitItem()
        cancelAndIgnoreRemainingEvents()
    }
}
```

## 7. ViewModel Testing Pattern

```kotlin
class ChatViewModelTest {
    
    private lateinit var viewModel: ChatViewModel
    private val mockRepository = mockk<MessageRepository>(relaxUnitFun = true)
    
    @Before
    fun setup() {
        viewModel = ChatViewModel(mockRepository)
    }
    
    @Test
    fun `sendTextMessage should update state to success`() = runTest {
        // Given
        coEvery { mockRepository.sendText(any(), any(), any(), any()) } 
            returns Result.success(Unit)
        
        // When
        viewModel.sendTextMessage("Hello")
        advanceUntilIdle()
        
        // Then
        assertThat(viewModel.uiState.value.lastAction).isEqualTo("success")
        coVerify { mockRepository.sendText(any(), any(), any(), any()) }
    }
}
```

## 8. Test Structure Best Practices

```kotlin
// Naming: `methodName_shouldExpectedBehavior_whenCondition`
@Test
fun `signInWithEmail should return user id when credentials are valid`() = runTest {
    // Given/Arrange
    val email = "test@example.com"
    val password = "validPassword123"
    every { mockAuth.signInWith(any<Email>()) } returns mockSession
    
    // When/Act
    val result = repository.signInWithEmail(email, password)
    
    // Then/Assert
    assertThat(result.isSuccess).isTrue()
    assertThat(result.getOrNull()).isEqualTo("user-id-123")
    verify { mockAuth.signInWith(any<Email>()) }
}

// Use @Before for setup
@Before
fun setup() {
    // Initialize mocks and objects under test
}

// Test one thing per test
@Test
fun `signUp should fail when email is invalid`() = runTest { }

@Test
fun `signUp should fail when password is too short`() = runTest { }

@Test
fun `signUp should succeed with valid credentials`() = runTest { }
```

## 9. Common Patterns for This Project

```kotlin
// Testing E2E Cipher
class E2ECipherTest {
    @Test
    fun `encrypt and decrypt should return original text`() = runTest {
        val chatId = "chat-123"
        val originalText = "Hello World"
        
        val encrypted = E2ECipher.encrypt(chatId, originalText)
        val decrypted = E2ECipher.decrypt(chatId, encrypted.ciphertext, encrypted.iv)
        
        assertThat(decrypted).isEqualTo(originalText)
    }
}

// Testing Auth Repository
class AuthRepositoryTest {
    @Test
    fun `signUpWithEmail should return failure for weak password`() = runTest {
        val result = repository.signUpWithEmail("test@test.com", "123")
        assertThat(result.isFailure).isTrue()
    }
    
    @Test
    fun `isValidEmail should return true for valid email`() {
        assertThat(repository.isValidEmail("test@example.com")).isTrue()
    }
    
    @Test
    fun `isValidEmail should return false for invalid email`() {
        assertThat(repository.isValidEmail("invalid-email")).isFalse()
    }
}
```

## 10. Running Tests

```bash
# Run all unit tests
./gradlew test

# Run specific test class
./gradlew test --tests "com.example.messageapp.data.AuthRepositoryTest"

# Run with verbose output
./gradlew test --info

# Run with coverage
./gradlew testDebugUnitTest --info
```
