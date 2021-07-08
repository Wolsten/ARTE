export default class Buffer {

    constructor( size, target ){
        this.size = size
        this.bufferIndex = 0
        this.target = target
        this.buffer = [this.target.innerHTML]
    }

    update(){
        if ( this.buffer.length > this.size ){
            // Remove first element
            this.buffer.shift()
        }
        // Check buffer index in case need to reset buffer when the user had
        // undone and then made new changes
        if ( (this.bufferIndex + 1) < this.buffer.length ){
            const items = this.buffer.length - (this.bufferIndex + 1)
            for( let i=0; i<items; i++){
                this.buffer.pop()
            }
        }
        // Add the new one
        this.buffer.push(this.target.innerHTML)
        this.bufferIndex = this.buffer.length - 1
        console.log('buffer', this.buffer)
    }

    undo(){
        console.log('handle undo with buffer index', this.bufferIndex)
        if ( this.bufferIndex > 0 ){
            this.bufferIndex --
            this.target.innerHTML = this.buffer[this.bufferIndex]
            return true
        }
        return false
    }

    redo(){
        console.log('handle redo with buffer index', this.bufferIndex)
        if ( this.bufferIndex+1 < this.buffer.length ){
            this.bufferIndex ++
            this.target.innerHTML = this.buffer[this.bufferIndex]
            return true
        }
        return false
    }

    click( button ){
        console.log('Handling edit')
        switch (button.id ){
            case 'b-undo':
                return this.undo()
            case 'b-redo':
                return this.redo()
        }
        return false
    }
}