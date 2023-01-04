/** 
 * Insert/edit image tags
 * 
 * File format:
 * <arte-image id="id" data-src="src" data-alt="alt" data-caption="caption"></arte-image>
 * 
 * Editor format:
 * <arte-image id="id" data-src="src" data-alt="alt" data-caption="caption" 
 *             contenteditable="false" title="Click to edit">
 *      <img src="src" alt="alt"/>
 *      [<span class="caption">caption</span>]
 * </arte-image>
 * 
 * Sidebar format:
 * <article>
 *      <img id="id" src="url" alt="alt" title="Click to find in document"/>
 * </article>
 */


import * as Icons from '../icons'
import * as Helpers from '../helpers'
import Modal from '../Modal'
import SidebarButton from '../SidebarButton'
import Editor from '../Editor'
import { EditButtons } from './interfaces'
import CustomBlock from './CustomBlock'




class Images extends CustomBlock {

    static readonly TAG = 'ARTE-IMAGE'        // The HTMLElement tag as inserted in the dom for this custom node

    editFlag: boolean = true


    constructor(editor: Editor, tag: string, label: string, icon: string, group: number) {
        super(editor, 'custom', tag, label, icon, group)
    }


    // -----------------------------------------------------------------------------
    // @section Image specific methods
    // -----------------------------------------------------------------------------

    /**
     * Show the image edit dialogue
     */
    show(editFlag: boolean): void {
        this.editFlag = editFlag
        let buttons = {
            cancel: { label: 'Cancel', callback: this.handleCancel },
            confirm: { label: 'Save', callback: this.save }
        }
        let title = 'Insert image'
        if (editFlag) {
            title = 'Edit image'
            buttons.delete = { label: 'Delete', callback: handleDelete }
        } else {
            // Initialise an image as saved to file
            this.node = document.createElement(this.tag)
            if (!this.node) {
                console.error(`Failed to create new ${this.label}`)
                return
            }
            this.node.id = Helpers.generateUid()
            this.setAttribute('contenteditable', 'false')
            this.setAttribute('src', '')
            this.setAttribute('alt', '')
            this.setAttribute('caption', '')
        }
        // Create and display the modal panel
        this.drawer = new Modal({
            type: 'drawer',
            title,
            html: this.form(),
            buttons,
            escape: true
        })
        this.drawer.show()
        // Focus the src
        const src = this.drawer.selectOne('form #src')
        if (!src) {
            console.error('Failed to find src field when creating image')
            return
        }
        const srcInput = <HTMLInputElement>src
        srcInput.focus()
        srcInput.setSelectionRange(srcInput.value.length, srcInput.value.length)
    }



    /**
     * Generate html for a dialogue to create/edit an image tag
     */
    form(): string {
        const src = this.getAttribute('src')
        const caption = this.getAttribute('caption')
        const alt = this.getAttribute('alt')
        return `
            <form class="${this.tag}">
                <p class="advice">Please enter a URL and optional caption for an image file:
                <div class="form-input">
                    <label for="src">URL</label>
                    <input id="src" type="text" class="form-control" placeholder="Source URL" required value="${src}">
                </div>
                <div class="form-input">
                    <label for="caption">Caption</label>
                    <input id="caption" type="text" class="form-control" placeholder="Caption for image" value="${caption}">
                </div>
                <div class="form-input">
                    <label for="alt">Alt text</label>
                    <input id="alt" type="text" class="form-control" placeholder="Alt text for image" value="${alt}">
                </div>
            </form>`
    }


    /**
     * Save the changes set in the dialogue
     */
    save(): void {
        if (!this.drawer) {
            console.error('No drawer is displayed')
            return
        }
        // console.log('Save changes')
        this.setAttribute('src', this.drawer.getInputValue('#src'))
        this.setAttribute('caption', this.drawer.getInputValue('#caption'))
        this.setAttribute('alt', this.drawer.getInputValue('#src'))
        // Check whether to insert new arte image
        if (!this.editFlag) {
            this.insert()
        }
        this.drawer.hide()
        // Format image and add event handler
        this.format(this.template)
        // Update state
        if (this.node) {
            this.editor.range = Helpers.setCursor(this.node, 0)
            this.setState()
            this.editor?.buffer?.update()
        }
    }

    /**
     * Display custom html in the sidebar
     */
    sidebar?(): SidebarButton {
        // console.log('Updating image sidebar')
        const elements = this.editor?.editorNode?.querySelectorAll(this.tag)
        let content = ''
        if (elements) {
            elements.forEach(element => {
                const src = element.getAttribute('src')
                if (!src) {
                    console.error('Image is missing its src attribute')
                    return
                }
                const alt = element.getAttribute('alt')
                if (!alt) {
                    console.error('Image is missing its alt attribute')
                    return
                }
                content += `
                    <a href="#${element.id}">
                        <img src="${src}" alt="${alt}" title="Click to view image in document"/>
                    </a>`
            })
        }
        return new SidebarButton(this.icon, 'images', `${content}`)
        }
            
        
            
            
                ndatory button click function */
            k(): string | undefined {
            // Ignore if a modal is active
            if (this.drawer && this.drawer.active()) {
                return
        }
                t custom = this.editor?.range?.blockParent?.querySelector(this.tag)
            if (custom) {
            this.edit(custom)

            this.show(false)
        }
            
                    
            
                        
                    isabled and active states of a button
            * /
        setState() {
                this.setCustomBlockState()
                
             
            
                
            dd event handlers to all custom node edit buttons in a custom block
                
                    Handlers(): void {
                    t buttons = this.editor.editorNode?.querySelectorAll(this.tag + ' button')
                    ns) {
                        forEach(button => button.addEventListener('click', event => {
                    event.preventDefault()
                        t.stopPropagation()
                    if (!button.parentNode) {
                    console.error(`Could not find ${this.label} node`)
                } else {
                    this.edit(<Element>button.parentNode)
                }
                            
                                
                            
                                    
                                
                                
                    method to reformat / clean the custom element as it should be saved in a file or database
                        * returns HTMLElement as cleaned.Usually this will mean simply removing the inner HTML
                            * and relying on the data attribute values
                            * /
                clean(element: Element): Element {
                    element.removeAttribute('contenteditable')
                    element.innerHTML = ''
                                        rn element
                         
                         
                        
                        /**
                         * Example template for optional sidebar for displaying custom html in the sidebar
                         */
                            idebar(): SidebarButton {
                    //     const customElements = this.editor.editorNode?.querySelectorAll(this.tag)
                    //     let content = ''
                    f(customElements) {
                        customElements.forEach(customElement => {
                                    //             const customAttribute = this.getAttribute('data-custom-attribute',customElement)
                                    //             content += `
                                    //                 <article>
                                    //                     <a href="#${customElement.id}" title="Click to view custom element in context">
                                    //                         <!@-- example custom content-->
                                    //                         ${customAttribute}
                                    //                     </a>
                                    //                 </article>`
                                    //         })
                                    //     }
                                    //     return new SidebarButton(this.icon, 'comments', content)
                                    // }





                                /**
                                 * Example template for mandatory show method
                                 */
                                    // show(editFlag: boolean) {
                                    //     // @todo
                                        //     // Define buttons, if need others extend the interface as required
                                     et buttons: EditButtons = {
                                l: 'Cancel', callback: this.handleCancel
                            },
                                    confirm: { label: 'Save', callback: this.save },
                                        
                                    tom element'

                                = 'Edit custom element'
                            elete = { label: 'Delete', callback: this.handleDelete }
                    //     } else {
                    //         this.node = document.createElement(this.tag)
                    //         this.node.id = Helpers.generateUid()
                //         this.node.setAttribute('contenteditable', 'false')
                //         // @todo
                                / initialise any custom attributes
                                    g. this.node.setAttribute('data-custom', '')
                                    
                                     and display the modal panel
                                    new Modal({
                                    //         type: 'drawer',
                                    //         title,
                                    //         html: this.form(),
                                    //         buttons
                                    //     })
                                    //     this.drawer.show()
                                    //     // @todo
                                    //     // Optionally initialise confirmation module and dirty data detection
                                    //     this.dirty = false
                                    //     const customInput = this.drawer.selectOne('form textarea#custom')
                                    //     if (!this.drawer.panel || !customInput) {
                                    //         console.error('Could not find custom input data element')
                                    //         return
                                    //     }
                                    //     const input = <HTMLInputElement>customInput
                                    //     input.addEventListener('change', () => this.dirty = true)
                                    //     // @todo
                                    //     // Optional custom button handling
                                    //     const customButton = this.drawer.selectOne('form button#customButton')
                                    //     if (customButton != null) {
                                    //         customButton.addEventListener('click', this.handleCustomButton)
                                    //     }
                                    //     // @todo
                                //     // Optionally set initial focus
                                //     input.focus()
                                    //     input.setSelectionRange(input.value.length, input.value.length)
                                     / }
                                     
                                    
                                    /**
                                     * Example template for mandatory form method
                                     */
                                // form(): string {
                                           if (!this.node) {
                                               console.error('Error: custom node is missing')
                                                : custom node is missing'
                            /     }
                                    / @todo get custom attributes, for example:
                                            tomAttribute = this.getAttribute('data-customAttribute')
                                                / @todo Process the custom attributes for display, for example
                                    stomAttribute = '...' + customAttribute
                                    ptional custom buttons
                                    //     const customButtonText = `<button type="button" id="custom-button">Custom</button>`
                                    //     return `
                                    //             <form class="comment">
                                    //                 <div class="form-input">
                                    //                     <textarea id="custom" class="form-control" placeholder="Enter your custom data" required>${formattedCustomAttribute}</textarea>
                                //                 </div>
                                //                 ${customButtonText}
                                //             </form>`
                                    // }
                                        
                                
                                
                                    * Example template for a custom button handling method
                                        * /
                            // handleCustomButton(event: Event): void {
                                       if (!this.node || !event.target) {
                            //         console.error('Trying to handle a missing custom button')
                            rn

                                // @todo modify attributes, content and/or button label
                                    
                                        
                                        
                                        
                                        ample template for saving a new or edited custom element
                                        * /
                                    // save(): void {
                                    //     // console.log('Save changes')
                                        //     if (!this.node || !this?.drawer?.panel) {
                                    / console.error('Could not find custom element to save')
                                
                                    
                                        l) {
                                        om the form
                                        wer.panel.querySelector('form #data')
                                              if (!data) {
                                        //             console.error('Could not find custom data in the form')
                                        //             return
                                        //         }
                                        //         this.node.setAttribute('data-data', (<HTMLInputElement>data).value.trim())
                                        //         // @optional handle timestamps
                                        //         const timestamp = new Date()
                                        //         const localString = timestamp.toLocaleString().slice(0, -3)
                                        //         // console.log('local timestamp', localString)
                                        //         if (this.getAttribute('data-created') == '') {
                                        //             this.setAttribute('data-created', localString)
                                        //             this.insert()
                                        //         }
                                        //         this.node.setAttribute('data-updated', localString)
                                        //     }
                                        //     this.drawer.hide()
                                        //     // Format this.node and add event handler
                                        //     this.format(this.node, 'custom title')
                                        //     // Update state
                                    //     this.editor.range = Helpers.setCursor(this.node, 0)
                                    //     this.setState()
                                        //     this.editor?.buffer?.update()
                                         / }
                                         
                                     
                                        /**
                                         * Example template for a template defining how custom element content is displayed
                                         * Passed into the format method as a callback
                                 */
                                    // template(custom: Element): string {
                                    //     const attribute = this.getAttribute('data-attribute',custom)
                                    eturn`
                             n" title = "Edit this ${this.label}" >
                             bel class="attribute-class">Attribute</label >
                            span class="attribute-value">${attribute}</span>
                            ton>`





        // -----------------------------------------------------------------------------
        // @section Protected methods
        // -----------------------------------------------------------------------------


        /**
            andatory format method which may be overridden
             
             cted format(template: Function): void {
             this.node) {
            ole.error(`Cannot find the ${this.label} to format`)
            n

            const element = this.node
            // Generate new id if required
            if (!element.id) {
                element.id = Helpers.generateUid()
            }
            element.setAttribute('contenteditable', 'false')
            element.innerHTML = template(element)
            // Add event listener to edit button if it exists
            element.querySelector('button')?.addEventListener('click', event => {
                event.preventDefault()
                event.stopPropagation()
                this.edit(element)
            })
            // Add set state listener
            element.addEventListener('click', () => {
                this.setState()
            })
        }


    protected setCustomBlockState(): void {
        if (!this.element) {
            console.error('Trying to set button state when button element not set')
            return
        }
        //console.warn('custom setState edt.range',edt.range)
        this.disabled = false
        if (!this.editor.range ||
            this.editor.range.rootNode == this.editor.editorNode ||
            Helpers.isBlock(this.editor.range.rootNode) == false) {

            this.disabled = true
        }

        if (this.disabled) {
            this.element.setAttribute('disabled', 'disabled')
            this.element.classList.remove('active')
        } else {
            this.element.removeAttribute('disabled')
            // If we have a range containing a custom element then make the button active
            const custom = this.editor.range?.blockParent?.querySelector(this.tag)
            if (custom != null) {
                this.element.classList.add('active')
            } else {
                this.element.classList.remove('active')
            }
        }
    }

    protected handleCancel(): void {
        if (this.dirty) {
            this.confirm = Helpers.modalRequestCancel(this.handleConfirmCancel)
        } else {
            this.drawer?.hide()
        }
    }

    protected handleDelete(): void {
        this.confirm = Helpers.modalRequestDelete(this.label, this.handleConfirmDelete)
    }

                    
                    ttribute specified for the current node OR the specified element if provided
                        
                        ribute(attribute: string, element ?: null | Element): string {
                    if(element !== undefined) {
                    if(!element) {
                        console.error(`Cannot get attribute for missing element`)
                        return ''
                    }
                    se if (!this.node) {
                    console.error(`Cannot get attribute for missing custom node ${this.label}`)
                    return ''
                } else {
                    element = this.node
                }
            const value = element.getAttribute(attribute)
            if (value) return value.trim()
            return ''
        }


                
                    ttribute specified for the current node OR the specified element if provided
                        
                        ribute(attribute: string, value: string, element ?: null | Element): boolean {
                    element !== undefined) {
                    if (!element) {
                        console.error(`Cannot set attribute for missing element`)
                        return false
                    }
                    se if (!this.node) {
                    console.error(`Cannot set attribute for missing custom node ${this.label}`)
                    return false
                } else {
                    element = this.node
            }
            element.setAttribute(attribute, value.trim())
            return true
        }


    /**
                t a new custom element in the editor at the end of the current 
                's startContainer
            
     rotected insert(): void {
            if(this.editor?.range?.startContainer.parentNode) {
            this.node = this.editor.range.startContainer.parentNode.appendChild(<Element>this.node)
        }
            
                
                

                ------------------------------------------------------------------------
                 / @section Private methods
                 / -----------------------------------------------------------------------------
                 
                /**
                    dit an existing comment node by extracting the data from the node and displaying
                    he edit form. Sets the comment node to be edited
                 */
            private edit(element: Element): void {
                    // If we already have an active panel - ignore edit clicks
                        his.drawer && this.drawer.active()) {
            turn

                .node = element
                        .show(true)
            
                
ate handleConfirmCancel(): void {
                this.confirm?.hide()
this.drawer?.hide()
            }

    private handleConfirmDelete(): void {
            th is.confirm?.hide()
        this.drawer?.hide()
        this.deleteItem()
            
             
             
             the custom element in the dom
            * /
            ate deleteItem(): void {
            this.node?.remove()
                            pdate state
                                    this.editor.range = null
                                this.setState()
                    this.editor.buffer?.update()






