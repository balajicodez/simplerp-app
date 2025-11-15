import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Sidebar from '../Sidebar';
import PageCard from '../components/PageCard';
import { APP_SERVER_URL_PREFIX } from '../constants.js';

function DayClosingReport() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportMsg, setReportMsg] = useState('');
  const [totals, setTotals] = useState({ cashIn: 0, cashOut: 0, startingBalance: 0 });
  const [pdfUrl, setPdfUrl] = useState('');
  const [organizations, setOrganizations] = useState([]);
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
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    
    const fetchDayClosingData = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetch(`${APP_SERVER_URL_PREFIX}/pettyCashDayClosings`);
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const data = await response.json();
        const list = data._embedded ? data._embedded.pettyCashDayClosings || [] : data;
        setRecords(list);
        
        // Safe calculation of totals
        const cashInTotal = list.reduce((sum, rec) => sum + (Number(rec.cashIn) || 0), 0);
        const cashOutTotal = list.reduce((sum, rec) => sum + (Number(rec.cashOut) || 0), 0);
        
        // Safe starting balance calculation
        let startingBalance = 0;
        if (list.length > 0 && list[0].startingBalance) {
          startingBalance = Number(list[0].startingBalance) || 0;
        }
        
        setTotals({ 
          cashIn: cashInTotal, 
          cashOut: cashOutTotal, 
          startingBalance: startingBalance 
        });
        
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch day closing records');
        setLoading(false);
      }
    };

    fetchDayClosingData();
  }, [selectedOrgId]);

  useEffect(() => {
    // Fetch organizations for dropdown
    fetch(`${APP_SERVER_URL_PREFIX}/organizations`)
      .then(res => res.json())
      .then(data => {
        const orgs = data._embedded ? data._embedded.organizations || [] : data;
        setOrganizations(orgs);
      })
      .catch(() => { });
  }, []);

  const handleGenerateReport = () => {
    try {
      const filteredRecords = records.filter(rec => rec.closingDate === selectedDate);
      
      if (filteredRecords.length === 0) {
        setReportMsg('No records found for the selected date');
        return;
      }

      const doc = new jsPDF();
      
      const selectedRecord = filteredRecords[0];
      const startingBalance = Number(selectedRecord.startingBalance) || 0;

      doc.setFontSize(16);
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
      
      const mainTableColumn = [
        'Closing Date',
        'Description',
        'Created By',
        'Created Time',
        'Total Cash-In',
        'Total Cash-Out'
      ];
      
      const mainTableRows = filteredRecords.map(rec => [
        rec.closingDate || '',
        rec.description || '',
        rec.createdBy || '',
        rec.createdTime || '',
        rec.cashIn ? ` ${safeToLocaleString(rec.cashIn)}` : '-',
        rec.cashOut ? ` ${safeToLocaleString(rec.cashOut)}` : '-'
      ]);

      autoTable(doc, {
        startY: 48,
        head: [mainTableColumn],
        body: mainTableRows,
        theme: 'grid',
        headStyles: { fillColor: [11, 59, 114] },
        styles: { fontSize: 10 }
      });

      let currentY = doc.lastAutoTable.finalY + 15;

      filteredRecords.forEach((rec, index) => {
        if (index > 0) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFontSize(12);
        doc.text(`Day Closing Details - ${rec.closingDate}`, 20, currentY);
        currentY += 10;

        const infoTableData = [
          ['Description:', rec.description || ''],
          ['Created By:', rec.createdBy || ''],
          ['Created Time:', rec.createdTime || ''],
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
      });

      const dateCashInTotal = filteredRecords.reduce((sum, rec) => sum + (Number(rec.cashIn) || 0), 0);
      const dateCashOutTotal = filteredRecords.reduce((sum, rec) => sum + (Number(rec.cashOut) || 0), 0);

      doc.addPage();
      doc.setFontSize(14);
      doc.text(`Grand Summary - ${selectedDate}`, 105, 20, { align: 'center' });
      
      const summaryData = [
        ['Starting Balance:', ` ${safeToLocaleString(startingBalance)}`],
        ['Total Cash In:', ` ${safeToLocaleString(dateCashInTotal)}`],
        ['Total Cash Out:', ` ${safeToLocaleString(dateCashOutTotal)}`],
        ['Closing Balance:', ` ${safeToLocaleString(startingBalance + dateCashInTotal - dateCashOutTotal)}`]
      ];

      autoTable(doc, {
        startY: 30,
        body: summaryData,
        theme: 'grid',
        styles: { fontSize: 12 },
        columnStyles: {
          0: { fontStyle: 'bold', fillColor: [240, 240, 240] }
        }
      });

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
      marginBottom: '24px',
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
      marginBottom: '24px',
      padding: '0 16px',
    },
    
    summaryCard: {
      background: 'white',
      padding: '20px',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
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
      height: '400px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      marginBottom: '24px',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    tableHeader: {
      background: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)',
      color: 'white'
    },
    tableHeaderCell: {
      padding: '16px 12px',
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
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
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
    }
  };

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
              onChange={(e) => setSelectedDate(e.target.value)}
              style={styles.dateInput}
            />
          </div>
          <button 
            style={styles.generateButton}
            onClick={handleGenerateReport}
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
        
        {reportMsg && <div style={styles.successMessage}>✅ {reportMsg}</div>}
        {error && <div style={styles.errorMessage}>❌ {error}</div>}
        
        {loading ? (
          <div style={styles.loadingContainer}>
            <div>Loading day closing records...</div>
          </div>
        ) : (
          <>
            <div style={styles.summaryContainer}>
              <div style={{...styles.summaryCard, ...styles.cashInCard}}>
                <div style={{color: '#2563eb', fontWeight: '600', fontSize: '14px'}}>Total Cash-In</div>
                <div style={{...styles.summaryAmount, color: '#2563eb'}}>
                  {safeToLocaleString(totals.cashIn)}
                </div>
              </div>
              <div style={{...styles.summaryCard, ...styles.cashOutCard}}>
                <div style={{color: '#dc2626', fontWeight: '600', fontSize: '14px'}}>Total Cash-Out</div>
                <div style={{...styles.summaryAmount, color: '#dc2626'}}>
                  {safeToLocaleString(totals.cashOut)}
                </div>
              </div>
              <div style={{...styles.summaryCard, ...styles.netBalanceCard}}>
                <div style={{color: '#059669', fontWeight: '600', fontSize: '14px'}}>Net Balance</div>
                <div style={{...styles.summaryAmount, color: '#059669'}}>
                  {safeToLocaleString(totals.cashIn - totals.cashOut)}
                </div>
              </div>
            </div>
            
            <div style={styles.tableContainer}>
              <table className="payroll-table" style={styles.table}>
                <thead style={styles.tableHeader}>
                  <tr>
                    <th style={styles.tableHeaderCell}>Date</th>
                    <th style={styles.tableHeaderCell}>Description</th>
                    <th style={styles.tableHeaderCell}>Created By</th>
                    <th style={styles.tableHeaderCell}>Created Time</th>
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
                      <td style={styles.tableCell}>{rec.createdBy}</td>
                      <td style={styles.tableCell}>{rec.createdTime}</td>
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
                <table className="payroll-table" style={{...styles.table, minWidth: '100%'}}>
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
                    {records.map((rec, idx) => (
                      <tr key={idx} style={styles.tableRow}>
                        <td style={styles.tableCell}>{rec.closingDate}</td>
                        <td style={styles.tableCell}>{rec._1CoinCount || 0}</td>
                        <td style={styles.tableCell}>{rec._5CoinCount || 0}</td>
                        <td style={styles.tableCell}>{rec._10CoinCount || 0}</td>
                        <td style={styles.tableCell}>{rec._20CoinCount || 0}</td>
                        <td style={styles.tableCell}>{rec._10NoteCount || 0}</td>
                        <td style={styles.tableCell}>{rec._20NoteCount || 0}</td>
                        <td style={styles.tableCell}>{rec._50NoteCount || 0}</td>
                        <td style={styles.tableCell}>{rec._100NoteCount || 0}</td>
                        <td style={styles.tableCell}>{rec._200NoteCount || 0}</td>
                        <td style={styles.tableCell}>{rec._500NoteCount || 0}</td>
                        <td style={{...styles.tableCell, color: '#dc2626'}}>{rec._10SoiledNoteCount || 0}</td>
                        <td style={{...styles.tableCell, color: '#dc2626'}}>{rec._20SoiledNoteCount || 0}</td>
                        <td style={{...styles.tableCell, color: '#dc2626'}}>{rec._50SoiledNoteCount || 0}</td>
                        <td style={{...styles.tableCell, color: '#dc2626'}}>{rec._100SoiledNoteCount || 0}</td>
                        <td style={{...styles.tableCell, color: '#dc2626'}}>{rec._200SoiledNoteCount || 0}</td>
                        <td style={{...styles.tableCell, color: '#dc2626'}}>{rec._500SoiledNoteCount || 0}</td>
                      </tr>
                    ))}
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