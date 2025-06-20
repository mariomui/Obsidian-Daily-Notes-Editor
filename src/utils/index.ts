import { TFolder, type Vault } from "obsidian";

export function genId(size: number): string {
    const chars: string[] = [];
    for (let n = 0; n < size; n++)
        chars.push(((16 * Math.random()) | 0).toString(16) as string);
    return chars.join("");
}

export function getBasenameOfFolderPath(vault: Vault, path: string) {
    const abf = vault.getAbstractFileByPath(path);
    const isTargetTFolder = abf instanceof TFolder;
    const folder_name = isTargetTFolder ? abf.name : "";
    return folder_name;
}

export function logger(...args: any[]) {
    console.log.apply(this, args);
}
