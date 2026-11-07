package com.promptgineer.app.util

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.browser.customtabs.CustomTabsIntent
import androidx.core.content.FileProvider
import com.promptgineer.app.R
import java.io.File

/**
 * Native hand-offs: clipboard, the system share sheet, "open in an assistant",
 * Custom Tabs for docs, and JSON export through FileProvider.
 */
object IntentUtils {

    fun copyToClipboard(context: Context, text: String, label: String = "Prompt"): Boolean =
        runCatching {
            val clipboard = context.getSystemService(ClipboardManager::class.java)
            clipboard?.setPrimaryClip(ClipData.newPlainText(label, text))
            true
        }.getOrDefault(false)

    fun shareText(context: Context, text: String, subject: String? = null): Boolean =
        runCatching {
            val send = Intent(Intent.ACTION_SEND).apply {
                type = "text/plain"
                putExtra(Intent.EXTRA_TEXT, text)
                if (!subject.isNullOrBlank()) putExtra(Intent.EXTRA_SUBJECT, subject)
            }
            context.startActivity(
                Intent.createChooser(send, context.getString(R.string.share_prompt_title)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
            )
            true
        }.getOrDefault(false)

    /**
     * Copies first, then opens the share sheet. This is deliberately honest:
     * assistant apps do not expose a stable "insert prompt" API, so copying
     * guarantees the text is available wherever the person lands.
     */
    fun sendToAssistant(context: Context, text: String): Boolean {
        copyToClipboard(context, text, "Prompt")
        Toast.makeText(context, "Prompt copied — paste it into your AI app", Toast.LENGTH_SHORT).show()
        return shareText(context, text, "Prompt from Prompt-Gineer")
    }

    fun shareFile(context: Context, fileName: String, content: String): Boolean =
        runCatching {
            val dir = File(context.cacheDir, "exports").apply { mkdirs() }
            val file = File(dir, fileName)
            file.writeText(content)
            val uri = FileProvider.getUriForFile(
                context,
                "${context.packageName}.fileprovider",
                file,
            )
            val send = Intent(Intent.ACTION_SEND).apply {
                type = "application/json"
                putExtra(Intent.EXTRA_STREAM, uri)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            context.startActivity(
                Intent.createChooser(send, context.getString(R.string.export_data_title)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
            )
            true
        }.getOrDefault(false)

    fun openUrl(context: Context, url: String) {
        if (!url.startsWith("https://")) return
        runCatching {
            CustomTabsIntent.Builder()
                .setShowTitle(true)
                .build()
                .launchUrl(context, Uri.parse(url))
        }.onFailure {
            runCatching {
                context.startActivity(
                    Intent(Intent.ACTION_VIEW, Uri.parse(url))
                        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
                )
            }
        }
    }

    fun composeEmail(context: Context, address: String, subject: String) {
        runCatching {
            context.startActivity(
                Intent(Intent.ACTION_SENDTO).apply {
                    data = Uri.parse("mailto:$address")
                    putExtra(Intent.EXTRA_SUBJECT, subject)
                }.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
            )
        }
    }
}