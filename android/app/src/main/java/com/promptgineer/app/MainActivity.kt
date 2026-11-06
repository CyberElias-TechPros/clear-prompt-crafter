package com.promptgineer.app

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.promptgineer.app.ui.PromptGineerRoot

class MainActivity : ComponentActivity() {

    private val container by lazy { (application as PromptGineerApp).container }

    override fun onCreate(savedInstanceState: Bundle?) {
        val splash = installSplashScreen()
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Incoming share/process-text intents are queued before the UI exists.
        if (savedInstanceState == null) {
            container.intentRouter.handle(intent)
        }

        var ready = false
        splash.setKeepOnScreenCondition { !ready }

        setContent {
            PromptGineerRoot(onFirstFrame = { ready = true })
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        container.intentRouter.handle(intent)
    }
}
