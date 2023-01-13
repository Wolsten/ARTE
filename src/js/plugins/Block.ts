import Editor from '../Editor'
import * as Helpers from '../helpers'
import Phase from '../phase'
import * as Icons from '../icons'
import ToolbarButton, { ToolbarButtonType } from '../ToolbarButton'
import SidebarButton from '../SidebarButton'


class Formats {

    oldFormats: string[]
    newFormats: string[]

    constructor() {
        this.oldFormats = []
        this.newFormats = []
    }
}


export default class Block extends ToolbarButton {

    // Private properties
    private previousFormats: string[] = []
    private fragmentNode = document.createElement('DIV')
    private lastNodeAdded: null | Element = null
    private newFormat = ''

    private phase!: Phase

    // constructor(editor: Editor, block: string, group: number) {
    constructor(editor: Editor, tag: string, group: number) {

        tag = tag.toUpperCase()

        switch (tag) {
            case 'H1':
                super(editor, ToolbarButtonType.BLOCK, tag, 'Heading 1', Icons.h1, group)
                break
            case 'H2':
                super(editor, ToolbarButtonType.BLOCK, tag, 'Heading 2', Icons.h2, group)
                break
            case 'H3':
                super(editor, ToolbarButtonType.BLOCK, tag, 'Heading 3', Icons.h3, group)
                break
            case 'BLOCKQUOTE':
                super(editor, ToolbarButtonType.BLOCK, tag, 'Blockquote', Icons.bq, group)
                break
            case 'OL':
                super(editor, ToolbarButtonType.LIST, tag, 'Ordered list', Icons.ol, group)
                break
            case 'UL':
                super(editor, ToolbarButtonType.LIST, tag, 'Unordered list', Icons.ul, group)
                break
            case 'P':
                super(editor, ToolbarButtonType.BLOCK, tag, 'Paragraph', Icons.p, group)
                break;
            default:
                super(editor, ToolbarButtonType.BLOCK, 'P', 'Paragraph', Icons.p, group)
                console.error(`Unrecognised block name [${tag}] - set to paragraph`)
        }
    }



    click(): void {

        // console.log('Clicked', this.tag)

        this.previousFormats = []
        this.lastNodeAdded = null
        this.newFormat = this.setStyleProps()

        // Ensure start from a block node
        if (this.editor.range === null) return

        const newRootNode = this.editor.range.topParentNode('root')
        const firstParentNode = this.editor.range.topParentNode('start')
        const endParentNode = this.editor.range.topParentNode('end')

        // const newRootNode = Helpers.getTopParentNode(this.editor.range.rootNode, this.editor.editorNode)
        // const firstParentNode = Helpers.getTopParentNode(this.editor.range.startContainer, this.editor.editorNode)
        // const endParentNode = Helpers.getTopParentNode(this.editor.range.endContainer, this.editor.editorNode)
        if (!newRootNode || !firstParentNode || !endParentNode) {
            return
        }
        this.editor.range.rootNode = newRootNode

        // console.warn('new root node', newRootNode)
        // console.log('first parent node', firstParentNode)
        // console.log('end parent node', endParentNode)
        //
        // Mark the start and end selection points
        Helpers.addMarkers(this.editor.range)

        // Init phase for block formatting
        this.phase = new Phase(this.editor.range, true)

        // console.warn(`reFormatBlock with new format ${button.tag}`)
        // Just parse the parent node if the start and end belong to the same parent
        if (firstParentNode == endParentNode) {
            this.fragmentNode = document.createElement('DIV')
            this.parseNode(firstParentNode, { oldFormats: [], newFormats: [] })
            // console.log( 'fragment', this.fragmentNode.innerHTML)
            if (firstParentNode == this.editor.editorNode) {
                firstParentNode.innerHTML = this.fragmentNode.innerHTML
            } else {
                firstParentNode.outerHTML = this.fragmentNode.innerHTML
            }
        } else {
            let startNodeFound = false
            let endNodeFound = false
            this.fragmentNode = document.createElement('DIV')
            this.editor.range.rootNode!.childNodes.forEach(node => {
                // If find a none-block node then terminate this cycle of the loop
                // ie. ignore text and comments
                if (node.nodeType !== 1) {
                    return
                }
                if (node == firstParentNode) {
                    startNodeFound = true
                }
                // Start processing once start node found
                if (startNodeFound && endNodeFound == false) {
                    // console.log( `%c parse top level node ${node.tagName}`,'background:orange;color:white;padding:0.5rem')
                    // Check for block (as opposed to list formatting) and start a new fragment
                    if (this.type === ToolbarButtonType.BLOCK) {
                        this.previousFormats = []
                        this.lastNodeAdded = null
                        this.fragmentNode = document.createElement('DIV')
                    }
                    this.parseNode(<HTMLElement>node, { oldFormats: [], newFormats: [] })
                    if (this.type === ToolbarButtonType.BLOCK) {
                        // console.log( 'fragment', this.fragmentNode.innerHTML)
                        (<Element>node).outerHTML = this.fragmentNode.innerHTML
                    } else {
                        this.markNodeForRemoval(node)
                    }
                }
                // Stop processing when end node found. If formatting a list write out the 
                // fragment
                if (node == endParentNode) {
                    endNodeFound = true
                    if (this.type === ToolbarButtonType.LIST) {
                        //console.log( 'fragment', this.fragmentNode.innerHTML)
                        (<Element>node).outerHTML = this.fragmentNode.innerHTML
                    }
                    this.removeNodesMarkedForRemoval()
                }
            })
        }

        // Reset the selection
        Helpers.resetSelection(this.editor.editorNode)
        this.editor.updateRange()

        // Reset states for all block buttons
        this.editor.toolbar.setStateForButtonType(ToolbarButtonType.BLOCK)

        // Update the buffer
        this.editor.updateBuffer()

        // Update event handles because content changed
        this.editor.updateEventHandlers()
    }


    /**
     * Set the disabled and active states of a button
     */
    setState(): void {
        // if (this.tag == 'H1') {
        //     console.log('setting block state for', this.tag)
        // }
        if (this.tag == 'CLEAR') {
            this.element.disabled = false
            this.element.classList.remove('active')
        } else {
            // Use the first parent node to set disabled state
            let firstParentNode: HTMLElement | false = false
            if (this.editor.range) {
                // firstParentNode = Helpers.getParentBlockNode(this.editor.range.startContainer)
                firstParentNode = this.editor.range.topParentNode('start')
            }
            if (!firstParentNode) {
                return
            }
            // if (this.tag == 'H1') {
            //     console.log('firstParentNode', firstParentNode)
            // }
            // The firstParentNode should not be a DIV (the editor) or a custom element
            this.element.disabled = firstParentNode.nodeName === 'DIV' ||
                Helpers.isCustom(firstParentNode) ||
                firstParentNode.nodeName == this.tag
            //console.log('disabled',btn.element.disabled)
            // If this is a list type get the list parent
            if (this.type === ToolbarButtonType.LIST && firstParentNode.tagName === 'LI') {
                firstParentNode = <HTMLElement>firstParentNode.parentNode
            }
            // Do the tag names match?
            if (firstParentNode.nodeName === this.tag) {
                this.element.classList.add('active')
            } else {
                this.element.classList.remove('active')
            }
        }
    }


    /**
     * Display custom html in the sidebar
     */
    sidebar(): SidebarButton | false {
        if (this.tag !== 'H1') return false
        const headings = this.editor?.editorNode?.querySelectorAll('H1,H2,H3')
        //console.log('Headings',headings)
        let content = ''
        if (headings) {
            headings.forEach(heading => {
                const level = heading.tagName
                heading.id = Helpers.generateUid()
                content += `<${level}><a href="#${heading.id}" title="Click to view heading in context">${heading.innerHTML}</a></${level}>`
            })
        }
        return new SidebarButton(Icons.outline, 'headings', content)
    }


    /**
     * Reformat/clean the element as it should be saved in a file or database
     */
    clean(element: HTMLElement): HTMLElement {
        if (element.id) {
            element.removeAttribute('id')
        }
        return element
    }



    // -----------------------------------------------------------------------------
    // @section Private methods
    // -----------------------------------------------------------------------------

    private markNodeForRemoval(node: Node): void {
        (<HTMLElement>node).setAttribute('data-remove', 'true')
    }

    private removeNodesMarkedForRemoval(): void {
        if (this.editor.editorNode) {
            const nodes = this.editor.editorNode.querySelectorAll('[data-remove=true]')
            if (nodes) {
                nodes.forEach(node => node.remove())
            }
        }
    }

    /**
     * Recursively parse a node
     */
    private parseNode(node: HTMLElement, formats: Formats) {
        // console.log( `%c parseNode ${node.tagName}`,'background:green;color:white;padding:0.5rem')
        // console.log( `Inner HTML [${node.innerHTML.trim()}]`)
        // console.log( `node formats on entry`,formats.oldFormats)
        // Define the formats for this node only
        let nodeFormats = new Formats()
        if (node != this.editor.editorNode) {
            this.phase.set(node)
            // Get the old and new formats
            nodeFormats = this.getFormats(node, formats)
            // console.log( `old node formats`,nodeFormats.oldFormats)
            // console.log( `new node formats`,nodeFormats.newFormats)
            // Save content of text nodes and protected nodes against the current targetNode
            this.saveContent(node, nodeFormats)
        }
        // Loop through all child blocks 
        node.childNodes.forEach(child => {
            if (Helpers.isBlock(child) || Helpers.isList(<HTMLElement>child)) {
                // console.log(`Moving to child ${child.tagName}`)
                this.parseNode(<HTMLElement>child, nodeFormats)
            }
        })
        // console.log(`Finished this branch - processed children`, node.childNodes)
    }



    /**
     * Get the old and new formats for the node, depending on the phase
     * and return updated formats
     */
    private getFormats(element: Element, formats: Formats): Formats {
        // Always set old formats to the original
        const oldFormats = [...formats.oldFormats, element.tagName]
        let newFormats: string[] = []

        // Pre and post phases set the new format to be the 
        // same as the old format
        if (this.phase.pre() || this.phase.post()) {
            // console.log(`1. Pushing ${node.tagName} to formats`)
            newFormats = [...oldFormats]
            return { newFormats, oldFormats }
        }
        // During phase
        //
        // New block formatting (not list) - apply new format
        if (this.type === ToolbarButtonType.BLOCK) {
            // console.log(`Format type = ${this.type}`)
            // console.log(`2. new block format ${this.newFormat}`)
            newFormats = [this.newFormat]
            return { newFormats, oldFormats }
        }
        //
        // New list formatting
        if (this.phase.first()) {
            // console.log(`3. First node with new list format ${this.newFormat}`)
            // Reformatting a list item?
            if (element.tagName == 'LI') {
                // console.log('3.1 Processing LI')
                const parentListContainer = element.parentNode
                // First in list - in which case modify list type
                if (parentListContainer !== null && parentListContainer.firstElementChild == element) {
                    // console.log( '3.1.1 First item in a list - replace existing list')
                    // Pop off the old list format and replace with the new one plus the LI
                    newFormats.pop()
                    newFormats.push(this.newFormat)
                    newFormats.push('LI')
                    // console.log('3.1.2 new list formats', formats.newFormats.join(' '))
                    // Else create a new indented list
                } else {
                    // console.log( '3.1.3 Subsequent item in a list - indent a new list')
                    // Start with the old formats
                    newFormats = formats.oldFormats.slice()
                    // Add the new list format and an LI
                    newFormats.push(this.newFormat)
                    newFormats.push('LI')
                    // console.log('3.1.4 new list formats', formats.newFormats.join(' '))
                }
                // This is a different block node (e.g. H1, P) or a list container node - therefore start a new list
            } else {
                // console.log( 'Converting a block node')
                newFormats.push(this.newFormat)
                newFormats.push('LI')
                // console.log('3.2 new list formats', formats.newFormats.join(' '))
            }
            return { newFormats, oldFormats }
        }
        // During but not first node phase - reuse previously defined list formats
        // Slice produces a shallow copy (in this case of all elements)
        newFormats = this.previousFormats.slice()
        // console.log(`4. Reusing initial list formatting ${formats.newFormats.join(' ')}`)
        return { newFormats, oldFormats }
    }


    /**
     * Save the content of text nodes and protected nodes against the current target node
     * which defaults to be the this.fragmentNode
     */
    private saveContent(element: HTMLElement, formats: Formats): void {
        let n
        let target = this.fragmentNode
        let html = this.getBlockHTML(element)
        let currentFormats = []
        if (this.phase.during()) {
            currentFormats = formats.newFormats
        } else {
            currentFormats = formats.oldFormats
        }
        let lastFormat = currentFormats.slice(-1)[0]
        // console.log('html',html)
        // Skip unsupported node types and "blocks" where the html returned is empty but the node 
        // contains one or more tags
        const allowed = element.nodeType === 1
        if (!allowed || (html == '' && element.innerHTML.includes('<'))) {
            // console.log('saveContent: Found a block node - return', node)
            return
        }
        // First time - apply all formats
        if (this.previousFormats.length == 0) {
            // console.log('0. Original target',target.outerHTML)
            currentFormats.forEach(format => {
                n = document.createElement(format)
                target = target.appendChild(n)
                // console.log('saveContent: 1. First content - moving target to',target.outerHTML)
            })
            // New tree larger and the previous formats are a subset?
            // Compare formatting and add to appropriate end of tree
        } else if (currentFormats.length > this.previousFormats.length) {
            // console.log('saveContent: 2. Current formats longer than previous formats')
            if (Helpers.arraySubset(this.previousFormats, currentFormats)) {
                // console.log('saveContent: 2.1 Current formats are a superset of previous formats')
                for (let i = 0; i < this.previousFormats.length; i++) {
                    if (target.lastElementChild) {
                        target = <HTMLElement>target.lastElementChild
                    }
                    // console.log('saveContent: 2.2 New formats superset - moving target to',target.outerHTML)
                }
                for (let i = this.previousFormats.length; i < currentFormats.length; i++) {
                    n = document.createElement(currentFormats[i])
                    target = target.appendChild(n)
                    // console.log('saveContent: 2.3 New formats superset - moving target to',target.outerHTML)
                }
            }
            // Formatting is the same as previously
        } else if (Helpers.arraysEqual(currentFormats, this.previousFormats)) {
            if (this.lastNodeAdded && this.lastNodeAdded != this.fragmentNode) {
                target = <HTMLElement>this.lastNodeAdded.parentElement
            }
            n = document.createElement(lastFormat)
            target = target.appendChild(n)
            // console.log('saveContent: 3. Formats equal - moving target to',target.outerHTML)
        }
        // New formatting smaller or different - find where in tree to append
        if (target == this.fragmentNode) {
            // console.log('saveContent: 4. New formatting smaller or different')
            let startIndex = 0
            currentFormats.forEach((format, index) => {
                if (format == this.previousFormats[index]) {
                    // Exclude the last format if it is an LI as we need 
                    // to add the LI to the previous list parent
                    if ((index == (currentFormats.length - 1) && format == 'LI') == false) {
                        target = <HTMLElement>target.lastElementChild
                        // console.log('4.1 Move target node to', target.outerHTML)
                        startIndex++
                    }
                }
            })
            for (let i = startIndex; i < currentFormats.length; i++) {
                n = document.createElement(currentFormats[i])
                target = target.appendChild(n)
                // console.log('saveContent: 4.2 Starting new formats - moving target to',target.outerHTML)
            }
        }
        this.lastNodeAdded = target
        this.previousFormats = currentFormats.slice()
        // Add the content
        if (html != '') {
            target.innerHTML = html
            // console.log('saveContent: target with new content', target.outerHTML)
            // console.log('saveContent: this.fragmentNode',this.fragmentNode.innerHTML)
        }
    }


    /**
      * Get the new format to apply
      */
    private setStyleProps(): string {
        if (this.tag == 'CLEAR' || this.isActive()) {
            // Set to paragraph (default style) if removing
            if (this.type == ToolbarButtonType.BLOCK) {
                return 'P'
            }
        }
        return this.tag
    }


    /**
     * Returns the html content of a node including its child nodes
     */
    private getBlockHTML(element: HTMLElement): string {
        let html = ''
        // Extract all text, inline formats and protected node content from the node
        element.childNodes.forEach((child: ChildNode) => {
            const childElement = <HTMLElement>child
            // Plain text node
            if (childElement.nodeType === 3) {
                let text = childElement.textContent ? childElement.textContent : ''
                // Trim text nodes with CR's
                if (text.includes('\n')) {
                    text = text.trim()
                }
                html += text
                // Inline, custom node or line break
            } else if (Helpers.isStyle(childElement) || Helpers.isCustom(childElement) || childElement.tagName === 'BR') {
                html += childElement.outerHTML
            }
        })
        return html
    }


}

