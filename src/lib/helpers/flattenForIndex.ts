export interface FlattenedDoc {
  [key: string]: any;
}

export const flattenForIndex = (
  data: Record<string, any>,
  index: number,
  parentKey: string = ""
): FlattenedDoc => {
  const result: FlattenedDoc = {};
  for (const [key, value] of Object.entries(data)) {
    const newKey = parentKey ? `${parentKey}.${key}` : key;
    if (Array.isArray(value)) {
      result[newKey] = value[index] !== undefined ? value[index] : null;
    } else if (typeof value === "object" && value !== null) {
      Object.assign(result, flattenForIndex(value, index, newKey));
    } else {
      result[newKey] = value;
    }
  }
  return result;
};

export const extractCompanyMetrics = (allDocs: FlattenedDoc[]) => {
  const result: { [companyName: string]: { data: any[] } } = {};

  allDocs.forEach((doc) => {
    const companyName = doc.companyName;
    const fiscalYear = doc["Fiscal Year"];
    const daysInventory = doc["common_size_ratios.Days Inventory"];
    const totalInventory = doc["balance_sheet.Total Inventories"];
    const epsDiluted = doc["income_statement.EPS (Diluted)"];

    if (Number(epsDiluted) > 0) {
      if (!result[companyName]) {
        result[companyName] = { data: [] };
      }

      result[companyName].data.push({
        fiscalYear,
        daysInventory,
        totalInventory,
      });
    }
  });

  return result;
};
