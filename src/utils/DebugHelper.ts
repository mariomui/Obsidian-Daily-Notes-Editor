const PLUGIN_NAME = "Scribening";
export class DebugHelper {
    private debugMode = true;
    private idCounter = 0;

    public setDebugMode(debug: boolean): void {
        this.debugMode = debug;
    }

    public debug(...args: any[]): void {
        if (!this.debugMode) {
            return;
        }

        console.log(`${PLUGIN_NAME}:`, ...args);
    }

    public error(message: any): void {
        if (!this.debugMode) {
            return;
        }

        console.error(message);
    }

    public debugStart(name: string): () => void {
        if (!this.debugMode) {
            return () => {};
        }

        const qualifiedName = `${PLUGIN_NAME}|${name} (${++this.idCounter})`;
        console.time(qualifiedName);
        return () => console.timeEnd(qualifiedName);
    }
}
