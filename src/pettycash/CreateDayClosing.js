// import React, { useState } from 'react';
// import Sidebar from '../Sidebar';
// import PageCard from '../components/PageCard';
// import './CreateDayClosing.css';
// import { APP_SERVER_URL_PREFIX } from '../constants.js';
// import { useNavigate } from 'react-router-dom';

// function CreateDayClosing() {
//   const [description, setDescription] = useState('Day Closing');
//   const [comment, setComment] = useState('');
//   const [organizations, setOrganizations] = useState([]);
//   const [organizationId, setOrganizationId] = useState('');
//   const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
//   const [inward, setInward] = useState('');
//   const [outward, setOutward] = useState('');
//   const [closingBalance, setClosingBalance] = useState('');
  
//   // Denomination states
//   const [denominations, setDenominations] = useState({
//     // Notes
//     500: { good: '', bad: '' },
//     200: { good: '', bad: '' },
//     100: { good: '', bad: '' },
//     50: { good: '', bad: '' },
//     20: { good: '', bad: '' },
//     10: { good: '', bad: '' },
//     // Coins
//     '20c': { good: '', bad: '' },
//     '10c': { good: '', bad: '' },
//     '5c': { good: '', bad: '' },
//     '1c': { good: '', bad: '' }
//   });

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const [balanceError, setBalanceError] = useState('');
//   const navigate = useNavigate();

//   const currentUser = localStorage.getItem('username') || localStorage.getItem('user') || '';
//   const createdTime = new Date().toISOString();

//   React.useEffect(() => {
//     import('../organization/organizationApi').then(mod => {
//       mod.fetchOrganizations().then(setOrganizations).catch(() => { });
//     });
//   }, []);

//   React.useEffect(() => {
//     fetch(`${APP_SERVER_URL_PREFIX}/organizations`)
//       .then(res => res.json())
//       .then(data => {
//         const orgs = data._embedded ? data._embedded.organizations || [] : data;
//         setOrganizations(orgs);
//       })
//       .catch(() => { });
//   }, []);

//   const handleChange = async (e) => {
//     const { name, value, type } = e.target;
//     if (type === 'select-one') {
//       const selectedOrgId = e.target.value;
//       setOrganizationId(selectedOrgId);
      
//       if (selectedOrgId && date) {
//         await fetchBalanceData(date, selectedOrgId);
//       }
//     } else if (type === 'date') {
//       const selectedDate = e.target.value;
//       setDate(selectedDate);
      
//       if (organizationId && selectedDate) {
//         await fetchBalanceData(selectedDate, organizationId);
//       }
//     }
//   };

//   const fetchBalanceData = async (closingDate, orgId) => {
//     try {
//       const res = await fetch(`${APP_SERVER_URL_PREFIX}/petty-cash/day-closing/init?closingDate=${closingDate}&organizationId=${orgId}`, {
//         method: 'GET',
//         headers: { 'Content-Type': 'application/json' }
//       });

//       if (res.ok) {
//         const data = await res.json();
//         setInward(data.cashIn || '0');
//         setOutward(data.cashOut || '0');
//         setClosingBalance(data.closingBalance || '0');
//       } else {
//         // Reset fields if API call fails
//         setInward('');
//         setOutward('');
//         setClosingBalance('');
//       }
//     } catch (error) {
//       console.error('Error fetching balance data:', error);
//       setInward('');
//       setOutward('');
//       setClosingBalance('');
//     }
//   };

//   const handleDenominationChange = (denom, field, value) => {
//     setDenominations(prev => ({
//       ...prev,
//       [denom]: {
//         ...prev[denom],
//         [field]: value
//       }
//     }));
//   };

//   const calculateTotalAmount = (denom, good, bad) => {
//     const goodCount = parseInt(good) || 0;
//     const badCount = parseInt(bad) || 0;
//     const totalCount = goodCount + badCount;
//     return totalCount * denom;
//   };

//   const getTotalSummary = () => {
//     let totalGood = 0;
//     let totalBad = 0;
//     let totalAmount = 0;

//     Object.entries(denominations).forEach(([denom, counts]) => {
//       const denominationValue = denom === '20c' ? 20 : denom === '10c' ? 10 : denom === '5c' ? 5 : denom === '1c' ? 1 : parseInt(denom);
//       const good = parseInt(counts.good) || 0;
//       const bad = parseInt(counts.bad) || 0;
      
//       totalGood += good * denominationValue;
//       totalBad += bad * denominationValue;
//       totalAmount += (good + bad) * denominationValue;
//     });

//     return { totalGood, totalBad, totalAmount };
//   };

//   const validateClosingBalance = () => {
//     const { totalAmount } = getTotalSummary();
//     const apiClosingBalance = parseFloat(closingBalance) || 0;
    
//     if (Math.abs(totalAmount - apiClosingBalance) > 0.01) { // Allow small floating point differences
//       setBalanceError(`Closing balance mismatch! Denomination total: ₹${totalAmount.toFixed(2)} vs API closing balance: ₹${apiClosingBalance.toFixed(2)}`);
//       return false;
//     }
    
//     setBalanceError('');
//     return true;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');
//     setSuccess('');
//     setBalanceError('');

//     // Validate closing balance before submission
//     if (!validateClosingBalance()) {
//       setLoading(false);
//       return;
//     }

//     try {
//       const desc = typeof description === 'string' && description.trim() ? description.trim() : 'Day Closing';
      
//       const {
//         totalGood: cashIn,
//         totalBad: cashOut,
//         totalAmount: closingBalanceCalc
//       } = getTotalSummary();

//       const payload = {
//         closingDate: date,
//         description: desc,
//         createdBy: currentUser,
//         comment: comment,
//         createdTime,
//         organizationId: organizationId || undefined,
//         inward: inward ? Number(inward) : 0,
//         outward: outward ? Number(outward) : 0,
//         closingBalance: closingBalanceCalc || (closingBalance ? Number(closingBalance) : 0),
//         cashIn,
//         cashOut,
//         tenNoteCount: denominations[10]?.good || 0,
//         twentyNoteCount: denominations[20]?.good || 0,
//         fiftyNoteCount: denominations[50]?.good || 0,
//         hundredNoteCount: denominations[100]?.good || 0,
//         twoHundredNoteCount: denominations[200]?.good || 0,
//         fiveHundredNoteCount: denominations[500]?.good || 0,
//         tenSoiledNoteCount: denominations[10]?.bad || 0,
//         twentySoiledNoteCount: denominations[20]?.bad || 0,
//         fiftySoiledNoteCount: denominations[50]?.bad || 0,
//         hundredSoiledNoteCount: denominations[100]?.bad || 0,
//         twoHundredSoiledNoteCount: denominations[200]?.bad || 0,
//         fiveHundredSoiledNoteCount: denominations[500]?.bad || 0,
//         oneCoinCount: denominations['1c']?.good || 0,
//         fiveCoinCount: denominations['5c']?.good || 0,
//         tenCoinCount: denominations['10c']?.good || 0,
//         twentyCoinCount: denominations['20c']?.good || 0,
//         denominations: denominations
//       };

//       const res = await fetch(`${APP_SERVER_URL_PREFIX}/petty-cash/day-closing`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload)
//       });
//       if (!res.ok) {
//         const data = await res.text();
//         setError(data);
//       } else {
//         setSuccess('Day closing created successfully!');
//         setTimeout(() => navigate('/pettycash/day-closing'), 1200);
//       }
//     } catch (e) {
//       setError('Failed to create day closing');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const denominationConfig = [
//     { value: 500, type: 'Note', label: '500' },
//     { value: 200, type: 'Note', label: '200' },
//     { value: 100, type: 'Note', label: '100' },
//     { value: 50, type: 'Note', label: '50' },
//     { value: 20, type: 'Note', label: '20' },
//     { value: 10, type: 'Note', label: '10' },
//     { value: '20c', type: 'Coin', label: '20' },
//     { value: '10c', type: 'Coin', label: '10' },
//     { value: '5c', type: 'Coin', label: '5' },
//     { value: '1c', type: 'Coin', label: '1' }
//   ];

//   const { totalGood, totalBad, totalAmount } = getTotalSummary();

//   // Validate closing balance on denomination changes
//   React.useEffect(() => {
//     if (closingBalance) {
//       validateClosingBalance();
//     }
//   }, [denominations, closingBalance]);

//   return (
//     <div className="day-closing-container">
//       <Sidebar isOpen={true} />
//       <PageCard title="Create Day Closing Report">
       

//         <form onSubmit={handleSubmit} className="day-closing-form">
//           {/* Basic Information Section */}
//           <div className="form-section">
//             <h3 className="section-title">Basic Information</h3>
//             <div className="form-grid">
//               <div className="form-group">
//                 <label className="form-label">Organization</label>
//                 <select 
//                   value={organizationId} 
//                   onChange={handleChange} 
//                   className="form-select" 
//                   required
//                 >
//                   <option value="">Select organization</option>
//                   {organizations.map(org => (
//                     <option 
//                       key={org.id || (org._links && org._links.self && org._links.self.href)} 
//                       value={org.id || (org._links && org._links.self && org._links.self.href.split('/').pop())}
//                     >
//                       {org.name}
//                     </option>
//                   ))}
//                 </select>
//               </div>
              
//               <div className="form-group">
//                 <label className="form-label">Description</label>
//                 <input 
//                   type="text" 
//                   value={description} 
//                   onChange={e => setDescription(e.target.value)} 
//                   className="form-input" 
//                 />
//               </div>
              
//               <div className="form-group">
//                 <label className="form-label">Date</label>
//                 <input 
//                   type="date" 
//                   value={date} 
//                   onChange={handleChange} 
//                   className="form-input" 
//                 />
//               </div>
//              <div className="form-group">
//               <label className="form-label">Comment</label>
//               <textarea 
//                 value={comment} 
//                 onChange={e => setComment(e.target.value)} 
//                 className="form-input textarea-input"
//                 rows={4}
//                 placeholder="Enter your comments here..."
//               />
//                 </div>
//             </div>
//           </div>

//           <div className="form-section">
//             <h3 className="section-title">Balance Summary</h3>
//             <div className="balance-grid">
//               <div className="balance-card">
//                 <label className="balance-label">Inward</label>
//                 <input 
//                   type="number" 
//                   value={inward} 
//                   onChange={e => setInward(e.target.value)} 
//                   className="balance-input" 
//                   min="0" 
//                   readOnly // Made readOnly since it comes from API
//                 />
//               </div>
              
//               <div className="balance-card">
//                 <label className="balance-label">Outward</label>
//                 <input 
//                   type="number" 
//                   value={outward} 
//                   onChange={e => setOutward(e.target.value)} 
//                   className="balance-input" 
//                   min="0" 
//                   readOnly // Made readOnly since it comes from API
//                 />
//               </div>
              
//               <div className="balance-card">
//                 <label className="balance-label">Closing Balance</label>
//                 <input 
//                   type="number" 
//                   value={closingBalance} 
//                   onChange={e => setClosingBalance(e.target.value)} 
//                   className="balance-input" 
//                   min="0" 
//                   readOnly // Made readOnly since it comes from API
//                 />
//               </div>
//             </div>
//           </div>

//           <div className="form-section">
//             <h3 className="section-title">Denomination Details</h3>
//             <div className="denomination-table-container">
//               <table className="denomination-table">
//                 <thead>
//                   <tr>
//                     <th>Denomination</th>
//                     <th>Type</th>
//                     <th>No (Good)</th>
//                     <th>No (Bad)</th>
//                     <th>Total Amount</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {denominationConfig.map((denom) => {
//                     const denomData = denominations[denom.value];
//                     const totalAmount = calculateTotalAmount(
//                       denom.value === '20c' ? 20 : 
//                       denom.value === '10c' ? 10 : 
//                       denom.value === '5c' ? 5 : 
//                       denom.value === '1c' ? 1 : denom.value,
//                       denomData.good,
//                       denomData.bad
//                     );

//                     return (
//                       <tr key={denom.value}>
//                         <td className="denom-value">{denom.label}</td>
//                         <td className="denom-type">{denom.type}</td>
//                         <td>
//                           <input
//                             type="number"
//                             min="0"
//                             value={denomData.good}
//                             onChange={(e) => handleDenominationChange(denom.value, 'good', e.target.value)}
//                             className="denom-input good"
//                             placeholder="0"
//                           />
//                         </td>
//                         <td>
//                           <input
//                             type="number"
//                             min="0"
//                             value={denomData.bad}
//                             onChange={(e) => handleDenominationChange(denom.value, 'bad', e.target.value)}
//                             className="denom-input bad"
//                             placeholder="0"
//                           />
//                         </td>
//                         <td className="total-amount">
//                           ₹{totalAmount.toFixed(2)}
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//                 <tfoot>
//                   <tr className="denomination-total">
//                     <td colSpan="2"><strong>Grand Total</strong></td>
//                     <td><strong>Good: ₹{totalGood.toFixed(2)}</strong></td>
//                     <td><strong>Bad: ₹{totalBad.toFixed(2)}</strong></td>
//                     <td><strong>₹{totalAmount.toFixed(2)}</strong></td>
//                   </tr>
//                 </tfoot>
//               </table>
//             </div>
//           </div>

//           {/* Balance Error Message */}
//           {balanceError && (
//             <div className="message error-message">
//               <span className="message-icon">⚠️</span>
//               {balanceError}
//             </div>
//           )}

//           <div className="form-actions">
//             <button 
//               className={`submit-btn ${loading ? 'loading' : ''} ${balanceError ? 'disabled' : ''}`} 
//               type="submit" 
//               disabled={loading || balanceError}
//             >
//               {loading ? (
//                 <>
//                   <span className="spinner"></span>
//                   Saving...
//                 </>
//               ) : (
//                 'Create Day Closing Report'
//               )}
//             </button>
//           </div>

//           {error && (
//             <div className="message error-message">
//               <span className="message-icon">⚠️</span>
//               {error}
//             </div>
//           )}
//           {success && (
//             <div className="message success-message">
//               <span className="message-icon">✅</span>
//               {success}
//             </div>
//           )}
//         </form>
//       </PageCard>
//     </div>
//   );
// }

// export default CreateDayClosing;


import React, { useState } from 'react';
import Sidebar from '../Sidebar';
import PageCard from '../components/PageCard';
import './CreateDayClosing.css';
import { APP_SERVER_URL_PREFIX } from '../constants.js';
import { useNavigate } from 'react-router-dom';

function CreateDayClosing() {
  const [description, setDescription] = useState('Day Closing');
  const [comment, setComment] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [organizationId, setOrganizationId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [inward, setInward] = useState('');
  const [outward, setOutward] = useState('');
  const [closingBalance, setClosingBalance] = useState('');
  
  // Simplified denomination state
  const [selectedDenomination, setSelectedDenomination] = useState('');
  const [goodCount, setGoodCount] = useState('');
  const [badCount, setBadCount] = useState('');
  const [denominationEntries, setDenominationEntries] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [balanceError, setBalanceError] = useState('');
  const navigate = useNavigate();

  const currentUser = localStorage.getItem('username') || localStorage.getItem('user') || '';
  const createdTime = new Date().toISOString();

  // Complete denomination options matching your original structure
  const denominationOptions = [
    { value: 500, label: '₹500 Note', type: 'Note' },
    { value: 200, label: '₹200 Note', type: 'Note' },
    { value: 100, label: '₹100 Note', type: 'Note' },
    { value: 50, label: '₹50 Note', type: 'Note' },
    { value: 20, label: '₹20 Note', type: 'Note' },
    { value: 10, label: '₹10 Note', type: 'Note' },
    { value: 20, label: '20c Coin', type: 'Coin' },
    { value: 10, label: '10c Coin', type: 'Coin' },
    { value: 5, label: '5c Coin', type: 'Coin' },
    { value: 1, label: '1c Coin', type: 'Coin' }
  ];

  React.useEffect(() => {
    import('../organization/organizationApi').then(mod => {
      mod.fetchOrganizations().then(setOrganizations).catch(() => { });
    });
  }, []);

  React.useEffect(() => {
    fetch(`${APP_SERVER_URL_PREFIX}/organizations`)
      .then(res => res.json())
      .then(data => {
        const orgs = data._embedded ? data._embedded.organizations || [] : data;
        setOrganizations(orgs);
      })
      .catch(() => { });
  }, []);

  const handleChange = async (e) => {
    const { name, value, type } = e.target;
    if (type === 'select-one') {
      const selectedOrgId = e.target.value;
      setOrganizationId(selectedOrgId);
      
      if (selectedOrgId && date) {
        await fetchBalanceData(date, selectedOrgId);
      }
    } else if (type === 'date') {
      const selectedDate = e.target.value;
      setDate(selectedDate);
      
      if (organizationId && selectedDate) {
        await fetchBalanceData(selectedDate, organizationId);
      }
    }
  };

  const fetchBalanceData = async (closingDate, orgId) => {
    try {
      const res = await fetch(`${APP_SERVER_URL_PREFIX}/petty-cash/day-closing/init?closingDate=${closingDate}&organizationId=${orgId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        const data = await res.json();
        setInward(data.cashIn || '0');
        setOutward(data.cashOut || '0');
        setClosingBalance(data.closingBalance || '0');
      } else {
        setInward('');
        setOutward('');
        setClosingBalance('');
      }
    } catch (error) {
      console.error('Error fetching balance data:', error);
      setInward('');
      setOutward('');
      setClosingBalance('');
    }
  };

  const addDenominationEntry = () => {
    if (!selectedDenomination) {
      setError('Please select a denomination');
      return;
    }

    // Check if this denomination already exists
    const existingEntry = denominationEntries.find(entry => entry.denomination === parseInt(selectedDenomination));
    if (existingEntry) {
      setError('This denomination has already been added');
      return;
    }

    const denomination = denominationOptions.find(d => d.value === parseInt(selectedDenomination));
    const good = parseInt(goodCount) || 0;
    const bad = parseInt(badCount) || 0;
    
    let denominationValue;
    if (denomination.type === 'Coin') {
     
      denominationValue = parseInt(selectedDenomination) ;
    } else {
      denominationValue = parseInt(selectedDenomination);
    }
    
    const totalAmount = (good + bad) * denominationValue;

    const newEntry = {
      id: Date.now(),
      denomination: parseInt(selectedDenomination),
      label: denomination.label,
      type: denomination.type,
      good,
      bad,
      totalAmount,
      denominationValue // Store the actual monetary value
    };

    setDenominationEntries([...denominationEntries, newEntry]);
    
    // Reset form
    setSelectedDenomination('');
    setGoodCount('');
    setBadCount('');
    setError('');
  };

  const removeDenominationEntry = (id) => {
    setDenominationEntries(denominationEntries.filter(entry => entry.id !== id));
  };

  const getTotalSummary = () => {
    let totalGood = 0;
    let totalBad = 0;
    let totalAmount = 0;

    denominationEntries.forEach(entry => {
      totalGood += entry.good * entry.denominationValue;
      totalBad += entry.bad * entry.denominationValue;
      totalAmount += entry.totalAmount;
    });

    return { totalGood, totalBad, totalAmount };
  };

  const validateClosingBalance = () => {
    const { totalAmount } = getTotalSummary();
    const apiClosingBalance = parseFloat(closingBalance) || 0;
    
    if (Math.abs(totalAmount - apiClosingBalance) > 0.01) {
      setBalanceError(`Closing balance mismatch! Denomination total: ₹${totalAmount.toFixed(2)} vs API closing balance: ₹${apiClosingBalance.toFixed(2)}`);
      return false;
    }
    
    setBalanceError('');
    return true;
  };

  // Format denominations for API exactly like your original working code
  const formatDenominationsForAPI = () => {
    const formatted = {
      // Initialize all fields to 0 like your original code
      500: { good: 0, bad: 0 },
      200: { good: 0, bad: 0 },
      100: { good: 0, bad: 0 },
      50: { good: 0, bad: 0 },
      20: { good: 0, bad: 0 },
      10: { good: 0, bad: 0 },
      '20c': { good: 0, bad: 0 },
      '10c': { good: 0, bad: 0 },
      '5c': { good: 0, bad: 0 },
      '1c': { good: 0, bad: 0 }
    };

    // Populate with actual entries
    denominationEntries.forEach(entry => {
      if (entry.type === 'Coin') {
        // Map coin entries to the correct keys
        switch(entry.denomination) {
          case 20:
            formatted['20c'] = { good: entry.good, bad: entry.bad };
            break;
          case 10:
            formatted['10c'] = { good: entry.good, bad: entry.bad };
            break;
          case 5:
            formatted['5c'] = { good: entry.good, bad: entry.bad };
            break;
          case 1:
            formatted['1c'] = { good: entry.good, bad: entry.bad };
            break;
        }
      } else {
        // Map note entries
        formatted[entry.denomination] = { good: entry.good, bad: entry.bad };
      }
    });

    return formatted;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setBalanceError('');

    if (denominationEntries.length === 0) {
      setError('Please add at least one denomination entry');
      setLoading(false);
      return;
    }

    if (!validateClosingBalance()) {
      setLoading(false);
      return;
    }

    try {
      const desc = typeof description === 'string' && description.trim() ? description.trim() : 'Day Closing';
      
      const {
        totalGood: cashIn,
        totalBad: cashOut,
        totalAmount: closingBalanceCalc
      } = getTotalSummary();

      const denominations = formatDenominationsForAPI();

      // Create payload exactly matching your original working structure
      const payload = {
        closingDate: date,
        description: desc,
        createdBy: currentUser,
        comment: comment,
        createdTime,
        organizationId: organizationId || undefined,
        inward: inward ? Number(inward) : 0,
        outward: outward ? Number(outward) : 0,
        closingBalance: closingBalanceCalc || (closingBalance ? Number(closingBalance) : 0),
        cashIn,
        cashOut,
        tenNoteCount: denominations[10]?.good || 0,
        twentyNoteCount: denominations[20]?.good || 0,
        fiftyNoteCount: denominations[50]?.good || 0,
        hundredNoteCount: denominations[100]?.good || 0,
        twoHundredNoteCount: denominations[200]?.good || 0,
        fiveHundredNoteCount: denominations[500]?.good || 0,
        tenSoiledNoteCount: denominations[10]?.bad || 0,
        twentySoiledNoteCount: denominations[20]?.bad || 0,
        fiftySoiledNoteCount: denominations[50]?.bad || 0,
        hundredSoiledNoteCount: denominations[100]?.bad || 0,
        twoHundredSoiledNoteCount: denominations[200]?.bad || 0,
        fiveHundredSoiledNoteCount: denominations[500]?.bad || 0,
        oneCoinCount: denominations['1c']?.good || 0,
        fiveCoinCount: denominations['5c']?.good || 0,
        tenCoinCount: denominations['10c']?.good || 0,
        twentyCoinCount: denominations['20c']?.good || 0,
        denominations: denominations
      };

      const res = await fetch(`${APP_SERVER_URL_PREFIX}/petty-cash/day-closing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const data = await res.text();
        setError(data);
      } else {
        setSuccess('Day closing created successfully!');
        setTimeout(() => navigate('/pettycash/day-closing'), 1200);
      }
    } catch (e) {
      setError('Failed to create day closing');
    } finally {
      setLoading(false);
    }
  };

  const { totalGood, totalBad, totalAmount } = getTotalSummary();

  React.useEffect(() => {
    if (closingBalance && denominationEntries.length > 0) {
      validateClosingBalance();
    }
  }, [denominationEntries, closingBalance]);

  // Get available denominations (not already added)
  const availableDenominations = denominationOptions.filter(
    option => !denominationEntries.some(entry => entry.denomination === option.value)
  );

  return (
    <div className="day-closing-container">
      <Sidebar isOpen={true} />
      <PageCard title="Create Day Closing Report">
        <form onSubmit={handleSubmit} className="day-closing-form">
          {/* Basic Information Section */}
          <div className="form-section">
            <h3 className="section-title">Basic Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Organization</label>
                <select 
                  value={organizationId} 
                  onChange={handleChange} 
                  className="form-select" 
                  required
                >
                  <option value="">Select organization</option>
                  {organizations.map(org => (
                    <option 
                      key={org.id || (org._links && org._links.self && org._links.self.href)} 
                      value={org.id || (org._links && org._links.self && org._links.self.href.split('/').pop())}
                    >
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Description</label>
                <input 
                  type="text" 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  className="form-input" 
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Date</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={handleChange} 
                  className="form-input" 
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Comment</label>
                <textarea 
                  value={comment} 
                  onChange={e => setComment(e.target.value)} 
                  className="form-input textarea-input"
                  rows={4}
                  placeholder="Enter your comments here..."
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Balance Summary</h3>
            <div className="balance-grid">
              <div className="balance-card">
                <label className="balance-label">Inward</label>
                <input 
                  type="number" 
                  value={inward} 
                  onChange={e => setInward(e.target.value)} 
                  className="balance-input" 
                  min="0" 
                  readOnly
                />
              </div>
              
              <div className="balance-card">
                <label className="balance-label">Outward</label>
                <input 
                  type="number" 
                  value={outward} 
                  onChange={e => setOutward(e.target.value)} 
                  className="balance-input" 
                  min="0" 
                  readOnly
                />
              </div>
              
              <div className="balance-card">
                <label className="balance-label">Closing Balance</label>
                <input 
                  type="number" 
                  value={closingBalance} 
                  onChange={e => setClosingBalance(e.target.value)} 
                  className="balance-input" 
                  min="0" 
                  readOnly
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Add Denomination</h3>
            <div className="denomination-form">
              <div className="denomination-inputs">
                <div className="form-group">
                  <label className="form-label">Denomination</label>
                  <select 
                    value={selectedDenomination} 
                    onChange={e => setSelectedDenomination(e.target.value)}
                    className="form-select"
                  >
                    <option value="">Select denomination</option>
                    {availableDenominations.map(option => (
                      <option key={`${option.value}-${option.type}`} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Good Count</label>
                  <input 
                    type="number" 
                    min="0"
                    value={goodCount} 
                    onChange={e => setGoodCount(e.target.value)}
                    className="form-input"
                    placeholder="0"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Bad Count</label>
                  <input 
                    type="number" 
                    min="0"
                    value={badCount} 
                    onChange={e => setBadCount(e.target.value)}
                    className="form-input"
                    placeholder="0"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">&nbsp;</label>
                  <button 
                    type="button" 
                    onClick={addDenominationEntry}
                    className="add-denomination-btn"
                    disabled={!selectedDenomination}
                  >
                    Add Denomination
                  </button>
                </div>
              </div>
            </div>

            {/* Added Denominations Table */}
            {denominationEntries.length > 0 && (
              <div className="denomination-entries-table">
                <h4 className="entries-title">Added Denominations</h4>
                <div className="denomination-table-container">
                  <table className="denomination-table">
                    <thead>
                      <tr>
                        <th>Denomination</th>
                        <th>Type</th>
                        <th>No (Good)</th>
                        <th>No (Bad)</th>
                        <th>Total Amount</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {denominationEntries.map(entry => (
                        <tr key={entry.id}>
                          <td className="denom-value">{entry.label}</td>
                          <td className="denom-type">{entry.type}</td>
                          <td>{entry.good}</td>
                          <td>{entry.bad}</td>
                          <td className="total-amount">₹{entry.totalAmount.toFixed(2)}</td>
                          <td>
                            <button 
                              type="button" 
                              onClick={() => removeDenominationEntry(entry.id)}
                              className=""
                              style={{color:"red"}}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="denomination-total">
                        <td colSpan="2"><strong>Grand Total</strong></td>
                        <td><strong>Good: ₹{totalGood.toFixed(2)}</strong></td>
                        <td><strong>Bad: ₹{totalBad.toFixed(2)}</strong></td>
                        <td colSpan="2"><strong>₹{totalAmount.toFixed(2)}</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Balance Error Message */}
          {balanceError && (
            <div className="message error-message">
              <span className="message-icon">⚠️</span>
              {balanceError}
            </div>
          )}

          <div className="form-actions">
            <button 
              className={`submit-btn ${loading ? 'loading' : ''} ${balanceError ? 'disabled' : ''}`} 
              type="submit" 
              disabled={loading || balanceError || denominationEntries.length === 0}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Saving...
                </>
              ) : (
                'Create Day Closing Report'
              )}
            </button>
          </div>

          {error && (
            <div className="message error-message">
              <span className="message-icon">⚠️</span>
              {error}
            </div>
          )}
          {success && (
            <div className="message success-message">
              <span className="message-icon">✅</span>
              {success}
            </div>
          )}
        </form>
      </PageCard>
    </div>
  );
}

export default CreateDayClosing;