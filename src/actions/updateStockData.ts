import axios from "axios";
import { GURUFOCUS_API_KEY } from "../config/env.config";
import { stockSymbols } from "../lib/constants";
import {
  extractCompanyMetrics,
  FlattenedDoc,
  flattenForIndex,
} from "../lib/helpers/flattenForIndex";
import { prisma } from "../lib/prisma";

export const updateStockData = async () => {
  try {
    const allDocs: FlattenedDoc[] = [];

    for (const symbol of stockSymbols) {
      const financialsUrl = `https://api.gurufocus.com/public/user/${GURUFOCUS_API_KEY}/stock/${symbol}/financials`;
      const ratiosUrl = `https://api.gurufocus.com/public/user/${GURUFOCUS_API_KEY}/stock/${symbol}/keyratios`;

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
        if (error instanceof Error) {
          console.error(
            ":x: Error updating homepage chart data:",
            error.message
          );
        } else {
          console.error(":x: Error updating homepage chart data:", error);
        }
      }
    }
    const data = extractCompanyMetrics(allDocs);

    const existing = await prisma.homePageChartData.findFirst();

    if (existing) {
      await prisma.homePageChartData.update({
        where: { id: existing.id },
        data: { data: data },
      });
    } else {
      await prisma.homePageChartData.create({
        data: { data: data },
      });
    }
    console.log("Stock Data Updated");
  } catch (error) {
    if (error instanceof Error) {
      console.error(":x: Error updating homepage chart data:", error.message);
    } else {
      console.error(":x: Error updating homepage chart data:", error);
    }
  }
};
