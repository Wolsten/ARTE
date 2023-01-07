import * as Icons from '../Icons'
import ToolbarButton from '../ToolbarButton'
import { Modal, ModalButton, ModalButtonAction, ModalOptionsType } from '../Modal'




export default class Settings extends ToolbarButton {

    static readonly TAG = 'SETTINGS' // The HTMLElement tag as inserted in the dom for this custom node

    private drawer: Modal | null = null

    constructor(editor: Editor, group: number) {
        super(editor, 'custom', Settings.TAG, 'Settings', Icons.options, group)
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
            new ModalButton(ModalButtonAction.Cancel, 'Cancel'),
        ]
        const options: ModalOptionsType = {
            escapeToCancel: true
        }
        this.drawer = new Modal('Options', this.form(), buttons, options)
        // Set custom event handles to update immediately
        const inputs = this.drawer.getElements('form input')
        if (inputs) {
            inputs.forEach((input) => input.addEventListener('change', () => this.addCustomEventListener(input)))
        }
    }


    private addCustomEventListener(input: Element) {
        const name = input.getAttribute('name')
        switch (name) {
            case 'headingNumbers':
                this.setHeadingNumbers()
                break
            case 'theme':
                this.setTheme()
                break
            case 'explorer':
                this.setExplorer()
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
                    <input name="theme" value="theme-light" type="radio" class="form-control first" ${options.theme == 'theme-light' ? 'checked' : ''}/> Light
                </label>
                <label>
                    <input name="theme" value="theme-dark" type="radio" class="form-control" ${theme == 'theme-dark' ? 'checked' : ''}/> Dark
                </label>
            </div>
            <div class="form-input options">
                <label>Explorer</label>
                <label>
                    <input name="explorer" value="show-explorer" type="radio" class="form-control first" ${explorer ? 'checked' : ''}/> Show
                </label>
                <label>
                    <input name="explorer" value="hide-explorer" type="radio" class="form-control" ${!explorer ? 'checked' : ''}/> Hide
                </label>
            </div>`
    }


    private setHeadingNumbers() {
        this.editor.options.headingNumbers = this.drawer?.getInputValue('[name=headingNumbers]') == 'true' ? true : false
        if (this.editor.options.headingNumbers) {
            this.editor.editorNode.classList.add('heading-numbers')
            localStorage.setItem('headingNumbers', 'true')
        } else {
            this.editor.editorNode.classList.remove('heading-numbers')
            localStorage.setItem('headingNumbers', 'false')
        }
    }


    private setTheme() {
        this.editor.options.theme = this.drawer?.getInputValue('[name=theme]') == 'theme-light' ? 'theme-light' : 'theme-dark'
        localStorage.setItem('theme', this.editor.options.theme)
        document.documentElement.className = this.editor.options.theme
    }


    private setExplorer() {
        this.editor.options.explorer = this.drawer?.getInputValue('[name=explorer]') == 'show-explorer' ? true : false
        if (this.editor.options.explorer) {
            localStorage.setItem('headingNumbers', 'true')
            this.editor.sidebar?.show()
        } else {
            localStorage.setItem('headingNumbers', 'false')
            this.editor.sidebar?.hide()
        }
    }

}