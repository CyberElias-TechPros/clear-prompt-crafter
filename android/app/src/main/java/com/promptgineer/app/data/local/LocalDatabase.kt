package com.promptgineer.app.data.local

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import com.promptgineer.app.domain.Bookmark
import com.promptgineer.app.domain.CachedPayload
import com.promptgineer.app.domain.ItemKind
import com.promptgineer.app.domain.LocalDraft
import com.promptgineer.app.domain.PromptSection
import com.promptgineer.app.domain.WorkspaceState
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

@Serializable
private data class StoredSection(val type: String, val content: String)

@Serializable
private data class StoredWorkspace(
    val title: String = "",
    val description: String = "",
    val sections: List<StoredSection> = emptyList(),
    val savedAt: Long = 0L,
)

/**
 * Small, dependency-free local store (SQLite via the platform helper).
 *
 * Why not Room? The app deliberately has no annotation processors: builds stay
 * fast and the data model here is tiny (drafts, bookmarks, a key-value bucket,
 * and an HTTP response cache). All access is suspend + IO-dispatched, and the
 * calls are small enough to audit by eye.
 */
class LocalDatabase(context: Context) : SQLiteOpenHelper(context, NAME, null, VERSION) {

    private val json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
        explicitNulls = false
    }

    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL(
            """
            CREATE TABLE drafts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL DEFAULT '',
                description TEXT NOT NULL DEFAULT '',
                sections_json TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )
            """.trimIndent(),
        )
        db.execSQL(
            """
            CREATE TABLE bookmarks (
                kind TEXT NOT NULL,
                item_id TEXT NOT NULL,
                title TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                PRIMARY KEY (kind, item_id)
            )
            """.trimIndent(),
        )
        db.execSQL(
            """
            CREATE TABLE kv (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at INTEGER NOT NULL
            )
            """.trimIndent(),
        )
        db.execSQL(
            """
            CREATE TABLE cache (
                key TEXT PRIMARY KEY,
                payload TEXT NOT NULL,
                cached_at INTEGER NOT NULL
            )
            """.trimIndent(),
        )
        db.execSQL("CREATE INDEX idx_drafts_updated ON drafts(updated_at DESC)")
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        // Version 1 is the first shipped schema. Future versions should migrate
        // in place; until then, retain data by doing nothing destructive.
    }

    // --- Drafts ------------------------------------------------------------

    suspend fun saveDraft(
        title: String,
        description: String,
        sections: List<PromptSection>,
        draftId: Long? = null,
    ): Long = withContext(Dispatchers.IO) {
        val now = System.currentTimeMillis()
        val values = ContentValues().apply {
            put("title", title.trim())
            put("description", description.trim())
            put("sections_json", encodeSections(sections))
            put("updated_at", now)
        }
        if (draftId != null) {
            val updated = writableDatabase.update(
                "drafts",
                values,
                "id = ?",
                arrayOf(draftId.toString()),
            )
            if (updated > 0) draftId else insertDraft(values, now)
        } else {
            insertDraft(values, now)
        }
    }

    private fun insertDraft(values: ContentValues, now: Long): Long {
        values.put("created_at", now)
        return writableDatabase.insertOrThrow("drafts", null, values)
    }

    suspend fun drafts(): List<LocalDraft> = withContext(Dispatchers.IO) {
        writableDatabase.query(
            "drafts",
            arrayOf("id", "title", "description", "sections_json", "created_at", "updated_at"),
            null,
            null,
            null,
            null,
            "updated_at DESC",
        ).use { cursor ->
            buildList {
                while (cursor.moveToNext()) {
                    add(
                        LocalDraft(
                            id = cursor.getLong(0),
                            title = cursor.getString(1).orEmpty(),
                            description = cursor.getString(2).orEmpty(),
                            sections = decodeSections(cursor.getString(3)),
                            createdAt = cursor.getLong(4),
                            updatedAt = cursor.getLong(5),
                        ),
                    )
                }
            }
        }
    }

    suspend fun deleteDraft(draftId: Long) = withContext(Dispatchers.IO) {
        writableDatabase.delete("drafts", "id = ?", arrayOf(draftId.toString()))
        Unit
    }

    suspend fun clearDrafts() = withContext(Dispatchers.IO) {
        writableDatabase.delete("drafts", null, null)
        Unit
    }

    // --- Workspace + key/value --------------------------------------------

    suspend fun saveWorkspace(state: WorkspaceState) = withContext(Dispatchers.IO) {
        val stored = StoredWorkspace(
            title = state.title,
            description = state.description,
            sections = state.sections.map { StoredSection(it.type, it.content) },
            savedAt = state.savedAt,
        )
        putKvInternal(KEY_WORKSPACE, json.encodeToString(StoredWorkspace.serializer(), stored))
        Unit
    }

    suspend fun loadWorkspace(): WorkspaceState? = withContext(Dispatchers.IO) {
        val raw = getKvInternal(KEY_WORKSPACE) ?: return@withContext null
        runCatching {
            val stored = json.decodeFromString(StoredWorkspace.serializer(), raw)
            WorkspaceState(
                title = stored.title,
                description = stored.description,
                sections = stored.sections.map { PromptSection(it.type, it.content) },
                savedAt = stored.savedAt,
            )
        }.getOrNull()
    }

    suspend fun clearWorkspace() = withContext(Dispatchers.IO) {
        writableDatabase.delete("kv", "key = ?", arrayOf(KEY_WORKSPACE))
        Unit
    }

    suspend fun putKv(key: String, value: String) = withContext(Dispatchers.IO) {
        putKvInternal(key, value)
        Unit
    }

    suspend fun getKv(key: String): String? = withContext(Dispatchers.IO) { getKvInternal(key) }

    private fun putKvInternal(key: String, value: String) {
        val values = ContentValues().apply {
            put("key", key)
            put("value", value)
            put("updated_at", System.currentTimeMillis())
        }
        writableDatabase.insertWithOnConflict("kv", null, values, SQLiteDatabase.CONFLICT_REPLACE)
    }

    private fun getKvInternal(key: String): String? =
        writableDatabase.query("kv", arrayOf("value"), "key = ?", arrayOf(key), null, null, null)
            .use { cursor -> if (cursor.moveToFirst()) cursor.getString(0) else null }

    // --- Bookmarks ---------------------------------------------------------

    suspend fun bookmarks(): List<Bookmark> = withContext(Dispatchers.IO) {
        writableDatabase.query(
            "bookmarks",
            arrayOf("kind", "item_id", "title", "created_at"),
            null,
            null,
            null,
            null,
            "created_at DESC",
        ).use { cursor ->
            buildList {
                while (cursor.moveToNext()) {
                    add(
                        Bookmark(
                            kind = ItemKind.fromRoute(cursor.getString(0)),
                            itemId = cursor.getString(1),
                            title = cursor.getString(2).orEmpty(),
                            createdAt = cursor.getLong(3),
                        ),
                    )
                }
            }
        }
    }

    /** Returns true when the item is bookmarked after the toggle. */
    suspend fun toggleBookmark(kind: ItemKind, itemId: String, title: String): Boolean =
        withContext(Dispatchers.IO) {
            val existing = writableDatabase.query(
                "bookmarks",
                arrayOf("item_id"),
                "kind = ? AND item_id = ?",
                arrayOf(kind.apiPath, itemId),
                null,
                null,
                null,
            ).use { it.moveToFirst() }

            if (existing) {
                writableDatabase.delete(
                    "bookmarks",
                    "kind = ? AND item_id = ?",
                    arrayOf(kind.apiPath, itemId),
                )
                false
            } else {
                val values = ContentValues().apply {
                    put("kind", kind.apiPath)
                    put("item_id", itemId)
                    put("title", title)
                    put("created_at", System.currentTimeMillis())
                }
                writableDatabase.insertWithOnConflict(
                    "bookmarks",
                    null,
                    values,
                    SQLiteDatabase.CONFLICT_REPLACE,
                )
                true
            }
        }

    suspend fun isBookmarked(kind: ItemKind, itemId: String): Boolean = withContext(Dispatchers.IO) {
        writableDatabase.query(
            "bookmarks",
            arrayOf("item_id"),
            "kind = ? AND item_id = ?",
            arrayOf(kind.apiPath, itemId),
            null,
            null,
            null,
        ).use { it.moveToFirst() }
    }

    // --- Response cache ----------------------------------------------------

    suspend fun putCache(key: String, payload: String) = withContext(Dispatchers.IO) {
        val values = ContentValues().apply {
            put("key", key)
            put("payload", payload)
            put("cached_at", System.currentTimeMillis())
        }
        writableDatabase.insertWithOnConflict("cache", null, values, SQLiteDatabase.CONFLICT_REPLACE)
        // Keep the cache small: 60 newest entries is plenty for browsing.
        writableDatabase.execSQL(
            "DELETE FROM cache WHERE key NOT IN (SELECT key FROM cache ORDER BY cached_at DESC LIMIT 60)",
        )
        Unit
    }

    suspend fun getCache(key: String): CachedPayload? = withContext(Dispatchers.IO) {
        writableDatabase.query(
            "cache",
            arrayOf("payload", "cached_at"),
            "key = ?",
            arrayOf(key),
            null,
            null,
            null,
        ).use { cursor ->
            if (cursor.moveToFirst()) {
                CachedPayload(cursor.getString(0), cursor.getLong(1))
            } else {
                null
            }
        }
    }

    suspend fun clearCache() = withContext(Dispatchers.IO) {
        writableDatabase.delete("cache", null, null)
        Unit
    }

    suspend fun clearAllLocalData() = withContext(Dispatchers.IO) {
        writableDatabase.delete("drafts", null, null)
        writableDatabase.delete("bookmarks", null, null)
        writableDatabase.delete("kv", null, null)
        writableDatabase.delete("cache", null, null)
        Unit
    }

    // --- Helpers -----------------------------------------------------------

    private fun encodeSections(sections: List<PromptSection>): String =
        json.encodeToString(
            ListSerializerHolder.serializer,
            sections.map { StoredSection(it.type, it.content) },
        )

    private fun decodeSections(raw: String?): List<PromptSection> {
        if (raw.isNullOrBlank()) return emptyList()
        return runCatching {
            json.decodeFromString(ListSerializerHolder.serializer, raw)
                .map { PromptSection(it.type, it.content) }
        }.getOrElse { emptyList() }
    }

    private object ListSerializerHolder {
        val serializer = kotlinx.serialization.builtins.ListSerializer(StoredSection.serializer())
    }

    companion object {
        private const val NAME = "promptgineer.db"
        private const val VERSION = 1
        const val KEY_WORKSPACE = "workspace"
        const val KEY_COACH_TRANSCRIPT = "coach_transcript"
        const val KEY_REFINE_DRAFT = "refine_draft"
    }
}
