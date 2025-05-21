import { prisma } from "../lib/prisma";
import { sleep, textToMarkdown } from "../utils";

export const processArticle = async (id: string) => {
  try {
    const article = await prisma.articles.findUnique({
      where: { id },
    });

    if (!article) {
      console.log(`Article with ID ${id} not found.`);
      return;
    }

    await prisma.$transaction(async (tx) => {
      try {
        const markdownText = article.text
          ? await textToMarkdown(article.text)
          : "";
        await tx.articles.update({
          where: { id: article.id },
          data: {
            text: markdownText,
            isTextGenerated: true,
          },
        });
        console.log(
          `${article.title} (ID: ${article.id}) updated successfully!`
        );
      } catch (innerErr) {
        console.error(`Error processing article ID ${article.id}:`, innerErr);
      }
    });
  } catch (error) {
    console.error("Failed to process articles:", error);
  }
};
