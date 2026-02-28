import * as fs from "fs";
const content = fs.readFileSync("node_modules/@google/genai/dist/genai.d.ts", "utf-8");
const match = content.match(/type PartUnion[\s\S]*?;/);
console.log(match ? match[0] : "Not found");
