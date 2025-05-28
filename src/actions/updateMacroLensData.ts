import axios from "axios";
import { prisma } from "../lib/prisma";
import logger from "utils/logger/logger";

const INVENTORY_FIELDS = [
  "Inventory Turnover",
  "Days Inventory",
  "Inventory-to-Revenue",
  "Inventories",
  "Total Inventories",
  "Change In Inventory",
  "Cost of Goods Sold",
  "COGS-to-Revenue",
];
const ELASTIC_API_KEY = process.env.ELASTIC_API_KEY;
const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL;
export const updateMacroLensData = async () => {
  try {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 2;

    const query = {
      size: 6000,
      query: {
        bool: {
          must: [
            {
              range: {
                "Fiscal Year": {
                  gte: `${startYear}`,
                  lte: `${currentYear}`,
                },
              },
            },
          ],
        },
      },
    };

    try {
      logger.info("Fetching inventory data from Elasticsearch", {});
      const response = await axios.post(
        `${ELASTICSEARCH_URL}/stocks_financials_quarterly/_search`,
        query,
        {
          headers: {
            Authorization: `ApiKey ${ELASTIC_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data;
      const filteredResults = [];
      for (const hit of data?.hits?.hits) {
        const source = hit?._source;

        const filteredData: Record<string, any> = {
          Company: source?.Company,
          Stock: source?.Stock,
          "Fiscal Year": source?.["Fiscal Year"],
        };

        for (const key in source) {
          if (
            INVENTORY_FIELDS.some((invKey) =>
              key.toLowerCase().includes(invKey.toLowerCase())
            )
          ) {
            filteredData[key] = source[key];
          }
        }

        if (Object.keys(filteredData).length > 3) {
          filteredResults.push(filteredData);
        }
      }

      const existing = await prisma.macroLens.findFirst();

      if (existing) {
        await prisma.macroLens.update({
          where: { id: existing.id },
          data: { data: data },
        });
        logger.info("Macro Lens data updated in database", { id: existing.id });
      } else {
        await prisma.macroLens.create({
          data: { data: data },
        });
        logger.info("Macro Lens data created in database", {});
      }
    } catch (error) {
      logger.error("Error fetching inventory data from Elasticsearch", {
        error,
      });
    }
  } catch (error) {
    logger.error("Error storing Macro Lens data in database", { error });
  }
};
