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

  useEffect(() => {
    if (!selectedDate || !organizationId) return;

    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError("");
        const bearerToken = localStorage.getItem("token");

        // Day closing
        await fetchDayClosing(selectedDate, organizationId);

        // Expenses
        const expensesResponse = await fetch(
          `${APP_SERVER_URL_PREFIX}/expenses?page=0&size=20&organizationId=${organizationId}&createdDate=${selectedDate}`,
          { headers: { Authorization: `Bearer ${bearerToken}` } }
        );

        if (expensesResponse.ok) {
          const expensesData = await expensesResponse.json();
          setExpenses(expensesData.content || expensesData || []);
        } else {
          setExpenses([]);
        }

        // Handloans
        const handloansResponse = await fetch(
          `${APP_SERVER_URL_PREFIX}/handloans/getHandLoansByOrgIdAndCreatedDate?page=0&size=20&organizationId=${organizationId}&createdDate=${selectedDate}`,
          { headers: { Authorization: `Bearer ${bearerToken}` } }
        );

        if (handloansResponse.ok) {
          const handloansData = await handloansResponse.json();
          setHandloans(handloansData.content || handloansData || []);
        } else {
          setHandloans([]);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch report data");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [selectedDate, organizationId]);


  const fetchDayClosing = async (closingDate, orgId) => {
    try {      
      setLoading(true);
      setError('');
      const bearerToken = localStorage.getItem('token');
      const response = await fetch(`${APP_SERVER_URL_PREFIX}/pettyCashDayClosings/search/findByClosingDateAndOrganizationId?closingDate=${closingDate}&organizationId=${orgId}`, {
        headers: { 'Authorization': `Bearer ${bearerToken}` }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const data = await response.json();

      setRecords(data);
    } catch (err) {
      console.log(err);
      setError('No records found for the selected date and organization');
      setRecords(JSON.stringify({cashIn :0, cashOut:0, closingBalance:0,openingBalance:0}));
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleOrgChange = (e) => {
    setOrganizationId(e.target.value);
  };

// const handleGenerateReport = () => {
//   try {
//     const filteredRecords = new Array(records);
//     const filteredExpenses = getExpensesForDate(selectedDate);
//     const filteredHandloans = getHandloansForDate(selectedDate);

//     const { cashInExpenses, cashOutExpenses } =
//       categorizeExpenses(filteredExpenses);
//     const { cashInHandloans, cashOutHandloans } =
//       categorizeHandloans(filteredHandloans);

//     if (
//       filteredRecords.length === 0 &&
//       filteredExpenses.length === 0 &&
//       filteredHandloans.length === 0
//     ) {
//       setReportMsg("No records found for the selected date");
//       return;
//     }

//     const doc = new jsPDF();
//     const selectedRecord = filteredRecords[0];
//     const startingBalance = Number(selectedRecord?.openingBalance) || 0;
//     doc.setFontSize(26);
//     doc.text("Sri Divya Sarees", 105, 18, { align: "center" });
//     doc.setFontSize(12);
//     doc.text("Old Temple Road, Gulzar House, Hyderabad 500066", 105, 26, {
//       align: "center",
//     });
//     doc.setLineWidth(0.5);
//     doc.line(20, 32, 190, 32);
//     doc.setFontSize(14);
//     doc.text(`Day Closing Report - ${selectedDate}`, 14, 40);
//     doc.setFontSize(13);
//     doc.text(
//       `Opening Balance: ${safeToLocaleString(startingBalance)}`,
//       190,
//       40,
//       { align: "right" }
//     );

//     let currentY = 48;
//     autoTable(doc, {
//       startY: currentY,
//       head: [
//         ["Closing Date", "Description", "Total Cash-In", "Total Cash-Out"],
//       ],
//       body: filteredRecords.map(() => [
//         records.closingDate || "",
//         records.description || "",
//         records.cashIn ? safeToLocaleString(records.cashIn) : "-",
//         records.cashOut ? safeToLocaleString(records.cashOut) : "-",
//       ]),
//       theme: "grid",
//       headStyles: { fillColor: [11, 59, 114] },
//       styles: { fontSize: 10 },
//     });

//     currentY = doc.lastAutoTable.finalY + 10;

//     doc.setFontSize(14);
//     doc.text("EXPENSES SUMMARY", 105, currentY, { align: "center" });
//     currentY += 10;

//     const pageWidth = doc.internal.pageSize.width;
//     const margin = 20;
//     const colWidth = (pageWidth - 3 * margin) / 2;

//     autoTable(doc, {
//       startY: currentY,
//       head: [["ID", "Amount", "Description"]],
//       body: cashInExpenses.map((e) => [
//         e.id,
//         safeToLocaleString(e.amount),
//         e.description,
//       ]),
//       theme: "grid",
//       styles: { fontSize: 8 },
//       headStyles: { fillColor: [34, 139, 34] },
//       tableWidth: colWidth,
//       margin: { left: margin },
//     });

//     autoTable(doc, {
//       startY: currentY,
//       head: [["ID", "Amount", "Description"]],
//       body: cashOutExpenses.map((e) => [
//         e.id,
//         safeToLocaleString(e.amount),
//         e.description,
//       ]),
//       theme: "grid",
//       styles: { fontSize: 8 },
//       headStyles: { fillColor: [220, 53, 69] },
//       tableWidth: colWidth,
//       margin: { left: margin + colWidth + margin },
//     });

//     currentY = doc.lastAutoTable.finalY + 15;
//     doc.setFontSize(14);
//     doc.text("HANDLOANS SUMMARY", 105, currentY, { align: "center" });
//     currentY += 10;

//     autoTable(doc, {
//       startY: currentY,
//       head: [["ID", "Amount", "Person"]],
//       body: cashOutHandloans.map((h) => [
//         h.handLoanNumber,
//         safeToLocaleString(h.loanAmount),
//         h.partyName,
//       ]),
//       theme: "grid",
//       styles: { fontSize: 8 },
//       headStyles: { fillColor: [220, 53, 69] },
//       tableWidth: colWidth,
//       margin: { left: margin },
//     });

//     autoTable(doc, {
//       startY: currentY,
//       head: [["ID", "Amount", "Person"]],
//       body: cashInHandloans.map((h) => [
//         h.handLoanNumber,
//         safeToLocaleString(h.loanAmount),
//         h.partyName,
//       ]),
//       theme: "grid",
//       styles: { fontSize: 8 },
//       headStyles: { fillColor: [34, 139, 34] },
//       tableWidth: colWidth,
//       margin: { left: margin + colWidth + margin },
//     });

//     currentY = doc.lastAutoTable.finalY + 15;

//     doc.setFontSize(12);
//     doc.text(`Day Closing Details - ${records.closingDate}`, 20, currentY);
//     currentY += 10;

//     autoTable(doc, {
//       startY: currentY,
//       body: [
//         ["Description", records.description || ""],
//         ["Opening Balance", safeToLocaleString(records.openingBalance || 0)],
//         ["Cash In", safeToLocaleString(records.cashIn || 0)],
//         ["Cash Out", safeToLocaleString(records.cashOut || 0)],
//         ["Closing Balance", safeToLocaleString(records.closingBalance || 0)],
//       ],
//       theme: "grid",
//       styles: { fontSize: 10 },
//       columnStyles: {
//         0: { fontStyle: "bold", fillColor: [240, 240, 240] },
//       },
//     });

//     currentY = doc.lastAutoTable.finalY + 15;

//     doc.setFontSize(11);
//     doc.text("Cash Denomination Summary", 20, currentY);
//     currentY += 8;

//     autoTable(doc, {
//       startY: currentY,
//       head: [["Type", "1", "5", "10", "20", "50", "100", "200", "500"]],
//       body: [
//         [
//           "Coins",
//           records._1CoinCount || 0,
//           records._5CoinCount || 0,
//           records._10CoinCount || 0,
//           records._20CoinCount || 0,
//           "-",
//           "-",
//           "-",
//           "-",
//         ],
//         [
//           "Notes",
//           "-",
//           "-",
//           records._10NoteCount || 0,
//           records._20NoteCount || 0,
//           records._50NoteCount || 0,
//           records._100NoteCount || 0,
//           records._200NoteCount || 0,
//           records._500NoteCount || 0,
//         ],
//         [
//           "Soiled Notes",
//           "-",
//           "-",
//           records._10SoiledNoteCount || 0,
//           records._20SoiledNoteCount || 0,
//           records._50SoiledNoteCount || 0,
//           records._100SoiledNoteCount || 0,
//           records._200SoiledNoteCount || 0,
//           records._500SoiledNoteCount || 0,
//         ],
//       ],
//       theme: "grid",
//       styles: { fontSize: 10, halign: "center" },
//       headStyles: { fillColor: [11, 59, 114] },
//       didParseCell(data) {
//         if (data.column.index === 0 && data.row.section === "body") {
//           data.cell.styles.fontStyle = "bold";
//         }
//         if (data.row.raw?.[0] === "Soiled Notes") {
//           data.cell.styles.fillColor = [255, 235, 235];
//         }
//       },
//     });

//     const url = doc.output("bloburl");
//     setPdfUrl(url);
//   } catch (e) {
//     console.error("PDF generation error:", e);
//     setReportMsg("Failed to generate PDF");
//   }
// };

const handleGenerateReport = () => {
  try {
    const doc = new jsPDF();
    let currentY = 18;

    const selectedRecord = records;
    const openingBalance = Number(selectedRecord?.openingBalance) || 0;
    const closingBalance = Number(selectedRecord?.closingBalance) || 0;

    const filteredExpenses = getExpensesForDate(selectedDate);
    const filteredHandloans = getHandloansForDate(selectedDate);

    const { cashInExpenses, cashOutExpenses } =
      categorizeExpenses(filteredExpenses);
    const { cashOutHandloans } = categorizeHandloans(filteredHandloans);

    /* ================= COMPANY HEADER (EXACT OLD STYLE) ================= */
    doc.setFontSize(26);
    doc.setTextColor(0);
    doc.text("Sri Divya Sarees", 105, 18, { align: "center" });

    doc.setFontSize(12);
    doc.text("Old Temple Road, Gulzar House, Hyderabad 500066", 105, 26, {
      align: "center",
    });

    doc.setLineWidth(0.5);
    doc.line(20, 32, 190, 32);

    /* ================= TITLE + OPENING BALANCE (EXACT OLD POSITION) ================= */
    doc.setFontSize(14);
    doc.text(`Day Closing Report - ${selectedDate}`, 14, 40);

    doc.setFontSize(13);
    doc.text(
      `Opening Balance: ${safeToLocaleString(openingBalance)}`,
      190,
      40,
      { align: "right" }
    );
    /* ================= COMPANY HEADER (EXACT OLD STYLE) ================= */
    doc.setFontSize(26);
    doc.setTextColor(0);
    doc.text("Sri Divya Sarees", 105, 18, { align: "center" });

    doc.setFontSize(12);
    doc.text("Old Temple Road, Gulzar House, Hyderabad 500066", 105, 26, {
      align: "center",
    });

    doc.setLineWidth(0.5);
    doc.line(20, 32, 190, 32);

    /* ================= TITLE + OPENING BALANCE (EXACT OLD POSITION) ================= */
    doc.setFontSize(14);
    doc.text(`Day Closing Report - ${selectedDate}`, 14, 40);

    doc.setFontSize(13);
    doc.text(
      `Opening Balance: ${safeToLocaleString(openingBalance) || 0}`,
      190,
      40,
      { align: "right" }
    );

     currentY = 48; // 👈 EXACT same as old

    /* ================= CREDIT / DEBIT ================= */

    // CREDIT
    const creditRows = [
      ["OPENING BALANCE", safeToLocaleString(openingBalance)],
    ];
    cashInExpenses.forEach((exp) => {
      creditRows.push([
        exp.description || exp.expenseSubType || "CASH-IN",
        safeToLocaleString(exp.amount),
      ]);
    });

    const creditTotal = creditRows.reduce(
      (sum, r) => sum + Number(r[1].replace(/,/g, "")),
      0
    );
    creditRows.push(["TOTAL", safeToLocaleString(creditTotal)]);

    // DEBIT
    const debitRows = [];
    cashOutExpenses.forEach((exp) => {
      debitRows.push([
        exp.description || exp.expenseSubType || "CASH-OUT",
        safeToLocaleString(exp.amount),
      ]);
    });

    const debitTotal = cashOutExpenses.reduce(
      (sum, e) => sum + Number(e.amount || 0),
      0
    );
    debitRows.push(["TOTAL", safeToLocaleString(debitTotal)]);

    autoTable(doc, {
      startY: currentY,
      head: [["CREDIT", "AMOUNT"]],
      body: creditRows,
      theme: "grid",
      tableWidth: 85,
      margin: { left: 15 },
      headStyles: {
        fillColor: [22, 163, 74],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: { fontSize: 10 },
      didParseCell(data) {
        if (data.row.raw?.[0] === "TOTAL") {
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    autoTable(doc, {
      startY: currentY,
      head: [["DEBIT", "AMOUNT"]],
      body: debitRows,
      theme: "grid",
      tableWidth: 85,
      margin: { left: 110 },
      headStyles: {
        fillColor: [220, 38, 38],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: { fontSize: 10 },
      didParseCell(data) {
        if (data.row.raw?.[0] === "TOTAL") {
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    currentY = Math.max(doc.lastAutoTable.finalY, currentY) + 12;

    /* ================= HAND LOAN (ONLY IF > 0) ================= */
    let handLoanTotal = 0;

    const handLoanRows = cashOutHandloans.map((h) => {
      handLoanTotal += Number(h.loanAmount || 0);
      return [
        h.partyName || "N/A",
        h.handLoanType || "HAND LOAN",
        selectedDate,
        safeToLocaleString(h.loanAmount),
      ];
    });

    if (handLoanTotal > 0) {
      doc.setFontSize(13);
      doc.setTextColor(30, 64, 175);
      doc.text("HAND LOAN SUMMARY", 105, currentY, { align: "center" });

      currentY += 6;
      handLoanRows.push(["TOTAL", "", "", safeToLocaleString(handLoanTotal)]);

      autoTable(doc, {
        startY: currentY,
        head: [["NAME", "TYPE", "DATE", "AMOUNT"]],
        body: handLoanRows,
        theme: "grid",
        headStyles: {
          fillColor: [2, 132, 199],
          textColor: 255,
          fontStyle: "bold",
        },
        styles: { fontSize: 9 },
        didParseCell(data) {
          if (data.row.raw?.[0] === "TOTAL") {
            data.cell.styles.fontStyle = "bold";
          }
        },
      });

      currentY = doc.lastAutoTable.finalY + 12;
    }

    /* ================= DENOMINATION ================= */
    doc.setFontSize(13);
    doc.setTextColor(30, 64, 175);
    doc.text("DENOMINATION SUMMARY", 105, currentY, { align: "center" });

    currentY += 6;

    const denominations = [
      {
        label: "500",
        value: 500,
        good: records._500NoteCount,
        soiled: records._500SoiledNoteCount,
      },
      {
        label: "200",
        value: 200,
        good: records._200NoteCount,
        soiled: records._200SoiledNoteCount,
      },
      {
        label: "100",
        value: 100,
        good: records._100NoteCount,
        soiled: records._100SoiledNoteCount,
      },
      {
        label: "50",
        value: 50,
        good: records._50NoteCount,
        soiled: records._50SoiledNoteCount,
      },
      {
        label: "20",
        value: 20,
        good: records._20NoteCount,
        soiled: records._20SoiledNoteCount,
      },
      {
        label: "10",
        value: 10,
        good: records._10NoteCount,
        soiled: records._10SoiledNoteCount,
      },
    ];

    let denominationTotal = 0;

    const denominationRows = denominations
      .filter((d) => Number(d.good) > 0 || Number(d.soiled) > 0)
      .map((d) => {
        const amount = (Number(d.good) - Number(d.soiled)) * d.value;
        denominationTotal += amount;
        return [
          d.label,
          d.good || "",
          d.soiled || "",
          safeToLocaleString(amount),
        ];
      });

    const coinsAmount =
      (records._1CoinCount || 0) +
      (records._5CoinCount || 0) +
      (records._10CoinCount || 0) +
      (records._20CoinCount || 0);

    if (coinsAmount > 0) {
      denominationTotal += coinsAmount;
      denominationRows.push([
        "COINS",
        coinsAmount,
        "",
        safeToLocaleString(coinsAmount),
      ]);
    }

    denominationRows.push([
      "TOTAL",
      "",
      "",
      safeToLocaleString(denominationTotal),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [["NOTE", "GOOD", "SOILED", "AMOUNT"]],
      body: denominationRows,
      theme: "grid",
      headStyles: {
        fillColor: [124, 58, 237],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: { fontSize: 10, halign: "center" },
      didParseCell(data) {
        if (data.row.raw?.[0] === "TOTAL") {
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    const url = doc.output("bloburl");
    setPdfUrl(url);
  } catch (err) {
    console.error(err);
    setReportMsg("Failed to generate report");
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
      marginTop:"10px",
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
      marginBottom: '4px',
      padding: '3px 16px',
      marginTop:"10px",
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
    openingBalance: {
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
            <label style={styles.dateLabel}>
              Select Date To Generate Report:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              style={styles.dateInput}
            />
          </div>
          <div className="form-group">
            {/* <label className="form-label">Organization</label> */}
            <select
              value={organizationId}
              onChange={handleOrgChange}
              className="form-select"
              disabled={!selectedDate} // 🔥 IMPORTANT
              required
            >
              <option value="">Select organization</option>
              {organizations.map((org) => (
                <option
                  key={
                    org.id ||
                    (org._links && org._links.self && org._links.self.href)
                  }
                  value={
                    org.id ||
                    (org._links &&
                      org._links.self &&
                      org._links.self.href.split("/").pop())
                  }
                >
                  {org.name}
                </option>
              ))}
            </select>
          </div>
          <button
            className="btn-primary1"
            // style={styles.generateButton}
            onClick={handleGenerateReport}
            onMouseOver={(e) => (e.target.style.transform = "translateY(-2px)")}
            onMouseOut={(e) => (e.target.style.transform = "translateY(0)")}
          >
            📊 Generate Report
          </button>
        </div>

        {pdfUrl && (
          <div style={styles.pdfModal}>
            <div style={styles.pdfContainer}>
              <button
                style={styles.closeButton}
                onClick={() => {
                  setPdfUrl("");
                }}
              >
                ×
              </button>
              <iframe
                src={pdfUrl}
                title="Day Closing PDF Report"
                style={{
                  width: "70vw",
                  height: "75vh",
                  border: "none",
                  borderRadius: "8px",
                }}
              />
              <div style={{ textAlign: "right", marginTop: "16px" }}>
                <a
                  href={pdfUrl}
                  download={`DayClosingReport_${selectedDate}.pdf`}
                  style={{
                    ...styles.generateButton,
                    textDecoration: "none",
                    display: "inline-block",
                  }}
                >
                  📥 Download PDF
                </a>
              </div>
            </div>
          </div>
        )}

        {reportMsg && (
          <div
            style={
              reportMsg.includes("Failed")
                ? styles.errorMessage
                : styles.successMessage
            }
          >
            {reportMsg.includes("Failed") ? "❌" : "✅"} {reportMsg}
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
               <div style={{ ...styles.summaryCard }}>
                <div
                  style={{
                    color: "#2563eb",
                    fontWeight: "600",
                    fontSize: "14px",
                  }}
                >
                  Opening Balance
                </div>
                <div style={{ ...styles.openingBalance, color: "#2563eb" }}>
                  {safeToLocaleString(records.openingBalance)}
                </div>
              </div>
              <div style={{ ...styles.summaryCard }}>
                <div
                  style={{
                    color: "#2563eb",
                    fontWeight: "600",
                    fontSize: "14px",
                  }}
                >
                  Total Cash-In
                </div>
                <div style={{ ...styles.summaryAmount, color: "#2563eb" }}>
                  {safeToLocaleString(records.cashIn)}
                </div>
              </div>
              <div style={{ ...styles.summaryCard }}>
                <div
                  style={{
                    color: "#dc2626",
                    fontWeight: "600",
                    fontSize: "14px",
                  }}
                >
                  Total Cash-Out
                </div>
                <div style={{ ...styles.summaryAmount, color: "#dc2626" }}>
                  {safeToLocaleString(records.cashOut)}
                </div>
                {/* <div style={{fontSize: '12px', color: '#64748b', marginTop: '8px'}}>
                  Petty Cash: {safeToLocaleString(totals.cashOut)}
                </div>
                <div style={{fontSize: '12px', color: '#64748b'}}>
                  Expenses: {safeToLocaleString(totals.expenseCashOut)}
                </div> */}
              </div>
              <div style={{ ...styles.summaryCard }}>
                <div
                  style={{
                    color: "#059669",
                    fontWeight: "600",
                    fontSize: "14px",
                  }}
                >
                  Net Balance
                </div>
                <div style={{ ...styles.summaryAmount, color: "#059669" }}>
                  {safeToLocaleString(records.closingBalance)}
                </div>
              </div>
            </div>

            {/* Existing Expenses Section */}
            {(cashInExpenses.length > 0 || cashOutExpenses.length > 0) && (
              <div style={styles.expensesSection}>
                <h3 style={styles.expensesHeader}>
                  Expenses for {selectedDate}
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    gap: "20px",
                    width: "100%",
                  }}
                >
                  <div style={{ flex: 1, minWidth: "48%" }}>
                    <h4 style={{ color: "#059669", marginBottom: "10px" }}>
                      Cash In Expenses
                    </h4>
                    <div
                      style={{
                        ...styles.tableContainer,
                        width: "100%",
                        height: "auto",
                      }}
                    >
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
                              <td style={styles.tableCell}>
                                {expense.id || "N/A"}
                              </td>
                              <td
                                style={{
                                  ...styles.tableCell,
                                  color: "#059669",
                                  fontWeight: "600",
                                }}
                              >
                                {safeToLocaleString(expense.amount)}
                              </td>
                              <td style={styles.tableCell}>
                                {expense.description || "General"}
                              </td>
                              <td style={styles.tableCell}>
                                {expense.expenseSubType || "CASH-IN"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: "48%" }}>
                    <h4 style={{ color: "#dc2626", marginBottom: "10px" }}>
                      Cash Out Expenses
                    </h4>
                    <div
                      style={{
                        ...styles.tableContainer,
                        width: "100%",
                        height: "auto",
                      }}
                    >
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
                              <td style={styles.tableCell}>
                                {expense.id || "N/A"}
                              </td>
                              <td
                                style={{
                                  ...styles.tableCell,
                                  color: "#dc2626",
                                  fontWeight: "600",
                                }}
                              >
                                {safeToLocaleString(expense.amount)}
                              </td>
                              <td style={styles.tableCell}>
                                {expense.description || "General"}
                              </td>
                              <td style={styles.tableCell}>
                                {expense.expenseSubType || "CASH-OUT"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>                  
                </div>
              </div>
            )}
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
                  {
                    <tr style={styles.tableRow}>
                      <td style={styles.tableCell}>{records.closingDate}</td>
                      <td style={styles.tableCell}>{records.description}</td>
                      <td style={styles.tableCell}>
                        {safeToLocaleString(records.startingBalance)}
                      </td>
                      <td
                        style={{
                          ...styles.tableCell,
                          color: "#059669",
                          fontWeight: "500",
                        }}
                      >
                        {records.cashIn
                          ? ` ${safeToLocaleString(records.cashIn)}`
                          : "-"}
                      </td>
                      <td
                        style={{
                          ...styles.tableCell,
                          color: "#dc2626",
                          fontWeight: "500",
                        }}
                      >
                        {records.cashOut
                          ? ` ${safeToLocaleString(records.cashOut)}`
                          : "-"}
                      </td>
                      <td
                        style={{
                          ...styles.tableCell,
                          color: "#1e3a8a",
                          fontWeight: "600",
                        }}
                      >
                        {safeToLocaleString(records.closingBalance)}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <div style={styles.notesSection}>
              <h3 style={styles.notesHeader}>Notes & Coin Summary</h3>
              <div style={styles.scrollableContainer}>
                <table
                  className="payroll-table"
                  style={{ ...styles.table, minWidth: "100%" }}
                >
                  <thead style={styles.tableHeader}>
                    <tr>
                      <th style={styles.tableHeaderCell}>Date</th>
                      <th style={styles.tableHeaderCell}>1 Coin</th>
                      <th style={styles.tableHeaderCell}>5 Coin</th>
                      <th style={styles.tableHeaderCell}>10 Coin</th>
                      <th style={styles.tableHeaderCell}>20 Coin</th>
                      <th style={styles.tableHeaderCell}>10 Note</th>
                      <th style={styles.tableHeaderCell}>20 Note</th>
                      <th style={styles.tableHeaderCell}>50 Note</th>
                      <th style={styles.tableHeaderCell}>100 Note</th>
                      <th style={styles.tableHeaderCell}>200 Note</th>
                      <th style={styles.tableHeaderCell}>500 Note</th>
                      <th style={styles.tableHeaderCell}>10 Soiled</th>
                      <th style={styles.tableHeaderCell}>20 Soiled</th>
                      <th style={styles.tableHeaderCell}>50 Soiled</th>
                      <th style={styles.tableHeaderCell}>100 Soiled</th>
                      <th style={styles.tableHeaderCell}>200 Soiled</th>
                      <th style={styles.tableHeaderCell}>500 Soiled</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr key={records.id} style={styles.tableRow}>
                      <td style={styles.tableCell}>{records.closingDate}</td>
                      <td style={styles.tableCell}>
                        {records._1CoinCount || 0}
                      </td>
                      <td style={styles.tableCell}>
                        {records._5CoinCount || 0}
                      </td>
                      <td style={styles.tableCell}>
                        {records._10CoinCount || 0}
                      </td>
                      <td style={styles.tableCell}>
                        {records._20CoinCount || 0}
                      </td>
                      <td style={styles.tableCell}>
                        {records._10NoteCount || 0}
                      </td>
                      <td style={styles.tableCell}>
                        {records._20NoteCount || 0}
                      </td>
                      <td style={styles.tableCell}>
                        {records._50NoteCount || 0}
                      </td>
                      <td style={styles.tableCell}>
                        {records._100NoteCount || 0}
                      </td>
                      <td style={styles.tableCell}>
                        {records._200NoteCount || 0}
                      </td>
                      <td style={styles.tableCell}>
                        {records._500NoteCount || 0}
                      </td>
                      <td style={{ ...styles.tableCell, color: "#dc2626" }}>
                        {records._10SoiledNoteCount || 0}
                      </td>
                      <td style={{ ...styles.tableCell, color: "#dc2626" }}>
                        {records._20SoiledNoteCount || 0}
                      </td>
                      <td style={{ ...styles.tableCell, color: "#dc2626" }}>
                        {records._50SoiledNoteCount || 0}
                      </td>
                      <td style={{ ...styles.tableCell, color: "#dc2626" }}>
                        {records._100SoiledNoteCount || 0}
                      </td>
                      <td style={{ ...styles.tableCell, color: "#dc2626" }}>
                        {records._200SoiledNoteCount || 0}
                      </td>
                      <td style={{ ...styles.tableCell, color: "#dc2626" }}>
                        {records._500SoiledNoteCount || 0}
                      </td>
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