import axios from "axios";
import { stockSymbols } from "../lib/constants";
import {
  extractCompanyMetrics,
  FlattenedDoc,
  flattenForIndex,
} from "../lib/helpers/flattenForIndex";
import { prisma } from "../lib/prisma";
import logger from "../utils/logger/logger";
import { getConfig } from "../config/env.config";

export const updateStockData = async () => {
  try {
    const config = getConfig();
    const allDocs: FlattenedDoc[] = [];

    for (const symbol of stockSymbols) {
      const financialsUrl = `https://api.gurufocus.com/public/user/${config.GURUFOCUS_API_KEY}/stock/${symbol}/financials`;
      const ratiosUrl = `https://api.gurufocus.com/public/user/${config.GURUFOCUS_API_KEY}/stock/${symbol}/keyratios`;

      try {
        const [finRes, ratioRes] = await Promise.all([
          axios.get(financialsUrl),
          axios.get(ratiosUrl),
        ]);

        const financials = finRes.data?.financials?.quarterly;
        const companyName = ratioRes.data?.Basic?.Company;
        const fiscalQuarters: any[] = financials["Fiscal Year"];

        for (let i = 0; i < fiscalQuarters.length; i++) {
          const row = flattenForIndex(financials, i);
          allDocs.push({ companyName, ...row });
        }
      } catch (error) {
        logger.error("Error fetching data for symbol", {
          symbol,
          error: error instanceof Error ? error.message : error,
        });
      }
    }
    const data = extractCompanyMetrics(allDocs);

    const existing = await prisma.homePageChartData.findFirst();

    if (existing) {
      await prisma.homePageChartData.update({
        where: { id: existing.id },
        data: { data: data },
      });
      logger.info("Updated homePageChartData in database", { id: existing.id });
    } else {
      await prisma.homePageChartData.create({
        data: { data: data },
      });
      logger.info("Created new homePageChartData in database");
    }
  } catch (error) {
    logger.error("Error updating stock data", { error });
  }
};
