package com.promptgineer.app.core

import android.content.Intent
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.receiveAsFlow

sealed interface AppIntent {
    data class SharedText(val text: String) : AppIntent
    data class Shortcut(val id: String) : AppIntent
}

/**
 * Single consumer queue for intents that should move the UI: shared text from
 * another app, selected text ("Process text"), and launcher shortcuts. Queued
 * until the navigation host is ready (including after sign-in).
 */
class IntentRouter {
    private val channel = Channel<AppIntent>(Channel.BUFFERED)
    val commands = channel.receiveAsFlow()

    fun handle(intent: Intent?) {
        if (intent == null) return
        when (intent.action) {
            Intent.ACTION_SEND -> {
                val shared = intent.getCharSequenceExtra(Intent.EXTRA_TEXT)?.toString()
                    ?: intent.getStringExtra(Intent.EXTRA_TEXT)
                if (!shared.isNullOrBlank()) {
                    channel.trySend(AppIntent.SharedText(shared.take(MAX_TEXT)))
                }
            }
            Intent.ACTION_PROCESS_TEXT -> {
                val selected = intent.getCharSequenceExtra(Intent.EXTRA_PROCESS_TEXT)?.toString()
                if (!selected.isNullOrBlank()) {
                    channel.trySend(AppIntent.SharedText(selected.take(MAX_TEXT)))
                }
            }
            else -> {
                intent.getStringExtra(EXTRA_SHORTCUT)?.let { channel.trySend(AppIntent.Shortcut(it)) }
            }
        }
    }

    companion object {
        const val EXTRA_SHORTCUT = "com.promptgineer.app.extra.SHORTCUT"
        const val SHORTCUT_STUDIO = "studio"
        const val SHORTCUT_REFINE = "refine"
        const val SHORTCUT_COMMUNITY = "community"
        private const val MAX_TEXT = 12_000
    }
}
