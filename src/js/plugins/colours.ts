import * as Helpers from '../helpers'
import * as Icons from '../icons'
import Modal from '../Modal'
import Editor from '../Editor'
import Style from './Style'
import ToolbarButton from '../ToolbarButton'



export default class Colours extends ToolbarButton {

    static readonly PALETTE = ['black', 'white', 'violet', 'indigo', 'blue', 'green', 'yellow', 'orange', 'red']

    drawer: null | Modal = null
    style = ''

    constructor(editor: Editor, type: string, group: number) {

        type = type.toUpperCase()

        // 'ARTE-COLOR'
        if (type === 'ARTE-COLOR') {
            super(editor, 'inline', 'ARTE-COLOR', 'Text colour', Icons.colourForeground, group)
            this.style = 'color'
            // 'ARTE-BACKGROUND-COLOR'
        } else {
            super(editor, 'inline', 'ARTE-BACKGROUND-COLOR', 'Highlight colour', Icons.colourBackground, group)
            this.style = 'background-color'
        }
    }


    init() {
        // console.log('Initialising colour button',button.tag)
        const bar = document.createElement('span')
        bar.classList.add('bar')
        bar.classList.add(this.tag)
        this.element?.appendChild(bar)
        this.element?.classList.add('barred')
    }


    /**
     * Set the disabled and active states of a button
     */
    setState(): void {
        if (!this.element) {
            console.error('Missing button element for button', this.tag)
            return
        }
        //console.log('setting colour state ')
        // The rootNode should not be the editor or list container - (implying 
        // multiple blocks selected) 
        this.enableOrDisable()

        // Get the inline styles of the selected range
        let value = ''
        let styles = []
        const parentNode = this.editor?.range?.startContainer?.parentNode
        const inlineStyles = parentNode ? (<Element>parentNode).getAttribute('style') : null
        const spanBar = this.element.querySelector('span.bar')

        if (inlineStyles) {
            styles = inlineStyles.split(';')
            // console.log('styles',styles)
            styles.forEach(item => {
                // Ignore empty styles (split creates an empty element for last ;)
                if (item !== '') {
                    const parts = item.split(':')
                    // Does the inline style match the button?
                    // If so set the button styling to match
                    if (parts[0].trim() === this.style) {
                        value = parts[1].trim()
                        if (spanBar) {
                            spanBar.setAttribute('style', `background-color:${value};`)
                        }
                    }
                }
            })
        }
        if (spanBar && value == '') {
            spanBar.removeAttribute('style')
        }
    }



    /**
     * Mandatory button click function which displays the colour dialogue
     * for the supplied button
     */
    click(): void {
        // Ignore if a modal is active
        if (this.drawer && this.drawer.active()) {
            return
        }
        if (!this.editor.range || this.editor.range.collapsed) {
            const feedback = new Modal({
                type: 'overlay',
                severity: 'info',
                html: 'The colour selection buttons require at least one character to be selected.',
                buttons: { cancel: { label: 'Close' } }
            })
            feedback.show()
            return
        }
        this.show()
    }


    /**
     * Show the colour input for the button supplied, saving in the global input 
     * variable.
     * The input is not displayed but triggered programmatically to display
     * a HTML5 colour input dialogue. 
     * Clicking on this triggers the input event.
     */
    private show() {

        let title = "Select highlight colour"
        if (this.tag == 'ARTE-COLOR') {
            title = "Select text colour"
        }
        // Display the panel
        this.drawer = new Modal({
            type: 'drawer',
            title,
            html: this.form(),
            escape: true,
            buttons: {
                cancel: { label: 'Cancel' }
            }
        })
        this.drawer.show()

        // Add custom click handlers
        const colours = this.drawer.panel?.querySelectorAll('span.colour')

        if (!colours) {
            console.error('Could not find any colour spans')
            return
        }

        colours.forEach(c => c.addEventListener('click', event => {

            // Find out which colour span was clicked and set the appropriate colour value
            let colour: string = 'black'
            if (event.target) {
                let index = (<Element>event.target).getAttribute('data-index')
                if (index !== null) {
                    colour = Colours.PALETTE[parseInt(index)]
                }
            }

            // Synthesise a button using the colour value selected
            const synthButton = new Style(this.editor, 'COLOUR', -1)
            synthButton.setState = this.setState
            synthButton.element = this.element
            synthButton.style = `${this.style}:${colour}`

            // const synthButton = {
            //     setState: this.setState,
            //     style: `${this.style}:${colour}`,
            //     element: this.element
            // }

            this.drawer?.hide()

            // Apply the new style
            synthButton.click()
        }))
    }


    /**
     * Construct the colour dialogue
     * @returns 
     */
    private form() {
        let colours = ''
        for (let i = 0; i < Colours.PALETTE.length; i++) {
            colours += `<span class="colour" data-index="${i}" style="background-color:${Colours.PALETTE[i]}">&nbsp;</span>`
        }
        return `
        <form id="colour-menu">
            <div class="colours">
                ${colours}
            </div>
        </form>`
    }

}