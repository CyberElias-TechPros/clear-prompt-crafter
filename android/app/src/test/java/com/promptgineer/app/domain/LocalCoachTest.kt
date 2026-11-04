package com.promptgineer.app.domain

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class LocalCoachTest {

    @Test
    fun emptyMessageGetsA gentlePrompt() {
        val reply = LocalCoach.reply("   ")
        assertTrue(reply.contains("working on"))
    }

    @Test
    fun authenticationQuestionsGetSpecificGuidance() {
        val reply = LocalCoach.reply("help me with a login screen")
        assertTrue(reply.contains("authentication"))
        assertTrue(reply.length > 120)
    }

    @Test
    fun unrelatedIdeasStillGetAStructuredNextStep() {
        val reply = LocalCoach.reply("I need something for a school newsletter about recycling")
        assertTrue(reply.length > 100)
        assertTrue(reply.contains("audience") || reply.contains("reader"))
    }

    @Test
    fun longDraftsIncludeAnOfflineRead() {
        val draft = "Please help me write a prompt for a landing page for a small accounting firm. " +
            "The audience is owners of five to twenty person businesses who are busy and sceptical " +
            "of software. The action is booking a demo, and the proof is a real customer quote and a " +
            "number about hours saved."
        val reply = LocalCoach.reply(draft)
        assertTrue(reply.length > 250)
        assertFalse(reply.contains("null"))
    }

    @Test
    fun starterSuggestionsAreUsefulAndDistinct() {
        assertTrue(LocalCoach.starterSuggestions.size >= 3)
        assertTrue(LocalCoach.starterSuggestions.toSet().size == LocalCoach.starterSuggestions.size)
        LocalCoach.starterSuggestions.forEach { assertTrue(it.length > 15) }
    }
}
