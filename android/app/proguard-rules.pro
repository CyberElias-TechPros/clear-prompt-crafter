# ---------------------------------------------------------------------------
# Prompt-Gineer R8 rules
# ---------------------------------------------------------------------------

# Kotlin metadata / coroutines
-keepattributes *Annotation*, InnerClasses, Signature, EnclosingMethod
-dontwarn kotlinx.coroutines.**

# kotlinx.serialization: keep generated serializers and companions for DTOs.
-keepclassmembers class kotlinx.serialization.json.** {
    *** Companion;
}
-keepclasseswithmembers class kotlinx.serialization.json.** {
    kotlinx.serialization.KSerializer serializer(...);
}
-if @kotlinx.serialization.Serializable class **
-keepclassmembers class <1> {
    static <1>$Companion Companion;
}
-if @kotlinx.serialization.Serializable class **
-keepclassmembers class <1>$Companion {
    kotlinx.serialization.KSerializer serializer(...);
}
-keepclassmembers class com.promptgineer.app.data.remote.** {
    *** Companion;
}
-keepclasseswithmembers class com.promptgineer.app.data.remote.** {
    kotlinx.serialization.KSerializer serializer(...);
}
-keep,includedescriptorclasses class com.promptgineer.app.data.remote.**$$serializer { *; }

# Retrofit / OkHttp
-keep,allowobfuscation,allowshrinking interface retrofit2.Call
-keep,allowobfuscation,allowshrinking class retrofit2.Response
-keep,allowobfuscation,allowshrinking class kotlin.coroutines.Continuation
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjssex.**

# Tink / security-crypto (encrypted token storage)
-dontwarn com.google.crypto.tink.**
-keep class com.google.crypto.tink.** { *; }
