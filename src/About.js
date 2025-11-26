import React, { useState } from 'react';
import Sidebar from './Sidebar';
import PageCard from './components/PageCard';


function About() {

    const [isOpen, setIsOpen] = useState(false);
 
    return (
        <div>         
         {/* <Sidebar isOpen={true}  /> */}
         <PageCard title="About SimplERP">
            <p>A next generation highly customisable and light weight ERP solution</p>
         </PageCard>
        </div>
    );
}
export default About;