import { walk } from "https://deno.land/std@0.224.0/fs/walk.ts";
import * as mantaray from "https://esm.sh/mantaray-js@1.0.3";

export const readDir = async (dir = ".") => {
  const files: File[] = [];
  for await (
    const entry of walk(dir, { includeDirs: false, skip: [/^.*\/\.[^/]*$/] })
  ) {
    const blob = await Deno.readFile(entry.path);
    const file = new File([blob], entry.name);
    files.push(file);
  }
  return files;
};

export const readManifest = (cid: string, filePath: string) => {
  // const searchResult = await this.getDeserializedNode(hash, path);
};

export const loadDelegatePrivateKeyFromEnv = () => {
  // ...
};
