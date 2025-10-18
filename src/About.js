import React, { useState } from 'react';
import Sidebar from './Sidebar';


function About() {

    const [isOpen, setIsOpen] = useState(false);
 
    return (
        <div>         
         <Sidebar isOpen={true}  />
         <div className={`content ${true ? 'shifted' : ''}`}>
            <h1>About DataSynops</h1>
            <hr/>
            <p>A next generation application that provides intelligent insights into the world of survey data</p>           
         </div>
        </div>
    );
}
export default About;