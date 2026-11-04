import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
}

/**
 * Release signing is intentionally optional: local/debug builds must not
 * require secrets. Provide either environment variables (CI friendly) or
 * Gradle properties (see gradle.properties) to produce a signed release.
 */
val keystorePath: String? =
    System.getenv("PROMPT_GINEER_KEYSTORE") ?: (findProperty("promptgineer.keystorePath") as String?)
val keystorePassword: String? =
    System.getenv("PROMPT_GINEER_KEYSTORE_PASSWORD") ?: (findProperty("promptgineer.keystorePassword") as String?)
val keyAliasValue: String? =
    System.getenv("PROMPT_GINEER_KEY_ALIAS") ?: (findProperty("promptgineer.keyAlias") as String?)
val keyPasswordValue: String? =
    System.getenv("PROMPT_GINEER_KEY_PASSWORD") ?: (findProperty("promptgineer.keyPassword") as String?)

android {
    namespace = "com.promptgineer.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.promptgineer.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables.useSupportLibrary = true

        val apiBaseUrl = (findProperty("promptgineer.apiBaseUrl") as String?)
            ?: "https://prompt-gineer-api.autumn-surf-21ec.workers.dev"
        val supportEmail = (findProperty("promptgineer.supportEmail") as String?)
            ?: "support@promptgineer.app"

        buildConfigField("String", "API_BASE_URL", "\"$apiBaseUrl\"")
        buildConfigField("String", "SUPPORT_EMAIL", "\"$supportEmail\"")
        buildConfigField("String", "PROJECT_URL", "\"https://github.com/CyberElias-TechPros/clear-prompt-crafter\"")
    }

    signingConfigs {
        if (!keystorePath.isNullOrBlank() && !keystorePassword.isNullOrBlank() &&
            !keyAliasValue.isNullOrBlank() && !keyPasswordValue.isNullOrBlank()
        ) {
            create("release") {
                storeFile = file(keystorePath)
                storePassword = keystorePassword
                keyAlias = keyAliasValue
                keyPassword = keyPasswordValue
                enableV1Signing = true
                enableV2Signing = true
            }
        }
    }

    buildTypes {
        debug {
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
            isMinifyEnabled = false
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
            signingConfigs.findByName("release")?.let { signingConfig = it }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
            excludes += "/META-INF/DEPENDENCIES"
            excludes += "/META-INF/INDEX.LIST"
        }
    }

    lint {
        abortOnError = false
        checkReleaseBuilds = false
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_17)
        freeCompilerArgs.addAll(
            "-opt-in=kotlinx.coroutines.ExperimentalCoroutinesApi",
        )
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.core.splashscreen)
    implementation(libs.androidx.browser)
    implementation(libs.androidx.datastore.preferences)
    implementation(libs.androidx.security.crypto)

    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.material.icons.extended)
    debugImplementation(libs.androidx.compose.ui.tooling)

    implementation(libs.androidx.navigation.compose)

    implementation(libs.retrofit)
    implementation(libs.retrofit.kotlinx.serialization)
    implementation(libs.okhttp)
    implementation(libs.okhttp.logging)
    implementation(libs.kotlinx.serialization.json)
    implementation(libs.kotlinx.coroutines.android)

    implementation(libs.coil.compose)

    testImplementation(libs.junit)
    testImplementation(libs.kotlinx.coroutines.test)
}
