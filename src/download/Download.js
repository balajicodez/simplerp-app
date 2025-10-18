import React, { useState } from 'react';
import Sidebar from './../Sidebar';


function Download() {

    const [isOpen, setIsOpen] = useState(false);
 
    return (
        <div>         
         <Sidebar isOpen={true}  />
         <div className={`content ${true ? 'shifted' : ''}`}>
            <h1>Download</h1>
            <hr/>
         </div>
        </div>
    );
}
export default Download;