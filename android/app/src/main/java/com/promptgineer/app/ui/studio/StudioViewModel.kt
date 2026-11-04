package com.promptgineer.app.ui.studio

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.promptgineer.app.core.ApiResult
import com.promptgineer.app.core.AppError
import com.promptgineer.app.core.UiMessenger
import com.promptgineer.app.data.repo.AiRepository
import com.promptgineer.app.data.repo.AuthRepository
import com.promptgineer.app.data.repo.ChatTurn
import com.promptgineer.app.data.repo.ContentRepository
import com.promptgineer.app.data.repo.DraftRepository
import com.promptgineer.app.data.repo.SessionState
import com.promptgineer.app.domain.AiServicesSnapshot
import com.promptgineer.app.domain.CoachRole
import com.promptgineer.app.domain.CoachTurn
import com.promptgineer.app.domain.ItemKind
import com.promptgineer.app.domain.LocalCoach
import com.promptgineer.app.domain.PromptComposer
import com.promptgineer.app.domain.PromptParser
import com.promptgineer.app.domain.PromptRecipe
import com.promptgineer.app.domain.PromptSection
import com.promptgineer.app.domain.PromptSections
import com.promptgineer.app.domain.FixSuggestion
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

enum class StudioMode { STRUCTURED, COACH, REFINE }

data class StudioUiState(
    val loading: Boolean = true,
    val signedIn: Boolean = false,
    val mode: StudioMode = StudioMode.STRUCTURED,
    val title: String = "",
    val description: String = "",
    val isPublic: Boolean = false,
    val saveKind: ItemKind = ItemKind.PROMPT,
    val sections: Map<String, String> = emptyMap(),
    val optionalAdded: List<String> = emptyList(),
    val savedAt: Long? = null,
    val coachTurns: List<CoachTurn> = emptyList(),
    val coachInput: String = "",
    val coachBusy: Boolean = false,
    val coachOffline: Boolean = false,
    val refineText: String = "",
    val refineBusy: Boolean = false,
    val refineAnalysis: String = "",
    val refineImproved: String = "",
    val refineUsedAi: Boolean = false,
    val refineError: String? = null,
    val ai: AiServicesSnapshot? = null,
    val aiLoading: Boolean = false,
    val saving: Boolean = false,
    val saveError: String? = null,
) {
    val sectionList: List<PromptSection>
        get() = sections.map { PromptSection(it.key, it.value) }.filter { it.content.isNotBlank() }

    val composed: String get() = PromptComposer.compose(sectionList)

    val completedEssentials: Int
        get() = PromptSections.requiredSections.count { sections[it.type]?.isNotBlank() == true }

    val essentialsTotal: Int get() = PromptSections.requiredSections.size

    val canSave: Boolean
        get() = title.trim().length >= 3 && sectionList.isNotEmpty()
}

sealed interface StudioEvent {
    data class SavedToLibrary(val id: String, val kind: ItemKind) : StudioEvent
    data object RequireSignIn : StudioEvent
}

class StudioViewModel(
    private val authRepository: AuthRepository,
    private val contentRepository: ContentRepository,
    private val aiRepository: AiRepository,
    private val draftRepository: DraftRepository,
    private val messenger: UiMessenger,
    private val appScope: CoroutineScope,
) : ViewModel() {

    private val _state = MutableStateFlow(StudioUiState())
    val state: StateFlow<StudioUiState> = _state.asStateFlow()

    private val _events = Channel<StudioEvent>(Channel.BUFFERED)
    val events = _events.receiveAsFlow()

    private var loaded = false
    private var workspaceSaveJob: Job? = null
    private var refineSaveJob: Job? = null

    init {
        viewModelScope.launch {
            authRepository.session.collect { session ->
                val signedIn = session is SessionState.SignedIn
                _state.update { it.copy(signedIn = signedIn) }
                if (signedIn) loadAiQuietly()
            }
        }
        loadLocalState()
    }

    // -----------------------------------------------------------------------
    // Loading + persistence
    // -----------------------------------------------------------------------

    private fun loadLocalState() {
        if (loaded) return
        loaded = true
        viewModelScope.launch {
            val workspace = draftRepository.loadWorkspace()
            val coach = draftRepository.loadCoachTranscript()
            val refine = draftRepository.loadRefineDraft()

            val hasWorkspace = workspace != null &&
                (workspace.sections.any { it.content.isNotBlank() } ||
                    workspace.title.isNotBlank() || workspace.description.isNotBlank())

            _state.update { current ->
                current.copy(
                    loading = false,
                    title = workspace?.title.orEmpty(),
                    description = workspace?.description.orEmpty(),
                    sections = workspace?.sections
                        ?.filter { it.content.isNotBlank() || it.type.isNotBlank() }
                        ?.associate { it.type to it.content }
                        ?: emptyMap(),
                    optionalAdded = workspace?.sections
                        ?.map { it.type }
                        ?.filter { type -> PromptSections.optionalSections.any { it.type == type } }
                        ?: emptyList(),
                    savedAt = workspace?.savedAt,
                    coachTurns = coach.ifEmpty { listOf(greeting()) },
                    refineText = refine,
                )
            }
            if (hasWorkspace) {
                messenger.info("Restored your draft from this device.")
            }
        }
    }

    private fun scheduleWorkspaceSave(delayMs: Long = 750) {
        workspaceSaveJob?.cancel()
        workspaceSaveJob = viewModelScope.launch {
            delay(delayMs)
            persistWorkspace()
        }
    }

    private suspend fun persistWorkspace() {
        val snapshot = _state.value
        draftRepository.saveWorkspace(
            title = snapshot.title,
            description = snapshot.description,
            sections = snapshot.sectionList,
        )
        _state.update { it.copy(savedAt = System.currentTimeMillis()) }
    }

    private fun scheduleRefineSave(delayMs: Long = 600) {
        refineSaveJob?.cancel()
        refineSaveJob = viewModelScope.launch {
            delay(delayMs)
            draftRepository.saveRefineDraft(_state.value.refineText)
        }
    }

    // -----------------------------------------------------------------------
    // Structured workspace
    // -----------------------------------------------------------------------

    fun setMode(mode: StudioMode) {
        _state.update { it.copy(mode = mode) }
    }

    fun setTitle(value: String) = _state.update { it.copy(title = value.take(120)) }

    fun setDescription(value: String) = _state.update { it.copy(description = value.take(280)) }

    fun setPublic(value: Boolean) = _state.update { it.copy(isPublic = value) }

    /** Templates are public by default, matching the web client. */
    fun setSaveKind(kind: ItemKind) = _state.update {
        it.copy(
            saveKind = kind,
            isPublic = if (kind == ItemKind.TEMPLATE) true else it.isPublic,
            saveError = null,
        )
    }

    fun updateSection(type: String, value: String) {
        _state.update { it.copy(sections = it.sections + (type to value), saveError = null) }
        scheduleWorkspaceSave()
    }

    fun addOptionalSection(type: String) {
        _state.update { current ->
            if (current.sections.containsKey(type)) current
            else current.copy(
                sections = current.sections + (type to ""),
                optionalAdded = current.optionalAdded + type,
            )
        }
        scheduleWorkspaceSave(200)
    }

    fun removeSection(type: String) {
        _state.update {
            it.copy(
                sections = it.sections - type,
                optionalAdded = it.optionalAdded - type,
            )
        }
        scheduleWorkspaceSave(200)
    }

    fun clearWorkspace() {
        _state.update {
            it.copy(
                title = "",
                description = "",
                sections = emptyMap(),
                optionalAdded = emptyList(),
                saveError = null,
            )
        }
        viewModelScope.launch {
            draftRepository.clearWorkspace()
            _state.update { it.copy(savedAt = null) }
        }
        messenger.info("Cleared. Your saved library items are untouched.")
    }

    fun applyRecipe(recipe: PromptRecipe) {
        val mapped = recipe.sections.associate { it.type to it.content }
        _state.update { current ->
            current.copy(
                mode = StudioMode.STRUCTURED,
                title = current.title.ifBlank { recipe.title },
                description = current.description.ifBlank { recipe.subtitle },
                sections = mapped,
                optionalAdded = mapped.keys.filter { type ->
                    PromptSections.optionalSections.any { it.type == type }
                },
                saveError = null,
            )
        }
        scheduleWorkspaceSave(150)
        messenger.success("“${recipe.title}” loaded. Edit it to fit your work.")
    }

    fun applyFix(fix: FixSuggestion) {
        val type = fix.sectionType ?: "constraints"
        _state.update { current ->
            val existing = current.sections[type].orEmpty()
            val merged = if (existing.isBlank()) fix.snippet else existing.trimEnd() + "\n" + fix.snippet
            current.copy(
                mode = StudioMode.STRUCTURED,
                sections = current.sections + (type to merged),
                optionalAdded = if (PromptSections.optionalSections.any { it.type == type }) {
                    (current.optionalAdded + type).distinct()
                } else {
                    current.optionalAdded
                },
            )
        }
        scheduleWorkspaceSave(200)
        messenger.success("Added “${fix.title}” to the builder.")
    }

    fun openDraft(draft: com.promptgineer.app.domain.LocalDraft) {
        _state.update {
            it.copy(
                mode = StudioMode.STRUCTURED,
                title = draft.title,
                description = draft.description,
                sections = draft.sections.associate { section -> section.type to section.content },
                optionalAdded = draft.sections.map { section -> section.type }
                    .filter { type -> PromptSections.optionalSections.any { it.type == type } },
                saveError = null,
            )
        }
        scheduleWorkspaceSave(150)
        messenger.success("Draft opened in the builder.")
    }

    fun moveTextToBuilder(text: String, sourceLabel: String = "Text") {
        val parsed = PromptParser.parse(text)
        if (parsed.isEmpty()) {
            messenger.error("There was nothing to import.")
            return
        }
        _state.update {
            it.copy(
                mode = StudioMode.STRUCTURED,
                sections = parsed.associate { section -> section.type to section.content },
                optionalAdded = parsed.map { section -> section.type }
                    .filter { type -> PromptSections.optionalSections.any { it.type == type } },
                saveError = null,
            )
        }
        scheduleWorkspaceSave(150)
        messenger.success("$sourceLabel moved into the builder.")
    }

    // -----------------------------------------------------------------------
    // Saving to the community library
    // -----------------------------------------------------------------------

    fun saveToLibrary() {
        val snapshot = _state.value
        if (!snapshot.signedIn) {
            _events.trySend(StudioEvent.RequireSignIn)
            return
        }
        if (snapshot.title.trim().length < 3) {
            _state.update { it.copy(saveError = "Give the prompt a name with at least 3 characters.") }
            return
        }
        if (snapshot.sectionList.isEmpty()) {
            _state.update { it.copy(saveError = "Add at least one section before saving.") }
            return
        }
        if (snapshot.saving) return

        _state.update { it.copy(saving = true, saveError = null) }
        viewModelScope.launch {
            when (
                val result = contentRepository.create(
                    kind = snapshot.saveKind,
                    title = snapshot.title,
                    description = snapshot.description,
                    isPublic = snapshot.isPublic,
                    sections = snapshot.sectionList,
                )
            ) {
                is ApiResult.Success -> {
                    _state.update { it.copy(saving = false, saveError = null) }
                    messenger.success("Saved to your library — 10 points earned.")
                    _events.trySend(StudioEvent.SavedToLibrary(result.data, snapshot.saveKind))
                    persistWorkspace()
                }
                is ApiResult.Failure -> {
                    _state.update { it.copy(saving = false, saveError = result.error.userMessage) }
                    messenger.error(result.error.userMessage)
                }
            }
        }
    }

    // -----------------------------------------------------------------------
    // AI coach
    // -----------------------------------------------------------------------

    fun setCoachInput(value: String) = _state.update { it.copy(coachInput = value) }

    fun sendCoachMessage(override: String? = null) {
        val snapshot = _state.value
        val text = (override ?: snapshot.coachInput).trim()
        if (text.isEmpty() || snapshot.coachBusy) return

        val userTurn = CoachTurn(CoachRole.USER, text, System.currentTimeMillis())
        val history = snapshot.coachTurns + userTurn
        _state.update {
            it.copy(coachTurns = history, coachInput = "", coachBusy = true, coachOffline = false)
        }
        persistCoach(history)

        viewModelScope.launch {
            var reply: String? = null
            var offline = false
            if (snapshot.signedIn && snapshot.ai?.canGenerate != false) {
                val turns = history.takeLast(12).map {
                    ChatTurn(
                        role = if (it.role == CoachRole.USER) ChatTurn.USER else ChatTurn.ASSISTANT,
                        content = it.content,
                    )
                }
                when (
                    val result = aiRepository.generate(
                        messages = turns,
                        service = snapshot.ai?.preferredService(),
                        maxTokens = 800,
                    )
                ) {
                    is ApiResult.Success -> reply = result.data.content
                    is ApiResult.Failure -> {
                        offline = true
                        messenger.info(fallbackHeadline(result.error))
                        if (result.error is AppError.RateLimited) loadAiQuietly()
                    }
                }
            } else {
                offline = true
            }

            if (reply.isNullOrBlank()) {
                delay(350) // keeps the rhythm of a conversation; also avoids a flash
                reply = LocalCoach.reply(text)
                offline = true
            }

            val assistant = CoachTurn(CoachRole.ASSISTANT, reply!!, System.currentTimeMillis())
            val next = _state.value.coachTurns + assistant
            _state.update { it.copy(coachTurns = next, coachBusy = false, coachOffline = offline) }
            persistCoach(next)
        }
    }

    fun clearCoach() {
        val greeting = greeting()
        _state.update { it.copy(coachTurns = listOf(greeting), coachOffline = false) }
        viewModelScope.launch { draftRepository.saveCoachTranscript(listOf(greeting)) }
    }

    fun lastAssistantReply(): String? =
        _state.value.coachTurns.lastOrNull { it.role == CoachRole.ASSISTANT && it.content.isNotBlank() }?.content

    fun sendCoachReplyToRefine() {
        val reply = lastAssistantReply()
        if (reply.isNullOrBlank()) {
            messenger.info("Ask the coach something first.")
            return
        }
        _state.update {
            it.copy(
                mode = StudioMode.REFINE,
                refineText = reply,
                refineAnalysis = "",
                refineImproved = "",
                refineUsedAi = false,
                refineError = null,
            )
        }
        scheduleRefineSave(150)
    }

    private fun persistCoach(turns: List<CoachTurn>) {
        viewModelScope.launch { draftRepository.saveCoachTranscript(turns) }
    }

    private fun fallbackHeadline(error: AppError): String = when (error) {
        is AppError.RateLimited -> "Daily free limit reached — continuing with the offline coach."
        is AppError.Network, is AppError.Timeout -> "No connection to the AI service — using the offline coach."
        else -> "AI service unavailable — using the offline coach."
    }

    // -----------------------------------------------------------------------
    // Refine
    // -----------------------------------------------------------------------

    fun setRefineText(value: String) {
        _state.update {
            it.copy(
                refineText = value,
                refineAnalysis = "",
                refineImproved = "",
                refineUsedAi = false,
                refineError = null,
            )
        }
        scheduleRefineSave()
    }

    fun clearRefine() {
        _state.update {
            it.copy(
                refineText = "",
                refineAnalysis = "",
                refineImproved = "",
                refineUsedAi = false,
                refineError = null,
            )
        }
        viewModelScope.launch { draftRepository.saveRefineDraft("") }
    }

    fun analyzeRefine() {
        val snapshot = _state.value
        val draft = snapshot.refineText.trim()
        if (draft.isEmpty() || snapshot.refineBusy) return
        if (!snapshot.signedIn) {
            messenger.info("The local CLEAR review already works offline. Sign in to add the AI review.")
            return
        }
        _state.update { it.copy(refineBusy = true, refineError = null) }
        viewModelScope.launch {
            val request = buildString {
                append("Analyze the following prompt draft using the CLEAR framework (Concise, Logical, Explicit, Adaptive, Reflective). ")
                append("First, output \"# CLEAR Framework Analysis\" followed by one \"### <Letter>:\" subsection per criterion, ")
                append("each with a short verdict and one or two bullet points. ")
                append("Then output a second part starting with \"# Improved Prompt\" containing a rewritten, improved version of the prompt. ")
                append("Do not add commentary after the improved prompt.\n\nPROMPT DRAFT:\n")
                append(draft.take(12_000))
            }
            when (
                val result = aiRepository.generate(
                    prompt = request,
                    service = snapshot.ai?.preferredService(),
                    maxTokens = 1_300,
                    temperature = 0.35,
                )
            ) {
                is ApiResult.Success -> {
                    val content = result.data.content
                    val improvedIndex = Regex("#\\s*Improved Prompt", RegexOption.IGNORE_CASE)
                        .find(content)
                        ?.range
                        ?.first ?: -1
                    val analysis = if (improvedIndex >= 0) content.substring(0, improvedIndex) else content
                    val improved = if (improvedIndex >= 0) {
                        content.substring(improvedIndex)
                            .replaceFirst(Regex("#\\s*Improved Prompt\\s*", RegexOption.IGNORE_CASE), "")
                    } else {
                        ""
                    }
                    _state.update {
                        it.copy(
                            refineBusy = false,
                            refineAnalysis = analysis.trim(),
                            refineImproved = improved.trim(),
                            refineUsedAi = true,
                            refineError = null,
                        )
                    }
                    messenger.success("AI review ready.")
                    loadAiQuietly()
                }
                is ApiResult.Failure -> {
                    _state.update {
                        it.copy(refineBusy = false, refineError = result.error.userMessage)
                    }
                    messenger.error(result.error.userMessage)
                    if (result.error is AppError.RateLimited) loadAiQuietly()
                }
            }
        }
    }

    fun sendRefineToBuilder() {
        val snapshot = _state.value
        val text = snapshot.refineImproved.ifBlank { snapshot.refineText }
        if (text.isBlank()) {
            messenger.info("Write or paste a prompt first.")
            return
        }
        moveTextToBuilder(text, sourceLabel = if (snapshot.refineImproved.isNotBlank()) "Improved prompt" else "Prompt")
    }

    fun onSharedText(text: String) {
        if (text.isBlank()) return
        _state.update {
            it.copy(
                mode = StudioMode.REFINE,
                refineText = text,
                refineAnalysis = "",
                refineImproved = "",
                refineUsedAi = false,
                refineError = null,
            )
        }
        scheduleRefineSave(150)
        messenger.info("Shared text opened in Refine.")
    }

    fun openStudio() {
        _state.update { it.copy(mode = StudioMode.STRUCTURED) }
    }

    fun openRefine() {
        _state.update { it.copy(mode = StudioMode.REFINE) }
    }

    // -----------------------------------------------------------------------
    // AI quota
    // -----------------------------------------------------------------------

    fun refreshAi() {
        if (!_state.value.signedIn) return
        _state.update { it.copy(aiLoading = true) }
        loadAiQuietly()
    }

    private fun loadAiQuietly() {
        if (!_state.value.signedIn) return
        viewModelScope.launch {
            when (val result = aiRepository.services()) {
                is ApiResult.Success -> _state.update { it.copy(ai = result.data, aiLoading = false) }
                is ApiResult.Failure -> _state.update { it.copy(aiLoading = false) }
            }
        }
    }

    private fun greeting(): CoachTurn = CoachTurn(
        role = CoachRole.ASSISTANT,
        content = "Hi — tell me what you're working on, who it's for, and what a useful result looks like. We'll shape it into a clear brief together.",
        createdAt = System.currentTimeMillis(),
    )

    override fun onCleared() {
        super.onCleared()
        val snapshot = _state.value
        appScope.launch {
            draftRepository.saveWorkspace(snapshot.title, snapshot.description, snapshot.sectionList)
            draftRepository.saveRefineDraft(snapshot.refineText)
        }
    }
}
