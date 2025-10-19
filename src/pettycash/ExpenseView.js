import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar';
import PageCard from '../components/PageCard';
import { APP_SERVER_URL_PREFIX } from "../constants.js";
import '../payroll/Payroll.css';

function ExpenseView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${APP_SERVER_URL_PREFIX}/expenses/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((json) => setExpense(json))
      .catch(() => setError('Unable to load expense'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div>
      <Sidebar isOpen={true} />
      <PageCard title={expense ? `Expense ${expense.id || id}` : 'Expense Details'}>
        {loading && <div className="small">Loading...</div>}
        {error && <div style={{ color: '#c53030' }}>{error}</div>}

        {expense && (
          <div>
            <table className="payroll-table">
              <tbody>
                <tr>
                  <th>Description</th>
                  <td>{expense.description}</td>
                </tr>
                <tr>
                  <th>Amount</th>
                  <td>{expense.amount}</td>
                </tr>
                <tr>
                  <th>Employee ID</th>
                  <td>{expense.employeeId}</td>
                </tr>
                {expense.date && (
                  <tr>
                    <th>Date</th>
                    <td>{expense.date}</td>
                  </tr>
                )}
                {expense._links && (
                  <tr>
                    <th>Links</th>
                    <td>
                      {expense._links.self && <a href={expense._links.self.href}>Self</a>}{' '}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div style={{ marginTop: 12 }}>
              <button className="btn" onClick={() => navigate('/pettycash/expenses')}>Back</button>
            </div>
          </div>
        )}
      </PageCard>
    </div>
  );
}

export default ExpenseView;

