import axios from "axios";
import { prisma } from "../lib/prisma";
import { ELASTIC_API_KEY, ELASTICSEARCH_URL } from "../config/env.config";

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

      // Delete
      await prisma.macroLens.deleteMany();

      // Create
      await prisma.macroLens.create({
        data: {
          data: data,
        },
      });

      console.log("Macro Lens Data Updated ");
    } catch (error) {
      console.error("Error fetching inventory data:", error);
    }
  } catch (error) {
    console.error("Error storing macro lends data in database!!", error);
  }
};
