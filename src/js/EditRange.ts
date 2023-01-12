import * as Helpers from './helpers'



export default class EditRange {

    editorNode: HTMLElement
    rootNode: Node | null = null
    blockParent: null | HTMLElement = null
    custom: HTMLElement | false = false     // The custom object selected or false

    // The actual Range instance if available
    selection: Selection | null = null
    base: Range | null = null

    // Convenience properties with appropriate casting to access base properties
    startContainer: null | HTMLElement = null
    endContainer: null | HTMLElement = null
    collapsed: boolean = false
    startOffset = 0
    endOffset = 0


    constructor(editorNode: HTMLElement) {
        this.editorNode = editorNode
        // console.log('new selection',selection)
        // Make sure have a selection
        const selection = window.getSelection()
        if (selection?.rangeCount == 1) {
            const base = selection.getRangeAt(0)
            // Check if common ancestor is the editor node or contained in the editor node
            // Ignore all other selections since they don't belong to the editor
            if (base.commonAncestorContainer == editorNode ||
                Helpers.contains(editorNode, base.commonAncestorContainer)) {
                // console.log('New range found')
                this.selection = selection
                this.base = base
                this.augment()
            }
        }
    }


    augment() {
        if (!this.base) return
        // console.log('augmentRange', this)
        // First parent node that is a block tag
        const blockParent = Helpers.getParentBlockNode(this.base.commonAncestorContainer)
        this.blockParent = blockParent ? <HTMLElement>blockParent : null

        // First parent node
        this.rootNode = this.base.commonAncestorContainer
        if (this.base.commonAncestorContainer.nodeType === Node.TEXT_NODE) {
            this.rootNode = this.base.commonAncestorContainer.parentNode
        }

        this.startContainer = <HTMLElement>this.base.startContainer
        this.endContainer = <HTMLElement>this.base.endContainer
        this.collapsed = this.base.collapsed
        this.startOffset = this.base.startOffset
        this.endOffset = this.base.endOffset

        // Set flag to indicate whether the range is in a custom node
        this.custom = this.startsInCustom()
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


    startsInCustom(): HTMLElement | false {
        if (!this.base) return false
        let node = this.base.startContainer
        while (Helpers.isCustom(node) === false &&
            node.parentNode !== null &&
            node.parentNode.nodeName !== 'DIV') {
            node = node.parentNode
        }
        return Helpers.isCustom(node) ? <HTMLElement>node : false
    }


    containsCustoms() {
        if (!this.selection) return false
        const customs = this.editorNode.querySelectorAll('[contenteditable="false"]')
        let found = false
        for (let i = 0; i < customs.length && found == false; i++) {
            if (this.selection.containsNode(customs[i], true)) {
                found = true
            }
        }
        //console.warn({found})
        return found
    }


    topParentNode(type: string): HTMLElement | false {
        if (!this.rootNode ||
            !this.startContainer ||
            !this.endContainer ||
            !this.editorNode) {
            console.warn('Range is missing attributes (root|start|end containers or editor node)')
            return false
        }
        let node: HTMLElement
        switch (type) {
            case 'root': node = <HTMLElement>this.rootNode; break
            case 'start': node = this.startContainer; break
            default: node = this.endContainer
        }
        let saved = node
        while (node != this.editorNode) {
            saved = node
            if (node.parentNode == null) {
                console.warn('Error.  Found missing parent node when getting top parent node')
                return false
            }
            node = <HTMLElement>node.parentNode
        }
        if (node && saved) return saved
        return false
    }


    setCursor(node: HTMLElement, offset: number): EditRange {
        // let range = document.createRange()
        // const selection = window.getSelection()
        // // Check the offset is in range
        // if (node.textContent && offset > node.textContent.length) {
        //     offset = 0
        // }
        // range.setStart(node, offset)
        // range.collapse(true)
        // if (selection) {
        //     selection.removeAllRanges()
        //     selection.addRange(range)
        // }
        EditRange.setCursorInNode(node, offset)
        return new EditRange(this.editorNode)
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


    getSelectedText(): string {
        if (this.base?.commonAncestorContainer.nodeType === Node.TEXT_NODE) {
            const node = this.base?.commonAncestorContainer
            const text = node.textContent?.substring(this.startOffset, this.endOffset)
            return text ? text : ''
        }
        return ''
    }


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
                EditRange.setCursorInNode(<HTMLElement>node.previousSibling, <HTMLElement>node.previousSibling.textContent.length)
            }
        } else {
            EditRange.setCursorInNode(node, node.textContent?.length || 0)
        }
    }



}

