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
  // const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [inward, setInward] = useState('');
  const [outward, setOutward] = useState('');
  const [closingBalance, setClosingBalance] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  
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
  const [fileUploads, setFileUploads] = useState([]); // State for dynamic file uploads
  const [fileDescription, setFileDescription] = useState([]);

  // Handle file input change
  const handleFileChange = (index, event) => {
    const updatedFiles = [...fileUploads];
    updatedFiles[index] = event.target.files[0]; // Store the selected file
    setFileUploads(updatedFiles);
  };

   // Handle file description change
  const handleFileDescriptionChange = (index, desc) => {
    const description = [...fileDescription];    
    description[index] = desc; // Store the selected file
    console.log("description",desc);
    setFileDescription(description);
  };

  // Add a new file upload input
  const addFileUpload = () => {
    setFileUploads([...fileUploads, null]); // Add an empty file slot to the array
  };

  // Remove a file upload input
  const removeFileUpload = (index) => {
    const updatedFiles = fileUploads.filter((_, i) => i !== index); // Remove the file input by index
    const updatedDescriptions = fileDescription.filter((_, i) => i !== index);    
    setFileDescription(updatedDescriptions);
    setFileUploads(updatedFiles);
  };


  const getLocalDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };


  const [date, setDate] = useState(getLocalDate());

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
      const bearerToken = localStorage.getItem('token');
      const res = await fetch(`${APP_SERVER_URL_PREFIX}/petty-cash/day-closing/init?closingDate=${closingDate}&organizationId=${orgId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${bearerToken}` }
      });

      if (res.ok) {
        const data = await res.json();
        setInward(data.cashIn || '0');
        setOutward(data.cashOut || '0');
        setClosingBalance(data.closingBalance || '0');
        setOpeningBalance(data.openingBalance || '0');
      } else {
        setInward('');
        setOutward('');
        setClosingBalance('');
        setOpeningBalance('');
      }
    } catch (error) {
      console.error('Error fetching balance data:', error);
      setInward('');
      setOutward('');
      setClosingBalance('');
      setOpeningBalance('');
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
        openingBalance: openingBalance,
        cashIn: inward ? Number(inward) : 0,
        cashOut: outward ? Number(outward) : 0,
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
      const bearerToken = localStorage.getItem('token');

      const formData = new FormData();
      formData.append(
        "pettycashdayclosing",
        new Blob([JSON.stringify(payload)], { type: "application/json" })
      );
     
      fileUploads.forEach((file, idx) => {
        if (file) {
          formData.append(`files`, file);
          formData.append("fileDescriptions", fileDescription[idx] || "");
        }
      });
 
      const res = await fetch(`${APP_SERVER_URL_PREFIX}/petty-cash/day-closing`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${bearerToken}` },
        body: formData,
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
          <div className="form-section1">
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

              <div className="form-group">
                <label className="form-label">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  onChange={(e) => setComment(e.target.value)}
                  className="form-input textarea-input"
                  rows={4}
                  placeholder="Enter your comments here..."
                />
              </div>
            </div>
          </div>

          <div className="form-section1">
            <h3 className="section-title">Balance Summary</h3>
            <div className="balance-grid">
            <div className="balance-card">
                <label className="balance-label">Opening Balance</label>
                <input
                  type="number"
                  value={openingBalance}
                  className="balance-input"
                  min="0"
                  readOnly
                />
              </div>
              <div className="balance-card">
                <label className="balance-label">Inward</label>
                <input
                  type="number"
                  value={inward}
                  onChange={(e) => setInward(e.target.value)}
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
                  onChange={(e) => setOutward(e.target.value)}
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
                  onChange={(e) => setClosingBalance(e.target.value)}
                  className="balance-input"
                  min="0"
                  readOnly
                />
              </div>
            </div>
          </div>

          <div className="form-section1">
            <h3 className="section-title">Attachments </h3>
            <div className="form-section1">            
            <div className="file-uploads">
              {/* Dynamically render file upload inputs */}
              {fileUploads.map((file, index) => (
                <div key={index} className="file-upload-item">
                  <label>Upload Bills/Receipts</label>
                  <input
                    type="file"
                    name="fileUpload"
                    onChange={(e) => handleFileChange(index, e)}                   
                    accept="image/*,.pdf,.doc,.docx,.xlsx"
                  />
             
                <label>Description</label>
                <input                 
                  id={`fileDescriptions[${index}]`}
                  type="text"
                  name={`fileDescriptions[${index}]`}
                  value={fileDescription[index] || ''}
                  onChange={(e) => handleFileDescriptionChange(index, e.target.value)}
                  className="form-input"
                />
             
                  <button
                    type="button"
                    onClick={() => removeFileUpload(index)}
                    className="remove-file-btn"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addFileUpload}
              className="btn-primary1 add-file-btn"
            >
              Add File
            </button>
          </div>

          </div>

          <div className="form-section1">
            <h3 className="section-title">Add Denomination</h3>
            <div className="denomination-form">
              <div className="denomination-inputs">
                <div className="form-group">
                  <label className="form-label">Denomination</label>
                  <select
                    value={selectedDenomination}
                    onChange={(e) => setSelectedDenomination(e.target.value)}
                    className="form-select"
                  >
                    <option value="">Select denomination</option>
                    {availableDenominations.map((option) => (
                      <option
                        key={`${option.value}-${option.type}`}
                        value={option.value}
                      >
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
                    onChange={(e) => setGoodCount(e.target.value)}
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
                    onChange={(e) => setBadCount(e.target.value)}
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
                      {denominationEntries.map((entry) => (
                        <tr key={entry.id}>
                          <td className="denom-value">{entry.label}</td>
                          <td className="denom-type">{entry.type}</td>
                          <td>{entry.good}</td>
                          <td>{entry.bad}</td>
                          <td className="total-amount">
                            ₹{entry.totalAmount.toFixed(2)}
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => removeDenominationEntry(entry.id)}
                              className=""
                              style={{ color: "red" }}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="denomination-total">
                        <td colSpan="2">
                          <strong>Grand Total</strong>
                        </td>
                        <td>
                          <strong>Good: ₹{totalGood.toFixed(2)}</strong>
                        </td>
                        <td>
                          <strong>Bad: ₹{totalBad.toFixed(2)}</strong>
                        </td>
                        <td colSpan="2">
                          <strong>₹{totalAmount.toFixed(2)}</strong>
                        </td>
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

          <div className="form-actions1">
            <div>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                <span className="btn-icon">←</span>
                Back 
              </button>
            </div>
            <button
              className={`btn-primary ${loading ? "loading" : ""} ${
                balanceError ? "disabled" : ""
              }`}
              type="submit"
              disabled={
                loading || balanceError || denominationEntries.length === 0
              }
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Saving...
                </>
              ) : (
                " 💾 Save  "
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