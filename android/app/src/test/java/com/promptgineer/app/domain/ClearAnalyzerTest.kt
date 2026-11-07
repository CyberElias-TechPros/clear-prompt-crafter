package com.promptgineer.app.domain

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

class ClearAnalyzerTest {

    private val strongPrompt = listOf(
        PromptSection(
            "context",
            "You are a senior product writer helping a two-person team launch an onboarding flow " +
                "for first-time users at a fintech startup.",
        ),
        PromptSection(
            "task",
            "Write the first-run experience copy: one headline, three step titles, and a short " +
                "explanation for each step.",
        ),
        PromptSection(
            "guidelines",
            "Use plain language and a warm, confident tone. Keep each sentence under 18 words. " +
                "Return a Markdown table with Step | Title | Explanation.",
        ),
        PromptSection(
            "constraints",
            "Do not invent regulatory claims. Ask a clarifying question if the product type is " +
                "unclear. Never use jargon like 'seamless'.",
        ),
        PromptSection(
            "performance",
            "Finish with a two-item checklist the team can use to review the copy.",
        ),
    )

    @Test
    fun emptyPromptScoresZeroWithAllFiveCriteria() {
        val report = ClearAnalyzer.analyze("")
        assertEquals(0, report.overallScore)
        assertEquals(5, report.criteria.size)
        assertEquals(listOf("C", "L", "E", "A", "R"), report.criteria.map { it.letter })
        assertTrue(report.fixes.isNotEmpty())
    }

    @Test
    fun structuredPromptScoresHigherThanAVagueOne() {
        val vague = ClearAnalyzer.analyze("write something good for my app")
        val strong = ClearAnalyzer.analyze(PromptComposer.compose(strongPrompt))
        assertTrue(strong.overallScore > vague.overallScore + 30)
        assertTrue(strong.overallScore >= 75)
        assertTrue(vague.overallScore < 50)
        assertTrue(strong.isStrong)
    }

    @Test
    fun fixesPointAtRealSections() {
        val validTypes = PromptSections.all.map { it.type }.toSet()
        val report = ClearAnalyzer.analyze("Help me write a landing page.")
        assertTrue(report.fixes.isNotEmpty())
        report.fixes.forEach { fix ->
            val target = fix.sectionType
            if (target != null) {
                assertTrue("Unknown section target: $target", target in validTypes)
            }
            assertTrue(fix.title.isNotBlank())
            assertTrue(fix.detail.isNotBlank())
        }
    }

    @Test
    fun improvedPromptIsLongerAndScoresNoWorse() {
        val weak = "Write a blog post about our new feature."
        val report = ClearAnalyzer.analyze(weak)
        assertTrue(report.improvedPrompt.length > weak.length)
        assertTrue(report.improvedPrompt.contains("Context"))
        assertTrue(ClearAnalyzer.analyze(report.improvedPrompt).overallScore >= report.overallScore)
    }

    @Test
    fun analyzeSectionsMatchesAnalyzeOnComposedText() {
        val fromSections = ClearAnalyzer.analyzeSections(strongPrompt)
        val fromText = ClearAnalyzer.analyze(PromptComposer.compose(strongPrompt))
        assertEquals(fromText.overallScore, fromSections.overallScore)
        assertEquals(fromText.wordCount, fromSections.wordCount)
        assertNotNull(fromSections.criterion("E"))
    }

    @Test
    fun excessiveLengthIsPenalisedForConciseness() {
        val padded = (1..400).joinToString(" ") { "This sentence repeats the same instruction again and again." }
        val report = ClearAnalyzer.analyze(padded)
        val concise = report.criterion("C")
        assertNotNull(concise)
        assertTrue(concise!!.score < 70)
    }
}
