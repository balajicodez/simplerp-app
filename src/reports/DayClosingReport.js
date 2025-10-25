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
  const [totals, setTotals] = useState({ cashIn: 0, cashOut: 0 });
  const [pdfUrl, setPdfUrl] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(`${APP_SERVER_URL_PREFIX}/pettyCashDayClosings`)
      .then(res => res.json())
      .then(data => {
        const list = data._embedded ? data._embedded.pettyCashDayClosings || [] : data;
        setRecords(list);         
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch day closing records');
        setLoading(false);
      });
  }, []);

  const handleGenerateReport = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('Sri Divya Sarees', 105, 18, { align: 'center' });
      doc.setFontSize(12);
      doc.text('Old Temple Road, Gulzar House, Hyderabad 500066', 105, 26, { align: 'center' });
      doc.setLineWidth(0.5);
      doc.line(20, 32, 190, 32);
      doc.setFontSize(14);
      doc.text('Day Closing Report', 105, 40, { align: 'center' });

      const tableColumn = ['Closing Date', 'Description', 'Created By', 'Created Time', 'Total Cash-In', 'Total Cash-Out'];
      const tableRows = records.map(rec => [
        rec.closingDate || '',
        rec.description || '',
        rec.createdBy || '',
        rec.createdTime || '',
        rec.cashIn ? rec.cashIn : '-',
        rec.cashOut ? rec.cashOut : '-'
      ]);
      autoTable(doc, {
        startY: 48,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [11, 59, 114] },
        styles: { fontSize: 10 }
      });

      const url = doc.output('bloburl');
      setPdfUrl(url);
      setReportMsg('PDF generated!');
    } catch (e) {
      setReportMsg('Failed to generate PDF');
    }
  };

  return (
    <div>
      <Sidebar isOpen={true} />
      <PageCard title="Day Closing Report">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button className="btn" onClick={handleGenerateReport}>Generate Report</button>
        </div>
        {pdfUrl && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 16px rgba(0,0,0,0.18)', padding: 16, maxWidth: '90vw', maxHeight: '90vh', position: 'relative' }}>
              <button style={{ position: 'absolute', top: 8, right: 8, fontSize: 18, background: 'transparent', border: 'none', cursor: 'pointer' }} onClick={() => { setPdfUrl(''); }}>×</button>
              <iframe src={pdfUrl} title="Petty Cash PDF" style={{ width: '70vw', height: '80vh', border: 'none' }} />
              <div style={{ textAlign: 'right', marginTop: 8 }}>
                <a href={pdfUrl} download="PettyCashDayClosingReport.pdf" className="btn">Download PDF</a>
              </div>
            </div>
          </div>
        )}
        {reportMsg && <div style={{ color: '#2563eb', marginBottom: 8 }}>{reportMsg}</div>}
        {error && <div style={{ color: '#c53030' }}>{error}</div>}
        {loading ? <div className="small">Loading...</div> : (
          <>
            <div style={{ display: 'flex', gap: '32px', marginBottom: '16px' }}>
              <div style={{ fontWeight: 500, color: '#2563eb' }}>Total Cash-In: ₹{totals.cashIn.toLocaleString()}</div>
              <div style={{ fontWeight: 500, color: '#c53030' }}>Total Cash-Out: ₹{totals.cashOut.toLocaleString()}</div>
            </div>
            <table className="payroll-table">
              <thead>
                <tr>
                  <th>Closing Date</th>
                  <th>Description</th>
                  <th>Created By</th>
                  <th>Created Time</th>
                  <th>Total Cash-In</th>
                  <th>Total Cash-Out</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec, idx) => (
                  <tr key={idx}>
                    <td>{rec.closingDate}</td>
                    <td>{rec.description}</td>
                    <td>{rec.createdBy}</td>
                    <td>{rec.createdTime}</td>
                    <td>{rec.cashIn ? `₹${Number(rec.cashIn).toLocaleString()}` : '-'}</td>
                    <td>{rec.cashOut ? `₹${Number(rec.cashOut).toLocaleString()}` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </PageCard>
    </div>
  );
}

export default DayClosingReport;
