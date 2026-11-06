// Top-level build configuration.
// The Android client is a single-module, Compose-first app with no annotation
// processors, so configuration stays small and builds stay fast.

plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.kotlin.serialization) apply false
}
