package com.promptgineer.app.domain

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class PromptRecipesTest {

    @Test
    fun libraryHasFifteenDistinctRecipes() {
        assertTrue(PromptRecipes.all.size >= 15)
        assertEquals(PromptRecipes.all.size, PromptRecipes.all.map { it.id }.toSet().size)
        assertTrue(PromptRecipes.all.map { it.title }.toSet().size == PromptRecipes.all.size)
    }

    @Test
    fun everyRecipeIsReadyToBuildFrom() {
        PromptRecipes.all.forEach { recipe ->
            assertTrue(recipe.title.isNotBlank())
            assertTrue(recipe.whyItWorks.isNotBlank())
            assertTrue(recipe.category.isNotBlank())
            PromptSections.requiredSections.forEach { spec ->
                assertTrue(
                    "${recipe.id} is missing ${spec.type}",
                    recipe.sections.any { it.type == spec.type && it.content.isNotBlank() },
                )
            }
            assertTrue(
                "${recipe.id} should not contain unknown sections",
                recipe.sections.all { section -> PromptSections.all.any { it.type == section.type } },
            )
            assertTrue(PromptComposer.compose(recipe.sections).isNotBlank())
        }
    }

    @Test
    fun searchMatchesTitlesCategoriesAndBodies() {
        assertTrue(PromptRecipes.search("code review").any { it.id == "code_review" })
        assertTrue(PromptRecipes.search("engineering").isNotEmpty())
        assertTrue(PromptRecipes.search("zzzz-not-a-recipe").isEmpty())
        assertTrue(PromptRecipes.search("").isNotEmpty())
    }

    @Test
    fun categoriesAreUsefulForBrowsing() {
        val categories = PromptRecipes.all.groupingBy { it.category }.eachCount()
        assertTrue(categories.keys.size >= 4)
        val largest = categories.values.max()
        assertTrue(largest <= PromptRecipes.all.size / 2)
    }

    @Test
    fun recipeScoresReasonablyWellOffline() {
        val report = ClearAnalyzer.analyzeSections(PromptRecipes.all.first().sections)
        assertFalse(report.criteria.isEmpty())
        assertTrue(report.overallScore >= 60)
    }
}
