
describe('Tests undo and redo', function () {

    beforeEach('Open editor url and start editing', function(){
        cy.arte_visit()
    })

    it('tests undo text entry', function(){

        cy.arte_print('Checking undoing and redoing of text entry')
        cy.arte_click_id('H1')
        
        // Add 11 paragraphs using delay to ensure buffered as written
        for( let i=1; i<12; i++ ){
            cy.arte_print(i).wait(1000)
        }

        // Check have the correct block styles before
        cy.arte_count('h1',1)
        cy.arte_count('p',11)

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
        cy.arte_click_id('FGC')
        cy.arte_modal_click('confirm').wait(WAIT)
        cy.arte_set_selection('highlighted')
        cy.arte_click_id('BGC')
        cy.arte_modal_click('confirm').wait(WAIT)

        // Check have the correct styles applied
        cy.arte_count('p',1)
        cy.arte_count('span[style="font-weight:bold"]',1)
        cy.arte_count('span[style="font-style:italic"]',1)
        cy.arte_count('span[style="text-decoration:underline"]',1)
        cy.arte_count('span[style="color:hsl(0, 97%, 50%)"]',1)
        cy.arte_count('span[style="background-color:hsl(0, 97%, 50%)"]',1)

        // Click undo 3 times
        for( let i=0; i<3; i++ ){
            cy.arte_click_id('UNDO')
        }

        // Check have the correct styles applied
        cy.arte_count('p',1)
        cy.arte_count('span[style="font-weight:bold"]',1)
        cy.arte_count('span[style="font-style:italic"]',1)
        cy.arte_count('span[style="text-decoration:underline"]',0)
        cy.arte_count('span[style="color:hsl(0, 97%, 50%)"]',0)
        cy.arte_count('span[style="background-color:hsl(0, 97%, 50%)"]',0)

        // Click redo 2 times
        for( let i=0; i<2; i++ ){
            cy.arte_click_id('REDO')
        }

        // Check have the correct styles applied
        cy.arte_count('p',1)
        cy.arte_count('span[style="font-weight:bold"]',1)
        cy.arte_count('span[style="font-style:italic"]',1)
        cy.arte_count('span[style="text-decoration:underline"]',1)
        cy.arte_count('span[style="color:hsl(0, 97%, 50%)"]',1)
        cy.arte_count('span[style="background-color:hsl(0, 97%, 50%)"]',0)
    })

    it('tests buffer limits', function(){

        // Add 5 paragraphs using delay to ensure buffered as written
        for( let i=0; i<6; i++ ){
            cy.arte_print(i).wait(1000)
        }

        // Click undo 6 times
        for( let i=0; i<7; i++ ){
            cy.arte_click_id('UNDO')
        }

        // Check the button states
        cy.get('button#UNDO[disabled]').should('exist')
        cy.get('button#REDO[disabled]').should('not.exist')

        // Click redo 6 times
        for( let i=0; i<7; i++ ){
            cy.arte_click_id('REDO')
        }

        // Check the button states
        cy.get('button#UNDO[disabled]').should('not.exist')
        cy.get('button#REDO[disabled]').should('exist')

        // Undo once
        cy.arte_click_id('UNDO')

        // Check the button states
        cy.get('button#UNDO[disabled]').should('not.exist')
        cy.get('button#REDO[disabled]').should('not.exist')
    })
})