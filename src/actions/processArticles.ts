import logger from "utils/logger/logger";
import { prisma } from "../lib/prisma";
import { sleep, textToMarkdown } from "../utils";

export const processArticle = async (id: string) => {
  try {
    const article = await prisma.articles.findUnique({
      where: { id },
    });

    if (!article) {
      logger.warn(`Article with ID ${id} not found.`);
      return { success: false, reason: "not_found" };
    }
    const markdownText = article.text ? await textToMarkdown(article.text) : "";

    await prisma.$transaction(async (tx) => {
      await tx.articles.update({
        where: { id: article.id },
        data: {
          text: markdownText,
          isTextGenerated: true,
        },
      });
      logger.info(`${article.title} (ID: ${article.id}) updated successfully!`);
      return { success: true };
    });
  } catch (error) {
    logger.error(`Failed to process article ID ${id}:`, { error });
    return { success: false, reason: "error", error };
  }
};
