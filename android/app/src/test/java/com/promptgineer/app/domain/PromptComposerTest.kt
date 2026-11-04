package com.promptgineer.app.domain

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class PromptComposerTest {

    private val sections = listOf(
        PromptSection("performance", "End with a two-item checklist."),
        PromptSection("task", "Write the onboarding copy."),
        PromptSection("context", "You are a senior product writer at a fintech startup."),
        PromptSection("constraints", "Do not invent regulatory claims."),
        PromptSection("guidelines", "Use plain language and a warm tone."),
    )

    @Test
    fun composeFollowsCanonicalOrder() {
        val text = PromptComposer.compose(sections)
        val expectedOrder = listOf("**Context:**", "**Task:**", "**Guidelines:**", "**Constraints:**", "**Quality checks:**")
        val positions = expectedOrder.map { text.indexOf(it) }
        assertTrue(positions.all { it >= 0 })
        assertEquals(positions.sorted(), positions)
    }

    @Test
    fun composeSkipsBlankSectionsUnlessAsked() {
        val withBlank = sections + PromptSection("security", "   ")
        assertFalse(PromptComposer.compose(withBlank).contains("Security"))
        assertTrue(PromptComposer.compose(withBlank, includeEmpty = true).contains("Security"))
    }

    @Test
    fun blankSectionsAreNotFilled() {
        assertEquals(5, PromptComposer.filled(sections + PromptSection("security", "")).size)
        assertTrue(PromptComposer.compose(emptyList()).isBlank())
    }

    @Test
    fun parserRoundTripsTheCanonicalFormat() {
        val text = PromptComposer.compose(sections)
        val parsed = PromptParser.parse(text)
        assertEquals(
            listOf("context", "task", "guidelines", "constraints", "performance"),
            parsed.map { it.type },
        )
        assertEquals(text, PromptComposer.compose(parsed))
    }

    @Test
    fun parserFallsBackToASingleTaskSection() {
        val parsed = PromptParser.parse("Write me a haiku about a rainy Tuesday in Lagos.")
        assertEquals(1, parsed.size)
        assertEquals("task", parsed.single().type)
        assertTrue(parsed.single().content.contains("haiku"))
        assertTrue(PromptParser.parse("   ").isEmpty())
    }

    @Test
    fun parserUnderstandsPlainLabels() {
        val parsed = PromptParser.parse(
            """
            Background: A small bakery is launching online ordering.
            Task: Write three subject lines for the launch email.
            Rules: No exclamation marks, no invented prices.
            """.trimIndent(),
        )
        assertEquals(listOf("context", "task", "constraints"), parsed.map { it.type })
    }

    @Test
    fun wordCountIgnoresExtraWhitespace() {
        assertEquals(0, PromptComposer.wordCount("   "))
        assertEquals(3, PromptComposer.wordCount("one  two\nthree"))
        assertTrue(PromptComposer.wordCount("**Context:** build it") >= 2)
    }

    @Test
    fun fileNameIsSafeForTheShareSheet() {
        val name = PromptComposer.fileNameFor("Code review / security: v2!")
        assertTrue(name.endsWith(".txt"))
        assertFalse(name.contains("/"))
        assertFalse(name.contains(":"))
    }
}
