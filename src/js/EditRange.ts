import * as Helpers from './helpers'



export default class EditRange {

    // The actual Range instance if available
    selection: Selection | null = null

    // First range in the selection
    base!: Range

    editorNode!: HTMLElement
    firstElementNode!: HTMLElement
    firstSupportedBlockParent!: HTMLElement

    blockCustoms: HTMLElement[] = []
    selectionCustoms: HTMLElement[] = []

    // Convenience properties with appropriate casting to access base properties
    startContainer!: HTMLElement
    endContainer!: HTMLElement
    collapsed: boolean = false
    startOffset = 0
    endOffset = 0

    // Set for single text node selections
    textNodeLength = 0
    selectedText = ''


    static get(editorNode: HTMLElement) {
        const range = new EditRange(editorNode)
        if (range.base) return range
        return null
    }


    constructor(editorNode: HTMLElement) {
        const selection = window.getSelection()
        if (selection?.rangeCount == 1) {

            const base = selection.getRangeAt(0)

            // n.b. A node "contains" itself
            if (editorNode.contains(base.commonAncestorContainer)) {
                this.editorNode = editorNode
                this.selection = selection
                this.augment(base)
            }
        }
    }



    augment(base: Range) {

        // First parent node that is a "supported" block tag
        this.firstSupportedBlockParent = <HTMLElement>Helpers.getParentBlockNode(base.commonAncestorContainer)

        this.firstElementNode = base.commonAncestorContainer.nodeType === Node.TEXT_NODE
            ? <HTMLElement>base.commonAncestorContainer.parentNode
            : <HTMLElement>base.commonAncestorContainer

        // console.log('block parent\n', this.firstSupportedBlockParent.outerHTML)
        // console.log('root node\n', this.firstElementNode.outerHTML)

        this.startContainer = <HTMLElement>base.startContainer
        this.endContainer = <HTMLElement>base.endContainer
        this.collapsed = base.collapsed
        this.startOffset = base.startOffset
        this.endOffset = base.endOffset

        // Selected text?
        if (base.commonAncestorContainer.nodeType === Node.TEXT_NODE) {
            const text = this.startContainer.textContent?.trim() || ''
            this.textNodeLength = text.length
            this.selectedText = text.substring(this.startOffset, this.endOffset)
        }

        this.base = base

        this.blockCustoms = this.getBlockCustoms()
        this.selectionCustoms = this.getSelectionCustoms()
        // console.log('block customs', this.blockCustoms)
        // console.log('selection customs', this.selectionCustoms)
    }


    restoreSelection() {
        const selection = window.getSelection()
        if (selection) {
            selection.removeAllRanges()
            if (this.base) {
                selection.addRange(this.base)
            }
        }
    }


    // -----------------------------------------------------------------------------
    // @section Selection customs are those custom elements contained in the
    // selection in any of the selection containers. There may be more than one.
    // -----------------------------------------------------------------------------

    public getSelectionCustoms(): HTMLElement[] {
        const customs: HTMLElement[] = []
        console.warn('selected range')
        let node = this.startContainer
        while (node && node !== this.endContainer) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const matched = node.querySelectorAll('[contentEditable="false"]')
                matched.forEach(match => customs.push(<HTMLElement>match))
            }
            node = <HTMLElement>node.nextElementSibling
        }
        console.warn('found selection customs', customs)
        return customs
    }

    public hasSelectionCustom(): boolean {
        return this.selectionCustoms.length > 0
    }

    public getSelectionCustom(): HTMLElement | false {
        if (this.selectionCustoms.length > 0) {
            return this.selectionCustoms[0]
        }
        return false
    }


    // -----------------------------------------------------------------------------
    // @section Block customs are those custom elements associated with a block
    // and added inside at the end of a block. There may be more than one.
    // -----------------------------------------------------------------------------


    private getBlockCustoms(): HTMLElement[] {
        const customs: HTMLElement[] = []
        const elements = this.firstElementNode.querySelectorAll('[contentEditable="false"]')
        elements.forEach(element => customs.push(<HTMLElement>element))
        return customs
    }

    public hasBlockCustom(): boolean {
        return this.blockCustoms.length > 0
    }

    public getBlockCustom(): HTMLElement | false {
        if (this.blockCustoms.length > 0) {
            return this.blockCustoms[0]
        }
        return false
    }



    public getCustomWithTag(tag: string): HTMLElement | false {
        tag = tag.toUpperCase()
        console.log('Looking for ', tag)
        const custom = this.selectionCustoms.find(custom => {
            console.log('checking ', custom.nodeName.toUpperCase())
            return custom.nodeName.toUpperCase() === tag
        })
        console.log('Found', custom)
        if (custom) return custom
        return false
    }




    topParentNode(type: string): HTMLElement | false {
        let node: HTMLElement
        switch (type) {
            case 'root': node = <HTMLElement>this.firstElementNode; break
            case 'start': node = this.startContainer; break
            default: node = this.endContainer
        }
        let saved = node
        while (node != this.editorNode) {
            saved = node
            if (node.parentNode == null) {
                console.error('Error.  Found missing parent node when getting top parent node')
                return false
            }
            node = <HTMLElement>node.parentNode
        }
        if (node && saved) return saved
        return false
    }


    static setCursor(editorNode: HTMLElement, node: HTMLElement, offset: number): EditRange {
        EditRange.setCursorInNode(node, offset)
        return new EditRange(editorNode)
    }


    static setCursorInNode(node: HTMLElement | Text, offset: number) {
        let range = document.createRange()
        // Check the offset is in range
        if (node.textContent && offset > node.textContent.length) {
            offset = 0
        }
        range.setStart(node, offset)
        range.collapse(true)
        const selection = window.getSelection()
        if (selection) {
            selection.removeAllRanges()
            selection.addRange(range)
        }
    }


    // getSelectedText(): string {
    //     if (this.base?.commonAncestorContainer.nodeType === Node.TEXT_NODE) {
    //         const node = this.base?.commonAncestorContainer
    //         const text = node.textContent?.substring(this.startOffset, this.endOffset)
    //         return text ? text : ''
    //     }
    //     return ''
    // }


    replaceSelectionWithNode(node: HTMLElement | Text) {
        if (!this.base) {
            console.error('No selection is available to replace with element')
            return
        }
        const parent = this.startContainer?.parentNode
        if (!parent) {
            console.error('Missing parent node')
            return
        }
        // Get any pretext or post text in the current container that is not selected
        const textContent = this.startContainer?.textContent
        let preText = textContent
            ? textContent.substring(0, this.startOffset)
            : ''
        let postText
        if (this.collapsed) {
            postText = textContent
                ? textContent.substring(this.startOffset)
                : ''
            // Insert leading and trailing spaces if needed
            if (preText.charAt(preText.length + 1) != ' ') {
                preText = preText + ' '
            }
            if (postText.charAt(0) != ' ') {
                postText = ' ' + postText
            }
        } else {
            postText = textContent
                ? textContent.substring(this.endOffset)
                : ''
        }
        // Insert pretext before the current container
        if (preText) {
            parent.insertBefore(document.createTextNode(preText), this.startContainer)
        }
        // Insert the node before the current container
        node = parent.insertBefore(node, this.startContainer)
        console.warn(node)
        // Insert post text before the current container
        if (postText) {
            parent.insertBefore(document.createTextNode(postText), this.startContainer)
        }
        // Remove the pre-existing container
        this.startContainer?.remove()
        // After delay set the cursor
        setTimeout(() => {
            this.resetCursor(node)
        }, 10)
        // return the new node
        return node
    }


    resetCursor(node: HTMLElement | Text) {
        if (node.nodeType == Node.ELEMENT_NODE && Helpers.isCustom(<HTMLElement>node)) {
            if (node.nextSibling !== null) {
                EditRange.setCursorInNode(<HTMLElement>node.nextSibling, 0)
            } else if (node.previousSibling !== null) {
                const length = node.previousSibling.textContent?.length || 0
                EditRange.setCursorInNode(<HTMLElement>node.previousSibling, length)
            }
        } else {
            EditRange.setCursorInNode(node, node.textContent?.length || 0)
        }
    }



}

