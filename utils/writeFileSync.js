import fs from "fs";
import path from "path";

export function writeFileSync(filePath, content) {
	const folderPath = path.dirname(filePath);
	if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

	fs.writeFileSync(filePath, content);
}
