package com.promptgineer.app

import android.app.Application
import com.promptgineer.app.di.AppContainer
import com.promptgineer.app.util.AppShortcuts

class PromptGineerApp : Application() {

    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
        AppShortcuts.install(this)
    }
}
