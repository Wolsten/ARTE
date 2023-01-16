import Editor from './Editor'
import SidebarButton from './SidebarButton'
import * as Icons from './icons'


export default class Sidebar {

    editor: Editor
    sidebarNode!: HTMLElement
    sidebarContentNode!: HTMLElement


    constructor(editor: Editor) {

        this.editor = editor

        // Sidebar
        const sidebarNode = this.editor.containerNode.querySelector('.editor-sidebar')
        if (!sidebarNode) {
            alert('Sidebar placeholder is missing')
            return
        }
        this.sidebarNode = <HTMLElement>sidebarNode

        // Tabs
        let tabList: SidebarButton[] = []
        this.editor.toolbar!.buttons.forEach(button => {
            if (button.sidebar) {
                const sidebarTab = button.sidebar()
                if (sidebarTab) {
                    // console.log('Adding sidebar for button', button.tag)
                    tabList.push(sidebarTab)
                }
            }
        })

        // Populate sidebar with tabs and content placeholder
        this.sidebarNode.innerHTML = this.template(tabList)

        // Tab menu clicks
        const tabMenu = this.sidebarNode.querySelector('.tab-menu')
        if (!tabMenu) {
            alert('Could not find tab menu for sidebar')
            return
        }
        const tabMenuItems = tabMenu.querySelectorAll('a')
        tabMenuItems.forEach(
            item => item.addEventListener('click', event => this.handleTabMenuClicks(event, tabMenuItems))
        )
        const closeButton = this.sidebarNode.querySelector('button.close')
        if (!closeButton) {
            alert('Could not find close button for sidebar')
            return
        }
        closeButton.addEventListener('click', () => this.hide())
    }


    /**
     * Insert the sidebar in the dom
     */
    // showOLD(): void {
    //     if (!this.editor.mainNode) {
    //         console.error('Main node not set')
    //         return
    //     }
    //     if (this.editor.mainNode.querySelector('.editor-sidebar') !== null) {
    //         this.update()
    //         return
    //     }
    //     let tabList: SidebarButton[] = []
    //     this.editor.toolbar!.buttons.forEach(button => {
    //         if (button.sidebar) {
    //             const sidebarTab = button.sidebar()
    //             if (sidebarTab) {
    //                 // console.log('Adding sidebar for button', button.tag)
    //                 tabList.push(sidebarTab)
    //             }
    //         }
    //     })

    //     // Populate the sidebar
    //     this.sidebarNode = document.createElement('DIV')
    //     this.sidebarNode.classList.add('editor-sidebar')
    //     this.sidebarNode.classList.add('dont-break-out')
    //     this.sidebarNode.innerHTML = this.template(tabList)

    //     // Tab menu clicks
    //     const tabMenu = this.sidebarNode.querySelector('.tab-menu')
    //     if (!tabMenu) {
    //         console.error('Error: Could not find tab menu for sidebar')
    //         return
    //     }
    //     const tabMenuItems = tabMenu.querySelectorAll('a')
    //     tabMenuItems.forEach(
    //         item => item.addEventListener('click', event => this.handleTabMenuClicks(event, tabMenuItems))
    //     )
    //     const closeButton = this.sidebarNode.querySelector('button.close')
    //     if (!closeButton) {
    //         console.error('Error: Could not find close button for sidebar')
    //         return
    //     }
    //     closeButton.addEventListener('click', () => this.hide())
    //     // Append to the editor
    //     this.editor.mainNode.appendChild(this.sidebarNode)
    // }

    show(): void {
        if (!this.editor.options.explorer) return
        this.editor.containerNode.classList.add('show-sidebar')
        this.update()
    }


    hide(): void {
        this.editor.containerNode.classList.remove('show-sidebar')
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
                const sidebarTab = button.sidebar()
                if (sidebarTab) {
                    // console.log('Adding sidebar for button', button.tag)
                    tabList.push(sidebarTab)
                }
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
    handleTabMenuClicks(event: Event, tabMenuItems: NodeListOf<HTMLAnchorElement>): void {
        event.preventDefault()
        event.stopPropagation()
        // Find the clicked tab, i.e. the element with the data-tab-target attribute
        let tab = <HTMLElement>event.currentTarget
        if (tab) {
            let tabTarget = tab.dataset.tabTarget
            while (!tabTarget) {
                tab = <HTMLElement>tab.parentNode
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


    private template(tabList: SidebarButton[]) {
        let menu = ''
        let content = ''
        tabList.forEach((button, index) => {
            const active = index == 0 ? 'active' : ''
            const show = index == 0 ? 'show' : ''
            const tabClass = button.label.replaceAll(' ', '-')
            const itemContent = button.content ? button.content : `You have no ${button.label} in your document.`
            menu += `<li><a href="#" class="tab-menu ${active}" data-tab-target="tab-${index}" title="${button.label}">${button.icon}</a></li>`
            content += `
                <div class="tab-item ${tabClass} ${show}" data-tab-id="tab-${index}">
                    <header><h2>${button.label}</h2></header>
                    ${itemContent}
                </div>`
        })
        const html =
            `<div class="editor-sidebar-content">
                <header><h2>Explorer</h2><button class="close">${Icons.close}</button></header>
                <ul class="tab-menu">${menu}</ul>
                <div class="tab-content">${content}</div>
            </div>`
        return html
    }

}