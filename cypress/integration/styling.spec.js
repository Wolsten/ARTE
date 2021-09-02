describe('Tests inline formatting', function () {

    before('Open editor url and start editing', function(){
        cy.arte_visit()
    })

    // after('Screenshot', function(){
    //     cy.screenshot()
    // })

    it('1. tests single formatting', function(){

        cy.arte_type('This is a paragraph with singly styled elements')
        cy.arte_click_id('H1')

        cy.arte_print('This is a paragraph with singly styled elements include bold, italic, underlined, coloured and highlighted text.')

        cy.arte_set_selection('bold')
        cy.arte_click_id('B')

        cy.arte_set_selection('italic')
        cy.arte_click_id('I')

        cy.arte_set_selection('underlined')
        cy.arte_click_id('U')

        cy.arte_set_selection('coloured')
        cy.arte_click_id('FGC')
        cy.arte_modal_click('confirm')

        cy.arte_set_selection('highlighted')
        cy.arte_click_id('BGC')
        cy.arte_modal_click('confirm')

        // Check have the correct styles applied
        cy.arte_count('h1',1)
        cy.arte_count('p',1)
        cy.arte_count('span[style="font-weight:bold;"]',1)
        cy.arte_count('span[style="font-style:italic;"]',1)
        cy.arte_count('span[style="text-decoration:underline;"]',1)
        cy.arte_count('span[style="color:hsl(0, 97%, 50%);"]',1)
        cy.arte_count('span[style="background-color:hsl(0, 97%, 50%);"]',1)
    })

    it('2. tests clearing formatting', function(){
        cy.arte_print('Test clearing styles fully.')
        cy.arte_click_id('H1')
        cy.arte_set_selection('fully.')
        cy.arte_print('START This is a paragraph with no styled elements include bold2, italic2, underlined2, coloured2 and highlighted2 text END')

        cy.arte_set_selection('bold2')
        cy.arte_click_id('B')

        cy.arte_set_selection('italic2')
        cy.arte_click_id('I')

        cy.arte_set_selection('underlined2')
        cy.arte_click_id('U')

        cy.arte_set_selection('coloured2')
        cy.arte_click_id('FGC')
        cy.arte_modal_click('confirm')

        cy.arte_set_selection('highlighted2')
        cy.arte_click_id('BGC')
        cy.arte_modal_click('confirm')

        cy.arte_set_selection('START','END')
        cy.arte_click_id('CLEAR')

        // Check have the correct styles applied (should be same as in previous test)
        cy.arte_count('span[style="font-weight:bold;"]',1)
        cy.arte_count('span[style="font-style:italic;"]',1)
        cy.arte_count('span[style="text-decoration:underline;"]',1)
        cy.arte_count('span[style="color:hsl(0, 97%, 50%);"]',1)
        cy.arte_count('span[style="background-color:hsl(0, 97%, 50%);"]',1)
    })

    it('3. tests clearing formatting partially', function(){
        cy.arte_print('This tests clearing formatting partially.')
        cy.arte_click_id('H1')

        cy.arte_set_selection('partially.')
        cy.arte_print('This is a paragraph with no styled elements include bo(xxbxx)ld, ita(xxixx)lic, under(xxuxx)lined, colo(xxcxx)ured and high(xxhxx)lighted text.')

        cy.arte_set_selection('bo(xxbxx)ld')
        cy.arte_click_id('B')

        cy.arte_set_selection('ita(xxixx)lic')
        cy.arte_click_id('I')

        cy.arte_set_selection('under(xxuxx)lined')
        cy.arte_click_id('U')

        cy.arte_set_selection('colo(xxcxx)ured')
        cy.arte_click_id('FGC',false)
        cy.arte_modal_click('confirm')

        cy.arte_set_selection('high(xxhxx)lighted')
        cy.arte_click_id('BGC',false)
        cy.arte_modal_click('confirm')

        cy.arte_set_selection('xxbxx')
        cy.arte_click_id('CLEAR')

        cy.arte_set_selection('xxixx')
        cy.arte_click_id('CLEAR')

        cy.arte_set_selection('xxuxx')
        cy.arte_click_id('CLEAR')

        cy.arte_set_selection('xxcxx')
        cy.arte_click_id('CLEAR')

        cy.arte_set_selection('xxhxx')
        cy.arte_click_id('CLEAR')

        // Check have the correct styles applied (should be 3x as in previous test
        // 1 each from previous plus two each from this)
        cy.arte_count('span[style="font-weight:bold;"]',3)
        cy.arte_count('span[style="font-style:italic;"]',3)
        cy.arte_count('span[style="text-decoration:underline;"]',3)
        cy.arte_count('span[style="color:hsl(0, 97%, 50%);"]',3)
        cy.arte_count('span[style="background-color:hsl(0, 97%, 50%);"]',3)
    })

})