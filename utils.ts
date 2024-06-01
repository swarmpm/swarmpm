import { walk } from "https://deno.land/std@0.224.0/fs/walk.ts";

export const readDir = async (dir = ".") => {
  const files: File[] = [];
  for await (const entry of walk(dir, { match: [/^(?!\.).+/] })) {
    if (entry.isFile) {
      const blob = await Deno.readFile(entry.path);
      const file = new File([blob], entry.name);
      files.push(file);
    }
  }
  return files;
};
