import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "outputs";
await fs.mkdir(outputDir, { recursive: true });
console.log("start");

const workbook = Workbook.create();
console.log("workbook created");
const sheets = [
  {
    name: "Accounts",
    headers: ["Created At", "Name", "Phone", "Email"],
    rows: [
      ["", "", "", ""],
      ["", "", "", ""],
      ["", "", "", ""],
    ],
  },
  {
    name: "Orders",
    headers: [
      "Date",
      "Account Phone",
      "Name",
      "Phone",
      "Email",
      "Address",
      "Items",
      "Subtotal",
      "Delivery",
      "Total",
      "Payment Mode",
      "Transaction ID",
    ],
    rows: [
      ["", "", "", "", "", "", "", null, null, null, "", ""],
      ["", "", "", "", "", "", "", null, null, null, "", ""],
      ["", "", "", "", "", "", "", null, null, null, "", ""],
    ],
  },
  {
    name: "Visits",
    headers: [
      "Date",
      "Type",
      "Name",
      "Phone",
      "Email",
      "Amount",
      "Payment Mode",
      "Transaction ID",
      "Details",
    ],
    rows: [
      ["", "", "", "", "", null, "", "", ""],
      ["", "", "", "", "", null, "", "", ""],
      ["", "", "", "", "", null, "", "", ""],
    ],
  },
];

for (const config of sheets) {
  console.log("sheet", config.name);
  const sheet = workbook.worksheets.add(config.name);
  console.log("added", config.name);
  const width = config.headers.length;
  const lastColumn = String.fromCharCode(64 + width);
  console.log("range", `A1:${lastColumn}${config.rows.length + 1}`);
  sheet.showGridLines = false;
  console.log("grid");
  sheet.getRange("A1").writeValues([config.headers, ...config.rows]);
  console.log("values");
}
console.log("base sheets done");

const accounts = workbook.worksheets.getItem("Accounts");
accounts.getRange("F1").writeValues([
  ["Pure Grow Farm Data Workbook", ""],
  ["Use", "Website Excel export data can be copied into these sheets."],
  ["Farm", "Pure Grow Farm"],
  ["Contact", "9067891039 | 8200145732"],
]);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 50 },
  summary: "formula error scan",
});
console.log(errors.ndjson);
console.log("inspect done");

const file = await SpreadsheetFile.exportXlsx(workbook);
console.log("exported");
await file.save(`${outputDir}/pure-grow-farm-data.xlsx`);
console.log("saved outputs/pure-grow-farm-data.xlsx");
