import logger from "../utils/logger/logger";
import { del, list, put } from "@vercel/blob";
import fetch from "node-fetch";
import { prisma } from "../lib/prisma";
import { getConfig } from "../config/env.config";

export const processBlobImages = async (id: string) => {
  logger.info(`Processing blob image for article ID: ${id}`);
  const config = getConfig();
  const uploadImageToBlob = async (url: string) => {
    try {
      const { blobs } = await list({
        token: config.VERCEL_BLOB_TOKEN,
      });
      const existingBlob = blobs.find(
        (blob) => blob.pathname.replace(/\.avif$/, "") === id
      );

      if (existingBlob) {
        try {
          await del(existingBlob?.pathname, {
            token: config.VERCEL_BLOB_TOKEN,
          });
          logger.info(`Deleted existing blob: ${id}`);
        } catch (e) {
          logger.warn(`Failed to delete existing blob ${id}:`, e);
        }
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image from URL: ${url}`);
      }

      const buffer = await response.buffer();
      const contentType =
        response.headers.get("content-type") || "application/octet-stream";

      const blob = await put(`${id}.avif`, buffer, {
        access: "public",
        allowOverwrite: true,
        contentType,
        token: config.VERCEL_BLOB_TOKEN,
      });

      logger.info(`Image uploaded to Vercel Blob: ${blob.url}`);
      return blob;
    } catch (error) {
      logger.error("Error uploading image to Vercel Blob", { error });
      throw error;
    }
  };

  try {
    const article = await prisma.articles.findUnique({
      where: { id },
    });
    if (!article?.image) {
      throw new Error("No imageUrl found in article record");
    }

    logger.info("Uploading image from existing article record...");
    return await uploadImageToBlob(article.image as string);
  } catch (error) {
    logger.error("Failed to process blob image", { error });
    return { success: false, reason: "error", error };
  }
};
