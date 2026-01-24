import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { APP_SERVER_URL_PREFIX } from "../../../constants.js";
import Utils from '../../../Utils';
import './DayClosingReportPage.css';
import DefaultAppSidebarLayout from "../../../_layout/default-app-sidebar-layout/DefaultAppSidebarLayout";
import {Typography} from "antd";

export default function DayClosingReportPage() {
  const [records, setRecords] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [handloans, setHandloans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [modalFile, setModalFile] = useState(null);
  const [error, setError] = useState("");
  const [reportMsg, setReportMsg] = useState("");
  const [totals, setTotals] = useState({
    cashIn: 0,
    cashOut: 0,
    startingBalance: 0,
    expenseCashIn: 0,
    expenseCashOut: 0,
    handloanCashIn: 0,
    handloanCashOut: 0,
  });
  const [pdfUrl, setPdfUrl] = useState("");
  const [organizations, setOrganizations] = useState([]);
  const [organizationId, setOrganizationId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [attachments , setAttachments] = useState([]);
  const isAdminRole = Utils.isRoleApplicable('ADMIN');

  // Safe number formatting function
  const safeToLocaleString = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return "0.00";
    }
    return Number(value).toFixed(2).toLocaleString();
  };

  useEffect(() => {
    const bearerToken = localStorage.getItem("token");
    fetch(`${APP_SERVER_URL_PREFIX}/organizations`, {
      headers: { Authorization: `Bearer ${bearerToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const orgs = data._embedded ? data._embedded.organizations || [] : data;
        setOrganizations(orgs);
      })
      .catch(() => {});
  }, []);

  // Date filtering for expenses
  const getExpensesForDate = (date) => {
    return expenses.filter((expense) => {
      if (!expense.createdDate && !expense.transactionDate) return false;

      const expenseDateStr = expense.createdDate || expense.transactionDate;
      if (!expenseDateStr) return false;

      try {
        const expenseDate = new Date(expenseDateStr)
          .toISOString()
          .split("T")[0];
        return expenseDate === date;
      } catch (error) {
        console.warn("Invalid date format for expense:", expenseDateStr);
        return false;
      }
    });
  };

  // Date filtering for handloans
  const getHandloansForDate = (date) => {
    return handloans.filter((handloan) => {
      if (!handloan.createdDate && !handloan.transactionDate) return false;

      const handloanDateStr = handloan.createdDate || handloan.transactionDate;
      if (!handloanDateStr) return false;

      try {
        const handloanDate = new Date(handloanDateStr)
          .toISOString()
          .split("T")[0];
        return handloanDate === date;
      } catch (error) {
        console.warn("Invalid date format for handloan:", handloanDateStr);
        return false;
      }
    });
  };

  const getAllHandloansWithBalances = () => {
    return handloans.map((h) => {
      const loanAmount = Number(h.loanAmount) || 0;
      const balanceAmount = Number(h.balanceAmount) || 0;
      const recoveredAmount = loanAmount - balanceAmount;

      let status = "ISSUED";
      if (balanceAmount === 0 && loanAmount > 0) status = "RECOVERED";
      else if (recoveredAmount > 0 && balanceAmount > 0)
        status = "PARTIALLY RECOVERED";

      return {
        handLoanNumber: h.handLoanNumber || "N/A",
        partyName: h.partyName || "N/A",
        loanAmount,
        recoveredAmount,
        balanceAmount,
        status,
      };
    });
  };

  const currentPage = 0;
  const pageSize = 1000;

  const categorizeExpenses = (expensesList) => {
    const cashInExpenses = expensesList.filter(
      (expense) => expense.expenseType === "CASH-IN"
    );
    const cashOutExpenses = expensesList.filter(
      (expense) => expense.expenseType === "CASH-OUT"
    );

    return { cashInExpenses, cashOutExpenses };
  };

  // Handloan categorization - UPDATED
  const categorizeHandloans = (handloansList) => {
    const cashInHandloans = handloansList.filter(
      (handloan) =>
        handloan.handLoanType === "RECOVER" ||
        handloan.handLoanType === "RECEIVED"
    );
    const cashOutHandloans = handloansList.filter(
      (handloan) =>
        handloan.handLoanType === "ISSUE" || handloan.handLoanType === "GIVEN"
    );

    return { cashInHandloans, cashOutHandloans };
  };

  useEffect(() => {
    if(!isAdminRole) {
      setOrganizationId(localStorage.getItem('organizationId'));
    }
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
          `${APP_SERVER_URL_PREFIX}/expenses/report?organizationId=${organizationId}&createdDate=${selectedDate}`,
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
          `${APP_SERVER_URL_PREFIX}/handloans/all?page=${currentPage}&size=${pageSize}`,
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

  const formatDateDDMMYYYY = (dateValue) => {
    if (!dateValue) return "-";

    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return "-";

    return `${String(date.getDate()).padStart(2, "0")}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${date.getFullYear()}`;
  };

  const getIssuedAndPartialLoansByOrg = () => {
    if (!organizationId) return [];

    const loanMap = new Map();

    handloans.forEach((h) => {
      // 🔥 FILTER BY ORGANIZATION
      const loanOrgId =
        h.organizationId ||
        h.organization?.id ||
        h.organization?._links?.self?.href?.split("/").pop();

      if (String(loanOrgId) !== String(organizationId)) return;

      if (!h.handLoanNumber) return;

      const loanAmount = Number(h.loanAmount) || 0;
      const balanceAmount = Number(h.balanceAmount) || 0;
      const recoveredAmount = loanAmount - balanceAmount;

      // ❌ Remove fully recovered loans
      if (balanceAmount === 0) return;

      if (!loanMap.has(h.handLoanNumber)) {
        loanMap.set(h.handLoanNumber, {
          handLoanNumber: h.handLoanNumber,
          partyName: h.partyName || "N/A",
          loanAmount,
          recoveredAmount,
          balanceAmount,
        });
      } else {
        const existing = loanMap.get(h.handLoanNumber);
        existing.balanceAmount = balanceAmount;
        existing.recoveredAmount = loanAmount - balanceAmount;
      }
    });

    return Array.from(loanMap.values()).map((l) => ({
      ...l,
      status: l.recoveredAmount > 0 ? "PARTIALLY RECOVERED" : "ISSUED",
    }));
  };


  const fetchDayClosing = async (closingDate, orgId) => {
    try {
      setLoading(true);
      setError("");
      const bearerToken = localStorage.getItem("token");
      const response = await fetch(
        `${APP_SERVER_URL_PREFIX}/pettyCashDayClosings/search/findByClosingDateAndOrganizationId?closingDate=${closingDate}&organizationId=${orgId}`,
        {
          headers: { Authorization: `Bearer ${bearerToken}` },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      const data = await response.json();
      setRecords(data);
      console.log("Day Closing Data:", data._links.pettyCashDayClosingAttachment.href);
      const response2 = await fetch(
        data._links.pettyCashDayClosingAttachment.href,
        {
          headers: { Authorization: `Bearer ${bearerToken}` },
        }
      );
      if (!response2.ok) {
        throw new Error("Failed to fetch data");
      }
      const attachmentData = await response2.json();
      console.log("Attachments Data:", attachmentData);

      attachmentData._embedded ? setAttachments(attachmentData._embedded.pettyCashDayClosingAttachments || []) : setAttachments(attachmentData || []);

    } catch (err) {
      console.log(err);
      setAttachments([])
      setError("Day Closing not found for the selected date");
      setRecords(
        JSON.stringify({
          cashIn: 0,
          cashOut: 0,
          closingBalance: 0,
          openingBalance: 0,
        })
      );
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

const handleOrgChange = (e) => {
  const orgId = e.target.value;
  setOrganizationId(orgId);

  const org = organizations.find(
    (o) =>
      String(o.id || o._links?.self?.href?.split("/").pop()) === String(orgId)
  );

  setSelectedOrganization(org || null);
};


const getOrganizationAddressText = () => {
  if (!selectedOrganization?.address) return "";

  const { address, city, pincode } = selectedOrganization.address;

  return [address, city, pincode].filter(Boolean).join(", ");
};


  const UI_HEIGHTS = {
    EXPENSES_TABLE: "260px",
    LOANS_TABLE: "300px",
    DENOMINATION_TABLE: "250px",
  };

  const ensurePageSpace = (doc, y, requiredSpace = 40) => {
    const pageHeight = doc.internal.pageSize.height;
    if (y + requiredSpace > pageHeight - 20) {
      doc.addPage();
      return 20;
    }
    return y;
  };


const getIssuedAndPartialLoans = () => {
  const loanMap = new Map();

  handloans.forEach((h) => {
    if (!h.handLoanNumber) return;

    const loanAmount = Number(h.loanAmount) || 0;
    const balanceAmount = Number(h.balanceAmount) || 0;
    const recoveredAmount = loanAmount - balanceAmount;

    // ❌ REMOVE FULLY RECOVERED LOANS HERE
    if (balanceAmount === 0) return;

    if (!loanMap.has(h.handLoanNumber)) {
      loanMap.set(h.handLoanNumber, {
        handLoanNumber: h.handLoanNumber,
        partyName: h.partyName || "N/A",
        loanAmount,
        recoveredAmount,
        balanceAmount,
      });
    } else {
      const existing = loanMap.get(h.handLoanNumber);
      existing.balanceAmount = balanceAmount;
      existing.recoveredAmount = loanAmount - balanceAmount;
    }
  });

  return Array.from(loanMap.values()).map((l) => {
    const status = l.recoveredAmount > 0 ? "PARTIALLY RECOVERED" : "ISSUED";

    return { ...l, status };
  });
};


  const handleGenerateReport = () => {
    try {
      const filteredRecords = new Array(records);
      const filteredExpenses = getExpensesForDate(selectedDate);

      // ✅ ALL HANDLOANS (NO DATE FILTER)
// const filteredHandloans = getAllHandloansWithBalances();
// const filteredHandloans = getIssuedAndPartialLoans();
const filteredHandloans = getIssuedAndPartialLoansByOrg();



      const { cashInExpenses, cashOutExpenses } =
        categorizeExpenses(filteredExpenses);

      if (
        filteredRecords.length === 0 &&
        filteredExpenses.length === 0 &&
        filteredHandloans.length === 0
      ) {
        setReportMsg("No records found");
        return;
      }

      const doc = new jsPDF();
      const selectedRecord = filteredRecords[0];
      const startingBalance = Number(selectedRecord?.openingBalance) || 0;

      /* ================= HEADER ================= */
      doc.setFontSize(26);
     const orgName = selectedOrganization?.name || "Organization";

     doc.text(orgName, 105, 18, { align: "center" });


      const orgAddressText = getOrganizationAddressText();
  doc.setFontSize(13);  
      if (orgAddressText) {
        doc.text(orgAddressText, 105, 26, { align: "center" });
      }

      doc.line(20, 32, 190, 32);

      doc.setFontSize(14);
      const formattedDate = new Date(selectedDate).toLocaleDateString("en-GB"); // dd/mm/yyyy

      doc.text(
        `Day Closing Report - ${formattedDate.replaceAll("/", "-")}`,
        14,
        40
      );

      doc.setFontSize(13);
      doc.text(
        `Opening Balance: ${safeToLocaleString(startingBalance)}`,
        190,
        40,
        { align: "right" }
      );

      let currentY = 48;

      /* ================= DAY CLOSING ================= */
      autoTable(doc, {
        startY: currentY,
        head: [["Closing Date", "Description", "Cash In", "Cash Out", "Closing Balance"]],
        body: filteredRecords.map(() => [
          formatDateDDMMYYYY(records.closingDate),
          records.description || "-",
          safeToLocaleString(records.cashIn),
          safeToLocaleString(records.cashOut),
          safeToLocaleString(records.openingBalance+records.cashIn-records.cashOut),
        ]),
        theme: "grid",
        styles: { fontSize: 11 },
        columnStyles: {
          2: { halign: "right" },
          3: { halign: "right" },
          4: { halign: "right" }
        },
        pageBreak: "auto",
      });

      currentY = doc.lastAutoTable.finalY + 12;

      /* ================= EXPENSES ================= */
      doc.setFontSize(14);
      doc.text("EXPENSES SUMMARY", 105, currentY, { align: "center" });
      currentY += 10;

      currentY = ensurePageSpace(doc, currentY, 60);

      const pageWidth = doc.internal.pageSize.width;
      const margin = 10;
      const colWidth = (pageWidth - 2.2 * margin) / 2;

      /* CASH IN */
      autoTable(doc, {
        startY: currentY,
        head: [["Category", "Amount", "Description"]],
        body: cashInExpenses.map((e) => [
          e.expenseSubType || "-",
          safeToLocaleString(e.amount),
          e.description || "General",
        ]),
        tableWidth: colWidth,
        margin: { left: margin },
        styles: { fontSize: 11, overflow: "linebreak" },
        headStyles: { fillColor: [22, 163, 74], textColor: 255 },
        columnStyles: { 1: { halign: "center" } },
      });

      /* capture Y */
      const cashInEndY = doc.lastAutoTable.finalY;

      /* CASH OUT */
      autoTable(doc, {
        startY: currentY,
        head: [["Category", "Amount", "Description"]],
        body: cashOutExpenses.map((e) => [
          e.expenseSubType || "-",
          safeToLocaleString(e.amount),
          e.description || "General",
        ]),
        tableWidth: colWidth,
        margin: { left: margin + colWidth + margin },
        styles: { fontSize: 11, overflow: "linebreak" },
        headStyles: { fillColor: [185, 28, 28], textColor: 255 },
        columnStyles: { 1: { halign: "right" } },
      });

      currentY = doc.lastAutoTable.finalY + 20;
      const cashOutEndY = doc.lastAutoTable.finalY;

      currentY = Math.max(cashInEndY, cashOutEndY) + 25;
      if (filteredHandloans.length > 0) {
        doc.setFontSize(14);
        doc.text("HANDLOANS DETAILS", 105, currentY, { align: "center" });
        currentY += 8;
        let totalLoanAmount = 0;
        let totalRecoveredAmount = 0;
        let totalBalanceAmount = 0;

        filteredHandloans.forEach((h) => {
          totalLoanAmount += Number(h.loanAmount || 0);
          totalRecoveredAmount += Number(h.recoveredAmount || 0);
          totalBalanceAmount += Number(h.balanceAmount || 0);
        });

      autoTable(doc, {
        startY: currentY,
        head: [
          [
            "Loan ID",
            "Party Name",
            "Total Amount",
            "Narration",
            "Recovered Amount",
            "Balance Amount",
          ],
        ],
        body: [
          ...filteredHandloans.map((h) => [
            h.handLoanNumber,
            h.partyName,
            safeToLocaleString(h.loanAmount),
            h.narration,
            safeToLocaleString(h.recoveredAmount),
            safeToLocaleString(h.balanceAmount)
          ]),

          // ✅ TOTAL ROW
          [
            "TOTAL",
            "",            
            safeToLocaleString(totalLoanAmount),
            "",
            safeToLocaleString(totalRecoveredAmount),
            safeToLocaleString(totalBalanceAmount),
          ],
        ],
        theme: "grid",
        styles: { fontSize: 11 },
        headStyles: {
          fillColor: [30, 58, 138],
          textColor: 255,
          fontStyle: "bold",
        },
        didParseCell: function (data) {
          // Style TOTAL row
          if (
            data.row.index === filteredHandloans.length &&
            data.section === "body"
          ) {
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.fillColor = [243, 244, 246]; // light gray
          }
        },
         columnStyles: {
           2: { halign: "right" },
           3: { halign: "right" },
           4: { halign: "right" },
           5: { halign: "right" }
         },
      });

        currentY = doc.lastAutoTable.finalY + 14;
      }

      /* ================= DENOMINATION ================= */
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
          const amount = (Number(d.good) + Number(d.soiled)) * d.value;
          denominationTotal += amount;
          return [
            d.label,
            d.good || 0,
            d.soiled || 0,
            safeToLocaleString(amount),
          ];
        });

      const coinsCount =
        (records._1CoinCount || 0) +
        (records._5CoinCount || 0) +
        (records._10CoinCount || 0) +
        (records._20CoinCount || 0);

      if (coinsCount > 0) {
        denominationTotal += coinsCount;
        denominationRows.push([
          "COINS",
          coinsCount,
          0,
          safeToLocaleString(coinsCount),
        ]);
      }

      if (denominationRows.length > 0) {
        denominationRows.push([
          "TOTAL",
          "",
          "",
          safeToLocaleString(denominationTotal),
        ]);
      }
const coinsTotal =  0 ;//calculateCoinsTotal(); // Use your helper function
if (coinsTotal > 0) {
  denominationTotal += coinsTotal;

  // Add individual coin rows for clarity
  if (records._1CoinCount > 0) {
    denominationRows.push([
      "1 Coin",
      records._1CoinCount || 0,
      0,
      safeToLocaleString((records._1CoinCount || 0) * 1),
    ]);
  }
  if (records._5CoinCount > 0) {
    denominationRows.push([
      "5 Coin",
      records._5CoinCount || 0,
      0,
      safeToLocaleString((records._5CoinCount || 0) * 5),
    ]);
  }
  if (records._10CoinCount > 0) {
    denominationRows.push([
      "10 Coin",
      records._10CoinCount || 0,
      0,
      safeToLocaleString((records._10CoinCount || 0) * 10),
    ]);
  }
  if (records._20CoinCount > 0) {
    denominationRows.push([
      "0 Coin",
      records._20CoinCount || 0,
      0,
      safeToLocaleString((records._20CoinCount || 0) * 20),
    ]);
  }
}


      autoTable(doc, {
        startY: currentY,
        head: [["Note", "Good", "Soiled", "Amount"]],
        body: denominationRows,
        theme: "grid",
        styles: { fontSize: 11 },
        columnStyles: { 3: { halign: "right" } },
        pageBreak: "auto",
      });

      setPdfUrl(doc.output("bloburl"));
    } catch (e) {
      console.error("PDF generation error:", e);
      setReportMsg("Failed to generate PDF");
    }
  };

  // Function to calculate denomination total
  // const calculateDenominationTotal = () => {
  //   const denominations = [
  //     {
  //       value: 500,
  //       good: records._500NoteCount || 0,
  //       soiled: records._500SoiledNoteCount || 0,
  //     },
  //     {
  //       value: 200,
  //       good: records._200NoteCount || 0,
  //       soiled: records._200SoiledNoteCount || 0,
  //     },
  //     {
  //       value: 100,
  //       good: records._100NoteCount || 0,
  //       soiled: records._100SoiledNoteCount || 0,
  //     },
  //     {
  //       value: 50,
  //       good: records._50NoteCount || 0,
  //       soiled: records._50SoiledNoteCount || 0,
  //     },
  //     {
  //       value: 20,
  //       good: records._20NoteCount || 0,
  //       soiled: records._20SoiledNoteCount || 0,
  //     },
  //     {
  //       value: 10,
  //       good: records._10NoteCount || 0,
  //       soiled: records._10SoiledNoteCount || 0,
  //     },
  //   ];

  //   let total = 0;
  //   denominations.forEach((denom) => {
  //     const netNotes = denom.good - denom.soiled;
  //     total += netNotes * denom.value;
  //   });

  //   // Add coins
  //   const coinsCount =
  //     (records._1CoinCount || 0) +
  //     (records._5CoinCount || 0) +
  //     (records._10CoinCount || 0) +
  //     (records._20CoinCount || 0);
  //   total += coinsCount;

  //   return total;
  // };

  const calculateDenominationAmount = (
    denominationValue,
    goodCount,
    soiledCount
  ) => {
    const good = Number(goodCount) || 0;
    const soiled = Number(soiledCount) || 0;
    const netNotes = good + soiled;
    return netNotes * denominationValue;
  };

  const calculateCoinsTotal = () => {
    return (
      (Number(records._1CoinCount) || 0) * 1 +
      (Number(records._5CoinCount) || 0) * 5 +
      (Number(records._10CoinCount) || 0) * 10 +
      (Number(records._20CoinCount) || 0) * 20
    );
  };
  const calculateDenominationTotal = () => {
    const denominations = [
      {
        value: 500,
        good: records._500NoteCount || 0,
        soiled: records._500SoiledNoteCount || 0,
      },
      {
        value: 200,
        good: records._200NoteCount || 0,
        soiled: records._200SoiledNoteCount || 0,
      },
      {
        value: 100,
        good: records._100NoteCount || 0,
        soiled: records._100SoiledNoteCount || 0,
      },
      {
        value: 50,
        good: records._50NoteCount || 0,
        soiled: records._50SoiledNoteCount || 0,
      },
      {
        value: 20,
        good: records._20NoteCount || 0,
        soiled: records._20SoiledNoteCount || 0,
      },
      {
        value: 10,
        good: records._10NoteCount || 0,
        soiled: records._10SoiledNoteCount || 0,
      },
    ];

    let total = 0;
    denominations.forEach((denom) => {
      const goodNotes = Number(denom.good) || 0;
      const soiledNotes = Number(denom.soiled) || 0;
      const netNotes = goodNotes + soiledNotes;
      total += netNotes * denom.value;
    });

    // Add coins - FIXED: Make sure these are numbers
    const coinsCount =
      (Number(records._1CoinCount) || 0) +
      (Number(records._5CoinCount) || 0) * 5 +
      (Number(records._10CoinCount) || 0) * 10 +
      (Number(records._20CoinCount) || 0) * 20;

    total += coinsCount;

    return total;
  };

  const styles = {

    headerSection: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: "10px",
      padding: "6px 0",
      borderBottom: "1px solid #e2e8f0",
      gap: "20px",
    },

    dateSelector: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },

    dateLabel: {
      fontWeight: "600",
      color: "#374151",
      fontSize: "14px",
    },

    dateInput: {
      padding: "8px 12px",
      border: "1px solid #d1d5db",
      borderRadius: "6px",
      fontSize: "14px",
      backgroundColor: "white",
      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    },

    generateButton: {
      background: "linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)",
      color: "white",
      border: "none",
      padding: "12px 14px",
      borderRadius: "8px",
      fontWeight: "600",
      fontSize: "14px",
      cursor: "pointer",
      transition: "all 0.3s ease",
      boxShadow: "0 2px 4px rgba(30, 58, 138, 0.3)",
      whiteSpace: "nowrap",
    },

    summaryContainer: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "20px",
      marginBottom: "4px",
      padding: "3px 16px",
      marginTop: "10px",
    },

    summaryCard: {
      background: "white",
      padding: "5px",
      borderRadius: "12px",
      textAlign: "center",
      border: "1px solid #e2e8f0",
    },
    cashInCard: {
      borderLeft: "4px solid #2563eb",
      background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
    },
    cashOutCard: {
      borderLeft: "4px solid #dc2626",
      background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
    },
    netBalanceCard: {
      borderLeft: "4px solid #059669",
      background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
    },
    summaryAmount: {
      fontSize: "24px",
      fontWeight: "700",
      marginTop: "8px",
    },
    openingBalance: {
      fontSize: "24px",
      fontWeight: "700",
      marginTop: "8px",
    },
    tableContainer: {
      background: "white",
      borderRadius: "12px",
      overflow: "auto",
      height: "200px",
      marginBottom: "24px",
      overflowY: "auto",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
    },
    tableHeader: {
      background: "#3c93c1",
      color: "white",
    },
    tableHeaderCell: {
      padding: "6px 8px",
      textAlign: "left",
      fontWeight: "600",
      fontSize: "14px",
      borderBottom: "2px solid #e2e8f0",
    },
    tableCell: {
      padding: "14px 12px",
      borderBottom: "1px solid #f1f5f9",
      fontSize: "14px",
    },
    tableRow: {
      transition: "background-color 0.2s ease",
    },

    notesSection: {
      marginTop: "32px",
    },
    notesHeader: {
      textAlign: "center",
      color: "#1e3a8a",
      marginBottom: "16px",
      fontSize: "20px",
      fontWeight: "600",
    },
    scrollableContainer: {
      maxHeight: "500px",
      overflow: "auto",
      border: "1px solid #e2e8f0",
      borderRadius: "12px",
      background: "white",
    },

    successMessage: {
      color: "#059669",
      backgroundColor: "#f0fdf4",
      padding: "12px 16px",
      borderRadius: "8px",
      border: "1px solid #bbf7d0",
      marginBottom: "16px",
      fontWeight: "500",
    },
    errorMessage: {
      color: "#dc2626",
      backgroundColor: "#fef2f2",
      padding: "12px 16px",
      borderRadius: "8px",
      border: "1px solid #fecaca",
      marginBottom: "16px",
      fontWeight: "500",
    },

    pdfModal: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.6)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backdropFilter: "blur(4px)",
    },
    pdfContainer: {
      background: "#fff",
      borderRadius: "12px",
      boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
      padding: "10px",
      maxWidth: "90vw",
      maxHeight: "90vh",
      position: "relative",
      border: "1px solid #e2e8f0",
    },
    closeButton: {
      position: "absolute",
      top: "-10px",
      right: "-10px",
      fontSize: "20px",
      background: "#fff",
      border: "none",
      cursor: "pointer",
      color: "#645c5c",
      width: "30px",
      height: "30px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#eef1f4",
      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
    },

    loadingContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "10px",
      color: "#64748b",
      fontSize: "16px",
    },

    expensesSection: {
      marginTop: "12px",
      background: "white",
      borderRadius: "12px",
      padding: "10px",
      height: "350px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    },
    expensesHeader: {
      color: "#1e3a8a",
      marginBottom: "10px",
      fontSize: "18px",
      fontWeight: "600",
      textAlign: "center",
    },

    // New styles for denomination section
    denominationSection: {
      marginTop: "9px",
      background: "white",
      borderRadius: "12px",
      padding: "15px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    },
    denominationHeader: {
      color: "#1e3a8a",
      marginBottom: "15px",
      fontSize: "18px",
      fontWeight: "600",
      textAlign: "center",
    },

    // New styles for loans section
    loansSection: {
      marginTop: "9px",
      background: "white",
      borderRadius: "12px",
      padding: "15px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    },
    loansHeader: {
      color: "#1e3a8a",
      marginBottom: "15px",
      fontSize: "18px",
      fontWeight: "600",
      textAlign: "center",
    },
    loansSummary: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "15px",
      marginBottom: "15px",
      padding: "10px",
      backgroundColor: "#f8fafc",
      borderRadius: "8px",
      border: "1px solid #e2e8f0",
    },
    loansSummaryItem: {
      textAlign: "center",
      padding: "10px",
    },
    loansSummaryLabel: {
      fontSize: "14px",
      color: "#64748b",
      fontWeight: "500",
      marginBottom: "5px",
    },
    loansSummaryValue: {
      fontSize: "18px",
      fontWeight: "700",
      color: "#1e3a8a",
    },
  };

  const expensesForSelectedDate = getExpensesForDate(selectedDate);
  const handloansForSelectedDate = getHandloansForDate(selectedDate);
  const { cashInExpenses, cashOutExpenses } = categorizeExpenses(
    expensesForSelectedDate
  );
  const { cashInHandloans, cashOutHandloans } = categorizeHandloans(
    handloansForSelectedDate
  );

  // Get all handloans with balances for display
  // const allHandloansWithBalances = getAllHandloansWithBalances();
  // const allHandloansWithBalances = getIssuedAndPartialLoans();
  const allHandloansWithBalances = getIssuedAndPartialLoansByOrg();


  const totalLoanAmount = allHandloansWithBalances.reduce(
    (sum, h) => sum + h.loanAmount,
    0
  );
  const totalRecovered = allHandloansWithBalances.reduce(
    (sum, h) => sum + h.recoveredAmount,
    0
  );
  const totalBalance = allHandloansWithBalances.reduce(
    (sum, h) => sum + h.balanceAmount,
    0
  );

  return (
      <DefaultAppSidebarLayout pageTitle={'Reports'}>

        <div className="day-closing-report-page">

          <div className='report-page-header'>
            <div className={'page-title-section'}>
              <Typography.Title className='page-title' level={2}>
                Day Closing Report
              </Typography.Title>
            </div>
            <div className={'page-actions'}></div>
          </div>


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
            <select
              value={
                isAdminRole
                  ? organizationId
                  : localStorage.getItem("organizationId")
              }
              onChange={handleOrgChange}
              className="form-select"
              disabled={isAdminRole ? !selectedDate : true}
              required
            >
              <option value="">Select Branch</option>
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
            onClick={handleGenerateReport}
            onMouseOver={(e) => (e.target.style.transform = "translateY(-2px)")}
            onMouseOut={(e) => (e.target.style.transform = "translateY(0)")}
            disabled={!selectedDate || !organizationId}
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
            {/* Attachments Section */}
            {attachments.length > 0 && (
              <div style={styles.attachmentsSection}>
                <h4 style={{ color: "#059669", marginBottom: "10px" }}>
                  Attachments
                </h4>
                <div
                  style={{
                    ...styles.tableContainer,
                    width: "100%",
                    height: "100%",
                    overflowY: "auto",
                  }}
                >
                  <table style={styles.table}>
                    <thead style={styles.tableHeader}>
                      <tr>
                        <th style={styles.tableHeaderCell}>Description</th>
                        <th style={styles.tableHeaderCell}>File</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attachments.map((item, idx) => (
                        <tr key={idx} style={styles.tableRow}>
                          <td style={styles.tableCell}>
                            {item.description || "General"}
                          </td>
                          <td style={styles.tableCell}>
                            {item.imageData || item.fileUrl || item.file ? (
                              <button
                                className="btn-outline view-btn"
                                onClick={() =>
                                  setModalFile(
                                    item.imageData || item.fileUrl || item.file
                                  )
                                }
                              >
                                👁️ View
                              </button>
                            ) : (
                              <span className="no-receipt">(No receipt)</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Existing Expenses Section */}
            {(cashInExpenses.length > 0 || cashOutExpenses.length > 0) && (
              <div style={styles.expensesSection}>
                <div
                  className="hide-scrollbar"
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    gap: "20px",
                    width: "100%",
                    height: "90%",
                    overflowY: "auto",
                  }}
                >
                  <div
                    className="hide-scrollbar"
                    style={{
                      flex: 1,
                      minWidth: "48%",
                      height: "80%",
                    }}
                  >
                    <h4 style={{ color: "#059669", marginBottom: "10px" }}>
                      Cash In Expenses
                    </h4>
                    <div
                      style={{
                        ...styles.tableContainer,
                        width: "100%",
                        height: "100%",
                        overflowY: "auto",
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
                  <div
                    style={{
                      flex: 1,
                      minWidth: "48%",
                    }}
                  >
                    <h4 style={{ color: "#dc2626", marginBottom: "10px" }}>
                      Cash Out Expenses
                    </h4>
                    <div
                      style={{
                        ...styles.tableContainer,
                        width: "100%",
                        height: "80%",
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
            {(records._500NoteCount > 0 ||
              records._200NoteCount > 0 ||
              records._100NoteCount > 0 ||
              records._50NoteCount > 0 ||
              records._20NoteCount > 0 ||
              records._10NoteCount > 0 ||
              records._1CoinCount > 0 ||
              records._5CoinCount > 0 ||
              records._10CoinCount > 0 ||
              records._20CoinCount > 0) && (
              <div style={styles.denominationSection}>
                <h4 style={styles.denominationHeader}>
                  Cash Denomination Summary
                </h4>

                <div
                  style={{
                    ...styles.tableContainer,
                    height: UI_HEIGHTS.DENOMINATION_TABLE,
                    overflowY: "auto",
                  }}
                >
                  <table style={styles.table}>
                    <thead style={styles.tableHeader}>
                      <tr>
                        <th style={styles.tableHeaderCell}>Denomination</th>
                        <th style={styles.tableHeaderCell}>Good Notes</th>
                        <th style={styles.tableHeaderCell}>Soiled Notes</th>
                        <th style={styles.tableHeaderCell}>Amount</th>
                      </tr>
                    </thead>

                    <tbody>
                      {/* 500 Notes */}
                      {(records._500NoteCount > 0 ||
                        records._500SoiledNoteCount > 0) && (
                        <tr style={styles.tableRow}>
                          <td style={styles.tableCell}>₹ 500</td>
                          <td style={styles.tableCell}>
                            {records._500NoteCount || 0}
                          </td>
                          <td style={styles.tableCell}>
                            {records._500SoiledNoteCount || 0}
                          </td>
                          <td
                            style={{ ...styles.tableCell, fontWeight: "600" }}
                          >
                            ₹{" "}
                            {safeToLocaleString(
                              calculateDenominationAmount(
                                500,
                                records._500NoteCount,
                                records._500SoiledNoteCount
                              )
                            )}
                          </td>
                        </tr>
                      )}

                      {/* 200 Notes */}
                      {(records._200NoteCount > 0 ||
                        records._200SoiledNoteCount > 0) && (
                        <tr style={styles.tableRow}>
                          <td style={styles.tableCell}>₹ 200</td>
                          <td style={styles.tableCell}>
                            {records._200NoteCount || 0}
                          </td>
                          <td style={styles.tableCell}>
                            {records._200SoiledNoteCount || 0}
                          </td>
                          <td
                            style={{ ...styles.tableCell, fontWeight: "600" }}
                          >
                            ₹{" "}
                            {safeToLocaleString(
                              calculateDenominationAmount(
                                200,
                                records._200NoteCount,
                                records._200SoiledNoteCount
                              )
                            )}
                          </td>
                        </tr>
                      )}

                      {/* 100 Notes */}
                      {(records._100NoteCount > 0 ||
                        records._100SoiledNoteCount > 0) && (
                        <tr style={styles.tableRow}>
                          <td style={styles.tableCell}>₹ 100</td>
                          <td style={styles.tableCell}>
                            {records._100NoteCount || 0}
                          </td>
                          <td style={styles.tableCell}>
                            {records._100SoiledNoteCount || 0}
                          </td>
                          <td
                            style={{ ...styles.tableCell, fontWeight: "600" }}
                          >
                            ₹{" "}
                            {safeToLocaleString(
                              calculateDenominationAmount(
                                100,
                                records._100NoteCount,
                                records._100SoiledNoteCount
                              )
                            )}
                          </td>
                        </tr>
                      )}

                      {/* 50 Notes */}
                      {(records._50NoteCount > 0 ||
                        records._50SoiledNoteCount > 0) && (
                        <tr style={styles.tableRow}>
                          <td style={styles.tableCell}>₹ 50</td>
                          <td style={styles.tableCell}>
                            {records._50NoteCount || 0}
                          </td>
                          <td style={styles.tableCell}>
                            {records._50SoiledNoteCount || 0}
                          </td>
                          <td
                            style={{ ...styles.tableCell, fontWeight: "600" }}
                          >
                            ₹{" "}
                            {safeToLocaleString(
                              calculateDenominationAmount(
                                50,
                                records._50NoteCount,
                                records._50SoiledNoteCount
                              )
                            )}
                          </td>
                        </tr>
                      )}

                      {/* 20 Notes */}
                      {(records._20NoteCount > 0 ||
                        records._20SoiledNoteCount > 0) && (
                        <tr style={styles.tableRow}>
                          <td style={styles.tableCell}>₹ 20</td>
                          <td style={styles.tableCell}>
                            {records._20NoteCount || 0}
                          </td>
                          <td style={styles.tableCell}>
                            {records._20SoiledNoteCount || 0}
                          </td>
                          <td
                            style={{ ...styles.tableCell, fontWeight: "600" }}
                          >
                            ₹{" "}
                            {safeToLocaleString(
                              calculateDenominationAmount(
                                20,
                                records._20NoteCount,
                                records._20SoiledNoteCount
                              )
                            )}
                          </td>
                        </tr>
                      )}

                      {/* 10 Notes */}
                      {(records._10NoteCount > 0 ||
                        records._10SoiledNoteCount > 0) && (
                        <tr style={styles.tableRow}>
                          <td style={styles.tableCell}>₹ 10</td>
                          <td style={styles.tableCell}>
                            {records._10NoteCount || 0}
                          </td>
                          <td style={styles.tableCell}>
                            {records._10SoiledNoteCount || 0}
                          </td>
                          <td
                            style={{ ...styles.tableCell, fontWeight: "600" }}
                          >
                            ₹{" "}
                            {safeToLocaleString(
                              calculateDenominationAmount(
                                10,
                                records._10NoteCount,
                                records._10SoiledNoteCount
                              )
                            )}
                          </td>
                        </tr>
                      )}

                      {/* Coins - INDIVIDUAL ROWS for clarity */}
                      {records._1CoinCount > 0 && (
                        <tr style={styles.tableRow}>
                          <td style={styles.tableCell}>₹ 1 (Coin)</td>
                          <td style={styles.tableCell}>
                            {records._1CoinCount}
                          </td>
                          <td style={styles.tableCell}>-</td>
                          <td
                            style={{ ...styles.tableCell, fontWeight: "600" }}
                          >
                            ₹{" "}
                            {safeToLocaleString((records._1CoinCount || 0) * 1)}
                          </td>
                        </tr>
                      )}

                      {records._5CoinCount > 0 && (
                        <tr style={styles.tableRow}>
                          <td style={styles.tableCell}>₹ 5 (Coin)</td>
                          <td style={styles.tableCell}>
                            {records._5CoinCount}
                          </td>
                          <td style={styles.tableCell}>-</td>
                          <td
                            style={{ ...styles.tableCell, fontWeight: "600" }}
                          >
                            ₹{" "}
                            {safeToLocaleString((records._5CoinCount || 0) * 5)}
                          </td>
                        </tr>
                      )}

                      {records._10CoinCount > 0 && (
                        <tr style={styles.tableRow}>
                          <td style={styles.tableCell}>₹ 10 (Coin)</td>
                          <td style={styles.tableCell}>
                            {records._10CoinCount}
                          </td>
                          <td style={styles.tableCell}>-</td>
                          <td
                            style={{ ...styles.tableCell, fontWeight: "600" }}
                          >
                            ₹{" "}
                            {safeToLocaleString(
                              (records._10CoinCount || 0) * 10
                            )}
                          </td>
                        </tr>
                      )}

                      {records._20CoinCount > 0 && (
                        <tr style={styles.tableRow}>
                          <td style={styles.tableCell}>₹ 20 (Coin)</td>
                          <td style={styles.tableCell}>
                            {records._20CoinCount}
                          </td>
                          <td style={styles.tableCell}>-</td>
                          <td
                            style={{ ...styles.tableCell, fontWeight: "600" }}
                          >
                            ₹{" "}
                            {safeToLocaleString(
                              (records._20CoinCount || 0) * 20
                            )}
                          </td>
                        </tr>
                      )}

                      {/* TOTAL */}
                      <tr
                        style={{
                          ...styles.tableRow,
                          backgroundColor: "#f8fafc",
                        }}
                      >
                        <td
                          colSpan="3"
                          style={{ ...styles.tableCell, fontWeight: "700" }}
                        >
                          TOTAL
                        </td>
                        <td
                          style={{
                            ...styles.tableCell,
                            fontWeight: "700",
                            color: "#059669",
                          }}
                        >
                          ₹ {safeToLocaleString(calculateDenominationTotal())}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* Hand Loans Section */}
            {allHandloansWithBalances.length > 0 && (
              <div style={styles.loansSection}>
                <h4 style={styles.loansHeader}>Hand Loans Details</h4>

                <div
                  style={{
                    ...styles.tableContainer,
                    height: UI_HEIGHTS.LOANS_TABLE,
                    overflowY: "auto",
                  }}
                >
                  <table style={styles.table}>
                    <thead style={styles.tableHeader}>
                      <tr>
                        <th style={styles.tableHeaderCell}>Loan No</th>
                        <th style={styles.tableHeaderCell}>Party</th>
                        <th style={styles.tableHeaderCell}>Loan Amount</th>
                        <th style={styles.tableHeaderCell}>Narration</th>
                        <th style={styles.tableHeaderCell}>Recovered</th>
                        <th style={styles.tableHeaderCell}>Balance</th>
                        <th style={styles.tableHeaderCell}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allHandloansWithBalances.map((loan, idx) => (
                        <tr key={idx} style={styles.tableRow}>
                          <td style={styles.tableCell}>
                            {loan.handLoanNumber}
                          </td>
                          <td style={styles.tableCell}>{loan.partyName}</td>
                          <td style={styles.tableCell}>
                            {safeToLocaleString(loan.loanAmount)}
                          </td>
                          <td style={styles.tableCell}>
                            {loan.narration}
                          </td>
                          <td style={styles.tableCell}>
                            {safeToLocaleString(loan.recoveredAmount)}
                          </td>
                          <td style={styles.tableCell}>
                            {safeToLocaleString(loan.balanceAmount)}
                          </td>
                          <td
                            style={{
                              ...styles.tableCell,
                              fontWeight: "600",
                              color:
                                loan.status === "RECOVERED"
                                  ? "#059669"
                                  : loan.status === "PARTIALLY RECOVERED"
                                  ? "#d97706"
                                  : "#dc2626",
                            }}
                          >
                            {loan.status}
                          </td>
                        </tr>
                                                
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
        {/* Receipt Modal */}
        {modalFile && (
          <div className="modal-overlay" onClick={() => setModalFile(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Receipt Preview</h3>
                <button
                  className="modal-close"
                  onClick={() => setModalFile(null)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                {modalFile.startsWith("data:image") ? (
                  <img
                    src={modalFile}
                    alt="Expense Receipt"
                    className="receipt-image"
                  />
                ) : (
                  <img
                    src={`data:image/png;base64,${modalFile}`}
                    alt="Expense Receipt"
                    className="receipt-image"
                  />
                )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn-primary"
                  onClick={() => setModalFile(null)}
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
    </DefaultAppSidebarLayout>
  );
}