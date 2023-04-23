import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
	resolve: {
		alias: {
			fs: "rollup-pligin-node-builtins",
			"fs/promises": "rollup-pligin-node-builtins",
		},
	},
	plugins: [react()],
});
