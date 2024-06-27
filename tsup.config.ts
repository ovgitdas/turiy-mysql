import { defineConfig } from "tsup";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import obfuscator from "rollup-plugin-obfuscator"; // Install this plugin

export default defineConfig({
  format: ["cjs", "esm"],
  entry: ["./src/index.ts"],
  dts: true,
  shims: true,
  skipNodeModulesBundle: true,
  clean: true,
  plugins: [
    nodeResolve() as any, // Add any other plugins you need
    obfuscator() as any,
  ],
});
