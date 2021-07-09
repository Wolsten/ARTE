"use strict"

class Links {

    constructor( target, icon, modalClass ){
        this.editor = target
        this.modalClass = modalClass
        // The popup panel and input change status
        this.panel = null
        this.changed = false
        // Initialise links
        this.link = false
        let links = this.editor.querySelectorAll( 'a' )
        links.forEach( link => format( link ))
        this.dirty = false
        // Initialise button
        this.button = {
            //
            // Mandatory attributes
            //
            // The tag should be a valid html id that isn't already used
            tag:'a',
            // The tooltip label 
            label:'Link', 
            // The icon passed in should be a 16 x 16 svg tag
            icon:icon,
            // The button click handler and reference to the instance
            click:this.click,
            that:this,
            //
            // Optional attributes
            //
            // Keyboard shortcut
            shortcut:'@',
            // Any pre setup required (this will probably move into the constructor)
            // setup,
            // Callback to initialise event handling for custom objects in the editor
            addEventHandlers:this.addEventHandlers,
            // Call back for any custom data cleaning required on save
            clean:this.clean,
        }
    }

    // initLinks(){
    //     let links = this.target.querySelectorAll( 'a' )
    //     links.forEach( link => format( link ))
    // }


    insert(id){
        const link = document.createElement('a')
        link.id = id
        link.setAttribute('contenteditable', 'false')
        link.innerText = ' '
        const parent = this.range.startContainer.parentNode
        const preText = this.range.startContainer.textContent.substring(0,this.range.startOffset)
        let postText
        if ( this.range.collapsed ){
            postText = this.range.startContainer.textContent.substring(this.range.startOffset)
        } else {
            postText = this.range.startContainer.textContent.substring(this.range.endOffset)
        }
        if ( preText ) {
            parent.insertBefore(document.createTextNode(preText), this.range.startContainer)
        }
        parent.insertBefore(link, this.range.startContainer)
        if ( postText ) {
            parent.insertBefore(document.createTextNode(postText), this.range.startContainer)
        }
        this.range.startContainer.remove()
    }

    updateDomDelayed(id){
        // Update dom
        const userForm = this.panel.querySelector('form')
        const link = this.editor.querySelector(`a#${this.link.id}`)
        link.href = userForm.querySelector('#href').value
        link.innerText = userForm.querySelector('#label').value
        // Add event handler
        this.format(link)
    }

    saveChanges(){
        console.log('Save changes')
        // Create new link and add to the editor?
        if ( this.link.id == '' ){
            this.link.id = this.generateUid()
            this.insert(this.link.id)
        }
        setTimeout( ()=>this.updateDomDelayed(this.link.id), 10)
        // Close the edit pane
        this.hide()
    } 

    click( range, link ){
        console.log('click link')
        if ( range === false && link === undefined){
            console.log('No range or link selected')
            return
        }
        // Check content
        const _this = this.that ? this.that : this
        console.log('this should be the link class', _this)
        let edit = true
        _this.link = link
        _this.range = range
        _this.panel = document.createElement('DIV')
        _this.panel.id = 'link-edit'
        _this.panel.classList.add('edit-panel')
        // debugger
        if ( link == undefined ){
            edit = false
            let label = ''
            if ( _this.range.collapsed == false && 
                _this.range.startContainer == _this.range.endContainer ){
                label = _this.range.endContainer.textContent.substring(_this.range.startOffset, _this.range.endOffset)  
            }
            _this.link = {
                id:'',
                href:'', 
                label, 
            }
        }
        _this.panel.innerHTML = _this.form(_this.link, edit)
        // Initialise confirmation module and dirty data detection
        _this.dirty = false
        _this.modal = new _this.modalClass()
        const inputs = _this.panel.querySelectorAll('form input')
        inputs.forEach(input => input.addEventListener('change', ()=>_this.dirty=true))
        // Handle button events
        _this.panel.querySelector('button.cancel').addEventListener('click', () => {
            if ( _this.dirty ){
                const confirmBtn = _this.modal.show('Cancel changes', 'Do you really want to lose these changes?')
                confirmBtn.addEventListener( 'click', () => {
                    _this.modal.hide()
                    _this.hide()
                })
            } else {
                _this.hide()
            }
        })
        if ( edit ){
            _this.panel.querySelector('button.delete').addEventListener('click', () => {
                const confirmBtn = _this.modal.show('Delete link', 'Do you really want to delete this link?')
                confirmBtn.addEventListener( 'click', ()=>_this.deleteItem() )
            })
        }
        _this.panel.querySelector('button.save').addEventListener('click', ()=>_this.saveChanges())
        // Add to dom, position and focus the input
        document.querySelector('body').appendChild(_this.panel)
    }

    getNewNode(node){
        let matched = false
        while ( !matched  ){
            if ( node.tagName === 'A' ){
                matched = node
            }
            node = node.parentNode
        }
        return matched
    }


    editClickedObject(link){
        // event.preventDefault()
        // const linkNode = this.getNewNode(event.currentTarget)
        // console.log('edit link', linkNode )
        this.link = {
            id: link.id,
            href: link.href,
            label: link.innerText.trim(),
        }
        this.click(false, this.link)
    }

    hide(){
        // Invoked from the modal
        this.panel.classList.remove('show')
        // Use arrow function to preserve "this"
        setTimeout( ()=>this.delayedRemove(), 500 )
    }

    delayedRemove(){
        this.panel.remove()
        this.panel = null
    }


    deleteItem(){
        // @todo Remove link from the editor
        this.hide()
    }

    clean(node){
        console.log('clean link',node)
        node.removeAttribute('id')
        node.removeAttribute('contenteditable')
        return node
    }

    format( link ){
        // Click event handling - first time and after reformatting
        link.id = this.generateUid()
        link.setAttribute('contenteditable',false)
        link.addEventListener('click', event => {
            event.preventDefault()
            this.editClickedObject(link) 
        })
    }

    addEventHandlers( editor ){
        const links = editor.querySelectorAll('a')
        links.forEach( link => link.addEventListener('click', event => {
            event.preventDefault()
            this.editClickedObject(link) 
        }))
    }

    // setup(target, firstTime ){
    //     console.log('Setup links')
    //     editorNode = target
    //     currentLink = false
    //     savedRange = false
    //     let links = target.querySelectorAll( 'a' )
    //     links.forEach( link => {
    //         format( link )
    //     })
    // }

    form(link,edit){
        let title = 'Create link'
        let delBtn = ''
        let href = ''
        let label = ''
        if ( edit) {
            title = 'Edit link'
            delBtn = `<button type="button" class="delete">Delete</button>`
            href = link.href
            label = link.label
        }
        return `
            <div class="panel-header">
                <h1 class="panel-title">${title}</h1>
            </div>
            <div class="panel-body">
                <form>
                    <div class="form-input">
                        <input id="href" type="text" class="form-control" placeholder="URL" value="${href}">
                        <label for="href">URL</label>
                    </div>
                    <div class="form-input">
                        <input id="label" type="text" class="form-control" placeholder="Label" value="${label}">
                        <label for="label">Label (optional)</label>
                    </div>
                    <div class="buttons">
                        <button type="button" class="cancel">Cancel</button>
                        ${delBtn}
                        <button type="button" class="save">Save</button>
                    </div>
                </form>
            </div>`
    }

    generateUid(){
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

}


export default Links