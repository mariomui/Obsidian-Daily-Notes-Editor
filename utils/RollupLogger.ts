import { ChalkInstance } from "chalk";

export interface RollerLogger {
    progress: (message: string) => { message: string };
    success: (message: string) => { message: string };
    fail: (message: string) => { message: string };
}
export function RollupLogger(chalk: ChalkInstance) {
    const chalkerChoices = {
        progress: chalk.yellow,
        success: chalk.green,
        fail: chalk.red,
    } as const;
    type Chalker = (typeof chalkerChoices)[keyof typeof chalkerChoices];

    this.progress = (message) => manuMessage(message, chalkerChoices.progress);
    this.success = (message) => manuMessage(message, chalkerChoices.success);
    this.fail = (message = "Shit!") =>
        manuMessage(message, chalkerChoices.fail);

    function manuMessage(
        message: string,
        chalker: Chalker
    ): { message: string } {
        return {
            message: chalker(message),
        };
    }
}
