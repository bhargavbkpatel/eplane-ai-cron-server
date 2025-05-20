import { prisma } from "../lib/prisma";
import { sleep, textToMarkdown } from "../utils";

let isProcessing = false;
const BATCH_SIZE = 3;

export const processArticles = async () => {
  if (isProcessing) {
    console.log("Previous job still running, skipping this run.");
    return;
  }
  isProcessing = true;
  try {
    const articles = await prisma.articles.findMany({
      where: { isTextGenerated: false },
      take: BATCH_SIZE,
    });
    console.log(`Found ${articles.length} unprocessed articles`);

    if (articles.length === 0) {
      return;
    }
    await prisma.$transaction(async (tx) => {
      for (const item of articles) {
        try {
          // const markdownText = item?.text
          //   ? await textToMarkdown(item.text)
          //   : "";
          // await tx.articles.update({
          //   where: { id: item.id },
          //   data: {
          //     text: markdownText,
          //     isTextGenerated: true,
          //   },
          // });
          // console.log(`${item.title} Updated Sucessfully!!`);
          // await sleep(500);
        } catch (innerErr) {
          console.error(`Error processing article ID ${item.id}:`, innerErr);
        }
      }
    });
  } catch (error) {
    console.error("Failed to process articles:", error);
  } finally {
    isProcessing = false;
  }
};
