import * as Icons from '../Icons'
import ToolbarButton, { ToolbarButtonType } from '../ToolbarButton'
import { Modal, ModalButton, ModalButtonAction, ModalOptionsType } from '../Modal'
import Editor from '../Editor'




export default class Settings extends ToolbarButton {

    static readonly TAG = 'SETTINGS' // The HTMLElement tag as inserted in the dom for this custom node

    private drawer: Modal | null = null


    constructor(editor: Editor, group: number) {
        super(editor, ToolbarButtonType.DETACHED, Settings.TAG, 'Settings', Icons.options, group)
    }


    /**
     * On first load of editor see if have options in local storage, in which case use
     * otherwise default to editor options
     */
    init() {
        // Light or dark theme
        const theme = localStorage.getItem('theme')
        if (theme) {
            this.editor.options.theme = theme
        }
        this.setTheme()
        // Heading numbering
        const headingNumbers = localStorage.getItem('headingNumbers')
        if (localStorage.getItem('headingNumbers')) {
            this.editor.options.headingNumbers = headingNumbers == 'true' ? true : false
        }
        this.setHeadingNumbers()
        // Sidebar
        const explorer = localStorage.getItem('explorer')
        if (localStorage.getItem('explorer')) {
            this.editor.options.explorer = explorer == 'true' ? true : false
        }
        this.setExplorer()
    }

    setState(): void {
        this.element.classList.add('active')
    }


    /**
     * Mandatory button click function
     */
    click() {
        // Ignore if a modal is active
        if (this.drawer?.active) {
            return
        }
        this.show()
    }


    /**
     * Show the options dialogue.
     */
    private show() {
        const buttons = [
            new ModalButton(ModalButtonAction.Cancel, 'Close'),
        ]
        const options: ModalOptionsType = {
            escapeToCancel: true,
            confirmIfDirty: false
        }
        this.drawer = new Modal('Options', this.form(), buttons, options)
        // Set custom event handles to update immediately
        const inputs = this.drawer.getElements('form input')
        if (inputs) {

            inputs.forEach((input) => {
                input.addEventListener('click', () => this.addCustomEventListener(input))
                console.log('Adding event listener to', input)
            })
        }
    }


    private addCustomEventListener(input: Element) {
        const name = input.getAttribute('name')
        const value = input.getAttribute('value')
        switch (name) {
            case 'headingNumbers':
                this.setHeadingNumbers(value)
                break
            case 'theme':
                this.setTheme(value)
                break
            case 'explorer':
                this.setExplorer(value)
        }
    }


    /**
     * Form template
     */
    private form() {
        const headingNumbers = this.editor.options.headingNumbers
        const theme = this.editor.options.theme
        const explorer = this.editor.options.explorer
        return `<div class="form-input options">
                <label>Heading numbers</label>
                <label>
                    <input name="headingNumbers" value="true" type="radio" class="form-control first" ${headingNumbers ? 'checked' : ''}/> On
                </label>
                <label>
                    <input name="headingNumbers" value="false" type="radio" class="form-control" ${!headingNumbers ? 'checked' : ''}/> Off
                </label>
            </div>
            <div class="form-input options">
                <label>Theme</label>
                <label>
                    <input name="theme" value="theme-light" type="radio" class="form-control first" ${theme == 'theme-light' ? 'checked' : ''}/> Light
                </label>
                <label>
                    <input name="theme" value="theme-dark" type="radio" class="form-control" ${theme == 'theme-dark' ? 'checked' : ''}/> Dark
                </label>
            </div>
            <div class="form-input options">
                <label>Explorer</label>
                <label>
                    <input name="explorer" value="true" type="radio" class="form-control first" ${explorer ? 'checked' : ''}/> Show
                </label>
                <label>
                    <input name="explorer" value="false" type="radio" class="form-control" ${!explorer ? 'checked' : ''}/> Hide
                </label>
            </div>`
    }


    private setHeadingNumbers(numbers?: string | null) {
        if (numbers) {
            this.editor.options.headingNumbers = numbers === 'true'
            localStorage.setItem('headingNumbers', numbers)
        }
        if (this.editor.options.headingNumbers) {
            this.editor.editorNode.classList.add('heading-numbers')
        } else {
            this.editor.editorNode.classList.remove('heading-numbers')
        }
    }


    private setTheme(theme?: string | null) {
        if (theme) {
            this.editor.options.theme = theme
            localStorage.setItem('theme', theme)
        }
        document.documentElement.className = this.editor.options.theme
    }


    private setExplorer(explorer?: string | null) {
        if (explorer) {
            this.editor.options.explorer = explorer === 'true'
            localStorage.setItem('explorer', explorer)
        }
        if (this.editor.options.explorer) {
            this.editor.showSidebar()
        } else {
            this.editor.hideSidebar()
        }
    }

}