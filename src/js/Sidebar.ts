import Editor from './Editor'
import SidebarButton from './SidebarButton'
import { sidebarContent } from './templates'

export default class Sidebar {

    editor: Editor
    sidebarNode: null | HTMLElement = null


    constructor(editor: Editor) {
        this.editor = editor
        this.show()
    }


    /**
     * Insert the sidebar in the dom
     */
    show(): void {
        if (!this.editor.mainNode) {
            console.error('Main node not set')
            return
        }
        if (this.editor.mainNode.querySelector('.editor-sidebar') !== null) {
            this.update()
            return
        }
        let tabList: SidebarButton[] = []
        this.editor.toolbar!.buttons.forEach(button => {
            if (button.sidebar) {
                //console.log('Opening sidebar for button ', button.tag)

                tabList.push(button.sidebar())
            }
        })

        // Populate the sidebar
        this.sidebarNode = document.createElement('DIV')
        this.sidebarNode.classList.add('editor-sidebar')
        this.sidebarNode.classList.add('dont-break-out')
        this.sidebarNode.innerHTML = sidebarContent(tabList)

        // Tab menu clicks
        const tabMenu = this.sidebarNode.querySelector('.tab-menu')
        if (!tabMenu) {
            console.error('Error: Could not find tab menu for sidebar')
            return
        }
        const tabMenuItems = tabMenu.querySelectorAll('a')
        tabMenuItems.forEach(
            item => item.addEventListener('click', event => this.handleTabMenuClicks(event, tabMenuItems))
        )
        const closeButton = this.sidebarNode.querySelector('button.close')
        if (!closeButton) {
            console.error('Error: Could not find close button for sidebar')
            return
        }
        closeButton.addEventListener('click', () => this.hideSidebar())
        // Append to the editor
        this.editor.mainNode.appendChild(this.sidebarNode)
    }


    hideSidebar(): void {
        if (this.sidebarNode) this.sidebarNode.remove()
        this.editor.options.explorer = false
    }


    /**
     * Update the content of the sidebar
     */
    update(): void {
        if (!this.sidebarNode) {
            return
        }
        // Get latest content
        let tabList: SidebarButton[] = []
        this.editor.toolbar!.buttons.forEach(button => {
            if (button.sidebar) {
                tabList.push(button.sidebar())
            }
        })
        // Populate latest content if we have any
        tabList.forEach((item, index) => {
            const content = this.sidebarNode!.querySelector(`[data-tab-id="tab-${index}"]`)
            if (!content) {
                console.error('Error: Could not find a sidebar tab', index)
                return
            }
            if (item.content === '') {
                item.content = `You have no ${item.label} in your document.`
            }
            content.innerHTML = item.content
        })
    }


    /**
     * Handle clicking on a tab menu item (the current target)
     */
    handleTabMenuClicks(event: Event, tabMenuItems: HTMLElement[]): void {
        event.preventDefault()
        event.stopPropagation()
        // Find the clicked tab, i.e. the element with the data-tab-target attribute
        let tab: any = event.currentTarget
        if (tab) {
            let tabTarget = tab.dataset.tabTarget
            while (!tabTarget) {
                tab = tab.parentNode
                tabTarget = tab.dataset.tabTarget
            }
            // Remove existing active and show classes
            tabMenuItems.forEach(item => item.classList.remove('active'))
            let tabItemTarget = null
            if (this.sidebarNode) {
                const tabItems = this.sidebarNode.querySelectorAll('.tab-item')
                if (tabItems) {
                    tabItems.forEach(item => item.classList.remove('show'))
                }
                tabItemTarget = this.sidebarNode.querySelector(`[data-tab-id="${tabTarget}"]`)
            }
            // Add new classes
            tab.classList.add('active')
            if (tabItemTarget) {
                tabItemTarget.classList.add('show')
            }
        }
    }
}