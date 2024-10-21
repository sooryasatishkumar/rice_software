import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Form.css';

const RiceEntryForm = ({ company, year }) => {
  const [formData, setFormData] = useState({
    date: '',
    godown: '',
    challanNo: '',
    lorryNo: '',
    variety: '',
    onbBags: '',
    ssBags: '',
    swpBags: '',
    tonsKgs: '',
    moisture: '',
    adNumber: '', // Optional
    adDate: '',   // Optional
    company: company,
    year: year,
    frk: '',
  });
  const [godowns, setGodowns] = useState([]);
  const [newGodown, setNewGodown] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchGodowns();

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

  const fetchGodowns = () => {
    axios.get('http://localhost:5000/api/rice-godowns')
      .then(response => {
        setGodowns(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the rice godowns!', error);
      });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNewGodownChange = (e) => {
    setNewGodown(e.target.value);
  };

  const handleAddGodown = () => {
    if (newGodown.trim() === "") {
      alert("Godown name cannot be empty!");
      return;
    }
    axios.post('http://localhost:5000/api/rice-godowns', { name: newGodown })
      .then(response => {
        setNewGodown('');
        fetchGodowns();
        alert('New godown added successfully!');
      })
      .catch(error => {
        if (error.response && error.response.status === 400) {
          alert(error.response.data.error);
        } else {
          console.error('There was an error adding the new rice godown!', error);
        }
      });
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleFetchDataForEdit = () => {
    const challanNo = formData.challanNo.trim();
    if (!challanNo) {
      alert("Please enter a Challan Number to edit.");
      return;
    }

    axios.get(`http://localhost:5000/api/rice?challanNo=${challanNo}&company=${company}&year=${year}`)
      .then(response => {
        if (response.data.length === 0) {
          alert('No entry found for this Challan Number.');
        } else {
          const data = response.data[0];

          setFormData({
            ...data,
            date: formatDateForInput(data.date),
            adDate: formatDateForInput(data.adDate),
            company: data.company,
            year: data.year,
          });

          setIsEditMode(true);
        }
      })
      .catch(error => {
        console.error('There was an error fetching the data for editing!', error);
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const formatDate = (dateString) => {
      if (!dateString) return null;
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${year}-${month}-${day}`;
    };

    const data = {
      ...formData,
      date: formatDate(formData.date),
      adDate: formatDate(formData.adDate),
    };

    if (isEditMode) {
      axios.put(`http://localhost:5000/api/rice/${formData.challanNo}`, data)
        .then(response => {
          alert('Data updated successfully!');
          setIsEditMode(false);
          setFormData({
            date: '',
            godown: '',
            challanNo: '',
            lorryNo: '',
            variety: '',
            onbBags: '',
            ssBags: '',
            swpBags: '',
            tonsKgs: '',
            moisture: '',
            adNumber: '',
            adDate: '',
            company: company,
            year: year,
            frk: '',
          });
        })
        .catch(error => {
          console.error('There was an error updating the form!', error);
        });
    } else {
      axios.post('http://localhost:5000/api/rice', data)
        .then(response => {
          alert('Data entered successfully!');
        })
        .catch(error => {
          if (error.response && error.response.status === 400) {
            alert(error.response.data.error);
          } else {
            console.error('There was an error submitting the form!', error);
          }
        });
    }
  };

  return (
    <div className="form-container">
      <h2>Rice Entry Form</h2>
      <form onSubmit={handleSubmit}>
        <label>Date:</label>
        <input type="date" name="date" value={formData.date} onChange={handleChange} required />

        <label>Godown:</label>
        <select name="godown" value={formData.godown} onChange={handleChange} required>
          <option value="">Select a godown</option>
          {godowns.map((godown, index) => (
            <option key={index} value={godown.name}>{godown.name}</option>
          ))}
        </select>

        <div>
          <label>Or Add New Godown:</label>
          <input
            type="text"
            value={newGodown}
            onChange={handleNewGodownChange}
            placeholder="Enter new godown name"
          />
          <button type="button" onClick={handleAddGodown}>Add Godown</button>
        </div>

        <label>Challan No:</label>
        <input type="text" name="challanNo" value={formData.challanNo} onChange={handleChange} required />
        <button type="button" onClick={handleFetchDataForEdit}>Edit</button>

        <label>Lorry No:</label>
        <input type="text" name="lorryNo" value={formData.lorryNo} onChange={handleChange} required />

        <label>Variety:</label>
        <select name="variety" value={formData.variety} onChange={handleChange} required>
          <option value="">Select a variety</option>
          <option value="BRA">BRA</option>
          <option value="BRC">BRC</option>
        </select>

        <label>Bags (ONB):</label>
        <input type="number" name="onbBags" value={formData.onbBags} onChange={handleChange} required />

        <label>Bags (SS):</label>
        <input type="number" name="ssBags" value={formData.ssBags} onChange={handleChange} required />

        <label>Bags (SWP):</label>
        <input type="number" name="swpBags" value={formData.swpBags} onChange={handleChange} required />

        <label>Tons/Kgs:</label>
        <input type="text" name="tonsKgs" value={formData.tonsKgs} onChange={handleChange} required />

        <label>FRK (Tons/Kgs):</label>
        <input type="text" name="frk" value={formData.frk} onChange={handleChange} required />

        <label>Moisture %:</label>
        <input type="text" name="moisture" value={formData.moisture} onChange={handleChange} required />

        <label>AD Number:</label>
        <input type="text" name="adNumber" value={formData.adNumber} onChange={handleChange} />

        <label>AD Date:</label>
        <input type="date" name="adDate" value={formData.adDate} onChange={handleChange} />

        <button type="submit">{isEditMode ? 'Update' : 'Submit'}</button>
      </form>
    </div>
  );
};

export default RiceEntryForm;
