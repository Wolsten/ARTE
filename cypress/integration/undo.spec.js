
describe('Tests undo and redo buffer plugin', function () {

    beforeEach('Open editor url and start editing', function(){
        cy.arte_visit()
    })


    it('tests undo text entry', function(){

        cy.arte_type_format('h1','Checking undoing and redoing of text entry.')
        
        // Add 11 paragraphs - with wait to ensure correct buffer per para
        for( let i=1; i<12; i++ ){
            cy.arte_print(`p${i}`).wait(500)
            cy.arte_contains(`p${i}`)
        }

        // Click undo 5 times
        for( let i=0; i<5; i++ ){
            cy.arte_click_id('UNDO')
        }
        
        // Check have the correct block styles after
        cy.arte_count('h1',1)
        cy.arte_count('p',6)

        // Click redo 3 times
        for( let i=0; i<3; i++ ){
            cy.arte_click_id('REDO')
        }

        // Check have the correct block styles after
        cy.arte_count('h1',1)
        cy.arte_count('p',9)
    })


    it('tests undoing block styling', function(){

        cy.arte_type_format('h1','tests undoing block styling.',true)

        cy.arte_print('Sample text')

        // Apply the formatting
        const WAIT = 100
        cy.arte_click_id('H1').wait(WAIT)
        cy.arte_click_id('H2').wait(WAIT)
        cy.arte_click_id('H3').wait(WAIT)
        cy.arte_click_id('P').wait(WAIT)
        cy.arte_click_id('BLOCKQUOTE').wait(WAIT)

        // Check have the correct block style
        cy.arte_count('blockquote',1)

        // Click undo 3 times
        for( let i=0; i<3; i++ ){
            cy.arte_click_id('UNDO')
        }

        // Check have the correct block style
        cy.arte_count('blockquote',0)
        cy.arte_count('h2',1)

        // Click redo 2 times
        for( let i=0; i<2; i++ ){
            cy.arte_click_id('REDO')
        }

        // Check have the correct block style
        cy.arte_count('blockquote',0)
        cy.arte_count('P',1)
    })


    it('tests undoing inline styling', function(){

        cy.arte_type_format('h1', 'tests undoing inline styling',true)

        cy.arte_print('This is a paragraph with singly styled elements include bold, italic, underlined, coloured and highlighted text.')

        // Apply the formatting
        const WAIT = 100
        cy.arte_set_selection('bold')
        cy.arte_click_id('B').wait(WAIT)
        cy.arte_set_selection('italic')
        cy.arte_click_id('I').wait(WAIT)
        cy.arte_set_selection('underlined')
        cy.arte_click_id('U').wait(WAIT)
        cy.arte_set_selection('coloured')
        cy.arte_click_id('ARTE-COLOR')
        cy.get('span[data-index="8"]').click().wait(WAIT)
        cy.arte_set_selection('highlighted')
        cy.arte_click_id('ARTE-BACKGROUND-COLOR')
        cy.get('span[data-index="6"]').click().wait(WAIT)

        // Check have the correct styles applied
        cy.arte_count('p',1)
        cy.arte_count('span[style="font-weight:bold;"]',1)
        cy.arte_count('span[style="font-style:italic;"]',1)
        cy.arte_count('span[style="text-decoration:underline;"]',1)
        cy.arte_count('span[style="color:red;"]',1)
        cy.arte_count('span[style="background-color:yellow;"]',1)

        // Click undo 3 times
        for( let i=0; i<3; i++ ){
            cy.arte_click_id('UNDO')
        }

        // Check have the correct styles applied
        cy.arte_count('p',1)
        cy.arte_count('span[style="font-weight:bold;"]',1)
        cy.arte_count('span[style="font-style:italic;"]',1)
        cy.arte_count('span[style="text-decoration:underline;"]',0)
        cy.arte_count('span[style="color:red;"]',0)
        cy.arte_count('span[style="background-color:yellow;"]',0)

        // Click redo 2 times
        for( let i=0; i<2; i++ ){
            cy.arte_click_id('REDO')
        }

        // Check have the correct styles applied
        cy.arte_count('p',1)
        cy.arte_count('span[style="font-weight:bold;"]',1)
        cy.arte_count('span[style="font-style:italic;"]',1)
        cy.arte_count('span[style="text-decoration:underline;"]',1)
        cy.arte_count('span[style="color:red;"]',1)
        cy.arte_count('span[style="background-color:yellow;"]',0)
    })


    it('tests buffer limits', function(){

        cy.arte_type_format('h1', 'tests buffer limits',true)

        // Add 6 paragraphs
        for( let i=0; i<6; i++ ){
            cy.arte_print(`p${i}`).wait(500)
        }

        
        // Click undo 7 times
        for( let i=0; i<7; i++ ){
            cy.log(`Clicked ${i} times`)
            cy.arte_click_id('UNDO')
        }
        
        // Check the state
        cy.arte_contains('tests buffer limits').should('not.exist')
        cy.get('button#UNDO[disabled]').should('exist')
        cy.get('button#REDO[disabled]').should('not.exist')

        // Click redo 6 times
        for( let i=0; i<7; i++ ){
            cy.arte_click_id('REDO')
        }

        // Check the state
        cy.arte_contains('tests buffer limits')
        cy.get('button#UNDO[disabled]').should('not.exist')
        cy.get('button#REDO[disabled]').should('exist')

        // Undo once
        cy.arte_click_id('UNDO')

        // Check the state
        cy.arte_contains('tests buffer limits')
        cy.get('button#UNDO[disabled]').should('not.exist')
        cy.get('button#REDO[disabled]').should('not.exist')
        cy.arte_contains('p4')
        cy.arte_contains('p5').should('not.exist')
    })
})