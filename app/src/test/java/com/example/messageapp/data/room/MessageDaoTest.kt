package com.example.messageapp.data.room

import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import com.google.common.truth.Truth.assertThat

/**
 * Tests for MessageDao using Room in-memory database.
 */
@RunWith(RobolectricTestRunner::class)
@Config(packageName = "com.example.messageapp", sdk = [33])
class MessageDaoTest {

    private lateinit var db: AppDatabase
    private lateinit var dao: MessageDao

    @Before
    fun setUp() {
        db = Room.inMemoryDatabaseBuilder(
            ApplicationProvider.getApplicationContext(),
            AppDatabase::class.java
        ).allowMainThreadQueries().build()
        dao = db.messageDao()
    }

    @After
    fun tearDown() {
        db.close()
    }

    @Test
    fun `insert adds message to database`() = runTest {
        val msg = createTestMessage("msg-1", "chat-1")
        dao.insert(msg)

        val result = dao.getById("msg-1")
        assertThat(result).isNotNull()
        assertThat(result!!.id).isEqualTo("msg-1")
        assertThat(result.chatId).isEqualTo("chat-1")
    }

    @Test
    fun `getByChatId returns only messages for that chat`() = runTest {
        dao.insert(createTestMessage("msg-1", "chat-1"))
        dao.insert(createTestMessage("msg-2", "chat-1"))
        dao.insert(createTestMessage("msg-3", "chat-2"))

        val chat1Messages = dao.getByChatId("chat-1").first()

        assertThat(chat1Messages).hasSize(2)
        assertThat(chat1Messages.map { it.id }).containsExactly("msg-1", "msg-2")
    }

    @Test
    fun `getById returns null for non-existent message`() = runTest {
        val result = dao.getById("non-existent")

        assertThat(result).isNull()
    }

    @Test
    fun `markAsSynced updates synced flag`() = runTest {
        val msg = createTestMessage("msg-1", "chat-1", synced = false)
        dao.insert(msg)

        dao.markAsSynced("msg-1")
        val result = dao.getById("msg-1")

        assertThat(result!!.synced).isTrue()
    }

    @Test
    fun `deleteById removes message from database`() = runTest {
        dao.insert(createTestMessage("msg-1", "chat-1"))
        dao.deleteById("msg-1")

        val result = dao.getById("msg-1")
        assertThat(result).isNull()
    }

    @Test
    fun `deleteByChatId removes all messages for that chat`() = runTest {
        dao.insert(createTestMessage("msg-1", "chat-1"))
        dao.insert(createTestMessage("msg-2", "chat-1"))
        dao.insert(createTestMessage("msg-3", "chat-2"))

        dao.deleteByChatId("chat-1")
        val chat1Messages = dao.getByChatId("chat-1").first()
        val chat2Messages = dao.getByChatId("chat-2").first()

        assertThat(chat1Messages).isEmpty()
        assertThat(chat2Messages).hasSize(1)
    }

    @Test
    fun `insert with same id replaces existing message`() = runTest {
        dao.insert(createTestMessage("msg-1", "chat-1", "Hello"))
        dao.insert(createTestMessage("msg-1", "chat-1", "Updated"))

        val result = dao.getById("msg-1")
        assertThat(result!!.textEnc).isEqualTo("Updated")
    }

    @Test
    fun `getAll returns all messages ordered by createdAt`() = runTest {
        dao.insert(createTestMessage("msg-1", "chat-1", createdAt = 3000L))
        dao.insert(createTestMessage("msg-2", "chat-1", createdAt = 1000L))
        dao.insert(createTestMessage("msg-3", "chat-1", createdAt = 2000L))

        val all = dao.getAll().first()

        assertThat(all).hasSize(3)
        assertThat(all[0].createdAt).isEqualTo(1000L)
        assertThat(all[1].createdAt).isEqualTo(2000L)
        assertThat(all[2].createdAt).isEqualTo(3000L)
    }

    private fun createTestMessage(
        id: String,
        chatId: String,
        textEnc: String = "encrypted",
        createdAt: Long = System.currentTimeMillis(),
        synced: Boolean = false
    ) = MessageEntity(
        id = id,
        chatId = chatId,
        senderId = "user-1",
        type = "text",
        textEnc = textEnc,
        nonce = "nonce",
        createdAt = createdAt,
        synced = synced
    )
}
