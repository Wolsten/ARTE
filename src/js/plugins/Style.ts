import ToolbarButton from '../ToolbarButton'
import * as Helpers from '../helpers'
import * as Icons from '../icons'
import * as Phase from '../phase'
import EditRange from '../EditRange'
import Editor from '../Editor.js'


interface TextParts {
    preText: string
    text: string
    postText: string
}


export default class Style extends ToolbarButton {

    style = ''

    // Private properties
    private newStyle = ''
    private newValue = ''
    private action = ''


    constructor(editor: Editor, style: string, group: number) {

        style = style.toUpperCase()

        switch (style) {
            case 'B':
                super(editor, 'style', 'B', 'Bold', Icons.b, group)
                this.style = 'font-weight:bold'
                break
            case 'I':
                super(editor, 'style', 'I', 'Italic', Icons.i, group)
                this.style = 'font-style:italic'
                break
            case 'U':
                super(editor, 'style', 'U', 'Underline', Icons.u, group)
                this.style = 'text-decoration:underline'
                break
            case 'CLEAR':
                super(editor, 'style', 'CLEAR', 'Clear', Icons.clear, group)
                this.style = 'CLEAR'
                break
            case 'COLOUR':
                super(editor, 'style', '', '', '', group)
                this.style = 'COLOUR'
                break
            default:
                super(editor, 'style', 'CLEAR', 'Clear', Icons.clear, group)
                this.style = 'CLEAR'
                console.error(`Unrecognised style name [${style}]`)
        }
    }


    click(): void {
        if (!this.editor.range) return
        if (!this.editor.range.rootNode) return
        // Adjust rootNode if required
        if (Helpers.isBlock(this.editor.range.rootNode) == false) {
            const newRootNode = Helpers.getParentBlockNode(this.editor.range.rootNode)
            if (newRootNode) {
                this.editor.range.rootNode = newRootNode
            }
        }
        // Set newStyle, newValue and action
        this.setStyleProps()
        // Initialise phase detection and parse the root node
        Phase.init(this.editor.range, false)
        const html = this.parseNode(this.editor.range.rootNode, [], this.editor.range)
        // console.log('html',html)
        Helpers.replaceNode(this.editor.range.rootNode, (<Element>this.editor.range.rootNode).tagName, html)
        // Reset the selection
        Helpers.resetSelection(this.editor.editorNode)
        this.editor.updateRange()
        this.setState()
        this.editor.updateBuffer()
        this.editor.updateEventHandlers()
    }


    /**
     * Set the disabled and active states of a button
     */
    setState(): void {
        if (!this.element) {
            console.error('Missing button element for button', this.tag)
            return
        }

        // console.log('setting style state')
        if (this.tag == 'CLEAR') {
            this.element.classList.remove('active')
        }

        // The rootNode should not be the editor or list container - (implying 
        // multiple blocks selected) 
        this.enableOrDisable()

        // Check whether the computed style matches the btn
        this.setStyleProps()
        if (this.editor.range) {
            const inlineStyles = Helpers.getInlineStyles(this.editor.range.startContainer)
            if (inlineStyles.includes(this.style)) {
                this.element.classList.add('active')
            } else {
                this.element.classList.remove('active')
            }
        }
    }






    // -----------------------------------------------------------------------------
    // @section Private methods
    // -----------------------------------------------------------------------------


    private isActive(): boolean {
        if (this.element) {
            const dataActive = this.element.classList.contains('active')
            if (dataActive) return true
        }
        return false
    }




    /**
     * Split the style stype property into newStyle:newValue parts and set the action
     */
    private setStyleProps() {
        const styleParts = this.style.split(':')
        this.newStyle = styleParts[0]
        this.newValue = styleParts[1] !== undefined ? styleParts[1] : ''
        // Determine the action
        this.action = 'apply'
        if (this.isActive() && this.style != 'CLEAR') {
            this.action = 'remove'
        } else if (this.style == 'CLEAR') {
            this.action = 'clear'
        }
    }


    /**
     * Parse nodes recursively and generates updated html
     * Returns the new html generated
     */
    private parseNode(node: Node, styles: string[], range: EditRange) {
        // console.log('Parsing node',node)
        // Text node
        if (node.nodeType === 3) {
            return this.parseTextNode(node, styles, range)
        }
        // Custom node
        if (Helpers.isCustom(node)) {
            return (<Element>node).outerHTML
        }
        // Blocks and spans
        return this.parseBlockNode(node, styles, range)
    }


    /**
     * Parse a block node, saving inline styles as traverse down the tree
     * Cannot set the styles here as need to get to the text nodes to know when the 
     * start end end containers have been found. Returns parsed HTML
     */
    private parseBlockNode(node: Node, styles: string[], range: EditRange) {
        // Add inline style from a span?
        if (node.nodeName === 'SPAN') {
            const inlineStyles = (<Element>node).getAttribute('style')
            if (inlineStyles != null && inlineStyles != '') {
                let inlineStylesArray = inlineStyles.split(';')
                inlineStylesArray.forEach(item => {
                    if (item != '') {
                        const parts = item.split(':')
                        if (styles.includes(parts[0].trim()) == false) {
                            styles = [...styles, item]
                        }
                    }
                })
            }
        }
        // Parse child nodes
        let html = ''
        node.childNodes.forEach(child => {
            html += this.parseNode(child, styles, range)
        })
        // console.log('Returning block html', html)
        return html
    }



    /**
     * Parse a text node and return parsed content
     */
    private parseTextNode(node: Node, styles: string[], range: EditRange) {
        Phase.set(node)
        const textParts = this.getTextParts(node, range)
        if (!textParts) return ''
        const { preText, text, postText } = textParts
        let html = ''
        // In pre and post phases return text with current styling
        if (Phase.pre() || Phase.post()) {
            html += this.generateText(styles, text, true)
            // During phase 
        } else {
            // Has the style been applied already?
            const fullStyle = `${this.newStyle}:${this.newValue}`
            const idx = this.styleApplied(styles, fullStyle)

            let closedSpans = true

            // PRE TEXT
            if (preText) {

                if (styles.length == 0) {

                    html += preText

                    // Got at least one style to apply
                } else {

                    // Defaults to true for cases of 'remove' and 'clear'
                    closedSpans = true

                    if (this.action == 'apply') {

                        // Don't close if new style is in styles list or if there is post text 
                        // which needs the same styling as the pre text
                        if (idx > -1 || postText != '') {
                            closedSpans = false
                        }
                    }

                    html += this.generateText(styles, preText, closedSpans)
                }
            }

            // SELECTED TEXT
            if (text) {

                // Apply new style?
                if (this.action == 'apply') {

                    // If style already applied and the pretext spans are open 
                    // just add the text
                    if (idx > -1 && closedSpans == false) {
                        html += text
                    } else {
                        let newStyles = []
                        // Otherwise if the pre text spans are closed add the old and new styles
                        if (closedSpans) {
                            newStyles = [...styles, fullStyle]
                            // If pre text spans open then just add the new style
                        } else {
                            newStyles = [fullStyle]
                        }

                        html += this.generateText(newStyles, text, true)
                    }

                    // Remove existing style?
                } else if (this.action == 'remove' || this.action == 'clear') {

                    html += text
                }
            }

            // POST TEXT
            if (postText) {

                // No styles
                if (styles.length == 0) {

                    html += postText

                    // Got at least one style to apply/remove
                } else {

                    // Apply styles to the post text if the spans were closed for the pre text
                    if (closedSpans) {
                        html += this.generateText(styles, postText, true)
                        // Else close the spans from the pretext
                    } else {
                        html += postText
                        styles.forEach(() => html += '</span>')
                    }
                }
            }
        }
        // console.log('html', html)
        return html
    }



    /**
     * Split the node into component parts based on the current selection
     * Returnt he text parts or false if no content found
     */
    private getTextParts(node: Node, range: EditRange): TextParts | false {
        if (!node.textContent) return false
        let text = ''
        let preText = ''
        let postText = ''
        if (Phase.both()) {
            preText = node.textContent.substring(0, range.startOffset)
            text = Helpers.START_MARKER + node.textContent.substring(range.startOffset, range.endOffset) + Helpers.END_MARKER
            postText = node.textContent.substring(range.endOffset)
        } else if (Phase.first()) {
            preText = node.textContent.substring(0, range.startOffset)
            text = Helpers.START_MARKER + node.textContent.substring(range.startOffset)
        } else if (Phase.last()) {
            text = node.textContent.substring(0, range.endOffset) + Helpers.END_MARKER
            postText = node.textContent.substring(range.endOffset)
        } else {
            text = node.textContent
        }
        return { preText, text, postText }
    }



    /**
     * Check whether the newStyle appears in the styles array
     * Return index if match found, otherwise -1
     */
    private styleApplied(styles: string[], newStyle: string): number {
        let match = styles.findIndex(item => item === newStyle)
        return match
    }



    /**
     * Generate clean styles for a parsed set of styles
     */
    private generateText(styles: string[], txt: string, closeFlag: boolean): string {
        if (styles.length == 0) {
            return txt
        }
        // Filter out older versions of the same style, e.g. so that only a later applied
        // colour is added
        let items = []
        let values = []
        let newStyles = ''
        for (let i = 0; i < styles.length; i++) {
            const parts = styles[i].split(':')
            items.push(parts[0].trim())
            values.push(parts[1].trim())
        }
        // Blanks older matching items
        for (let i = 0; i < items.length; i++) {
            for (let j = 0; j < items.length; j++) {
                if (items[i] == items[j] && i > j) {
                    items[j] = ''
                }
            }
        }
        // Construct new style attribute value
        let newStyle = ''
        for (let i = 0; i < items.length; i++) {
            if (items[i] != '') {
                newStyle += `${items[i]}:${values[i]};`
            }
        }
        let html = `<span style="${newStyle}">${txt}`
        if (closeFlag) {
            html += '</span>'
        }
        return html
    }
}