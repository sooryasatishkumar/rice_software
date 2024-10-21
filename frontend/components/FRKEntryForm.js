import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import '../styles/Form.css';

const FRKEntryForm = ({ company, year }) => {
  const [formData, setFormData] = useState({
    date: '',
    KGs: '',
    company: company,  // Automatically set from props
    year: year  // Automatically set from props
  });

  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    // Handle Escape key press to navigate back
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        navigate(-1); // Navigate back to the previous page
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const dataToSubmit = {
      ...formData,
      company, // Ensure company from props is used
      year     // Ensure year from props is used
    };

    axios.post('http://localhost:5000/api/frk', dataToSubmit)
      .then(response => {
        alert('FRK details entered successfully!');
        setFormData({
          date: '',
          KGs: '',
          company: company,  // Reset with the same company and year
          year: year  // Reset with the same company and year
        });
      })
      .catch(error => {
        console.error('There was an error submitting the form!', error);
      });
  };

  return (
    <div className="form-container">
      <h2>FRK Entry Form</h2>
      <form onSubmit={handleSubmit}>
        <label>Date:</label>
        <input type="date" name="date" value={formData.date} onChange={handleChange} required />

        <label>FRK Quantity (KGs):</label>
        <input type="number" name="KGs" value={formData.KGs} onChange={handleChange} required />

        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default FRKEntryForm;
