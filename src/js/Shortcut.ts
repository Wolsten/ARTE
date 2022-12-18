import ToolbarButton from "./ToolbarButton"

export default class Shortcut {

    shortcut: string = ''
    trigger: string = ''
    button: ToolbarButton

    constructor(button: ToolbarButton) {
        if (button.shortcut) {
            this.shortcut = button.shortcut[0]
            this.trigger = button.shortcut[1]
        }
        this.button = button
    }

}
