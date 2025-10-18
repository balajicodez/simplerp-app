import React, { useState } from 'react';
import Sidebar from './../Sidebar';
import PageCard from '../components/PageCard';


function Download() {

    const [isOpen, setIsOpen] = useState(false);
 
    return (
        <div>         
         <Sidebar isOpen={true}  />
         <PageCard title="Download">
         </PageCard>
        </div>
    );
}
export default Download;