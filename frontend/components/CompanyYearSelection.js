import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Form.css';

const CompanyYearSelection = ({ setCompany, setYear }) => {
  const [selectedCompany, setSelectedCompany] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const company = newCompany || selectedCompany;
    setCompany(company);
    setYear(selectedYear);
    navigate('/home');
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        <label>Select Company:</label>
        <select onChange={(e) => setSelectedCompany(e.target.value)} required disabled={!!newCompany}>
          <option value="">Select a company</option>
          <option value="Yogambikai">Yogambikai</option>
          <option value="Sivakami">Sivakami</option>
        </select>

        <label>Select Year:</label>
        <select onChange={(e) => setSelectedYear(e.target.value)} required>
          <option value="">Select a year</option>
          <option value="2023">2023-2024</option>
          <option value="2024">2024-2025</option>
        </select>

        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default CompanyYearSelection;
