import ToolbarButton, { ToolbarButtonType } from '../ToolbarButton'
import * as Icons from '../Icons'
import * as Helpers from '../helpers'
import { Modal, ModalType } from '../Modal'
import Editor from '../Editor'



export default class Mentions extends ToolbarButton {

    people: string[] = []

    listItemElements: NodeListOf<HTMLLIElement> | null = null
    listContainerElement: HTMLElement | null = null
    inputElement: HTMLInputElement | null = null
    selectedIndex = 0
    modal: Modal | null = null


    constructor(editor: Editor, group: number) {
        super(editor, ToolbarButtonType.CUSTOM, 'MENTION', 'Mention', Icons.person, group)

        if (this.editor.options.people) this.people = this.editor.options.people.sort()

        this.shortcut = ['@', '@']
    }


    /**
    * Handle mentions button click
    */
    click() {
        if (!this.editor || !this.editor.range || !this.editor.editorNode) {
            // console.log('No range selected')
            return
        }
        const options = { type: ModalType.Positioned, escapeToCancel: true }
        this.modal = new Modal('', this.form(), [], options)
        this.modal.setPosition(this.editor.range, this.editor.editorNode)
        // Add custom event handling - add keyup to main container
        // so can detect/filter keystrokes and handle navigation in the
        // list using arrow keys and tabs
        this.listContainerElement = this.modal.getElement('ul')
        if (!this.listContainerElement) {
            console.error('The mention form is missing the list container element')
            return
        }
        this.listContainerElement.addEventListener('click', (event: MouseEvent) => this.handleListClick(event))
        // Init list items and selection
        this.listItemElements = this.listContainerElement.querySelectorAll('li')
        this.selectedIndex = 0
        this.highlightItem(false)
        // Initialise the text input
        this.inputElement = this.modal.getInputElement('input')
        if (!this.inputElement) {
            console.error('Text input missing from mention')
            return
        }
        this.inputElement.value = ''
        this.inputElement.focus()
        this.inputElement.addEventListener('keyup', (event: KeyboardEvent) => this.handleKeyUp(event))
    }



    /**
     * Set the disabled state of this button. This one can never be active
     */
    setState() {
        (<HTMLInputElement>this.element).disabled =
            this.editor?.range?.collapsed == false ||
            this.editor?.range?.custom !== false
    }



    /**
     * Generate the list elements for the full list of people
     * setting the initial ones to be visible (with the "show" class) and the first
     * one to be selected (using the "selected" class)
     * Returns list of li's 
     */
    private filterList(userEnteredFilterText: string): string {
        let html = ''
        this.people.forEach(person => {
            const p = person.toLowerCase()
            const filtered = userEnteredFilterText != '' ? p.includes(userEnteredFilterText) : true
            if (filtered) {
                html += `<li>${person}</li>`
            }
        })
        return html
    }



    /**
     * Highlight the selected item as a result of navigating through the list
     */
    private highlightItem(scrollSelectedItemIntoView = true) {
        if (!this.listItemElements) {
            console.error('Mentions missing the list elements')
            return
        }
        if (this.selectedIndex >= 0 && this.listItemElements.length > 0) {
            this.listItemElements.forEach(item => item.classList.remove('selected'))
            this.listItemElements[this.selectedIndex].classList.add('selected')
            if (scrollSelectedItemIntoView) {
                this.listItemElements[this.selectedIndex].scrollIntoView({ block: "end", inline: "nearest" })
            }
        }
    }


    /**
     * Generate the html for the input form
     * Returns HTML form string
     */
    form(): string {
        const html = this.filterList('')
        return `<div class="mentions">
                    <input type="text"/>
                    <ul>${html}</ul>
                </div>`
    }


    /**
     * Handle key down events anywhere in the panel
     */
    private handleKeyUp(event: KeyboardEvent) {
        const key = event.key
        const shiftKey = event.shiftKey
        let navigated = false

        event.preventDefault()
        event.stopPropagation()

        if (!this.listItemElements || !this.listContainerElement) {
            console.error('Mentions missing the list elements or container')
            return
        }

        if (key == 'Escape') {
            // console.log('escape!')
            this.insert('')
            return
        }

        if (this.listItemElements.length == 0) {
            this.selectedIndex = -1
            // Move down list
        } else if (key == 'ArrowDown' || key == 'ArrowRight' || (key == 'Tab' && shiftKey == false)) {
            event.preventDefault()
            if (this.selectedIndex < this.listItemElements.length - 1) {
                this.selectedIndex++
            } else {
                this.selectedIndex = 0
            }
            navigated = true
            this.highlightItem()
            // Move up list
        } else if (key == 'ArrowUp' || key == 'ArrowLeft' || (key == 'Tab' && shiftKey)) {
            event.preventDefault()
            if (this.selectedIndex == 0) {
                this.selectedIndex = this.listItemElements.length - 1
            } else {
                this.selectedIndex--
            }
            navigated = true
            this.highlightItem()
        }
        // Not navigated - therefore check if pressed enter or not
        if (navigated == false) {

            const value = this?.inputElement?.value || ''
            // Filter list if not pressed enter
            if (key != 'Enter') {
                // console.log('filter',inputElement.value.toLowerCase())
                this.listContainerElement.innerHTML = this.filterList(value.toLowerCase())
                this.listItemElements = this.listContainerElement.querySelectorAll('li')
                this.selectedIndex = 0
                this.highlightItem()
                // Enter pressed?
            } else {
                // If have any visible list items then chose the one selected, otherwise
                // just enter the current input value
                let chosen = ''
                if (this.selectedIndex != -1) {
                    chosen = this.listItemElements[this.selectedIndex].textContent || ''
                } else {
                    chosen = value
                }
                this.insert(chosen)
            }
        }
    }


    /**
     * Handle clicking on a list item and insert the clicked value
     */
    private handleListClick(event: MouseEvent) {
        if (event.target) {
            const element = <HTMLElement>event.target
            const text = element.textContent || ''
            this.insert(text)
        }
    }


    /**
     * Insert a new person's name in the appropriate position
     */
    private insert(person: string) {
        if (!this.editor.range || !this.editor.range.startContainer || !this.modal) {
            return
        }
        const container = this.editor.range.startContainer
        const contents = container?.textContent || ''
        let offset = this.editor.range.startOffset
        const before = contents.substring(0, offset)
        let after = contents.substring(offset)
        // Remove optional @
        if (after.charAt(0) === '@') {
            after = after.slice(1, after.length)
        }
        // Add space before?
        if (person != '') {
            if (contents.charCodeAt(offset - 1) !== 32) {
                person = ' ' + person
            }
            // Add space after
            if (offset < contents.length && contents.charCodeAt(offset) !== 32) {
                if (after != '') {
                    after = after + ' '
                }
                person = person + ' '
            }
        }
        this.editor.range.startContainer.textContent = before + person + after
        // Move offset to the end of the newly inserted person
        offset += person.length
        // this.editor.range = Helpers.setCursor(<Element>container, offset)
        this.editor.range.setCursor(container, offset)

        // Hide the modal
        this.modal.hide()

        // UPdate the buffer if supporting buffering
        this.editor.updateBuffer()
    }



}