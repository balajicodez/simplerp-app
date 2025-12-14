// import React, { useState, useEffect } from 'react';
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';
// import Sidebar from '../Sidebar';
// import PageCard from '../components/PageCard';
// import { APP_SERVER_URL_PREFIX } from '../constants.js';

// function DayClosingReport() {
//   const [records, setRecords] = useState([]);
//   const [expenses, setExpenses] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [reportMsg, setReportMsg] = useState('');
//   const [totals, setTotals] = useState({ 
//     cashIn: 0, 
//     cashOut: 0, 
//     startingBalance: 0,
//     expenseCashIn: 0,
//     expenseCashOut: 0 
//   });
//   const [pdfUrl, setPdfUrl] = useState('');
//   const [organizations, setOrganizations] = useState([]);
//   const [selectedOrgId, setSelectedOrgId] = useState('');
//   const [selectedDate, setSelectedDate] = useState('');

//   // Safe number formatting function
//   const safeToLocaleString = (value) => {
//     if (value === null || value === undefined || isNaN(value)) {
//       return '0';
//     }
//     return Number(value).toLocaleString();
//   };

//   useEffect(() => {
//     const today = new Date().toISOString().split('T')[0];
//     setSelectedDate(today);
    
//     const fetchData = async () => {
//       try {
//         setLoading(true);
//         setError('');
        
//         // Fetch day closing data
//         const response = await fetch(`${APP_SERVER_URL_PREFIX}/pettyCashDayClosings`);
//         if (!response.ok) {
//           throw new Error('Failed to fetch day closing data');
//         }
//         const data = await response.json();
//         const list = data._embedded ? data._embedded.pettyCashDayClosings || [] : data;
//         setRecords(list);
        
//         // Fetch expenses data
//         try {
//           const expensesResponse = await fetch(`${APP_SERVER_URL_PREFIX}/expenses?page=0&size=1000`);
//           if (expensesResponse.ok) {
//             const expensesData = await expensesResponse.json();
//             const expensesList = expensesData.content || expensesData || [];
//             setExpenses(expensesList);
//           }
//         } catch (expenseError) {
//           console.warn('Could not fetch expenses:', expenseError);
//         }
        
//         setLoading(false);
//       } catch (err) {
//         setError('Failed to fetch day closing records');
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, [selectedOrgId]);

//   useEffect(() => {
//     // Calculate totals when records or expenses change
//     const cashInTotal = records.reduce((sum, rec) => sum + (Number(rec.cashIn) || 0), 0);
//     const cashOutTotal = records.reduce((sum, rec) => sum + (Number(rec.cashOut) || 0), 0);
    
//     // Expense categorization logic
//     const expenseCashInTotal = expenses.reduce((sum, expense) => {
//       const isCashIn = expense.expenseType === 'CASH-IN';
//       return isCashIn ? sum + (Number(expense.amount) || 0) : sum;
//     }, 0);
    
//     const expenseCashOutTotal = expenses.reduce((sum, expense) => {
//       const isCashOut = expense.expenseType === 'CASH-OUT';
//       return isCashOut ? sum + (Number(expense.amount) || 0) : sum;
//     }, 0);

//     // Safe starting balance calculation
//     let startingBalance = 0;
//     if (records.length > 0 && records[0].startingBalance) {
//       startingBalance = Number(records[0].startingBalance) || 0;
//     }
    
//     setTotals({ 
//       cashIn: cashInTotal, 
//       cashOut: cashOutTotal, 
//       startingBalance: startingBalance,
//       expenseCashIn: expenseCashInTotal,
//       expenseCashOut: expenseCashOutTotal
//     });
//   }, [records, expenses]);

//   useEffect(() => {
//     // Fetch organizations for dropdown
//     fetch(`${APP_SERVER_URL_PREFIX}/organizations`)
//       .then(res => res.json())
//       .then(data => {
//         const orgs = data._embedded ? data._embedded.organizations || [] : data;
//         setOrganizations(orgs);
//       })
//       .catch(() => { });
//   }, []);

//   // Date filtering for expenses
//   const getExpensesForDate = (date) => {
//     return expenses.filter(expense => {
//       if (!expense.createdDate && !expense.transactionDate) return false;
      
//       const expenseDateStr = expense.createdDate || expense.transactionDate;
//       if (!expenseDateStr) return false;
      
//       try {
//         const expenseDate = new Date(expenseDateStr).toISOString().split('T')[0];
//         return expenseDate === date;
//       } catch (error) {
//         console.warn('Invalid date format for expense:', expenseDateStr);
//         return false;
//       }
//     });
//   };

//   // Expense categorization
//   const categorizeExpenses = (expensesList) => {
//     const cashInExpenses = expensesList.filter(expense => expense.expenseType === 'CASH-IN');
//     const cashOutExpenses = expensesList.filter(expense => expense.expenseType === 'CASH-OUT');

//     return { cashInExpenses, cashOutExpenses };
//   };

//   const handleGenerateReport = () => {
//     try {
//       const filteredRecords = records.filter(rec => rec.closingDate === selectedDate);
//       const filteredExpenses = getExpensesForDate(selectedDate);
//       const { cashInExpenses, cashOutExpenses } = categorizeExpenses(filteredExpenses);
      
//       console.log('Filtered Expenses:', filteredExpenses);
//       console.log('Cash Out Expenses:', cashOutExpenses);
//       console.log('Cash In Expenses:', cashInExpenses);
      
//       if (filteredRecords.length === 0 && filteredExpenses.length === 0) {
//         setReportMsg('No records found for the selected date');
//         return;
//       }

//       const doc = new jsPDF();
      
//       const selectedRecord = filteredRecords[0];
//       const startingBalance = Number(selectedRecord?.startingBalance) || 0;

//       // Header Section
//       doc.setFontSize(26);
//       doc.text('Sri Divya Sarees', 105, 18, { align: 'center' });
//       doc.setFontSize(12);
//       doc.text('Old Temple Road, Gulzar House, Hyderabad 500066', 105, 26, { align: 'center' });   
//       doc.setFontSize(11);
//       doc.setLineWidth(0.5);
//       doc.line(20, 32, 190, 32);
//       doc.setFontSize(14);
//       doc.text(`Day Closing Report - ${selectedDate}`, 14, 40, { align: "left" });
//       doc.setFontSize(13);
//       doc.text(`Opening Balance:  ${safeToLocaleString(startingBalance)}`, 158, 40, { align: 'right', marginTop: "20px" });
      
//       let currentY = 48;

//       // Day Closing Summary Table
//       if (filteredRecords.length > 0) {
//         const mainTableColumn = [
//           'Closing Date',
//           'Description',
//           'Created By',
//           'Created Time',
//           'Total Cash-In',
//           'Total Cash-Out'
//         ];
        
//         const mainTableRows = filteredRecords.map(rec => [
//           rec.closingDate || '',
//           rec.description || '',
//           rec.createdBy || '',
//           rec.createdTime || '',
//           rec.cashIn ? ` ${safeToLocaleString(rec.cashIn)}` : '-',
//           rec.cashOut ? ` ${safeToLocaleString(rec.cashOut)}` : '-'
//         ]);

//         autoTable(doc, {
//           startY: currentY,
//           head: [mainTableColumn],
//           body: mainTableRows,
//           theme: 'grid',
//           headStyles: { fillColor: [11, 59, 114] },
//           styles: { fontSize: 10 }
//         });

//         currentY = doc.lastAutoTable.finalY + 10;
//       }

//       // Expenses Section - Cash Out
//       if (cashOutExpenses.length > 0) {
//         doc.setFontSize(12);
//         doc.text('Expenses - Cash Out', 20, currentY);
//         currentY += 8;

//         const cashOutColumns = ['ID', 'Amount', 'Description', 'Date', 'Type'];
//         const cashOutRows = cashOutExpenses.map(expense => [
//           expense.id || 'N/A',
//           ` ${safeToLocaleString(expense.amount)}`,
//           expense.description || 'General',
//           new Date(expense.createdDate || expense.transactionDate).toLocaleDateString(),
//           expense.expenseSubType || 'CASH-OUT'
//         ]);

//         autoTable(doc, {
//           startY: currentY,
//           head: [cashOutColumns],
//           body: cashOutRows,
//           theme: 'grid',
//           headStyles: { fillColor: [220, 53, 69] },
//           styles: { fontSize: 9 }
//         });

//         currentY = doc.lastAutoTable.finalY + 10;
//       }

//       // Expenses Section - Cash In
//       if (cashInExpenses.length > 0) {
//         doc.setFontSize(12);
//         doc.text('Expenses - Cash In', 20, currentY);
//         currentY += 8;

//         const cashInColumns = ['ID', 'Amount', 'Description', 'Date', 'Type'];
//         const cashInRows = cashInExpenses.map(expense => [
//           expense.id || 'N/A',
//           ` ${safeToLocaleString(expense.amount)}`,
//           expense.description || 'General',
//           new Date(expense.createdDate || expense.transactionDate).toLocaleDateString(),
//           expense.expenseSubType || 'CASH-IN'
//         ]);

//         autoTable(doc, {
//           startY: currentY,
//           head: [cashInColumns],
//           body: cashInRows,
//           theme: 'grid',
//           headStyles: { fillColor: [34, 139, 34] },
//           styles: { fontSize: 9 }
//         });

//         currentY = doc.lastAutoTable.finalY + 10;
//       }

//       // Detailed Day Closing Records
//       filteredRecords.forEach((rec, index) => {
//         if (index > 0) {
//           doc.addPage();
//           currentY = 20;
//         }

//         if (filteredRecords.length > 0) {
//           doc.setFontSize(12);
//           doc.text(`Day Closing Details - ${rec.closingDate}`, 20, currentY);
//           currentY += 10;

//           const infoTableData = [
//             ['Description:', rec.description || ''],
//             ['Created By:', rec.createdBy || ''],
//             ['Created Time:', rec.createdTime || ''],
//             ['Starting Balance:', rec.startingBalance ? ` ${safeToLocaleString(rec.startingBalance)}` : ' 0'],
//             ['Cash In:', rec.cashIn ? ` ${safeToLocaleString(rec.cashIn)}` : ' 0'],
//             ['Cash Out:', rec.cashOut ? ` ${safeToLocaleString(rec.cashOut)}` : ' 0'],
//             ['Closing Balance:', rec.closingBalance ? ` ${safeToLocaleString(rec.closingBalance)}` : ' 0']
//           ];

//           autoTable(doc, {
//             startY: currentY,
//             body: infoTableData,
//             theme: 'grid',
//             styles: { fontSize: 10 },
//             columnStyles: {
//               0: { fontStyle: 'bold', fillColor: [240, 240, 240] }
//             }
//           });

//           currentY = doc.lastAutoTable.finalY + 15;

//           // Coins and Notes Summary
//           doc.setFontSize(11);
//           doc.text('Coins Summary', 20, currentY);
//           currentY += 8;

//           const coinsData = [
//             ['1  Coin', '5  Coin', '10  Coin', '20  Coin'],
//             [
//               rec._1CoinCount || 0,
//               rec._5CoinCount || 0,
//               rec._10CoinCount || 0,
//               rec._20CoinCount || 0
//             ]
//           ];

//           autoTable(doc, {
//             startY: currentY,
//             head: [coinsData[0]],
//             body: [coinsData[1]],
//             theme: 'grid',
//             headStyles: { fillColor: [11, 59, 114] },
//             styles: { fontSize: 10, halign: 'center' }
//           });

//           currentY = doc.lastAutoTable.finalY + 15;

//           doc.setFontSize(11);
//           doc.text('Notes Summary', 20, currentY);
//           currentY += 8;

//           const notesHead = ['10  Note', '20  Note', '50  Note', '100  Note', '200  Note', '500  Note'];
//           const notesData = [
//             rec._10NoteCount || 0,
//             rec._20NoteCount || 0,
//             rec._50NoteCount || 0,
//             rec._100NoteCount || 0,
//             rec._200NoteCount || 0,
//             rec._500NoteCount || 0
//           ];

//           autoTable(doc, {
//             startY: currentY,
//             head: [notesHead],
//             body: [notesData],
//             theme: 'grid',
//             headStyles: { fillColor: [11, 59, 114] },
//             styles: { fontSize: 10, halign: 'center' }
//           });

//           currentY = doc.lastAutoTable.finalY + 15;

//           doc.setFontSize(11);
//           doc.text('Soiled Notes Summary', 20, currentY);
//           currentY += 8;

//           const soiledNotesHead = ['10  Soiled', '20  Soiled', '50  Soiled', '100  Soiled', '200  Soiled', '500  Soiled'];
//           const soiledNotesData = [
//             rec._10SoiledNoteCount || 0,
//             rec._20SoiledNoteCount || 0,
//             rec._50SoiledNoteCount || 0,
//             rec._100SoiledNoteCount || 0,
//             rec._200SoiledNoteCount || 0,
//             rec._500SoiledNoteCount || 0
//           ];

//           autoTable(doc, {
//             startY: currentY,
//             head: [soiledNotesHead],
//             body: [soiledNotesData],
//             theme: 'grid',
//             headStyles: { fillColor: [139, 0, 0] },
//             styles: { fontSize: 10, halign: 'center' }
//           });
//         }
//       });

//       // Grand Summary Page
//       doc.addPage();
//       doc.setFontSize(16);
//       doc.text(`Grand Summary - ${selectedDate}`, 105, 20, { align: 'center' });
      
//       const dateCashInTotal = filteredRecords.reduce((sum, rec) => sum + (Number(rec.cashIn) || 0), 0);
//       const dateCashOutTotal = filteredRecords.reduce((sum, rec) => sum + (Number(rec.cashOut) || 0), 0);
      
//       const expenseCashInTotal = cashInExpenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
//       const expenseCashOutTotal = cashOutExpenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);

//       const totalCashIn = dateCashInTotal + expenseCashInTotal;
//       const totalCashOut = dateCashOutTotal + expenseCashOutTotal;
//       const netCashFlow = totalCashIn - totalCashOut;
//       const closingBalance = startingBalance + netCashFlow;

//       const summaryData = [
//         ['Starting Balance:', ` ${safeToLocaleString(startingBalance)}`],
//         ['', ''],
//         ['PETTY CASH SUMMARY:', ''],
//         ['Petty Cash - Cash In:', ` ${safeToLocaleString(dateCashInTotal)}`],
//         ['Petty Cash - Cash Out:', ` ${safeToLocaleString(dateCashOutTotal)}`],
//         ['', ''],
//         ['EXPENSES SUMMARY:', ''],
//         ['Expenses - Cash Out:', ` ${safeToLocaleString(expenseCashOutTotal)}`],
//         ['Expenses - Cash In:', ` ${safeToLocaleString(expenseCashInTotal)}`],
//         ['', ''],
//         ['TOTAL SUMMARY:', ''],
//         ['Total Cash In:', ` ${safeToLocaleString(totalCashIn)}`],
//         ['Total Cash Out:', ` ${safeToLocaleString(totalCashOut)}`],
//         ['Net Cash Flow:', ` ${safeToLocaleString(netCashFlow)}`],
//         ['Closing Balance:', ` ${safeToLocaleString(closingBalance)}`]
//       ];

//       autoTable(doc, {
//         startY: 30,
//         body: summaryData,
//         theme: 'grid',
//         styles: { fontSize: 12 },
//         columnStyles: {
//           0: { fontStyle: 'bold', fillColor: [240, 240, 240] },
//           1: { fontStyle: 'bold' }
//         },
//         bodyStyles: {
//           minCellHeight: 8
//         }
//       });

//       // Add expenses summary statistics
//       const expensesSummaryY = doc.lastAutoTable.finalY + 15;
//       doc.setFontSize(12);
//       doc.text('Expenses Statistics', 20, expensesSummaryY);
      
//       const expensesSummaryData = [
//         ['Total Cash Out Expenses:', cashOutExpenses.length],
//         ['Total Cash In Expenses:', cashInExpenses.length],
//         ['Total Cash Out Amount:', ` ${safeToLocaleString(expenseCashOutTotal)}`],
//         ['Total Cash In Amount:', ` ${safeToLocaleString(expenseCashInTotal)}`],
//         ['Net Expense Movement:', ` ${safeToLocaleString(expenseCashInTotal - expenseCashOutTotal)}`]
//       ];

//       autoTable(doc, {
//         startY: expensesSummaryY + 8,
//         body: expensesSummaryData,
//         theme: 'grid',
//         styles: { fontSize: 11 },
//         columnStyles: {
//           0: { fontStyle: 'bold', fillColor: [240, 240, 240] }
//         }
//       });

//       const url = doc.output('bloburl');
//       setPdfUrl(url);
//       setReportMsg(`PDF generated successfully for ${selectedDate}!`);
      
//     } catch (e) {
//       console.error('PDF generation error:', e);
//       setReportMsg('Failed to generate PDF');
//     }
//   };

//   const styles = {
//     container: {
//       minHeight: '100vh',
//       backgroundColor: '#f8fafc'
//     },
    
//     headerSection: {
//       display: 'flex',
//       flexDirection: 'row',
//       justifyContent: 'space-between',
//       alignItems: 'center',
//       marginBottom: '24px',
//       padding: '6px 0',
//       borderBottom: '1px solid #e2e8f0',
//       gap: '20px',
//     },
    
//     dateSelector: {
//       display: 'flex',
//       alignItems: 'center',
//       gap: '12px',
//     },
    
//     dateLabel: {
//       fontWeight: '600',
//       color: '#374151',
//       fontSize: '14px',
//     },
    
//     dateInput: {
//       padding: '8px 12px',
//       border: '1px solid #d1d5db',
//       borderRadius: '6px',
//       fontSize: '14px',
//       backgroundColor: 'white',
//       boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
//     },
    
//     generateButton: {
//       background: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)',
//       color: 'white',
//       border: 'none',
//       padding: '12px 14px',
//       borderRadius: '8px',
//       fontWeight: '600',
//       fontSize: '14px',
//       cursor: 'pointer',
//       transition: 'all 0.3s ease',
//       boxShadow: '0 2px 4px rgba(30, 58, 138, 0.3)',
//       whiteSpace: 'nowrap',
//     },
    
//     summaryContainer: {
//       display: 'grid',
//       gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
//       gap: '20px',
//       marginBottom: '24px',
//       padding: '0 16px',
//     },
    
//     summaryCard: {
//       background: 'white',
//       padding: '5px',
//       borderRadius: '12px',
//       boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//       textAlign: 'center',
//       border: '1px solid #e2e8f0'
//     },
//     cashInCard: {
//       borderLeft: '4px solid #2563eb',
//       background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
//     },
//     cashOutCard: {
//       borderLeft: '4px solid #dc2626',
//       background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
//     },
//     netBalanceCard: {
//       borderLeft: '4px solid #059669',
//       background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
//     },
//     summaryAmount: {
//       fontSize: '24px',
//       fontWeight: '700',
//       marginTop: '8px'
//     },
    
//     tableContainer: {
//       background: 'white',
//       borderRadius: '12px',
//       overflow: 'auto',
//       height: '400px',
//       boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//       marginBottom: '24px',
//     },
//     table: {
//       width: '100%',
//       borderCollapse: 'collapse',
//     },
//     tableHeader: {
//       background: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)',
//       color: 'white'
//     },
//     tableHeaderCell: {
//       padding: '16px 12px',
//       textAlign: 'left',
//       fontWeight: '600',
//       fontSize: '14px',
//       borderBottom: '2px solid #e2e8f0'
//     },
//     tableCell: {
//       padding: '14px 12px',
//       borderBottom: '1px solid #f1f5f9',
//       fontSize: '14px'
//     },
//     tableRow: {
//       transition: 'background-color 0.2s ease',
//     },
    
//     notesSection: {
//       marginTop: '32px'
//     },
//     notesHeader: {
//       textAlign: 'center',
//       color: '#1e3a8a',
//       marginBottom: '16px',
//       fontSize: '20px',
//       fontWeight: '600'
//     },
//     scrollableContainer: {
//       maxHeight: '500px',
//       overflow: 'auto',
//       border: '1px solid #e2e8f0',
//       borderRadius: '12px',
//       background: 'white',
//       boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//     },
    
//     successMessage: {
//       color: '#059669',
//       backgroundColor: '#f0fdf4',
//       padding: '12px 16px',
//       borderRadius: '8px',
//       border: '1px solid #bbf7d0',
//       marginBottom: '16px',
//       fontWeight: '500'
//     },
//     errorMessage: {
//       color: '#dc2626',
//       backgroundColor: '#fef2f2',
//       padding: '12px 16px',
//       borderRadius: '8px',
//       border: '1px solid #fecaca',
//       marginBottom: '16px',
//       fontWeight: '500'
//     },
    
//     pdfModal: {
//       position: 'fixed',
//       top: 0,
//       left: 0,
//       width: '100vw',
//       height: '100vh',
//       background: 'rgba(0,0,0,0.6)',
//       zIndex: 9999,
//       display: 'flex',
//       alignItems: 'center',
//       justifyContent: 'center',
//       backdropFilter: 'blur(4px)'
//     },
//     pdfContainer: {
//       background: '#fff',
//       borderRadius: '12px',
//       boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
//       padding: '20px',
//       maxWidth: '90vw',
//       maxHeight: '90vh',
//       position: 'relative',
//       border: '1px solid #e2e8f0'
//     },
//     closeButton: {
//       position: 'absolute',
//       top: '-10px',
//       right: '-10px',
//       fontSize: '20px',
//       background: '#fff',
//       border: 'none',
//       cursor: 'pointer',
//       color: '#645c5c',
//       width: '30px',
//       height: '30px',
//       borderRadius: '50%',
//       display: 'flex',
//       alignItems: 'center',
//       justifyContent: 'center',
//       backgroundColor: '#eef1f4',
//       boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
//     },
    
//     loadingContainer: {
//       display: 'flex',
//       justifyContent: 'center',
//       alignItems: 'center',
//       padding: '40px',
//       color: '#64748b',
//       fontSize: '16px'
//     },
    
//     expensesSection: {
//       marginTop: '32px',
//       background: 'white',
//       borderRadius: '12px',
//       padding: '20px',
//       boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//     },
//     expensesHeader: {
//       color: '#1e3a8a',
//       marginBottom: '20px',
//       fontSize: '18px',
//       fontWeight: '600',
//       textAlign: 'center'
//     }
//   };

//   const expensesForSelectedDate = getExpensesForDate(selectedDate);
//   const { cashInExpenses, cashOutExpenses } = categorizeExpenses(expensesForSelectedDate);

//   return (
//     <div style={styles.container}>
//       <Sidebar isOpen={true} />
//       <PageCard title="Day Closing Report">
//         <div style={styles.headerSection}>
//           <div style={styles.dateSelector}>
//             <label style={styles.dateLabel}>Select Date To Generate Report:</label>
//             <input
//               type="date"
//               value={selectedDate}
//               onChange={(e) => setSelectedDate(e.target.value)}
//               style={styles.dateInput}
//             />
//           </div>
//           <button 
//             style={styles.generateButton}
//             onClick={handleGenerateReport}
//             onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
//             onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
//           >
//             📊 Generate Report
//           </button>
//         </div>

//         {pdfUrl && (
//           <div style={styles.pdfModal}>
//             <div style={styles.pdfContainer}>
//               <button 
//                 style={styles.closeButton}
//                 onClick={() => { setPdfUrl(''); }}
//               >
//                 ×
//               </button>
//               <iframe 
//                 src={pdfUrl} 
//                 title="Day Closing PDF Report" 
//                 style={{ 
//                   width: '70vw', 
//                   height: '75vh', 
//                   border: 'none',
//                   borderRadius: '8px'
//                 }} 
//               />
//               <div style={{ textAlign: 'right', marginTop: '16px' }}>
//                 <a 
//                   href={pdfUrl} 
//                   download={`DayClosingReport_${selectedDate}.pdf`} 
//                   style={{
//                     ...styles.generateButton,
//                     textDecoration: 'none',
//                     display: 'inline-block'
//                   }}
//                 >
//                   📥 Download PDF
//                 </a>
//               </div>
//             </div>
//           </div>
//         )}
        
//         {reportMsg && (
//           <div style={reportMsg.includes('Failed') ? styles.errorMessage : styles.successMessage}>
//             {reportMsg.includes('Failed') ? '❌' : '✅'} {reportMsg}
//           </div>
//         )}
//         {error && <div style={styles.errorMessage}>❌ {error}</div>}
        
//         {loading ? (
//           <div style={styles.loadingContainer}>
//             <div>Loading day closing records and expenses...</div>
//           </div>
//         ) : (
//           <>
//             <div style={styles.summaryContainer}>
//               <div style={{...styles.summaryCard, ...styles.cashInCard}}>
//                 <div style={{color: '#2563eb', fontWeight: '600', fontSize: '14px'}}>Total Cash-In</div>
//                 <div style={{...styles.summaryAmount, color: '#2563eb'}}>
//                   {safeToLocaleString(totals.cashIn + totals.expenseCashIn)}
//                 </div>
//                 <div style={{fontSize: '12px', color: '#64748b', marginTop: '8px'}}>
//                   Petty Cash: {safeToLocaleString(totals.cashIn)}
//                 </div>
//                 <div style={{fontSize: '12px', color: '#64748b'}}>
//                   Expenses: {safeToLocaleString(totals.expenseCashIn)}
//                 </div>
//               </div>
//               <div style={{...styles.summaryCard, ...styles.cashOutCard}}>
//                 <div style={{color: '#dc2626', fontWeight: '600', fontSize: '14px'}}>Total Cash-Out</div>
//                 <div style={{...styles.summaryAmount, color: '#dc2626'}}>
//                   {safeToLocaleString(totals.cashOut + totals.expenseCashOut)}
//                 </div>
//                 <div style={{fontSize: '12px', color: '#64748b', marginTop: '8px'}}>
//                   Petty Cash: {safeToLocaleString(totals.cashOut)}
//                 </div>
//                 <div style={{fontSize: '12px', color: '#64748b'}}>
//                   Expenses: {safeToLocaleString(totals.expenseCashOut)}
//                 </div>
//               </div>
//               <div style={{...styles.summaryCard, ...styles.netBalanceCard}}>
//                 <div style={{color: '#059669', fontWeight: '600', fontSize: '14px'}}>Net Balance</div>
//                 <div style={{...styles.summaryAmount, color: '#059669'}}>
//                   {safeToLocaleString((totals.cashIn + totals.expenseCashIn) - (totals.cashOut + totals.expenseCashOut))}
//                 </div>
//                 <div style={{fontSize: '12px', color: '#64748b', marginTop: '8px'}}>
//                   Including both Petty Cash & Expenses
//                 </div>
//               </div>
//             </div>

//             {/* Expenses Section */}
//             {(cashInExpenses.length > 0 || cashOutExpenses.length > 0) && (
//               <div style={styles.expensesSection}>
//                 <h3 style={styles.expensesHeader}>Expenses for {selectedDate}</h3>

//                 <div style={{
//                   display: "flex",
//                   flexDirection: "row",
//                   justifyContent: "space-between",
//                   gap: "20px",
//                   width: "100%"
//                 }}>

//                   {/* LEFT: CASH IN */}
//                   <div style={{
//                     flex: 1,
//                     minWidth: "48%"
//                   }}>
//                     <h4 style={{ color: '#059669', marginBottom: '10px' }}>
//                       Cash In Expenses
//                     </h4>

//                     <div style={{
//                       ...styles.tableContainer,
//                       width: "100%",
//                       height: "auto"
//                     }}>
//                       <table style={styles.table}>
//                         <thead style={styles.tableHeader}>
//                           <tr>
//                             <th style={styles.tableHeaderCell}>ID</th>
//                             <th style={styles.tableHeaderCell}>Amount</th>
//                             <th style={styles.tableHeaderCell}>Description</th>
//                             <th style={styles.tableHeaderCell}>Type</th>
//                           </tr>
//                         </thead>
//                         <tbody>
//                           {cashInExpenses.map((expense, idx) => (
//                             <tr key={idx} style={styles.tableRow}>
//                               <td style={styles.tableCell}>{expense.id || 'N/A'}</td>
//                               <td style={{ ...styles.tableCell, color: '#059669', fontWeight: '600' }}>
//                                 {safeToLocaleString(expense.amount)}
//                               </td>
//                               <td style={styles.tableCell}>{expense.description || 'General'}</td>
//                               <td style={styles.tableCell}>{expense.expenseSubType || 'CASH-IN'}</td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>
//                   </div>

//                   {/* RIGHT: CASH OUT */}
//                   <div style={{
//                     flex: 1,
//                     minWidth: "48%"
//                   }}>
//                     <h4 style={{ color: '#dc2626', marginBottom: '10px' }}>
//                       Cash Out Expenses
//                     </h4>

//                     <div style={{
//                       ...styles.tableContainer,
//                       width: "100%",      
//                       height: "auto"
//                     }}>
//                       <table style={styles.table}>
//                         <thead style={styles.tableHeader}>
//                           <tr>
//                             <th style={styles.tableHeaderCell}>ID</th>
//                             <th style={styles.tableHeaderCell}>Amount</th>
//                             <th style={styles.tableHeaderCell}>Description</th>
//                             <th style={styles.tableHeaderCell}>Type</th>
//                           </tr>
//                         </thead>
//                         <tbody>
//                           {cashOutExpenses.map((expense, idx) => (
//                             <tr key={idx} style={styles.tableRow}>
//                               <td style={styles.tableCell}>{expense.id || 'N/A'}</td>
//                               <td style={{ ...styles.tableCell, color: '#dc2626', fontWeight: '600' }}>
//                                 {safeToLocaleString(expense.amount)}
//                               </td>
//                               <td style={styles.tableCell}>{expense.description || 'General'}</td>
//                               <td style={styles.tableCell}>{expense.expenseSubType || 'CASH-OUT'}</td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>
//                   </div>

//                 </div>
//               </div>
//             )}

//             {/* Existing Tables for Day Closing and Notes Summary */}
//             <div style={styles.tableContainer}>
//               <table className="payroll-table" style={styles.table}>
//                 <thead style={styles.tableHeader}>
//                   <tr>
//                     <th style={styles.tableHeaderCell}>Date</th>
//                     <th style={styles.tableHeaderCell}>Description</th>
//                     <th style={styles.tableHeaderCell}>Created By</th>
//                     <th style={styles.tableHeaderCell}>Created Time</th>
//                     <th style={styles.tableHeaderCell}>Starting Balance</th>
//                     <th style={styles.tableHeaderCell}>Credit</th>
//                     <th style={styles.tableHeaderCell}>Debit</th>
//                     <th style={styles.tableHeaderCell}>Closing Balance</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {records.map((rec, idx) => (
//                     <tr key={idx} style={styles.tableRow}>
//                       <td style={styles.tableCell}>{rec.closingDate}</td>
//                       <td style={styles.tableCell}>{rec.description}</td>
//                       <td style={styles.tableCell}>{rec.createdBy}</td>
//                       <td style={styles.tableCell}>{rec.createdTime}</td>
//                       <td style={styles.tableCell}>{safeToLocaleString(rec.startingBalance)}</td>
//                       <td style={{...styles.tableCell, color: '#059669', fontWeight: '500'}}>
//                         {rec.cashIn ? ` ${safeToLocaleString(rec.cashIn)}` : '-'}
//                       </td>
//                       <td style={{...styles.tableCell, color: '#dc2626', fontWeight: '500'}}>
//                         {rec.cashOut ? ` ${safeToLocaleString(rec.cashOut)}` : '-'}
//                       </td>
//                       <td style={{...styles.tableCell, color: '#1e3a8a', fontWeight: '600'}}>
//                         {safeToLocaleString(rec.closingBalance)}
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
            
//             <div style={styles.notesSection}>
//               <h3 style={styles.notesHeader}>Notes & Coin Summary</h3>
//               <div style={styles.scrollableContainer}>
//                 <table className="payroll-table" style={{...styles.table, minWidth: '100%'}}>
//                   <thead style={styles.tableHeader}>
//                     <tr>
//                       <th style={styles.tableHeaderCell}>Date</th>
//                       <th style={styles.tableHeaderCell}>1  Coin</th>
//                       <th style={styles.tableHeaderCell}>5  Coin</th>
//                       <th style={styles.tableHeaderCell}>10  Coin</th>
//                       <th style={styles.tableHeaderCell}>20  Coin</th>
//                       <th style={styles.tableHeaderCell}>10  Note</th>
//                       <th style={styles.tableHeaderCell}>20  Note</th>
//                       <th style={styles.tableHeaderCell}>50  Note</th>
//                       <th style={styles.tableHeaderCell}>100  Note</th>
//                       <th style={styles.tableHeaderCell}>200  Note</th>
//                       <th style={styles.tableHeaderCell}>500  Note</th>
//                       <th style={styles.tableHeaderCell}>10  Soiled</th>
//                       <th style={styles.tableHeaderCell}>20  Soiled</th>
//                       <th style={styles.tableHeaderCell}>50  Soiled</th>
//                       <th style={styles.tableHeaderCell}>100  Soiled</th>
//                       <th style={styles.tableHeaderCell}>200  Soiled</th>
//                       <th style={styles.tableHeaderCell}>500  Soiled</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {records.map((rec, idx) => (
//                       <tr key={idx} style={styles.tableRow}>
//                         <td style={styles.tableCell}>{rec.closingDate}</td>
//                         <td style={styles.tableCell}>{rec._1CoinCount || 0}</td>
//                         <td style={styles.tableCell}>{rec._5CoinCount || 0}</td>
//                         <td style={styles.tableCell}>{rec._10CoinCount || 0}</td>
//                         <td style={styles.tableCell}>{rec._20CoinCount || 0}</td>
//                         <td style={styles.tableCell}>{rec._10NoteCount || 0}</td>
//                         <td style={styles.tableCell}>{rec._20NoteCount || 0}</td>
//                         <td style={styles.tableCell}>{rec._50NoteCount || 0}</td>
//                         <td style={styles.tableCell}>{rec._100NoteCount || 0}</td>
//                         <td style={styles.tableCell}>{rec._200NoteCount || 0}</td>
//                         <td style={styles.tableCell}>{rec._500NoteCount || 0}</td>
//                         <td style={{...styles.tableCell, color: '#dc2626'}}>{rec._10SoiledNoteCount || 0}</td>
//                         <td style={{...styles.tableCell, color: '#dc2626'}}>{rec._20SoiledNoteCount || 0}</td>
//                         <td style={{...styles.tableCell, color: '#dc2626'}}>{rec._50SoiledNoteCount || 0}</td>
//                         <td style={{...styles.tableCell, color: '#dc2626'}}>{rec._100SoiledNoteCount || 0}</td>
//                         <td style={{...styles.tableCell, color: '#dc2626'}}>{rec._200SoiledNoteCount || 0}</td>
//                         <td style={{...styles.tableCell, color: '#dc2626'}}>{rec._500SoiledNoteCount || 0}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           </>
//         )}
//       </PageCard>
//     </div>
//   );
// }

// export default DayClosingReport;
import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Sidebar from '../Sidebar';
import PageCard from '../components/PageCard';
import { APP_SERVER_URL_PREFIX } from '../constants.js';

function DayClosingReport() {
  const [records, setRecords] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [handloans, setHandloans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportMsg, setReportMsg] = useState('');
  const [totals, setTotals] = useState({ 
    cashIn: 0, 
    cashOut: 0, 
    startingBalance: 0,
    expenseCashIn: 0,
    expenseCashOut: 0,
    handloanCashIn: 0,
    handloanCashOut: 0
  });
  const [pdfUrl, setPdfUrl] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [organizationId, setOrganizationId] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // Safe number formatting function
  const safeToLocaleString = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return '0';
    }
    return Number(value).toLocaleString();
  };

  useEffect(() => {
    const bearerToken = localStorage.getItem('token');
    fetch(`${APP_SERVER_URL_PREFIX}/organizations`, {
      headers: { 'Authorization': `Bearer ${bearerToken}` }
    })
      .then(res => res.json())
      .then(data => {
        const orgs = data._embedded ? data._embedded.organizations || [] : data;
        setOrganizations(orgs);
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Fetch day closing data
        const bearerToken = localStorage.getItem('token');
        const response = await fetch(`${APP_SERVER_URL_PREFIX}/pettyCashDayClosings`, {
          headers: { 'Authorization': `Bearer ${bearerToken}` }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch day closing data');
        }
        const data = await response.json();
        const list = data._embedded ? data._embedded.pettyCashDayClosings || [] : data;
        setRecords(list);
        
        // Fetch expenses data
        try {
          const expensesResponse = await fetch(`${APP_SERVER_URL_PREFIX}/expenses?page=0&size=20`, {
            headers: { 'Authorization': `Bearer ${bearerToken}` }
          });
          if (expensesResponse.ok) {
            const expensesData = await expensesResponse.json();
            const expensesList = expensesData.content || expensesData || [];
            setExpenses(expensesList);
          }
        } catch (expenseError) {
          console.warn('Could not fetch expenses:', expenseError);
        }
        
        // Fetch handloans data
        try {
          const bearerToken = localStorage.getItem('token');
          const handloansResponse = await fetch(`${APP_SERVER_URL_PREFIX}/handloans/all?page=0&size=20`, {
            headers: { 'Authorization': `Bearer ${bearerToken}` }
          });
          if (handloansResponse.ok) {
            const handloansData = await handloansResponse.json();
            const handloansList = handloansData.content || handloansData || [];
            setHandloans(handloansList);
          }
        } catch (handloanError) {
          console.warn('Could not fetch handloans:', handloanError);
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch day closing records');
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedOrgId]);

  useEffect(() => {
    // Calculate totals when records, expenses, or handloans change
    const cashInTotal = records.reduce((sum, rec) => sum + (Number(rec.cashIn) || 0), 0);
    const cashOutTotal = records.reduce((sum, rec) => sum + (Number(rec.cashOut) || 0), 0);
    
    // Expense categorization logic
    const expenseCashInTotal = expenses.reduce((sum, expense) => {
      const isCashIn = expense.expenseType === 'CASH-IN';
      return isCashIn ? sum + (Number(expense.amount) || 0) : sum;
    }, 0);
    
    const expenseCashOutTotal = expenses.reduce((sum, expense) => {
      const isCashOut = expense.expenseType === 'CASH-OUT';
      return isCashOut ? sum + (Number(expense.amount) || 0) : sum;
    }, 0);

    // Handloan categorization logic - Updated for new field names
    const handloanCashInTotal = handloans.reduce((sum, handloan) => {
      const isCashIn = handloan.handLoanType === 'RECOVER' || handloan.handLoanType === 'RECEIVED';
      return isCashIn ? sum + (Number(handloan.loanAmount) || 0) : sum;
    }, 0);
    
    const handloanCashOutTotal = handloans.reduce((sum, handloan) => {
      const isCashOut = handloan.handLoanType === 'ISSUE' || handloan.handLoanType === 'GIVEN';
      return isCashOut ? sum + (Number(handloan.loanAmount) || 0) : sum;
    }, 0);

    // Safe starting balance calculation
    let startingBalance = 0;
    if (records.length > 0 && records[0].startingBalance) {
      startingBalance = Number(records[0].startingBalance) || 0;
    }
    
    setTotals({ 
      cashIn: cashInTotal, 
      cashOut: cashOutTotal, 
      startingBalance: startingBalance,
      expenseCashIn: expenseCashInTotal,
      expenseCashOut: expenseCashOutTotal,
      handloanCashIn: handloanCashInTotal,
      handloanCashOut: handloanCashOutTotal
    });
  }, [records, expenses, handloans]);

  useEffect(() => {
    // Fetch organizations for dropdown
    const bearerToken = localStorage.getItem('token');
    fetch(`${APP_SERVER_URL_PREFIX}/organizations`, {
      headers: { 'Authorization': `Bearer ${bearerToken}` }
    })
      .then(res => res.json())
      .then(data => {
        const orgs = data._embedded ? data._embedded.organizations || [] : data;
        setOrganizations(orgs);
      })
      .catch(() => { });
  }, []);

  // Date filtering for expenses
  const getExpensesForDate = (date) => {
    return expenses.filter(expense => {
      if (!expense.createdDate && !expense.transactionDate) return false;
      
      const expenseDateStr = expense.createdDate || expense.transactionDate;
      if (!expenseDateStr) return false;
      
      try {
        const expenseDate = new Date(expenseDateStr).toISOString().split('T')[0];
        return expenseDate === date;
      } catch (error) {
        console.warn('Invalid date format for expense:', expenseDateStr);
        return false;
      }
    });
  };

  // Date filtering for handloans
  const getHandloansForDate = (date) => {
    return handloans.filter(handloan => {
      if (!handloan.createdDate && !handloan.transactionDate) return false;
      
      const handloanDateStr = handloan.createdDate || handloan.transactionDate;
      if (!handloanDateStr) return false;
      
      try {
        const handloanDate = new Date(handloanDateStr).toISOString().split('T')[0];
        return handloanDate === date;
      } catch (error) {
        console.warn('Invalid date format for handloan:', handloanDateStr);
        return false;
      }
    });
  };

  // Get all handloans with balances (not filtered by date) - UPDATED
  const getAllHandloansWithBalances = () => {
    return handloans.map(handloan => ({
      id: handloan.id || 'N/A',
      handLoanNumber: handloan.handLoanNumber || 'N/A',
      loanAmount: Number(handloan.loanAmount) || 0,
      balance: Number(handloan.balanceAmount) || 0,
      status: handloan.status || (Number(handloan.balanceAmount) > 0 ? 'Active' : 'Closed'),
      createdDate: handloan.createdDate || 'N/A'
    }));
  };

  // Expense categorization
  const categorizeExpenses = (expensesList) => {
    const cashInExpenses = expensesList.filter(expense => expense.expenseType === 'CASH-IN');
    const cashOutExpenses = expensesList.filter(expense => expense.expenseType === 'CASH-OUT');

    return { cashInExpenses, cashOutExpenses };
  };

  // Handloan categorization - UPDATED
  const categorizeHandloans = (handloansList) => {
    const cashInHandloans = handloansList.filter(handloan => 
      handloan.handLoanType === 'RECOVER' || handloan.handLoanType === 'RECEIVED'
    );
    const cashOutHandloans = handloansList.filter(handloan => 
      handloan.handLoanType === 'ISSUE' || handloan.handLoanType === 'GIVEN'
    );

    return { cashInHandloans, cashOutHandloans };
  };

  const handleGenerateReport = () => {
    try {
      const filteredRecords = records.filter(rec => rec.closingDate === selectedDate);
      const filteredExpenses = getExpensesForDate(selectedDate);
      const filteredHandloans = getHandloansForDate(selectedDate);
      const allHandloansWithBalances = getAllHandloansWithBalances();
      
      const { cashInExpenses, cashOutExpenses } = categorizeExpenses(filteredExpenses);
      const { cashInHandloans, cashOutHandloans } = categorizeHandloans(filteredHandloans);
      
      if (filteredRecords.length === 0 && filteredExpenses.length === 0 && filteredHandloans.length === 0) {
        setReportMsg('No records found for the selected date');
        return;
      }

      const doc = new jsPDF();
      
      const selectedRecord = filteredRecords[0];
      const startingBalance = Number(selectedRecord?.startingBalance) || 0;

      // Header Section
      doc.setFontSize(26);
      doc.text('Sri Divya Sarees', 105, 18, { align: 'center' });
      doc.setFontSize(12);
      doc.text('Old Temple Road, Gulzar House, Hyderabad 500066', 105, 26, { align: 'center' });
      doc.setFontSize(11);
      doc.setLineWidth(0.5);
      doc.line(20, 32, 190, 32);
      doc.setFontSize(14);
      doc.text(`Day Closing Report - ${selectedDate}`, 14, 40, { align: "left" });
      doc.setFontSize(13);
      doc.text(`Opening Balance:  ${safeToLocaleString(startingBalance)}`, 158, 40, { align: 'right', marginTop: "20px" });
      
      let currentY = 48;
      if (filteredRecords.length > 0) {
        const mainTableColumn = [
          'Closing Date',
          'Description',
          'Total Cash-In',
          'Total Cash-Out'
        ];
        
        const mainTableRows = filteredRecords.map(rec => [
          rec.closingDate || '',
          rec.description || '',
          rec.cashIn ? ` ${safeToLocaleString(rec.cashIn)}` : '-',
          rec.cashOut ? ` ${safeToLocaleString(rec.cashOut)}` : '-'
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [mainTableColumn],
          body: mainTableRows,
          theme: 'grid',
          headStyles: { fillColor: [11, 59, 114] },
          styles: { fontSize: 10 }
        });

        currentY = doc.lastAutoTable.finalY + 10;
      }

      // Expenses Section - Side by Side Layout
      if (filteredExpenses.length > 0) {
        doc.setFontSize(14);
        doc.text('EXPENSES SUMMARY', 105, currentY, { align: 'center' });
        currentY += 10;

        // Create two columns for expenses
        const pageWidth = doc.internal.pageSize.width;
        const margin = 20;
        const columnWidth = (pageWidth - 3 * margin) / 2;

        // Left Column - Cash Out Expenses
        if (cashOutExpenses.length > 0) {
          doc.setFontSize(12);
          doc.text('Cash Out Expenses', margin, currentY);
          
          const cashOutColumns = ['ID', 'Amount', 'Description', 'Type'];
          const cashOutRows = cashOutExpenses.map(expense => [
            expense.id || 'N/A',
            ` ${safeToLocaleString(expense.amount)}`,
            expense.description || 'General',
            expense.expenseSubType || 'CASH-OUT'
          ]);

          autoTable(doc, {
            startY: currentY + 5,
            head: [cashOutColumns],
            body: cashOutRows,
            theme: 'grid',
            headStyles: { fillColor: [220, 53, 69] },
            styles: { fontSize: 8 },
            tableWidth: columnWidth,
            margin: { left: margin }
          });
        }

        // Right Column - Cash In Expenses
        if (cashInExpenses.length > 0) {
          doc.setFontSize(12);
          doc.text('Cash In Expenses', margin + columnWidth + margin, currentY);
          
          const cashInColumns = ['ID', 'Amount', 'Description', 'Type'];
          const cashInRows = cashInExpenses.map(expense => [
            expense.id || 'N/A',
            ` ${safeToLocaleString(expense.amount)}`,
            expense.description || 'General',
            expense.expenseSubType || 'CASH-IN'
          ]);

          autoTable(doc, {
            startY: currentY + 5,
            head: [cashInColumns],
            body: cashInRows,
            theme: 'grid',
            headStyles: { fillColor: [34, 139, 34] },
            styles: { fontSize: 8 },
            tableWidth: columnWidth,
            margin: { left: margin + columnWidth + margin }
          });
        }

        currentY = Math.max(
          cashOutExpenses.length > 0 ? doc.lastAutoTable.finalY + 10 : currentY,
          cashInExpenses.length > 0 ? doc.lastAutoTable.finalY + 10 : currentY
        );
      }

      // Handloans Section - Side by Side Layout
      if (filteredHandloans.length > 0) {
        // Add new page if not enough space
        if (currentY > 200) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFontSize(14);
        doc.text('HANDLOANS SUMMARY', 105, currentY, { align: 'center' });
        currentY += 10;

        const pageWidth = doc.internal.pageSize.width;
        const margin = 20;
        const columnWidth = (pageWidth - 3 * margin) / 2;

        if (cashOutHandloans.length > 0) {
          doc.setFontSize(12);
          doc.text('Handloans Given (Cash Out)', margin, currentY);
          
          const handloanOutColumns = ['ID', 'Amount', 'Person', ];
          const handloanOutRows = cashOutHandloans.map(handloan => [
            handloan.handLoanNumber || 'N/A',
            ` ${safeToLocaleString(handloan.loanAmount)}`,
            handloan.partyName || 'N/A',
            // handloan.narration || 'Handloan'
          ]);

          autoTable(doc, {
            startY: currentY + 5,
            head: [handloanOutColumns],
            body: handloanOutRows,
            theme: 'grid',
            headStyles: { fillColor: [220, 53, 69] },
            styles: { fontSize: 8 },
            tableWidth: columnWidth,
            margin: { left: margin }
          });
        }

        // Right Column - Cash In Handloans (Received)
        if (cashInHandloans.length > 0) {
          doc.setFontSize(12);
          doc.text('Handloans Received (Cash In)', margin + columnWidth + margin, currentY);
          
          const handloanInColumns = ['ID', 'Amount', 'Person', ];
          const handloanInRows = cashInHandloans.map(handloan => [
            handloan.handLoanNumber|| 'N/A',
            ` ${safeToLocaleString(handloan.loanAmount)}`,
            handloan.partyName || 'N/A',
            // handloan.narration || 'Handloan'
          ]);

          autoTable(doc, {
            startY: currentY + 5,
            head: [handloanInColumns],
            body: handloanInRows,
            theme: 'grid',
            headStyles: { fillColor: [34, 139, 34] },
            styles: { fontSize: 8 },
            tableWidth: columnWidth,
            margin: { left: margin + columnWidth + margin }
          });
        }

        currentY = Math.max(
          cashOutHandloans.length > 0 ? doc.lastAutoTable.finalY + 10 : currentY,
          cashInHandloans.length > 0 ? doc.lastAutoTable.finalY + 10 : currentY
        );
      }

      // NEW: Detailed Handloans Balance Table (All Handloans) - UPDATED
      // if (allHandloansWithBalances.length > 0) {
      //   // Add new page if not enough space
      //   if (currentY > 160) {
      //     doc.addPage();
      //     currentY = 20;
      //   }

      //   // doc.setFontSize(14);
      //   // doc.text('DETAILED HANDLOAN BALANCES', 105, currentY, { align: 'center' });
      //   // currentY += 8;

      //   // const handloanBalanceColumns = ['Loan Number', 'Loan Amount', 'Balance'];
      //   // const handloanBalanceRows = allHandloansWithBalances.map(handloan => [
      //   //   handloan.handLoanNumber,
      //   //   ` ${safeToLocaleString(handloan.loanAmount)}`,
      //   //   ` ${safeToLocaleString(handloan.balance)}`
      //   // ]);

      //   // autoTable(doc, {
      //   //   startY: currentY,
      //   //   head: [handloanBalanceColumns],
      //   //   body: handloanBalanceRows,
      //   //   theme: 'grid',
      //   //   headStyles: { fillColor: [65, 105, 225] }, // Royal blue color
      //   //   styles: { fontSize: 8 },
      //   //   columnStyles: {
      //   //     0: { cellWidth: 30 }, // Loan Number
      //   //     1: { cellWidth: 30, fontStyle: 'bold' }, // Loan Amount
      //   //     2: { cellWidth: 30, fontStyle: 'bold', textColor: [220, 53, 69] } // Balance in red
      //   //   }
      //   // });

      //   currentY = doc.lastAutoTable.finalY + 10;

      //   // Add summary for handloans
      //   const totalLoanAmount = allHandloansWithBalances.reduce((sum, h) => sum + h.loanAmount, 0);
      //   const totalBalance = allHandloansWithBalances.reduce((sum, h) => sum + h.balance, 0);
      //   const activeLoans = allHandloansWithBalances.filter(h => h.status === 'Active' || 
      //     h.status === 'PARTIALLY_RECOVERED' || 
      //     (h.balance > 0 && h.status !== 'RECOVERED')).length;

      //   const summaryData = [
      //     ['Total Loans:', allHandloansWithBalances.length],
      //     ['Active Loans:', activeLoans],
      //     ['Total Loan Amount:', ` ${safeToLocaleString(totalLoanAmount)}`],
      //     ['Total Outstanding:', ` ${safeToLocaleString(totalBalance)}`]
      //   ];

      //   autoTable(doc, {
      //     startY: currentY,
      //     body: summaryData,
      //     theme: 'grid',
      //     styles: { fontSize: 10 },
      //     columnStyles: {
      //       0: { fontStyle: 'bold', fillColor: [240, 240, 240] },
      //       1: { fontStyle: 'bold' }
      //     }
      //   });

      //   currentY = doc.lastAutoTable.finalY + 15;
      // }

      filteredRecords.forEach((rec, index) => {
        if (index > 0) {
          // doc.addPage();
          currentY = 20;
        }

        if (filteredRecords.length > 0) {
          doc.setFontSize(12);
          doc.text(`Day Closing Details - ${rec.closingDate}`, 20, currentY);
          currentY += 10;

          const infoTableData = [
            ['Description:', rec.description || ''],
            ['Starting Balance:', rec.startingBalance ? ` ${safeToLocaleString(rec.startingBalance)}` : ' 0'],
            ['Cash In:', rec.cashIn ? ` ${safeToLocaleString(rec.cashIn)}` : ' 0'],
            ['Cash Out:', rec.cashOut ? ` ${safeToLocaleString(rec.cashOut)}` : ' 0'],
            ['Closing Balance:', rec.closingBalance ? ` ${safeToLocaleString(rec.closingBalance)}` : ' 0']
          ];

          autoTable(doc, {
            startY: currentY,
            body: infoTableData,
            theme: 'grid',
            styles: { fontSize: 10 },
            columnStyles: {
              0: { fontStyle: 'bold', fillColor: [240, 240, 240] }
            }
          });

          currentY = doc.lastAutoTable.finalY + 15;

          // Coins and Notes Summary
          doc.setFontSize(11);
          doc.text('Coins Summary', 20, currentY);
          currentY += 8;

          const coinsData = [
            ['1  Coin', '5  Coin', '10  Coin', '20  Coin'],
            [
              rec._1CoinCount || 0,
              rec._5CoinCount || 0,
              rec._10CoinCount || 0,
              rec._20CoinCount || 0
            ]
          ];

          autoTable(doc, {
            startY: currentY,
            head: [coinsData[0]],
            body: [coinsData[1]],
            theme: 'grid',
            headStyles: { fillColor: [11, 59, 114] },
            styles: { fontSize: 10, halign: 'center' }
          });

          currentY = doc.lastAutoTable.finalY + 15;

          doc.setFontSize(11);
          doc.text('Notes Summary', 20, currentY);
          currentY += 8;

          const notesHead = ['10  Note', '20  Note', '50  Note', '100  Note', '200  Note', '500  Note'];
          const notesData = [
            rec._10NoteCount || 0,
            rec._20NoteCount || 0,
            rec._50NoteCount || 0,
            rec._100NoteCount || 0,
            rec._200NoteCount || 0,
            rec._500NoteCount || 0
          ];

          autoTable(doc, {
            startY: currentY,
            head: [notesHead],
            body: [notesData],
            theme: 'grid',
            headStyles: { fillColor: [11, 59, 114] },
            styles: { fontSize: 10, halign: 'center' }
          });

          currentY = doc.lastAutoTable.finalY + 15;

          doc.setFontSize(11);
          doc.text('Soiled Notes Summary', 20, currentY);
          currentY += 8;

          const soiledNotesHead = ['10  Soiled', '20  Soiled', '50  Soiled', '100  Soiled', '200  Soiled', '500  Soiled'];
          const soiledNotesData = [
            rec._10SoiledNoteCount || 0,
            rec._20SoiledNoteCount || 0,
            rec._50SoiledNoteCount || 0,
            rec._100SoiledNoteCount || 0,
            rec._200SoiledNoteCount || 0,
            rec._500SoiledNoteCount || 0
          ];

          autoTable(doc, {
            startY: currentY,
            head: [soiledNotesHead],
            body: [soiledNotesData],
            theme: 'grid',
            headStyles: { fillColor: [139, 0, 0] },
            styles: { fontSize: 10, halign: 'center' }
          });
        }
      });

      // Grand Summary Page
      // doc.addPage();
      doc.setFontSize(16);
      
      const dateCashInTotal = filteredRecords.reduce((sum, rec) => sum + (Number(rec.cashIn) || 0), 0);
      const dateCashOutTotal = filteredRecords.reduce((sum, rec) => sum + (Number(rec.cashOut) || 0), 0);
      
      const expenseCashInTotal = cashInExpenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
      const expenseCashOutTotal = cashOutExpenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);

      const handloanCashInTotal = cashInHandloans.reduce((sum, handloan) => sum + (Number(handloan.loanAmount) || 0), 0);
      const handloanCashOutTotal = cashOutHandloans.reduce((sum, handloan) => sum + (Number(handloan.loanAmount) || 0), 0);

      const totalCashIn = dateCashInTotal + expenseCashInTotal + handloanCashInTotal;
      const totalCashOut = dateCashOutTotal + expenseCashOutTotal + handloanCashOutTotal;
      const netCashFlow = totalCashIn - totalCashOut;
      const closingBalance = startingBalance + netCashFlow;

      const url = doc.output('bloburl');
      setPdfUrl(url);
      setReportMsg(`PDF generated successfully for ${selectedDate}!`);

    } catch (e) {
      console.error('PDF generation error:', e);
      setReportMsg('Failed to generate PDF');
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc'
    },

    headerSection: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      // marginBottom: '24px',
      padding: '6px 0',
      borderBottom: '1px solid #e2e8f0',
      gap: '20px',
    },

    dateSelector: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },

    dateLabel: {
      fontWeight: '600',
      color: '#374151',
      fontSize: '14px',
    },

    dateInput: {
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      backgroundColor: 'white',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    },

    generateButton: {
      background: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)',
      color: 'white',
      border: 'none',
      padding: '12px 14px',
      borderRadius: '8px',
      fontWeight: '600',
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 4px rgba(30, 58, 138, 0.3)',
      whiteSpace: 'nowrap',
    },

    summaryContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '20px',
      marginBottom: '14px',
      padding: '0 16px',
    },

    summaryCard: {
      background: 'white',
      padding: '5px',
      borderRadius: '12px',
      // boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      textAlign: 'center',
      border: '1px solid #e2e8f0'
    },
    cashInCard: {
      borderLeft: '4px solid #2563eb',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
    },
    cashOutCard: {
      borderLeft: '4px solid #dc2626',
      background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
    },
    netBalanceCard: {
      borderLeft: '4px solid #059669',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
    },
    summaryAmount: {
      fontSize: '24px',
      fontWeight: '700',
      marginTop: '8px'
    },

    tableContainer: {
      background: 'white',
      borderRadius: '12px',
      overflow: 'auto',
      height: '200px',
      // boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      marginBottom: '24px',
      overflowY:"auto"
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    tableHeader: {
      background: "#3c93c1",
      color: 'white'
    },
    tableHeaderCell: {
      padding: '6px 8px',
      textAlign: 'left',
      fontWeight: '600',
      fontSize: '14px',
      borderBottom: '2px solid #e2e8f0'
    },
    tableCell: {
      padding: '14px 12px',
      borderBottom: '1px solid #f1f5f9',
      fontSize: '14px'
    },
    tableRow: {
      transition: 'background-color 0.2s ease',
    },

    notesSection: {
      marginTop: '32px'
    },
    notesHeader: {
      textAlign: 'center',
      color: '#1e3a8a',
      marginBottom: '16px',
      fontSize: '20px',
      fontWeight: '600'
    },
    scrollableContainer: {
      maxHeight: '500px',
      overflow: 'auto',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      background: 'white',
      // boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },

    successMessage: {
      color: '#059669',
      backgroundColor: '#f0fdf4',
      padding: '12px 16px',
      borderRadius: '8px',
      border: '1px solid #bbf7d0',
      marginBottom: '16px',
      fontWeight: '500'
    },
    errorMessage: {
      color: '#dc2626',
      backgroundColor: '#fef2f2',
      padding: '12px 16px',
      borderRadius: '8px',
      border: '1px solid #fecaca',
      marginBottom: '16px',
      fontWeight: '500'
    },

    pdfModal: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.6)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(4px)'
    },
    pdfContainer: {
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
      padding: '20px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      position: 'relative',
      border: '1px solid #e2e8f0'
    },
    closeButton: {
      position: 'absolute',
      top: '-10px',
      right: '-10px',
      fontSize: '20px',
      background: '#fff',
      border: 'none',
      cursor: 'pointer',
      color: '#645c5c',
      width: '30px',
      height: '30px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#eef1f4',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    },

    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '40px',
      color: '#64748b',
      fontSize: '16px'
    },
    
    expensesSection: {
      marginTop: '32px',
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    expensesHeader: {
      color: '#1e3a8a',
      marginBottom: '20px',
      fontSize: '18px',
      fontWeight: '600',
      textAlign: 'center'
    },
    
    // New styles for loans section
    loansSection: {
      marginTop: '32px',
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    loansHeader: {
      color: '#1e3a8a',
      marginBottom: '20px',
      fontSize: '18px',
      fontWeight: '600',
      textAlign: 'center'
    },
    loansSummary: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '15px',
      marginBottom: '20px',
      padding: '15px',
      backgroundColor: '#f8fafc',
      borderRadius: '8px',
      border: '1px solid #e2e8f0'
    },
    loansSummaryItem: {
      textAlign: 'center',
      padding: '10px'
    },
    loansSummaryLabel: {
      fontSize: '14px',
      color: '#64748b',
      fontWeight: '500',
      marginBottom: '5px'
    },
    loansSummaryValue: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#1e3a8a'
    }
  };

  const expensesForSelectedDate = getExpensesForDate(selectedDate);
  const handloansForSelectedDate = getHandloansForDate(selectedDate);
  const { cashInExpenses, cashOutExpenses } = categorizeExpenses(expensesForSelectedDate);
  const { cashInHandloans, cashOutHandloans } = categorizeHandloans(handloansForSelectedDate);
  
  // Get all handloans with balances for display
  const allHandloansWithBalances = getAllHandloansWithBalances();
  const totalLoanAmount = allHandloansWithBalances.reduce((sum, h) => sum + h.loanAmount, 0);
  const totalBalance = allHandloansWithBalances.reduce((sum, h) => sum + h.balance, 0);
  const activeLoans = allHandloansWithBalances.filter(h => h.status === 'Active' || 
    h.status === 'PARTIALLY_RECOVERED' || 
    (h.balance > 0 && h.status !== 'RECOVERED')).length;

  return (
    <div style={styles.container}>
      <Sidebar isOpen={true} />
      <PageCard title="Day Closing Report">
        <div style={styles.headerSection}>
          <div style={styles.dateSelector}>
            <label style={styles.dateLabel}>Select Date To Generate Report:</label>
            <input
              type="date"
              value={selectedDate}
              // onChange={handleChange}
              style={styles.dateInput}
            />
          </div>
          <div className="form-group">
            {/* <label className="form-label">Organization</label> */}
            <select
              value={organizationId}
              // onChange={handleChange}
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
          <button
          className='btn-primary1'
            // style={styles.generateButton}
            onClick={handleGenerateReport}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            📊 Generate Report
          </button>
        </div>

        {pdfUrl && (
          <div style={styles.pdfModal}>
            <div style={styles.pdfContainer}>
              <button
                style={styles.closeButton}
                onClick={() => { setPdfUrl(''); }}
              >
                ×
              </button>
              <iframe
                src={pdfUrl}
                title="Day Closing PDF Report"
                style={{
                  width: '70vw',
                  height: '75vh',
                  border: 'none',
                  borderRadius: '8px'
                }}
              />
              <div style={{ textAlign: 'right', marginTop: '16px' }}>
                <a
                  href={pdfUrl}
                  download={`DayClosingReport_${selectedDate}.pdf`}
                  style={{
                    ...styles.generateButton,
                    textDecoration: 'none',
                    display: 'inline-block'
                  }}
                >
                  📥 Download PDF
                </a>
              </div>
            </div>
          </div>
        )}
        
        {reportMsg && (
          <div style={reportMsg.includes('Failed') ? styles.errorMessage : styles.successMessage}>
            {reportMsg.includes('Failed') ? '❌' : '✅'} {reportMsg}
          </div>
        )}
        {error && <div style={styles.errorMessage}>❌ {error}</div>}

        {loading ? (
          <div style={styles.loadingContainer}>
            <div>Loading day closing records, expenses, and handloans...</div>
          </div>
        ) : (
          <>
            <div style={styles.summaryContainer}>
              <div style={{...styles.summaryCard,}}>
                <div style={{color: '#2563eb', fontWeight: '600', fontSize: '14px'}}>Total Cash-In</div>
                <div style={{...styles.summaryAmount, color: '#2563eb'}}>
                  {safeToLocaleString(totals.cashIn + totals.expenseCashIn + totals.handloanCashIn)}
                </div>
                
                {/* <div style={{fontSize: '12px', color: '#64748b', marginTop: '8px'}}>
                  Petty Cash: {safeToLocaleString(totals.cashIn)}
                </div>
                <div style={{fontSize: '12px', color: '#64748b'}}>
                  Expenses: {safeToLocaleString(totals.expenseCashIn)}
                </div> */}
              </div>
              <div style={{...styles.summaryCard, }}>
                <div style={{color: '#dc2626', fontWeight: '600', fontSize: '14px'}}>Total Cash-Out</div>
                <div style={{...styles.summaryAmount, color: '#dc2626'}}>
                  {safeToLocaleString(totals.cashOut + totals.expenseCashOut + totals.handloanCashOut)}
                </div>
                {/* <div style={{fontSize: '12px', color: '#64748b', marginTop: '8px'}}>
                  Petty Cash: {safeToLocaleString(totals.cashOut)}
                </div>
                <div style={{fontSize: '12px', color: '#64748b'}}>
                  Expenses: {safeToLocaleString(totals.expenseCashOut)}
                </div> */}
              </div>
              <div style={{...styles.summaryCard, }}>
                <div style={{color: '#059669', fontWeight: '600', fontSize: '14px'}}>Net Balance</div>
                <div style={{...styles.summaryAmount, color: '#059669'}}>
                  {safeToLocaleString(
                    (totals.cashIn + totals.expenseCashIn + totals.handloanCashIn) - 
                    (totals.cashOut + totals.expenseCashOut + totals.handloanCashOut)
                  )}
                </div>
                {/* <div style={{fontSize: '12px', color: '#64748b', marginTop: '8px'}}>
                  Including Petty Cash, Expenses & Handloans
                </div> */}
              </div>
            </div>

            {/* Existing Expenses Section */}
            {(cashInExpenses.length > 0 || cashOutExpenses.length > 0) && (
              <div style={styles.expensesSection}>
                <h3 style={styles.expensesHeader}>Expenses for {selectedDate}</h3>
                <div style={{display: "flex", flexDirection: "row", justifyContent: "space-between", gap: "20px", width: "100%"}}>
                  {/* LEFT: CASH OUT EXPENSES */}
                  <div style={{flex: 1, minWidth: "48%"}}>
                    <h4 style={{ color: '#dc2626', marginBottom: '10px' }}>Cash Out Expenses</h4>
                    <div style={{...styles.tableContainer, width: "100%", height: "auto"}}>
                      <table style={styles.table}>
                        <thead style={styles.tableHeader}>
                          <tr>
                            <th style={styles.tableHeaderCell}>ID</th>
                            <th style={styles.tableHeaderCell}>Amount</th>
                            <th style={styles.tableHeaderCell}>Description</th>
                            <th style={styles.tableHeaderCell}>Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cashOutExpenses.map((expense, idx) => (
                            <tr key={idx} style={styles.tableRow}>
                              <td style={styles.tableCell}>{expense.id || 'N/A'}</td>
                              <td style={{ ...styles.tableCell, color: '#dc2626', fontWeight: '600' }}>
                                {safeToLocaleString(expense.amount)}
                              </td>
                              <td style={styles.tableCell}>{expense.description || 'General'}</td>
                              <td style={styles.tableCell}>{expense.expenseSubType || 'CASH-OUT'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* RIGHT: CASH IN EXPENSES */}
                  <div style={{flex: 1, minWidth: "48%"}}>
                    <h4 style={{ color: '#059669', marginBottom: '10px' }}>Cash In Expenses</h4>
                    <div style={{...styles.tableContainer, width: "100%", height: "auto"}}>
                      <table style={styles.table}>
                        <thead style={styles.tableHeader}>
                          <tr>
                            <th style={styles.tableHeaderCell}>ID</th>
                            <th style={styles.tableHeaderCell}>Amount</th>
                            <th style={styles.tableHeaderCell}>Description</th>
                            <th style={styles.tableHeaderCell}>Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cashInExpenses.map((expense, idx) => (
                            <tr key={idx} style={styles.tableRow}>
                              <td style={styles.tableCell}>{expense.id || 'N/A'}</td>
                              <td style={{ ...styles.tableCell, color: '#059669', fontWeight: '600' }}>
                                {safeToLocaleString(expense.amount)}
                              </td>
                              <td style={styles.tableCell}>{expense.description || 'General'}</td>
                              <td style={styles.tableCell}>{expense.expenseSubType || 'CASH-IN'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}


            {/* Existing Tables for Day Closing and Notes Summary */}
            <div style={styles.tableContainer}>
              <table className="payroll-table" style={styles.table}>
                <thead style={styles.tableHeader}>
                  <tr>
                    <th style={styles.tableHeaderCell}>Date</th>
                    <th style={styles.tableHeaderCell}>Description</th>
                    <th style={styles.tableHeaderCell}>Starting Balance</th>
                    <th style={styles.tableHeaderCell}>Credit</th>
                    <th style={styles.tableHeaderCell}>Debit</th>
                    <th style={styles.tableHeaderCell}>Closing Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec, idx) => (
                    <tr key={idx} style={styles.tableRow}>
                      <td style={styles.tableCell}>{rec.closingDate}</td>
                      <td style={styles.tableCell}>{rec.description}</td>
                      <td style={styles.tableCell}>{safeToLocaleString(rec.startingBalance)}</td>
                      <td style={{...styles.tableCell, color: '#059669', fontWeight: '500'}}>
                        {rec.cashIn ? ` ${safeToLocaleString(rec.cashIn)}` : '-'}
                      </td>
                      <td style={{...styles.tableCell, color: '#dc2626', fontWeight: '500'}}>
                        {rec.cashOut ? ` ${safeToLocaleString(rec.cashOut)}` : '-'}
                      </td>
                      <td style={{...styles.tableCell, color: '#1e3a8a', fontWeight: '600'}}>
                        {safeToLocaleString(rec.closingBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={styles.notesSection}>
              <h3 style={styles.notesHeader}>Notes & Coin Summary</h3>
              <div style={styles.scrollableContainer}>
                <table className="payroll-table" style={{ ...styles.table, minWidth: '100%' }}>
                  <thead style={styles.tableHeader}>
                    <tr>
                      <th style={styles.tableHeaderCell}>Date</th>
                      <th style={styles.tableHeaderCell}>1  Coin</th>
                      <th style={styles.tableHeaderCell}>5  Coin</th>
                      <th style={styles.tableHeaderCell}>10  Coin</th>
                      <th style={styles.tableHeaderCell}>20  Coin</th>
                      <th style={styles.tableHeaderCell}>10  Note</th>
                      <th style={styles.tableHeaderCell}>20  Note</th>
                      <th style={styles.tableHeaderCell}>50  Note</th>
                      <th style={styles.tableHeaderCell}>100  Note</th>
                      <th style={styles.tableHeaderCell}>200  Note</th>
                      <th style={styles.tableHeaderCell}>500  Note</th>
                      <th style={styles.tableHeaderCell}>10  Soiled</th>
                      <th style={styles.tableHeaderCell}>20  Soiled</th>
                      <th style={styles.tableHeaderCell}>50  Soiled</th>
                      <th style={styles.tableHeaderCell}>100  Soiled</th>
                      <th style={styles.tableHeaderCell}>200  Soiled</th>
                      <th style={styles.tableHeaderCell}>500  Soiled</th>
                    </tr>
                  </thead>
                  <tbody>

                    <tr key={records.id} style={styles.tableRow}>
                      <td style={styles.tableCell}>{records.closingDate}</td>
                      <td style={styles.tableCell}>{records._1CoinCount || 0}</td>
                      <td style={styles.tableCell}>{records._5CoinCount || 0}</td>
                      <td style={styles.tableCell}>{records._10CoinCount || 0}</td>
                      <td style={styles.tableCell}>{records._20CoinCount || 0}</td>
                      <td style={styles.tableCell}>{records._10NoteCount || 0}</td>
                      <td style={styles.tableCell}>{records._20NoteCount || 0}</td>
                      <td style={styles.tableCell}>{records._50NoteCount || 0}</td>
                      <td style={styles.tableCell}>{records._100NoteCount || 0}</td>
                      <td style={styles.tableCell}>{records._200NoteCount || 0}</td>
                      <td style={styles.tableCell}>{records._500NoteCount || 0}</td>
                      <td style={{ ...styles.tableCell, color: '#dc2626' }}>{records._10SoiledNoteCount || 0}</td>
                      <td style={{ ...styles.tableCell, color: '#dc2626' }}>{records._20SoiledNoteCount || 0}</td>
                      <td style={{ ...styles.tableCell, color: '#dc2626' }}>{records._50SoiledNoteCount || 0}</td>
                      <td style={{ ...styles.tableCell, color: '#dc2626' }}>{records._100SoiledNoteCount || 0}</td>
                      <td style={{ ...styles.tableCell, color: '#dc2626' }}>{records._200SoiledNoteCount || 0}</td>
                      <td style={{ ...styles.tableCell, color: '#dc2626' }}>{records._500SoiledNoteCount || 0}</td>
                    </tr>

                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </PageCard>
    </div>
  );
}

export default DayClosingReport;