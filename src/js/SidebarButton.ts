export default class SidebarButton {

    icon = ''
    label = ''
    content = ''

    constructor(icon: string, label: string, content: string) {
        this.icon = icon
        this.label = label
        this.content = content
    }

    update(content: string): void {
        this.content = content
    }


}