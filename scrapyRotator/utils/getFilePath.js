import { fileURLToPath } from "url";
import path from "path";

export function getFilePath(desiredPath, metaURl) {
	return path.join(path.dirname(fileURLToPath(metaURl)), ...desiredPath.split("/"));
}
