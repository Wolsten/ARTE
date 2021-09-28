describe('Tests styling plugin', function () {

    beforeEach('Open editor url and start editing', function(){
        cy.arte_visit()
    })


    it('1. tests single formatting', function(){

        cy.arte_type_format('h1','Testing singly styled elements',true)

        cy.arte_print('This is a paragraph with singly styled elements include bold, italic, underlined, coloured and highlighted text.')
        cy.arte_set_selection('bold')
        cy.arte_click_id('B')
        cy.arte_get('span[style="font-weight:bold;"]')

        cy.arte_set_selection('italic')
        cy.arte_click_id('I')
        cy.arte_get('span[style="font-style:italic;"]')

        cy.arte_set_selection('underlined')
        cy.arte_click_id('U')
        cy.arte_get('span[style="text-decoration:underline;"]')

        cy.arte_set_selection('coloured')
        cy.arte_click_id('ARTE-COLOR')
        cy.get('span[data-index="8"]').click()
        cy.arte_count('span[style="color:red;"]',1)

        cy.arte_set_selection('highlighted')
        cy.arte_click_id('ARTE-BACKGROUND-COLOR')
        cy.get('span[data-index="6"]').click()
        cy.arte_count('span[style="background-color:yellow;"]',1)

        // Count the blocks
        cy.arte_count('h1',1)
    })

    
    it('2. tests clearing formatting', function(){

        cy.arte_type_format('h1','Test clearing styles fully.',true)

        cy.arte_print('START This is a paragraph with no styled elements include bold, italic, underlined, coloured and highlighted text END')
        cy.arte_set_selection('bold')
        cy.arte_click_id('B')
        cy.arte_count('span[style="font-weight:bold;"]',1)

        cy.arte_set_selection('italic')
        cy.arte_click_id('I')
        cy.arte_count('span[style="font-style:italic;"]',1)

        cy.arte_set_selection('underlined')
        cy.arte_click_id('U')
        cy.arte_count('span[style="text-decoration:underline;"]',1)
        
        cy.arte_set_selection('coloured')
        cy.arte_click_id('ARTE-COLOR')
        cy.get('span[data-index="8"]').click()
        cy.arte_count('span[style="color:red;"]',1)

        cy.arte_set_selection('highlighted')
        cy.arte_click_id('ARTE-BACKGROUND-COLOR')
        cy.get('span[data-index="6"]').click()
        cy.arte_count('span[style="background-color:yellow;"]',1)

        cy.arte_set_selection('START','END')
        cy.arte_click_id('CLEAR')

        cy.arte_count('h1',1)
        cy.arte_count('span[style="font-weight:bold;"]',0)       
        cy.arte_count('span[style="font-style:italic;"]',0) 
        cy.arte_count('span[style="text-decoration:underline;"]',0)
        cy.arte_count('span[style="color:red;"]',0)
        cy.arte_count('span[style="background-color:yellow;"]',0)
        
    })


    it('3. tests clearing formatting partially', function(){

        cy.arte_type_format('h1','This tests clearing formatting partially.', true)
        
        cy.arte_print('This is a paragraph with no styled elements include bo(xxbxx)ld, ita(xxixx)lic, under(xxuxx)lined, colo(xxcxx)ured and high(xxhxx)lighted text.')

        cy.arte_set_selection('bo(xxbxx)ld')
        cy.arte_click_id('B')
        cy.arte_count('span[style="font-weight:bold;"]',1)

        cy.arte_set_selection('ita(xxixx)lic')
        cy.arte_click_id('I')
        cy.arte_count('span[style="font-style:italic;"]',1)

        cy.arte_set_selection('under(xxuxx)lined')
        cy.arte_click_id('U')
        cy.arte_count('span[style="text-decoration:underline;"]',1)

        cy.arte_set_selection('colo(xxcxx)ured')
        cy.arte_click_id('ARTE-COLOR',false)
        cy.get('span[data-index="8"]').click()
        cy.arte_count('span[style="color:red;"]',1)

        cy.arte_set_selection('high(xxhxx)lighted')
        cy.arte_click_id('ARTE-BACKGROUND-COLOR',false)
        cy.get('span[data-index="6"]').click()
        cy.arte_count('span[style="background-color:yellow;"]',1)

        cy.arte_set_selection('xxbxx')
        cy.arte_click_id('CLEAR')
        cy.arte_count('span[style="font-weight:bold;"]',2)

        cy.arte_set_selection('xxixx')
        cy.arte_click_id('CLEAR')
        cy.arte_count('span[style="font-style:italic;"]',2)

        cy.arte_set_selection('xxuxx')
        cy.arte_click_id('CLEAR')
        cy.arte_count('span[style="text-decoration:underline;"]',2)

        cy.arte_set_selection('xxcxx')
        cy.arte_click_id('CLEAR')
        cy.arte_count('span[style="color:red;"]',2)

        cy.arte_set_selection('xxhxx')
        cy.arte_click_id('CLEAR')
        cy.arte_count('span[style="background-color:yellow;"]',2)

    })

})