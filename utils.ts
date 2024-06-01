export const readDir = async (dir = ".") => {
  const files: File[] = [];
  for await (
    const entry of Deno.readDir(dir)
  ) {
    if (entry.isFile && !entry.name.startsWith(".")) {
      const blob = await Deno.readFile(entry.name);
      const file = new File([blob], entry.name);
      files.push(file);
    }
  }
  return files;
};

export const readManifest = (cid: string, filePath: string) => {
  // const searchResult = await this.getDeserializedNode(hash, path);
};

export const loadDelegatePrivateKeyFromEnv = () => {
  // ...
};
