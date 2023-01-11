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
        console.log('augmentRange', this)
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

}

