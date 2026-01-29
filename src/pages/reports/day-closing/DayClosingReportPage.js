import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {DATE_DISPLAY_FORMAT} from "../../../constants.js";
import Utils from '../../../Utils';
import './DayClosingReportPage.css';
import DefaultAppSidebarLayout from "../../../_layout/default-app-sidebar-layout/DefaultAppSidebarLayout";
import {
  Alert,
  App as AntApp,
  Button,
  DatePicker,
  Form,
  Modal,
  Progress,
  Select,
  Spin,
  Table,
  Tag,
  Typography
} from "antd";
import {fetchOrganizations} from "../../user-administration/organizations/OrganizationDataSource";
import FormUtils from "../../../_utils/FormUtils";
import {calculateDenominationAmount, convertDenominationsToRecords, safeToLocaleString} from './utils';
import {
  fetchAllHandLoans,
  fetchDayClosingData,
  fetchExpenseReportData
} from "./dayClosingReportApiService";
import dayjs from "dayjs";
import {EyeOutlined, FilePdfOutlined} from "@ant-design/icons";
import DayClosingSummaryCardsSection from "./sections/DayClosingSummaryCardsSection";
import {fetchWithAuth, formatCurrency} from "../../../_utils/datasource-utils";

const tableCustomStyles = {
  header: {
    cell: {
      fontWeight: 600,
      fontSize: '0.95rem',
      color: 'white',
      padding: '12px 16px',
      backgroundColor: 'var(--primary-10)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
    },
  }
};

const statusConfig = {
  'ISSUED': {label: 'ISSUED', color: '#3b82f6'},
  'PARTIALLY RECOVERED': {label: 'PARTIALLY RECOVERED', color: '#f59e0b'}
};


export default function DayClosingReportPage() {
  const [records, setRecords] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [handloans, setHandloans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [modalFile, setModalFile] = useState(null);
  const [error, setError] = useState("");

  const [filterForm] = Form.useForm();

  const [pdfUrl, setPdfUrl] = useState("");
  const [organizations, setOrganizations] = useState([]);
  const [attachments , setAttachments] = useState([]);
  const isAdmin = Utils.isRoleApplicable('ADMIN');
  const formUtils = new FormUtils(AntApp.useApp());


  const fetchOrganizationsData = async () => {
    try {
      const data = await fetchOrganizations(0, 1000);
      setOrganizations(data._embedded ? data._embedded.organizations || [] : data);
    } catch (error) {
      console.error("Error fetching data:", error);
      formUtils.showErrorNotification("Failed to fetch organizations");
    }
  };

  async function fetchReportData(closingDate, organizationId) {
    setLoading(true);
    setError("");
    try {
      await fetchDayClosing(closingDate, organizationId);

      // fetch expenses data
      const expensesData = await fetchExpenseReportData(organizationId, closingDate);
      setExpenses(expensesData.content || expensesData || []);

      // Handloans
      const handloansData = await fetchAllHandLoans(currentPage, pageSize);
      setHandloans(handloansData.content || handloansData || []);

    } catch (err) {
      console.error(err);
      setExpenses([]);
      setHandloans([]);
      formUtils.showErrorNotification("Failed to fetch report data");
    }
    setLoading(false);
  }



  useEffect(() => {
    filterForm.setFieldsValue({
      organizationId: !isAdmin ? parseInt(localStorage.getItem("organizationId")) : null
    });
    fetchOrganizationsData();
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

  const formatDateDDMMYYYY = (dateValue) => {
    if (!dateValue) return "-";

    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return "-";

    return `${String(date.getDate()).padStart(2, "0")}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${date.getFullYear()}`;
  };

  const getIssuedAndPartialLoansByOrg = () => {
    const organizationId = filterForm.getFieldValue('organizationId');
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
    setLoading(true);
    setError("");
    try {

      const data = await fetchDayClosingData(orgId, closingDate);
      setRecords(data);

      const attachmentData = await fetchWithAuth(data._links.pettyCashDayClosingAttachment.href);
      setAttachments(attachmentData._embedded ? attachmentData._embedded.pettyCashDayClosingAttachments || [] : attachmentData);

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
    } finally {
      setLoading(false);
    }
  };



const getOrganizationAddressText = () => {
  if (!selectedOrganization?.address) return "";

  const { address, city, pincode } = selectedOrganization.address;

  return [address, city, pincode].filter(Boolean).join(", ");
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
    const selectedDate = filterForm.getFieldValue('closingDate')?.format("YYYY-MM-DD");;
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
        setError("No records found");
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
      formUtils.showErrorNotification("Failed to generate PDF");
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

  const selectedDate = filterForm.getFieldValue('closingDate')?.format("YYYY-MM-DD");
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



  function onValuesChange() {
    const formValues = filterForm.getFieldsValue();
    const closingDate = formValues.closingDate?.format("YYYY-MM-DD");
    const organizationId = formValues.organizationId;

    const org = organizations.find(
        (o) =>
            String(o.id || o._links?.self?.href?.split("/").pop()) === String(organizationId)
    );

    setSelectedOrganization(org || null);

    fetchReportData(closingDate, organizationId);
  }

  const cashDenominationRecords = convertDenominationsToRecords(records);


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

          <Form className="report-form"
                form={filterForm}
                layout={'inline'}
                onValuesChange={onValuesChange}>

            <Form.Item
                label={"Branch"}
                name={"organizationId"}
                size={'large'}
                rules={[{required: true, message: 'Please select an branch'}]}>
              <Select
                  placeholder="Select branch"
                  options={organizations.map((org) => ({label: org.name, value: org.id}))}
                  disabled={!isAdmin}
              />
            </Form.Item>


            <Form.Item
                label={'Select Date'}
                name={'closingDate'}
                size={'large'}
                rules={[{required: true, message: 'Please select a date'}]}
            >
              <DatePicker
                  maxDate={dayjs()}
                  format={DATE_DISPLAY_FORMAT}
              />
            </Form.Item>

            <Button
                icon={<FilePdfOutlined />}
                htmlType={'submit'}
                type="primary"
                onClick={handleGenerateReport}
                disabled={!filterForm.getFieldValue('closingDate') || !filterForm.getFieldValue('organizationId')}
            >
              Generate PDF
            </Button>
          </Form>

        {error &&
            <Alert title={error} className={'roles-alert'} type="error" showIcon/>}


        <Spin spinning={loading} tip="Loading day closing records, expenses, and handloans..." size={'large'}>
            <DayClosingSummaryCardsSection
              openingBalance={records.openingBalance}
              cashIn={records.cashIn}
              cashOut={records.cashOut}
              closingBalance={records.closingBalance}
            />

            {/* Attachments Section */}
            {attachments.length > 0 && (
              <div className={'report-section-container'}>
                <Typography.Title level={4} className={'report-section-title'}>
                  Attachments
                </Typography.Title>
                <Table
                    size={'large'}
                    dataSource={attachments}
                    styles={tableCustomStyles}
                    columns={[
                          {
                            title: 'Description',
                            dataIndex: 'description',
                            key: 'description',
                            render: (text) => <span>{text || 'General'}</span>,
                          }, {
                            title: 'File',
                            key: 'fileUrl',
                            render: (item) => {
                              if (item.imageData || item.fileUrl || item.file)
                                return <Button
                                    icon={<EyeOutlined/>}
                                    onClick={ () => {
                                      setModalFile(
                                          item.imageData || item.fileUrl || item.file
                                      )
                                    }}
                                >
                                  View
                                </Button>;
                              else  return "(No receipt)";
                            }
                      }]}
                    pagination={false}>
                </Table>
              </div>
            )}

            {/* Existing Expenses Section */}
            {(cashInExpenses.length > 0 || cashOutExpenses.length > 0) && (
              <div className={'expenses-section'}>

                  <div className={'report-section-container'}>
                    <Typography.Title level={4} className={'report-section-title'}  style={{ color: "green"}}>
                      Cash In Expenses
                    </Typography.Title>

                    <Table
                        size={'large'}
                        dataSource={cashInExpenses}
                        styles={tableCustomStyles}
                        columns={[
                          {
                            title: 'Amount',
                            dataIndex: 'amount',
                            key: 'amount',
                            render: (amount) => <span style={{color: "green"}}>{formatCurrency(amount)}</span>,
                          },
                          {
                            title: 'Description',
                            dataIndex: 'description',
                            key: 'description',
                            render: (text) => <span>{text || 'General'}</span>,
                          }, {
                            title: 'Type',
                            dataIndex: 'expenseSubType',
                            key: 'expenseSubType',
                            render: (text) => <span>{text || 'CASH-IN'}</span>,
                          }]}
                        pagination={false}>
                    </Table>
                  </div>
                  <div className={'report-section-container'}>
                    <Typography.Title level={4} className={'report-section-title'}  style={{ color: "red"}}>
                      Cash Out Expenses
                    </Typography.Title>
                    <Table
                        size={'large'}
                        dataSource={cashOutExpenses}
                        styles={tableCustomStyles}
                        scroll={{x: 'max-content', y: 55 * 5}}
                        columns={[
                          {
                            title: 'Amount',
                            dataIndex: 'amount',
                            key: 'amount',
                            render: (amount) => <span style={{color: "red"}}>{formatCurrency(amount)}</span>,
                          },
                          {
                            title: 'Description',
                            dataIndex: 'description',
                            key: 'description',
                            render: (text) => <span>{text || 'General'}</span>,
                          }, {
                            title: 'Type',
                            dataIndex: 'expenseSubType',
                            key: 'expenseSubType',
                            render: (text) => <span>{text || 'CASH-OUT'}</span>,
                          }]}
                        pagination={false}>
                    </Table>
                  </div>
              </div>
            )}
            {(cashDenominationRecords.length > 0) && (
                <div className={'report-section-container'}>
                  <Typography.Title level={4} className={'report-section-title'} >
                    Cash Denomination Summary
                  </Typography.Title>

                  <Table
                      size={'large'}
                      dataSource={cashDenominationRecords}
                      styles={tableCustomStyles}
                      scroll={{x: 'max-content', y: 55 * 5}}
                      columns={[
                        {
                          title: 'Denomination',
                          key: 'denomination',
                          dataIndex: 'denomination',
                        },
                        {
                          title: 'Good Notes',
                          dataIndex: 'goodNotes',
                          key: 'goodNotes'
                        }, {
                          title: 'Soiled Notes',
                          dataIndex: 'soiledNotes',
                          key: 'soiledNotes',
                        }, {
                          title: 'Amount',
                          dataIndex: 'amount',
                          key: 'amount',
                          render: (amount) => formatCurrency(amount),
                        }]}
                      pagination={false}
                      summary={(pageData) => {
                        let totalAmout = 0;
                        pageData.forEach(({ amount }) => {
                          totalAmout += amount;
                        });
                        return (
                            <>
                              <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={3}>
                                  <Typography.Title level={5}>Total</Typography.Title>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={1}>
                                  <Typography.Text bold type="success">{formatCurrency(totalAmout)}</Typography.Text>
                                </Table.Summary.Cell>
                              </Table.Summary.Row>
                            </>
                        );
                      }}

                  >
                  </Table>



              </div>
            )}
            {/* Hand Loans Section */}
            {allHandloansWithBalances.length > 0 && (
              <div className={'report-section-container'}>
                <Typography.Title level={4} className={'report-section-title'}>
                  Hand Loans Details
                </Typography.Title>

                <Table
                    size={'large'}
                    dataSource={allHandloansWithBalances}
                    styles={tableCustomStyles}
                    scroll={{x: 'max-content', y: 55 * 5}}
                    columns={[
                      {
                        title: 'Loan No',
                        dataIndex: 'handLoanNumber',
                        key: 'handLoanNumber'
                      },
                      {
                        title: 'Party',
                        dataIndex: 'partyName',
                        key: 'partyName'
                      }, {
                        title: 'Amount',
                        dataIndex: 'loanAmount',
                        key: 'loanAmount',
                        render: (text) => formatCurrency(text),
                      }, {
                        title: 'Narration',
                        dataIndex: 'narration',
                        key: 'narration',
                      }, {
                      title: 'Recovered Amount',
                      dataIndex: 'recoveredAmount',
                      key: 'recoveredAmount',
                      render: (text) => formatCurrency(text),
                      }, {
                      title: 'Balance Amount',
                      dataIndex: 'balanceAmount',
                      key: 'balanceAmount',
                        render: (text) => formatCurrency(text),
                      }, {
                        title: 'Status',
                        key: 'status',
                        render: (item) => {

                          const config = statusConfig[item.status] || {
                            label: item.status?.toUpperCase(),
                            color: '#6b7280',
                            bgColor: '#f3f4f6'
                          };
                          const {label, color} = config;

                          return (
                              <Tag color={color} key={item.status} variant={'solid'}>
                                {label}
                              </Tag>
                          );
                        },
                      },]}
                    pagination={false}>
                </Table>
              </div>
            )}
        </Spin>


          <Modal
              title="Day Closing PDF Report"
              centered
              open={pdfUrl}
              onOk={() => setPdfUrl(null)}
              onCancel={() => setPdfUrl(null)}
              width={1000}
              footer={[
                <Button onClick={() => setPdfUrl(null)}>Cancel</Button>,
                <Button
                    href={pdfUrl}
                    type={'primary'}
                    download={`DayClosingReport_${selectedDate}.pdf`}>Download PDF</Button>
              ]}
          >
            <iframe
                src={pdfUrl}
                title="Day Closing PDF Report"
                style={{
                  width: "100%",
                  height: "75vh",
                  border: "none"
                }}
            />
          </Modal>

          <Modal
              title="Receipt Preview"
              centered
              open={!!modalFile}
              width={1000}
              onCancel={() => setModalFile(null)}
              footer={[
                <Button onClick={() => setModalFile(null)}>Close</Button>,
              ]}
          >
            <img
                src={modalFile && modalFile.startsWith("data:image")
                    ? modalFile
                    : `data:image/png;base64,${modalFile}`
                }
                alt="Expense Receipt"
                className="list-preview-image"
            />
          </Modal>

        </div>
    </DefaultAppSidebarLayout>
  );
}