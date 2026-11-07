package com.promptgineer.app.util

import android.content.Context
import android.content.Intent
import androidx.core.content.pm.ShortcutInfoCompat
import androidx.core.content.pm.ShortcutManagerCompat
import androidx.core.graphics.drawable.IconCompat
import com.promptgineer.app.MainActivity
import com.promptgineer.app.R
import com.promptgineer.app.core.IntentRouter

/** Long-press shortcuts on the launcher icon — the fastest path to the studio. */
object AppShortcuts {

    fun install(context: Context) {
        val shortcuts = listOf(
            shortcut(
                context,
                id = IntentRouter.SHORTCUT_STUDIO,
                shortLabel = context.getString(R.string.shortcut_studio_short),
                longLabel = context.getString(R.string.shortcut_studio_long),
                rank = 0,
            ),
            shortcut(
                context,
                id = IntentRouter.SHORTCUT_REFINE,
                shortLabel = context.getString(R.string.shortcut_refine_short),
                longLabel = context.getString(R.string.shortcut_refine_long),
                rank = 1,
            ),
            shortcut(
                context,
                id = IntentRouter.SHORTCUT_COMMUNITY,
                shortLabel = context.getString(R.string.shortcut_community_short),
                longLabel = context.getString(R.string.shortcut_community_long),
                rank = 2,
            ),
        )
        runCatching { ShortcutManagerCompat.setDynamicShortcuts(context, shortcuts) }
    }

    private fun shortcut(
        context: Context,
        id: String,
        shortLabel: String,
        longLabel: String,
        rank: Int,
    ): ShortcutInfoCompat {
        val intent = Intent(context, MainActivity::class.java).apply {
            action = Intent.ACTION_VIEW
            putExtra(IntentRouter.EXTRA_SHORTCUT, id)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        return ShortcutInfoCompat.Builder(context, id)
            .setShortLabel(shortLabel)
            .setLongLabel(longLabel)
            .setIcon(IconCompat.createWithResource(context, R.drawable.ic_shortcut))
            .setIntent(intent)
            .setRank(rank)
            .build()
    }
}
