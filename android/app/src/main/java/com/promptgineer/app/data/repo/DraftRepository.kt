package com.promptgineer.app.data.repo

import com.promptgineer.app.data.local.LocalDatabase
import com.promptgineer.app.data.remote.NetworkJson
import com.promptgineer.app.domain.Bookmark
import com.promptgineer.app.domain.CoachRole
import com.promptgineer.app.domain.CoachTurn
import com.promptgineer.app.domain.ItemKind
import com.promptgineer.app.domain.LocalDraft
import com.promptgineer.app.domain.PromptSection
import com.promptgineer.app.domain.WorkspaceState
import kotlinx.serialization.Serializable

@Serializable
private data class StoredTurn(
    val role: String,
    val content: String,
    val createdAt: Long,
)

/**
 * Everything that must survive a process death without a network: the working
 * draft, the coach transcript, the refine textarea, saved drafts and bookmarks.
 */
class DraftRepository(private val database: LocalDatabase) {

    suspend fun saveWorkspace(title: String, description: String, sections: List<PromptSection>) {
        database.saveWorkspace(
            WorkspaceState(
                title = title,
                description = description,
                sections = sections.filter { it.content.isNotBlank() },
                savedAt = System.currentTimeMillis(),
            ),
        )
    }

    suspend fun loadWorkspace(): WorkspaceState? = database.loadWorkspace()

    suspend fun clearWorkspace() = database.clearWorkspace()

    suspend fun saveCoachTranscript(turns: List<CoachTurn>) {
        val stored = turns.takeLast(60).map {
            StoredTurn(
                role = if (it.role == CoachRole.USER) ChatTurn.USER else ChatTurn.ASSISTANT,
                content = it.content.take(8_000),
                createdAt = it.createdAt,
            )
        }
        runCatching {
            database.putKv(
                LocalDatabase.KEY_COACH_TRANSCRIPT,
                NetworkJson.json.encodeToString(
                    kotlinx.serialization.builtins.ListSerializer(StoredTurn.serializer()),
                    stored,
                ),
            )
        }
    }

    suspend fun loadCoachTranscript(): List<CoachTurn> {
        val raw = database.getKv(LocalDatabase.KEY_COACH_TRANSCRIPT) ?: return emptyList()
        if (raw.isBlank()) return emptyList()
        return runCatching {
            NetworkJson.json.decodeFromString(
                kotlinx.serialization.builtins.ListSerializer(StoredTurn.serializer()),
                raw,
            ).map {
                CoachTurn(
                    role = if (it.role == ChatTurn.USER) CoachRole.USER else CoachRole.ASSISTANT,
                    content = it.content,
                    createdAt = it.createdAt,
                )
            }
        }.getOrElse { emptyList() }
    }

    suspend fun clearCoachTranscript() {
        database.putKv(LocalDatabase.KEY_COACH_TRANSCRIPT, "")
    }

    suspend fun saveRefineDraft(text: String) {
        database.putKv(LocalDatabase.KEY_REFINE_DRAFT, text)
    }

    suspend fun loadRefineDraft(): String =
        database.getKv(LocalDatabase.KEY_REFINE_DRAFT).orEmpty()

    suspend fun saveToLibrary(
        title: String,
        description: String,
        sections: List<PromptSection>,
        draftId: Long? = null,
    ): Long = database.saveDraft(title, description, sections, draftId)

    suspend fun drafts(): List<LocalDraft> = database.drafts()

    suspend fun deleteDraft(id: Long) = database.deleteDraft(id)

    suspend fun clearDrafts() = database.clearDrafts()

    suspend fun bookmarks(): List<Bookmark> = database.bookmarks()

    suspend fun toggleBookmark(kind: ItemKind, id: String, title: String): Boolean =
        database.toggleBookmark(kind, id, title)

    suspend fun isBookmarked(kind: ItemKind, id: String): Boolean =
        database.isBookmarked(kind, id)

    suspend fun clearAllLocalData() = database.clearAllLocalData()
}
