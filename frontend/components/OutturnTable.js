import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Table.css';

const OutturnRegister = ({ company, year }) => {
  const [selectedOption, setSelectedOption] = useState('total');
  const [outturnData, setOutturnData] = useState([]);
  const navigate = useNavigate();

  const fetchOutturnData = useCallback(() => {
    if (!company || !year) {
      console.error('Company and year are required!');
      return;
    }

    let url;
    if (selectedOption === 'total') {
      url = `http://localhost:5000/api/outturn/?company=${company}&year=${year}`;
    } else if (selectedOption === 'a') {
      url = `http://localhost:5000/api/outturn/a?company=${company}&year=${year}`;
    } else if (selectedOption === 'c') {
      url = `http://localhost:5000/api/outturn/c?company=${company}&year=${year}`;
    }

    axios.get(url)
      .then(response => {
        console.log('Fetched data:', response.data);
        setOutturnData(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the outturn data!', error);
      });
  }, [selectedOption, company, year]);

  useEffect(() => {
    fetchOutturnData();
  }, [fetchOutturnData]);

  useEffect(() => {
    // Handle Escape key press to navigate back
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        navigate(-1);
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [navigate]);

  const handleOptionChange = (e) => {
    setSelectedOption(e.target.value);
  };

  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' };
    return new Intl.DateTimeFormat('en-GB', options).format(new Date(dateString));
  };

  const formatNumber = (value) => {
    return value !== null && value !== undefined ? value.toFixed(3) : '0.000';
  };

  return (
    <div className="table-container">
      <h2>Outturn Register</h2>
      <div>
        <label htmlFor="outturnSelect">Select Outturn Type:</label>
        <select id="outturnSelect" value={selectedOption} onChange={handleOptionChange}>
          <option value="total">Total Outturn</option>
          <option value="a">Outturn for A</option>
          <option value="c">Outturn for C</option>
        </select>
      </div>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Paddy Variety</th>
            <th>Paddy Bags</th>
            <th>Paddy Tons Kgs</th>
            <th>Progressive Paddy Bags</th>
            <th>Progressive Paddy Tons Kgs</th>
            <th>Rice Due Tons Kgs</th>
            <th>Progressive Rice Due Tons Kgs</th>
            <th>Rice Variety</th>
            <th>Ad No</th>
            <th>Rice Ad Bags</th>
            <th>Rice Ad Tons Kgs</th>
            <th>Progressive Rice Bags</th>
            <th>Progressive Rice Tons Kgs</th>
            <th>Total Balance Rice Due</th>
          </tr>
        </thead>
        <tbody>
          {outturnData.length === 0 ? (
            <tr>
              <td colSpan="15">No data available</td>
            </tr>
          ) : (
            outturnData.map((row, index) => (
              <tr key={index}>
                <td>{formatDate(row.date)}</td>
                <td>{row.paddy_variety}</td>
                <td>{row.paddy_bags}</td>
                <td>{formatNumber(row.paddy_tonsKgs)}</td>
                <td>{row.progPaddyBags}</td>
                <td>{formatNumber(row.progPaddyTonsKgs)}</td>
                <td>{formatNumber(row.rice_due_rpa || row.rice_due_rpc)}</td>
                <td>{formatNumber(row.progRiceDueTotal || row.progRiceDueRPA || row.progRiceDueRPC)}</td>
                <td>{row.rice_variety}</td>
                <td>{row.ad_no}</td>
                <td>{row.rice_bags}</td>
                <td>{formatNumber(row.rice_tonsKgs)}</td>
                <td>{formatNumber(row.progRiceBagsTotal || row.progRiceBagsBRA || row.progRiceBagsBRC)}</td>
                <td>{formatNumber(row.progRiceTonsKgsTotal || row.progRiceTonsKgsBRA || row.progRiceTonsKgsBRC)}</td>
                <td>{formatNumber(row.totalBalanceRiceDue)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default OutturnRegister;
