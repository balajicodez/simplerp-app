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
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(`${APP_SERVER_URL_PREFIX}/pettyCashDayClosings`)
      .then(res => res.json())
      .then(data => {
        let list = data._embedded ? data._embedded.pettyCashDayClosings || [] : data;
        if (selectedOrgId) {
          list = list.filter(rec => String(rec.organizationId) === String(selectedOrgId));
        }
        setRecords(list);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch day closing records');
        setLoading(false);
      });
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
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('Sri Divya Sarees', 105, 18, { align: 'center' });
      doc.setFontSize(12);
      doc.text('Old Temple Road, Gulzar House, Hyderabad 500066', 105, 26, { align: 'center' });
      doc.setLineWidth(0.5);
      doc.line(20, 32, 190, 32);
      doc.setFontSize(14);
      doc.text('Day Closing Report', 105, 40, { align: 'center' });

      // Main report table columns
      const mainTableColumn = [
        'Closing Date',
        'Description',
        'Created By',
        'Created Time',
        'Total Cash-In',
        'Total Cash-Out'
      ];
      const mainTableRows = records.map(rec => [
        rec.closingDate || '',
        rec.description || '',
        rec.createdBy || '',
        rec.createdTime || '',
        rec.cashIn ? rec.cashIn : '-',
        rec.cashOut ? rec.cashOut : '-'
      ]);
      autoTable(doc, {
        startY: 48,
        head: [mainTableColumn],
        body: mainTableRows,
        theme: 'grid',
        headStyles: { fillColor: [11, 59, 114] },
        styles: { fontSize: 10 }
      });

      // Notes/Coin Summary table
      const coinColumns = ['1 Coin', '5 Coin', '10 Coin', '20 Coin'];
      const noteColumns = ['10 Note', '20 Note', '50 Note', '100 Note', '200 Note', '500 Note'];
      const soiledNoteColumns = ['10 Soiled', '20 Soiled', '50 Soiled', '100 Soiled', '200 Soiled', '500 Soiled'];
      doc.setFontSize(13);
      let nextY = doc.lastAutoTable.finalY + 12;
      records.forEach((rec, idx) => {
        // Coins Table
        doc.text(`Coins Summary`, 105, nextY, { align: 'center' });
        autoTable(doc, {
          startY: nextY + 4,
          head: [['1 Coin', '5 Coin', '10 Coin', '20 Coin']],
          body: [[
            ...['1', '5', '10', '20'].map(coin => {
              const key = `_${coin}CoinCount`;
              return rec[key] !== undefined && rec[key] !== null ? rec[key] : '';
            })
          ]],
          theme: 'grid',
          headStyles: { fillColor: [11, 59, 114] },
          styles: { fontSize: 10 }
        });
        nextY = doc.lastAutoTable.finalY + 8;
        // Notes Table
        doc.text(`Notes Summary`, 105, nextY, { align: 'center' });
        autoTable(doc, {
          startY: nextY + 4,
          head: [['10 Note', '20 Note', '50 Note', '100 Note', '200 Note', '500 Note', '10 Soiled', '20 Soiled', '50 Soiled', '100 Soiled', '200 Soiled', '500 Soiled']],
          body: [[
            ...['10', '20', '50', '100', '200', '500'].map(note => {
              const key = `_${note}NoteCount`;
              return rec[key] !== undefined && rec[key] !== null ? rec[key] : '';
            }),
            ...['10', '20', '50', '100', '200', '500'].map(note => {
              const soiledKey = `_${note}SoiledNoteCount`;
              return rec[soiledKey] !== undefined && rec[soiledKey] !== null ? rec[soiledKey] : '';
            })
          ]],
          theme: 'grid',
          headStyles: { fillColor: [11, 59, 114] },
          styles: { fontSize: 10 }
        });
        nextY = doc.lastAutoTable.finalY + 12;
      });

      const url = doc.output('bloburl');
      setPdfUrl(url);

    } catch (e) {
      setReportMsg('Failed to generate PDF');
    }
  };

  return (
    <div>
      <Sidebar isOpen={true} />
      <PageCard title="Day Closing Report">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <label style={{ marginRight: 8 }}>Organization:</label>
            <select value={selectedOrgId} onChange={e => setSelectedOrgId(e.target.value)} className="styled-select" style={{ minWidth: 180 }}>
              <option value="">All organizations</option>
              {organizations.map(org => (
                <option key={org.id || (org._links && org._links.self && org._links.self.href)} value={org.id || (org._links && org._links.self && org._links.self.href.split('/').pop())}>{org.name}</option>
              ))}
            </select>
          </div>
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
