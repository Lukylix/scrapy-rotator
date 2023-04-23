import fs from "fs";
export function readFileSync(filePath) {
	if (fs.existsSync(filePath)) return fs.readFileSync(filePath, "utf8");
	return "[]";
}
