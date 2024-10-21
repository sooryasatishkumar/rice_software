import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import '../styles/Form.css';

const PaddyEntryForm = ({ company, year }) => {
  const [formData, setFormData] = useState({
    date: '',
    godown: '',
    issueMemoId: '',
    lorryNo: '',
    grade: '',
    moisture: '',
    onbBags: '',
    ssBags: '',
    swpBags: '',
    nbBags: '',
    tonsKgs: '',
    company: company,
    year: year
  });
  const [godowns, setGodowns] = useState([]);
  const [newGodown, setNewGodown] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    // Fetch existing paddy godowns
    axios.get('http://localhost:5000/api/paddy-godowns')
      .then(response => {
        setGodowns(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the paddy godowns!', error);
      });

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

  const handleNewGodownChange = (e) => {
    setNewGodown(e.target.value);
  };

  const handleAddGodown = () => {
    axios.post('http://localhost:5000/api/paddy-godowns', { name: newGodown })
      .then(response => {
        setGodowns([...godowns, { name: newGodown }]);
        setNewGodown('');
        alert('New godown added successfully!');
      })
      .catch(error => {
        if (error.response && error.response.status === 400) {
          alert(error.response.data.error);
        } else {
          console.error('There was an error adding the new paddy godown!', error);
        }
      });
  };

  const handleFetchDataForEdit = () => {
    const issueMemoId = formData.issueMemoId.trim();
    if (!issueMemoId) {
      alert("Please enter an Issue Memo ID to edit.");
      return;
    }

    axios.get(`http://localhost:5000/api/paddy?issueMemoId=${issueMemoId}&company=${company}&year=${year}`)
      .then(response => {
        if (response.data.length === 0) {
          alert('No entry found for this Issue Memo ID.');
        } else {
          const data = response.data[0];

          const formatDateForInput = (dateString) => {
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          };

          setFormData({
            ...data,
            date: formatDateForInput(data.date),
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
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
      const year = date.getFullYear();
      return `${year}-${month}-${day}`;
    };

    const data = {
      ...formData,
      date: formatDate(formData.date),
      company: company,  // Ensure company and year are included
      year: year,
    };

    if (isEditMode) {
      axios.put(`http://localhost:5000/api/paddy/${formData.issueMemoId}`, data)
        .then(response => {
          alert('Data updated successfully!');
          setIsEditMode(false);
          setFormData({
            date: '',
            godown: '',
            issueMemoId: '',
            lorryNo: '',
            grade: '',
            moisture: '',
            onbBags: '',
            ssBags: '',
            swpBags: '',
            nbBags: '',
            tonsKgs: '',
            company: company,
            year: year
          });
        })
        .catch(error => {
          console.error('There was an error updating the form!', error);
        });
    } else {
      axios.post('http://localhost:5000/api/paddy', data)
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
      <h2>Paddy Entry Form</h2>
      <form onSubmit={handleSubmit}>
        <label>Date:</label>
        <input type="date" name="date" value={formData.date} onChange={handleChange} required />

        <div className="godown-container">
          <label>Godown:</label>
          <select name="godown" value={formData.godown} onChange={handleChange} required>
            <option value="">Select a godown</option>
            {godowns.map((godown, index) => (
              <option key={index} value={godown.name}>{godown.name}</option>
            ))}
          </select>
        </div>

        <div className="add-godown-container">
          <input
            type="text"
            value={newGodown}
            onChange={handleNewGodownChange}
            placeholder="Enter new godown name"
          />
          <button type="button" onClick={handleAddGodown} className="add-godown-button">Add Godown</button>
        </div>

        <label>Issue Memo ID:</label>
        <input type="text" name="issueMemoId" value={formData.issueMemoId} onChange={handleChange} required />
        <button type="button" onClick={handleFetchDataForEdit}>Edit</button> {/* Add Edit button */}

        <label>Lorry No:</label>
        <input type="text" name="lorryNo" value={formData.lorryNo} onChange={handleChange} required />

        <label>Grade:</label>
        <select name="grade" value={formData.grade} onChange={handleChange} required>
          <option value="">Select a grade</option>
          <option value="RPA">RPA</option>
          <option value="RPC">RPC</option>
        </select>

        <label>Moisture %:</label>
        <input type="text" name="moisture" value={formData.moisture} onChange={handleChange} required />

        <label>Bags (ONB):</label>
        <input type="number" name="onbBags" value={formData.onbBags} onChange={handleChange} required />

        <label>Bags (SS):</label>
        <input type="number" name="ssBags" value={formData.ssBags} onChange={handleChange} required />

        <label>Bags (SWP):</label>
        <input type="number" name="swpBags" value={formData.swpBags} onChange={handleChange} required />

        <label>Bags (NB):</label>
        <input type="number" name="nbBags" value={formData.nbBags} onChange={handleChange} required />

        <label>Tons/Kgs:</label>
        <input type="text" name="tonsKgs" value={formData.tonsKgs} onChange={handleChange} required />

        <button type="submit">{isEditMode ? 'Update' : 'Submit'}</button>
      </form>
    </div>
  );
};

export default PaddyEntryForm;
